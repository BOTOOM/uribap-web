import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Uribap foundation shell", () => {
  it("communicates the product consequence chain", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /lo que vamos a comer, lo que tenemos y lo que toca preparar/i,
      }),
    ).toBeInTheDocument();
    const consequenceRegion = screen.getByRole("region", {
      name: /una decisión, varias consecuencias visibles/i,
    });
    expect(within(consequenceRegion).getByText("Plan semanal")).toBeInTheDocument();
    expect(within(consequenceRegion).getByText("Inventario real y previsto")).toBeInTheDocument();
    expect(within(consequenceRegion).getByText("Compra explicable")).toBeInTheDocument();
    expect(within(consequenceRegion).getByText("Preparación a tiempo")).toBeInTheDocument();
  });
});
