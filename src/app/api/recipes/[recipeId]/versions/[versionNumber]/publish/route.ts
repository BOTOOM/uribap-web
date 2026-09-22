import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ recipeId: string; versionNumber: string }> },
) {
  const { recipeId, versionNumber } = await params;
  try {
    const result = await serverHouseholdFetch(
      `/recipes/${recipeId}/versions/${versionNumber}/publish`,
      { method: "POST" },
    );
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo publicar la versión.";
    return NextResponse.json({ detail }, { status });
  }
}
