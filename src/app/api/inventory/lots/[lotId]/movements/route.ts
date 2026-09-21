import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function GET(_request: Request, context: { params: Promise<{ lotId: string }> }) {
  const { lotId } = await context.params;
  try {
    const movements = await serverHouseholdFetch(`/inventory/lots/${lotId}/movements`);
    return NextResponse.json(movements);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json({ detail: error instanceof Error ? error.message : "No se pudo cargar el historial." }, { status });
  }
}
