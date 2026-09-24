import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/config/env";

function secureCookieForRequest(request: Request) {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProtocol === "http" || forwardedProtocol === "https") {
    return forwardedProtocol === "https";
  }
  return process.env.NODE_ENV === "production";
}

export async function POST(request: Request) {
  const appOrigin = serverEnv.AUTH_URL
    ? new URL(serverEnv.AUTH_URL).origin
    : new URL(request.url).origin;
  if (request.headers.get("origin") !== appOrigin) {
    return new NextResponse(null, {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const cookieRequest = new Request(request.url, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  const token = await getToken({
    req: cookieRequest,
    secret: serverEnv.AUTH_SECRET,
    secureCookie: secureCookieForRequest(request),
  });
  const redirectUri = new URL("/", appOrigin).toString();
  const logoutUrl = new URL(`${serverEnv.AUTH_ZITADEL_ISSUER}/oidc/v1/end_session`);
  logoutUrl.searchParams.set("post_logout_redirect_uri", redirectUri);
  if (typeof token?.idToken === "string" && token.idToken) {
    logoutUrl.searchParams.set("id_token_hint", token.idToken);
  }

  const response = NextResponse.redirect(logoutUrl, { status: 303 });
  response.headers.set("Cache-Control", "private, no-store");
  const cookieStore = await cookies();
  const names = new Set(
    cookieStore
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/.test(name)),
  );
  names.add("authjs.callback-url");
  names.add("__Secure-authjs.callback-url");
  for (const name of names) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__Secure-"),
    });
  }
  return response;
}
