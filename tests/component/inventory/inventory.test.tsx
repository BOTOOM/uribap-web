import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { InventoryAdjustmentForm } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm } from "@/components/inventory/InventoryLotForm";
import { ToastRegion } from "@/components/shell/ToastRegion";

const INGREDIENTS = [{ id: "ingredient-1", name: "Arroz", base_unit: "g" }];
const LOTS = [{ id: "lot-1", ingredientName: "Arroz", quantity: "2.500000", unit: "g" }];

describe("inventory mutation forms", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("selects a real ingredient and submits the server-authoritative payload", () => {
    render(<InventoryLotForm ingredients={INGREDIENTS} />);
    fireEvent.change(screen.getByLabelText("Ingrediente"), {
      target: { value: "ingredient-1" },
    });
    fireEvent.change(screen.getByLabelText(/Cantidad/), {
      target: { value: "2.500000" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Añadir lote" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/inventory/lots",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(body).toMatchObject({
      ingredient_id: "ingredient-1",
      quantity: "2.500000",
      unit: "g",
      location: "pantry",
    });
  });

  it("selects a lot, sends the idempotency key and confirms through the toast region", async () => {
    render(
      <>
        <InventoryAdjustmentForm lots={LOTS} />
        <ToastRegion />
      </>,
    );
    fireEvent.change(screen.getByLabelText("Lote"), { target: { value: "lot-1" } });
    fireEvent.change(screen.getByLabelText(/Cantidad/), {
      target: { value: "0.500000" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Registrar ajuste" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/inventory/adjustments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "test-idempotency-key",
        }),
      }),
    );
    const body = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(body.delta).toBe("-0.500000");
    expect(await screen.findByText("Ajuste registrado en el ledger")).toBeInTheDocument();
  });

  it("blocks mutations and explains prerequisites when entities are missing", () => {
    render(
      <>
        <InventoryLotForm ingredients={[]} />
        <InventoryAdjustmentForm lots={[]} />
      </>,
    );
    expect(screen.getByRole("button", { name: "Añadir lote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Registrar ajuste" })).toBeDisabled();
    expect(screen.getByText(/Crea ingredientes primero/)).toBeInTheDocument();
    expect(screen.getByText(/Registra un lote antes/)).toBeInTheDocument();
  });
});
