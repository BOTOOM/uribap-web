import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

type Params = { params: Promise<{ planId: string; entryId: string }> };

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
  return NextResponse.json({ detail: error instanceof Error ? error.message : fallback }, { status });
}

export async function PATCH(request: Request, context: Params) {
  const { planId, entryId } = await context.params;
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const plan = await serverHouseholdFetch(`/plans/${planId}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(plan);
  } catch (error) {
    return errorResponse(error, "No se pudo actualizar la comida.");
  }
}

export async function DELETE(request: Request, context: Params) {
  const { planId, entryId } = await context.params;
  const expectedVersion = new URL(request.url).searchParams.get("expected_version");
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const plan = await serverHouseholdFetch(
      `/plans/${planId}/entries/${entryId}?expected_version=${expectedVersion}`,
      { method: "DELETE", headers: { "Idempotency-Key": idempotencyKey } },
    );
    return NextResponse.json(plan);
  } catch (error) {
    return errorResponse(error, "No se pudo quitar la comida.");
  }
}
