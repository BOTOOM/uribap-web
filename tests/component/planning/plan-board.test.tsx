import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
