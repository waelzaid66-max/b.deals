# Live deploy probe — banco-ca-oom.replit.app

Probed: 2026-07-10 (re-confirmed same day via `probe-live-deploy.mjs`)  
Branch with fixes: local `fix/mobile-master-stabilize` (not yet on this host)

## Latest automated probe (exit 2 = STALE)

```json
{
  "health": "ok",
  "egEqSa": true,
  "badIsoStatus": 200,
  "mapKeys": "count,lat,listing_id,lng",
  "hasBookable": false,
  "hasPrice": false,
  "verdict": "STALE — redeploy fix/mobile-master-stabilize API before device claims"
}
```

Re-run anytime: `node audit/mobile/scripts/probe-live-deploy.mjs`

## URLs opened

| URL | What we saw |
|-----|-------------|
| `/banco-mobile/` | Expo Go landing + QR only — **no in-browser app UI** to screenshot for M01–M25 |
| `/dealer-os/` → `/dealer-os/sign-in` | BANCO Market Clerk sign-in (dark). Logo + Google + email. **Development mode**. Not a black crash — first paint looked empty until Clerk mounted |
| `/api/healthz` `/api/livez` `/api/readyz` | `ok` / DB ok |

## Live API vs stabilize code (critical)

Base: `https://banco-ca-oom.replit.app/api/v1`

| Check | Live result | Local code expectation |
|-------|-------------|------------------------|
| `market_country=EG` vs `SA` on `/search` | **Identical listing ids** | Must diverge when inventory tagged |
| Invalid `market_country=EGYPT` | **HTTP 200 + data** (param ignored) | Zod reject / 400 |
| `/search/map` cluster object | keys: `lat,lng,count,listing_id` only | + `is_bookable`, `price_display` |
| EG vs SA map totals | **Same 8 clusters** | Filter by market |

Raw captures: `audit/mobile/live-probes/*.json`

## Conclusion

1. **Hosted Replit build does not include M23/M24** (and likely not the rest of this branch).
2. Mobile link cannot show in-app defects in a desktop browser — needs Expo Go / device.
3. Market link is auth-gated; no seller inventory UI without credentials.
4. **Next ops step:** redeploy API + mobile from `fix/mobile-master-stabilize`, then re-run this probe (expect map keys + EG≠SA when data tagged).

## Re-probe helper (2026-07-10)

```bash
node audit/mobile/scripts/probe-live-deploy.mjs
# optional: node audit/mobile/scripts/probe-live-deploy.mjs https://your-staging-host
```

Exit `0` = FRESH (bad ISO → 4xx, map has `is_bookable`/`price_display`, EG≠SA when inventory differs).  
Exit `2` = STALE (current Replit host as of this write).

## Local proof still green

- mobile regression 32/32 (icons + lib + resilience + universal-links)
- `proof-isolation.mjs` ok (incl. M31)
- `allowCommodityMaterialFilter` 4/4

