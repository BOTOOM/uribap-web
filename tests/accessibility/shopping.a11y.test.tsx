import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { ShoppingItemRow } from "@/components/shopping/ShoppingItemRow";
import { ShoppingListCreateForm } from "@/components/shopping/ShoppingListCreateForm";
import { ShoppingListTransitionBar } from "@/components/shopping/ShoppingListTransitionBar";

const ITEM = {
  id: "item-1",
  shopping_list_id: "list-1",
  ingredient_id: "ing-1",
  ingredient_name: "Arroz",
  unit: "g",
  needed_amount: "150.000000",
  optional_amount: "0.000000",
  status: "pending" as const,
  position: 0,
  notes: null,
  purchased_amount: null,
  purchased_lot_id: null,
  purchased_at: null,
  created_at: "2026-09-28T00:00:00Z",
  updated_at: "2026-09-28T00:00:00Z",
};

describe("shopping accessibility", () => {
  it("keeps the create form controls associated with visible labels", () => {
    render(<ShoppingListCreateForm defaultFrom="2026-09-28" defaultTo="2026-10-04" />);
    expect(screen.getByLabelText("Desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar lista" })).toBeInTheDocument();
  });

  it("groups list transitions under a named group", () => {
    render(<ShoppingListTransitionBar listId="list-1" state="open" version={1} />);
    expect(screen.getByRole("group", { name: "Acciones de la lista" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Completar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivar" })).toBeInTheDocument();
  });

  it("labels the purchase form per item", async () => {
    render(<ShoppingItemRow listId="list-1" item={ITEM} onHand={null} shortfall={null} version={1} mutable />);
    screen.getByRole("button", { name: /^Comprar/ }).click();
    expect(
      await screen.findByRole("form", { name: "Comprar Arroz" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad (g)")).toBeInTheDocument();
    expect(screen.getByLabelText("Ubicación")).toBeInTheDocument();
    expect(screen.getByLabelText("Caducidad (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Notas (opcional)")).toBeInTheDocument();
  });
});
