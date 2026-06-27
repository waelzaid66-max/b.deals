import { db } from "@workspace/db";
import {
  conversations,
  messages,
  listings,
  listingMedia,
  users,
} from "@workspace/db/schema";
import { and, eq, or, desc, asc, ne, isNull, inArray, sql } from "drizzle-orm";
import { createNotification } from "./NotificationService";
import { checkMessageRate, checkConversationRate } from "./AbuseService";
import { publicVisibilityConditions } from "../lib/feedVisibility";
import { ObjectStorageService } from "../lib/objectStorage";

const objectStorageService = new ObjectStorageService();

type CodedError = Error & { code?: string };
function codedError(code: string, message: string): CodedError {
  return Object.assign(new Error(message), { code });
}

export interface ConversationSummaryDTO {
  id: string;
  listing_id: string;
  listing_title: string | null;
  listing_thumb: string | null;
  counterparty_id: string;
  counterparty_name: string;
  last_message_text: string | null;
  last_message_at: string | null;
  unread: number;
  viewer_role: "buyer" | "seller";
}

export interface MessageDTO {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_mine: boolean;
  created_at: string;
  read_at: string | null;
  media_url: string | null;
}

async function getUserId(clerkId: string): Promise<string> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw codedError("UNAUTHORIZED", "User not found");
  return user.id;
}

/** Best single thumbnail per listing: prefer the flagged thumbnail, then lowest sort order. */
async function getThumbs(listingIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (listingIds.length === 0) return map;
  const media = await db
    .select({
      listingId: listingMedia.listingId,
      url: listingMedia.url,
      thumbnailUrl: listingMedia.thumbnailUrl,
    })
    .from(listingMedia)
    .where(inArray(listingMedia.listingId, listingIds))
    .orderBy(desc(listingMedia.isThumbnail), asc(listingMedia.sortOrder));
  for (const m of media) {
    if (!map.has(m.listingId)) {
      const t = m.thumbnailUrl ?? m.url;
      if (t) map.set(m.listingId, t);
    }
  }
  return map;
}

async function loadParticipantConversation(conversationId: string, userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conv) throw codedError("NOT_FOUND", "Conversation not found");
  if (conv.buyerId !== userId && conv.sellerId !== userId) {
    throw codedError("UNAUTHORIZED", "Not a participant in this conversation");
  }
  return conv;
}

/**
 * Start a conversation on a listing, or return the existing one. The buyer is
 * the caller; the seller is the listing owner. The (listing, buyer, seller)
 * tuple is unique, so repeat calls are idempotent.
 */
