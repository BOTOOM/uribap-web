import type { Account, Profile, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

import type { components } from "@/lib/api/generated/schema";
import { serverEnv } from "@/lib/config/env";
import type { HouseholdMembership } from "@/types/next-auth";

async function provisionApiSession(token: JWT): Promise<JWT> {
  if (typeof token.accessToken !== "string" || !token.accessToken) return token;
  try {
    const response = await fetch(`${serverEnv.URIBAP_API_INTERNAL_URL}/me`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return token;
    const data = (await response.json()) as components["schemas"]["CurrentUserResponse"];
    token.internalUserId = data.id;
    token.email = data.email ?? token.email;
    token.name = data.display_name ?? token.name;
    token.emailVerified = data.email_verified === true;
    token.memberships = data.memberships.map((membership) => ({
      householdId: membership.household_id,
      householdName: membership.household_name,
      role: membership.role as HouseholdMembership["role"],
      status: membership.status,
    }));
  } catch {
    return token;
  }
  return token;
}

async function refreshAccessToken(token: JWT): Promise<JWT | null> {
  if (typeof token.refreshToken !== "string" || !token.refreshToken) return null;
  try {
    const formEncode = (value: string) => new URLSearchParams({ value }).toString().slice(6);
    const credentials = Buffer.from(
      `${formEncode(serverEnv.AUTH_ZITADEL_ID)}:${formEncode(serverEnv.AUTH_ZITADEL_SECRET)}`,
    ).toString("base64");
    const response = await fetch(`${serverEnv.AUTH_ZITADEL_ISSUER}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const refreshed = (await response.json()) as Record<string, unknown>;
    const accessToken = refreshed.access_token;
    const expiresIn = refreshed.expires_in;
    if (
      typeof accessToken !== "string" ||
      !accessToken ||
      typeof expiresIn !== "number" ||
      !Number.isFinite(expiresIn) ||
      expiresIn <= 0
    ) {
      return null;
    }
    if (
      Object.hasOwn(refreshed, "refresh_token") &&
      (typeof refreshed.refresh_token !== "string" || !refreshed.refresh_token)
    ) {
      return null;
    }
    if (
      Object.hasOwn(refreshed, "id_token") &&
      (typeof refreshed.id_token !== "string" || !refreshed.id_token)
    ) {
      return null;
    }
    const accessTokenExpires = Date.now() + expiresIn * 1000;
    if (!Number.isFinite(accessTokenExpires)) return null;
    return provisionApiSession({
      ...token,
      accessToken,
      accessTokenExpires,
      refreshToken: (refreshed.refresh_token as string | undefined) ?? token.refreshToken,
      idToken: (refreshed.id_token as string | undefined) ?? token.idToken,
      error: undefined,
    });
  } catch {
    return null;
  }
}

export async function jwtCallback({
  token,
  account,
}: {
  token: JWT;
  account?: Account | null;
  profile?: Profile;
}): Promise<JWT | null> {
  if (account) {
    if (typeof account.access_token !== "string" || !account.access_token) return null;
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token ?? undefined;
    token.idToken = account.id_token ?? undefined;
    token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
    token.emailVerified = false;
    return provisionApiSession(token);
  }
  if (
    typeof token.accessToken === "string" &&
    token.accessToken &&
    typeof token.accessTokenExpires === "number" &&
    Number.isFinite(token.accessTokenExpires) &&
    Date.now() < token.accessTokenExpires - 30_000
  ) {
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
