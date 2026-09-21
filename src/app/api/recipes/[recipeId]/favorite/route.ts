import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(_request: Request, context: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = await context.params;
  try {
    await serverHouseholdFetch(`/recipes/${recipeId}/favorite`, { method: "POST" });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo guardar el favorito.";
    return NextResponse.json({ detail }, { status });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = await context.params;
  try {
    await serverHouseholdFetch(`/recipes/${recipeId}/favorite`, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo quitar el favorito.";
    return NextResponse.json({ detail }, { status });
  }
}
