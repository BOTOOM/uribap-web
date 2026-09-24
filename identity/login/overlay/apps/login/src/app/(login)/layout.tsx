import "@/styles/globals.scss";
import "@/styles/uribap-login.css";

import { LanguageProvider } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Skeleton } from "@/components/skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeSwitch from "@/components/theme-switch";
import { UribapBrand } from "@/components/uribap-brand";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getAllowedLanguages } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Manrope, Newsreader } from "next/font/google";
import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
});
const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Accede a Uribap", template: "%s · Uribap" },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { serviceConfig } = getServiceConfig(await headers());
  const settings = await getAllowedLanguages({ serviceConfig }).catch(() => undefined);
  const languages = settings?.allowedLanguages?.length
    ? settings.allowedLanguages
        .filter((code) => LANGS.some((language) => language.code === code))
        .map((code) => getLanguage(code))
    : LANGS;
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${body.variable} ${display.variable} uribap-identity`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            <a className="uribap-skip" href="#uribap-access">
              Ir al acceso
            </a>
            <header className="uribap-login-header">
              <a
                href={process.env.URIBAP_WEB_URL || "https://uribap.edwardiaz.dev"}
                aria-label="Volver a Uribap"
              >
                <UribapBrand />
              </a>
            </header>
            <main className="uribap-login-grid" id="uribap-access">
              <aside className="uribap-login-intro" aria-labelledby="uribap-intro-title">
                <h2 id="uribap-intro-title">El plan de casa empieza contigo.</h2>
                <p>Un lugar para organizar las comidas, cuidar la despensa y compartir las tareas.</p>
                <span className="uribap-login-note">Tu hogar, a tu ritmo.</span>
              </aside>
              <section className="uribap-login-form" aria-label="Acceso a Uribap">
                <Suspense
                  fallback={
                    <Skeleton>
                      <div className="uribap-login-loading" />
                    </Skeleton>
                  }
                >
                  <LanguageProvider>
                    {children}
                    <div className="uribap-login-tools">
                      <LanguageSwitcher languages={languages} />
                      <ThemeSwitch />
                    </div>
                  </LanguageProvider>
                </Suspense>
              </section>
            </main>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
