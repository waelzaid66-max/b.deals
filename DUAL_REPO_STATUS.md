# حالة الريبوهين الرسميين — مصدر الحقيقة

**آخر تحديث:** 2026-07-10 (موجات 8–9 — تحقق حي + UX)  
**النطاق:** ريبوهان فقط — لا مرآات ولا ريبوهات أخرى.

| الريبو | الرابط | الدور |
|--------|--------|-------|
| **أساسي** | https://github.com/waelzaid66-max/-BANCO-CA-OOM- | كود + CI + تقارير + GCP + Replit |
| **AWS** | https://github.com/waelzaid66-max/aws-virgen | نشر EC2/Elastic Beanstalk (نسخة مطابقة للأساسي) |

**مرجع التجربة الكاملة:** `release/FULL-STABLE-SNAPSHOT-2026-07-10.md`  
**دليل الإثبات:** `audit/mobile/live-probes/2026-07-10-full-deploy-proof.json`

---

## SHA والوسم المستهدف

| الريبو | الفرع | Tag | SHA | ملاحظة |
|--------|--------|-----|-----|--------|
| **-BANCO-CA-OOM-** | `main` | — | `3b40782` | يتضمن `5939849` (موجة 8) |
| **aws-virgen** | `main` | `v1.1.3-seller-social-2026-07-10` | `d386f52` | الوسم يُفك إلى نفس SHA |

```bash
git fetch origin main && git rev-parse origin/main   # 3b40782
git ls-remote https://github.com/waelzaid66-max/aws-virgen.git refs/heads/main
git ls-remote https://github.com/waelzaid66-max/aws-virgen.git "refs/tags/v1.1.3-seller-social-2026-07-10^{}"
node audit/mobile/scripts/ops-next-step.mjs
node audit/mobile/scripts/probe-wave8-seller-social.mjs
```

---

## مصفوفة النشر الصادقة (جميع الحالات)

| الطبقة | مثبت؟ | الدليل | ماذا يعني |
|--------|--------|--------|-----------|
| كود GitHub أساسي | ✅ | `origin/main` = `3b40782` + موجة 9 UX محلي | موجات 6–9 في الكود |
| كود aws-virgen | ✅ | `main` + tag = `d386f52`، `ListingService` فيه `social_links` | جاهز لنشر AWS عند تشغيل الـ pipeline |
| بوابات محلية | ✅ | lib-hardening **47/47**، production-confidence **17/17**، search-contract PASS | لا يعني API حي ولا متجر |
| API حي — stabilize (موجة 6) | ✅ | probe: `EGYPT→400`، map `is_bookable`/`price_display`، healthz/readyz ok | Replit يشغّل بناء stabilize |
| API حي — موجة 8 | ❌ **STALE** | `seller` بلا مفتاح `social_links` على 3 إعلانات عيّنة | **إعادة نشر Replit من `main`** مطلوبة |
| smoke رفع صور | ⚠️ | health فقط 2/2 — upload يحتاج `CLERK_BEARER_TOKEN` | |
| EAS / متجر | ❌ | لم يُبنَ preview/production في هذه الجلسة | |
| QA جهاز | ❌ | `DEVICE-QA-SECTION-COMPANIES.md` مفتوح | |

---

## علاقات التواصل (منتج ↔ API ↔ موبايل)

```
حساب المستخدم          الإعلان                    الزائر
─────────────          ───────                    ──────
هاتف اختياري عند       specs.contact_phones[]     requireAuth → chat/RFQ/اتصال
التسجيل فقط            + whatsapp_enabled         contact_token → POST /leads/contact

البروفايل              تفاصيل الإعلان
─────────              ──────────────
user_social_links      seller.social_links  ←── ListingService + ProfileService
/me/social-links       (بعد نشر موجة 8 على Replit)

تعديل بعد النشر: listings/edit/[id].tsx يحدّث contact_phones و whatsapp عبر patch specs
```

---

## التحقق المحلي (2026-07-10 — موجات 8–9)

| المصدر | النتيجة |
|--------|---------|
| production-confidence | ✅ **17/17** (--skip-typecheck) |
| lib-hardening | ✅ **47/47** |
| search-contract | ✅ PASS |
| pre-redeploy-code-gate | ✅ PASS |
| probe-full-deploy | ⚠️ **PARTIAL** — wave 6 FRESH · wave 8 STALE |
| Device QA | ❌ OPEN |
| staging-p0-smoke (upload) | ⚠️ يحتاج `CLERK_BEARER_TOKEN` |

---

## aws-virgen — مزامنة

```powershell
$env:AWS_VIRGEN_SYNC_TOKEN = "<PAT>"
.\scripts\publish-aws-virgen-rc.ps1 v1.1.3-seller-social-2026-07-10
```

أو: Actions → **Sync aws-virgen (full main)**.

---

## Replit — الخطوة الحاجزة لموجة 8

الكود على GitHub جاهز؛ المضيف الحي لم يُعاد بناؤه بعد `5939849`.

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push-force
# Stop → Run api-server
```

ثم على جهازك:

```powershell
node audit/mobile/scripts/probe-wave8-seller-social.mjs
node audit/mobile/scripts/post-redeploy-verify.mjs
```

**متوقع بعد النشر:** `sellerHasSocialLinksKey: true` (قد تكون `social_links: []`).

---

## ملاحظات

- `cursor[bot]` قد يفشل push إلى `aws-virgen` (403) — نفّذ السكربت بحساب المالك.
- GitHub Actions billing قد يعطل CI — لا يعني فشل الكود.
- أسرار التشغيل في `.secrets/local.env` فقط — انظر `scripts/local.env.example`.
