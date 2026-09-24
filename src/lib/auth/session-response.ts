import { createHmac, timingSafeEqual } from "node:crypto";

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export const LOGOUT_EPOCH_COOKIE = "uribap-auth-logout-before";
export const REFRESH_FAILURE_COOKIE = "uribap-refresh-failure";
export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const sessionCookie = /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/;

export function protectedCookieName(name: string, secure: boolean): string {
  return `${secure ? "__Secure-" : ""}${name}`;
}

export function refreshSessionFingerprint(
  accessToken: string | undefined,
  refreshToken: string | undefined,
  secret: string,
): string | undefined {
  if (!accessToken || !secret || secret.length < 32) return undefined;
  return createHmac("sha256", secret)
    .update("refresh-state:")
    .update(accessToken)
    .update("\u0000")
    .update(refreshToken ?? "")
    .digest("base64url");
}

export function protectedCookieValue(cookieHeader: string, name: string): string | undefined {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function expiredCookieHeader(name: string, secure: boolean): string {
  return `${name}=; Path=/; Max-Age=0;${secure ? " Secure;" : ""} HttpOnly; SameSite=Lax`;
}

export function logoutEpochCookieHeader(timestamp: number, secret: string, secure: boolean): string | undefined {
  const marker = signLogoutEpoch(timestamp, secret);
  if (!marker) return undefined;
  const name = protectedCookieName(LOGOUT_EPOCH_COOKIE, secure);
  return `${name}=${marker}; Path=/; Max-Age=${AUTH_SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function refreshFailureCookieHeader(
  fingerprint: string,
  secure: boolean,
): string {
  const name = protectedCookieName(REFRESH_FAILURE_COOKIE, secure);
  return `${name}=${fingerprint}; Path=/; Max-Age=${AUTH_SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function signLogoutEpoch(timestamp: number, secret: string): string | undefined {
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0 || secret.length < 32) return undefined;
  const value = String(timestamp);
  const signature = createHmac("sha256", secret)
    .update(`${LOGOUT_EPOCH_COOKIE}:${value}`)
    .digest("base64url");
  return `${value}.${signature}`;
}

export function readLogoutEpoch(marker: string | undefined, secret: string): number | undefined {
  if (!marker || secret.length < 32) return undefined;
  const match = marker.match(/^(\d{1,16})\.([A-Za-z0-9_-]{43})$/);
  if (!match) return undefined;
  const timestamp = Number(match[1]);
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp <= 0 ||
    timestamp > Date.now() + 60_000 ||
    Date.now() - timestamp > AUTH_SESSION_MAX_AGE_SECONDS * 1000
  ) {
    return undefined;
  }
  const expected = Buffer.from(signLogoutEpoch(timestamp, secret)!.split(".")[1], "base64url");
  const actual = Buffer.from(match[2], "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected)
    ? timestamp
    : undefined;
}

export async function refreshFailureMatchesRequest(
  request: NextRequest,
  secret: string,
): Promise<boolean> {
  if (secret.length < 32) return false;
  const secure = new URL(request.url).protocol === "https:";
  const marker = request.cookies.get(protectedCookieName(REFRESH_FAILURE_COOKIE, secure))?.value;
  if (!marker) return false;
  try {
    const token = await getToken({ req: request, secret, secureCookie: secure });
    return (
      typeof token?.accessToken === "string" &&
      refreshSessionFingerprint(token.accessToken, token.refreshToken, secret) === marker
    );
  } catch {
    return false;
  }
}

export async function sessionPredatesLogoutMarker(
  request: NextRequest,
  secret: string,
): Promise<boolean> {
  if (secret.length < 32) return false;
  const secure = new URL(request.url).protocol === "https:";
  const marker = request.cookies.get(protectedCookieName(LOGOUT_EPOCH_COOKIE, secure))?.value;
  const logoutAt = readLogoutEpoch(marker, secret);
  if (logoutAt === undefined) return false;
  try {
    const token = await getToken({ req: request, secret, secureCookie: secure });
    return typeof token?.authenticatedAt !== "number" || token.authenticatedAt <= logoutAt;
  } catch {
    return true;
  }
}

export async function stripPrivateSessionMetadata(response: Response): Promise<Response> {
  const parsed: unknown = await response.clone().json().catch(() => null);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return response;
  const payload = parsed as Record<string, unknown>;
  const privateFields = ["authenticatedAt", "refreshFailureFingerprint", "refreshSessionFingerprint"];
  if (!privateFields.some((field) => field in payload)) return response;
  for (const field of privateFields) delete payload[field];
  const headers = new Headers(response.headers);
  const cookies = response.headers.getSetCookie();
  headers.delete("set-cookie");
  headers.delete("content-length");
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function preserveConcurrentSession(request: Request, response: Response): Promise<Response> {
  if (new URL(request.url).pathname.replace(/\/$/, "") !== "/api/auth/session") return response;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie = cookieHeader
    .split(";")
    .some((part) => sessionCookie.test(part.trim().split("=", 1)[0]));
  if (!hasSessionCookie) return response;
  const payload = (await response.clone().json().catch(() => null)) as {
    user?: unknown;
    error?: unknown;
    authenticatedAt?: unknown;
    refreshFailureFingerprint?: unknown;
    refreshSessionFingerprint?: unknown;
  } | null;
  const secure = new URL(request.url).protocol === "https:";
  const refreshFailureName = protectedCookieName(REFRESH_FAILURE_COOKIE, secure);
  const logoutEpochName = protectedCookieName(LOGOUT_EPOCH_COOKIE, secure);
  const refreshFailureMatch =
    payload?.error === "RefreshAccessTokenError" &&
    typeof payload.refreshFailureFingerprint === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(payload.refreshFailureFingerprint);
  const values = response.headers.getSetCookie();
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");

  if (refreshFailureMatch) {
    for (const value of values) {
      const pair = value.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator < 1 || !sessionCookie.test(pair.slice(0, separator))) {
        headers.append("set-cookie", value);
      }
    }
    headers.append(
      "set-cookie",
      refreshFailureCookieHeader(payload.refreshFailureFingerprint as string, secure),
    );
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  const refreshFailureMarker = protectedCookieValue(cookieHeader, refreshFailureName);
  const logoutEpochMarker = protectedCookieValue(cookieHeader, logoutEpochName);
  const authSecret = process.env.AUTH_SECRET ?? "";
  const logoutEpoch = readLogoutEpoch(logoutEpochMarker, authSecret);
  const authenticatedAt = payload?.authenticatedAt;
  const sessionPrecedesLogout =
    logoutEpoch !== undefined &&
    (typeof authenticatedAt !== "number" || authenticatedAt <= logoutEpoch);
  if (payload?.user) {
    const refreshedSession =
      typeof payload.refreshSessionFingerprint === "string" &&
      payload.refreshSessionFingerprint !== refreshFailureMarker;
    if (refreshFailureMarker && refreshedSession) {
      headers.append("set-cookie", expiredCookieHeader(refreshFailureName, secure));
    }
    if (logoutEpochMarker && logoutEpoch !== undefined && !sessionPrecedesLogout) {
      headers.append("set-cookie", expiredCookieHeader(logoutEpochName, secure));
    }
    if (headers.getSetCookie().length === 0) return response;
    for (const value of values) headers.append("set-cookie", value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  const retained = values.filter((value) => {
    const pair = value.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator < 1 || !sessionCookie.test(pair.slice(0, separator))) return true;
    const clears = pair.slice(separator + 1) === "" || /(?:^|;)\s*max-age=0(?:;|$)/i.test(value);
    return !clears;
  });
  if (retained.length === values.length) return response;
  headers.delete("set-cookie");
  for (const value of retained) headers.append("set-cookie", value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
