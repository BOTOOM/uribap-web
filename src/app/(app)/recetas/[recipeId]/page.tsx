import Link from "next/link";

import { RecipeArchiveButton } from "@/components/recipes/RecipeArchiveButton";
import { RecipeEditDialog } from "@/components/recipes/RecipeEditDialog";
import { RecipeFavoriteButton } from "@/components/recipes/RecipeFavoriteButton";
import { PublishVersionButton } from "@/components/recipes/PublishVersionButton";
import { NewVersionButton } from "@/components/recipes/NewVersionButton";
import {
  RecipeIngredientsEditor,
  type EditorIngredient,
  type VersionLine,
} from "@/components/recipes/RecipeIngredientsEditor";
import { ErrorState } from "@/components/states/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { serverHouseholdFetch } from "@/lib/api/server-client";
import { listAllIngredients } from "@/lib/api/list-all-ingredients";
import type { components } from "@/lib/api/generated/schema";
import { formatQuantity } from "@/lib/format";
import { weekWindow } from "@/lib/forecast/window";

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  latest_version: number | null;
  latest_state: string | null;
  archived_at: string | null;
};

type VersionDetail = {
  version_number: number;
  state: string;
  base_servings: number;
  prep_minutes: number;
  ingredients: Array<{
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    amount: string;
    unit: string;
    optional: boolean;
  }>;
};

const STATE_LABELS: Record<string, string> = {
  draft: "borrador",
  published: "publicada",
  archived: "archivada",
};

async function loadRecipe(recipeId: string): Promise<Recipe | { error: string }> {
  try {
    return await serverHouseholdFetch<Recipe>(`/recipes/${recipeId}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

async function loadVersion(
  recipeId: string,
  versionNumber: number,
): Promise<VersionDetail | null> {
  try {
    return await serverHouseholdFetch<VersionDetail>(
      `/recipes/${recipeId}/versions/${versionNumber}`,
    );
  } catch {
    return null;
  }
}

async function loadIngredients(): Promise<EditorIngredient[]> {
  try {
    return await listAllIngredients("/ingredients?limit=100");
  } catch {
    return [];
  }
}

type DemandLine = components["schemas"]["DemandForecastLine"];

async function loadForecast(fromDate: string, toDate: string): Promise<DemandLine[]> {
  try {
    const data = await serverHouseholdFetch<{ items: DemandLine[] }>(
      `/forecast/demand?from_date=${fromDate}&to_date=${toDate}`,
    );
    return data.items;
  } catch {
    return [];
  }
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const recipe = await loadRecipe(recipeId);
  if ("error" in recipe) {
    return <ErrorState description={recipe.error} title="No se pudo cargar la receta" />;
  }
  const { fromDate, toDate } = weekWindow();
  const [version, ingredients, forecast] = await Promise.all([
    recipe.latest_version ? loadVersion(recipe.id, recipe.latest_version) : null,
    loadIngredients(),
    loadForecast(fromDate, toDate),
  ]);
  const demandByIngredient = new Map(forecast.map((line) => [line.ingredient_id, line]));

  const archived = recipe.archived_at !== null;
  const editable = !archived && recipe.latest_state === "draft" && version !== null;
  const initialLines: VersionLine[] =
    version?.ingredients.map((line) => ({
      ingredient_id: line.ingredient_id,
      amount: line.amount,
      unit: line.unit,
      optional: line.optional,
    })) ?? [];

  return (
    <>
      {archived ? (
        <div className="inline-note" role="status" style={{ marginBottom: 16 }}>
          <span className="status neutral">
            Receta archivada: no aparece en el planificador
          </span>
        </div>
      ) : null}
      <div className="page-head">
        <div>
          <Link className="btn btn-ghost" href="/recetas" style={{ marginBottom: 8 }}>
            <Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} />
            Volver a recetas
          </Link>
          <h1>{recipe.name}</h1>
          <p>{recipe.description ?? "Sin descripción todavía."}</p>
        </div>
        <div
          className="planner-actions"
          style={{ flexWrap: "wrap", marginLeft: 0 }}
        >
          {!archived &&
          version &&
          (recipe.latest_state === "draft" || recipe.latest_state === "published") ? (
            <RecipeEditDialog
              baseServings={version.base_servings}
              description={recipe.description}
              latestState={recipe.latest_state}
              name={recipe.name}
              prepMinutes={version.prep_minutes}
              recipeId={recipe.id}
            />
          ) : null}
          {!archived && recipe.latest_state === "draft" && recipe.latest_version ? (
            <PublishVersionButton
              recipeId={recipe.id}
              versionNumber={recipe.latest_version}
            />
          ) : null}
          {!archived && recipe.latest_state === "published" && version ? (
            <NewVersionButton recipeId={recipe.id} />
          ) : null}
          <RecipeArchiveButton archived={archived} recipeId={recipe.id} />
          <RecipeFavoriteButton recipeId={recipe.id} />
        </div>
      </div>
      <article className="card" style={{ maxWidth: 560 }}>
        <div className="card-title">
          <h2>Versión {version?.version_number ?? recipe.latest_version ?? "—"}</h2>
          <span className={`status ${archived ? "neutral" : "available"}`}>
            {archived
              ? "archivada"
              : STATE_LABELS[recipe.latest_state ?? "draft"] ?? "borrador"}
          </span>
        </div>
        <p className="muted">
          {version?.base_servings ?? "—"} raciones base
          {version?.prep_minutes ? ` · ${version.prep_minutes} min de preparación` : ""}.
          {archived
            ? "Las comidas planificadas conservan su historial."
            : "Las versiones publicadas alimentan el planificador semanal y la previsión de demanda."}
        </p>
      </article>
      <article className="card" style={{ maxWidth: 640 }}>
        <div className="card-title">
          <h2>Ingredientes</h2>
          {editable ? <span className="meta">editable en borrador</span> : null}
        </div>
        {!archived && editable && recipe.latest_version ? (
          <RecipeIngredientsEditor
            ingredients={ingredients}
            initialLines={initialLines}
            recipeId={recipe.id}
            versionNumber={recipe.latest_version}
          />
        ) : version && version.ingredients.length > 0 ? (
          <table className="ingredient-table">
            <thead>
              <tr>
                <th scope="col">Ingrediente</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {version.ingredients.map((line) => {
                const demand = demandByIngredient.get(line.ingredient_id);
                const missing = demand !== undefined && Number(demand.shortfall_amount) > 0;
                return (
                  <tr key={line.id}>
                    <td>
                      {line.ingredient_name || "Ingrediente"}
                      {line.optional ? <span className="muted"> (opcional)</span> : null}
                    </td>
                    <td className="num">{formatQuantity(line.amount, line.unit)}</td>
                    <td>
                      {demand === undefined ? (
                        <span className="status pending">Sin demanda</span>
                      ) : missing ? (
                        <span className="status missing">Falta</span>
                      ) : (
                        <span className="status available">Disponible</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="helper">
            Esta versión no tiene ingredientes. Sin líneas, el plan no proyecta demanda
            ni la compra detecta faltantes. Las versiones publicadas son inmutables:
            crea una nueva versión para ajustarlas.
          </p>
        )}
      </article>
    </>
  );
}
