"use client";

import { useMemo, useState } from "react";

import { CompleteMealButton } from "@/components/completion/CompleteMealButton";
import { MealPlanEntryActions } from "@/components/planning/MealPlanEntryActions";
import { MealPlanEntryForm } from "@/components/planning/MealPlanEntryForm";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";
import { dayInitial, formatDayLong, formatDayMonth } from "@/lib/format";
import type { CatalogIngredient } from "@/lib/ingredients";

type MealType = components["schemas"]["RecipeMealType"];
type PlanState = components["schemas"]["MealPlanState"];
type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_ORDER: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

export type BoardEntry = {
  id: string;
  plannedDate: string;
  mealType: MealType;
  servings: number;
  notes: string | null;
  recipeName: string;
  completed: boolean;
};

export function PlanBoard({
  planId,
  state,
  version,
  weekStart,
  entries,
  versions,
  ingredients,
  today,
}: {
  planId: string;
  state: PlanState;
  version: number;
  weekStart: string;
  entries: BoardEntry[];
  versions: PublishedVersion[];
  ingredients: CatalogIngredient[];
  today: string;
}) {
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(`${weekStart}T00:00:00Z`);
        day.setUTCDate(day.getUTCDate() + index);
        return day.toISOString().slice(0, 10);
      }),
    [weekStart],
  );
  const todayIndex = Math.max(0, days.indexOf(today));
  const [activeDay, setActiveDay] = useState(todayIndex === -1 ? 0 : todayIndex);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, BoardEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.plannedDate) ?? [];
      list.push(entry);
      map.set(entry.plannedDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => MEAL_ORDER[a.mealType] - MEAL_ORDER[b.mealType]);
    }
    return map;
  }, [entries]);

  const editable = state === "draft";
  const completable = state === "approved";
  const selected = entries.find((entry) => entry.id === selectedId) ?? null;
  const totalSlots = days.length * MEAL_TYPES.length;

  function openAdd(date: string) {
    setAddDate(date);
  }

  return (
    <>
      <div aria-label="Días de la semana" className="day-picker" role="tablist">
        {days.map((day, index) => {
          const count = byDay.get(day)?.length ?? 0;
          return (
            <button
              aria-selected={activeDay === index}
              className={activeDay === index ? "active" : undefined}
              key={day}
              onClick={() => setActiveDay(index)}
              role="tab"
              type="button"
            >
              {dayInitial(day)}
              {count > 0 ? <span>{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="week-stage">
        <div className="week-grid">
          {days.map((day, index) => {
            const dayEntries = byDay.get(day) ?? [];
            const isToday = day === today;
            return (
              <section
                aria-label={formatDayLong(day)}
                className={`day${isToday ? " today" : ""}${activeDay === index ? " active" : ""}`}
                key={day}
              >
                <header className="day-head">
                  <strong>{formatDayLong(day).split(" ")[0]}</strong>
                  <span>{formatDayMonth(day)}</span>
                </header>
                <div className="day-meals">
                  {dayEntries.map((entry) => (
                    <button
                      aria-pressed={selectedId === entry.id}
                      className={`meal-card${selectedId === entry.id ? " selected" : ""}`}
                      key={entry.id}
                      onClick={() =>
                        setSelectedId(selectedId === entry.id ? null : entry.id)
                      }
                      type="button"
                    >
                      <span className="meal-type">{MEAL_LABELS[entry.mealType]}</span>
                      <strong>{entry.recipeName}</strong>
                      {entry.completed ? (
                        <span className="status available">
                          <Icon name="check" size={12} />
                          Completada
                        </span>
                      ) : (
                        <span className="availability">
                          {entry.servings} raciones
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </span>
                      )}
                      <span aria-hidden="true" className="meal-action-hint">
                        {editable ? "Editar" : "Detalle"}
                      </span>
                    </button>
                  ))}
                  {editable ? (
                    <button
                      aria-label={`Añadir comida el ${formatDayLong(day)}`}
                      className="meal-card empty"
                      onClick={() => openAdd(day)}
                      type="button"
                    >
                      <strong>+ Añadir</strong>
                      <span className="meal-type">
                        {totalSlots - entries.length} huecos esta semana
                      </span>
                    </button>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" className="card impact-panel">
        {selected ? (
          <>
            <div className="impact-cell">
              <span>
                {formatDayLong(selected.plannedDate)} · {MEAL_LABELS[selected.mealType]}
              </span>
              <strong>{selected.recipeName}</strong>
            </div>
            <div className="impact-cell">
              <span>Raciones</span>
              <strong>
                {selected.servings}
                {selected.notes ? ` · ${selected.notes}` : ""}
              </strong>
            </div>
            <div className="impact-cell">
              <span>Estado</span>
              <strong>
                {selected.completed
                  ? "Completada — inventario descontado"
                  : completable
                    ? "Aprobada — lista para cocinar"
                    : "Planeada — demanda proyectada"}
              </strong>
            </div>
            <div className="impact-cell">
              <span>Acciones</span>
              <div className="planner-actions" style={{ marginLeft: 0 }}>
                {editable ? (
                  <MealPlanEntryActions
                    editable={editable}
                    entryId={selected.id}
                    planId={planId}
                    version={version}
                  />
                ) : null}
                {completable && !selected.completed ? (
                  <CompleteMealButton entryId={selected.id} planId={planId} />
                ) : null}
                {!editable && !completable ? <span className="muted">—</span> : null}
                {selected.completed ? <span className="muted">—</span> : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="impact-cell">
              <span>Cómo funciona</span>
              <strong>Toca una comida para ver su detalle y acciones.</strong>
            </div>
            <div className="impact-cell">
              <span>Inventario</span>
              <strong>El plan proyecta demanda; solo cocinar descuenta existencias.</strong>
            </div>
            <div className="impact-cell">
              <span>Compra</span>
              <strong>Los faltantes del plan llegan a la lista al generarla.</strong>
            </div>
            <div className="impact-cell">
              <span>Preparación</span>
              <strong>Los pasos previos aparecen en la preparación.</strong>
            </div>
          </>
        )}
      </div>

      <Dialog open={addDate !== null} onOpenChange={(open) => !open && setAddDate(null)}>
        <DialogContent aria-describedby="add-meal-desc">
          <div className="dialog-head">
            <DialogTitle>Añadir comida</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="add-meal-desc">
              {addDate ? `Para el ${formatDayLong(addDate)}. ` : ""}
              La comida se proyecta como demanda; no toca el inventario.
            </DialogDescription>
            <MealPlanEntryForm
              ingredients={ingredients}
              initialDate={addDate ?? weekStart}
              onDone={() => setAddDate(null)}
              planId={planId}
              version={version}
              versions={versions}
              weekStart={weekStart}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
