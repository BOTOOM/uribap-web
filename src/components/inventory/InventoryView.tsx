"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { InventoryAdjustmentForm, type LotOption } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm, type IngredientOption } from "@/components/inventory/InventoryLotForm";
import { InventoryMovementHistory } from "@/components/inventory/InventoryMovementHistory";
import { ShoppingItemRow } from "@/components/shopping/ShoppingItemRow";
import { ShoppingListCreateForm } from "@/components/shopping/ShoppingListCreateForm";
import { ShoppingListTransitionBar } from "@/components/shopping/ShoppingListTransitionBar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";
import { formatQuantity } from "@/lib/format";

type Location = components["schemas"]["InventoryLocation"];
type ShoppingItem = components["schemas"]["ShoppingItemResponse"];
type ListState = components["schemas"]["ShoppingListState"];

const LOCATION_LABELS: Record<Location, string> = {
  pantry: "Despensa",
  refrigerator: "Refrigerador",
  freezer: "Congelador",
};

const LOCATION_ICONS: Record<Location, IconName> = {
  pantry: "package",
  refrigerator: "fridge",
  freezer: "snow",
};

const LIST_STATE_LABELS: Record<ListState, string> = {
  open: "abierta",
  completed: "completada",
  archived: "archivada",
};

export type InventoryLotRow = {
  id: string;
  location: Location;
  quantity: string;
  unit: string;
  expirationDate: string | null;
  expirationLabel: string | null;
  expired: boolean;
  available: boolean;
};

export type InventoryTag = {
  tone: "missing" | "expiring" | "warning" | "low";
  label: string;
};

export type InventoryRowData = {
  ingredientId: string;
  name: string;
  unit: string;
  locations: Location[];
  real: string;
  projected: string;
  required: string | null;
  shortage: { needed: string; onHand: string; missing: string } | null;
  expiryLabel: string | null;
  statusTone: "missing" | "expiring" | "low" | "available";
  statusLabel: string;
  tags: InventoryTag[];
  lots: InventoryLotRow[];
};

export type PendingShoppingRow = {
  item: ShoppingItem;
  onHand: string | null;
  shortfall: string | null;
};

export type ShoppingBandData = {
  list: {
    id: string;
    state: ListState;
    version: number;
    windowLabel: string;
  } | null;
  pendingRows: PendingShoppingRow[];
  resolvedItems: ShoppingItem[];
};

