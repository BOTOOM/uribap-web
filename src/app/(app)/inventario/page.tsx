import { ErrorState } from "@/components/states/ErrorState";
import { InventoryAdjustmentForm } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm } from "@/components/inventory/InventoryLotForm";
import { InventoryMovementHistory } from "@/components/inventory/InventoryMovementHistory";
import { Icon } from "@/components/ui/Icon";
import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatDayMonth, formatQuantity, relativeDay } from "@/lib/format";

type Lot = components["schemas"]["InventoryLotResponse"];
type Location = components["schemas"]["InventoryLocation"];

type Ingredient = { id: string; name: string; base_unit: string };

const LOCATION_LABELS: Record<Location, string> = {
  pantry: "Despensa",
  refrigerator: "Refrigerador",
  freezer: "Congelador",
};

const LOCATION_ICONS: Record<Location, "package" | "snow" | "home"> = {
  pantry: "package",
  refrigerator: "snow",
  freezer: "snow",
};

async function loadInventory(): Promise<Lot[] | { error: string }> {
  try {
    const data = await serverHouseholdFetch<{ items: Lot[] }>("/inventory?include_expired=true");
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

async function loadIngredients(): Promise<Ingredient[]> {
  try {
    const data = await serverHouseholdFetch<{ items: Ingredient[] }>("/ingredients");
    return data.items;
  } catch {
    return [];
  }
}

export default async function InventoryPage() {
  const [data, ingredients] = await Promise.all([loadInventory(), loadIngredients()]);
  if ("error" in data) {
    return (
      <ErrorState description={data.error} title="No se pudo cargar el inventario" />
    );
  }

  const names = new Map(ingredients.map((item) => [item.id, item.name]));
  const lotOptions = data
    .filter((lot) => lot.available && !lot.expired)
    .map((lot) => ({
      id: lot.id,
      ingredientName: names.get(lot.ingredient_id) ?? lot.ingredient_id,
      quantity: lot.quantity_on_hand,
      unit: lot.unit,
    }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Inventario</h1>
          <p>
            Lo que existe, lote por lote. El ledger conserva cada entrada y ajuste; las
            proyecciones futuras no alteran este saldo real.
          </p>
        </div>
      </div>

      <article className="card card-flush">
        <div className="card-title">
          <h2>Lotes</h2>
          <span className="meta">
            {data.length} registrados · {lotOptions.length} disponibles
          </span>
        </div>
        {data.length === 0 ? (
          <div className="empty">
            <strong>Todavía no hay lotes registrados.</strong>
            <p>Registra la primera compra o crea un lote manual con el formulario.</p>
          </div>
        ) : (
          <div>
            {data.map((lot) => (
              <div className="inventory-row" key={lot.id}>
                <div>
                  <span className="meal-name">
                    {names.get(lot.ingredient_id) ?? lot.ingredient_id}
                  </span>
                  <span className="muted" style={{ display: "block" }}>
                    <Icon
                      name={LOCATION_ICONS[lot.location]}
                      size={13}
                      style={{ verticalAlign: "-2px", marginRight: 4 }}
                    />
                    {LOCATION_LABELS[lot.location]}
                  </span>
                </div>
                <strong className="num">
                  {formatQuantity(lot.quantity_on_hand, lot.unit)}
                </strong>
                <span className="meta">
                  {lot.expiration_date
                    ? `vence ${formatDayMonth(lot.expiration_date)} · ${relativeDay(lot.expiration_date)}`
                    : "sin caducidad"}
                </span>
                {lot.expired ? (
                  <span className="status missing">Caducado</span>
                ) : lot.available ? (
                  <span className="status available">Disponible</span>
                ) : (
                  <span className="status pending">No disponible</span>
                )}
                <InventoryMovementHistory lotId={lot.id} />
              </div>
            ))}
          </div>
        )}
      </article>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <article className="card">
          <div className="card-title">
            <h2>Registrar lote</h2>
          </div>
          <InventoryLotForm ingredients={ingredients} />
        </article>
        <article className="card">
          <div className="card-title">
            <h2>Ajustar saldo</h2>
          </div>
          <InventoryAdjustmentForm lots={lotOptions} />
        </article>
      </div>
    </>
  );
}
