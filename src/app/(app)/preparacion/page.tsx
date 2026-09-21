import { ErrorState } from "@/components/states/ErrorState";
import { ManualTaskForm } from "@/components/preparation/ManualTaskForm";
import { PreparationTaskActions } from "@/components/preparation/PreparationTaskActions";
import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";

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

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "desayuno",
  lunch: "comida",
  snack: "merienda",
  dinner: "cena",
};

function formatDue(dueAt: string): string {
  const date = new Date(dueAt);
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`;
}

async function loadTasks(): Promise<Task[] | { error: string }> {
  try {
    const page = await serverHouseholdFetch<TaskPage>("/preparation-tasks");
    return page.items;
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

function TaskRow({ task, now }: { task: Task; now: number }) {
  const overdue = task.status === "pending" && new Date(task.due_at).getTime() < now;
  return (
    <li>
      <span className="item-index">{formatDue(task.due_at)}</span>
      <span>
        {task.title}
        {task.origin === "derived"
          ? ` · ${task.recipe_name ?? "receta"}${task.meal_type ? ` · ${MEAL_LABELS[task.meal_type]}` : ""}${task.planned_date ? ` · ${task.planned_date}` : ""}`
          : ""}
        {task.ingredient_name ? ` · ${task.ingredient_name}` : ""}
        {task.amount && task.unit ? ` ${task.amount} ${task.unit}` : ""}
        {task.instruction ? ` — ${task.instruction}` : ""}
      </span>
      <span className={`status ${overdue ? "status-missing" : task.status === "pending" ? "status-warning" : "status-ready"}`}>
        {overdue ? "vencida" : STATUS_LABELS[task.status]}
      </span>
      <span className="item-index">{TYPE_LABELS[task.task_type]}</span>
      <PreparationTaskActions task={task} />
    </li>
  );
}

export default async function PreparationPage() {
  const [tasks, ingredients] = await Promise.all([loadTasks(), loadIngredients()]);

  if ("error" in tasks) {
    return <ErrorState title="No se pudieron cargar las tareas" description={tasks.error} />;
  }

  const now = Date.now();
  const pending = tasks.filter((task) => task.status === "pending");
  const resolved = tasks.filter((task) => task.status !== "pending");

  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="preparacion-title">
        <p className="eyebrow">Uribap · preparación</p>
        <h1 id="preparacion-title">Preparar a tiempo, sin adivinar.</h1>
        <p className="lede">
          Las tareas derivadas nacen al aprobar el plan: cada regla de la receta se convierte en
          una tarea con su vencimiento exacto.
        </p>
      </section>
      <section className="foundation-list" aria-labelledby="preparation-pending-title">
        <h2 id="preparation-pending-title">Pendientes</h2>
        {pending.length === 0 ? (
          <p role="status">
            No hay tareas pendientes. Las tareas aparecen al aprobar un plan con recetas que
            definen reglas de preparación.
          </p>
        ) : (
          <ul>
            {pending.map((task) => (
              <TaskRow key={task.id} task={task} now={now} />
            ))}
          </ul>
        )}
      </section>
      {resolved.length > 0 ? (
        <section className="foundation-list" aria-labelledby="preparation-resolved-title">
          <h2 id="preparation-resolved-title">Resueltas</h2>
          <ul>
            {resolved.map((task) => (
              <TaskRow key={task.id} task={task} now={now} />
            ))}
          </ul>
        </section>
      ) : null}
      <section className="foundation-list" aria-labelledby="preparation-manual-title">
        <h2 id="preparation-manual-title">Tarea manual</h2>
        <ManualTaskForm ingredients={ingredients} />
      </section>
    </div>
  );
}
