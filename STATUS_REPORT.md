# BANCO Store — Completion & Status Report

_Last updated: 2026-07-10 — `main` @ `3b40782` (waves 6–8 merged; wave 9 UX local). Live Replit: wave 6 **FRESH**, wave 8 **STALE**. Device QA + upload smoke **OPEN**._

> **Release line:** `main`. Mobile regression via `pnpm run ops:full-verify` (local) + `pnpm run ops:probe-full` (live). Website does **not** block mobile (O17 SKIP).

---

## 1. How verification works here

- **Backend (api-server):** vitest suite (needs `DATABASE_URL` / CI Postgres).
- **Mobile regression:** `test:icons` + `test:lib` + `test:resilience` + `test:universal-links` + **lib-hardening 47/47**.
- **Search contract:** `pnpm --filter @workspace/search-contract run test` (listingMode + URL round-trip).
- **Live probes:** `pnpm run ops:probe-full` — honest wave 6 + wave 8 matrix.
- **API contract:** `lib/api-spec/openapi.yaml` → orval → clients.

---

## 2. Delivered & verified (product + stabilize)

| Area | What | Verification |
|---|---|---|
| **P0 security** | Upload IDOR, LIKE escape, ACL | audit/fixes C-01…H-03 |
| **Mobile M01–M31 + waves 6–9** | Profile, search, map, B=Potential, sale/buy filter | lib-hardening **47/47** |
| **Wave 8 API (code)** | `seller.social_links` on listing detail | ListingService + code-gate |
| **Wave 8 API (live)** | — | **STALE** until Replit redeploy |
| **Server map clustering** | bookable/price on pins | live FRESH (wave 6) |
| **Market country** | list + map + feed | search-contract |

---

## 3. Honest remaining items (need your environment)

| Item | Status | Action |
|---|---|---|
| **Replit wave 8** | STALE | Redeploy `main` → `post-redeploy-verify` exit 0 |
| **staging-p0-smoke upload** | BLOCKED | `CLERK_BEARER_TOKEN` in `.secrets/local.env` |
| **EAS preview + Device QA** | OPEN | `MOBILE-PUBLISH-SUCCESS-GATE.md` |
| **Store production** | NO-GO | After device QA |

```bash
pnpm run ops:full-verify    # local only — must pass before redeploy
pnpm run ops:next           # code gate + live probes
pnpm run ops:post-redeploy  # after Replit redeploy
```

**Canonical docs:** `MASTER-TRUTH-INVENTORY-AR.md` · `FULL-STABLE-SNAPSHOT-2026-07-10.md`
