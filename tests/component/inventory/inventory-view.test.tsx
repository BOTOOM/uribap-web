import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import {
  InventoryView,
  type InventoryRowData,
  type ShoppingBandData,
} from "@/components/inventory/InventoryView";

const INGREDIENTS = [
  { id: "ing-1", name: "Arroz", base_unit: "g" },
  { id: "ing-2", name: "Aceite", base_unit: "ml" },
];

function row(partial: Partial<InventoryRowData>): InventoryRowData {
  return {
    ingredientId: "ing-1",
    name: "Arroz",
    unit: "g",
    locations: ["pantry"],
    real: "0",
    projected: "-300",
    required: "300",
    shortage: { needed: "300", onHand: "0", missing: "300" },
    expiryLabel: null,
    statusTone: "missing",
    statusLabel: "Faltan 300 g",
    tags: [{ tone: "missing", label: "Falta" }],
    lots: [],
    ...partial,
  };
}

const NO_LIST: ShoppingBandData = { list: null, pendingRows: [], resolvedItems: [] };

const OPEN_LIST: ShoppingBandData = {
  list: { id: "list-1", state: "open", version: 2, windowLabel: "28 sep – 4 oct" },
  pendingRows: [
    {
      item: {
        id: "item-1",
        shopping_list_id: "list-1",
        ingredient_id: "ing-2",
        ingredient_name: "Aceite",
        unit: "ml",
        needed_amount: "30.000000",
        optional_amount: "0.000000",
        status: "pending",
        position: 0,
        notes: null,
        purchased_amount: null,
        purchased_lot_id: null,
        purchased_at: null,
        created_at: "2026-09-28T00:00:00Z",
        updated_at: "2026-09-28T00:00:00Z",
      },
      onHand: "0.000000",
      shortfall: "30.000000",
    },
  ],
  resolvedItems: [
    {
      id: "item-2",
      shopping_list_id: "list-1",
      ingredient_id: "ing-1",
      ingredient_name: "Arroz",
      unit: "g",
      needed_amount: "300.000000",
      optional_amount: "0.000000",
      status: "purchased",
      position: 1,
      notes: null,
      purchased_amount: "300.000000",
      purchased_lot_id: "lot-9",
      purchased_at: "2026-09-28T10:00:00Z",
      created_at: "2026-09-28T00:00:00Z",
      updated_at: "2026-09-28T10:00:00Z",
    },
  ],
};

function renderView(
  overrides: Partial<Parameters<typeof InventoryView>[0]> = {},
) {
  return render(
    <InventoryView
      ingredients={INGREDIENTS}
      lotOptions={[]}
      rows={[row({})]}
      shopping={NO_LIST}
      weekLabel="28 sep – 4 oct"
      windowDefault={{ from: "2026-09-28", to: "2026-10-04" }}
      {...overrides}
    />,
  );
}

describe("despensa unified view", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("puts autocalculated shortages on top as purchase priority without a list", () => {
    renderView();
    expect(
      screen.getByRole("heading", { name: "Por comprar" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Autocalculado del plan/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Comprar 300 g/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generar lista/ }),
    ).toBeInTheDocument();
  });

  it("opens a prefilled purchase dialog from a shortage row", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: /Comprar 300 g/ }));
    expect(
      screen.getByRole("dialog", { name: /Comprar Arroz/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Cantidad/)).toHaveValue("300");
    expect(screen.getByLabelText("Ingrediente")).toHaveValue("ing-1");
  });

  it("renders the open list items with purchase and transition actions", () => {
    renderView({ shopping: OPEN_LIST });
    expect(screen.getByText(/Lista abierta · 28 sep/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Comprar 30 ml/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Completar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 resuelto en esta lista")).toBeInTheDocument();
  });

  it("shows state tags on inventory rows", () => {
    renderView({
      rows: [
        row({ tags: [{ tone: "missing", label: "Falta" }] }),
        row({
          ingredientId: "ing-2",
          name: "Aceite",
          unit: "ml",
          shortage: null,
          required: null,
          projected: "120",
          real: "120",
          statusTone: "expiring",
          statusLabel: "Vence mañana",
          tags: [
            { tone: "expiring", label: "Por caducar" },
            { tone: "warning", label: "Con caducados" },
          ],
        }),
      ],
    });
    const tags = document.querySelectorAll(".inventory-tags .status");
    expect([...tags].map((tag) => tag.textContent)).toEqual([
      "Falta",
      "Por caducar",
      "Con caducados",
    ]);
  });
});
