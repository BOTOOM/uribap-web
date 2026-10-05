import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { CompletedMealsList } from "@/components/completion/CompletedMealsList";
import type { components } from "@/lib/api/generated/schema";

type Completion = components["schemas"]["MealCompletionResponse"];

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => "completion-history-key" });
});

const COOKED: Completion = {
  id: "cooked-1",
  state: "recorded",
  outcome: "cooked",
  outcome_note: null,
  version: 2,
  meal_plan_entry_id: "entry-1",
  planned_date: "2026-09-30",
  meal_type: "dinner",
  recipe_version_id: "version-1",
  recipe_name: "Caldo de pollo",
  lines: [
    {
      id: "line-1",
      ingredient_id: "chicken",
      ingredient_name: "Pollo",
      actual_amount: "250.000000",
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

const SKIPPED: Completion = {
  ...COOKED,
  id: "skipped-1",
  state: "recorded",
  outcome: "skipped",
  outcome_note: "Pedimos domicilio",
  planned_date: "2026-10-01",
  meal_type: "dinner",
  lines: [],
};

const REOPENED: Completion = {
  ...COOKED,
  id: "reopened-1",
  state: "reopened",
  reopen_reason: "Se canceló la cena",
  meal_type: "breakfast",
};

describe("CompletedMealsList", () => {
  it("renders cooked, skipped, and reopened outcomes with correction and reopen actions", () => {
    const { container } = render(
      <CompletedMealsList completions={[REOPENED, SKIPPED, COOKED]} />,
    );

    expect(screen.getByRole("heading", { name: "Comidas registradas" })).toBeInTheDocument();
    expect(screen.getByText("Domicilio")).toBeInTheDocument();
    expect(screen.getByText("Pedimos domicilio")).toBeInTheDocument();
    expect(screen.getByText("Reabierta: Se canceló la cena")).toBeInTheDocument();
    expect(screen.getAllByText("Ingredientes usados (1)")).toHaveLength(2);
    expect(screen.getAllByText(/250 g/)).toHaveLength(2);
    expect(screen.getAllByText(/plan: 300 g/)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Corregir" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Reabrir" })).toHaveLength(2);
    expect(container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("sorts by date descending, then by meal order", () => {
    const later: Completion = {
      ...SKIPPED,
      id: "later",
      planned_date: "2026-10-01",
      meal_type: "dinner",
      recipe_name: "Cena del jueves",
    };
    const sameDateDinner: Completion = {
      ...COOKED,
      id: "same-dinner",
      planned_date: "2026-09-30",
      meal_type: "dinner",
      recipe_name: "Cena del miércoles",
    };
    const sameDateBreakfast: Completion = {
      ...COOKED,
      id: "same-breakfast",
      planned_date: "2026-09-30",
      meal_type: "breakfast",
      recipe_name: "Desayuno del miércoles",
    };
    const { container } = render(
      <CompletedMealsList completions={[sameDateDinner, later, sameDateBreakfast]} />,
    );
    const names = Array.from(container.querySelectorAll(".completed-meal")).map((card) =>
      card.textContent?.trim(),
    );

    expect(names[0]).toContain("Cena del jueves");
    expect(names[1]).toContain("Desayuno del miércoles");
    expect(names[2]).toContain("Cena del miércoles");
  });

  it("falls back to neutral copy for skipped and reopened records", () => {
    render(
      <CompletedMealsList
        completions={[
          { ...SKIPPED, outcome_note: null },
          { ...REOPENED, reopen_reason: null },
        ]}
      />,
    );

    expect(screen.getByText("Sin descontar inventario.")).toBeInTheDocument();
    expect(screen.getByText("Reabierta")).toBeInTheDocument();
  });

  it("shows completion history errors as an alert", () => {
    render(<CompletedMealsList completions={[]} error="No se pudo cargar el historial." />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el historial.");
  });
});
