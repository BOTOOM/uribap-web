import type { components } from "@/lib/api/generated/schema";
import { formatQuantity } from "@/lib/format";

type DemandLine = components["schemas"]["DemandForecastLine"];

export function DemandTable({ items }: { items: DemandLine[] }) {
  if (items.length === 0) {
    return (
      <p className="muted" role="status">
        No hay demanda proyectada en esta ventana. La previsión solo usa planes aprobados.
      </p>
    );
  }
  return (
    <div aria-label="Demanda proyectada por ingrediente" className="forecast" role="list">
      {items.map((line) => {
        const shortfall = Number(line.shortfall_amount) > 0;
        const required = Math.max(Number(line.required_amount) + Number(line.optional_amount), 0.000001);
        const covered = Math.min(Number(line.on_hand_amount), required);
        const width = Math.min(100, Math.round((covered / required) * 100));
        return (
          <div className="forecast-line" key={`${line.ingredient_id}-${line.unit}`} role="listitem">
            <strong>
              {line.ingredient_name} <span className="muted">({line.unit})</span>
            </strong>
            <span className="meta">
              {formatQuantity(line.required_amount)} necesario ·{" "}
              {formatQuantity(line.on_hand_amount)} en casa
            </span>
            {shortfall ? (
              <span className="status missing">
                Faltan {formatQuantity(line.shortfall_amount)}
              </span>
            ) : (
              <span className="status available">Cubierto</span>
            )}
            <div className="mini-bar">
              <span
                style={
                  {
                    "--w": `${width}%`,
                    background: shortfall ? "var(--warning)" : "var(--fg)",
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
