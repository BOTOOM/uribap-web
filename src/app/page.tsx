import { AppShell } from "@/components/shell/AppShell";
import { StateExamples } from "@/components/states/StateExamples";
import { DesignSystemSpecimen } from "@/features/foundation/DesignSystemSpecimen";

const foundationItems = [
  "Plan semanal",
  "Inventario real y previsto",
  "Compra explicable",
  "Preparación a tiempo",
];

export default function Home() {
  return (
    <AppShell>
      <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="page-title">
        <p className="eyebrow">Uribap · nuestro hogar</p>
        <h1 id="page-title">Lo que vamos a comer, lo que tenemos y lo que toca preparar.</h1>
        <p className="lede">
          La foundation está lista para conectar el plan semanal con inventario, compra y
          preparación sin perder la diferencia entre lo previsto y lo real.
        </p>
        <div className="foundation-actions" aria-label="Foundation status">
          <span className="status status-ready">Foundation en construcción</span>
          <span className="status">API contract-first</span>
        </div>
      </section>

      <section className="foundation-list" aria-labelledby="areas-title">
        <div>
          <p className="eyebrow">La cadena de Uribap</p>
          <h2 id="areas-title">Una decisión, varias consecuencias visibles.</h2>
        </div>
        <ul>
          {foundationItems.map((item, index) => (
            <li key={item}>
              <span className="item-index">0{index + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <DesignSystemSpecimen />
      <StateExamples />
      </div>
    </AppShell>
  );
}
