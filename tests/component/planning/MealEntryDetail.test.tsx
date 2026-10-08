import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/toast", () => ({ toast: vi.fn() }));

import { MealEntryDetail, MealEntryDetailView } from "@/components/planning/MealEntryDetail";
import type { components } from "@/lib/api/generated/schema";

type Detail = components["schemas"]["MealPlanEntryDetailResponse"];
type Completion = components["schemas"]["MealCompletionResponse"];

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => "meal-detail-key" });
});

const COMPLETION: Completion = {
  id: "completion-1",
  state: "recorded",
  outcome: "cooked",
  outcome_note: null,
  version: 3,
  meal_plan_entry_id: "entry-1",
  planned_date: "2026-09-30",
  meal_type: "dinner",
  recipe_version_id: "version-1",
  recipe_name: "Caldo de pollo",
  lines: [],
  completed_by_user_id: "user-1",
  completed_at: "2026-09-30T18:00:00Z",
  reopened_by_user_id: null,
  reopened_at: null,
  reopen_reason: null,
  created_at: "2026-09-30T18:00:00Z",
  updated_at: "2026-09-30T18:00:00Z",
};

const DETAIL: Detail = {
  plan_id: "plan-1",
  entry_id: "entry-1",
  recipe_id: "recipe-1",
  recipe_version_id: "version-1",
  recipe_name: "Caldo de pollo",
  recipe_description: "1. Hervir el pollo.\n2. Agregar las verduras.",
  prep_minutes: 35,
  servings: 2,
  base_servings: 4,
  notes: "Sin cilantro",
  plan_state: "approved",
  planned_date: "2026-09-30",
  meal_type: "dinner",
  version_number: 2,
  completion: null,
  ingredients: [
    {
      ingredient_id: "chicken",
      ingredient_name: "Pollo",
      required_amount: "300.000000",
      unit: "g",
      optional: false,
      on_hand_amount: "100.000000",
      shortfall_amount: "200.000000",
      position: 0,
      pantry_staple: false,
    },
    {
      ingredient_id: "cilantro",
      ingredient_name: "Cilantro",
      required_amount: "10.000000",
      unit: "g",
      optional: true,
      on_hand_amount: "20.000000",
      shortfall_amount: "0.000000",
      position: 1,
      pantry_staple: false,
    },
  ],
};

function renderDetail(overrides: Partial<Detail> = {}) {
  return render(
    <MealEntryDetailView
      detail={{ ...DETAIL, ...overrides }}
      planId="plan-1"
      version={4}
    />,
  );
}

