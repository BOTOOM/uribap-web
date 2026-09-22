import { ErrorState } from "@/components/states/ErrorState";
import { ShoppingItemActions } from "@/components/shopping/ShoppingItemActions";
import { ShoppingListCreateForm } from "@/components/shopping/ShoppingListCreateForm";
import { ShoppingListTransitionBar } from "@/components/shopping/ShoppingListTransitionBar";
import { Icon } from "@/components/ui/Icon";
import { ApiRequestError, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatDayMonth, formatDayShort, formatQuantity } from "@/lib/format";

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
    return <ErrorState description={list.error} title="No se pudo cargar la compra" />;
  }
  if (list === null) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Compra</h1>
            <p>
              Genera la lista desde la proyección de demanda: solo aparecen los
              ingredientes que faltan. Nada se descuenta del inventario hasta registrar
              una compra.
            </p>
          </div>
        </div>
        <div className="planner-empty">
          <div>
            <strong>Todavía no hay lista de compra.</strong>
            <p>Elige la ventana de fechas y genera la lista desde el plan aprobado.</p>
          </div>
        </div>
        <article className="card" style={{ maxWidth: 560 }}>
          <ShoppingListCreateForm defaultFrom={window.from} defaultTo={window.to} />
        </article>
      </>
    );
  }

  const pending = list.items.filter((item) => item.status === "pending");
  const resolved = list.items.filter((item) => item.status !== "pending");
  const mutable = list.state === "open";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            Compra del {formatDayShort(list.from_date)} al {formatDayMonth(list.to_date)}
          </h1>
          <p>
            Lista {STATE_LABELS[list.state]}. Cada ítem nace de un faltante proyectado; la
            compra crea el lote de inventario en la misma operación.
          </p>
        </div>
        <ShoppingListTransitionBar listId={list.id} state={list.state} version={list.version} />
      </div>

      <article className="card card-flush">
        <div className="card-title">
          <h2>Pendientes</h2>
          <span className="meta">
            {pending.length} por comprar · {resolved.length} resueltos
          </span>
        </div>
        {pending.length === 0 ? (
          <div className="empty">
            <strong>No hay faltantes pendientes en esta ventana.</strong>
            <p>La lista está al día con lo que hay en casa.</p>
          </div>
        ) : (
          <div>
            {pending.map((item) => (
              <div className="shopping-item" key={item.id}>
                <span className="task-icon tone-accent" aria-hidden="true">
                  <Icon name="package" size={17} />
                </span>
                <div>
                  <span className="meal-name">{item.ingredient_name}</span>
                  {item.notes ? (
                    <span className="muted" style={{ display: "block" }}>
                      {item.notes}
                    </span>
                  ) : null}
                </div>
                <strong className="num">
                  {formatQuantity(item.needed_amount, item.unit)}
                </strong>
                <span className="meta">esta ventana</span>
                <span className="status missing">{STATUS_LABELS[item.status]}</span>
                <ShoppingItemActions
                  item={item}
                  listId={list.id}
                  mutable={mutable}
                  version={list.version}
                />
              </div>
            ))}
          </div>
        )}
      </article>

      {resolved.length > 0 ? (
        <article className="card card-flush" style={{ marginTop: 18 }}>
          <div className="card-title">
            <h2>Resueltos</h2>
            <span className="meta">{resolved.length} ítems</span>
          </div>
          <div>
            {resolved.map((item) => (
              <div
                className={`shopping-item${item.status === "purchased" ? " purchased" : ""}`}
                key={item.id}
              >
                <span
                  className={`check${item.status === "purchased" ? " checked" : ""}`}
                  aria-hidden="true"
                >
                  <Icon name="check" size={18} />
                </span>
                <div>
                  <span className="meal-name">{item.ingredient_name}</span>
                </div>
                <strong className="num">
                  {item.status === "purchased" && item.purchased_amount
                    ? formatQuantity(item.purchased_amount, item.unit)
                    : formatQuantity(item.needed_amount, item.unit)}
                </strong>
                <span className="meta">
                  {item.purchased_at ? formatDayMonth(item.purchased_at.slice(0, 10)) : "—"}
                </span>
                <span
                  className={`status ${item.status === "purchased" ? "available" : "pending"}`}
                >
                  {STATUS_LABELS[item.status]}
                </span>
                <ShoppingItemActions
                  item={item}
                  listId={list.id}
                  mutable={mutable}
                  version={list.version}
                />
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </>
  );
}
