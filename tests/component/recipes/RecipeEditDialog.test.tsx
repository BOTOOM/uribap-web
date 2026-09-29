import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { RecipeEditDialog } from "@/components/recipes/RecipeEditDialog";

const fetchMock = vi.fn();

function renderDialog(latestState: "draft" | "published" = "published") {
  return render(
    <RecipeEditDialog
      baseServings={2}
      description="Una receta casera"
      latestState={latestState}
      name="Lentejas"
      prepMinutes={35}
      recipeId="recipe-1"
    />,
  );
}

function submitDialog() {
  fireEvent.submit(screen.getByRole("button", { name: "Guardar cambios" }).closest("form")!);
}

function requestBody(index = 0) {
  return JSON.parse(fetchMock.mock.calls[index][1].body as string) as Record<string, unknown>;
}

describe("RecipeEditDialog", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends only a PATCH for metadata-only changes", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Lentejas de la abuela" },
    });
    submitDialog();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recipes/recipe-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(requestBody()).toEqual({ name: "Lentejas de la abuela" });
  });

  it("sends null when clearing a description", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "" } });
    submitDialog();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(requestBody()).toEqual({ description: null });
  });

  it.each([
    ["published", true],
    ["draft", false],
  ] as const)("uses publish=%s for a %s recipe revision", async (state, publish) => {
    renderDialog(state);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Raciones base"), {
      target: { value: "4" },
    });
    submitDialog();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recipes/recipe-1/revisions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(requestBody()).toEqual({
      base_servings: 4,
      prep_minutes: 35,
      publish,
    });
  });

  it("sends metadata and revision changes to their respective endpoints", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Lentejas nuevas" },
    });
    fireEvent.change(screen.getByLabelText("Minutos de preparación"), {
      target: { value: "45" },
    });
    submitDialog();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/recipes/recipe-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(requestBody(0)).toEqual({ name: "Lentejas nuevas" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/recipes/recipe-1/revisions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(requestBody(1)).toEqual({
      base_servings: 2,
      prep_minutes: 45,
      publish: true,
    });
  });

  it("renders API errors as an alert", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: "La receta está archivada." }),
    });
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Lentejas nuevas" },
    });
    submitDialog();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La receta está archivada.",
    );
  });
});
