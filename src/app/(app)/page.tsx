import Link from "next/link";
import { cookies } from "next/headers";
import type { Route } from "next";

import { HomeMealList, type HomeMealRow } from "@/components/dashboard/HomeMealList";
import { ErrorState } from "@/components/states/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { ApiRequestError, serverApiFetch, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { dashboardDateWindow } from "@/lib/dashboard/date-window";
import { BROWSER_TIME_ZONE_COOKIE, decodeTimeZoneCookie, pickTimeZone } from "@/lib/time-zone";
import {
  formatDueLabel,
  formatQuantity,
  formatWeekRange,
  isoDayInTimeZone,
  relativeDay,
  todayInTimeZone,
  toIsoDay,
} from "@/lib/format";

type MealPlan = components["schemas"]["MealPlanResponse"];
type MealType = components["schemas"]["RecipeMealType"];
type PublishedVersion = components["schemas"]["PublishedRecipeVersionResponse"];
type DemandForecast = components["schemas"]["DemandForecastResponse"];
type ShoppingList = components["schemas"]["ShoppingListResponse"];
type TaskPage = components["schemas"]["PreparationTaskPage"];
type MealCompletion = components["schemas"]["MealCompletionResponse"];
type CurrentUser = {
  memberships: Array<{ household_id: string; status: string }>;
};
type HouseholdTimezone = {
  timezone: string;
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

const MEAL_ORDER: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

type PlanData = MealPlan | null;
type LoadResult<T> = { ok: true; value: T } | { ok: false };

async function tryLoad<T>(promise: Promise<T>): Promise<LoadResult<T>> {
  try {
    return { ok: true, value: await promise };
  } catch {
    return { ok: false };
  }
}

export async function loadDashboard() {
  const mePromise = tryLoad(serverApiFetch<CurrentUser>("/me"));
  const versionsPromise = tryLoad(
    serverHouseholdFetch<{ items: PublishedVersion[] }>("/recipes/published-versions"),
  );
  const listPromise = tryLoad(serverHouseholdFetch<ShoppingList>("/shopping-lists/current"));
  const tasksPromise = tryLoad(serverHouseholdFetch<TaskPage>("/preparation-tasks"));
  const completionsPromise = tryLoad(
    serverHouseholdFetch<{ items: MealCompletion[] }>("/meal-completions"),
  );

  const [me, cookieStore] = await Promise.all([mePromise, cookies()]);
  const browserTimeZone = decodeTimeZoneCookie(
    cookieStore.get(BROWSER_TIME_ZONE_COOKIE)?.value,
  );
  let householdTimeZone: string | null = null;
  if (!browserTimeZone && me.ok) {
    const membership = me.value.memberships.find((item) => item.status === "active");
    if (membership) {
      const household = await tryLoad(
        serverApiFetch<HouseholdTimezone>(`/households/${membership.household_id}`),
      );
      if (household.ok) householdTimeZone = household.value.timezone;
    }
  }
  const timeZone = pickTimeZone(browserTimeZone, householdTimeZone);
  const today = timeZone ? todayInTimeZone(timeZone) : toIsoDay(new Date());
  const dateWindow = dashboardDateWindow(today);

  const [plan, versions, forecast, list, tasks, completions] = await Promise.all([
    tryLoad(
      serverHouseholdFetch<MealPlan>(
        `/plans/current?week_start=${dateWindow.weekStart}`,
      ).catch(
        (error) => {
          if (error instanceof ApiRequestError && error.status === 404) return null;
          throw error;
        },
      ),
    ),
    versionsPromise,
    tryLoad(
      serverHouseholdFetch<DemandForecast>(
        `/forecast/demand?from_date=${dateWindow.weekStart}&to_date=${dateWindow.weekEnd}`,
      ),
    ),
    listPromise,
    tasksPromise,
    completionsPromise,
  ]);

  return { ...dateWindow, timeZone, plan, versions, forecast, list, tasks, completions, me };
}

export default async function DashboardPage() {
  const data = await loadDashboard();

  if (!data.me.ok) {
    return (
      <ErrorState
        title="El hogar no responde"
        description="No pudimos leer tu cuenta. Comprueba la conexión e inténtalo de nuevo."
      />
    );
  }

  const plan: PlanData = data.plan.ok ? data.plan.value : null;
  const names = new Map(
    (data.versions.ok ? data.versions.value.items : []).map((item) => [
      item.recipe_version_id,
      item.recipe_name,
    ]),
  );
  const planEntryIds = new Set((plan?.entries ?? []).map((entry) => entry.id));
  const recordedByEntry = new Map<string, MealCompletion>(
    (data.completions.ok ? data.completions.value.items : [])
      .filter(
        (completion) =>
          completion.state === "recorded" &&
          planEntryIds.has(completion.meal_plan_entry_id),
      )
      .map((completion) => [completion.meal_plan_entry_id, completion] as const),
  );
  const toHomeRows = (entries: MealPlan["entries"]): HomeMealRow[] =>
    entries.map((entry) => {
      const completion = recordedByEntry.get(entry.id);
      return {
        id: entry.id,
        mealLabel: MEAL_LABELS[entry.meal_type],
        recipeName: names.get(entry.recipe_version_id) ?? "Receta del hogar",
        servings: entry.servings,
        outcome: completion?.outcome ?? null,
        completionVersion: completion?.version ?? null,
      };
    });

  const todayEntries = (plan?.entries ?? [])
    .filter((entry) => entry.planned_date === data.today)
    .sort((a, b) => MEAL_ORDER[a.meal_type] - MEAL_ORDER[b.meal_type]);
  const tomorrowEntries = (plan?.entries ?? [])
    .filter((entry) => entry.planned_date === data.tomorrow)
    .sort((a, b) => MEAL_ORDER[a.meal_type] - MEAL_ORDER[b.meal_type]);

  const forecastLines = data.forecast.ok
    ? [...data.forecast.value.items]
        .sort((a, b) => Number(b.shortfall_amount) - Number(a.shortfall_amount))
        .slice(0, 3)
    : [];

  const shoppingPending = data.list.ok
    ? data.list.value.items.filter((item) => item.status === "pending")
    : [];

  const nextTask = data.tasks.ok
    ? data.tasks.value.items
        .filter((task) => task.status === "pending")
        .sort((a, b) => a.due_at.localeCompare(b.due_at))[0] ?? null
    : null;

  const latestCompletion = data.completions.ok
    ? data.completions.value.items
        .filter((item) => item.state === "recorded")
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    : null;

  const headlineParts: string[] = [];
  if (todayEntries.length > 0) headlineParts.push(`${todayEntries.length} comidas hoy`);
  if (nextTask) headlineParts.push("una preparación pendiente");
  if (shoppingPending.length > 0)
    headlineParts.push(`${shoppingPending.length} compras por hacer`);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Lo que requiere atención hoy</h1>
          <p>
            {headlineParts.length > 0
              ? `${headlineParts.join(", ")}.`
              : "Todo tranquilo. El plan, la compra y la preparación están al día."}
          </p>
        </div>
        <Link className="btn btn-primary" href={"/plan" as Route}>
          Abrir plan semanal
        </Link>
      </div>

      <div className="grid grid-main">
        <div className="grid">
          <article className="card card-hero">
            <div className="card-title">
              <h2>Hoy</h2>
              {todayEntries.length > 0 ? (
                <span className="status available">
                  <Icon name="check" size={13} />
                  Planeado
                </span>
              ) : null}
            </div>
            <HomeMealList
              emptyLabel="Nada planeado para hoy. Añade una comida desde el plan semanal."
              planId={plan?.id ?? null}
              planState={plan?.state ?? null}
              planVersion={plan?.version ?? null}
              rows={toHomeRows(todayEntries)}
            />
          </article>

          <article className="card card-flush">
            <div className="card-title">
              <h2>Mañana</h2>
              <Link className="btn btn-ghost" href={"/plan" as Route}>
                Ver detalle
              </Link>
            </div>
            <HomeMealList
              emptyLabel="Mañana está libre en el plan."
              planId={plan?.id ?? null}
              planState={plan?.state ?? null}
              planVersion={plan?.version ?? null}
              rows={toHomeRows(tomorrowEntries)}
            />
          </article>

          <article className="card card-flush">
            <div className="card-title">
              <div>
                <h2>Pronóstico de inventario</h2>
                <span className="muted">
                  Los planes no descuentan existencias hasta cocinar.
                </span>
              </div>
              <Link className="btn btn-ghost" href={"/forecast" as Route}>
                Previsión
              </Link>
            </div>
            {data.forecast.ok && forecastLines.length > 0 ? (
              <div className="forecast">
                {forecastLines.map((line) => {
                  const shortfall = Number(line.shortfall_amount) > 0;
                  const covered = Number(line.on_hand_amount);
                  const required = Math.max(Number(line.required_amount), 0.000001);
                  const width = Math.min(100, Math.round((covered / required) * 100));
                  return (
                    <div className="forecast-line" key={`${line.ingredient_id}-${line.unit}`}>
                      <strong>{line.ingredient_name}</strong>
                      {shortfall ? (
                        <span className="status low">
                          Faltan {formatQuantity(line.shortfall_amount, line.unit)}
                        </span>
                      ) : (
                        <span className="meta">
                          {formatQuantity(line.on_hand_amount, line.unit)} reales
                        </span>
                      )}
                      <div className="mini-bar">
                        <span
                          style={
                            {
                              "--w": `${width}%`,
                              background: shortfall ? "var(--warning)" : "var(--fg)",
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">
                Sin demanda proyectada esta semana ({formatWeekRange(data.weekStart)}).
              </p>
            )}
          </article>
        </div>

        <aside className="grid">
          {nextTask ? (
            <article className="callout">
              <div className="task-icon" style={{ float: "right" }}>
                <Icon name="snow" />
              </div>
              <span className="meta">{formatDueLabel(nextTask.due_at)}</span>
              <strong>{nextTask.title}</strong>
              <p className="muted" style={{ margin: 0 }}>
                {nextTask.meal_type
                  ? `Para ${MEAL_LABELS[nextTask.meal_type as MealType] ?? "la comida"}${nextTask.planned_date ? ` del ${relativeDay(nextTask.planned_date, data.today)}` : ""}.`
                  : "Tarea de preparación pendiente."}
              </p>
            </article>
          ) : null}

          <article className="card card-tinted">
            <div className="card-title">
              <h2>Compra</h2>
              {shoppingPending.length > 0 ? (
                <span className="status missing">{shoppingPending.length} pendientes</span>
              ) : (
                <span className="status available">Al día</span>
              )}
            </div>
            {data.list.ok && shoppingPending.length > 0 ? (
              <div className="detail-list">
                {shoppingPending.slice(0, 3).map((item) => (
                  <div className="detail-row" key={item.id}>
                    <span className="meal-name">{item.ingredient_name}</span>
                    <span className="muted">
                      Comprar {formatQuantity(item.needed_amount, item.unit)}
                    </span>
                    <span className="meta">esta ventana</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                {data.list.ok
                  ? "La lista no tiene faltantes ahora mismo."
                  : "La lista no está disponible en este momento."}
              </p>
            )}
            <Link
              className="btn btn-secondary"
              href={"/inventario" as Route}
              style={{ width: "100%", marginTop: 18 }}
            >
              Ir a la despensa
            </Link>
          </article>

          <article className="card card-flush">
            <div className="card-title">
              <h2>Completado</h2>
              {latestCompletion?.created_at ? (
                <span className="meta">
                  {relativeDay(
                    data.timeZone
                      ? isoDayInTimeZone(new Date(latestCompletion.created_at), data.timeZone)
                      : toIsoDay(new Date(latestCompletion.created_at)),
                    data.today,
                  )}
                </span>
              ) : null}
            </div>
            {latestCompletion ? (
              <>
                <strong>{latestCompletion.recipe_name ?? "Comida completada"}</strong>
                <p className="muted" style={{ margin: "5px 0 0" }}>
                  Consumo confirmado
                  {latestCompletion.lines.length > 0
                    ? `: ${latestCompletion.lines
                        .slice(0, 2)
                        .map((line) =>
                          `${formatQuantity(line.actual_amount, line.unit)} ${line.ingredient_name ?? ""}`.trim(),
                        )
                        .join(", ")}`
                    : "."}
                </p>
              </>
            ) : (
              <p className="muted">Aún no se ha cocinado nada de este plan.</p>
            )}
          </article>
        </aside>
      </div>
    </>
  );
}
