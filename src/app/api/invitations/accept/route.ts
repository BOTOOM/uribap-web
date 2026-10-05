import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";
import {
  invitationTokenCookieName,
  invitationTokenCookieOptions,
  isInvitationFlow,
  isInvitationToken,
} from "@/lib/auth/invitation-token-cookie";

function clearInvitationToken(response: NextResponse, flow: string) {
  response.cookies.set(
    invitationTokenCookieName(flow),
    "",
    invitationTokenCookieOptions(0),
  );
  return response;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      { code: "validation_error", detail: "La invitación no es válida." },
      { status: 400 },
    );
  }

  let flow: string | null = null;
  let token: string;
  if ("flow" in payload) {
    if ("token" in payload || !isInvitationFlow(payload.flow)) {
      return NextResponse.json(
        { code: "validation_error", detail: "La invitación no es válida." },
        { status: 400 },
      );
    }
    flow = payload.flow;
    const heldToken = (await cookies()).get(invitationTokenCookieName(flow))?.value;
    if (!isInvitationToken(heldToken)) {
      const response = NextResponse.json(
        {
          code: "invitation_unavailable",
          detail: "La invitación ya no está disponible; abre de nuevo el enlace del correo.",
        },
        { status: 410 },
      );
      return clearInvitationToken(response, flow);
    }
    token = heldToken;
  } else {
    if (!isInvitationToken(payload.token)) {
      return NextResponse.json(
        { code: "validation_error", detail: "La invitación no es válida." },
        { status: 400 },
      );
    }
    token = payload.token;
  }

  try {
    const membership = await serverApiFetch("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    const response = NextResponse.json(membership);
    return flow ? clearInvitationToken(response, flow) : response;
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo aceptar la invitación.";
    const response = NextResponse.json({ code, detail }, { status });
    return flow && (status === 404 || status === 410)
      ? clearInvitationToken(response, flow)
      : response;
  }
}
