import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";
import {
  invitationTokenCookieOptions,
  INVITATION_TOKEN_COOKIE,
} from "@/lib/auth/invitation-token-cookie";

function clearInvitationToken(response: NextResponse) {
  response.cookies.set(
    INVITATION_TOKEN_COOKIE,
    "",
    invitationTokenCookieOptions(0),
  );
  return response;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { token?: string } | null;
  if (typeof payload?.token !== "string" || !payload.token) {
    return NextResponse.json({ code: "validation_error", detail: "La invitación no es válida." }, { status: 400 });
  }
  try {
    const membership = await serverApiFetch("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token: payload.token }),
    });
    return clearInvitationToken(NextResponse.json(membership));
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo aceptar la invitación.";
    const response = NextResponse.json({ code, detail }, { status });
    return status === 404 || status === 410 ? clearInvitationToken(response) : response;
  }
}
