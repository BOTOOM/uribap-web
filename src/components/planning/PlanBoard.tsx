"use client";

import { useMemo, useState } from "react";

import { MealEntryDetail } from "@/components/planning/MealEntryDetail";
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
  outcome: "cooked" | "skipped" | null;
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

  const todayIndex = days.indexOf(today);
  const [activeDay, setActiveDay] = useState(todayIndex >= 0 ? todayIndex : 0);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const todayEntries = byDay.get(today) ?? [];
    return (todayEntries.find((entry) => !entry.completed) ?? todayEntries[0])?.id ?? null;
  });
  const [addDate, setAddDate] = useState<string | null>(null);

  const editable = state === "draft";
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
          const dateNumber = new Date(`${day}T00:00:00Z`).getUTCDate();
          const isToday = day === today;
          return (
            <button
              aria-label={`${formatDayLong(day)}, ${count} comidas`}
              aria-selected={activeDay === index}
              className={[
                activeDay === index ? "active" : "",
                isToday ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day}
              onClick={() => {
                setActiveDay(index);
                setSelectedId((byDay.get(day) ?? [])[0]?.id ?? null);
              }}
              role="tab"
              type="button"
            >
              <span className="day-picker-initial">{dayInitial(day)}</span>
              <span className="day-picker-date">{dateNumber}</span>
              {count > 0 ? <span aria-hidden="true" className="day-picker-dot" /> : null}
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
                      onClick={() => {
                        setActiveDay(index);
                        setSelectedId(entry.id);
                      }}
                      type="button"
                    >
                      <span className="meal-type">{MEAL_LABELS[entry.mealType]}</span>
                      <strong>{entry.recipeName}</strong>
                      {entry.outcome === "cooked" ? (
                        <span className="status completed">
                          <Icon name="check" size={12} /> Cocinada
                        </span>
                      ) : entry.outcome === "skipped" ? (
                        <span className="status neutral">Domicilio</span>
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

      {selected ? (
        <MealEntryDetail
          entryId={selected.id}
          planId={planId}
          planState={state}
          refreshKey={`${selected.id}:${selected.outcome ?? "pending"}`}
          version={version}
        />
      ) : (
        <div aria-live="polite" className="card no-meal-selected">
          <p className="muted">Toca una comida para ver ingredientes y preparación.</p>
        </div>
      )}

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
