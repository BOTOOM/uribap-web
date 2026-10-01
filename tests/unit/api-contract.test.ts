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
  });

  it("records the API repository, revision, and schema revision", () => {
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, string>;
    expect(metadata.apiRepository).toBe("BOTOOM/uribap-api");
    expect(metadata.schemaVersion).toBe("v13");
    expect(metadata.apiRevision).toBe(
      "b7281461476b5ad312f0e2966328922c0e3d3b2a",
    );
    expect(metadata.generatedAt).toBe("2026-10-01");
  });
});
