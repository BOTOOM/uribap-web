import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("foundation accessibility contract", () => {
  it("exposes named navigation and a skip link", () => {
    render(<Home />);

    expect(screen.getByRole("navigation", { name: /principal/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /saltar al contenido/i })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});
