import { describe, expect, it } from "vitest";

import { parseRecipeDescription } from "@/components/planning/MealEntryDetail";

describe("parseRecipeDescription", () => {
  it("separates numbered preparation steps from recipe notes", () => {
    expect(
      parseRecipeDescription(
        [
          "Rinde 2 porciones. Equipo: olla a presión Black and Decker ...",
          "1. Cocinar la media pechuga ...",
          "2. Rallar la zanahoria ...",
          "Porciones: ella 3 rolls; él 5 rolls. Fuente: ...",
        ].join("\n"),
      ),
    ).toEqual({
      notes: [
        "Rinde 2 porciones. Equipo: olla a presión Black and Decker ...",
        "Porciones: ella 3 rolls; él 5 rolls. Fuente: ...",
      ],
      steps: ["Cocinar la media pechuga ...", "Rallar la zanahoria ..."],
    });
  });

  it("keeps legacy unnumbered lines as preparation steps", () => {
    expect(parseRecipeDescription("Calentar el caldo.\nAgregar sal.")).toEqual({
      notes: [],
      steps: ["Calentar el caldo.", "Agregar sal."],
    });
  });

  it("strips bullet markers when there are no numbered lines", () => {
    expect(parseRecipeDescription("  - Lavar las verduras.\n• Cortarlas.")).toEqual({
      notes: [],
      steps: ["Lavar las verduras.", "Cortarlas."],
    });
  });

  it("returns empty collections for null and empty descriptions", () => {
    expect(parseRecipeDescription(null)).toEqual({ notes: [], steps: [] });
    expect(parseRecipeDescription(" \n  ")).toEqual({ notes: [], steps: [] });
  });
});
