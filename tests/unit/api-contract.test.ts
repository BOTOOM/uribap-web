import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contractPath = resolve(process.cwd(), "contracts/uribap-api.openapi.json");
const metadataPath = resolve(process.cwd(), "contracts/metadata.json");

describe("pinned API contract", () => {
  it("contains the foundation and meal-detail boundaries", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8")) as { paths: Record<string, unknown> };
    expect(contract.paths["/api/v1/health/live"]).toBeDefined();
    expect(contract.paths["/api/v1/health/ready"]).toBeDefined();
    expect(contract.paths["/api/v1/me"]).toBeDefined();
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
  });

  it("records the API repository, revision, and schema revision", () => {
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, string>;
    expect(metadata.apiRepository).toBe("BOTOOM/uribap-api");
    expect(metadata.schemaVersion).toBe("v14");
    expect(metadata.apiRevision).toBe(
      "0a5114160468f4fdc51937c615441eebb0a6f263",
    );
    expect(metadata.generatedAt).toBe("2026-10-01");
  });
});
