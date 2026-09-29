import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  const { recipeId } = await params;
  try {
    const recipe = await serverHouseholdFetch(`/recipes/${recipeId}/archive`, {
      method: "POST",
    });
    return NextResponse.json(recipe);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo archivar la receta.";
    return NextResponse.json({ detail }, { status });
  }
}
