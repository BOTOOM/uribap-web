import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  try {
    const page = await serverHouseholdFetch(`/meal-completions${query}`);
    return NextResponse.json(page);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudieron cargar." },
      { status },
    );
  }
}
