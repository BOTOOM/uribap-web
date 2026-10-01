import { NextResponse } from "next/server";

import { problemResponse } from "@/lib/api/problem-response";
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
