import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";
import { problemResponse } from "@/lib/api/problem-response";

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
    return problemResponse(error, "No se pudo agregar a la persona.");
  }
}
