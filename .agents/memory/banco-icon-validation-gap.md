---
name: BANCO icon registry validation gap
description: Why unmapped icon names ship silently as a broken "dot", and how to prevent it
---

# Unmapped icon names render a broken "dot" and the audit isn't in CI

An icon name passed to Feather/Ionicons/MaterialCommunityIcons (all back the same
lucide SVG `IconBase` in `components/icons.tsx`) that is NOT a key in the `ICONS`
registry renders the `CircleAlert` fallback — a small circle that looks like a
broken dot — plus a dev-only `[icons] Unmapped icon "<name>"` warning. This is the
SVG-era successor to the old Android tofu box.

**Why it ships silently:** `tests/icons.test.mjs` (run via
`pnpm --filter @workspace/banco-mobile run test:icons`) already audits every icon
name used in the app against the registry, but the running `test` workflow only
runs `@workspace/api-server`. So a new/typo'd icon name passes review and ships as
a broken dot on real devices (e.g. `share-social-outline` appeared on EVERY card).

**How to apply:**
- After adding any new icon usage, run `test:icons` (it cross-checks against the
  real @expo/vector-icons glyph maps to tell icon names from discriminator strings).
- Wire `test:icons` (and `typecheck`) into the validation skill so mobile icon/typing
  regressions are caught like CI, not by manual spot-checks.
- Map names to existing lucide imports when possible; only add new lucide imports for
  genuinely new glyphs. typecheck-mobile catches a non-existent lucide export.
