import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

type RouteContext = { params: Promise<{ dinerId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { dinerId } = await params;
  try {
    const diner = await serverHouseholdFetch(`/diners/${dinerId}`, {
      method: "PATCH",
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(diner);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo actualizar a la persona.";
    return NextResponse.json({ detail }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { dinerId } = await params;
  try {
    await serverHouseholdFetch(`/diners/${dinerId}`, { method: "DELETE" });
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo archivar a la persona.";
    return NextResponse.json({ detail }, { status });
  }
}
