import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

export async function POST(
  _request: Request,
  context: { params: Promise<{ invitationId: string }> },
) {
  const { invitationId } = await context.params;
  try {
    const membership = await serverApiFetch(
      `/me/invitations/${encodeURIComponent(invitationId)}/accept`,
      { method: "POST" },
    );
    return NextResponse.json(membership);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo aceptar la invitación.";
    return NextResponse.json({ code, detail }, { status });
  }
}
