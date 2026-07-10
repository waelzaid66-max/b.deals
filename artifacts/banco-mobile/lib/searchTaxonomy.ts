/**
 * Search-layer adapters over listing taxonomy — keeps multi-country rental
 * regimes aligned between create and browse without duplicating MARKET_COUNTRIES.
 */
import { PHONE_COUNTRIES } from "@/constants/countryCodes";
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
  if (row) return isRTL ? row.ar : row.en;
  const phone = PHONE_COUNTRIES.find((c) => c.iso === code);
  if (phone) return isRTL ? phone.nameAr : phone.nameEn;
  return code;
}

/** Rough map default center per ISO — used when the market country changes. */
export function marketCountryMapCenter(code: string): {
  lat: number;
  lng: number;
  zoom: number;
} {
  const centers: Record<string, { lat: number; lng: number; zoom: number }> = {
    EG: { lat: 26.8, lng: 30.8, zoom: 6 },
    SA: { lat: 24.0, lng: 45.0, zoom: 5 },
    AE: { lat: 24.3, lng: 54.4, zoom: 7 },
    KW: { lat: 29.3, lng: 47.5, zoom: 8 },
    QA: { lat: 25.3, lng: 51.5, zoom: 9 },
    JO: { lat: 31.2, lng: 36.5, zoom: 7 },
    OM: { lat: 21.5, lng: 57.0, zoom: 6 },
    LY: { lat: 27.0, lng: 17.0, zoom: 5 },
    BH: { lat: 26.0, lng: 50.5, zoom: 10 },
    IQ: { lat: 33.2, lng: 44.0, zoom: 6 },
    TR: { lat: 39.0, lng: 35.0, zoom: 5 },
    US: { lat: 39.8, lng: -98.5, zoom: 4 },
    GB: { lat: 54.0, lng: -2.0, zoom: 5 },
  };
  return centers[code] ?? centers.EG;
}
