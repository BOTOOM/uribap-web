import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(request: Request) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") || crypto.randomUUID();
    const diner = await serverHouseholdFetch("/diners", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(diner, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo agregar a la persona.";
    return NextResponse.json({ detail }, { status });
  }
}
