"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Route } from "next";

import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "@/components/shell/ShellNav";

const PRIMARY_ITEMS = [
  { label: "Hoy", href: "/" as Route, icon: "home" as const },
  { label: "Plan", href: "/plan" as Route, icon: "calendar" as const },
  { label: "Compra", href: "/compra" as Route, icon: "cart" as const },
  { label: "Preparar", href: "/preparacion" as Route, icon: "clock" as const },
];

const MORE_HREFS = ["/forecast", "/recetas", "/inventario", "/settings/household"];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const panelRef = useRef<HTMLElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const moreActive = MORE_HREFS.some((href) => isActive(pathname, href));

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        moreRef.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !moreRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <>
      <nav aria-label="Navegación móvil" className="mobile-nav">
        {PRIMARY_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={active ? "active" : undefined}
              href={item.href}
              key={item.href}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
        <button
          aria-controls="mobile-more-panel"
          aria-expanded={open}
          aria-label="Abrir más secciones"
          className={moreActive ? "active" : undefined}
          onClick={() => setOpen((value) => !value)}
          ref={moreRef}
          type="button"
        >
          <Icon name="more" size={18} />
          Más
        </button>
      </nav>
      <aside
        aria-hidden={!open}
        aria-label="Más secciones"
        className={open ? "mobile-more-panel open" : "mobile-more-panel"}
        id="mobile-more-panel"
        inert={!open}
        ref={panelRef}
      >
        {NAV_ITEMS.filter((item) =>
          MORE_HREFS.includes(item.href),
        ).map((item) => (
          <Link
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={isActive(pathname, item.href) ? "active" : undefined}
            href={item.href}
            key={item.href}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </Link>
        ))}
        <form action="/api/auth/federated-logout" method="post">
          <button type="submit">
            <Icon name="signout" size={18} />
            Salir de la sesión
          </button>
        </form>
      </aside>
    </>
  );
}
