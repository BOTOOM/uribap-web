import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/config/env";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = await getToken({ req: request, secret: serverEnv.AUTH_SECRET });
  const redirectUri = new URL("/", request.url).toString();
  const logoutUrl = new URL(`${serverEnv.AUTH_ZITADEL_ISSUER}/oidc/v1/end_session`);
  logoutUrl.searchParams.set("post_logout_redirect_uri", redirectUri);
  if (token?.idToken) logoutUrl.searchParams.set("id_token_hint", token.idToken);

  const response = NextResponse.redirect(logoutUrl);
  for (const name of ["authjs.session-token", "__Secure-authjs.session-token", "authjs.callback-url"]) {
    cookieStore.delete(name);
  }
  return response;
}
