import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { NewVersionButton } from "@/components/recipes/NewVersionButton";

const fetchMock = vi.fn();

describe("NewVersionButton", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("creates a draft revision that clones the current recipe", async () => {
    render(<NewVersionButton recipeId="recipe-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Nueva versión" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recipes/recipe-1/revisions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ publish: false }),
      }),
    );
  });
});
