import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { PlanBoard, type BoardEntry } from "@/components/planning/PlanBoard";
import type { components } from "@/lib/api/generated/schema";

type MealEntryDetail = components["schemas"]["MealPlanEntryDetailResponse"];

const ENTRY: BoardEntry = {
  id: "entry-1",
  plannedDate: "2026-09-28",
  mealType: "dinner",
  servings: 2,
  notes: "Sin picante",
  recipeName: "Arroz con pollo",
  outcome: null,
  completed: false,
  completionVersion: null,
};

const DETAIL: MealEntryDetail = {
  plan_id: "plan-1",
  entry_id: "entry-1",
  recipe_id: "recipe-1",
  recipe_version_id: "version-1",
  recipe_name: "Arroz con pollo",
  recipe_description: "Cocinar el arroz.",
  prep_minutes: 20,
  servings: 2,
  base_servings: 2,
  notes: null,
  plan_state: "draft",
  planned_date: "2026-09-28",
  meal_type: "dinner",
  version_number: 1,
  completion: null,
  ingredients: [],
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

const INGREDIENTS = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Arroz",
    dimension: "mass" as const,
    base_unit: "g",
  },
];

function renderBoard(overrides: Partial<Parameters<typeof PlanBoard>[0]> = {}) {
  return render(
    <PlanBoard
      entries={[ENTRY]}
      ingredients={INGREDIENTS}
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

function mockCreateFlow() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/detail")) {
      return Response.json({ detail: DETAIL });
    }
    if (url === "/api/recipes" && init?.method === "POST") {
      return Response.json(
        { id: "recipe-new", name: "Huevos rancheros", latest_version: 1 },
        { status: 201 },
      );
    }
    if (url.endsWith("/versions/1/ingredients") && init?.method === "PUT") {
      return Response.json({ items: [] });
    }
    if (url.endsWith("/versions/1/publish")) {
      return Response.json({ recipe_id: "recipe-new", state: "published", version: 2 });
    }
    if (url === "/api/recipes/published-versions") {
      return Response.json({
        items: [
          {
            recipe_version_id: "44444444-4444-4444-4444-444444444444",
            recipe_id: "recipe-new",
            recipe_name: "Huevos rancheros",
            version_number: 1,
            base_servings: 2,
            prep_minutes: 20,
          },
        ],
      });
    }
    if (url === "/api/ingredients" && init?.method === "POST") {
      const payload = JSON.parse(String(init.body)) as { name: string };
      return Response.json(
        {
          id: "55555555-5555-5555-5555-555555555555",
          name: payload.name,
          dimension: "mass",
          base_unit: "g",
        },
        { status: 201 },
      );
    }
    return Response.json({ detail: "unexpected" }, { status: 500 });
  });
}

