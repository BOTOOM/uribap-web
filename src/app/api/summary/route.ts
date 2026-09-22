import { NextResponse } from "next/server";

import { serverApiFetch, serverHouseholdFetch } from "@/lib/api/server-client";

type MembershipResponse = {
  memberships: Array<{ household_id: string; status: string }>;
};

type TaskPage = {
  items: Array<{
    id: string;
    title: string;
    due_at: string;
    status: string;
  }>;
};

type ShoppingList = {
  items: Array<{ status: string }>;
};

type InventoryPage = {
  items: Array<{ expired: boolean; expiration_date: string | null }>;
};

function daysUntil(dateIso: string): number {
  const now = Date.now();
  return Math.ceil((new Date(`${dateIso}T23:59:59Z`).getTime() - now) / 86_400_000);
}

export async function GET() {
  try {
    const currentUser = await serverApiFetch<MembershipResponse>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) {
      return NextResponse.json(
        { code: "forbidden", detail: "No hay un hogar activo." },
        { status: 403 },
      );
    }
    const [tasksResult, listResult, lotsResult] = await Promise.allSettled([
      serverHouseholdFetch<TaskPage>("/preparation-tasks"),
      serverHouseholdFetch<ShoppingList>("/shopping-lists/current"),
      serverHouseholdFetch<InventoryPage>("/inventory"),
    ]);
    const tasks = tasksResult.status === "fulfilled" ? tasksResult.value.items : [];
    const nextTask =
      tasks
        .filter((task) => task.status === "pending")
        .sort((a, b) => a.due_at.localeCompare(b.due_at))[0] ?? null;
    const pendingShopping =
      listResult.status === "fulfilled"
        ? listResult.value.items.filter((item) => item.status === "pending").length
        : 0;
    const expiringSoon =
      lotsResult.status === "fulfilled"
        ? lotsResult.value.items.filter(
            (lot) => !lot.expired && lot.expiration_date && daysUntil(lot.expiration_date) <= 2,
          ).length
        : 0;
    return NextResponse.json({
      nextTask,
      pendingShopping,
      expiringSoon,
    });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const code =
      error instanceof Error && "code" in error ? String(error.code) : "internal_error";
    const detail =
      error instanceof Error ? error.message : "No se pudo cargar el resumen.";
    return NextResponse.json({ code, detail }, { status });
  }
}
