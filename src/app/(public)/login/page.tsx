import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import { signIn } from "@/lib/auth/auth";

function safeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/plan";
}

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
          Tu identidad se gestiona con ZITADEL. Uribap nunca muestra tus tokens en el
          navegador.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("zitadel", { redirectTo: destination });
          }}
          style={{ marginTop: 18 }}
        >
          <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
            Entrar con ZITADEL
          </button>
        </form>
        <p className="helper" style={{ marginTop: 16, textAlign: "center" }}>
          En local también puedes registrar una cuenta nueva desde la pantalla de ZITADEL.
        </p>
      </section>
    </main>
  );
}
