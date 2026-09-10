import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const household = await serverApiFetch("/households", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(household, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo crear el hogar.";
    return NextResponse.json({ code, detail }, { status });
  }
}
