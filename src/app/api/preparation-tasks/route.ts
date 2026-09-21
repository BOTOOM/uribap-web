import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(request: Request) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const task = await serverHouseholdFetch("/preparation-tasks", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo crear la tarea." },
      { status },
    );
  }
}
