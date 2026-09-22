import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { PlanBoard } from "@/components/planning/PlanBoard";

const ENTRY = {
  id: "entry-1",
  plannedDate: "2026-09-28",
  mealType: "dinner" as const,
  servings: 2,
  notes: null,
  recipeName: "Arroz con pollo",
  completed: false,
};

describe("planner motion contract", () => {
  it("keeps content available without depending on animation", () => {
    render(
      <PlanBoard
        entries={[ENTRY]}
        ingredients={[]}
        planId="plan-1"
        state="draft"
        today="2026-09-28"
        version={1}
        versions={[]}
        weekStart="2026-09-28"
      />,
    );

    expect(
      screen.getByRole("tablist", { name: "Días de la semana" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(screen.getByText("Arroz con pollo")).toBeVisible();
  });
});
