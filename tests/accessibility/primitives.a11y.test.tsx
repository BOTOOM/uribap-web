import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StyledTabList, TabContent, Tabs, TabTrigger } from "@/components/ui/Tabs";

describe("primitive accessibility", () => {
  it("connects field labels with their hints", () => {
    render(
      <Field
        hint="Visible para todas las personas del hogar"
        id="household-name"
        label="Nombre del hogar"
      />,
    );

    const field = screen.getByLabelText("Nombre del hogar");
    expect(field).toHaveAttribute("aria-describedby", "household-name-hint");
  });

  it("exposes named buttons, statuses and tab semantics", () => {
    render(
      <>
        <Button>Continuar</Button>
        <StatusBadge tone="ready">Disponible</StatusBadge>
        <Tabs defaultValue="one">
          <StyledTabList aria-label="Tipo de estado">
            <TabTrigger value="one">Uno</TabTrigger>
            <TabTrigger value="two">Dos</TabTrigger>
          </StyledTabList>
          <TabContent value="one">Primero</TabContent>
          <TabContent value="two">Segundo</TabContent>
        </Tabs>
      </>,
    );

    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: /tipo de estado/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});
