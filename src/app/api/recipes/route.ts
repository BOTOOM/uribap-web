import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(request: Request) {
  try {
    const recipe = await serverHouseholdFetch("/recipes", {
      method: "POST",
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail = error instanceof Error ? error.message : "No se pudo crear la receta.";
    return NextResponse.json({ detail }, { status });
  }
}
