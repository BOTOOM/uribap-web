import type { components } from "@/lib/api/generated/schema";

export type IngredientDimension = components["schemas"]["IngredientDimension"];
export type IngredientResponse = components["schemas"]["IngredientResponse"];

export type CatalogIngredient = {
  id: string;
  name: string;
  dimension: IngredientDimension;
  base_unit: string;
};

export const DIMENSION_LABELS: Record<IngredientDimension, string> = {
  count: "Unidades",
  mass: "Peso",
  volume: "Volumen",
};

export const UNITS_BY_DIMENSION: Record<IngredientDimension, string[]> = {
  count: ["unit"],
  mass: ["g", "kg"],
  volume: ["ml", "l"],
};
