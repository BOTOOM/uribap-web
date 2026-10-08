"use client";

import { useEffect, useId, useState } from "react";

import { CompleteMealButton } from "@/components/completion/CompleteMealButton";
import { ReopenCompletionButton } from "@/components/completion/ReopenCompletionButton";
import { MealPlanEntryActions } from "@/components/planning/MealPlanEntryActions";
import { SkipMealButton } from "@/components/planning/SkipMealButton";
import type { components } from "@/lib/api/generated/schema";
import { formatDayLong, formatQuantity } from "@/lib/format";

type Detail = components["schemas"]["MealPlanEntryDetailResponse"];
type MealType = components["schemas"]["RecipeMealType"];
type DetailFetchState =
  | { requestKey: string; status: "loading" }
  | { requestKey: string; status: "error"; error: string }
  | { requestKey: string; status: "success"; detail: Detail };

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

export function parseRecipeDescription(
  description: string | null,
): { notes: string[]; steps: string[] } {
  const lines = (description ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const stepMarker = /^\s*\d+[.)]\s+/;

  if (lines.some((line) => stepMarker.test(line))) {
    return {
      notes: lines.filter((line) => !stepMarker.test(line)),
      steps: lines
        .filter((line) => stepMarker.test(line))
        .map((line) => line.replace(stepMarker, "").trim()),
    };
  }

  return {
    notes: [],
    steps: lines
      .map((line) => line.replace(/^\s*(?:-|•)\s*/, "").trim())
      .filter(Boolean),
  };
}

