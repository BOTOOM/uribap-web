import type { Account, Profile, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { serverEnv } from "@/lib/config/env";
import type { HouseholdMembership } from "@/types/next-auth";

async function provisionApiSession(token: JWT): Promise<JWT> {
  if (!token.accessToken) return token;
  try {
    const response = await fetch(`${serverEnv.URIBAP_API_INTERNAL_URL}/me`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return token;
    const data = (await response.json()) as {
      id: string;
      emailVerified: boolean;
      memberships: Array<{
        household_id: string;
        household_name: string;
        role: HouseholdMembership["role"];
        status: string;
      }>;
    };
    token.internalUserId = data.id;
    token.emailVerified = data.emailVerified;
    token.memberships = data.memberships.map((membership) => ({
      householdId: membership.household_id,
      householdName: membership.household_name,
      role: membership.role,
      status: membership.status,
    }));
  } catch {
    return token;
  }
  return token;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) return token;
  try {
    const response = await fetch(`${serverEnv.AUTH_ZITADEL_ISSUER}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: serverEnv.AUTH_ZITADEL_ID,
        client_secret: serverEnv.AUTH_ZITADEL_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      cache: "no-store",
    });
    if (!response.ok) return { ...token, error: "RefreshAccessTokenError" };
    const refreshed = (await response.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      id_token?: string;
    };
    return provisionApiSession({
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      idToken: refreshed.id_token ?? token.idToken,
      error: undefined,
    });
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export async function jwtCallback({ token, account, profile }: { token: JWT; account?: Account | null; profile?: Profile }) {
  if (account) {
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token;
    token.idToken = account.id_token;
    token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
    token.emailVerified = profile?.email_verified === true;
    return provisionApiSession(token);
  }
  if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 30_000) {
    return token;
  }
  return refreshAccessToken(token);
}

export function sessionCallback({ session, token }: { session: Session; token: JWT }) {
  session.user = {
    ...session.user,
    id: token.internalUserId ?? "",
    emailVerified: token.emailVerified === true,
    memberships: token.memberships ?? [],
  };
  return session;
}
