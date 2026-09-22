"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { InventoryAdjustmentForm, type LotOption } from "@/components/inventory/InventoryAdjustmentForm";
import { InventoryLotForm, type IngredientOption } from "@/components/inventory/InventoryLotForm";
import { InventoryMovementHistory } from "@/components/inventory/InventoryMovementHistory";
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

export type InventoryRowData = {
  ingredientId: string;
  name: string;
  unit: string;
  locations: Location[];
  real: string;
  projected: string;
  required: string | null;
  expiryLabel: string | null;
  statusTone: "missing" | "expiring" | "available";
  statusLabel: string;
  lots: InventoryLotRow[];
};

export function InventoryView({
  rows,
  ingredients,
  lotOptions,
  weekLabel,
}: {
  rows: InventoryRowData[];
  ingredients: IngredientOption[];
  lotOptions: LotOption[];
  weekLabel: string;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [tab, setTab] = useState<Location | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [adjustLotId, setAdjustLotId] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const presentLocations = (
    Object.keys(LOCATION_LABELS) as Location[]
  ).filter((location) => rows.some((row) => row.locations.includes(location)));

  const visible =
    tab === "all" ? rows : rows.filter((row) => row.locations.includes(tab));

  function openAdjust(lotId?: string) {
    setAdjustLotId(lotId ?? null);
    setAdjustOpen(true);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Inventario real y previsto</h1>
          <p>
            Lo real solo cambia al confirmar una compra o una comida cocinada. Lo
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
            onClick={() => setLotDialogOpen(true)}
            type="button"
          >
            <Icon name="plus" size={15} />
            Registrar lote
          </button>
        </div>
      </div>

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
              type="button"
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
            <strong>El inventario está vacío.</strong>
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
                onClick={() => setLotDialogOpen(true)}
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

      <Dialog onOpenChange={setLotDialogOpen} open={lotDialogOpen}>
        <DialogContent aria-describedby="lot-dialog-desc">
          <div className="dialog-head">
            <DialogTitle>Registrar lote</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="lot-dialog-desc">
              Añade existencias reales al inventario: suma al saldo y queda en el
              ledger.
            </DialogDescription>
            <InventoryLotForm
              ingredients={ingredients}
              onSuccess={() => setLotDialogOpen(false)}
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
