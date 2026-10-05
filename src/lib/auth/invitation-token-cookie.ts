const INVITATION_TOKEN_COOKIE_PREFIX = "uribap_invitation_token";
const INVITATION_FLOW_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

export const INVITATION_TOKEN_MAX_AGE = 168 * 3600;

export function isInvitationFlow(flow: unknown): flow is string {
  return typeof flow === "string" && INVITATION_FLOW_PATTERN.test(flow);
}

export function invitationTokenCookieName(flow: string) {
  if (!isInvitationFlow(flow)) {
    throw new TypeError("Invalid invitation flow.");
  }
  return `${INVITATION_TOKEN_COOKIE_PREFIX}_${flow}`;
}

export function isInvitationToken(token: unknown): token is string {
  return typeof token === "string" && INVITATION_TOKEN_PATTERN.test(token);
}

export function invitationTokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
