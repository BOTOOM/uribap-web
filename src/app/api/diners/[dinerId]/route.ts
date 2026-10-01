import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

type RouteContext = { params: Promise<{ dinerId: string }> };

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

export async function PATCH(request: Request, { params }: RouteContext) {
  const { dinerId } = await params;
  try {
    const diner = await serverHouseholdFetch(`/diners/${dinerId}`, {
      method: "PATCH",
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(diner);
  } catch (error) {
    return problemResponse(error, "No se pudo actualizar a la persona.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { dinerId } = await params;
  try {
    await serverHouseholdFetch(`/diners/${dinerId}`, { method: "DELETE" });
    return new Response(null, { status: 204 });
  } catch (error) {
    return problemResponse(error, "No se pudo archivar a la persona.");
  }
}
