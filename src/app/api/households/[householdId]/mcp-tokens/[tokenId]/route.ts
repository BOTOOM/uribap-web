import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ householdId: string; tokenId: string }> },
) {
  const { householdId, tokenId } = await context.params;
  try {
    await serverApiFetch(`/households/${householdId}/mcp-tokens/${tokenId}`, {
      method: "DELETE",
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo revocar el token MCP.";
    return NextResponse.json({ code, detail }, { status });
  }
}
