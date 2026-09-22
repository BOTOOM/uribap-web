"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { Icon, type IconName } from "@/components/ui/Icon";

export type NavItem = {
  label: string;
  href: Route;
  icon: IconName;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Resumen", href: "/", icon: "home" },
  { label: "Plan semanal", href: "/plan", icon: "calendar" },
  { label: "Previsión", href: "/forecast", icon: "spark" },
  { label: "Recetas", href: "/recetas", icon: "book" },
  { label: "Inventario", href: "/inventario", icon: "package" },
  { label: "Ingredientes", href: "/ingredientes", icon: "carrot" },
  { label: "Compra", href: "/compra", icon: "cart" },
  { label: "Preparación", href: "/preparacion", icon: "clock" },
  { label: "Hogar", href: "/settings/household" as Route, icon: "users" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShellNav({ shoppingCount = 0 }: { shoppingCount?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal">
      <ul className="nav-list">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "nav-item active" : "nav-item"}
                href={item.href}
              >
                <Icon name={item.icon} />
                {item.label}
                {item.href === "/compra" && shoppingCount > 0 ? (
                  <span className="nav-badge">{shoppingCount}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
