import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contractPath = resolve(process.cwd(), "contracts/uribap-api.openapi.json");
const metadataPath = resolve(process.cwd(), "contracts/metadata.json");

describe("pinned API contract", () => {
  it("contains the foundation health boundary", () => {
    const contract = JSON.parse(readFileSync(contractPath, "utf8")) as { paths: Record<string, unknown> };
    expect(contract.paths["/api/v1/health/live"]).toBeDefined();
    expect(contract.paths["/api/v1/health/ready"]).toBeDefined();
  });

  it("records the API repository and schema revision", () => {
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, string>;
    expect(metadata.apiRepository).toBe("BOTOOM/uribap-api");
    expect(metadata.schemaVersion).toBe("v1");
  });
});
