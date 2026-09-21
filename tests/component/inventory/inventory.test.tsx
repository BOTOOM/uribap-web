import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InventoryAdjustmentForm } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm } from "@/components/inventory/InventoryLotForm";

describe("inventory mutation forms", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("exposes labeled lot fields and submits the server-authoritative payload", async () => {
    render(<InventoryLotForm />);
    fireEvent.change(screen.getByLabelText("ID del ingrediente"), { target: { value: "ingredient-1" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "2.500000" } });
    fireEvent.submit(screen.getByRole("button", { name: "Añadir lote" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/inventory/lots",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("provides a signed adjustment field and success status", async () => {
    render(<InventoryAdjustmentForm />);
    fireEvent.change(screen.getByLabelText("ID del lote"), { target: { value: "lot-1" } });
    fireEvent.change(screen.getByLabelText("Cambio firmado"), { target: { value: "-0.500000" } });
    fireEvent.submit(screen.getByRole("button", { name: "Registrar ajuste" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Ajuste registrado");
  });
});