export function MealEntryDetail({
  planId,
  entryId,
  planState,
  version,
  refreshKey,
}: {
  planId: string;
  entryId: string;
  planState: components["schemas"]["MealPlanState"];
  version: number;
  refreshKey: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify([planId, entryId, planState, refreshKey, version, attempt]);
  const [fetchState, setFetchState] = useState<DetailFetchState>(() => ({
    requestKey,
    status: "loading",
  }));
  const currentState =
    fetchState.requestKey === requestKey
      ? fetchState
      : { requestKey, status: "loading" as const };

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `/api/plans/${planId}/entries/${entryId}/detail`,
          { signal: controller.signal },
        );
        const payload = (await response.json().catch(() => null)) as
          | { detail?: Detail | string }
          | null;
        if (!response.ok) {
          throw new Error(
            typeof payload?.detail === "string"
              ? payload.detail
              : "No se pudo cargar el detalle.",
          );
        }
        if (!payload || typeof payload.detail !== "object" || payload.detail === null) {
          throw new Error("No se pudo cargar el detalle.");
        }
        if (!controller.signal.aborted) {
          setFetchState({ requestKey, status: "success", detail: payload.detail });
        }
      } catch (caught) {
        if (!controller.signal.aborted) {
          setFetchState({
            requestKey,
            status: "error",
            error: caught instanceof Error ? caught.message : "No se pudo cargar el detalle.",
          });
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [attempt, entryId, planId, planState, refreshKey, requestKey, version]);

  if (currentState.status === "loading") {
    return (
      <div aria-live="polite" className="card entry-detail entry-detail-state" role="status">
        Cargando detalle…
      </div>
    );
  }

  if (currentState.status === "error") {
    return (
      <div aria-live="polite" className="card entry-detail entry-detail-state">
        <p role="alert">{currentState.error}</p>
        <button
          className="btn btn-secondary"
          onClick={() => setAttempt((current) => current + 1)}
          type="button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <MealEntryDetailView
      detail={{ ...currentState.detail, plan_state: planState }}
      planId={planId}
      version={version}
    />
  );
}

export function MealEntryDetailView({
  detail,
  planId,
  version,
}: {
  detail: Detail;
  planId: string;
  version: number;
  onChanged?: () => void;
}) {
  const recordedCompletion =
    detail.completion?.state === "recorded" ? detail.completion : null;
  const outcome = recordedCompletion?.outcome ?? null;
  const { notes: recipeNotes, steps } = parseRecipeDescription(detail.recipe_description);
  const headingId = useId();

  return (
    <article aria-live="polite" className="card entry-detail">
      <header className="entry-detail-header">
        <div className="entry-detail-title">
          <span className="meta">
            {formatDayLong(detail.planned_date)} · {MEAL_LABELS[detail.meal_type]}
          </span>
          <h2>{detail.recipe_name}</h2>
          <div className="entry-detail-chips">
            <span className="chip">{detail.servings} raciones</span>
            {detail.prep_minutes > 0 ? (
              <span className="chip">{detail.prep_minutes} min</span>
            ) : null}
            <span
              className={`chip status status-chip ${
                outcome === "cooked"
                  ? "completed"
                  : outcome === "skipped"
                    ? "neutral"
                    : "pending"
              }`}
            >
              {outcome === "cooked"
                ? "Cocinada"
                : outcome === "skipped"
                  ? "Domicilio"
                  : "Pendiente"}
            </span>
          </div>
        </div>
        {detail.notes ? <p className="entry-detail-notes">{detail.notes}</p> : null}
        {outcome === "skipped" && recordedCompletion?.outcome_note ? (
          <p className="entry-outcome-note">{recordedCompletion.outcome_note}</p>
        ) : null}
      </header>

      <div className="entry-detail-body">
        <section aria-labelledby={`entry-ingredients-${headingId}`}>
          <h3 id={`entry-ingredients-${headingId}`}>Ingredientes</h3>
          {outcome === "cooked" ? (
            <p className="entry-inventory-note">
              Se descontaron los ingredientes consumibles. Los básicos de despensa no se descuentan.
            </p>
          ) : null}
          {outcome === "skipped" ? (
            <p className="entry-inventory-note">No se cocinó; el inventario no cambió.</p>
          ) : null}
          {detail.ingredients.length > 0 ? (
            <ul className="entry-ingredients">
              {detail.ingredients.map((ingredient) => (
                <li className="entry-ingredient" key={ingredient.ingredient_id}>
                  <span className="entry-ingredient-name">
                    <strong>{ingredient.ingredient_name}</strong>
                    {ingredient.optional ? <small className="optional-tag">opcional</small> : null}
                  </span>
                  <span className="entry-ingredient-amount">
                    {formatQuantity(ingredient.required_amount, ingredient.unit)}
                  </span>
                  {!recordedCompletion || (outcome === "cooked" && ingredient.pantry_staple) ? (
                    <span
                      className={`status ${
                        Number(ingredient.shortfall_amount) > 0 ? "missing" : "available"
                      }`}
                    >
                      {ingredient.pantry_staple
                        ? Number(ingredient.shortfall_amount) > 0
                          ? "Se acabó"
                          : "Básico de despensa"
                        : Number(ingredient.shortfall_amount) > 0
                          ? `Faltan ${formatQuantity(ingredient.shortfall_amount, ingredient.unit)}`
                          : `Hay ${formatQuantity(ingredient.on_hand_amount, ingredient.unit)}`}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Esta receta no tiene ingredientes registrados.</p>
          )}
        </section>

        <section aria-labelledby={`entry-preparation-${headingId}`}>
          <h3 id={`entry-preparation-${headingId}`}>Preparación</h3>
          {recipeNotes.map((note, index) => (
            <p className="entry-recipe-notes" key={`${index}-${note}`}>
              {note}
            </p>
          ))}
          {steps.length >= 2 ? (
            <ol className="entry-steps">
              {steps.map((step, index) => (
                <li key={`${index}-${step}`}>
                  <span aria-hidden="true" className="entry-step-number">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : steps.length === 1 ? (
            <p className="entry-instructions">{steps[0]}</p>
          ) : (
            <p className="muted">Esta receta todavía no tiene pasos escritos.</p>
          )}
        </section>
      </div>

      {detail.plan_state === "draft" ? (
        <footer className="entry-detail-footer">
          <MealPlanEntryActions
            editable
            entryId={detail.entry_id}
            planId={planId}
            version={version}
          />
        </footer>
      ) : detail.plan_state === "approved" && !recordedCompletion ? (
        <footer className="entry-detail-footer">
          <div className="entry-detail-actions">
            <CompleteMealButton entryId={detail.entry_id} planId={planId} />
            <SkipMealButton entryId={detail.entry_id} planId={planId} />
          </div>
          <p className="entry-action-help">
            Al marcarla como cocinada se descuentan los ingredientes consumibles. Los básicos de
            despensa no se descuentan. Si pidieron domicilio, no se toca el inventario.
          </p>
        </footer>
      ) : detail.plan_state === "approved" && recordedCompletion ? (
        <footer className="entry-detail-footer">
          <ReopenCompletionButton
            completionId={recordedCompletion.id}
            version={recordedCompletion.version}
          />
        </footer>
      ) : detail.plan_state === "proposed" ? (
        <footer className="entry-detail-footer">
          <p className="muted">Aprueba el plan para marcar comidas como cocinadas.</p>
        </footer>
      ) : null}
    </article>
  );
}
