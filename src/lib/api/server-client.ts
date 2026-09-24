import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";

import {
  refreshFailureMatchesRequest,
  sessionPredatesLogoutMarker,
} from "@/lib/auth/session-response";
import { serverEnv } from "@/lib/config/env";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly detail: string,
  ) {
    super(detail);
  }
}

async function getServerAccessToken() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const cookieHeader = cookieStore.toString();
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  const scheme =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : process.env.NODE_ENV === "production"
        ? "https"
        : "http";
  const request = new NextRequest(`${scheme}://uribap.local`, {
    headers: { cookie: cookieHeader },
  });
  const secret = process.env.AUTH_SECRET || serverEnv.AUTH_SECRET;
  if (
    (await refreshFailureMatchesRequest(request, secret)) ||
    (await sessionPredatesLogoutMarker(request, secret))
  ) {
    return null;
  }
  const token = await getToken({ req: request, secret, secureCookie: scheme === "https" });
  const expiration = token?.accessTokenExpires;
  return token?.error !== "RefreshAccessTokenError" &&
    typeof token?.accessToken === "string" &&
    token.accessToken &&
    typeof expiration === "number" &&
    Number.isFinite(expiration) &&
    expiration > Date.now()
    ? token.accessToken
    : null;
}

export async function serverApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    throw new ApiRequestError(401, "unauthorized", "Inicia sesión para continuar.");
  }
  const response = await fetch(`${serverEnv.URIBAP_API_INTERNAL_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (response.ok) {
    if (response.status === 204) return null as T;
    return (await response.json()) as T;
  }
  const problem = (await response.json().catch(() => null)) as {
    code?: string;
    detail?: string;
  } | null;
  throw new ApiRequestError(
    response.status,
    problem?.code ?? `http_${response.status}`,
    problem?.detail ?? "No se pudo completar la solicitud.",
  );
}

export async function serverHouseholdFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const currentUser = await serverApiFetch<{
    memberships: Array<{ household_id: string; status: string }>;
  }>("/me");
  const membership = currentUser.memberships.find((item) => item.status === "active");
  if (!membership) throw new ApiRequestError(403, "forbidden", "No hay un hogar activo.");
  return serverApiFetch<T>(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "X-Household-ID": membership.household_id,
    },
  });
}
