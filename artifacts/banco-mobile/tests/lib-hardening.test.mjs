// Production-hardening regression guards for rental host + notification deep-links.
// Zero-dependency (node:test). Run with:
//   pnpm --filter @workspace/banco-mobile run test:lib

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.dirname(__dirname);

const RENTAL_HOST = path.join(APP_ROOT, "lib", "rentalHost.ts");
const NOTIF_ROUTING = path.join(APP_ROOT, "lib", "notificationRouting.ts");
const PROFILE = path.join(APP_ROOT, "app", "(tabs)", "profile.tsx");
const LAYOUT = path.join(APP_ROOT, "app", "_layout.tsx");

test("rentalHost treats is_bookable === true as bookable", () => {
  const src = fs.readFileSync(RENTAL_HOST, "utf8");
  assert.match(
    src,
    /is_bookable\s*===\s*true/,
    "rentalHost must gate on is_bookable === true (furnished daily marketplace only)",
  );
  assert.match(
    src,
    /filterBookableListings/,
    "rentalHost must export filterBookableListings for profile hub visibility",
  );
});

test("booking notifications route hosts to /bookings?role=host", () => {
  const src = fs.readFileSync(NOTIF_ROUTING, "utf8");
  assert.match(
    src,
    /type\s*===\s*["']booking["'][\s\S]*pathname:\s*["']\/bookings["'][\s\S]*role:\s*["']host["']/,
    "booking notifications must deep-link to host booking inbox",
  );
});

test("payment and subscription notifications route to billing hub", () => {
  const src = fs.readFileSync(NOTIF_ROUTING, "utf8");
  assert.match(src, /payment_success/, "payment_success type must be handled");
  assert.match(src, /payment_failed/, "payment_failed must route to billing hub");
  assert.match(src, /subscription_expiring/, "subscription_expiring must be handled");
  assert.match(
    src,
    /return\s+["']\/billing["']\s+as\s+Href/,
    "billing-related notifications must open /billing full page",
  );
});

test("rental hub is a registered stack route", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  assert.match(layout, /name="rentals\/hub"/, "rentals/hub must be in root stack");
  const profile = fs.readFileSync(PROFILE, "utf8");
  assert.match(profile, /\/rentals\/hub/, "profile menu must link to rental hub");
});

test("profile Payments menu opens billing hub (wallet remains linked inside)", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(
    src,
    /profile\.menuWallet[\s\S]*router\.push\(\s*["']\/billing["']\s+as\s+Href\s*\)/,
    "profile Payments entry must open /billing without removing /wallet screen",
  );
});

test("billing, wallet, and invoices are registered stack routes", () => {
  const src = fs.readFileSync(LAYOUT, "utf8");
  const routes = ["billing", "wallet", "invoices", "invoices/[id]"];
  for (const route of routes) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      src,
      new RegExp(`name="${escaped}"`),
      `_layout.tsx must register Stack.Screen for ${route}`,
    );
  }
});

test("billing hub exposes monthly CSV export", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "app", "billing.tsx"), "utf8");
  assert.match(
    src,
    /exportBillingReportCsv/,
    "billing hub must call exportBillingReportCsv for statement export",
  );
  assert.match(src, /testID="billing-export-csv"/, "billing export control must be testable");
});

test("invoice detail exposes PDF download", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "app", "invoices", "[id].tsx"), "utf8");
  assert.match(src, /downloadInvoicePdf/, "invoice detail must support PDF export");
  assert.match(src, /testID="invoice-download-pdf"/, "invoice PDF button must be testable");
});

test("real-estate engines include facet-gated property_type chips", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "..", "..", "lib", "search-contract", "src", "engines.ts"),
    "utf8",
  );
  for (const key of ["duplex", "penthouse", "studio", "office", "commercial_land"]) {
    assert.match(
      src,
      new RegExp(`key:\\s*"${key}"[\\s\\S]*?requiresFacet:\\s*true`),
      `${key} engine must be facet-gated`,
    );
  }
});

test("search params wire near-me geo to API client", () => {
  const typesSrc = fs.readFileSync(
    path.join(APP_ROOT, "..", "..", "lib", "search-contract", "src", "types.ts"),
    "utf8",
  );
  const buildSrc = fs.readFileSync(
    path.join(APP_ROOT, "..", "..", "lib", "search-contract", "src", "buildSearchParams.ts"),
    "utf8",
  );
  assert.match(typesSrc, /nearMeEnabled/, "SearchCriteria must track near-me toggle");
  assert.match(buildSrc, /sp\.near_lat/, "buildSearchParams must send near_lat");
  assert.match(buildSrc, /sp\.radius_km/, "buildSearchParams must send radius_km");
});

