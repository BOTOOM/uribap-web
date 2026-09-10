import { redirect } from "next/navigation";
import type { Route } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { auth } from "@/lib/auth/auth";
import { serverApiFetch } from "@/lib/api/server-client";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login" as Route);
  try {
    const currentUser = await serverApiFetch<{ memberships: Array<{ status: string }> }>("/me");
    if (currentUser.memberships.every((membership) => membership.status !== "active")) {
      redirect("/onboarding" as Route);
    }
  } catch {
    if (session.user.memberships.length === 0) redirect("/onboarding" as Route);
  }
  return <AppShell>{children}</AppShell>;
}
