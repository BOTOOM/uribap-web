import { NextResponse } from "next/server";

import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";

type EntryDetail = components["schemas"]["MealPlanEntryDetailResponse"];

export async function GET(
  _request: Request,
  context: { params: Promise<{ planId: string; entryId: string }> },
) {
  const { planId, entryId } = await context.params;
  try {
    const detail = await serverHouseholdFetch<EntryDetail>(
      `/plans/${planId}/entries/${entryId}/detail`,
    );
    return NextResponse.json({ detail });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo cargar el detalle." },
      { status },
    );
  }
}
