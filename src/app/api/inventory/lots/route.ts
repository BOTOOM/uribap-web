import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";

export async function POST(request: Request) {
  try {
    const lot = await serverHouseholdFetch("/inventory/lots", {
      method: "POST",
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(lot, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json({ detail: error instanceof Error ? error.message : "No se pudo crear el lote." }, { status });
  }
}
