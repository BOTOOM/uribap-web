import { NextResponse } from "next/server";

import { serverApiFetch } from "@/lib/api/server-client";

export async function GET(request: Request) {
  try {
    const currentUser = await serverApiFetch<{
      memberships: Array<{ household_id: string; status: string }>;
    }>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) {
      return NextResponse.json(
        { code: "forbidden", detail: "No hay un hogar activo." },
        { status: 403 },
      );
    }
    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "1";
    const pageSize = url.searchParams.get("page_size") ?? "20";
    const feed = await serverApiFetch(
      `/households/${membership.household_id}/activity?page=${page}&page_size=${pageSize}`,
    );
    return NextResponse.json(feed);
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code = error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail = error instanceof Error ? error.message : "No se pudo cargar la actividad.";
    return NextResponse.json({ code, detail }, { status });
  }
}
