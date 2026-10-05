import { CorrectLineForm } from "@/components/completion/CorrectLineForm";
import { ReopenCompletionButton } from "@/components/completion/ReopenCompletionButton";
import type { components } from "@/lib/api/generated/schema";
import { formatDayMonth, formatQuantity } from "@/lib/format";

type Completion = components["schemas"]["MealCompletionResponse"];
type MealType = components["schemas"]["RecipeMealType"];

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

function sortCompletions(completions: Completion[]): Completion[] {
  return [...completions].sort((left, right) => {
    const dateOrder = (right.planned_date ?? "").localeCompare(left.planned_date ?? "");
    if (dateOrder !== 0) return dateOrder;
    return (
      MEAL_ORDER[left.meal_type ?? "snack"] - MEAL_ORDER[right.meal_type ?? "snack"]
    );
  });
}

function outcomeStatus(completion: Completion): { label: string; className: string } {
  if (completion.state === "reopened") {
    return { label: "Reabierta", className: "pending" };
  }
  return completion.outcome === "cooked"
    ? { label: "Cocinada", className: "completed" }
    : { label: "Domicilio", className: "neutral" };
}

export function CompletedMealsList({
  completions,
  error,
}: {
  completions: Completion[];
  error?: string;
}) {
  const sorted = sortCompletions(completions);

  return (
    <section aria-labelledby="completed-meals-heading" className="card completed-meals">
      <div className="card-title">
        <h2 id="completed-meals-heading">Comidas registradas</h2>
        <span className="meta">{completions.length} registros</span>
      </div>
      {error ? (
        <p className="inline-alert" role="alert">
          {error}
        </p>
      ) : null}
      {sorted.length > 0 ? (
        <div className="completed-meals-grid">
          {sorted.map((completion) => {
            const status = outcomeStatus(completion);
            const recorded = completion.state === "recorded";

            return (
              <article
                className={`completed-meal${recorded ? "" : " is-reopened"}`}
                key={completion.id}
              >
                <div className="completed-meal-head">
                  <span className="meta">
                    {completion.planned_date ? formatDayMonth(completion.planned_date) : ""}
                    {completion.meal_type
                      ? ` · ${MEAL_LABELS[completion.meal_type]}`
                      : ""}
                  </span>
                  <span className={`status status-chip ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <strong className="meal-name">
                  {completion.recipe_name ?? completion.recipe_version_id ?? "Comida"}
                </strong>

                {completion.state === "reopened" && completion.reopen_reason ? (
                  <p className="completed-meal-note">Reabierta: {completion.reopen_reason}</p>
                ) : null}
                {completion.outcome === "skipped" ? (
                  <p className="completed-meal-note">
                    {completion.outcome_note ?? "Sin descontar inventario."}
                  </p>
                ) : null}
                {completion.outcome === "cooked" ? (
                  <details className="consumed-details">
                    <summary>Ingredientes usados ({completion.lines.length})</summary>
                    <ul className="consumed-lines">
                      {completion.lines.map((line) => {
                        const differs = line.actual_amount !== line.planned_amount;
                        return (
                          <li className="consumed-line" key={line.id}>
                            <span className="consumed-line-name">
                              {line.ingredient_name ?? line.ingredient_id}
                            </span>
                            <span className="consumed-line-amount">
                              {formatQuantity(line.actual_amount, line.unit)}
                              {differs ? (
                                <span className="consumed-line-planned">
                                  {" "}
                                  (plan: {formatQuantity(line.planned_amount, line.unit)})
                                </span>
                              ) : null}
                            </span>
                            {recorded && completion.outcome === "cooked" ? (
                              <span className="consumed-line-action">
                                <CorrectLineForm
                                  completionId={completion.id}
                                  currentAmount={line.actual_amount}
                                  lineId={line.id}
                                  unit={line.unit}
                                  version={completion.version}
                                />
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ) : null}

                {recorded ? (
                  <footer className="completed-meal-footer">
                    <ReopenCompletionButton
                      completionId={completion.id}
                      version={completion.version}
                    />
                  </footer>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : !error ? (
        <p className="muted">Todavía no hay comidas registradas.</p>
      ) : null}
    </section>
  );
}
