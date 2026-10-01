import { NextResponse } from "next/server";

import {
  invitationTokenCookieOptions,
  INVITATION_TOKEN_COOKIE,
} from "@/lib/auth/invitation-token-cookie";

function applyHandoffHeaders(response: NextResponse) {
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return applyHandoffHeaders(
      NextResponse.json(
        { code: "validation_error", detail: "La invitación no es válida." },
        { status: 400 },
      ),
    );
  }

  const loginUrl = new URL("/login?returnTo=/invitations/accept", request.url);
  const response = NextResponse.redirect(loginUrl, { status: 303 });
  response.cookies.set(
    INVITATION_TOKEN_COOKIE,
    token,
    invitationTokenCookieOptions(3600),
  );
  return applyHandoffHeaders(response);
}
