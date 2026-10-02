export function invitationLoginRedirect(flow?: string | null) {
  const returnTo = flow
    ? `/invitations/accept?flow=${encodeURIComponent(flow)}`
    : "/invitations/accept";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
