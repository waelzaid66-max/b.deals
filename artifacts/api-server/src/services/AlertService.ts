import { db } from "@workspace/db";
import { savedSearches } from "@workspace/db/schema";
import { and, eq, ne, or, isNull, lte, gte } from "drizzle-orm";
import { createNotification } from "./NotificationService";
import { getSaverUserIds } from "./SaveService";

/**
 * AlertService — best-effort, non-blocking dispatch of the two demand-side
 * alerts. Both functions never throw into the caller's request path (the
 * originating action — creating or repricing a listing — must always succeed).
 * createNotification itself already respects per-category mute, so muted users
 * are filtered there.
 */

// Anti-storm: a single saved search is alerted at most once per window, so a
// dealer bulk-publishing inventory can't flood a saver with notifications.
const NEW_MATCH_COOLDOWN_MS = 10 * 60_000;

/**
 * Notify owners of alerts-enabled saved searches whose criteria match a newly
 * created listing. Matching is conservative and REAL: category (when set),
 * price range (when set), and an optional free-text term against the title.
 * Never alerts the seller about their own listing.
 */
export async function notifyNewMatch(listing: {
  id: string;
  category: "car" | "real_estate" | "industrial";
  price: number;
  title: string;
  sellerId: string;
}): Promise<void> {
  try {
    const candidates = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.alertsEnabled, true),
          ne(savedSearches.userId, listing.sellerId),
          or(isNull(savedSearches.category), eq(savedSearches.category, listing.category)),
          or(isNull(savedSearches.priceMin), lte(savedSearches.priceMin, String(listing.price))),
          or(isNull(savedSearches.priceMax), gte(savedSearches.priceMax, String(listing.price))),
        ),
      );

    const now = Date.now();
    const titleLower = listing.title.toLowerCase();

    for (const search of candidates) {
      // Free-text term (if any) must appear in the listing title.
      if (search.query && !titleLower.includes(search.query.trim().toLowerCase())) continue;

      // Per-search cooldown to prevent notification storms.
      const last = search.lastNotifiedListingAt ? search.lastNotifiedListingAt.getTime() : 0;
      if (now - last < NEW_MATCH_COOLDOWN_MS) continue;

      await createNotification({
        userId: search.userId,
        type: "new_match",
        title: "New match for your saved search",
        body: `A new listing matches "${search.name}"`,
        data: { listing_id: listing.id, saved_search_id: search.id },
      });

      await db
        .update(savedSearches)
        .set({ lastNotifiedListingAt: new Date() })
        .where(eq(savedSearches.id, search.id));
    }
  } catch (err) {
    console.error("[Alert new_match]", err);
  }
}

/**
 * Notify every user who saved a listing that its cash price dropped. Real
 * numbers only — old/new price come straight from the update path.
 */
export async function notifyPriceDrop(listing: {
  id: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  sellerId: string;
}): Promise<void> {
  try {
    const saverIds = await getSaverUserIds(listing.id);
    for (const userId of saverIds) {
      if (userId === listing.sellerId) continue;
      await createNotification({
        userId,
        type: "price_drop",
        title: "Price drop on a saved listing",
        body: `"${listing.title}" dropped in price`,
        data: {
          listing_id: listing.id,
          old_price: listing.oldPrice,
          new_price: listing.newPrice,
        },
      });
    }
  } catch (err) {
    console.error("[Alert price_drop]", err);
  }
}
