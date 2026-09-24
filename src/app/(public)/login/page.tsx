import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import { signIn } from "@/lib/auth/auth";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const destination = safeReturnTo(returnTo);
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
            await signIn("zitadel", { redirectTo: destination });
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
