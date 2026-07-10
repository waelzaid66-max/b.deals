import type {
  SearchListingsFuelType,
  SearchListingsTransmission,
  SearchListingsIndustry,
  SearchListingsOriginType,
} from "@workspace/api-client-react";
import type { Category, IndustrialType } from "@workspace/taxonomy/categories";

/** Result ordering — mirrors the backend SearchListingsSort enum 1:1. */
export type SearchSort =
  | "recommended"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular";

export type PaymentType = "any" | "installment";

/** Default radius when the user enables "Near me" (km). */
export const DEFAULT_NEAR_RADIUS_KM = 25;

/**
 * Committed search criteria shared by mobile and web. Every field maps to a
 * real backend-supported query param via `buildSearchParams`.
 */
export interface SearchCriteria {
  q: string;
  category: Category;
  engineKey: string;
  sort: SearchSort;
  minPrice: string;
  maxPrice: string;
  location: string;
  paymentType: PaymentType;
  rentalTerm: string | null;
  brand: string | null;
  model: string | null;
  fuelType: SearchListingsFuelType | null;
  transmission: SearchListingsTransmission | null;
  minYear: string;
  maxYear: string;
  industry: SearchListingsIndustry | null;
  originType: SearchListingsOriginType | null;
  /** Commodity material slug (specs.material) — materials company only. */
  material: string | null;
  industrialType: IndustrialType;
  /** ISO market country — sent as market_country and scopes list + map inventory. */
  marketCountry: string;
  nearMeEnabled: boolean;
  nearLat: number | null;
  nearLng: number | null;
  nearRadiusKm: number;
}

export const DEFAULT_CRITERIA: SearchCriteria = {
  q: "",
  category: "all",
  engineKey: "all",
  sort: "recommended",
  minPrice: "",
  maxPrice: "",
  location: "",
  paymentType: "any",
  rentalTerm: null,
  brand: null,
  model: null,
  fuelType: null,
  transmission: null,
  minYear: "",
  maxYear: "",
  industry: null,
  originType: null,
  material: null,
  industrialType: "all",
  marketCountry: "EG",
  nearMeEnabled: false,
  nearLat: null,
  nearLng: null,
  nearRadiusKm: DEFAULT_NEAR_RADIUS_KM,
};

/**
 * Section-scoped attributes cleared when the browse company changes
 * (mobile category tabs + web SearchControls). Prevents fuel/rent/material
 * leaking across car ↔ RE ↔ facilities ↔ materials.
 */
export const CLEAR_SECTION_ATTRS: Partial<SearchCriteria> = {
  engineKey: "all",
  brand: null,
  model: null,
  fuelType: null,
  transmission: null,
  minYear: "",
  maxYear: "",
  industry: null,
  originType: null,
  material: null,
  industrialType: "all",
  rentalTerm: null,
};

export function hasActiveCriteria(c: SearchCriteria): boolean {
  return (
    !!c.q.trim() ||
    c.category !== "all" ||
    c.engineKey !== "all" ||
    c.sort !== "recommended" ||
    !!c.minPrice ||
    !!c.maxPrice ||
    !!c.location ||
    c.paymentType !== "any" ||
    !!c.rentalTerm ||
    !!c.brand ||
    !!c.model ||
    !!c.fuelType ||
    !!c.transmission ||
    !!c.minYear ||
    !!c.maxYear ||
    !!c.industry ||
    !!c.originType ||
    !!c.material ||
    c.industrialType !== "all" ||
    c.marketCountry !== DEFAULT_CRITERIA.marketCountry ||
    c.nearMeEnabled
  );
}

export function criteriaKey(c: SearchCriteria): string {
  return JSON.stringify([
    c.q.trim(),
    c.category,
    c.engineKey,
    c.sort,
    c.minPrice,
    c.maxPrice,
    c.location.trim(),
    c.paymentType,
    c.rentalTerm,
    c.brand,
    c.model,
    c.fuelType,
    c.transmission,
    c.minYear,
    c.maxYear,
    c.industry,
    c.originType,
    c.material,
    c.industrialType,
    c.marketCountry,
    c.nearMeEnabled,
    c.nearLat,
    c.nearLng,
    c.nearRadiusKm,
  ]);
}
