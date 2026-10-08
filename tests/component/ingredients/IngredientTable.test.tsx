import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/toast", () => ({ toast: vi.fn() }));

import { IngredientTable } from "@/components/ingredients/IngredientTable";
import type { components } from "@/lib/api/generated/schema";

type Ingredient = components["schemas"]["IngredientResponse"];

const HOUSEHOLD_STAPLE: Ingredient = {
  archived_at: null,
  base_unit: "ml",
  category: "Aceites",
  dimension: "volume",
  household_id: "household-1",
  id: "ingredient-1",
  name: "Aceite",
  normalized_name: "aceite",
  pantry_staple: true,
};

const HOUSEHOLD_REGULAR: Ingredient = {
  ...HOUSEHOLD_STAPLE,
  id: "ingredient-2",
  name: "Harina",
  normalized_name: "harina",
  pantry_staple: false,
};

const GLOBAL_INGREDIENT: Ingredient = {
  ...HOUSEHOLD_STAPLE,
  household_id: null,
  id: "ingredient-3",
  name: "Sal",
  normalized_name: "sal",
  pantry_staple: false,
};

describe("IngredientTable", () => {
  it("shows the staple badge only for flagged ingredients", () => {
    render(
      <IngredientTable
        ingredients={[HOUSEHOLD_STAPLE, HOUSEHOLD_REGULAR, GLOBAL_INGREDIENT]}
      />,
    );

    const stapleRow = screen.getByText("Aceite").closest("tr")!;
    const regularRow = screen.getByText("Harina").closest("tr")!;
    const globalRow = screen.getByText("Sal").closest("tr")!;
    expect(within(stapleRow).getByText("Básico")).toBeInTheDocument();
    expect(within(regularRow).queryByText("Básico")).not.toBeInTheDocument();
    expect(within(globalRow).queryByText("Básico")).not.toBeInTheDocument();
  });

  it("offers edit only for household-owned ingredients", () => {
    render(
      <IngredientTable ingredients={[HOUSEHOLD_STAPLE, GLOBAL_INGREDIENT]} />,
    );

    expect(
      screen.getByRole("button", { name: "Editar Aceite" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Sal" })).not.toBeInTheDocument();
  });
});
