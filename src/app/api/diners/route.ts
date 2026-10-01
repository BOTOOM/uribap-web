import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

function problemResponse(error: unknown, fallback: string) {
  const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
  const code =
    error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : null;
  const detail =
    error instanceof Error && "responseDetail" in error && error.responseDetail !== undefined
      ? error.responseDetail
      : error instanceof Error
        ? error.message
        : fallback;
  return NextResponse.json({ ...(code ? { code } : {}), detail }, { status });
}

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
