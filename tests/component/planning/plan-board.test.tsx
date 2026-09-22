import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { PlanBoard, type BoardEntry } from "@/components/planning/PlanBoard";

const ENTRY: BoardEntry = {
  id: "entry-1",
  plannedDate: "2026-09-28",
  mealType: "dinner",
  servings: 2,
  notes: "Sin picante",
  recipeName: "Arroz con pollo",
  completed: false,
};

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

function renderBoard(overrides: Partial<Parameters<typeof PlanBoard>[0]> = {}) {
  return render(
    <PlanBoard
      entries={[ENTRY]}
      planId="plan-1"
      state="draft"
      today="2026-09-28"
      version={1}
      versions={VERSIONS}
      weekStart="2026-09-28"
      {...overrides}
    />,
  );
}

describe("weekly plan board", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("shows seven days and selects a meal card for its detail", () => {
    renderBoard();

    expect(screen.getAllByRole("tab")).toHaveLength(7);
    const card = screen.getByRole("button", { name: /arroz con pollo/i });
    fireEvent.click(card);
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2 · Sin picante")).toBeInTheDocument();
    expect(screen.getByText(/Planeada — demanda proyectada/)).toBeInTheDocument();
  });

  it("opens the add-meal dialog for an empty slot", async () => {
    renderBoard();

    fireEvent.click(
      screen.getAllByRole("button", { name: /añadir comida el/i })[0],
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Receta")).toBeInTheDocument();
    expect(screen.getByLabelText("Raciones")).toBeInTheDocument();
  });

  it("offers completion instead of editing on approved plans", () => {
    renderBoard({ state: "approved" });

    const card = screen.getByRole("button", { name: /arroz con pollo/i });
    fireEvent.click(card);
    expect(
      screen.getByText(/Aprobada — lista para cocinar/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /añadir comida el/i }),
    ).not.toBeInTheDocument();
  });
});
