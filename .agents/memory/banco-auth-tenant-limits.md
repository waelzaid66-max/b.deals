---
name: BANCO auth tenant limits
description: What the Clerk tenant actually supports and how to handle review requests for unsupported auth features without faking them.
---

# BANCO auth — tenant capabilities & honest reconciliation

The Clerk tenant for BANCO supports ONLY: email + password, email OTP, Google SSO,
Apple SSO, change password, session management (list/revoke), and account deletion.

NOT supported (and must NOT be faked anywhere — UI, copy, or stubs):
- Facebook / LinkedIn login
- Phone number as a login method
- Standalone authenticator-app / SMS 2FA (sign-in is already protected by email OTP)
- OTP email branding (that is a Clerk *dashboard* config, not app code)

**Rule:** When a reviewer or task asks to "add Facebook/LinkedIn/phone login" or
"add 2FA", do NOT implement or fake them. Reconcile honestly: surface the *real*
available sign-in methods (email & password, Google, Apple) and frame unavailable
features as unavailable (e.g. settings "Sign-in methods" + "Two-step verification"
info rows state what is and isn't available).

**Why:** Project rule forbids fabricated auth methods/verification; a full-task code
review once rejected the work for "missing FB/LinkedIn/phone login" — the correct
response was honest disclosure, not building tenant-impossible features.

**How to apply:** Identity/account surfaces (profile auth sheet, settings security
center) should describe the supported methods and gate password UI on
`user.passwordEnabled` (SSO-only accounts have no password to change). Anti-fraud
messaging is surfaced as bilingual copy, not enforced client-side.
