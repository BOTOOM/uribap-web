import { ErrorState } from "@/components/states/ErrorState";
import { ShoppingItemActions } from "@/components/shopping/ShoppingItemActions";
import { ShoppingListCreateForm } from "@/components/shopping/ShoppingListCreateForm";
import { ShoppingListTransitionBar } from "@/components/shopping/ShoppingListTransitionBar";
import { ApiRequestError, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";

type ShoppingList = components["schemas"]["ShoppingListResponse"];
type ListState = components["schemas"]["ShoppingListState"];
type ItemStatus = components["schemas"]["ShoppingItemStatus"];

const STATE_LABELS: Record<ListState, string> = {
  open: "abierta",
  completed: "completada",
  archived: "archivada",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  pending: "pendiente",
  purchased: "comprado",
  skipped: "omitido",
};

function defaultWindow(): { from: string; to: string } {
  const from = new Date();
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + 6);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

async function loadList(): Promise<ShoppingList | null | { error: string }> {
  try {
    return await serverHouseholdFetch<ShoppingList>("/shopping-lists/current");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function ShoppingPage() {
  const list = await loadList();
  const window = defaultWindow();

  if (list !== null && "error" in list) {
    return <ErrorState title="No se pudo cargar la compra" description={list.error} />;
  }
  if (list === null) {
    return (
      <div className="foundation-shell">
        <section className="foundation-hero" aria-labelledby="compra-title">
          <p className="eyebrow">Uribap · compra</p>
          <h1 id="compra-title">Todavía no hay lista de compra.</h1>
          <p className="lede">
            Genera la lista desde la proyección de demanda: solo aparecen los ingredientes que
            faltan. Nada se descuenta del inventario hasta registrar una compra.
          </p>
        </section>
        <ShoppingListCreateForm defaultFrom={window.from} defaultTo={window.to} />
      </div>
    );
  }

  const pending = list.items.filter((item) => item.status === "pending");
  const resolved = list.items.filter((item) => item.status !== "pending");
  const mutable = list.state === "open";

  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="compra-title">
        <p className="eyebrow">Uribap · compra</p>
        <h1 id="compra-title">
          Compra del {list.from_date} al {list.to_date}
        </h1>
        <p className="lede">
          Estado: {STATE_LABELS[list.state]} · versión {list.version}. Cada ítem nace de un
          faltante proyectado; la compra crea el lote de inventario en la misma operación.
        </p>
      </section>
      <ShoppingListTransitionBar listId={list.id} state={list.state} version={list.version} />
      <section className="foundation-list" aria-labelledby="compra-pending-title">
        <h2 id="compra-pending-title">Pendientes</h2>
        {pending.length === 0 ? (
          <p role="status">No hay faltantes pendientes en esta ventana.</p>
        ) : (
          <ul>
            {pending.map((item) => (
              <li key={item.id}>
                <span className="item-index">
                  {item.needed_amount} {item.unit}
                </span>
                <span>{item.ingredient_name}</span>
                <span className="status status-warning">{STATUS_LABELS[item.status]}</span>
                <ShoppingItemActions
                  listId={list.id}
                  item={item}
                  version={list.version}
                  mutable={mutable}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {resolved.length > 0 ? (
        <section className="foundation-list" aria-labelledby="compra-resolved-title">
          <h2 id="compra-resolved-title">Resueltos</h2>
          <ul>
            {resolved.map((item) => (
              <li key={item.id}>
                <span className="item-index">
                  {item.status === "purchased" && item.purchased_amount
                    ? `${item.purchased_amount} ${item.unit}`
                    : `${item.needed_amount} ${item.unit}`}
                </span>
                <span>{item.ingredient_name}</span>
                <span
                  className={`status ${item.status === "purchased" ? "status-ready" : "status-missing"}`}
                >
                  {STATUS_LABELS[item.status]}
                </span>
                <ShoppingItemActions
                  listId={list.id}
                  item={item}
                  version={list.version}
                  mutable={mutable}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
