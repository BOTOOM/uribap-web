import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ recipeId: string; versionNumber: string }> },
) {
  const { recipeId, versionNumber } = await params;
  const payload = (await request.json().catch(() => null)) as { items?: unknown } | null;
  if (!payload || !Array.isArray(payload.items)) {
    return NextResponse.json({ detail: "Cuerpo de solicitud inválido." }, { status: 400 });
  }
  try {
    const result = await serverHouseholdFetch(
      `/recipes/${recipeId}/versions/${versionNumber}/ingredients`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail =
      error instanceof Error ? error.message : "No se pudieron guardar los ingredientes.";
    return NextResponse.json({ detail }, { status });
  }
}
