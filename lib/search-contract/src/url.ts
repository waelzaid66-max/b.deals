import type { Category } from "@workspace/taxonomy/categories";
import { buildSearchParams } from "./buildSearchParams";
import {
  DEFAULT_CRITERIA,
  DEFAULT_NEAR_RADIUS_KM,
  type PaymentType,
  type SearchCriteria,
  type SearchSort,
} from "./types";

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asNumber(value: SearchParamValue): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asCategory(value: SearchParamValue): Category {
  const raw = first(value);
  if (
    raw === "car" ||
    raw === "real_estate" ||
    raw === "facilities" ||
    raw === "materials" ||
    raw === "all"
  ) {
    return raw;
  }
  if (raw === "industrial") return "facilities";
  return DEFAULT_CRITERIA.category;
}

function asSort(value: SearchParamValue): SearchSort {
  const raw = first(value);
  if (
    raw === "recommended" ||
    raw === "newest" ||
    raw === "price_asc" ||
    raw === "price_desc" ||
    raw === "popular"
  ) {
    return raw;
  }
  return DEFAULT_CRITERIA.sort;
}

function asPaymentType(value: SearchParamValue): PaymentType {
  const raw = first(value);
  return raw === "installment" ? "installment" : "any";
}

/**
 * Parse URL search params into committed SearchCriteria (web + shared contract).
 */
export function parseSearchCriteriaFromUrl(
  searchParams: SearchParamRecord,
): SearchCriteria {
  const nearLat = asNumber(searchParams.near_lat);
  const nearLng = asNumber(searchParams.near_lng);
  const nearMeEnabled = nearLat != null && nearLng != null;

  return {
    ...DEFAULT_CRITERIA,
    q: first(searchParams.q) ?? "",
    category: asCategory(searchParams.category),
    engineKey: first(searchParams.engine) ?? DEFAULT_CRITERIA.engineKey,
    sort: asSort(searchParams.sort),
    minPrice: first(searchParams.min_price) ?? "",
    maxPrice: first(searchParams.max_price) ?? "",
    location: first(searchParams.location) ?? "",
    paymentType: asPaymentType(searchParams.payment_type),
    rentalTerm: first(searchParams.rental_term) ?? null,
    brand: first(searchParams.brand) ?? null,
    model: first(searchParams.model) ?? null,
    fuelType: (first(searchParams.fuel_type) as SearchCriteria["fuelType"]) ?? null,
    transmission:
      (first(searchParams.transmission) as SearchCriteria["transmission"]) ?? null,
    minYear: first(searchParams.min_year) ?? "",
    maxYear: first(searchParams.max_year) ?? "",
    industry: (first(searchParams.industry) as SearchCriteria["industry"]) ?? null,
    originType:
      (first(searchParams.origin_type) as SearchCriteria["originType"]) ?? null,
    material: first(searchParams.material) ?? null,
    industrialType:
      (first(searchParams.industrial_type) as SearchCriteria["industrialType"]) ??
      DEFAULT_CRITERIA.industrialType,
    marketCountry:
      first(searchParams.market_country)?.trim().toUpperCase() ||
      DEFAULT_CRITERIA.marketCountry,
    nearMeEnabled,
    nearLat: nearLat ?? null,
    nearLng: nearLng ?? null,
    nearRadiusKm: asNumber(searchParams.radius_km) ?? DEFAULT_NEAR_RADIUS_KM,
  };
}

export type WebUrlOptions = {
  cursor?: string;
  limit?: number;
  view?: "list" | "map";
};

/** Build URLSearchParams from committed criteria using the shared API mapper. */
export function buildSearchUrlParams(
  criteria: SearchCriteria,
  options: WebUrlOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const apiParams = buildSearchParams(criteria, options.cursor, options.limit ?? 20);

  for (const [key, value] of Object.entries(apiParams)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  if (criteria.engineKey !== "all") {
    params.set("engine", criteria.engineKey);
  }

  if (criteria.paymentType === "installment") {
    params.set("payment_type", "installment");
  }

  if (options.view === "map") {
    params.set("view", "map");
  }

  return params;
}
