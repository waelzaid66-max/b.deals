/**
 * Pure unit tests for commodity-material API gate (no DB).
 * Run from api-server:
 *   node --import tsx --test src/services/allowCommodityMaterialFilter.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { allowCommodityMaterialFilter } from "./allowCommodityMaterialFilter.ts";

test("allows material on industrial / materials browse", () => {
  assert.equal(
    allowCommodityMaterialFilter({
      category: "industrial",
      industrial_type: ["raw_material"],
      material: "steel",
    }),
    true,
  );
  assert.equal(
    allowCommodityMaterialFilter({
      category: "industrial",
      industrial_type: ["production_line", "raw_material", "machine"],
      material: "steel",
    }),
    true,
  );
  assert.equal(allowCommodityMaterialFilter({ material: "steel" }), true);
});

test("rejects material on car / real_estate", () => {
  assert.equal(
    allowCommodityMaterialFilter({ category: "car", material: "steel" }),
    false,
  );
  assert.equal(
    allowCommodityMaterialFilter({
      category: "real_estate",
      material: "steel",
    }),
    false,
  );
});

test("rejects material when industrial_type is facilities-only", () => {
  assert.equal(
    allowCommodityMaterialFilter({
      category: "industrial",
      industrial_type: ["factory", "warehouse"],
      material: "steel",
    }),
    false,
  );
  assert.equal(
    allowCommodityMaterialFilter({
      category: "industrial",
      industrial_type: ["land"],
      material: "steel",
    }),
    false,
  );
});

test("rejects when material missing", () => {
  assert.equal(
    allowCommodityMaterialFilter({ category: "industrial" }),
    false,
  );
});
