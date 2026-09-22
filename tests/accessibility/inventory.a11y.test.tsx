import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { InventoryAdjustmentForm } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm } from "@/components/inventory/InventoryLotForm";

describe("inventory form accessibility", () => {
  it("keeps all mutation controls associated with visible labels", () => {
    render(
      <>
        <InventoryLotForm
          ingredients={[{ id: "i1", name: "Arroz", base_unit: "g" }]}
        />
        <InventoryAdjustmentForm
          lots={[{ id: "l1", ingredientName: "Arroz", quantity: "1.000000", unit: "g" }]}
        />
      </>,
    );
    expect(screen.getByLabelText("Ingrediente")).toBeInTheDocument();
    expect(screen.getByLabelText(/Cantidad/)).toBeInTheDocument();
    expect(screen.getByLabelText("Ubicación")).toBeInTheDocument();
    expect(screen.getByLabelText("Lote")).toBeInTheDocument();
    expect(screen.getByLabelText(/Cambio firmado/)).toBeInTheDocument();
  });
});
