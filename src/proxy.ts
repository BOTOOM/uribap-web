import { NextRequest, NextResponse } from "next/server";

import { handlers } from "@/lib/auth/auth";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/auth"
  ) {
    return NextResponse.next();
  }

  const sessionHeaders = new Headers(request.headers);
  sessionHeaders.delete("content-length");
  sessionHeaders.delete("content-type");
  let setCookies: string[] = [];
  let response: NextResponse;

  try {
    const sessionResponse = await handlers.GET(
      new NextRequest(new URL("/api/auth/session", request.url), { headers: sessionHeaders }),
    );
    setCookies = sessionResponse.headers.getSetCookie();
    const session = (await sessionResponse.json().catch(() => null)) as {
      user?: unknown;
    } | null;

    if (!sessionResponse.ok) {
      response = NextResponse.json(
        {
          code: "identity_provider_unavailable",
          detail: "No pudimos comprobar tu sesión.",
        },
        { status: 503 },
      );
    } else if (!session?.user) {
      if (pathname.startsWith("/api/")) {
        response = NextResponse.json(
          { code: "unauthorized", detail: "Inicia sesión para continuar." },
          { status: 401 },
        );
      } else {
        const login = new URL("/login", request.url);
        login.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
        response = NextResponse.redirect(login);
      }
    } else {
      const forwarded = new NextRequest(request.url, {
        headers: new Headers(request.headers),
      });
      for (const value of setCookies) {
        const pair = value.split(";", 1)[0];
        const separator = pair.indexOf("=");
        if (separator < 1) continue;
        const name = pair.slice(0, separator);
        const cookieValue = decodeURIComponent(pair.slice(separator + 1));
        if (!cookieValue || /(?:^|;)\s*max-age=0(?:;|$)/i.test(value)) {
          forwarded.cookies.delete(name);
        } else {
          forwarded.cookies.set(name, cookieValue);
        }
      }
      response = NextResponse.next({ request: { headers: forwarded.headers } });
    }
  } catch {
    response = NextResponse.json(
      {
        code: "identity_provider_unavailable",
        detail: "No pudimos comprobar tu sesión.",
      },
      { status: 503 },
    );
  }

  for (const cookie of setCookies) response.headers.append("set-cookie", cookie);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/plan/:path*",
    "/recetas/:path*",
    "/inventario/:path*",
    "/compra/:path*",
    "/preparacion/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/forecast/:path*",
    "/ingredientes/:path*",
    "/api/:path*",
  ],
};
