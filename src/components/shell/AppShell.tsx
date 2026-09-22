import Link from "next/link";
import type { Route } from "next";

import { Assistant } from "@/components/shell/Assistant";
import { MobileNav } from "@/components/shell/MobileNav";
import { ShellNav } from "@/components/shell/ShellNav";
import { SkipLink } from "@/components/shell/SkipLink";
import { ToastRegion } from "@/components/shell/ToastRegion";
import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { ApiRequestError, serverApiFetch, serverHouseholdFetch } from "@/lib/api/server-client";

type CurrentUser = {
  memberships: Array<{
    household_id: string;
    household_name: string;
    role: string;
    status: string;
  }>;
};

type Members = {
  items: Array<{ user_id: string; display_name: string | null; email: string | null }>;
};

type ShoppingList = { items: Array<{ status: string }> };

function todayLabel(): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function initials(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?";
  return source.trim().charAt(0).toUpperCase();
}

async function loadShell() {
  try {
    const me = await serverApiFetch<CurrentUser>("/me");
    const membership = me.memberships.find((item) => item.status === "active");
    if (!membership) return { householdName: null, members: [] as Members["items"], pendingShopping: 0 };
    const [members, list] = await Promise.all([
      serverApiFetch<Members>(`/households/${membership.household_id}/members`).catch(() => ({
        items: [] as Members["items"],
      })),
      serverHouseholdFetch<ShoppingList>("/shopping-lists/current").catch(() => null),
    ]);
    return {
      householdName: membership.household_name,
      members: members.items,
      pendingShopping: list
        ? list.items.filter((item) => item.status === "pending").length
        : 0,
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { householdName: null, members: [] as Members["items"], pendingShopping: 0 };
    }
    throw error;
  }
}

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { householdName, members, pendingShopping } = await loadShell();
  const memberCount = members.length;

  return (
    <>
      <SkipLink />
      <div className="app">
        <aside className="sidebar">
          <Link aria-label="Uribap, ir al resumen" className="brand" href={"/" as Route}>
            <BrandMark />
            <BrandWordmark />
          </Link>
          {householdName ? <span className="side-label">{householdName}</span> : null}
          <ShellNav shoppingCount={pendingShopping} />
          <div className="household-mini">
            {memberCount > 0 ? (
              <div aria-hidden="true" className="avatars">
                {members.slice(0, 4).map((member) => (
                  <span className="avatar" key={member.user_id}>
                    {initials(member.display_name, member.email)}
                  </span>
                ))}
              </div>
            ) : null}
            <strong>{householdName ?? "Hogar"}</strong>
            <span className="meta">
              {memberCount === 1 ? "1 persona" : `${memberCount} personas`} · sincronizado
            </span>
            <form action="/api/auth/federated-logout" method="post">
              <button className="sidebar-signout" type="submit">
                <Icon name="signout" size={15} />
                Salir de la sesión
              </button>
            </form>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <span className="crumb">{todayLabel()}</span>
            <div className="top-actions">
              {members[0] ? (
                <Link
                  aria-label="Abrir ajustes del hogar"
                  className="avatar"
                  href={"/settings/household" as Route}
                >
                  {initials(members[0].display_name, members[0].email)}
                </Link>
              ) : null}
            </div>
          </header>
          <main className="main" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
      <Assistant />
      <ToastRegion />
    </>
  );
}
