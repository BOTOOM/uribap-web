import { ErrorState } from "@/components/states/ErrorState";
import { ManualTaskForm } from "@/components/preparation/ManualTaskForm";
import { PreparationTaskActions } from "@/components/preparation/PreparationTaskActions";
import { Icon } from "@/components/ui/Icon";
import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatDueLabel, formatDayLong, formatQuantity, relativeDay } from "@/lib/format";

type Task = components["schemas"]["PreparationTaskResponse"];
type TaskPage = components["schemas"]["PreparationTaskPage"];
type TaskStatus = components["schemas"]["PreparationTaskStatus"];
type TaskType = components["schemas"]["PreparationTaskType"];
type MealType = components["schemas"]["RecipeMealType"];
type Ingredient = { id: string; name: string; base_unit: string };

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "pendiente",
  completed: "completada",
  cancelled: "cancelada",
};

const TYPE_LABELS: Record<TaskType, string> = {
  defrost: "descongelar",
  soak: "remojar",
  marinate: "marinar",
  prepare_ahead: "preparar",
  manual: "manual",
};

const TYPE_ICONS: Record<TaskType, "snow" | "clock" | "cooking" | "package" | "check"> = {
  defrost: "snow",
  soak: "clock",
  marinate: "cooking",
  prepare_ahead: "package",
  manual: "check",
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "desayuno",
  lunch: "comida",
  snack: "merienda",
  dinner: "cena",
};

async function loadTasks(): Promise<Array<Task & { overdue: boolean }> | { error: string }> {
  try {
    const page = await serverHouseholdFetch<TaskPage>("/preparation-tasks");
    const now = Date.now();
    return page.items.map((task) => ({
      ...task,
      overdue: task.status === "pending" && new Date(task.due_at).getTime() < now,
    }));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

async function loadIngredients(): Promise<Ingredient[]> {
  try {
    const page = await serverHouseholdFetch<{ items: Ingredient[] }>("/ingredients");
    return page.items;
  } catch {
    return [];
  }
}

function dayKey(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return "sin-fecha";
  return date.toISOString().slice(0, 10);
}

function TaskCard({ task }: { task: Task & { overdue: boolean } }) {
  return (
    <div className="task">
      <span
        aria-hidden="true"
        className={`task-icon${task.overdue ? " tone-warning" : ""}`}
      >
        <Icon name={TYPE_ICONS[task.task_type]} size={17} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="meal-name">{task.title}</span>
        <span className="muted" style={{ display: "block", marginTop: 2 }}>
          {task.origin === "derived"
            ? `${task.recipe_name ?? "receta"}${task.meal_type ? ` · ${MEAL_LABELS[task.meal_type]}` : ""}${task.planned_date ? ` · ${relativeDay(task.planned_date)}` : ""}`
            : "tarea manual"}
          {task.ingredient_name ? ` · ${task.ingredient_name}` : ""}
          {task.amount && task.unit ? ` ${formatQuantity(task.amount, task.unit)}` : ""}
        </span>
        {task.instruction ? (
          <span className="muted" style={{ display: "block", marginTop: 2, fontSize: 12 }}>
            {task.instruction}
          </span>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 6, justifyItems: "end", alignContent: "start" }}>
        <span className="meta">{TYPE_LABELS[task.task_type]}</span>
        <span
          className={`status ${
            task.overdue ? "missing" : task.status === "pending" ? "pending" : "available"
          }`}
        >
          {task.overdue ? "vencida" : STATUS_LABELS[task.status]}
        </span>
        <PreparationTaskActions task={task} />
      </div>
    </div>
  );
}

export default async function PreparationPage() {
  const [tasks, ingredients] = await Promise.all([loadTasks(), loadIngredients()]);

  if ("error" in tasks) {
    return <ErrorState description={tasks.error} title="No se pudieron cargar las tareas" />;
  }

  const pending = tasks
    .filter((task) => task.status === "pending")
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  const resolved = tasks
    .filter((task) => task.status !== "pending")
    .sort((a, b) => b.due_at.localeCompare(a.due_at));

  const groups = new Map<string, typeof pending>();
  for (const task of pending) {
    const key = dayKey(task.due_at);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Preparación</h1>
          <p>
            Preparar a tiempo, sin adivinar. Las tareas derivadas nacen al aprobar el plan:
            cada regla de la receta se convierte en una tarea con su vencimiento exacto.
          </p>
        </div>
      </div>

      <article className="card card-flush">
        <div className="card-title">
          <h2>Pendientes</h2>
          <span className="meta">
            {pending.length} tareas · {pending.filter((task) => task.overdue).length} vencidas
          </span>
        </div>
        {pending.length === 0 ? (
          <div className="empty">
            <strong>No hay tareas pendientes.</strong>
            <p>
              Las tareas aparecen al aprobar un plan con recetas que definen reglas de
              preparación, o al crear una tarea manual.
            </p>
          </div>
        ) : (
          <div>
            {[...groups.entries()].map(([day, dayTasks]) => (
              <div className="timeline-group" key={day}>
                <div>
                  <span className="time-label">
                    {day === "sin-fecha" ? "sin fecha" : relativeDay(day)}
                  </span>
                  <span className="muted" style={{ display: "block", fontSize: 12 }}>
                    {day === "sin-fecha" ? "" : formatDayLong(day)}
                  </span>
                </div>
                <div>
                  {dayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {resolved.length > 0 ? (
        <article className="card card-flush" style={{ marginTop: 18 }}>
          <div className="card-title">
            <h2>Resueltas</h2>
            <span className="meta">{resolved.length} tareas</span>
          </div>
          <div>
            {resolved.slice(0, 10).map((task) => (
              <div className="detail-row" key={task.id}>
                <div>
                  <span className="meal-name">{task.title}</span>
                  <span className="muted" style={{ display: "block" }}>
                    {formatDueLabel(task.due_at)} · {TYPE_LABELS[task.task_type]}
                  </span>
                </div>
                <span className="status available">{STATUS_LABELS[task.status]}</span>
                <span />
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-title">
          <h2>Tarea manual</h2>
          <span className="meta">sin receta asociada</span>
        </div>
        <ManualTaskForm ingredients={ingredients} />
      </article>
    </>
  );
}
