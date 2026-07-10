# Repo sync status

**Updated:** 2026-07-10 (waves 8–9 — honest deploy matrix)

| Repo | Branch | Tag | SHA | Status |
|------|--------|-----|-----|--------|
| `-BANCO-CA-OOM-` | `main` | — | `3b40782` | ✅ pushed (includes `5939849`) |
| `aws-virgen` | `main` | `v1.1.3-seller-social-2026-07-10` | `d386f52` | ✅ synced (tag peels to same commit) |

**Handoff:** `release/FULL-STABLE-SNAPSHOT-2026-07-10.md`  
**Proof artifact:** `audit/mobile/live-probes/2026-07-10-full-deploy-proof.json`  
**Manifest:** `release/AWS_VIRGEN_SYNC_MANIFEST.json` (feature commit `5939849`)

**Live API:** `https://banco-ca-oom.replit.app`

| Gate | Result |
|------|--------|
| lib-hardening | 47/47 |
| production-confidence | 17/17 (skip-typecheck) |
| search-contract | PASS |
| probe-full-deploy | PARTIAL (wave6 FRESH, wave8 STALE) |
| staging upload smoke | BLOCKED — `CLERK_BEARER_TOKEN` |
| Device QA | OPEN |
| EAS store build | NOT_RUN |

### Deploy proof by layer

| Layer | Proven | Evidence |
|-------|--------|----------|
| GitHub primary | yes | `origin/main` = `3b40782` |
| aws-virgen sync | yes | `ls-remote main` + tag `^{}` = `d386f52` |
| Replit API stabilize | yes | ISO 400 + map bookable/price |
| Replit API wave 8 | **no** | seller keys: `id,name,role,is_verified` only |
| Mobile in stores | no | needs EAS build |

```bash
node audit/mobile/scripts/ops-next-step.mjs
node audit/mobile/scripts/probe-wave8-seller-social.mjs
./scripts/publish-aws-virgen-rc.ps1 v1.1.3-seller-social-2026-07-10
```

**Blocking ops:** Redeploy Replit `api-server` from `origin/main` — see `audit/mobile/NEXT-OPS-REPLIT-REDEPLOY.md`.
