import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { ShoppingItemActions } from "@/components/shopping/ShoppingItemActions";
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

describe("shopping list flows", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("creates a list with the chosen window", async () => {
    render(<ShoppingListCreateForm defaultFrom="2026-09-28" defaultTo="2026-10-04" />);
    fireEvent.submit(screen.getByRole("button", { name: "Generar lista" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/shopping-lists",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body).toEqual({ from_date: "2026-09-28", to_date: "2026-10-04" });
  });

  it("sends expected_version and the stable idempotency key on transitions", async () => {
    render(<ShoppingListTransitionBar listId="list-1" state="open" version={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Completar" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/shopping-lists/list-1/complete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "test-idempotency-key" }),
      }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body.expected_version).toBe(2);
  });

  it("skips a pending item and restores a skipped one", async () => {
    render(<ShoppingItemActions listId="list-1" item={ITEM} version={1} mutable />);
    fireEvent.click(screen.getByRole("button", { name: "Omitir" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/shopping-lists/list-1/items/item-1/skip",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("submits a purchase with quantity, unit and location", async () => {
    render(<ShoppingItemActions listId="list-1" item={ITEM} version={1} mutable />);
    fireEvent.click(screen.getByRole("button", { name: "Comprar" }));
    fireEvent.submit(screen.getByRole("button", { name: "Registrar compra" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/shopping-lists/list-1/items/item-1/purchase",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body.quantity).toBe("150.000000");
    expect(body.unit).toBe("g");
    expect(body.location).toBe("pantry");
    expect(body.expected_version).toBe(1);
  });

  it("shows conflict reload on 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 409, json: async () => ({ detail: "conflict" }) }),
    );
    render(<ShoppingListTransitionBar listId="list-1" state="open" version={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Completar" }));
    expect(
      await screen.findByRole("button", { name: "Recargar lista actualizada" }),
    ).toBeInTheDocument();
  });

  it("hides actions for purchased items or non-open lists", () => {
    const purchased = { ...ITEM, status: "purchased" as const };
    const { container } = render(
      <ShoppingItemActions listId="list-1" item={purchased} version={2} mutable />,
    );
    expect(container.querySelector("button")).toBeNull();
  });
});
