import { CompleteMealButton } from "@/components/completion/CompleteMealButton";
import { CorrectLineForm } from "@/components/completion/CorrectLineForm";
import { ReopenCompletionButton } from "@/components/completion/ReopenCompletionButton";
import { ErrorState } from "@/components/states/ErrorState";
import { MealPlanCreateButton } from "@/components/planning/MealPlanCreateButton";
import { MealPlanEntryActions } from "@/components/planning/MealPlanEntryActions";
import { MealPlanEntryForm } from "@/components/planning/MealPlanEntryForm";
import { MealPlanTransitionBar } from "@/components/planning/MealPlanTransitionBar";
import { ApiRequestError, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";

type MealPlan = components["schemas"]["MealPlanResponse"];
type MealCompletion = components["schemas"]["MealCompletionResponse"];
type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];
type MealType = components["schemas"]["RecipeMealType"];
type PlanState = components["schemas"]["MealPlanState"];

const STATE_LABELS: Record<PlanState, string> = {
  draft: "borrador",
  proposed: "propuesto",
  approved: "aprobado",
  archived: "archivado",
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

function currentMonday(): string {
  const today = new Date();
  const day = today.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  today.setUTCDate(today.getUTCDate() + offset);
  return today.toISOString().slice(0, 10);
}

async function loadPlan(weekStart: string): Promise<MealPlan | null | { error: string }> {
  try {
    return await serverHouseholdFetch<MealPlan>(`/plans/current?week_start=${weekStart}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

async function loadPublishedVersions(): Promise<PublishedVersion[]> {
  try {
    const data = await serverHouseholdFetch<{ items: PublishedVersion[] }>(
      "/recipes/published-versions",
    );
    return data.items;
  } catch {
    return [];
  }
}

async function loadCompletions(): Promise<MealCompletion[] | { error: string }> {
  try {
    const data = await serverHouseholdFetch<{ items: MealCompletion[] }>(
      "/meal-completions",
    );
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function PlanPage() {
  const weekStart = currentMonday();
  const [plan, versions, completions] = await Promise.all([
    loadPlan(weekStart),
    loadPublishedVersions(),
    loadCompletions(),
  ]);
  const versionNames = new Map(versions.map((item) => [item.recipe_version_id, item.recipe_name]));

  if (plan !== null && "error" in plan) {
    return <ErrorState title="No se pudo cargar el plan" description={plan.error} />;
  }
  if (plan === null) {
    return (
      <div className="foundation-shell">
        <section className="foundation-hero" aria-labelledby="plan-title">
          <p className="eyebrow">Uribap · plan</p>
          <h1 id="plan-title">La semana todavía no tiene plan.</h1>
          <p className="lede">
            Crea el plan de la semana para repartir comidas entre el hogar. Nada aquí toca el
            inventario real.
          </p>
        </section>
        <MealPlanCreateButton weekStart={weekStart} />
      </div>
    );
  }

  const entriesByDay = new Map<string, MealPlan["entries"]>();
  for (const entry of plan.entries) {
    const day = entry.planned_date;
    entriesByDay.set(day, [...(entriesByDay.get(day) ?? []), entry]);
  }
  const editable = plan.state === "draft";
  const completable = plan.state === "approved";
  const entryIds = new Set(plan.entries.map((entry) => entry.id));
  const planCompletions = Array.isArray(completions)
    ? completions.filter((item) => entryIds.has(item.meal_plan_entry_id))
    : [];
  const recordedByEntry = new Map(
    planCompletions
      .filter((item) => item.state === "recorded")
      .map((item) => [item.meal_plan_entry_id, item]),
  );

  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="plan-title">
        <p className="eyebrow">Uribap · plan</p>
        <h1 id="plan-title">Semana del {plan.week_start_date}</h1>
        <p className="lede">
          Estado: {STATE_LABELS[plan.state]} · versión {plan.version}. Las comidas planeadas son
          demanda proyectada; no descuentan inventario hasta confirmarse.
        </p>
      </section>
      <MealPlanTransitionBar planId={plan.id} state={plan.state} version={plan.version} />
      <section className="foundation-list" aria-labelledby="plan-days-title">
        <h2 id="plan-days-title">Comidas de la semana</h2>
        {plan.entries.length === 0 ? (
          <p role="status">Todavía no hay comidas en el plan.</p>
        ) : (
          [...entriesByDay.entries()].map(([day, entries]) => (
            <div key={day}>
              <h3>{day}</h3>
              <ul>
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <span className="item-index">
                      {MEAL_LABELS[entry.meal_type]} · {entry.servings} raciones
                    </span>
                    <span>{versionNames.get(entry.recipe_version_id) ?? entry.recipe_version_id}</span>
                    {entry.notes ? <span>{entry.notes}</span> : null}
                    <MealPlanEntryActions
                      planId={plan.id}
                      entryId={entry.id}
                      version={plan.version}
                      editable={editable}
                    />
                    {completable && !recordedByEntry.has(entry.id) ? (
                      <CompleteMealButton planId={plan.id} entryId={entry.id} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      {editable ? (
        <section className="foundation-grid" aria-label="Añadir comida">
          <div>
            <h2>Añadir comida</h2>
            <MealPlanEntryForm
              planId={plan.id}
              weekStart={plan.week_start_date}
              version={plan.version}
              versions={versions}
            />
          </div>
        </section>
      ) : null}
      {planCompletions.length > 0 || (completions && "error" in completions) ? (
        <section className="foundation-list" aria-labelledby="completions-title">
          <h2 id="completions-title">Comidas completadas</h2>
          {completions && "error" in completions ? (
            <p role="alert">{completions.error}</p>
          ) : null}
          <ul>
            {planCompletions.map((completion) => (
              <li key={completion.id}>
                <span className="item-index">
                  {completion.planned_date ?? ""}
                  {completion.meal_type ? ` · ${MEAL_LABELS[completion.meal_type]}` : ""}
                  {completion.state === "reopened" ? " · reabierta" : ""}
                </span>
                <span>{completion.recipe_name ?? completion.recipe_version_id}</span>
                <ul>
                  {completion.lines.map((line) => {
                    const differs = line.actual_amount !== line.planned_amount;
                    return (
                      <li key={line.id}>
                        <span>
                          {line.ingredient_name ?? line.ingredient_id}: {line.actual_amount}{" "}
                          {line.unit}
                          {differs ? ` (plan: ${line.planned_amount} ${line.unit})` : ""}
                        </span>
                        {completion.state === "recorded" ? (
                          <CorrectLineForm
                            completionId={completion.id}
                            lineId={line.id}
                            version={completion.version}
                            currentAmount={line.actual_amount}
                            unit={line.unit}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {completion.state === "recorded" ? (
                  <ReopenCompletionButton
                    completionId={completion.id}
                    version={completion.version}
                  />
                ) : null}
                {completion.state === "reopened" && completion.reopen_reason ? (
                  <span>{completion.reopen_reason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
