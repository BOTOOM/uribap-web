import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StateExamples } from "@/components/states/StateExamples";

describe("foundation view states", () => {
  it("exposes loading, empty, and error states with semantic roles", () => {
    render(<StateExamples />);

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getAllByRole("alert")).toHaveLength(4);
    expect(screen.getByText("Todavía no hay comidas")).toBeInTheDocument();
  });
});
