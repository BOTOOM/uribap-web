import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(
  request: Request,
  context: { params: Promise<{ completionId: string; lineId: string }> },
) {
  const { completionId, lineId } = await context.params;
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const completion = await serverHouseholdFetch(
      `/meal-completions/${completionId}/lines/${lineId}/correct`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(await request.json()),
      },
    );
    return NextResponse.json(completion);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo corregir la línea." },
      { status },
    );
  }
}
