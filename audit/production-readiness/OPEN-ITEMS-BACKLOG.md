# البنود غير المكتملة فقط — استخراج من تقرير الجاهزية

**مصدر:** `FULL-READINESS-STATUS-PLAN.md` + 21-phase  
**آخر تحديث إغلاق:** 2026-07-10

---

## سجل الإغلاق

| ID | نتيجة | ملاحظة |
|----|--------|--------|
| O01 | **CLOSED** | STATUS_REPORT HEAD sync |
| O02 | **CLOSED** | `.gitignore` agent junk + `audit/rc1/*.log` |
| O03 | **CLOSED** | Doc: icons.test.mjs under banco-mobile (PHASE-10-11) |
| O04 | **CLOSED** | `STAGING-REQUIRED-SECRETS.md` |
| O05–O15 | **CLOSED** | PHASE-02…20 + marketplace + README index |
| O16 | **OPEN — OPS** | Staging smoke / device / EAS — needs secrets. Mobile code M01–M31 + waves 6–9 on `main`. Live wave 8 STALE until Replit redeploy. Gate: `MOBILE-PUBLISH-SUCCESS-GATE.md` |
| O17 | **SKIP** | Website build — must not block mobile CI/EAS |
| O18 | **SKIP** | Paymob B5 |
| O19 | **CLOSED** | Release freeze + RC update (this wave) |
| O20 | **CLOSED (code)** | Mobile CI now runs `test:universal-links` with icons/lib/resilience (2026-07-10) |
| O21 | **CLOSED** | Architecture file index + confidence gate extended + wave doc `WAVE-MOBILE-STABILIZE-ISOLATION.md` |

---

## ما يبقى بعد Release Freeze (أنت فقط)

0. `pnpm run ops:code-gate` ثم **Redeploy API** من فرع stabilize → `pnpm run ops:post-redeploy` (**FRESH**)  
1. توفير أسرار `STAGING-REQUIRED-SECRETS.md`  
2. تشغيل Phase 18 scripts + device publish smoke  
3. `node scripts/staging-p0-smoke.mjs` + `verify-upload-claims-schema.mjs` (بعد الأسرار)
4. `eas build --profile preview` ثم production عند الموافقة  
5. تنفيذ Device QA: `MOBILE-STABILIZE-ACCEPTANCE.md` + `DEVICE-QA-SECTION-COMPANIES.md`  
6. تأكيد GitHub Actions UI على آخر commit

**لا تُعاد كـ bugs كود:** M01–M31، C-01 upload IDOR، عزل Search، material/market على list/map/feed.