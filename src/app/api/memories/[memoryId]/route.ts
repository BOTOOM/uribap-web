import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

type RouteContext = { params: Promise<{ memoryId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { memoryId } = await params;
  try {
    const memory = await serverHouseholdFetch(`/memories/${memoryId}`, {
      method: "PATCH",
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(memory);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo actualizar el recuerdo.";
    return NextResponse.json({ detail }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { memoryId } = await params;
  try {
    await serverHouseholdFetch(`/memories/${memoryId}`, { method: "DELETE" });
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo olvidar el recuerdo.";
    return NextResponse.json({ detail }, { status });
  }
}
