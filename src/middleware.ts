import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";

const protectedPaths = ["/plan", "/recetas", "/inventario", "/compra", "/preparacion", "/settings", "/onboarding"];

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  if (protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && !request.auth) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    const returnTo = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("returnTo", returnTo.startsWith("/") ? returnTo : "/");
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/plan/:path*", "/recetas/:path*", "/inventario/:path*", "/compra/:path*", "/preparacion/:path*", "/settings/:path*", "/onboarding/:path*"],
};
