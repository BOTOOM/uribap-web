"use client";

import { useRef, useState } from "react";

import {
  MealDetailDialog,
  type MealDetailTarget,
} from "@/components/planning/MealDetailDialog";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";

type MealPlanState = components["schemas"]["MealPlanState"];

export type HomeMealRow = {
  id: string;
  mealLabel: string;
  recipeName: string;
  servings: number;
  outcome: "cooked" | "skipped" | null;
  completionVersion: number | null;
};

export function HomeMealList({
  planId,
  planState,
  planVersion,
  emptyLabel,
  rows,
}: {
  planId: string | null;
  planState: MealPlanState | null;
  planVersion: number | null;
  emptyLabel: string;
  rows: HomeMealRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mealListRef = useRef<HTMLDivElement | null>(null);

  if (planId === null || planState === null || planVersion === null) {
    return <p className="muted">{emptyLabel}</p>;
  }

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const target: MealDetailTarget | null = selected
    ? {
        id: selected.id,
        outcome: selected.outcome,
        completionVersion: selected.completionVersion,
      }
    : null;

  return (
    <>
      <div className="meal-list" ref={mealListRef} tabIndex={-1}>
        {rows.length === 0 ? (
          <p className="muted">{emptyLabel}</p>
        ) : (
          rows.map((row) => (
            <button
              data-meal-entry-trigger={row.id}
              aria-haspopup="dialog"
              className="meal-row meal-row-button"
              key={row.id}
              onClick={() => setSelectedId(row.id)}
              type="button"
            >
              <span className="meta">{row.mealLabel}</span>
              <span className="meal-row-copy">
                <span className="meal-name">{row.recipeName}</span>
                <span className="muted">{row.servings} raciones</span>
              </span>
              {row.outcome === "cooked" ? (
                <span className="status completed">
                  <Icon name="check" size={13} />
                  {" "}Cocinada
                </span>
              ) : row.outcome === "skipped" ? (
                <span className="status neutral">Domicilio</span>
              ) : (
                <span className="status available">Planeada</span>
              )}
            </button>
          ))
        )}
      </div>
      <MealDetailDialog
        fallbackFocus={() => mealListRef.current}
        onClose={() => setSelectedId(null)}
        planId={planId}
        planState={planState}
        target={target}
        version={planVersion}
      />
    </>
  );
}
