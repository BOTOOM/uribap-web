const sessionCookie = /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/;

export async function preserveConcurrentSession(request: Request, response: Response): Promise<Response> {
  if (new URL(request.url).pathname.replace(/\/$/, "") !== "/api/auth/session") return response;
  const hasSessionCookie = (request.headers.get("cookie") ?? "")
    .split(";")
    .some((part) => sessionCookie.test(part.trim().split("=", 1)[0]));
  if (!hasSessionCookie) return response;
  const payload = (await response.clone().json().catch(() => null)) as { user?: unknown } | null;
  if (payload?.user) return response;
  const values = response.headers.getSetCookie();
  const retained = values.filter((value) => {
    const pair = value.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator < 1 || !sessionCookie.test(pair.slice(0, separator))) return true;
    const clears = pair.slice(separator + 1) === "" || /(?:^|;)\s*max-age=0(?:;|$)/i.test(value);
    return !clears;
  });
  if (retained.length === values.length) return response;
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  for (const value of retained) headers.append("set-cookie", value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
