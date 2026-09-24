import NextAuth from "next-auth";
import Zitadel from "next-auth/providers/zitadel";
import type { NextRequest } from "next/server";

import { jwtCallback, sessionCallback } from "@/lib/auth/callbacks";
import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  preserveConcurrentSession,
  refreshFailureMatchesRequest,
  sessionPredatesLogoutMarker,
} from "@/lib/auth/session-response";
import { serverEnv } from "@/lib/config/env";

const nextAuth = NextAuth({
  trustHost: serverEnv.AUTH_TRUST_HOST === "true",
  secret: serverEnv.AUTH_SECRET || undefined,
  session: { strategy: "jwt", maxAge: AUTH_SESSION_MAX_AGE_SECONDS },
  providers: [
    Zitadel({
      clientId: serverEnv.AUTH_ZITADEL_ID,
      clientSecret: serverEnv.AUTH_ZITADEL_SECRET,
      issuer: serverEnv.AUTH_ZITADEL_ISSUER,
      client: { token_endpoint_auth_method: "client_secret_basic" },
      checks: ["pkce", "state", "nonce"],
      authorization: {
        params: {
          scope: "openid profile email offline_access",
          ui_locales: "es",
        },
      },
    }),
  ],
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
});

export const { auth, signIn, signOut } = nextAuth;

const guardSessionResponse = (handler: (request: NextRequest) => Promise<Response>) =>
  async (request: NextRequest) => {
    const pathname = new URL(request.url).pathname.replace(/\/$/, "");
    if (pathname === "/api/auth/session") {
      const secret = process.env.AUTH_SECRET || serverEnv.AUTH_SECRET;
      const blockedByRefresh = await refreshFailureMatchesRequest(request, secret);
      const blockedByLogout = await sessionPredatesLogoutMarker(request, secret);
      if (blockedByRefresh || blockedByLogout) {
        return Response.json(
          {
            user: null,
            error: blockedByRefresh ? "RefreshAccessTokenError" : "SessionInvalidated",
          },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      }
    }
    return preserveConcurrentSession(request, await handler(request));
  };

export const handlers = {
  GET: guardSessionResponse(nextAuth.handlers.GET),
  POST: guardSessionResponse(nextAuth.handlers.POST),
};
