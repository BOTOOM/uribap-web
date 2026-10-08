import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { MealPlanEntryForm } from "@/components/planning/MealPlanEntryForm";
import { MealPlanTransitionBar } from "@/components/planning/MealPlanTransitionBar";
import { CompletedMealsList } from "@/components/completion/CompletedMealsList";
import { MealEntryDetailView } from "@/components/planning/MealEntryDetail";
import { SkipMealButton } from "@/components/planning/SkipMealButton";
import type { components } from "@/lib/api/generated/schema";

type MealCompletion = components["schemas"]["MealCompletionResponse"];
type MealEntryDetail = components["schemas"]["MealPlanEntryDetailResponse"];

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => "planning-a11y-key" });
});

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

const COMPLETION: MealCompletion = {
  id: "completion-1",
  state: "recorded",
  outcome: "cooked",
  outcome_note: null,
  version: 1,
  meal_plan_entry_id: "entry-1",
  planned_date: "2026-09-30",
  meal_type: "dinner",
  recipe_version_id: "version-1",
  recipe_name: "Caldo de pollo",
  lines: [
    {
      id: "line-1",
      ingredient_id: "ingredient-1",
      ingredient_name: "Pollo",
      actual_amount: "300.000000",
      planned_amount: "300.000000",
      unit: "g",
      optional: false,
      position: 0,
    },
  ],
  completed_by_user_id: "user-1",
  completed_at: "2026-09-30T18:00:00Z",
  reopened_by_user_id: null,
  reopened_at: null,
  reopen_reason: null,
  created_at: "2026-09-30T18:00:00Z",
  updated_at: "2026-09-30T18:00:00Z",
};

const ENTRY_DETAIL: MealEntryDetail = {
  plan_id: "plan-1",
  entry_id: "entry-1",
  recipe_id: "recipe-1",
  recipe_version_id: "version-1",
  recipe_name: "Caldo de pollo",
  recipe_description: "1. Hervir el pollo.\n2. Añadir las verduras.",
  prep_minutes: 35,
  servings: 2,
  base_servings: 4,
  notes: null,
  plan_state: "approved",
  planned_date: "2026-09-30",
  meal_type: "dinner",
  version_number: 1,
  completion: null,
  ingredients: [
    {
      ingredient_id: "ingredient-1",
      ingredient_name: "Pollo",
      required_amount: "300.000000",
      unit: "g",
      optional: false,
      on_hand_amount: "100.000000",
      shortfall_amount: "200.000000",
      position: 0,
      pantry_staple: false,
    },
  ],
};

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

  it("exposes pending approved detail headings and actions", () => {
    render(<MealEntryDetailView detail={ENTRY_DETAIL} planId="plan-1" version={1} />);

    expect(screen.getByRole("heading", { name: "Ingredientes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preparación" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Marcar como cocinada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pedimos domicilio" }),
    ).toBeInTheDocument();
  });

  it("announces cooked detail and its inventory state", () => {
    render(
      <MealEntryDetailView
        detail={{ ...ENTRY_DETAIL, completion: COMPLETION }}
        planId="plan-1"
        version={1}
      />,
    );

    expect(
      screen.getByText(
        "Se descontaron los ingredientes consumibles. Los básicos de despensa no se descuentan.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Cocinada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reabrir" })).toBeInTheDocument();
  });

  it("labels the reason input when the skip form is expanded", () => {
    render(<SkipMealButton entryId="entry-1" planId="plan-1" />);
    const trigger = screen.getByRole("button", { name: "Pedimos domicilio" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("¿Qué pasó? (opcional)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("provides accessible completion-history outcomes and actions", () => {
    const skipped: MealCompletion = {
      ...COMPLETION,
      id: "completion-2",
      outcome: "skipped",
      outcome_note: "Pedimos domicilio",
      lines: [],
    };
    const reopened: MealCompletion = {
      ...COMPLETION,
      id: "completion-3",
      state: "reopened",
      reopen_reason: "Se canceló la cena",
    };

    render(<CompletedMealsList completions={[COMPLETION, skipped, reopened]} />);

    expect(screen.getByRole("heading", { name: "Comidas registradas" })).toBeInTheDocument();
    expect(screen.getAllByText("Cocinada").length).toBeGreaterThan(0);
    expect(screen.getByText("Domicilio")).toBeInTheDocument();
    expect(screen.getByText("Reabierta: Se canceló la cena")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Reabrir" })).toHaveLength(2);
  });
});