test("search tab uses market-scoped rental taxonomy adapter", () => {
  const search = fs.readFileSync(path.join(APP_ROOT, "app", "(tabs)", "search.tsx"), "utf8");
  const sheet = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "FilterSheet.tsx"),
    "utf8",
  );
  assert.match(search, /rentalTermsForSearch/, "search tab must use searchTaxonomy adapter");
  // Country selection is a searchable sheet (not an endless MARKET_COUNTRIES chip strip).
  assert.match(search, /MarketCountryPicker/, "search tab must use MarketCountryPicker");
  assert.match(sheet, /rentalTermsForSearch/, "FilterSheet must use market-scoped rental terms");
  assert.match(sheet, /MarketCountryPicker/, "FilterSheet must use MarketCountryPicker");
  assert.match(sheet, /filter-near-me/, "FilterSheet must expose near-me control");
});

test("car import engine is wired in search-contract", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "..", "..", "lib", "search-contract", "src", "engines.ts"),
    "utf8",
  );
  assert.match(
    src,
    /key:\s*"import"[\s\S]*?origin_type:\s*"imported"/,
    "car import engine must map to origin_type=imported",
  );
});

test("search buttons stay isolated — no host hub / no dual fuel engines", () => {
  const search = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "search.tsx"),
    "utf8",
  );
  const discover = fs.readFileSync(
    path.join(APP_ROOT, "components", "SearchDiscover.tsx"),
    "utf8",
  );
  const engines = fs.readFileSync(
    path.join(APP_ROOT, "..", "..", "lib", "search-contract", "src", "engines.ts"),
    "utf8",
  );
  const sheet = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "FilterSheet.tsx"),
    "utf8",
  );

  // Host rental ops belong on Profile — not shopper Search chrome.
  assert.doesNotMatch(
    search,
    /search-rental-hub|\/rentals\/hub/,
    "Search must not open host rentals hub",
  );
  assert.match(
    search,
    /search-rental-/,
    "Search must keep shopper rental-term chips",
  );

  // Fuel/transmission = FilterSheet only; not car engine chips.
  assert.doesNotMatch(
    engines,
    /key:\s*"(petrol|diesel|hybrid|electric|automatic|manual)"/,
    "car engines must not duplicate fuel/transmission",
  );
  assert.match(sheet, /filter-fuel/, "FilterSheet owns fuel");
  assert.match(sheet, /filter-transmission/, "FilterSheet owns transmission");

  // Car import journey entry stays on marketplace Discover; supply stays B2B.
  assert.match(discover, /discover-car-import/);
  assert.match(discover, /discover-supply-portal/);
  assert.match(discover, /onBrowseSection\("car",\s*"import"\)/);
  assert.match(discover, /\/business\/supply-hub/);

  // Import browse must latch originType like selectEngine (not engineKey alone).
  assert.match(
    search,
    /browseSection[\s\S]*origin_type[\s\S]*originType|params\.origin_type[\s\S]*originType/,
    "browseSection must sync originType for import engine",
  );
});

test("map HTML accepts market-country center override", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "mapHtml.ts"),
    "utf8",
  );
  assert.match(
    src,
    /function buildMapHtml\([\s\S]*center\?/,
    "buildMapHtml must accept optional center",
  );
  assert.doesNotMatch(
    src,
    /\.setView\(\[26\.8,\s*30\.8\],\s*6\)/,
    "map must not hardcode Egypt-only initial center",
  );
});

test("create taxonomy includes engine-aligned commercial property types", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "constants", "listingCreateTaxonomy.ts"),
    "utf8",
  );
  assert.match(src, /commercial_land/, "PROPERTY_TYPES must include commercial_land");
  assert.match(src, /warehouse/, "PROPERTY_TYPES must include warehouse");
});

test("create visible fields hide wrong cross-section questions", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "constants", "listingCreateTaxonomy.ts"),
    "utf8",
  );
  // No-rooms types must include warehouse + commercial_land (engine expansion).
  assert.match(
    src,
    /REAL_ESTATE_NO_ROOMS_TYPES[\s\S]*commercial_land[\s\S]*warehouse/,
    "NO_ROOMS must cover warehouse + commercial_land",
  );
  // Ownership is sale-only; rental_term is rent-only.
  assert.match(
    src,
    /offer === "rent"[\s\S]*ownership|ownership[\s\S]*offer === "rent"/,
    "ownership must be hidden when offer_type=rent",
  );
  assert.match(
    src,
    /offer !== "rent"[\s\S]*rental_term/,
    "rental_term must be hidden unless offer_type=rent",
  );
  // Raw materials must not list industry as a form field.
  assert.doesNotMatch(
    src,
    /raw_materials:\s*\[[\s\S]*?key:\s*"industry"/,
    "raw_materials SPEC_FIELDS must not include industry",
  );
});