export async function createConversation(
  clerkId: string,
  listingId: string,
  ip?: string
): Promise<ConversationSummaryDTO> {
  const buyerId = await getUserId(clerkId);

  // Conversation-creation rate cap: prevents bulk thread-opening spam directed
  // at sellers. This is a convenience-path guard (fails open on counter outage)
  // layered on top of the listing-visibility gate below, which is the real
  // authorization boundary.
  const rateCheck = await checkConversationRate({ userId: buyerId, ip });
  if (!rateCheck.ok) {
    throw codedError("RATE_LIMITED", "Too many conversations opened, please slow down");
  }

  // Listing-visibility gate: a new buyer thread may only be started on a
  // listing that is currently publicly contactable — active, not abuse-flagged,
  // and owned by a seller who is not shadow-banned. This mirrors the feed/detail
  // visibility gate so a known listing UUID cannot be used to message the seller
  // of withdrawn, flagged, or shadow-banned inventory (authorization bypass via
  // UUID harvesting). Existing threads stay readable via the inbox
  // (loadParticipantConversation), which is unaffected.
  const [listing] = await db
    .select({ id: listings.id, title: listings.title, sellerId: listings.userId })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "active"),
        ...publicVisibilityConditions()
      )
    )
    .limit(1);
  if (!listing) throw codedError("NOT_FOUND", "Listing not found");

  const sellerId = listing.sellerId;
  if (!sellerId) throw codedError("INVALID_DATA", "This listing has no owner to message");
  if (sellerId === buyerId) {
    throw codedError("INVALID_DATA", "You cannot message your own listing");
  }

  await db
    .insert(conversations)
    .values({ listingId, buyerId, sellerId })
    .onConflictDoNothing();

  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.listingId, listingId),
        eq(conversations.buyerId, buyerId),
        eq(conversations.sellerId, sellerId)
      )
    )
    .limit(1);

  // Re-opening a thread the buyer had hidden brings it back into their inbox.
  if (conv.buyerDeletedAt) {
    await db
      .update(conversations)
      .set({ buyerDeletedAt: null })
      .where(eq(conversations.id, conv.id));
  }

  const [seller] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, sellerId))
    .limit(1);

  const thumbMap = await getThumbs([listingId]);

  return {
    id: conv.id,
    listing_id: listingId,
    listing_title: listing.title ?? null,
    listing_thumb: thumbMap.get(listingId) ?? null,
    counterparty_id: sellerId,
    counterparty_name: seller?.name ?? "Unknown",
    last_message_text: conv.lastMessageText ?? null,
    last_message_at: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
    unread: conv.buyerUnread ?? 0,
    viewer_role: "buyer",
  };
}

export async function listConversations(
  clerkId: string
): Promise<ConversationSummaryDTO[]> {
  const userId = await getUserId(clerkId);

  const rows = await db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      lastMessageText: conversations.lastMessageText,
      lastMessageAt: conversations.lastMessageAt,
      buyerUnread: conversations.buyerUnread,
      sellerUnread: conversations.sellerUnread,
      createdAt: conversations.createdAt,
      listingTitle: listings.title,
    })
    .from(conversations)
    .leftJoin(listings, eq(conversations.listingId, listings.id))
    // Per-participant hide: a thread the viewer "deleted" is filtered out for
    // them only, while the counterparty still sees it.
    .where(
      or(
        and(eq(conversations.buyerId, userId), isNull(conversations.buyerDeletedAt)),
        and(eq(conversations.sellerId, userId), isNull(conversations.sellerDeletedAt))
      )
    )
    .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt));

  if (rows.length === 0) return [];

  const counterpartyIds = Array.from(
    new Set(rows.map((r) => (r.buyerId === userId ? r.sellerId : r.buyerId)))
  );
  const nameRows = counterpartyIds.length
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, counterpartyIds))
    : [];
  const nameMap = new Map(nameRows.map((n) => [n.id, n.name]));

  const listingIds = Array.from(new Set(rows.map((r) => r.listingId)));
  const thumbMap = await getThumbs(listingIds);

  return rows.map((r) => {
    const isBuyer = r.buyerId === userId;
    const cpId = isBuyer ? r.sellerId : r.buyerId;
    return {
      id: r.id,
      listing_id: r.listingId,
      listing_title: r.listingTitle ?? null,
      listing_thumb: thumbMap.get(r.listingId) ?? null,
      counterparty_id: cpId,
      counterparty_name: nameMap.get(cpId) ?? "Unknown",
      last_message_text: r.lastMessageText ?? null,
      last_message_at: r.lastMessageAt ? r.lastMessageAt.toISOString() : null,
      unread: isBuyer ? r.buyerUnread ?? 0 : r.sellerUnread ?? 0,
      viewer_role: isBuyer ? "buyer" : "seller",
    };
  });
}

export async function getMessages(
  clerkId: string,
  conversationId: string
): Promise<MessageDTO[]> {
  const userId = await getUserId(clerkId);
  await loadParticipantConversation(conversationId, userId);

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return rows.map((m) => ({
    id: m.id,
    conversation_id: m.conversationId,
    sender_id: m.senderId,
    body: m.body,
    is_mine: m.senderId === userId,
    created_at: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
    read_at: m.readAt ? m.readAt.toISOString() : null,
    media_url: m.mediaUrl ?? null,
  }));
}

