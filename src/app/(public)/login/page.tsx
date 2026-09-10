import { signIn } from "@/lib/auth/auth";

function safeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/plan";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const destination = safeReturnTo(returnTo);
  return (
    <main className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="login-title">
        <p className="eyebrow">Uribap · nuestro hogar</p>
        <h1 id="login-title">Entra para cuidar el plan de casa.</h1>
        <p className="lede">Tu identidad se gestiona con ZITADEL. Uribap nunca muestra tus tokens en el navegador.</p>
        <form
          action={async () => {
            "use server";
            await signIn("zitadel", { redirectTo: destination });
          }}
        >
          <button className="status status-ready" type="submit">Entrar con ZITADEL</button>
        </form>
      </section>
    </main>
  );
}
