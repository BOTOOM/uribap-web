import { ErrorState } from "@/components/states/ErrorState";
import { InventoryAdjustmentForm } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm } from "@/components/inventory/InventoryLotForm";
import { serverHouseholdFetch } from "@/lib/api/server-client";

type Lot = { id: string; ingredient_id: string; quantity_on_hand: string; unit: string; location: string; available: boolean; expiration_date: string | null };

async function loadInventory(): Promise<Lot[] | { error: string }> {
  try {
    const data = await serverHouseholdFetch<{ items: Lot[] }>("/inventory");
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function InventoryPage() {
  const data = await loadInventory();
  if ("error" in data) return <ErrorState title="No se pudo cargar el inventario" description={data.error} />;
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="inventory-title">
        <p className="eyebrow">Uribap · inventario</p>
        <h1 id="inventory-title">Lo que existe, lote por lote.</h1>
        <p className="lede">El ledger conserva cada entrada y ajuste. Las proyecciones futuras no alteran este saldo real.</p>
      </section>
      <section className="foundation-list" aria-labelledby="inventory-list-title">
        <h2 id="inventory-list-title">Lotes disponibles</h2>
        {data.length === 0 ? <p role="status">Todavía no hay lotes registrados.</p> : (
          <ul>
            {data.map((lot) => (
              <li key={lot.id}>
                <span className="item-index">{lot.quantity_on_hand} {lot.unit}</span>
                <span>{lot.ingredient_id}</span>
                <span>{lot.location}{lot.expiration_date ? ` · vence ${lot.expiration_date}` : ""}{lot.available ? "" : " · no disponible"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="foundation-grid" aria-label="Acciones de inventario">
        <div><h2>Registrar lote</h2><InventoryLotForm /></div>
        <div><h2>Ajustar saldo</h2><InventoryAdjustmentForm /></div>
      </section>
    </div>
  );
}
