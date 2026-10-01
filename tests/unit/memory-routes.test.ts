import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  serverHouseholdFetch: vi.fn(),
}));

vi.mock("@/lib/api/server-client", () => ({
  serverHouseholdFetch: mocks.serverHouseholdFetch,
}));

import { DELETE as archiveDiner, PATCH as updateDiner } from "@/app/api/diners/[dinerId]/route";
import { POST as createDiner } from "@/app/api/diners/route";
import { GET as getMemoryProfile } from "@/app/api/memory/profile/route";
import { DELETE as archiveMemory, PATCH as updateMemory } from "@/app/api/memories/[memoryId]/route";
import { POST as createMemory } from "@/app/api/memories/route";

function request(
  method: string,
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Request {
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("household memory BFF routes", () => {
  beforeEach(() => {
    mocks.serverHouseholdFetch.mockReset();
  });

  it("loads the profile through the active-household client", async () => {
    const profile = { household: [], diners: [] };
    mocks.serverHouseholdFetch.mockResolvedValue(profile);

    const response = await getMemoryProfile();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/memory/profile");
  });

  it("forwards diner creation body and idempotency key", async () => {
    const body = { display_name: "Pareja", member_user_id: null };
    mocks.serverHouseholdFetch.mockResolvedValue({ id: "diner-1" });

    const response = await createDiner(
      request("POST", "/api/diners", body, "diner-create-key"),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "diner-1" });
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/diners", {
      method: "POST",
      headers: { "Idempotency-Key": "diner-create-key" },
      body: JSON.stringify(body),
    });
  });

  it("forwards diner updates with their expected version", async () => {
    const body = { display_name: "Mi pareja", expected_version: 2 };
    mocks.serverHouseholdFetch.mockResolvedValue({ id: "diner-1", version: 3 });

    const response = await updateDiner(request("PATCH", "", body), {
      params: Promise.resolve({ dinerId: "diner-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/diners/diner-1", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  });

  it("archives a diner with an empty 204 response", async () => {
    mocks.serverHouseholdFetch.mockResolvedValue(null);

    const response = await archiveDiner(request("DELETE", ""), {
      params: Promise.resolve({ dinerId: "diner-1" }),
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/diners/diner-1", {
      method: "DELETE",
    });
  });

  it("forwards memory creation body and idempotency key", async () => {
    const body = { content: "Comemos para dos", kind: "note" };
    mocks.serverHouseholdFetch.mockResolvedValue({ id: "memory-1" });

    const response = await createMemory(
      request("POST", "/api/memories", body, "memory-create-key"),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "memory-1" });
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/memories", {
      method: "POST",
      headers: { "Idempotency-Key": "memory-create-key" },
      body: JSON.stringify(body),
    });
  });

  it("forwards memory updates with their expected version", async () => {
    const body = { content: "Ahora comemos para tres", expected_version: 4 };
    mocks.serverHouseholdFetch.mockResolvedValue({ id: "memory-1", version: 5 });

    const response = await updateMemory(request("PATCH", "", body), {
      params: Promise.resolve({ memoryId: "memory-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/memories/memory-1", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  });

  it("archives a memory with an empty 204 response", async () => {
    mocks.serverHouseholdFetch.mockResolvedValue(null);

    const response = await archiveMemory(request("DELETE", ""), {
      params: Promise.resolve({ memoryId: "memory-1" }),
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mocks.serverHouseholdFetch).toHaveBeenCalledWith("/memories/memory-1", {
      method: "DELETE",
    });
  });

  it("preserves an upstream problem status and detail", async () => {
    mocks.serverHouseholdFetch.mockRejectedValue(
      Object.assign(new Error("La memoria cambió en otro lugar."), { status: 409 }),
    );

    const response = await updateMemory(request("PATCH", "", { expected_version: 1 }), {
      params: Promise.resolve({ memoryId: "memory-1" }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ detail: "La memoria cambió en otro lugar." });
  });

  it("preserves diner problem codes and structured details", async () => {
    const detail = [{ loc: ["body", "display_name"], msg: "Display name is invalid." }];
    mocks.serverHouseholdFetch.mockRejectedValue(
      Object.assign(new Error("Display name is invalid."), {
        status: 422,
        code: "validation_error",
        responseDetail: detail,
      }),
    );

    const response = await createDiner(
      request("POST", "/api/diners", { display_name: "Pareja" }, "diner-key"),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: "validation_error", detail });
  });
});
