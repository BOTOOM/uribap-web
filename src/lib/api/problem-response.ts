import { NextResponse } from "next/server";

export function problemResponse(error: unknown, fallback: string) {
  const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
  const code =
    error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : null;
  const detail =
    error instanceof Error && "responseDetail" in error && error.responseDetail !== undefined
      ? error.responseDetail
      : error instanceof Error
        ? error.message
        : fallback;
  return NextResponse.json({ ...(code ? { code } : {}), detail }, { status });
}
