import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

const ACTIONS = new Set(["complete", "cancel"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string; action: string }> },
) {
  const { taskId, action } = await context.params;
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ detail: "Acción desconocida." }, { status: 404 });
  }
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const task = await serverHouseholdFetch(`/preparation-tasks/${taskId}/${action}`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(task);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo actualizar la tarea." },
      { status },
    );
  }
}
