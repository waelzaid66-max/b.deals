# Honest inventory — 2026-07-10

Rules applied: no fake “all green”, no deleted account/section journeys, no wrong duplicate options, mobile strength preserved.

## Layers (truth)

| Layer | Truth |
|-------|--------|
| Local branch code (M01–M25 + Discover facet gate) | Present in workspace |
| Automated tests offline | Pass where env allows (`search-contract`, `lib-hardening`, `icons`); mapClusters DB vitest needs `DATABASE_URL` |
| Live Replit `banco-ca-oom.replit.app` | **STALE** — `market_country` ignored; map clusters lack `is_bookable` / `price_display` |
| Real-device DoD | **OPEN** until redeploy + Expo/device QA |
| OPS O16 | **OPEN** (secrets / EAS / staging smoke) — not a code lie |

## Account / section journeys — still present

| Surface | Status | Notes |
|---------|--------|-------|
| Roles: `individual` / `dealer` / `company` | Intact | `enterprise` admin-only |
| Business activities (developer, car_dealer, …) | Intact | Not roles; hub routes remain |
| `host` booking / `bank` RFQ axes | Intact | Not removed by stabilize |
| Create categories + rent / import / supply | Intact | CTAs + engines remain |
| Discover → supply hub + car import CTA | Intact | Intentionally kept (journey entry, not a wrong duplicate of chrome) |
| Profile business menu | Intact | M17 |

**Risk (not deletion):** `market_country` can hide untagged listings after deploy — sellers must stamp ISO; preference defaults EG.

## Duplicate / misplaced options

| Finding | Action |
|---------|--------|
| Endless country chips | Already removed (M07) |
| Discover engines without facet gate | **Fixed** — same `visibleEngines` as Search chrome |
| Car brand chips when no car inventory | **Fixed** — hide when facets prove `category.car === 0` |
| Import CTA + car `import` engine | **Kept both** — CTA is journey entry; engine is filter. Not “wrong place” |
| Fuel / transmission in engine bar + FilterSheet | **Left** — dual entry is intentional depth vs quick filter; removing either weakens power |
| Discover engines skip vs chrome | Was the real bug; now aligned |

## Safe next (only if it improves)

1. Redeploy API + mobile to Replit (or staging) so live matches local M23/M24.
2. Re-run `LIVE-DEPLOY-PROBE.md` — expect EG ≠ SA when data tagged; map keys include bookable/price.
3. Device checklist per ID in ACCEPTANCE + EXTENDED + SUCCESS-CERT.
4. Do **not** strip import/supply/rent/business paths for “cleanup aesthetics”.

## Code change this pass

- `SearchDiscover.tsx`: facet-gate expanded engines; gate popular brands on car inventory.
