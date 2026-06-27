import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// Mock the auth provider BEFORE importing the service under test. deleteAccount
// removes the user from Clerk as its final, non-transactional step; we never
// want to hit the real Clerk API from a test, and we need to observe WHEN that
// call happens relative to the local DB transaction.
vi.mock("@clerk/express", () => ({
  clerkClient: { users: { deleteUser: vi.fn() } },
}));

import { clerkClient } from "@clerk/express";
import { eq, inArray } from "drizzle-orm";
import { deleteAccount } from "./UserService";
import { db, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import {
  users,
  listings,
  leadHistory,
  savedListings,
  userBehavior,
} from "@workspace/db/schema";

const deleteUserMock = vi.mocked(clerkClient.users.deleteUser);

const uids: string[] = [];

/**
 * Insert a fully-populated user (every PII field set) plus a personal-data
 * footprint: a lead with the user recorded as buyer (PII captured), a saved
 * listing and a behavior row. Returns the ids needed to make assertions.
 */
async function seedUserWithFootprint(): Promise<{
  userId: string;
  clerkId: string;
  sellerId: string;
  listingId: string;
  leadId: string;
  savedId: string;
  behaviorId: string;
}> {
  const clerkId = uniq("clerk");
  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    clerkId,
    name: "Real Name",
    email: `${uniq("buyer")}@example.com`,
    phone: uniq("phone"),
    role: "dealer",
    isVerified: true,
    companyDetails: {
      activity_type: "car_dealer",
      business_name: "Acme Motors",
      city: "Cairo",
    },
  });
  uids.push(userId);

  // A separate seller owns the listing the lead/save/behavior point at.
  const sellerId = randomUUID();
  await db.insert(users).values({
    id: sellerId,
    clerkId: uniq("clerk"),
    name: "Seller",
    role: "dealer",
  });
  uids.push(sellerId);

  const listingId = randomUUID();
  await db.insert(listings).values({
    id: listingId,
    userId: sellerId,
    title: uniq("listing"),
    category: "car",
    basePriceCash: "500000",
    location: "Cairo",
  });

  const [lead] = await db
    .insert(leadHistory)
    .values({
      listingId,
      buyerId: userId,
      sellerId,
      actionType: "whatsapp",
      buyerName: "Real Name",
      buyerPhone: uniq("leadphone"),
    })
    .returning({ id: leadHistory.id });

  const [saved] = await db
    .insert(savedListings)
    .values({ userId, listingId })
    .returning({ id: savedListings.id });

  const [behavior] = await db
    .insert(userBehavior)
    .values({ userId, listingId, action: "view" })
    .returning({ id: userBehavior.id });

  return {
    userId,
    clerkId,
    sellerId,
    listingId,
    leadId: lead.id,
    savedId: saved.id,
    behaviorId: behavior.id,
  };
}

beforeEach(() => {
  deleteUserMock.mockReset();
  deleteUserMock.mockResolvedValue(undefined as never);
});

describe("deleteAccount", () => {
  it("anonymizes the user, wipes lead PII + personal data, then deletes from Clerk", async () => {
    const f = await seedUserWithFootprint();

    // Capture the local DB state at the moment Clerk deletion is invoked, to
    // prove the auth-provider call happens AFTER the transaction has committed.
    let stateAtClerkCall: {
      deletedAt: Date | null;
      email: string | null;
    } | null = null;
    deleteUserMock.mockImplementation(async () => {
      const [row] = await db
        .select({ deletedAt: users.deletedAt, email: users.email })
        .from(users)
        .where(eq(users.id, f.userId))
        .limit(1);
      stateAtClerkCall = row ?? null;
      return undefined as never;
    });

    const result = await deleteAccount(f.clerkId);
    expect(result).toEqual({ deleted: true });

    // User record anonymized + PII stripped + soft-deleted.
    const [user] = await db.select().from(users).where(eq(users.id, f.userId));
    expect(user.name).toBe("Deleted User");
    expect(user.email).toBeNull();
    expect(user.phone).toBeNull();
    expect(user.companyDetails).toBeNull();
    expect(user.isVerified).toBe(false);
    expect(user.deletedAt).toBeInstanceOf(Date);

    // Buyer-side lead PII wiped, but the lead row itself is kept (seller
    // reference stays intact).
    const [lead] = await db
      .select()
      .from(leadHistory)
      .where(eq(leadHistory.id, f.leadId));
    expect(lead).toBeDefined();
    expect(lead.buyerName).toBeNull();
    expect(lead.buyerPhone).toBeNull();

    // Personal collections / behavior history removed entirely.
    const saves = await db
      .select()
      .from(savedListings)
      .where(eq(savedListings.userId, f.userId));
    expect(saves).toHaveLength(0);
    const behavior = await db
      .select()
      .from(userBehavior)
      .where(eq(userBehavior.userId, f.userId));
    expect(behavior).toHaveLength(0);

    // Clerk deletion called exactly once, with the user's clerkId, and ONLY
    // after the local transaction committed (the snapshot taken inside the
    // Clerk call already shows the anonymized, soft-deleted record).
    expect(deleteUserMock).toHaveBeenCalledTimes(1);
    expect(deleteUserMock).toHaveBeenCalledWith(f.clerkId);
    expect(stateAtClerkCall).not.toBeNull();
    expect(stateAtClerkCall!.email).toBeNull();
    expect(stateAtClerkCall!.deletedAt).toBeInstanceOf(Date);
  });

  it("throws NOT_FOUND and never touches Clerk for an unknown user", async () => {
    await expect(deleteAccount(uniq("missing-clerk"))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("throws AUTH_PROVIDER_ERROR but keeps local data anonymized when Clerk deletion fails", async () => {
    const f = await seedUserWithFootprint();
    deleteUserMock.mockRejectedValue(new Error("clerk down"));

    await expect(deleteAccount(f.clerkId)).rejects.toMatchObject({
      code: "AUTH_PROVIDER_ERROR",
    });

    // The privacy obligation (local wipe) must already be durable even though
    // the auth-provider step failed.
    const [user] = await db.select().from(users).where(eq(users.id, f.userId));
    expect(user.name).toBe("Deleted User");
    expect(user.email).toBeNull();
    expect(user.phone).toBeNull();
    expect(user.companyDetails).toBeNull();
    expect(user.deletedAt).toBeInstanceOf(Date);

    const saves = await db
      .select()
      .from(savedListings)
      .where(eq(savedListings.userId, f.userId));
    expect(saves).toHaveLength(0);
  });
});

afterAll(async () => {
  if (uids.length) {
    // listings cascade → lead_history (by listingId) + saved_listings (by
    // listingId) + user_behavior (by listingId). Drop them first, then the
    // non-cascading behavior rows, then the users themselves.
    await db.delete(listings).where(inArray(listings.userId, uids));
    await db.delete(userBehavior).where(inArray(userBehavior.userId, uids));
    await db.delete(savedListings).where(inArray(savedListings.userId, uids));
    await db.delete(leadHistory).where(inArray(leadHistory.sellerId, uids));
    await deleteUsers(...uids);
  }
});
