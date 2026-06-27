/**
 * Seed a handful of varied, REAL Arabic listings through the actual
 * createListing pipeline (taxonomy/location normalization, media verification,
 * quota, transactional insert) so they publish everywhere a real listing does:
 * the mobile home feed, search, the SEO pages, AND the Admin Control Center
 * ("BANCO Control") Listings / Moderation surfaces — where they can later be
 * archived, flagged or removed.
 *
 * Listings are grouped under two recognizable demo owners so they are easy to
 * find and manage, and so each owner keeps its own anti-spam rate budget
 * (createListing caps listings-per-hour per user):
 *   • "بانكو ديمو"          — sale ads (cars, real-estate, industrial)
 *   • "بانكو ديمو (طلبات)"   — buy / wanted requests
 *
 * Idempotent per owner: if an owner already has listings the script prints them
 * and skips that group, so it is safe to re-run.
 *
 * Run: pnpm --filter @workspace/api-server exec tsx scripts/seedDemoListings.ts
 */
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { users, listings, locations } from "@workspace/db/schema";
import { createListing } from "../src/services/ListingService";
import { cleanText } from "../src/services/NormalizationService";

type Draft = Parameters<typeof createListing>[0];
type Role = "individual" | "dealer";

async function ensureOwnerId(clerkId: string, name: string, role: Role): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(users)
    .values({ clerkId, name, role })
    .returning({ id: users.id });
  return created.id;
}

async function seedGroup(
  label: string,
  clerkId: string,
  name: string,
  role: Role,
  drafts: Draft[],
): Promise<{ missing: number }> {
  const ownerId = await ensureOwnerId(clerkId, name, role);
  const owned = await db
    .select({ title: listings.title })
    .from(listings)
    .where(eq(listings.userId, ownerId));
  // Match on the normalized title (createListing stores cleanText(title)) so a
  // re-run seeds only the drafts that are genuinely missing — a partial earlier
  // run must NOT permanently block the remaining ones.
  const have = new Set(owned.map((l) => l.title));
  let created = 0;
  let existing = 0;
  let failed = 0;
  for (const d of drafts) {
    if (have.has(cleanText(d.title))) {
      existing += 1;
      console.log(`[seed] ${label}: exists   ${d.title}`);
      continue;
    }
    try {
      const { id } = await createListing(d, clerkId);
      created += 1;
      console.log(`[seed] ${label}: created  ${id}  ${d.title}`);
    } catch (e) {
      failed += 1;
      console.error(`[seed] ${label}: FAILED   ${d.title}: ${(e as Error).message}`);
    }
  }
  const missing = drafts.length - created - existing;
  console.log(
    `[seed] ${label}: target=${drafts.length} created=${created} existing=${existing} failed=${failed}.`,
  );
  return { missing };
}

async function main(): Promise<void> {
  // Real seeded locations so strict normalization always resolves them.
  const locs = await db
    .select({ area: locations.area, city: locations.city })
    .from(locations)
    .limit(8);
  const at = (i: number): string =>
    locs.length === 0 ? "Cairo" : locs[i % locs.length].area ?? locs[i % locs.length].city ?? "Cairo";
  const img = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

  const saleDrafts: Draft[] = [
    {
      title: "تويوتا كورولا 2020 للبيع - حالة ممتازة",
      description:
        "سيارة تويوتا كورولا موديل 2020، فابريكا بالكامل، صيانات بالتوكيل، ماشية 45 ألف كيلو فقط، أول مالك.",
      category: "car",
      base_price_cash: 850000,
      location: at(0),
      specs: { mileage: 45000, condition: "مستعمل", year: 2020 },
      media: [{ type: "image", url: img("1494976388531-d1058494cdd8"), is_thumbnail: true }],
      payment_options: [
        { mode: "cash" },
        { mode: "seller_installment", down_payment: 250000, monthly_payment: 15000, duration_months: 48 },
      ],
    },
    {
      title: "هيونداي إلنترا 2024 جديدة - زيرو",
      description:
        "هيونداي إلنترا موديل 2024 جديدة لم تُستخدم، استلام فوري، ضمان الوكيل، أعلى فئة.",
      category: "car",
      base_price_cash: 1350000,
      location: at(1),
      specs: { mileage: 0, condition: "جديد" },
      media: [{ type: "image", url: img("1552519507-da3b142c6e3d"), is_thumbnail: true }],
      payment_options: [{ mode: "cash" }],
    },
    {
      title: "شقة 165 متر للبيع - تشطيب سوبر لوكس",
      description:
        "شقة 165 متر، 3 غرف وريسبشن، تشطيب سوبر لوكس، استلام فوري، موقع مميز قريب من الخدمات.",
      category: "real_estate",
      base_price_cash: 3200000,
      location: at(2),
      specs: { area: 165, rooms: 3 },
      media: [{ type: "image", url: img("1545324418-cc1a3fa10c00"), is_thumbnail: true }],
      payment_options: [{ mode: "cash" }, { mode: "bank_finance" }],
    },
    {
      title: "خط إنتاج وتعبئة صناعي - حالة جيدة",
      description:
        "خط إنتاج وتعبئة للمصانع، إنتاجية عالية، مناسب لمصانع الأغذية والمواد، صيانة دورية.",
      category: "industrial",
      base_price_cash: 750000,
      location: at(3),
      specs: { capacity: "5 طن/ساعة" },
      media: [{ type: "image", url: img("1565793298595-6a879b1d9492"), is_thumbnail: true }],
      payment_options: [{ mode: "cash" }],
    },
  ];

  const requestDrafts: Draft[] = [
    {
      title: "مطلوب سيارة عائلية نظيفة موديل حديث",
      description:
        "مطلوب سيارة عائلية سيدان أو SUV، موديل 2018 أو أحدث، حالة ممتازة وفابريكا، الدفع كاش فوري.",
      category: "car",
      is_request: true,
      location: at(4),
      specs: { mileage: 0, condition: "مستعمل" },
      media: [{ type: "image", url: img("1503376780353-7e6692767b70"), is_thumbnail: true }],
      // createListing reads payment_options.length; the controller/schema default
      // this to [] for us, but this script calls the service directly, so set it.
      payment_options: [],
    },
  ];

  const a = await seedGroup("sale", "demo-banco-seller", "بانكو ديمو", "dealer", saleDrafts);
  const b = await seedGroup("request", "demo-banco-buyer", "بانكو ديمو (طلبات)", "individual", requestDrafts);
  const missing = a.missing + b.missing;
  if (missing > 0) {
    // Honesty: never exit 0 with demo data missing.
    throw new Error(`${missing} demo listing(s) still missing — see FAILED lines above.`);
  }
  console.log("[seed] all demo listings present.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
