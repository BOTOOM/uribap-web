import NextAuth from "next-auth";
import Zitadel from "next-auth/providers/zitadel";

import { jwtCallback, sessionCallback } from "@/lib/auth/callbacks";
import { serverEnv } from "@/lib/config/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: serverEnv.AUTH_TRUST_HOST === "true",
  secret: serverEnv.AUTH_SECRET || undefined,
  session: { strategy: "jwt" },
  providers: [
    Zitadel({
      clientId: serverEnv.AUTH_ZITADEL_ID,
      clientSecret: serverEnv.AUTH_ZITADEL_SECRET,
      issuer: serverEnv.AUTH_ZITADEL_ISSUER,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
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
