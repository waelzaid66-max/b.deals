import type {
  SearchListingsFuelType,
  SearchListingsTransmission,
} from "@workspace/api-client-react";
import type { Category, IndustrialType } from "@workspace/taxonomy/categories";

import { enginesForCategory } from "./engines";
import { CLEAR_SECTION_ATTRS, type SearchCriteria } from "./types";

/**
 * Map a facet bucket click into committed search criteria (URL-safe).
 * Shared by web facets panel and any future mobile facet UX.
 */
export function applyFacetToCriteria(
  criteria: SearchCriteria,
  section: string,
  value: string,
): SearchCriteria {
  const next = { ...criteria };

  if (section === "category") {
    const cat = value as Category;
    if (
      cat === "car" ||
      cat === "real_estate" ||
      cat === "facilities" ||
      cat === "materials" ||
      cat === "all"
    ) {
      // Same wipe as SearchControls / mobile category tabs — never keep fuel,
      // rent term, material, or industry when the browse company changes.
      Object.assign(next, CLEAR_SECTION_ATTRS);
      next.category = cat;
    }
    return next;
  }

  if (section === "condition") {
    if (value === "new" || value === "used") {
      next.engineKey = value;
    }
    return next;
  }

  if (section === "offer_type") {
    if (value === "sale" || value === "rent") {
      next.engineKey = value;
      if (value === "sale") next.rentalTerm = null;
    }
    return next;
  }

  if (section === "payment_plan" || section === "payment") {
    const engines = enginesForCategory(next.category as Category) ?? [];
    const match = engines.find((e) => e.params.payment_plan === value);
    if (match) next.engineKey = match.key;
    return next;
  }

  if (section === "property_type") {
    const engines = enginesForCategory(next.category as Category) ?? [];
    const match = engines.find((e) => e.params.property_type === value);
    if (match) next.engineKey = match.key;
    return next;
  }

  if (section === "industrial_type") {
    next.industrialType = value as IndustrialType;
    if (
      next.category === "materials" &&
      (value === "all" || value === "raw_material")
    ) {
      next.industry = null;
    }
    if (
      next.category === "materials" &&
      value !== "all" &&
      value !== "raw_material"
    ) {
      next.material = null;
    }
    return next;
  }

  if (section === "fuel_type") {
    if (next.category !== "car") return next;
    next.fuelType = value as SearchListingsFuelType;
    next.engineKey = "all";
    return next;
  }

  if (section === "transmission") {
    if (next.category !== "car") return next;
    next.transmission = value as SearchListingsTransmission;
    next.engineKey = "all";
    return next;
  }

  return next;
}
