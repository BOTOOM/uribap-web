import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string; entryId: string }> },
) {
  const { planId, entryId } = await context.params;
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const completion = await serverHouseholdFetch(
      `/plans/${planId}/entries/${entryId}/complete`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(await request.json()),
      },
    );
    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo completar la comida." },
      { status },
    );
  }
}
