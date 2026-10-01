import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function GET() {
  try {
    const profile = await serverHouseholdFetch("/memory/profile");
    return NextResponse.json(profile);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const detail =
      error instanceof Error ? error.message : "No se pudo cargar la memoria del hogar.";
    return NextResponse.json({ detail }, { status });
  }
}
