import { AppShell } from "@/components/shell/AppShell";
import { ApiStateDemo } from "@/features/foundation/ApiStateDemo";

export default function ApiStatePage() {
  return (
    <AppShell>
      <div className="foundation-shell">
        <section className="foundation-hero" aria-labelledby="api-state-title">
          <p className="eyebrow">Foundation · API boundary</p>
          <h1 id="api-state-title">El frontend explica cada estado del servicio.</h1>
          <p className="lede">Esta vista interna valida loading, success, error, unavailable y permission antes de conectar el dominio.</p>
          <ApiStateDemo />
        </section>
      </div>
    </AppShell>
  );
}
