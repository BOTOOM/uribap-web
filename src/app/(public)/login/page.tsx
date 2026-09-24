import { cookies } from "next/headers";

import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import { signIn } from "@/lib/auth/auth";
import {
  LOGOUT_EPOCH_COOKIE,
  protectedCookieName,
  readLogoutEpoch,
} from "@/lib/auth/session-response";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { serverEnv } from "@/lib/config/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const destination = safeReturnTo(returnTo);
  const deploymentOrigin =
    serverEnv.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const secure = new URL(deploymentOrigin).protocol === "https:";
  const logoutMarker = (await cookies()).get(protectedCookieName(LOGOUT_EPOCH_COOKIE, secure))?.value;
  const reauthenticate = readLogoutEpoch(logoutMarker, serverEnv.AUTH_SECRET) !== undefined;
  return (
    <main className="auth-shell">
      <section aria-labelledby="login-title" className="card auth-card">
        <div className="brand auth-logo">
          <BrandMark />
          <BrandWordmark />
        </div>
        <h1 id="login-title" style={{ textAlign: "center" }}>
          Entra para cuidar el plan de casa.
        </h1>
        <p className="muted" style={{ textAlign: "center" }}>
          Tu plan de comidas, la despensa y las tareas del hogar, en un mismo lugar.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn(
              "zitadel",
              { redirectTo: destination },
              reauthenticate ? { prompt: "login", max_age: "0" } : undefined,
            );
          }}
          style={{ marginTop: 18 }}
        >
          <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
            Entrar a Uribap
          </button>
        </form>
        <p className="helper" style={{ marginTop: 16, textAlign: "center" }}>
          Continuarás al acceso seguro de Uribap para iniciar sesión o recuperar tu cuenta.
        </p>
      </section>
    </main>
  );
}
