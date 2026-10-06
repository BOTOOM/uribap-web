import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  serverHouseholdFetch: vi.fn(),
}));

vi.mock("@/lib/api/server-client", () => ({
  serverHouseholdFetch: mocks.serverHouseholdFetch,
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
    mocks.serverHouseholdFetch.mockReset();
  });

  it("makes one request when the first page has no next cursor", async () => {
    mocks.serverHouseholdFetch.mockResolvedValueOnce(page(["ingredient-1"], null));

    await expect(listAllIngredients()).resolves.toEqual([{ id: "ingredient-1" }]);
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/ingredients?limit=100");
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledTimes(1);
  });

  it("follows three pages and stops when next_cursor is null", async () => {
    mocks.serverHouseholdFetch
      .mockResolvedValueOnce(page(["ingredient-1"], "cursor-one"))
      .mockResolvedValueOnce(page(["ingredient-2"], "cursor-two"))
      .mockResolvedValueOnce(page(["ingredient-3"], null));

    await expect(listAllIngredients()).resolves.toEqual([
      { id: "ingredient-1" },
      { id: "ingredient-2" },
      { id: "ingredient-3" },
    ]);
    expect(mocks.serverHouseholdFetch).toHaveBeenNthCalledWith(1, "/ingredients?limit=100");
    expect(mocks.serverHouseholdFetch).toHaveBeenNthCalledWith(
      2,
      "/ingredients?limit=100&cursor=cursor-one",
    );
    expect(mocks.serverHouseholdFetch).toHaveBeenNthCalledWith(
      3,
      "/ingredients?limit=100&cursor=cursor-two",
    );
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledTimes(3);
  });

  it("rejects a continuation failure instead of returning partial results", async () => {
    const failure = new Error("Page request failed");
    mocks.serverHouseholdFetch
      .mockResolvedValueOnce(page(["ingredient-1"], "cursor-one"))
      .mockRejectedValueOnce(failure);

    await expect(listAllIngredients()).rejects.toBe(failure);
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledTimes(2);
  });

  it("preserves other query parameters, forces limit 100, and encodes the cursor", async () => {
    mocks.serverHouseholdFetch
      .mockResolvedValueOnce(page([], "opaque +/="))
      .mockResolvedValueOnce(page([], null));

    await listAllIngredients(
      "/ingredients?query=olive+oil&dimension=volume&include_global=false&limit=20",
    );

    expect(mocks.serverHouseholdFetch).toHaveBeenNthCalledWith(
      1,
      "/ingredients?query=olive+oil&dimension=volume&include_global=false&limit=100",
    );
    expect(mocks.serverHouseholdFetch).toHaveBeenNthCalledWith(
      2,
      "/ingredients?query=olive+oil&dimension=volume&include_global=false&limit=100&cursor=opaque+%2B%2F%3D",
    );
    const secondPath = mocks.serverHouseholdFetch.mock.calls[1][0] as string;
    expect(new URL(secondPath, "http://uribap.local").searchParams.get("cursor")).toBe(
      "opaque +/=",
    );
  });

  it("throws when the page cap is reached with another cursor", async () => {
    mocks.serverHouseholdFetch.mockResolvedValue(page([], "next"));

    await expect(listAllIngredients()).rejects.toThrow("50-page limit");
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledTimes(50);
  });
});
