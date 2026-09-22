import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

async function handle(
  request: Request,
  context: { params: Promise<{ householdId: string }> },
  method: "GET" | "POST",
) {
  const { householdId } = await context.params;
  try {
    const payload = method === "POST" ? await request.json() : undefined;
    const result = await serverApiFetch(`/households/${householdId}/mcp-tokens`, {
      method,
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    return NextResponse.json(result, { status: method === "POST" ? 201 : 200 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo gestionar el token MCP.";
    return NextResponse.json({ code, detail }, { status });
  }
}

export async function GET(request: Request, context: { params: Promise<{ householdId: string }> }) {
  return handle(request, context, "GET");
}

export async function POST(request: Request, context: { params: Promise<{ householdId: string }> }) {
  return handle(request, context, "POST");
}
