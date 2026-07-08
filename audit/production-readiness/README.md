# Production Readiness — BANCO Store

**Purpose:** 21-phase verification program for cloud launch readiness (no production deploy from this track).  
**Last updated:** 2026-07-08  
**Master maintenance plan:** [`audit/maintenance/MASTER-MAINTENANCE-READINESS-PLAN.md`](../maintenance/MASTER-MAINTENANCE-READINESS-PLAN.md)

---

## 21-phase program (status index)

| Phase | Focus | Status | Report |
|------:|-------|--------|--------|
| 01 | Core architecture (pnpm workspace, deps, CI lockfile) | **pass** | [PHASE-01-CORE-ARCHITECTURE.md](./PHASE-01-CORE-ARCHITECTURE.md) |
| 02 | Database & schema (Drizzle, migrations, indexes) | pending | — |
| 03 | API server runtime (Express, health, bootstrap) | pending | — |
| 04 | Authentication (Clerk, sessions, proxy) | pending | — |
| 05 | Security & ACL (P0 fixes, upload claims) | pending | — |
| 06 | Upload & media (S3/GCS, verify, claims) | pending | — |
| 07 | Search, geo & maps (filters, clusters, near-me) | pending | — |
| 08 | Billing, wallet & finance hub | pending | — |
| 09 | Payments (Paymob/Stripe **structure only** — do not enable) | pending | — |
| 10 | Mobile core UX & navigation | pending | — |
| 11 | Mobile search performance & map WebView | pending | — |
| 12 | Admin OS web (`artifacts/admin-os`) | pending | — |
| 13 | Dealer OS web (`artifacts/dealer-os`) | pending | — |
| 14 | Landing / consumer web (`artifacts/landing`) | pending | — |
| 15 | CI/CD pipeline (GitHub Actions) | pending | — |
| 16 | Docker & AWS deploy (`deploy/aws/`, root `Dockerfile`) | pending | — |
| 17 | GCP deploy scaffold (`deploy/gcp/`) | pending | — |
| 18 | Staging validation (P0 smoke, secrets) | pending | [WAVE-P0-STAGING-VALIDATION.md](../maintenance/WAVE-P0-STAGING-VALIDATION.md) |
| 19 | EAS & store release (preview/production profiles) | pending | [EXPO-EAS-PRODUCTION-CHECKLIST.md](./EXPO-EAS-PRODUCTION-CHECKLIST.md) |
| 20 | Observability & health probes | pending | [OBSERVABILITY-RUNBOOK.md](./OBSERVABILITY-RUNBOOK.md) |
| 21 | RC sign-off & launch GO/NO-GO | pending | [RELEASE-CANDIDATE-FINAL.md](./RELEASE-CANDIDATE-FINAL.md) |

**Status values:** `pending` · `in_progress` · `pass` · `pass_with_fixes` · `blocked`

**Next recommended phase:** **02 — Database & schema** (`lib/db`, `upload_claims`, Drizzle push on staging).

---

## Seven launch pillars (cross-cutting)

See **[SEVEN-LAUNCH-PILLARS.md](./SEVEN-LAUNCH-PILLARS.md)** for pillar-level blockers and env-only gaps.

| # | Pillar | Doc | Status |
|---|--------|-----|--------|
| 1 | Feature flags | [FEATURE-FLAGS.md](./FEATURE-FLAGS.md) | partial |
| 2 | Data migration rollback | [MIGRATION-ROLLBACK-PLAYBOOK.md](./MIGRATION-ROLLBACK-PLAYBOOK.md) | partial |
| 3 | Observability | [OBSERVABILITY-RUNBOOK.md](./OBSERVABILITY-RUNBOOK.md) | partial |
| 4 | API versioning | [API-VERSIONING-POLICY.md](./API-VERSIONING-POLICY.md) | ready |
| 5 | Backward compatibility | [BACKWARD-COMPATIBILITY.md](./BACKWARD-COMPATIBILITY.md) | ready |
| 6 | Disaster recovery | [DISASTER-RECOVERY-VERIFICATION.md](./DISASTER-RECOVERY-VERIFICATION.md) | partial |
| 7 | Release rollback | [RELEASE-ROLLBACK-PLAYBOOK.md](./RELEASE-ROLLBACK-PLAYBOOK.md) | partial |

---

## Expo / EAS / monorepo quick refs

| Doc | Purpose |
|-----|---------|
| [MONOREPO-PACKAGE-GUIDE.md](./MONOREPO-PACKAGE-GUIDE.md) | pnpm workspace, Metro, Windows install |
| [EXPO-EAS-PRODUCTION-CHECKLIST.md](./EXPO-EAS-PRODUCTION-CHECKLIST.md) | EAS pass/fail items |
| [STAGING-EAS-DEVICE-RUNBOOK.md](./STAGING-EAS-DEVICE-RUNBOOK.md) | Staging → EAS preview → device QA |
| [PHASE-LISTING-PUBLISH-LIFECYCLE.md](./PHASE-LISTING-PUBLISH-LIFECYCLE.md) | Publish safety verdict |

Local gate (no secrets): `node scripts/production-confidence-check.mjs`

---

## Related audit material

| Area | Location |
|------|----------|
| Maintenance master plan | [`audit/maintenance/MASTER-MAINTENANCE-READINESS-PLAN.md`](../maintenance/MASTER-MAINTENANCE-READINESS-PLAN.md) |
| RC-1 report | [`audit/rc1/BANCO-STORE-RELEASE-CANDIDATE-REPORT.md`](../rc1/BANCO-STORE-RELEASE-CANDIDATE-REPORT.md) |
| PH-1 mobile hardening | [`audit/maintenance/WAVE-PH1-PRODUCTION-HARDENING.md`](../maintenance/WAVE-PH1-PRODUCTION-HARDENING.md) |
| Live status | [`STATUS_REPORT.md`](../../STATUS_REPORT.md) |
| AWS deploy | [`deploy/aws/reports/06-READINESS_CHECKLIST_GONOGO.md`](../../deploy/aws/reports/06-READINESS_CHECKLIST_GONOGO.md) |
| GCP scaffold | [`deploy/gcp/README.md`](../../deploy/gcp/README.md) |
| Website separation | [`audit/website/`](../website/) |

---

## Staging-only actions (operator)

1. `node scripts/staging-p0-smoke.mjs` with real `BANCO_API_URL` + Clerk tokens.
2. `node scripts/verify-upload-claims-schema.mjs` against staging DB.
3. Checklist in [DISASTER-RECOVERY-VERIFICATION.md](./DISASTER-RECOVERY-VERIFICATION.md).
4. Confirm `ERROR_ALERT_WEBHOOK` receives a test alert (optional).
5. Tag release and rehearse [RELEASE-ROLLBACK-PLAYBOOK.md](./RELEASE-ROLLBACK-PLAYBOOK.md) on staging.

**Do not** run destructive DB restore or production rollback without an explicit ops window.
