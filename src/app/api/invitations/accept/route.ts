import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

export async function POST(request: Request) {
  const payload = (await request.json()) as { token?: string };
  if (!payload.token) {
    return NextResponse.json({ code: "validation_error", detail: "La invitación no es válida." }, { status: 400 });
  }
  try {
    const membership = await serverApiFetch("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token: payload.token }),
    });
    return NextResponse.json(membership);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo aceptar la invitación.";
    return NextResponse.json({ code, detail }, { status });
  }
}
