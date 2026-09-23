import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { MobileNav } from "@/components/shell/MobileNav";
import { ShellNav } from "@/components/shell/ShellNav";
import { SkipLink } from "@/components/shell/SkipLink";

describe("shell accessibility contract", () => {
  it("exposes named navigation landmarks and a skip link", () => {
    render(
      <>
        <SkipLink />
        <ShellNav shoppingCount={3} />
        <MobileNav />
      </>,
    );

    expect(
      screen.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegación móvil" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /saltar al contenido/i }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("marks the current section and surfaces the shopping count", () => {
    render(<ShellNav shoppingCount={2} />);

    expect(
      screen.getByRole("link", { name: "Resumen" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: /despensa/i }),
    ).toHaveTextContent("2");
  });
});
