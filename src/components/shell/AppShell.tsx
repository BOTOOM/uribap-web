import Link from "next/link";
import type { Route } from "next";

type NavigationItem = {
  label: string;
  href: Route;
};

const navigationItems: NavigationItem[] = [
  { label: "Resumen", href: "/" },
  { label: "Plan semanal", href: "/plan" },
  { label: "Recetas", href: "/recetas" },
  { label: "Inventario", href: "/inventario" },
  { label: "Compra", href: "/compra" },
  { label: "Preparación", href: "/preparacion" },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <div className="app-frame">
        <aside className="desktop-sidebar" aria-label="Navegación principal">
          <Link className="brand-mark" href="/" aria-label="Uribap, ir al resumen">
            <span aria-hidden="true">U</span>
            <span>Uribap</span>
          </Link>
          <nav aria-label="Navegación principal">
            <ul className="navigation-list">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link className={item.href === "/" ? "navigation-link is-active" : "navigation-link"} href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar-footer">
            <span className="eyebrow">Hogar compartido</span>
            <span className="sidebar-note">Dos personas · decisiones visibles</span>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <span className="topbar-context">Hoy · foundation</span>
            <span className="topbar-status">API contract-first</span>
          </header>
          <main id="main-content">{children}</main>
          <nav className="mobile-navigation" aria-label="Navegación móvil">
            {navigationItems.slice(0, 4).map((item) => (
              <Link className={item.href === "/" ? "mobile-navigation-link is-active" : "mobile-navigation-link"} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
