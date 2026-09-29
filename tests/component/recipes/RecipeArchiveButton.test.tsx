import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { RecipeArchiveButton } from "@/components/recipes/RecipeArchiveButton";

const fetchMock = vi.fn();

describe("RecipeArchiveButton", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("confirms before archiving", async () => {
    render(<RecipeArchiveButton archived={false} recipeId="recipe-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Archivar" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Se oculta de recetas y del planificador. Las comidas ya planificadas o cocinadas conservan su historial. Puedes restaurarla cuando quieras.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sí, archivar" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recipes/recipe-1/archive",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("restores an archived recipe through the unarchive endpoint", async () => {
    render(<RecipeArchiveButton archived recipeId="recipe-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Restaurar" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recipes/recipe-1/unarchive",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
