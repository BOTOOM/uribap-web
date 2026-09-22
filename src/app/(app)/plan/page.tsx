import Link from "next/link";
import type { Route } from "next";

import { CorrectLineForm } from "@/components/completion/CorrectLineForm";
import { ReopenCompletionButton } from "@/components/completion/ReopenCompletionButton";
import { MealPlanCreateButton } from "@/components/planning/MealPlanCreateButton";
import { MealPlanTransitionBar } from "@/components/planning/MealPlanTransitionBar";
import { PlanBoard } from "@/components/planning/PlanBoard";
import { ErrorState } from "@/components/states/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { ApiRequestError, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatDayMonth, formatWeekRangeLong, toIsoDay } from "@/lib/format";
import { mondayOf } from "@/lib/forecast/window";

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

function shiftWeek(weekStart: string, weeks: number): string {
  const day = new Date(`${weekStart}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + weeks * 7);
  return toIsoDay(day);
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
    const data = await serverHouseholdFetch<{ items: MealCompletion[] }>("/meal-completions");
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const requested = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T00:00:00Z`) : null;
  const weekStart = toIsoDay(mondayOf(requested ?? new Date()));
  const today = toIsoDay(new Date());
  const currentWeek = toIsoDay(mondayOf(new Date()));

  const [plan, versions, completions] = await Promise.all([
    loadPlan(weekStart),
    loadPublishedVersions(),
    loadCompletions(),
  ]);
  const versionNames = new Map(
    versions.map((item) => [item.recipe_version_id, item.recipe_name]),
  );

  if (plan !== null && "error" in plan) {
    return <ErrorState title="No se pudo cargar el plan" description={plan.error} />;
  }

  const weekNav = (
    <nav aria-label="Cambiar de semana" className="week-nav">
      <Link
        aria-label="Semana anterior"
        className="icon-btn"
        href={`/plan?week=${shiftWeek(weekStart, -1)}` as Route}
      >
        <Icon name="chevron" size={16} />
      </Link>
      <div className="week-identity">
        <strong>Semana del {formatWeekRangeLong(weekStart)}</strong>
        <span>
          {plan && !("error" in plan) ? `${STATE_LABELS[plan.state]} · ` : ""}
          {formatDayMonth(weekStart)} — {formatDayMonth(shiftWeek(weekStart, 1))}
        </span>
      </div>
      <Link
        aria-label="Semana siguiente"
        className="icon-btn"
        href={`/plan?week=${shiftWeek(weekStart, 1)}` as Route}
      >
        <Icon name="chevron" size={16} />
      </Link>
    </nav>
  );

  if (plan === null) {
    return (
      <>
        <div className="planner-toolbar">
          {weekNav}
          {weekStart !== currentWeek ? (
            <Link className="btn btn-ghost" href={"/plan" as Route}>
              Volver a esta semana
            </Link>
          ) : null}
        </div>
        <div className="planner-empty">
          <div>
            <strong>La semana todavía no tiene plan.</strong>
            <p>
              Crea el plan para repartir comidas entre el hogar. Nada aquí toca el inventario
              real: solo se proyecta demanda.
            </p>
          </div>
          <MealPlanCreateButton weekStart={weekStart} />
        </div>
      </>
    );
  }

  const entryIds = new Set(plan.entries.map((entry) => entry.id));
  const planCompletions = Array.isArray(completions)
    ? completions.filter((item) => entryIds.has(item.meal_plan_entry_id))
    : [];
  const recordedByEntry = new Map(
    planCompletions
      .filter((item) => item.state === "recorded")
      .map((item) => [item.meal_plan_entry_id, item]),
  );

  const boardEntries = plan.entries.map((entry) => ({
    id: entry.id,
    plannedDate: entry.planned_date,
    mealType: entry.meal_type,
    servings: entry.servings,
    notes: entry.notes,
    recipeName: versionNames.get(entry.recipe_version_id) ?? "Receta del hogar",
    completed: recordedByEntry.has(entry.id),
  }));
  const completedCount = boardEntries.filter((entry) => entry.completed).length;

  return (
    <>
      <div className="planner-toolbar">
        {weekNav}
        <div className="planner-actions">
          {weekStart !== currentWeek ? (
            <Link className="btn btn-ghost" href={"/plan" as Route}>
              Volver a esta semana
            </Link>
          ) : null}
          <MealPlanTransitionBar
            planId={plan.id}
            state={plan.state}
            version={plan.version}
          />
        </div>
        <span className="week-summary">
          {boardEntries.length} comidas · {completedCount} completadas
        </span>
      </div>

      {plan.entries.length === 0 ? (
        <div className="planner-empty">
          <div>
            <strong>El plan está vacío.</strong>
            <p>
              Añade comidas desde cualquier día del calendario o desde el catálogo de
              recetas.
            </p>
          </div>
        </div>
      ) : null}

      <PlanBoard
        entries={boardEntries}
        planId={plan.id}
        state={plan.state}
        today={today}
        version={plan.version}
        versions={versions}
        weekStart={plan.week_start_date}
      />

      {planCompletions.length > 0 || (completions && "error" in completions) ? (
        <article className="card card-flush" style={{ marginTop: 18 }}>
          <div className="card-title">
            <h2>Comidas completadas</h2>
            <span className="meta">{planCompletions.length} registros</span>
          </div>
          {completions && "error" in completions ? (
            <p role="alert">{completions.error}</p>
          ) : null}
          <div className="detail-list">
            {planCompletions.map((completion) => (
              <div className="detail-row" key={completion.id}>
                <div>
                  <span className="meal-name">
                    {completion.recipe_name ?? completion.recipe_version_id}
                  </span>
                  <span className="muted" style={{ display: "block" }}>
                    {completion.planned_date ? formatDayMonth(completion.planned_date) : ""}
                    {completion.meal_type ? ` · ${MEAL_LABELS[completion.meal_type]}` : ""}
                  </span>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, listStyle: "disc" }}>
                    {completion.lines.map((line) => {
                      const differs = line.actual_amount !== line.planned_amount;
                      return (
                        <li className="muted" key={line.id} style={{ fontSize: 12 }}>
                          {line.ingredient_name ?? line.ingredient_id}: {line.actual_amount}{" "}
                          {line.unit}
                          {differs ? ` (plan: ${line.planned_amount} ${line.unit})` : ""}
                          {completion.state === "recorded" ? (
                            <CorrectLineForm
                              completionId={completion.id}
                              currentAmount={line.actual_amount}
                              lineId={line.id}
                              unit={line.unit}
                              version={completion.version}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  {completion.state === "reopened" && completion.reopen_reason ? (
                    <span className="muted" style={{ fontSize: 12 }}>
                      Reabierta: {completion.reopen_reason}
                    </span>
                  ) : null}
                </div>
                <span className={`status ${completion.state === "recorded" ? "available" : "pending"}`}>
                  {completion.state === "recorded" ? "Registrada" : "Reabierta"}
                </span>
                {completion.state === "recorded" ? (
                  <ReopenCompletionButton
                    completionId={completion.id}
                    version={completion.version}
                  />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </>
  );
}
