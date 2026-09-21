import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryAdjustmentForm } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm } from "@/components/inventory/InventoryLotForm";

describe("inventory form accessibility", () => {
  it("keeps all mutation controls associated with visible labels", () => {
    render(
      <>
        <InventoryLotForm />
        <InventoryAdjustmentForm />
      </>,
    );
    expect(screen.getByLabelText("ID del ingrediente")).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad")).toBeInTheDocument();
    expect(screen.getByLabelText("ID del lote")).toBeInTheDocument();
    expect(screen.getByLabelText("Cambio firmado")).toBeInTheDocument();
  });
});
