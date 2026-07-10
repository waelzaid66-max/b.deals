import type { Category } from "@workspace/taxonomy/categories";

/**
 * Per-section accent tokens — each browse category is its own "company"
 * visually, not only on Discover cards. Accents stay in the BANCO red/charcoal
 * family so publish chrome never fights brand, but active Search tabs/chips
 * shift enough that cars ≠ real-estate ≠ facilities ≠ materials.
 */
export const SECTION_ACCENT: Record<Category, string> = {
  all: "#7A0C12",
  car: "#8A0E14",
  real_estate: "#7A1840",
  facilities: "#6A1410",
  materials: "#7A2A0C",
};

export function sectionAccent(category: Category | null | undefined): string {
  if (!category) return SECTION_ACCENT.all;
  return SECTION_ACCENT[category] ?? SECTION_ACCENT.all;
}
