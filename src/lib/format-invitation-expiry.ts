export function formatInvitationExpiry(value: string, timeZone?: string) {
  return new Intl.DateTimeFormat(
    "es",
    timeZone ? { dateStyle: "medium", timeZone } : { dateStyle: "medium" },
  ).format(new Date(value));
}
