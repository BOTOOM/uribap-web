import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";

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
  const request = new Request("http://uribap.local", {
    headers: {
      cookie: cookieHeader,
      "x-forwarded-proto": requestHeaders.get("x-forwarded-proto") ?? "http",
    },
  });
  const token = await getToken({ req: request, secret: serverEnv.AUTH_SECRET });
  return typeof token?.accessToken === "string" ? token.accessToken : null;
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
  if (response.ok) return (await response.json()) as T;
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
