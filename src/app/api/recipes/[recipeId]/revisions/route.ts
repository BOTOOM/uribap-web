import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  const { recipeId } = await params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ detail: "Cuerpo de solicitud inválido." }, { status: 400 });
  }
  try {
    const revision = await serverHouseholdFetch(`/recipes/${recipeId}/revisions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(revision, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo crear la revisión.";
    return NextResponse.json({ detail }, { status });
  }
}
