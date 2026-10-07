import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { HomeMealList, type HomeMealRow } from "@/components/dashboard/HomeMealList";
import type { components } from "@/lib/api/generated/schema";

type MealEntryDetail = components["schemas"]["MealPlanEntryDetailResponse"];

const ROWS: HomeMealRow[] = [
  {
    id: "entry-cooked",
    mealLabel: "Desayuno",
    recipeName: "Avena con fruta",
    servings: 2,
    outcome: "cooked",
    completionVersion: 3,
  },
  {
    id: "entry-skipped",
    mealLabel: "Almuerzo",
    recipeName: "Sopa de lentejas",
    servings: 4,
    outcome: "skipped",
    completionVersion: 2,
  },
  {
    id: "entry-pending",
    mealLabel: "Cena",
    recipeName: "Ensalada tibia",
    servings: 3,
    outcome: null,
    completionVersion: null,
  },
];

const DETAIL: MealEntryDetail = {
  plan_id: "plan-1",
  entry_id: "entry-pending",
  recipe_id: "recipe-1",
  recipe_version_id: "version-1",
  recipe_name: "Ensalada tibia",
  recipe_description: "Cocinar las verduras y servir.",
  prep_minutes: 20,
  servings: 3,
  base_servings: 3,
  notes: null,
  plan_state: "draft",
  planned_date: "2026-09-28",
  meal_type: "dinner",
  version_number: 1,
  completion: null,
  ingredients: [],
};

function renderHomeMealList(
  overrides: Partial<Parameters<typeof HomeMealList>[0]> = {},
) {
  return render(
    <HomeMealList
      emptyLabel="No hay comidas."
      planId="plan-1"
      planState="draft"
      planVersion={7}
      rows={ROWS}
      {...overrides}
    />,
  );
}

describe("home meal list", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ detail: DETAIL })));
  });

  it("renders meal labels, names, servings, and recorded outcome states", () => {
    renderHomeMealList();

    expect(screen.getByText("Desayuno")).toBeInTheDocument();
    expect(screen.getByText("Avena con fruta")).toBeInTheDocument();
    expect(screen.getByText("2 raciones")).toBeInTheDocument();
    expect(screen.getByText("Cocinada")).toHaveClass("status", "completed");
    expect(screen.getByText("Cocinada").querySelector("svg")).toBeInTheDocument();

    expect(screen.getByText("Almuerzo")).toBeInTheDocument();
    expect(screen.getByText("Sopa de lentejas")).toBeInTheDocument();
    expect(screen.getByText("4 raciones")).toBeInTheDocument();
    expect(screen.getByText("Domicilio")).toHaveClass("status", "neutral");

    expect(screen.getByText("Cena")).toBeInTheDocument();
    expect(screen.getByText("Ensalada tibia")).toBeInTheDocument();
    expect(screen.getByText("3 raciones")).toBeInTheDocument();
    expect(screen.getByText("Planeada")).toHaveClass("status", "available");

    for (const row of screen.getAllByRole("button")) {
      expect(row).toHaveAttribute("aria-haspopup", "dialog");
    }
  });

  it("opens the existing detail and fetches the selected plan entry", async () => {
    const fetchMock = vi.fn(async () => Response.json({ detail: DETAIL }));
    vi.stubGlobal("fetch", fetchMock);
    renderHomeMealList();

    fireEvent.click(screen.getByRole("button", { name: /ensalada tibia/i }));

    expect(
      await screen.findByRole("dialog", { name: "Detalle de la comida" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Ensalada tibia" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plans/plan-1/entries/entry-pending/detail",
      expect.anything(),
    );
  });

  it("shows the empty label when there are no rows", () => {
    renderHomeMealList({ rows: [] });

    expect(screen.getByText("No hay comidas.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the empty label and cannot open a detail without a plan", () => {
    renderHomeMealList({
      planId: null,
      planState: null,
      planVersion: null,
      rows: ROWS,
    });

    expect(screen.getByText("No hay comidas.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
