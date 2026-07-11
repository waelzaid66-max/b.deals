# بوابات الجاهزية — موقع BANCO (قابلة للتوقيع)

**مرجع:** [`WEBSITE-PRE-START-PLAYBOOK-AR.md`](./WEBSITE-PRE-START-PLAYBOOK-AR.md)

نسخة: 2026-07-09

---

## A. اتفاق المنتج

- [ ] A1 — القرارات D1–D10 في PRE-START مقبولة
- [ ] A2 — الموقع تكميلي للموبايل وليس بديلاً
- [ ] A3 — عزل تشغيلي: سقوط CDN لا يوقف التطبيق
- [ ] A4 — إنشاء إعلان على الويب ضمن النطاق (W5)
- [ ] A5 — dealer-os و admin-os يبقيان منفصلين
- [ ] A6 — العمل في `BANCO-CA-OOM` فقط؛ ريبو التطوير لاحقاً كـ remote
- [ ] A7 — لا لمس مرآات GitHub الأخرى

**توقيع المالك:** _______________ **تاريخ:** _______________

---

## B. جاهزية الكود والـ CI (قبل W0)

- [ ] B1 — `origin/main` محدث وموثّق في `DUAL_REPO_STATUS.md`
- [ ] B2 — آخر CI ناجح 5/5 على SHA كود مُختبَر (أو فشل billing موثّق)
- [ ] B3 — `pnpm install --frozen-lockfile` PASS
- [ ] B4 — `pnpm run typecheck` PASS
- [ ] B5 — `pnpm run lint` PASS
- [ ] B6 — `node scripts/production-confidence-check.mjs` 13/13
- [ ] B7 — `node scripts/verify-gcp-docker-build-config.mjs` PASS
- [ ] B8 — `pnpm --filter @workspace/banco-mobile run test:icons` PASS
- [ ] B9 — `pnpm --filter @workspace/banco-mobile run test:lib` PASS
- [ ] B10 — `pnpm --filter @workspace/banco-mobile run test:resilience` PASS

**من نفّذ:** _______________ **تاريخ:** _______________

---

## C. جاهزية API (قبل W1 deploy / W2 browse)

- [ ] C1 — `GET /api/healthz` → 200 على بيئة الهدف
- [ ] C2 — `GET /api/readyz` → 200 (DB متصل)
- [ ] C3 — `GET /l/{known-listing-id}` → 200 + og:title
- [ ] C4 — `CLERK_PUBLISHABLE_KEY` متوفر لبيئة الويب
- [ ] C5 — استراتيجية same-origin `/api/` أو `NEXT_PUBLIC_API_BASE_URL` مكتوبة
- [ ] C6 — `GET /v1/search?limit=1` عام بدون auth → 200

---

## D. جاهزية Google Cloud (قبل prod ويب + API)

- [ ] D1 — APIs مفعّلة (Run, Build, AR, SQL, Secret Manager)
- [ ] D2 — Cloud Build trigger → `deploy/gcp/cloudbuild.deploy.yaml`
- [ ] D3 — Build context `.` (جذر الريبو)
- [ ] D4 — Artifact Registry `banco` في المنطقة المختارة
- [ ] D5 — Cloud SQL PG16 + `pg_trgm`
- [ ] D6 — أسرار Secret Manager حسب `SECRET_MANAGER_MAPPING.md`
- [ ] D7 — Runtime SA + `cloudsql.client` + secret accessor
- [ ] D8 — **خطة CDN لـ banco-web** محددة (GCS/Firebase/Cloudflare)
- [ ] D9 — Uptime check على `/` و `/api/healthz` (Monitoring)

مرجع: `deploy/gcp/reports/06-READINESS_CHECKLIST_GONOGO.md`

---

## E. جاهزية aws-virgen

- [ ] E1 — `aws-virgen` main مزامَن مع الأساسي
- [ ] E2 — tag `v1.0.0-rc.2` على virgen

---

## F. جاهزية فريق / وكلاء

- [ ] F1 — قراءة PRE-START + MASTER + FEATURE-MATRIX
- [ ] F2 — WEBSITE-MOBILE-INDEPENDENCE-CHECKLIST معلّق على قالب PR
- [ ] F3 — قالب PR ويب يتضمن «mobile smoke بدون تغيير mobile»

---

## G. بوابات إغلاق موجات (يُملأ أثناء التنفيذ)

### G-W0 (عزل CI)

- [x] job `ci-website` منفصل بـ path filter (`ci-website.yml`)
- [x] `banco-web` / `landing` خارج typecheck في `ci.yml` (`typecheck` يستثني الويب)
- [x] `verify-website-boundaries.mjs` + ESLint `lint:website` في CI website
- [x] `artifacts/landing/.env.example`
- [x] PR mobile-only: لا يشغّل website job (path filters)

### G-W1 (scaffold + SEO)

- [x] `artifacts/banco-web` typecheck في CI website
- [x] 4 hub pages AR + EN mirrors تحت `/en/*`
- [x] preview URL على PR (landing artifact + GCS اختياري)
- [x] `sitemap.xml` يشمل روابط hubs السريعة من `HUB_DEFINITIONS`
- [x] `manifest.webmanifest` محايد (EN) للـ PWA
- [ ] `/l/:id` smoke PASS على staging (rewrite موجود في `next.config.ts`)

### G-W2 (بحث)

- [x] `lib/search-contract` + tests + `mobile-web-parity.test.mjs`
- [x] `/search` + `/en/search` + `/listing/[id]`
- [x] تصفح بدون Clerk (live خلف `NEXT_PUBLIC_WEB_SEARCH_LIVE`)
- [x] واجهة بحث EN كاملة (فلاتر، facets، pagination، near-me، copy URL)
- [x] بطاقات إعلان + تفاصيل إعلان + not-found تتبع تفضيل اللغة (`localStorage` + `/en/*`)
- [x] خريطة بحث (mock/live/disabled) منسوخة AR/EN — خلف `NEXT_PUBLIC_WEB_SEARCH_MAP`

### G-W3 (خريطة + فلاتر متقدمة — staging code)

- [x] مكوّنات الخريطة (panel، surface، canvas، Google) موحّدة اللغة
- [x] `pnpm run ops:website-ci` — mirror محلي لـ `ci-website.yml`
- [x] Docker `deploy/aws/Dockerfile.banco-web` + `ci-website-docker.yml`
- [ ] خريطة حية على staging (`MAP=true` + Google key) — بعد API FRESH
- [x] FilterSheet parity مع الموبايل (W3.1): `natural_gas`/`cvt`، industry/origin في facets، inventory gating

### G-W5 (إنتاج بائع)

- [ ] `/workspace/listings/new` E2E
- [ ] إعلان يظهر في search + mobile
- [ ] uploads كاملة

---

## H. حكم Go / No-Go

| مرحلة | يتطلب | الحكم |
|-------|--------|-------|
| **بدء W0** | A* + B* | GO / NO-GO |
| **بدء W1** | + C* | GO / NO-GO |
| **نشر staging ويب** | + D8 | GO / NO-GO |
| **prod ويب عام** | + G-W2 + G-W5 كحد أدنى للشمول | GO / NO-GO |

**ملاحظات:**

_________________________________________________________________

**توقيع:** _______________ **تاريخ:** _______________