describe("MealEntryDetailView", () => {
  it("shows API amounts, shortfall, available stock, and optional tags", () => {
    renderDetail();

    expect(screen.getByText("Faltan 200 g")).toBeInTheDocument();
    expect(screen.getByText("Hay 20 g")).toBeInTheDocument();
    expect(screen.getByText("opcional")).toBeInTheDocument();
    expect(screen.getByText("2 raciones")).toBeInTheDocument();
    expect(screen.getByText("35 min")).toBeInTheDocument();
  });

  it("labels a stocked pantry staple without replacing other ingredient states", () => {
    renderDetail({
      ingredients: [
        {
          ...DETAIL.ingredients[0],
          pantry_staple: true,
          on_hand_amount: "300.000000",
          shortfall_amount: "0.000000",
        },
        DETAIL.ingredients[1],
      ],
    });

    const stapleRow = screen.getByText("Pollo").closest("li")!;
    expect(within(stapleRow).getByText("Básico de despensa")).toBeInTheDocument();
    expect(within(stapleRow).queryByText(/^Hay/)).not.toBeInTheDocument();
    expect(screen.getByText("Hay 20 g")).toBeInTheDocument();
  });

  it("labels an out-of-stock pantry staple from the API shortfall", () => {
    renderDetail({
      ingredients: [
        {
          ...DETAIL.ingredients[0],
          pantry_staple: true,
          on_hand_amount: "0.000000",
          shortfall_amount: "300.000000",
        },
      ],
    });

    const stapleRow = screen.getByText("Pollo").closest("li")!;
    expect(within(stapleRow).getByText("Se acabó")).toBeInTheDocument();
    expect(within(stapleRow).queryByText(/Faltan/)).not.toBeInTheDocument();
  });

  it("keeps pantry-staple status visible on a recorded meal", () => {
    renderDetail({
      completion: COMPLETION,
      ingredients: [
        {
          ...DETAIL.ingredients[0],
          pantry_staple: true,
          shortfall_amount: "0.000000",
        },
      ],
    });

    expect(screen.getByText("Básico de despensa")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Se descontaron los ingredientes consumibles. Los básicos de despensa no se descuentan.",
      ),
    ).toBeInTheDocument();
  });

  it("parses numbered recipe steps into an ordered list", () => {
    const { container } = renderDetail();

    expect(container.querySelectorAll(".entry-steps li")).toHaveLength(2);
    expect(screen.getByText("Hervir el pollo.")).toBeInTheDocument();
    expect(screen.getByText("Agregar las verduras.")).toBeInTheDocument();
  });

  it("renders recipe notes above the numbered preparation list", () => {
    const { container } = renderDetail({
      recipe_description:
        "Rinde 2 porciones.\n1. Hervir el pollo.\nEquipo: olla a presión.\n2. Añadir verduras.",
    });

    const preparation = container.querySelector('[aria-labelledby^="entry-preparation-"]');
    expect(preparation?.querySelectorAll(".entry-recipe-notes")).toHaveLength(2);
    expect(preparation?.querySelector(".entry-recipe-notes")?.textContent).toBe(
      "Rinde 2 porciones.",
    );
    expect(preparation?.querySelector(".entry-steps")).toBeInTheDocument();
    expect(preparation?.querySelector(".entry-recipe-notes")?.compareDocumentPosition(
      preparation.querySelector(".entry-steps")!,
    )).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("removes bullet markers and blank lines from preparation steps", () => {
    const { container } = renderDetail({
      recipe_description: "  • Saltear las verduras.\n\n - Servir caliente.",
    });

    expect(container.querySelectorAll(".entry-steps li")).toHaveLength(2);
    expect(screen.getByText("Saltear las verduras.")).toBeInTheDocument();
    expect(screen.getByText("Servir caliente.")).toBeInTheDocument();
  });

  it("renders a single preparation step as a paragraph", () => {
    renderDetail({ recipe_description: "Calentar el caldo." });

    expect(screen.getByText("Calentar el caldo.")).toHaveClass("entry-instructions");
  });

  it("shows empty ingredients and preparation fallbacks", () => {
    renderDetail({ ingredients: [], recipe_description: null });

    expect(screen.getByText("Esta receta no tiene ingredientes registrados.")).toBeInTheDocument();
    expect(screen.getByText("Esta receta todavía no tiene pasos escritos.")).toBeInTheDocument();
  });

  it("offers draft removal, approved actions, recorded reopen, and proposed guidance", () => {
    const { unmount } = renderDetail({ plan_state: "draft" });
    expect(screen.getByRole("button", { name: "Quitar del plan" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Marcar como cocinada" }),
    ).not.toBeInTheDocument();
    unmount();

    const approved = renderDetail();
    expect(
      screen.getByRole("button", { name: "Marcar como cocinada" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pedimos domicilio" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Al marcarla como cocinada se descuentan los ingredientes consumibles. Los básicos de despensa no se descuentan. Si pidieron domicilio, no se toca el inventario.",
      ),
    ).toBeInTheDocument();
    approved.unmount();

    const recorded = renderDetail({ completion: COMPLETION });
    expect(screen.getByRole("button", { name: "Reabrir" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pedimos domicilio" }),
    ).not.toBeInTheDocument();
    recorded.unmount();

    renderDetail({ plan_state: "proposed" });
    expect(
      screen.getByText("Aprueba el plan para marcar comidas como cocinadas."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reabrir" })).not.toBeInTheDocument();
  });

  it("shows the skipped outcome without inventory availability", () => {
    renderDetail({
      completion: { ...COMPLETION, outcome: "skipped", outcome_note: "Pedimos domicilio" },
    });

    expect(screen.getByText("Domicilio")).toBeInTheDocument();
    expect(screen.getByText("No se cocinó; el inventario no cambió.")).toBeInTheDocument();
    expect(screen.getByText("Pedimos domicilio")).toBeInTheDocument();
    expect(screen.queryByText(/Faltan|Hay/)).not.toBeInTheDocument();
  });

  it("does not show pantry-staple availability for a skipped meal", () => {
    renderDetail({
      completion: { ...COMPLETION, outcome: "skipped", outcome_note: "Pedimos domicilio" },
      ingredients: [
        {
          ...DETAIL.ingredients[0],
          pantry_staple: true,
          on_hand_amount: "0.000000",
          shortfall_amount: "300.000000",
        },
      ],
    });

    expect(screen.queryByText("Se acabó")).not.toBeInTheDocument();
    expect(screen.queryByText("Básico de despensa")).not.toBeInTheDocument();
  });
});

describe("MealEntryDetail", () => {
  it("loads the entry detail and renders the response", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MealEntryDetail
        entryId="entry-1"
        planId="plan-1"
        planState="approved"
        refreshKey="entry-1:pending"
        version={4}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/cargando/i);

    await act(async () => resolveResponse(Response.json({ detail: DETAIL })));

    expect(await screen.findByRole("heading", { name: "Caldo de pollo" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plans/plan-1/entries/entry-1/detail",
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("offers retry after a fetch error and reloads successfully", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ detail: "No se pudo cargar el detalle." }, { status: 503 }),
      )
      .mockResolvedValueOnce(Response.json({ detail: DETAIL }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MealEntryDetail
        entryId="entry-1"
        planId="plan-1"
        planState="approved"
        refreshKey="entry-1:pending"
        version={4}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el detalle.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: "Caldo de pollo" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
