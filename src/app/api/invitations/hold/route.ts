import { NextResponse } from "next/server";

import {
  INVITATION_TOKEN_MAX_AGE,
  invitationTokenCookieName,
  invitationTokenCookieOptions,
  isInvitationToken,
} from "@/lib/auth/invitation-token-cookie";

function applyHandoffHeaders(response: NextResponse) {
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!isInvitationToken(token)) {
    return applyHandoffHeaders(
      NextResponse.json(
        { code: "validation_error", detail: "La invitación no es válida." },
        { status: 400 },
      ),
    );
  }

  const flow = crypto.randomUUID();
  const response = NextResponse.redirect(
    new URL(`/invitations/accept?flow=${flow}`, request.url),
    { status: 303 },
  );
  response.cookies.set(
    invitationTokenCookieName(flow),
    token,
    invitationTokenCookieOptions(INVITATION_TOKEN_MAX_AGE),
  );
  return applyHandoffHeaders(response);
}
