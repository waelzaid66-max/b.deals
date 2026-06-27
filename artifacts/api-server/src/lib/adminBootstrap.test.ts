import { describe, it, expect } from "vitest";
import { parseAdminEmails, shouldPromoteToFirstAdmin } from "./adminBootstrap";

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases, and drops blanks", () => {
    expect(parseAdminEmails(" A@x.com, b@x.com ,, ")).toEqual([
      "a@x.com",
      "b@x.com",
    ]);
  });

  it("returns [] for undefined/empty", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("shouldPromoteToFirstAdmin (bootstrap freeze)", () => {
  const adminEmails = ["a@x.com", "b@x.com"];

  it("promotes an allowlisted email when NO admin exists yet", () => {
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: false,
        email: "a@x.com",
        adminEmails,
        anAdminExists: false,
      })
    ).toBe(true);
  });

  it("matches the email case-insensitively", () => {
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: false,
        email: "A@X.com",
        adminEmails,
        anAdminExists: false,
      })
    ).toBe(true);
  });

  // The core hardening: once any admin exists the allowlist is frozen, so a
  // second allowlisted (or newly-added/compromised) email is NOT auto-promoted.
  it("FREEZES once an admin already exists", () => {
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: false,
        email: "b@x.com",
        adminEmails,
        anAdminExists: true,
      })
    ).toBe(false);
  });

  it("never promotes an email that isn't on the allowlist", () => {
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: false,
        email: "c@x.com",
        adminEmails,
        anAdminExists: false,
      })
    ).toBe(false);
  });

  it("never re-promotes someone who is already an admin", () => {
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: true,
        email: "a@x.com",
        adminEmails,
        anAdminExists: false,
      })
    ).toBe(false);
  });

  it("handles null/empty email safely", () => {
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: false,
        email: null,
        adminEmails,
        anAdminExists: false,
      })
    ).toBe(false);
    expect(
      shouldPromoteToFirstAdmin({
        isAlreadyAdmin: false,
        email: "",
        adminEmails,
        anAdminExists: false,
      })
    ).toBe(false);
  });
});
