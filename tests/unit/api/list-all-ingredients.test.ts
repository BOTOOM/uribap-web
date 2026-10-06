import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveHouseholdId: vi.fn(),
  serverApiFetch: vi.fn(),
}));

vi.mock("@/lib/api/server-client", () => ({
  getActiveHouseholdId: mocks.getActiveHouseholdId,
  serverApiFetch: mocks.serverApiFetch,
}));

import { listAllIngredients } from "@/lib/api/list-all-ingredients";

function page(ids: string[], nextCursor: string | null) {
  return {
    items: ids.map((id) => ({ id })),
    page_info: { limit: 100, next_cursor: nextCursor },
  };
}

describe("listAllIngredients", () => {
  beforeEach(() => {
    mocks.getActiveHouseholdId.mockReset().mockResolvedValue("household-1");
    mocks.serverApiFetch.mockReset();
  });

  it("makes one request when the first page has no next cursor", async () => {
    mocks.serverApiFetch.mockResolvedValueOnce(page(["ingredient-1"], null));

    await expect(listAllIngredients()).resolves.toEqual([{ id: "ingredient-1" }]);
    expect(mocks.serverApiFetch).toHaveBeenCalledWith("/ingredients?limit=100", {
      headers: { "X-Household-ID": "household-1" },
    });
    expect(mocks.getActiveHouseholdId).toHaveBeenCalledTimes(1);
    expect(mocks.serverApiFetch).toHaveBeenCalledTimes(1);
  });

  it("follows three pages and stops when next_cursor is null", async () => {
    mocks.serverApiFetch
      .mockResolvedValueOnce(page(["ingredient-1"], "cursor-one"))
      .mockResolvedValueOnce(page(["ingredient-2"], "cursor-two"))
      .mockResolvedValueOnce(page(["ingredient-3"], null));

    await expect(listAllIngredients()).resolves.toEqual([
      { id: "ingredient-1" },
      { id: "ingredient-2" },
      { id: "ingredient-3" },
    ]);
    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(1, "/ingredients?limit=100", {
      headers: { "X-Household-ID": "household-1" },
    });
    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(
      2,
      "/ingredients?limit=100&cursor=cursor-one",
      { headers: { "X-Household-ID": "household-1" } },
    );
    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(
      3,
      "/ingredients?limit=100&cursor=cursor-two",
      { headers: { "X-Household-ID": "household-1" } },
    );
    expect(mocks.getActiveHouseholdId).toHaveBeenCalledTimes(1);
    expect(mocks.serverApiFetch).toHaveBeenCalledTimes(3);
  });

  it("rejects a continuation failure instead of returning partial results", async () => {
    const failure = new Error("Page request failed");
    mocks.serverApiFetch
      .mockResolvedValueOnce(page(["ingredient-1"], "cursor-one"))
      .mockRejectedValueOnce(failure);

    await expect(listAllIngredients()).rejects.toBe(failure);
    expect(mocks.serverApiFetch).toHaveBeenCalledTimes(2);
  });

  it("preserves other query parameters, forces limit 100, and encodes the cursor", async () => {
    mocks.serverApiFetch
      .mockResolvedValueOnce(page([], "opaque +/="))
      .mockResolvedValueOnce(page([], null));

    await listAllIngredients(
      "/ingredients?query=olive+oil&dimension=volume&include_global=false&limit=20",
    );

    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(
      1,
      "/ingredients?query=olive+oil&dimension=volume&include_global=false&limit=100",
      { headers: { "X-Household-ID": "household-1" } },
    );
    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(
      2,
      "/ingredients?query=olive+oil&dimension=volume&include_global=false&limit=100&cursor=opaque+%2B%2F%3D",
      { headers: { "X-Household-ID": "household-1" } },
    );
    const secondPath = mocks.serverApiFetch.mock.calls[1][0] as string;
    expect(new URL(secondPath, "http://uribap.local").searchParams.get("cursor")).toBe(
      "opaque +/=",
    );
  });

  it("discards an incoming cursor and keeps the remaining filters", async () => {
    mocks.serverApiFetch
      .mockResolvedValueOnce(page(["ingredient-1"], "next-cursor"))
      .mockResolvedValueOnce(page(["ingredient-2"], null));

    await expect(
      listAllIngredients("/ingredients?cursor=stale&dimension=mass"),
    ).resolves.toEqual([{ id: "ingredient-1" }, { id: "ingredient-2" }]);

    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(
      1,
      "/ingredients?dimension=mass&limit=100",
      { headers: { "X-Household-ID": "household-1" } },
    );
    expect(mocks.serverApiFetch).toHaveBeenNthCalledWith(
      2,
      "/ingredients?dimension=mass&limit=100&cursor=next-cursor",
      { headers: { "X-Household-ID": "household-1" } },
    );
  });

  it("throws when the page cap is reached with another cursor", async () => {
    mocks.serverApiFetch.mockResolvedValue(page([], "next"));

    await expect(listAllIngredients()).rejects.toThrow("50-page limit");
    expect(mocks.serverApiFetch).toHaveBeenCalledTimes(50);
  });
});
