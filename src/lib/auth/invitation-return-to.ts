export function invitationLoginRedirect(token?: string) {
  if (token) return `/api/invitations/hold?token=${encodeURIComponent(token)}`;
  return `/login?returnTo=${encodeURIComponent("/invitations/accept")}`;
}
