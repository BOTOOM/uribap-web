import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { MealPlanEntryForm } from "@/components/planning/MealPlanEntryForm";
import { MealPlanTransitionBar } from "@/components/planning/MealPlanTransitionBar";

const VERSIONS = [
  {
    recipe_version_id: "11111111-1111-1111-1111-111111111111",
    recipe_id: "22222222-2222-2222-2222-222222222222",
    recipe_name: "Arroz con pollo",
    version_number: 1,
    base_servings: 4,
    prep_minutes: 40,
  },
];

const INGREDIENTS = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Arroz",
    dimension: "mass" as const,
    base_unit: "g",
  },
];

describe("meal planning accessibility", () => {
  it("keeps entry form controls associated with visible labels", () => {
    render(
      <MealPlanEntryForm
        ingredients={INGREDIENTS}
        planId="plan-1"
        weekStart="2026-09-28"
        version={1}
        versions={VERSIONS}
      />,
    );
    expect(
      screen.getByRole("listbox", { name: "Recetas disponibles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /arroz con pollo/i }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Día")).toBeInTheDocument();
    expect(screen.getByLabelText("Comida")).toBeInTheDocument();
    expect(screen.getByLabelText("Raciones")).toBeInTheDocument();
  });

  it("keeps the inline recipe and ingredient creators labelled", () => {
    render(
      <MealPlanEntryForm
        ingredients={INGREDIENTS}
        planId="plan-1"
        weekStart="2026-09-28"
        version={1}
        versions={VERSIONS}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /crear una receta/i }));
    expect(screen.getByLabelText("Nombre de la receta")).toBeInTheDocument();
    expect(screen.getByLabelText("Raciones base")).toBeInTheDocument();
    expect(screen.getByLabelText(/tiempo estimado/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Ingrediente")).toBeInTheDocument();
    expect(screen.getByLabelText(/cantidad/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /crear ingrediente nuevo/i }));
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Dimensión")).toBeInTheDocument();
    expect(screen.getByLabelText("Unidad base")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver a la receta" }),
    ).toBeInTheDocument();
  });

  it("groups transition actions under a named group", () => {
    render(<MealPlanTransitionBar planId="plan-1" state="draft" version={1} />);
    expect(screen.getByRole("group", { name: "Acciones del plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proponer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivar" })).toBeInTheDocument();
  });
});
