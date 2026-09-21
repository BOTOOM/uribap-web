import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

async function handle(
  request: Request,
  context: { params: Promise<{ householdId: string; userId: string }> },
  method: "PATCH" | "DELETE",
) {
  const { householdId, userId } = await context.params;
  try {
    const payload = method === "PATCH" ? await request.json() : undefined;
    const response = await serverApiFetch(`/households/${householdId}/members/${userId}`, {
      method,
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      headers: {
        ...(request.headers.get("if-match") ? { "If-Match": request.headers.get("if-match")! } : {}),
      },
    });
    return method === "DELETE" ? new NextResponse(null, { status: 204 }) : NextResponse.json(response);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo actualizar el miembro.";
    return NextResponse.json({ code, detail }, { status });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ householdId: string; userId: string }> }) {
  return handle(request, context, "PATCH");
}

export async function DELETE(request: Request, context: { params: Promise<{ householdId: string; userId: string }> }) {
  return handle(request, context, "DELETE");
}
