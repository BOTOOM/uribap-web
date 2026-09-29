export function invitationLoginRedirect(token?: string) {
  const acceptPath = token
    ? `/invitations/accept?token=${encodeURIComponent(token)}`
    : "/invitations/accept";
  return `/login?returnTo=${encodeURIComponent(acceptPath)}`;
}
