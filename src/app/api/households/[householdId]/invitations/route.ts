import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

export async function POST(request: Request, context: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await context.params;
  try {
    const payload = await request.json();
    const invitation = await serverApiFetch(`/households/${householdId}/invitations`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(invitation, { status: 202 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo crear la invitación.";
    return NextResponse.json({ code, detail }, { status });
  }
}
