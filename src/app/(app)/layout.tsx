import { redirect } from "next/navigation";
import type { Route } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { ApiRequestError, serverApiFetch } from "@/lib/api/server-client";
import { auth } from "@/lib/auth/auth";
import type { components } from "@/lib/api/generated/schema";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login" as Route);
  let currentUser: components["schemas"]["CurrentUserResponse"];
  try {
    currentUser = await serverApiFetch<components["schemas"]["CurrentUserResponse"]>("/me");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/login" as Route);
    }
    throw error;
  }
  if (!currentUser.memberships.some((membership) => membership.status === "active")) {
    redirect("/onboarding" as Route);
  }
  return <AppShell>{children}</AppShell>;
}
