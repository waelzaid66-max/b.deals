# تسليم للوكيل الأساسي (Replit) — 2026-07-08

**لا تغييرات كود مطلوبة من هذه الجلسة** ما لم يظهر فشل CI جديد.

## SHA المعتمد

| المعنى | Commit |
|--------|--------|
| آخر إصلاحات منتج (Metro، OpenAI، تخزين، جاهزية) | `92a33e0` |
| `HEAD` على `main` (origin) | `045112f` |

التحقق من المرآات (قراءة فقط من Cloud Agent، قبل `6854fbc`):

```text
origin/main = 045112f (بعد دفع التوثيق)
bbanco/main = bdeals/main = boom/main = 31a4bfe ← شغّل push-mirror-remotes.sh من Replit
```

## إن احتجت إعادة دفع المرآات

من Replit (حساب المالك، ليس `cursor[bot]`):

```bash
chmod +x scripts/push-mirror-remotes.sh
./scripts/push-mirror-remotes.sh
```

## ما يعمل عليه الوكيل الأساسي (خارج نطاق المزامنة)

راجع `STATUS_REPORT.md` §4 و`audit/production-readiness/OPEN-ITEMS-BACKLOG.md` — **O16** فقط مفتوح (staging smoke، جهاز، EAS).

## ملفات حُدّثت في موجة التوثيق (للمراجعة)

- `REPO_SYNC_STATUS.md` — SHA والمرآات
- `STATUS_REPORT.md` — مرجع HEAD
- `scripts/push-mirror-remotes.sh` — أداة دفع مرآات
- هذا الملف

## aws-virgen (second production repo)

Primary `main` is finalized and tagged **`v1.0.0-rc.1`**. Publish to `aws-virgen` (owner token):

```bash
chmod +x scripts/publish-aws-virgen-rc.sh
./scripts/publish-aws-virgen-rc.sh v1.0.0-rc.1
```

See [docs/AWS_VIRGEN_REPOSITORY.md](docs/AWS_VIRGEN_REPOSITORY.md).


`packageManager: pnpm@11.9.0` + أمر التثبيت السريع في `.agents/memory/banco-replit-install-env.md`.
