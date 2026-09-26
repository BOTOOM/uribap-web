const unsafeCharacters = /[\\\u0000-\u001f\u007f-\u009f]/;
const origin = "https://uribap.local";

export function safeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || unsafeCharacters.test(value)) {
    return "/plan";
  }
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return "/plan";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/plan";
  }
}
