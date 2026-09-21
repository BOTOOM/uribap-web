import type { components } from "@/lib/api/generated/schema";

type DemandLine = components["schemas"]["DemandForecastLine"];

export function DemandTable({ items }: { items: DemandLine[] }) {
  if (items.length === 0) {
    return (
      <p role="status">
        No hay demanda proyectada en esta ventana. La previsión solo usa planes aprobados.
      </p>
    );
  }
  return (
    <ul aria-label="Demanda proyectada por ingrediente">
      {items.map((line) => {
        const shortfall = Number(line.shortfall_amount) > 0;
        return (
          <li key={`${line.ingredient_id}-${line.unit}`}>
            <span className="item-index">
              {line.ingredient_name} ({line.unit})
            </span>
            <span>Necesario: {line.required_amount}</span>
            <span>Opcional: {line.optional_amount}</span>
            <span>En inventario: {line.on_hand_amount}</span>
            <span>
              {shortfall ? (
                <span className="status status-missing">Faltan {line.shortfall_amount}</span>
              ) : (
                <span className="status status-ready">Cubierto</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
