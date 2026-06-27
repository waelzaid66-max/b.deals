/**
 * Admin bootstrap policy.
 *
 * `ADMIN_EMAILS` lets a FRESH deployment mint its very first admin on sign-in
 * without manual DB surgery. It is deliberately a ONE-TIME bootstrap: once any
 * admin exists in the database, the allowlist is "frozen" and stops
 * auto-promoting. After launch, admin access must be granted deliberately
 * (admin tooling / DB), so a stale, mistyped, or compromised `ADMIN_EMAILS`
 * entry can never silently mint new admins in production.
 */

/** Parse the comma-separated `ADMIN_EMAILS` env value into a normalized list. */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Decide whether the current user should be auto-promoted to admin. Returns true
 * ONLY to establish the very first admin: the user isn't already an admin, their
 * email is on the allowlist, and no admin exists yet. Once an admin exists the
 * bootstrap is frozen (returns false) regardless of the allowlist.
 */
export function shouldPromoteToFirstAdmin(args: {
  isAlreadyAdmin: boolean;
  email: string | null | undefined;
  adminEmails: string[];
  anAdminExists: boolean;
}): boolean {
  const { isAlreadyAdmin, email, adminEmails, anAdminExists } = args;
  if (isAlreadyAdmin) return false;
  if (anAdminExists) return false; // frozen — the first admin is established
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return adminEmails.includes(normalized);
}