export async function sendMessage(
  clerkId: string,
  conversationId: string,
  body: string,
  mediaUrl?: string | null
): Promise<MessageDTO> {
  const userId = await getUserId(clerkId);
  const conv = await loadParticipantConversation(conversationId, userId);

  const text = body.trim();
  if (!text && !mediaUrl) {
    throw codedError("INVALID_DATA", "Message must contain text or an image");
  }

  // Anti-spam: cap how fast a single user can fire messages. A block is surfaced
  // as a 429 by the route layer; the attempt is audited inside AbuseService.
  const rate = await checkMessageRate({ userId });
  if (!rate.ok) throw codedError("RATE_LIMITED", "Too many messages, please slow down");

  const isBuyer = conv.buyerId === userId;
  const recipientId = isBuyer ? conv.sellerId : conv.buyerId;

  const [msg] = await db
    .insert(messages)
    .values({ conversationId, senderId: userId, body: text, mediaUrl: mediaUrl ?? null })
    .returning();

  // Promote an attached image to public ACL so the recipient's client can load
  // it from the ACL-gated serve handler (mobile <Image> sends no bearer token).
  // Best-effort: promoteServingUrlToPublic swallows failures and no-ops URLs
  // that aren't our own first-party uploads.
  if (msg.mediaUrl) {
    await objectStorageService.promoteServingUrlToPublic(msg.mediaUrl, userId);
  }

  // Inbox preview: the text, or a camera glyph for an image-only message.
  const preview = text || "📷";
  const now = new Date();
  await db
    .update(conversations)
    .set({
      lastMessageText: preview,
      lastMessageAt: now,
      // A new message un-hides the thread for whoever had deleted it.
      buyerDeletedAt: null,
      sellerDeletedAt: null,
      ...(isBuyer
        ? { sellerUnread: sql`${conversations.sellerUnread} + 1` }
        : { buyerUnread: sql`${conversations.buyerUnread} + 1` }),
    })
    .where(eq(conversations.id, conversationId));

  const [sender] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await createNotification({
    userId: recipientId,
    type: "message",
    title: sender?.name ?? "New message",
    body: preview.length > 80 ? `${preview.slice(0, 79)}…` : preview,
    data: { conversation_id: conversationId, listing_id: conv.listingId },
  });

  return {
    id: msg.id,
    conversation_id: conversationId,
    sender_id: userId,
    body: msg.body,
    is_mine: true,
    created_at: msg.createdAt ? msg.createdAt.toISOString() : now.toISOString(),
    read_at: null,
    media_url: msg.mediaUrl ?? null,
  };
}

export async function markConversationRead(
  clerkId: string,
  conversationId: string
): Promise<{ read: boolean }> {
  const userId = await getUserId(clerkId);
  const conv = await loadParticipantConversation(conversationId, userId);
  const isBuyer = conv.buyerId === userId;

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, userId),
        isNull(messages.readAt)
      )
    );

  await db
    .update(conversations)
    .set(isBuyer ? { buyerUnread: 0 } : { sellerUnread: 0 })
    .where(eq(conversations.id, conversationId));

  return { read: true };
}

/**
 * Soft-hide a conversation for the requesting participant only. The thread stays
 * visible for the counterparty, and any future message clears both flags so it
 * reappears for whoever had hidden it (see sendMessage).
 */
export async function deleteConversation(
  clerkId: string,
  conversationId: string
): Promise<{ deleted: boolean }> {
  const userId = await getUserId(clerkId);
  const conv = await loadParticipantConversation(conversationId, userId);
  const isBuyer = conv.buyerId === userId;

  await db
    .update(conversations)
    .set(isBuyer ? { buyerDeletedAt: new Date() } : { sellerDeletedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return { deleted: true };
}
