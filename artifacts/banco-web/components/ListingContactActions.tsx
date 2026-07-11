"use client";

import type { ListingDetail } from "@workspace/api-client-react";
import { getAppListingDeepLink } from "../lib/site-env";
import { listingUiCopy } from "../lib/listing-ui-copy";
import { useSearchLocale } from "../lib/use-search-locale";

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
  marginTop: "0.75rem",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid var(--banco-border)",
  borderRadius: 10,
  background: "var(--banco-primary)",
  color: "#fff",
  padding: "0.55rem 0.9rem",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.9rem",
  textDecoration: "none",
  display: "inline-block",
};

const secondaryStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "var(--banco-fg)",
};

function isDailyRentListing(listing: ListingDetail): boolean {
  if (listing.category !== "real_estate") return false;
  const rentalTerm = listing.specs?.rental_term;
  return typeof rentalTerm === "string" && rentalTerm === "furnished_daily";
}

type ListingContactActionsProps = {
  listing: ListingDetail;
};

/** Web contact path: deep-link into the mobile app (auth + contact_token live there). */
export function ListingContactActions({ listing }: ListingContactActionsProps) {
  const locale = useSearchLocale();
  const copy = listingUiCopy(locale);
  const appLink = getAppListingDeepLink(listing.id);
  const bookingLink = getAppListingDeepLink(listing.id, "booking");
  const showWhatsApp = listing.whatsapp_enabled === true;
  const showBooking = isDailyRentListing(listing);

  return (
    <section style={{ marginTop: "1.25rem" }} aria-label={copy.contactTitle}>
      <p
        style={{
          margin: "0 0 0.35rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--banco-muted)",
        }}
      >
        {copy.contactTitle}
      </p>
      <p style={{ margin: "0 0 0.5rem", color: "var(--banco-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
        {copy.contactAppHint}
      </p>
      <div style={rowStyle}>
        <a href={appLink} style={buttonStyle}>
          {copy.contactCall}
        </a>
        {showWhatsApp ? (
          <a href={appLink} style={secondaryStyle}>
            {copy.contactWhatsApp}
          </a>
        ) : null}
        <a href={appLink} style={secondaryStyle}>
          {copy.contactChat}
        </a>
        {showBooking ? (
          <a href={bookingLink} style={buttonStyle}>
            {copy.contactBooking}
          </a>
        ) : null}
      </div>
    </section>
  );
}
