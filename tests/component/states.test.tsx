import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import {
  PermissionState,
  StaleState,
  UnavailableState,
} from "@/components/states/RequestStates";

describe("view states", () => {
  it("exposes loading, empty, error and request states with semantic roles", () => {
    render(
      <>
        <LoadingState label="Cargando el espacio…" />
        <EmptyState
          description="Añade la primera comida del plan."
          title="Todavía no hay comidas"
        />
        <ErrorState description="detalle" title="Falló la carga" />
        <PermissionState forbidden />
        <StaleState />
        <UnavailableState />
      </>,
    );

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getByText("Todavía no hay comidas")).toBeInTheDocument();
    expect(screen.getByText("Cargando el espacio…")).toBeInTheDocument();
  });
});