export function InventoryView({
  rows,
  ingredients,
  lotOptions,
  shopping,
  weekLabel,
  windowDefault,
}: {
  rows: InventoryRowData[];
  ingredients: IngredientOption[];
  lotOptions: LotOption[];
  shopping: ShoppingBandData;
  weekLabel: string;
  windowDefault: { from: string; to: string };
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [tab, setTab] = useState<Location | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [lotPreset, setLotPreset] = useState<{
    ingredientId: string;
    name: string;
    quantity: string;
    unit: string;
  } | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [adjustLotId, setAdjustLotId] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const presentLocations = (
    Object.keys(LOCATION_LABELS) as Location[]
  ).filter((location) => rows.some((row) => row.locations.includes(location)));

  const visible =
    tab === "all" ? rows : rows.filter((row) => row.locations.includes(tab));

  const shortages = rows.filter((row) => row.shortage !== null);
  const listState = shopping.list?.state ?? null;
  const listOpen = listState === "open";

  function openAdjust(lotId?: string) {
    setAdjustLotId(lotId ?? null);
    setAdjustOpen(true);
  }

  function openLotDialog(preset?: {
    ingredientId: string;
    name: string;
    quantity: string;
    unit: string;
  }) {
    setLotPreset(preset ?? null);
    setLotDialogOpen(true);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Despensa</h1>
          <p>
            Lo que falta para el plan aparece arriba como prioridad de compra.
            Lo real solo cambia al confirmar una compra o una comida cocinada; lo
            proyectado usa el plan aprobado de {weekLabel}.
          </p>
        </div>
        <div className="top-actions">
          <button
            className="btn btn-ghost"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
            type="button"
          >
            {refreshing ? "Actualizando…" : "Actualizar"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openAdjust()}
            type="button"
          >
            Ajustar cantidad
          </button>
          <button
            className="btn btn-primary"
            onClick={() => openLotDialog()}
            type="button"
          >
            <Icon name="plus" size={15} />
            Registrar lote
          </button>
        </div>
      </div>

      <article className="card card-flush shop-band" id="shopping-band">
        <div className="card-title">
          <div>
            <h2>Por comprar</h2>
            <span className="muted">
              {shopping.list
                ? `Lista ${LIST_STATE_LABELS[shopping.list.state]} · ${shopping.list.windowLabel}`
                : `Autocalculado del plan de ${weekLabel}`}
            </span>
          </div>
          {listState === "open" || listState === "completed" ? (
            <ShoppingListTransitionBar
              listId={shopping.list!.id}
              state={listState}
              version={shopping.list!.version}
            />
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => setListDialogOpen(true)}
              type="button"
            >
              <Icon name="cart" size={15} />
              Generar lista
            </button>
          )}
        </div>

        {listOpen ? (
          shopping.pendingRows.length === 0 ? (
            <div className="empty">
              <strong>La lista está al día.</strong>
              <p>No quedan faltantes pendientes en esta ventana.</p>
            </div>
          ) : (
            <div>
              {shopping.pendingRows.map(({ item, onHand, shortfall }) => (
                <ShoppingItemRow
                  item={item}
                  key={item.id}
                  listId={shopping.list!.id}
                  mutable
                  onHand={onHand}
                  shortfall={shortfall}
                  version={shopping.list!.version}
                />
              ))}
            </div>
          )
        ) : shortages.length > 0 ? (
          <div>
            {shortages.map((row) => (
              <div className="shopping-item" key={row.ingredientId}>
                <span aria-hidden="true" className="shortage-mark">
                  <Icon name="cart" size={17} />
                </span>
                <div>
                  <div className="meal-name">{row.name}</div>
                  <div className="reason">
                    El plan de {weekLabel} lo necesita y en casa quedan{" "}
                    {formatQuantity(row.shortage!.onHand, row.unit)}.
                  </div>
                </div>
                <div className="quantity">
                  <span className="meta">Necesarios</span>
                  <strong className="num" style={{ display: "block" }}>
                    {formatQuantity(row.shortage!.needed, row.unit)}
                  </strong>
                </div>
                <div className="hide-mid">
                  <span className="meta">En casa</span>
                  <strong className="num" style={{ display: "block" }}>
                    {formatQuantity(row.shortage!.onHand, row.unit)}
                  </strong>
                </div>
                <div className="hide-mid">
                  <span className="meta">Faltan</span>
                  <strong className="num" style={{ display: "block" }}>
                    {formatQuantity(row.shortage!.missing, row.unit)}
                  </strong>
                </div>
                <div className="shopping-item-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      openLotDialog({
                        ingredientId: row.ingredientId,
                        name: row.name,
                        quantity: row.shortage!.missing,
                        unit: row.unit,
                      })
                    }
                    type="button"
                  >
                    Comprar {formatQuantity(row.shortage!.missing, row.unit)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <strong>
              {listState === "completed"
                ? "Lista completada — todo resuelto."
                : "Nada que comprar — la semana está cubierta."}
            </strong>
            <p>Los faltantes se calculan del plan aprobado.</p>
          </div>
        )}

        {shopping.resolvedItems.length > 0 &&
        (listOpen || listState === "completed") ? (
          <details className="shop-resolved">
            <summary>
              {shopping.resolvedItems.length}{" "}
              {shopping.resolvedItems.length === 1 ? "resuelto" : "resueltos"}{" "}
              en esta lista
            </summary>
            {shopping.resolvedItems.map((item) => (
              <ShoppingItemRow
                item={item}
                key={item.id}
                listId={shopping.list!.id}
                mutable={listOpen}
                onHand={null}
                shortfall={null}
                version={shopping.list!.version}
              />
            ))}
          </details>
        ) : null}
      </article>

      {presentLocations.length > 0 ? (
        <div aria-label="Filtrar por ubicación" className="tabs" role="tablist" style={{ marginBottom: 18 }}>
          <button
            aria-selected={tab === "all"}
            className={`tab${tab === "all" ? " active" : ""}`}
            onClick={() => setTab("all")}
            role="tab"
            type="button"
          >
            Todo
          </button>
          {presentLocations.map((location) => (
            <button
              aria-selected={tab === location}
              className={`tab${tab === location ? " active" : ""}`}
              key={location}
              onClick={() => setTab(location)}
              role="tab"
            >
              {LOCATION_LABELS[location]}
            </button>
          ))}
        </div>
      ) : null}

      <article className="card card-flush" id="inventory-list">
        {rows.length === 0 ? (
          <div className="empty">
            <span className="recipe-glyph">
              <Icon name="package" />
            </span>
            <strong>La despensa está vacía.</strong>
            <p>
              Registra la primera compra o añade un lote a mano: cada movimiento
              queda en el ledger y las proyecciones nunca alteran el saldo real.
            </p>
            {ingredients.length === 0 ? (
              <Link className="btn btn-primary" href="/ingredientes">
                Crear el primer ingrediente
              </Link>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => openLotDialog()}
                type="button"
              >
                Registrar el primer lote
              </button>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <strong>Nada guardado en {tab === "all" ? "esta vista" : LOCATION_LABELS[tab]}.</strong>
            <p>Cambia de ubicación o registra un lote nuevo aquí.</p>
          </div>
        ) : (
          <div>
            {visible.map((row) => {
              const open = openId === row.ingredientId;
              return (
                <div className="inventory-group" key={row.ingredientId}>
                  <button
                    aria-expanded={open}
                    className="inventory-row interactive"
                    onClick={() => setOpenId(open ? null : row.ingredientId)}
                    type="button"
                  >
                    <div>
                      <span className="meta">
                        {row.locations.length > 0
                          ? row.locations
                              .map((location) => LOCATION_LABELS[location])
                              .join(" · ")
                          : "Sin lotes"}
                      </span>
                      <div className="meal-name">{row.name}</div>
                      {row.tags.length > 0 ? (
                        <span className="inventory-tags">
                          {row.tags.map((tag) => (
                            <span className={`status ${tag.tone}`} key={tag.label}>
                              {tag.label}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <span className="meta">Real</span>
                      <strong className="num" style={{ display: "block" }}>
                        {formatQuantity(row.real, row.unit)}
                      </strong>
                    </div>
                    <div>
                      <span className="meta">Proyectado</span>
                      <strong className="num" style={{ display: "block" }}>
                        {formatQuantity(row.projected, row.unit)}
                      </strong>
                    </div>
                    <div className="hide-mid">
                      <span className="meta">Caducidad</span>
                      <strong style={{ display: "block" }}>
                        {row.expiryLabel ?? "—"}
                      </strong>
                    </div>
                    <span className="inventory-row-status">
                      <span className={`status ${row.statusTone}`}>{row.statusLabel}</span>
                      <Icon
                        name="chevron"
                        size={14}
                        style={{
                          transform: open ? "rotate(90deg)" : "none",
                          transition: "transform 0.16s var(--ease-out)",
                        }}
                      />
                    </span>
                  </button>
                  {open ? (
                    <div className="inventory-expand">
                      {row.required !== null ? (
                        <p className="muted" style={{ margin: "0 0 10px" }}>
                          El plan de {weekLabel} necesita{" "}
                          <strong className="num">
                            {formatQuantity(row.required, row.unit)}
                          </strong>
                          ; por eso el proyectado es{" "}
                          {formatQuantity(row.projected, row.unit)}.
                        </p>
                      ) : (
                        <p className="muted" style={{ margin: "0 0 10px" }}>
                          Sin demanda en el plan de {weekLabel}: el proyectado
                          coincide con lo real.
                        </p>
                      )}
                      {row.lots.length === 0 ? (
                        <p className="muted" style={{ margin: 0 }}>
                          No hay lotes registrados — el plan lo necesita y aún no
                          hay existencias en casa.
                        </p>
                      ) : (
                        <div className="detail-list">
                          {row.lots.map((lot) => (
                            <div className="inventory-lot" key={lot.id}>
                              <div>
                                <span className="meta">
                                  <Icon
                                    name={LOCATION_ICONS[lot.location]}
                                    size={13}
                                    style={{ verticalAlign: "-2px", marginRight: 4 }}
                                  />
                                  {LOCATION_LABELS[lot.location]}
                                </span>
                                <strong className="num">
                                  {formatQuantity(lot.quantity, lot.unit)}
                                </strong>
                              </div>
                              <span className="meta">
                                {lot.expirationLabel
                                  ? `vence ${lot.expirationLabel}`
                                  : "sin caducidad"}
                              </span>
                              <span className="inventory-lot-actions">
                                {lot.available && !lot.expired ? (
                                  <button
                                    className="btn btn-ghost"
                                    onClick={() => openAdjust(lot.id)}
                                    type="button"
                                  >
                                    Ajustar
                                  </button>
                                ) : null}
                                {lot.expired ? (
                                  <span className="status missing">Caducado</span>
                                ) : null}
                                <InventoryMovementHistory lotId={lot.id} />
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </article>

      <Dialog
        onOpenChange={(open) => {
          setLotDialogOpen(open);
          if (!open) setLotPreset(null);
        }}
        open={lotDialogOpen}
      >
        <DialogContent aria-describedby="lot-dialog-desc">
          <div className="dialog-head">
            <DialogTitle>
              {lotPreset ? `Comprar ${lotPreset.name}` : "Registrar lote"}
            </DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="lot-dialog-desc">
              {lotPreset
                ? `Registra la compra: suma ${formatQuantity(lotPreset.quantity, lotPreset.unit)} al saldo real y cubre el faltante del plan.`
                : "Añade existencias reales al inventario: suma al saldo y queda en el ledger."}
            </DialogDescription>
            <InventoryLotForm
              defaultIngredientId={lotPreset?.ingredientId}
              defaultQuantity={lotPreset?.quantity}
              ingredients={ingredients}
              key={lotPreset?.ingredientId ?? "blank"}
              onSuccess={() => {
                setLotDialogOpen(false);
                setLotPreset(null);
              }}
              submitLabel={lotPreset ? "Registrar compra" : "Añadir lote"}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setListDialogOpen} open={listDialogOpen}>
        <DialogContent aria-describedby="list-dialog-desc">
          <div className="dialog-head">
            <DialogTitle>Generar lista de compra</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="list-dialog-desc">
              La lista se calcula del plan aprobado para la ventana elegida: solo
              aparecen los ingredientes que faltan en casa.
            </DialogDescription>
            <ShoppingListCreateForm
              defaultFrom={windowDefault.from}
              defaultTo={windowDefault.to}
              onSuccess={() => setListDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setAdjustOpen} open={adjustOpen}>
        <DialogContent aria-describedby="adjust-dialog-desc">
          <div className="dialog-head">
            <DialogTitle>Ajustar cantidad</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="adjust-dialog-desc">
              Corrige el saldo real de un lote: cada ajuste queda registrado en el
              ledger con su motivo.
            </DialogDescription>
            <InventoryAdjustmentForm
              defaultLotId={adjustLotId ?? undefined}
              key={adjustLotId ?? "none"}
              lots={lotOptions}
              onSuccess={() => setAdjustOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
