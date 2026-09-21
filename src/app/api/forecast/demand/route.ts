import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  for (const key of ["from_date", "to_date"]) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }
  try {
    const forecast = await serverHouseholdFetch(`/forecast/demand?${params.toString()}`);
    return NextResponse.json(forecast);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo cargar la previsión." },
      { status },
    );
  }
}
