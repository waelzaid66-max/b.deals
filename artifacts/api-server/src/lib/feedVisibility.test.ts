import { describe, it, expect, afterAll } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { publicVisibilityConditions } from "./feedVisibility";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import { listings, users } from "@workspace/db/schema";

const uids: string[] = [];

describe("publicVisibilityConditions", () => {
  it("suppresses flagged listings and shadow-banned sellers from public surfaces", async () => {
    const cleanSeller = await createUser();
    const bannedSeller = await createUser({ isShadowBanned: true });
    uids.push(cleanSeller, bannedSeller);

    const cleanId = randomUUID();
    const flaggedId = randomUUID();
    const bannedId = randomUUID();
    await db.insert(listings).values([
      { id: cleanId, userId: cleanSeller, title: uniq("clean"), category: "car", basePriceCash: "100000", location: "Cairo" },
      { id: flaggedId, userId: cleanSeller, title: uniq("flagged"), category: "car", basePriceCash: "100000", location: "Cairo", isFlagged: true },
      { id: bannedId, userId: bannedSeller, title: uniq("banned"), category: "car", basePriceCash: "100000", location: "Cairo" },
    ]);

    const rows = await db
      .select({ id: listings.id })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .where(and(inArray(listings.id, [cleanId, flaggedId, bannedId]), ...publicVisibilityConditions()));

    const visible = rows.map((r) => r.id);
    expect(visible).toContain(cleanId);
    expect(visible).not.toContain(flaggedId);
    expect(visible).not.toContain(bannedId);
    expect(visible).toHaveLength(1);
  });
});

afterAll(async () => {
  if (uids.length) {
    await db.delete(listings).where(inArray(listings.userId, uids));
    await deleteUsers(...uids);
  }
});
