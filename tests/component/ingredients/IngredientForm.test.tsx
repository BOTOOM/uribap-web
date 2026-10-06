import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock, toastMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/lib/toast", () => ({ toast: toastMock }));

import { IngredientForm } from "@/components/ingredients/IngredientForm";
import type { components } from "@/lib/api/generated/schema";

type Ingredient = components["schemas"]["IngredientResponse"];

const ACEITE: Ingredient = {
  archived_at: null,
  base_unit: "ml",
  category: "Aceites",
  dimension: "volume",
  household_id: "household-1",
  id: "ingredient-1",
  name: "Aceite",
  normalized_name: "aceite",
  pantry_staple: true,
};

const fetchMock = vi.fn();

function submitForm(buttonName: string) {
  fireEvent.submit(screen.getByRole("button", { name: buttonName }).closest("form")!);
}

function requestBody() {
  return JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
}

describe("IngredientForm", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    toastMock.mockReset();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ACEITE,
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("starts unchecked, explains the behavior, and sends false by default", async () => {
    render(<IngredientForm />);

    const checkbox = screen.getByRole("checkbox", { name: "Básico de despensa" });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute("aria-describedby", "ing-pantry-staple-help");
    expect(
      screen.getByText(
        "No se descuenta al cocinar. Aparece en compras solo cuando se acaba.",
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Sal" },
    });
    submitForm("Añadir ingrediente");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(requestBody()).toMatchObject({ pantry_staple: false });
  });

  it("sends the selected flag in the create payload", async () => {
    render(<IngredientForm />);
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Aceite de oliva" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Básico de despensa" }));
    submitForm("Añadir ingrediente");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ingredients",
      expect.objectContaining({ method: "POST" }),
    );
    expect(requestBody()).toEqual({
      name: "Aceite de oliva",
      category: null,
      dimension: "mass",
      base_unit: "g",
      pantry_staple: true,
    });
  });

  it("sends only the changed pantry-staple flag through PATCH", async () => {
    render(
      <IngredientForm
        ingredient={{ ...ACEITE, pantry_staple: false }}
        submitLabel="Guardar cambios"
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Básico de despensa" });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    submitForm("Guardar cambios");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ingredients/ingredient-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(requestBody()).toEqual({ pantry_staple: true });
  });

  it("sends only the changed name through PATCH", async () => {
    render(<IngredientForm ingredient={ACEITE} submitLabel="Guardar cambios" />);
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Aceite nuevo" },
    });
    submitForm("Guardar cambios");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(requestBody()).toEqual({ name: "Aceite nuevo" });
  });

  it("does not send a request or show a toast when nothing changed", async () => {
    const onSuccess = vi.fn();
    render(
      <IngredientForm
        ingredient={ACEITE}
        onSuccess={onSuccess}
        submitLabel="Guardar cambios"
      />,
    );
    submitForm("Guardar cambios");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(toastMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("exposes API errors in an alert", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: "No tienes permiso para editar este ingrediente." }),
    });
    render(<IngredientForm ingredient={ACEITE} submitLabel="Guardar cambios" />);
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Aceite nuevo" },
    });
    submitForm("Guardar cambios");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No tienes permiso para editar este ingrediente.",
    );
  });
});
