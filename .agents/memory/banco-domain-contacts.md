---
name: BANCO canonical domain & contact emails
description: The official BANCO mother domain and per-vertical contact emails to use when wiring links, the domain/about page, and settings.
---

# BANCO domain & contact emails

Canonical "mother" domain: **banco.it**

Official contact emails (per vertical):
- info@banco.it — general
- support@banco.it — support
- legal@banco.it — legal / terms / privacy
- cars@banco.it — automotive vertical
- property@banco.it — real-estate vertical
- business@banco.it — B2B / business / supply

**Why:** the user supplied these as the single source of truth for all in-app
links, the domain/about page, and contact settings. They are public contact
addresses (not secrets), safe to render in the UI.

**Code state:** the banco.app → banco.it migration is **DONE in code** — all
in-repo emails/links/copy now use banco.it (mobile screens, i18n EN+AR, dealer
legal-content, server HTML templates, Play data-safety doc, api From: header,
payment-provider placeholder). Local-parts kept as-is (support@/legal@/privacy@/
noreply@) rather than remapped per-vertical.

**Runtime config verified clean:** no env var carries banco.app, and the
`email_provider_config` DB row is empty (service falls back to the code default
`BANCO <noreply@banco.it>`). EmailService is DB-first/env-fallback, so if a
future admin row is added, re-check its from_email/sending_domain/public_app_url.

**Still external (NOT in repo, user-owned):** the Google Play Console store
listing — must be updated to banco.it by the user; code can't change it.

**How to apply:** the per-vertical addresses (cars@/property@/business@/info@)
above are still available if a future task wants surface-specific contacts; map
the bare/general address to the vertical that matches the surface.
