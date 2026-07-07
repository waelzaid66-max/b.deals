/**
 * Search-layer adapters over listing taxonomy — keeps multi-country rental
 * regimes aligned between create and browse without duplicating MARKET_COUNTRIES.
 */
import {
  DEFAULT_MARKET_COUNTRY,
  MARKET_COUNTRIES,
  rentalTermsForCountry,
} from "@/constants/listingCreateTaxonomy";

export { DEFAULT_MARKET_COUNTRY, MARKET_COUNTRIES };

export function rentalTermsForSearch(marketCountry: string) {
  return rentalTermsForCountry(marketCountry);
}

/** Drop a rental_term filter that is invalid for the selected market. */
export function sanitizeRentalTermForMarket(
  term: string | null,
  marketCountry: string,
): string | null {
  if (!term) return null;
  const allowed = rentalTermsForCountry(marketCountry);
  return allowed.some((t) => t.value === term) ? term : null;
}

export function marketCountryLabel(
  code: string,
  isRTL: boolean,
): string {
  const row = MARKET_COUNTRIES.find((c) => c.value === code);
  if (!row) return code;
  return isRTL ? row.ar : row.en;
}
