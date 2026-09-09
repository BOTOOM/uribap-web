import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DesignSystemSpecimen } from "@/features/foundation/DesignSystemSpecimen";

describe("Uribap design system specimen", () => {
  it("exposes named controls and semantic statuses", () => {
    render(<DesignSystemSpecimen />);

    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más acciones" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del hogar")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Falta")).toBeInTheDocument();
  });
});