describe("weekly plan board", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ detail: DETAIL })),
    );
  });

  it("selects the first pending meal by meal order when entries arrive out of order", () => {
    const completedBreakfast: BoardEntry = {
      ...ENTRY,
      id: "completed-breakfast",
      mealType: "breakfast",
      recipeName: "Avena",
      outcome: "cooked",
      completed: true,
    };
    const pendingLunch: BoardEntry = {
      ...ENTRY,
      id: "pending-lunch",
      mealType: "lunch",
      recipeName: "Sopa de lentejas",
    };
    const pendingDinner: BoardEntry = {
      ...ENTRY,
      id: "pending-dinner",
      recipeName: "Arroz con pollo",
    };
    renderBoard({
      entries: [pendingDinner, completedBreakfast, pendingLunch],
      state: "approved",
    });

    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(
      screen.getByRole("button", { name: /sopa de lentejas/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /avena/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("refetches meal detail when a recorded completion version changes", async () => {
    const recordedEntry: BoardEntry = {
      ...ENTRY,
      outcome: "cooked",
      completed: true,
      completionVersion: 3,
    };
    const correctedEntry = { ...recordedEntry, completionVersion: 4 };
    const fetchMock = vi.fn(async () => Response.json({ detail: DETAIL }));
    vi.stubGlobal("fetch", fetchMock);
    const props = {
      entries: [recordedEntry],
      ingredients: INGREDIENTS,
      planId: "plan-1",
      state: "approved" as const,
      today: "2026-09-28",
      version: 1,
      versions: VERSIONS,
      weekStart: "2026-09-28",
    };
    const view = render(<PlanBoard {...props} />);

    expect(await screen.findByRole("heading", { name: "Arroz con pollo" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    view.rerender(<PlanBoard {...props} entries={[correctedEntry]} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("shows weekday initials, dates, meal counts, and dots for populated days", () => {
    renderBoard();

    const populatedDay = screen.getByRole("tab", {
      name: "lunes 28 de septiembre, 1 comidas",
    });
    const emptyDay = screen.getByRole("tab", {
      name: "miércoles 30 de septiembre, 0 comidas",
    });

    expect(populatedDay).toHaveTextContent("L");
    expect(populatedDay).toHaveTextContent("28");
    expect(populatedDay).toHaveClass("today");
    expect(populatedDay.querySelector(".day-picker-dot")).toBeInTheDocument();
    expect(emptyDay.querySelector(".day-picker-dot")).not.toBeInTheDocument();
  });

  it("selects the first meal of today when all today's meals are recorded", () => {
    const cookedBreakfast: BoardEntry = {
      ...ENTRY,
      id: "cooked-breakfast",
      mealType: "breakfast",
      recipeName: "Avena",
      outcome: "cooked",
      completed: true,
    };
    const skippedDinner: BoardEntry = {
      ...ENTRY,
      id: "skipped-dinner",
      outcome: "skipped",
      completed: true,
    };
    renderBoard({ entries: [skippedDinner, cookedBreakfast] });

    expect(
      screen.getByRole("button", { name: /avena/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("selects the day's first meal when its mobile tab is tapped", () => {
    const firstTuesday: BoardEntry = {
      ...ENTRY,
      id: "tuesday-breakfast",
      plannedDate: "2026-09-29",
      mealType: "breakfast",
      recipeName: "Arepa con queso",
    };
    const secondTuesday: BoardEntry = {
      ...ENTRY,
      id: "tuesday-dinner",
      plannedDate: "2026-09-29",
      recipeName: "Fríjoles",
    };
    renderBoard({ entries: [ENTRY, secondTuesday, firstTuesday] });

    fireEvent.click(
      screen.getByRole("tab", { name: /martes 29 de septiembre, 2 comidas/i }),
    );

    expect(
      screen.getByRole("button", { name: /arepa con queso/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /fríjoles/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("clears selection when an empty day is selected", () => {
    renderBoard();

    fireEvent.click(
      screen.getByRole("tab", { name: /miércoles 30 de septiembre, 0 comidas/i }),
    );

    expect(
      screen.getByText("Toca una comida para ver ingredientes y preparación."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /arroz con pollo/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps a meal selected when its card is tapped again", () => {
    renderBoard();
    const card = screen.getByRole("button", { name: /arroz con pollo/i });

    fireEvent.click(card);

    expect(card).toHaveAttribute("aria-pressed", "true");
  });

  it("labels cooked and skipped meals with their outcome", () => {
    const cooked: BoardEntry = {
      ...ENTRY,
      id: "cooked",
      mealType: "breakfast",
      recipeName: "Avena",
      outcome: "cooked",
      completed: true,
    };
    const skipped: BoardEntry = {
      ...ENTRY,
      id: "skipped",
      mealType: "lunch",
      recipeName: "Ensalada",
      outcome: "skipped",
      completed: true,
    };
    renderBoard({ entries: [cooked, skipped, ENTRY], state: "approved" });

    expect(screen.getByText("Cocinada")).toBeInTheDocument();
    expect(screen.getByText("Domicilio")).toBeInTheDocument();
    expect(screen.getByText(/2 raciones/)).toBeInTheDocument();
  });

  it("opens the add-meal dialog for an empty slot", async () => {
    renderBoard();

    fireEvent.click(
      screen.getAllByRole("button", { name: /añadir comida el/i })[0],
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("listbox", { name: "Recetas disponibles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /arroz con pollo/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Raciones")).toBeInTheDocument();
  });

  it("offers to create the searched recipe without leaving the dialog", async () => {
    renderBoard();

    fireEvent.click(
      screen.getAllByRole("button", { name: /añadir comida el/i })[0],
    );
    fireEvent.change(screen.getByLabelText(/buscar una receta/i), {
      target: { value: "huevos" },
    });

    expect(await screen.findByText(/aún no está en tus recetas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /crear “huevos”/i }));
    expect(
      await screen.findByRole("heading", { name: "Nueva receta rápida" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de la receta")).toHaveValue("huevos");
  });

  it("creates, publishes and selects the new recipe in the picker", async () => {
    const fetchMock = mockCreateFlow();
    vi.stubGlobal("fetch", fetchMock);
    renderBoard();

    fireEvent.click(
      screen.getAllByRole("button", { name: /añadir comida el/i })[0],
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /crear una receta/i }),
    );
    fireEvent.change(screen.getByLabelText("Nombre de la receta"), {
      target: { value: "Huevos rancheros" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /crear y seleccionar/i }).closest("form")!,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /huevos rancheros/i }),
      ).toHaveAttribute("aria-selected", "true"),
    );
    const calls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(calls).toContain("/api/recipes");
    expect(
      calls.some((url) => url.endsWith("/versions/1/publish")),
    ).toBe(true);
  });

  it("creates an ingredient inline and selects it in the recipe form", async () => {
    const fetchMock = mockCreateFlow();
    vi.stubGlobal("fetch", fetchMock);
    renderBoard();

    fireEvent.click(
      screen.getAllByRole("button", { name: /añadir comida el/i })[0],
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /crear una receta/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /crear ingrediente nuevo/i }),
    );
    expect(
      await screen.findByRole("heading", { name: "Nuevo ingrediente" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Tomate" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /crear ingrediente$/i }).closest("form")!,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Nueva receta rápida" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Ingrediente")).toHaveValue(
      "55555555-5555-5555-5555-555555555555",
    );
  });

  it("returns to the picker keeping the entered search", async () => {
    renderBoard();

    fireEvent.click(
      screen.getAllByRole("button", { name: /añadir comida el/i })[0],
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /crear una receta/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /volver a resultados/i }),
    );
    expect(
      screen.getByRole("listbox", { name: "Recetas disponibles" }),
    ).toBeInTheDocument();
  });

  it("offers completion instead of editing on approved plans", async () => {
    renderBoard({ state: "approved" });

    expect(
      await screen.findByRole("button", { name: "Marcar como cocinada" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /añadir comida el/i }),
    ).not.toBeInTheDocument();
  });
});
