---
name: BANCO root landing artifact
description: Why a separate minimal landing artifact owns "/" and why it must stay bare
---

There is a standalone react-vite artifact `landing` (pkg `@workspace/landing`, dir `artifacts/landing`) mounted at the root path `/`. Its ONLY job: dark background, centered BANCO logo, ONE button `دخول` linking to `/banco-mobile/`.

**Why it exists:** the root path `/` was previously unmapped, so production (banco.lt) served a 404. The landing artifact claims `/` to show a clean entry page. The other artifacts keep their own paths (`/admin-os/`, `/dealer-os/`, `/banco-mobile/`, `/api`) — `/banco-mobile/` is more specific than `/`, so path routing does not collide.

**Keep it minimal — do NOT add features.** The user (DIRECTOR persona) was emphatic: "nothing more, nothing less." No marketing copy, no animation, no extra buttons, no design-subagent embellishment. Treat any request to "improve the landing page" as scope creep unless the user explicitly asks.

**How to apply:** changes here must be additive and self-contained — never modify admin-os / dealer-os / banco-mobile / api-server / routes / DNS to serve this page. The logo lives at `artifacts/landing/src/assets/banco-logo.png` (copied in, imported via `@` alias) so there is no `attached_assets` runtime dependency.
