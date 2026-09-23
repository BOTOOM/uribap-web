import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function GET() {
  try {
    const result = await serverHouseholdFetch("/recipes/published-versions");
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail =
      error instanceof Error ? error.message : "No se pudieron cargar las recetas.";
    return NextResponse.json({ detail }, { status });
  }
}
