import Link from "next/link";
import type { Route } from "next";

import { CompletedMealsList } from "@/components/completion/CompletedMealsList";
import { MealPlanCreateButton } from "@/components/planning/MealPlanCreateButton";
import { MealPlanTransitionBar } from "@/components/planning/MealPlanTransitionBar";
import { PlanBoard } from "@/components/planning/PlanBoard";
import { ErrorState } from "@/components/states/ErrorState";
import { Icon } from "@/components/ui/Icon";
import {
  ApiRequestError,
  serverApiFetch,
  serverHouseholdFetch,
} from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatDayMonth, formatWeekRangeLong, todayInTimeZone, toIsoDay } from "@/lib/format";
import { mondayOf } from "@/lib/forecast/window";
import type { CatalogIngredient } from "@/lib/ingredients";

type MealPlan = components["schemas"]["MealPlanResponse"];
type MealCompletion = components["schemas"]["MealCompletionResponse"];
type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];
type Ingredient = components["schemas"]["IngredientResponse"];
type PlanState = components["schemas"]["MealPlanState"];

type CurrentUser = {
  memberships: Array<{ household_id: string; status: string }>;
};

type HouseholdTimezone = {
  timezone: string;
};

const STATE_LABELS: Record<PlanState, string> = {
  draft: "borrador",
  proposed: "propuesto",
  approved: "aprobado",
  archived: "archivado",
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

async function loadIngredients(): Promise<CatalogIngredient[]> {
  try {
    const data = await serverHouseholdFetch<{ items: Ingredient[] }>("/ingredients");
    return data.items.map((item) => ({
      id: item.id,
      name: item.name,
      dimension: item.dimension,
      base_unit: item.base_unit,
    }));
  } catch {
    return [];
  }
}

async function loadHouseholdToday(): Promise<string> {
  try {
    const currentUser = await serverApiFetch<CurrentUser>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) return toIsoDay(new Date());
    const household = await serverApiFetch<HouseholdTimezone>(
      `/households/${membership.household_id}`,
    );
    return todayInTimeZone(household.timezone);
  } catch {
    return toIsoDay(new Date());
  }
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const requested = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T00:00:00Z`) : null;
  const today = await loadHouseholdToday();
  const currentHouseholdDate = new Date(`${today}T00:00:00Z`);
  const weekStart = toIsoDay(mondayOf(requested ?? currentHouseholdDate));
  const currentWeek = toIsoDay(mondayOf(currentHouseholdDate));

  const [plan, versions, completions, ingredients] = await Promise.all([
    loadPlan(weekStart),
    loadPublishedVersions(),
    loadCompletions(),
    loadIngredients(),
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

  const boardEntries = plan.entries.map((entry) => {
    const completion = recordedByEntry.get(entry.id) ?? null;
    return {
      id: entry.id,
      plannedDate: entry.planned_date,
      mealType: entry.meal_type,
      servings: entry.servings,
      notes: entry.notes,
      recipeName: versionNames.get(entry.recipe_version_id) ?? "Receta del hogar",
      outcome: completion?.outcome ?? null,
      completed: completion !== null,
      completionVersion: completion?.version ?? null,
    };
  });
  const completedCount = boardEntries.filter((entry) => entry.completed).length;
  const completionError =
    completions && !Array.isArray(completions) ? completions.error : undefined;

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
        ingredients={ingredients}
        planId={plan.id}
        state={plan.state}
        today={today}
        version={plan.version}
        versions={versions}
        weekStart={plan.week_start_date}
      />

      {planCompletions.length > 0 || completionError ? (
        <CompletedMealsList completions={planCompletions} error={completionError} />
      ) : null}
    </>
  );
}
