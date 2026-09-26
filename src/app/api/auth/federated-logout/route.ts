import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  LOGOUT_EPOCH_COOKIE,
  REFRESH_FAILURE_COOKIE,
  protectedCookieName,
  signLogoutEpoch,
} from "@/lib/auth/session-response";
import { serverEnv } from "@/lib/config/env";

function canonicalAppOrigin(request: Request): string | null {
  if (serverEnv.AUTH_URL) {
    try {
      const url = new URL(serverEnv.AUTH_URL);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (url.pathname !== "/" && url.pathname !== "")
      ) {
        return null;
      }
      return url.origin;
    } catch {
      return null;
    }
  }
  if (process.env.NODE_ENV !== "production") return new URL(request.url).origin;
  const deploymentHost = process.env.VERCEL_URL;
  if (!deploymentHost) return null;
  try {
    const url = new URL(`https://${deploymentHost}`);
    if (url.hostname !== deploymentHost.toLowerCase() || url.port || url.username || url.password) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const appOrigin = canonicalAppOrigin(request);
  if (!appOrigin) {
    return NextResponse.json(
      { code: "identity_origin_not_configured", detail: "El origen seguro de la aplicación no está configurado." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (request.headers.get("origin") !== appOrigin) {
    return new NextResponse(null, {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  if (serverEnv.AUTH_SECRET.length < 32) {
    return NextResponse.json(
      { code: "identity_provider_unavailable", detail: "La sesión segura no está configurada." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const cookieRequest = new Request(request.url, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  const secure = new URL(appOrigin).protocol === "https:";
  const token = await getToken({
    req: cookieRequest,
    secret: serverEnv.AUTH_SECRET,
    secureCookie: secure,
  });
  const logoutTimestamp = Math.floor(Date.now() / 1000) * 1000;
  const logoutMarker = signLogoutEpoch(
    logoutTimestamp,
    serverEnv.AUTH_SECRET,
    typeof token?.authSessionEpoch === "string" ? token.authSessionEpoch : undefined,
  );
  if (!logoutMarker) {
    return NextResponse.json(
      { code: "identity_provider_unavailable", detail: "No se pudo proteger el cierre de sesión." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
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
      .filter(
        (name) =>
          /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/.test(name) ||
          /^(?:__Secure-)?authjs\.(?:callback-url|csrf-token|state|nonce|pkce\.code_verifier)$/.test(name),
      ),
  );
  for (const name of [
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    protectedCookieName(LOGOUT_EPOCH_COOKIE, true),
    protectedCookieName(LOGOUT_EPOCH_COOKIE, false),
    protectedCookieName(REFRESH_FAILURE_COOKIE, true),
    protectedCookieName(REFRESH_FAILURE_COOKIE, false),
  ]) names.add(name);
  for (const name of names) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__Secure-"),
    });
  }
  const logoutCookieName = protectedCookieName(LOGOUT_EPOCH_COOKIE, secure);
  response.cookies.set(logoutCookieName, logoutMarker, {
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
  return response;
}
