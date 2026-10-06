import "server-only";

import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";

type IngredientPage = components["schemas"]["IngredientPage"];
type IngredientResponse = components["schemas"]["IngredientResponse"];

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export async function listAllIngredients(path = "/ingredients"): Promise<IngredientResponse[]> {
  const endpoint = new URL(path, "http://uribap.local");
  const baseParams = new URLSearchParams(endpoint.searchParams);
  baseParams.set("limit", String(PAGE_SIZE));
  let cursor = baseParams.get("cursor");
  const ingredients: IngredientResponse[] = [];

  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex += 1) {
    const params = new URLSearchParams(baseParams);
    if (cursor === null) {
      params.delete("cursor");
    } else {
      params.set("cursor", cursor);
    }

    const query = params.toString();
    const pagePath = `${endpoint.pathname}${query ? `?${query}` : ""}`;
    const page = await serverHouseholdFetch<IngredientPage>(pagePath);
    ingredients.push(...page.items);

    const nextCursor = page.page_info.next_cursor;
    if (nextCursor == null) return ingredients;
    if (pageIndex === MAX_PAGES - 1) {
      throw new Error("Ingredient listing exceeded the 50-page limit");
    }
    cursor = nextCursor;
  }

  throw new Error("Ingredient listing exceeded the 50-page limit");
}
