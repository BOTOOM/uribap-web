import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DesignSystemSpecimen } from "@/features/foundation/DesignSystemSpecimen";

describe("foundation primitive accessibility", () => {
  it("keeps form descriptions and tab semantics connected", () => {
    render(<DesignSystemSpecimen />);

    const field = screen.getByLabelText("Nombre del hogar");
    expect(field).toHaveAttribute("aria-describedby", "foundation-name-hint");
    expect(screen.getByRole("tablist", { name: /tipo de estado/i })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});
