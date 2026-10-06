import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contractPath = resolve(process.cwd(), "contracts/uribap-api.openapi.json");
const metadataPath = resolve(process.cwd(), "contracts/metadata.json");

describe("pinned API contract", () => {
  it("contains the foundation and meal-detail boundaries", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8")) as {
      components: {
        schemas: Record<string, { properties?: Record<string, unknown> }>;
      };
      paths: Record<string, unknown>;
    };
    expect(contract.paths["/api/v1/health/live"]).toBeDefined();
    expect(contract.paths["/api/v1/health/ready"]).toBeDefined();
    expect(contract.paths["/api/v1/me"]).toBeDefined();
    expect(contract.paths["/api/v1/me/invitations"]).toBeDefined();
    expect(contract.paths["/api/v1/me/invitations/{invitation_id}/accept"]).toBeDefined();
    expect(contract.paths["/api/v1/households"]).toBeDefined();
    expect(contract.paths["/api/v1/invitations/accept"]).toBeDefined();
    expect(contract.paths["/api/v1/plans/{plan_id}/entries/{entry_id}/detail"]).toBeDefined();
    expect(contract.paths["/api/v1/plans/{plan_id}/entries/{entry_id}/skip"]).toBeDefined();
    expect(contract.paths["/api/v1/memory/profile"]).toHaveProperty("get");
    expect(contract.paths["/api/v1/diners"]).toHaveProperty("get");
    expect(contract.paths["/api/v1/diners"]).toHaveProperty("post");
    expect(contract.paths["/api/v1/diners/{diner_id}"]).toHaveProperty("patch");
    expect(contract.paths["/api/v1/diners/{diner_id}"]).toHaveProperty("delete");
    expect(contract.paths["/api/v1/memories"]).toHaveProperty("get");
    expect(contract.paths["/api/v1/memories"]).toHaveProperty("post");
    expect(contract.paths["/api/v1/memories/{memory_id}"]).toHaveProperty("patch");
    expect(contract.paths["/api/v1/memories/{memory_id}"]).toHaveProperty("delete");
    expect(contract.components.schemas.IngredientCreate.properties).toHaveProperty(
      "pantry_staple",
    );
    expect(contract.components.schemas.IngredientUpdate.properties).toHaveProperty(
      "pantry_staple",
    );
    expect(contract.components.schemas.IngredientResponse.properties).toHaveProperty(
      "pantry_staple",
    );
    expect(
      contract.components.schemas.MealPlanEntryDetailIngredientResponse.properties,
    ).toHaveProperty("pantry_staple");
    expect(contract.components.schemas.DemandForecastLine.properties).toHaveProperty(
      "pantry_staple",
    );
    const ingredientList = contract.paths["/api/v1/ingredients"] as {
      get?: {
        parameters?: Array<{ in?: string; name?: string }>;
      };
    };
    expect(ingredientList.get?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ in: "query", name: "cursor" })]),
    );
    expect(contract.components.schemas.IngredientPage.properties?.page_info).toEqual({
      $ref: "#/components/schemas/PageInfo",
    });
  });

  it("records the API repository, revision, and schema revision", () => {
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, string>;
    expect(metadata.apiRepository).toBe("BOTOOM/uribap-api");
    expect(metadata.schemaVersion).toBe("v16");
    expect(metadata.apiRevision).toBe(
      "74b661925fdec990c386850b90906664bb78b74f",
    );
    expect(metadata.generatedAt).toBe("2026-10-06");
  });
});
