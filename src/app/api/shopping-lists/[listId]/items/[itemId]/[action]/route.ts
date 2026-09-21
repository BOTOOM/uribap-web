import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

const ACTIONS = new Set(["purchase", "skip", "restore"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ listId: string; itemId: string; action: string }> },
) {
  const { listId, itemId, action } = await context.params;
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ detail: "Acción desconocida." }, { status: 404 });
  }
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const list = await serverHouseholdFetch(
      `/shopping-lists/${listId}/items/${itemId}/${action}`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(await request.json()),
      },
    );
    return NextResponse.json(list);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo actualizar el ítem." },
      { status },
    );
  }
}