test("search materials browse hides factory industry filter", () => {
  const filterSrc = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "FilterSheet.tsx"),
    "utf8",
  );
  const searchSrc = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "search.tsx"),
    "utf8",
  );
  assert.match(
    filterSrc,
    /showIndustry[\s\S]*raw_material/,
    "FilterSheet must gate industry away from raw_material",
  );
  assert.match(
    searchSrc,
    /type === "all" \|\| type === "raw_material"[\s\S]{0,120}industry\s*[:=]\s*null|industry\s*[:=]\s*null[\s\S]{0,120}raw_material/,
    "selectIndustrialType must clear industry on commodity browse",
  );
  assert.match(
    searchSrc,
    /CLEAR_ATTRS = CLEAR_SECTION_ATTRS|CLEAR_SECTION_ATTRS/,
    "mobile must use shared CLEAR_SECTION_ATTRS",
  );
  // Rent regime is rent-engine only (not "anything except sale").
  assert.match(
    searchSrc,
    /offer_type ===\s*"rent"/,
    "rental chrome must require explicit rent engine",
  );
  assert.match(
    filterSrc,
    /offer_type ===\s*"rent"/,
    "FilterSheet rental terms must require rent engine",
  );
  // Facilities must not own origin chrome; materials does.
  assert.match(
    searchSrc,
    /showOriginChrome\s*=\s*criteria\.category === "materials"/,
    "origin chrome is materials-company only",
  );
  assert.match(
    filterSrc,
    /showOrigin\s*=\s*criteria\.category === "materials"/,
    "FilterSheet origin is materials-company only",
  );
  assert.match(
    filterSrc,
    /showMaterial[\s\S]*filter-material|testPrefix="filter-material"/,
    "FilterSheet must expose commodity material chips",
  );
});

test("searchParams is a thin re-export from @workspace/search-contract", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "lib", "searchParams.ts"), "utf8");
  assert.match(
    src,
    /from\s+["']@workspace\/search-contract["']/,
    "mobile searchParams must delegate to shared search-contract",
  );
  assert.doesNotMatch(
    src,
    /function\s+buildSearchParams/,
    "mobile must not duplicate buildSearchParams implementation",
  );
  assert.doesNotMatch(src, /banco-web/, "mobile searchParams must not import banco-web");
});

test("preferred market is shared between search and create publish", () => {
  const pref = fs.readFileSync(
    path.join(APP_ROOT, "lib", "marketPreference.ts"),
    "utf8",
  );
  assert.match(pref, /savePreferredMarketCountry/);
  assert.match(pref, /loadPreferredMarketCountry/);
  assert.match(pref, /normalizeMarketCountry/);

  const create = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "create.tsx"),
    "utf8",
  );
  assert.match(
    create,
    /market_country\s*=\s*normalizeMarketCountry\(publishMarketCountry\)/,
    "create must stamp preferred market onto specs.market_country",
  );

  const search = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "search.tsx"),
    "utf8",
  );
  assert.match(
    search,
    /savePreferredMarketCountry/,
    "search must persist market country when the buyer switches market",
  );
  assert.match(
    search,
    /loadPreferredMarketCountry/,
    "search must hydrate preferred market on mount",
  );

  const home = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "index.tsx"),
    "utf8",
  );
  assert.match(
    home,
    /loadPreferredMarketCountry/,
    "home feed must hydrate preferred market",
  );
  assert.match(
    home,
    /market_country:\s*marketCountry/,
    "home getFeed calls must send market_country",
  );
});

test("map hosts prefer cluster API bookable/price over page-only enrichment", () => {
  for (const rel of [
    path.join("components", "search", "SearchResultsMap.tsx"),
    path.join("components", "search", "SearchResultsMap.web.tsx"),
  ]) {
    const src = fs.readFileSync(path.join(APP_ROOT, rel), "utf8");
    assert.match(
      src,
      /c\.is_bookable/,
      `${rel} must read is_bookable from map cluster API`,
    );
    assert.match(
      src,
      /c\.price_display/,
      `${rel} must read price_display from map cluster API`,
    );
  }
});

test("CarPicker create mode always exposes Other / custom brand", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "components", "CarPicker.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /mode === "create"[\s\S]*customBrand|custom brand ALWAYS reachable/i,
    "create picker must keep custom brand reachable without allowlist-only UX",
  );
});
