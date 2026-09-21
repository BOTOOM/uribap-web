import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

const ACTIONS = new Set(["propose", "approve", "reopen", "archive"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string; action: string }> },
) {
  const { planId, action } = await context.params;
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ detail: "Transición desconocida." }, { status: 404 });
  }
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const plan = await serverHouseholdFetch(`/plans/${planId}/${action}`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(plan);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json({ detail: error instanceof Error ? error.message : "No se pudo actualizar el plan." }, { status });
  }
}
