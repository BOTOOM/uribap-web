import Link from "next/link";

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
import { formatQuantity } from "@/lib/format";

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  latest_version: number | null;
  latest_state: string | null;
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
    const data = await serverHouseholdFetch<{ items: EditorIngredient[] }>(
      "/ingredients?limit=100",
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
  const [version, ingredients] = await Promise.all([
    recipe.latest_version ? loadVersion(recipe.id, recipe.latest_version) : null,
    loadIngredients(),
  ]);

  const editable = recipe.latest_state === "draft" && version !== null;
  const initialLines: VersionLine[] =
    version?.ingredients.map((line) => ({
      ingredient_id: line.ingredient_id,
      amount: line.amount,
      unit: line.unit,
      optional: line.optional,
    })) ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{recipe.name}</h1>
          <p>{recipe.description ?? "Sin descripción todavía."}</p>
        </div>
        <div className="planner-actions" style={{ marginLeft: 0 }}>
          {recipe.latest_state === "draft" && recipe.latest_version ? (
            <PublishVersionButton
              recipeId={recipe.id}
              versionNumber={recipe.latest_version}
            />
          ) : null}
          {recipe.latest_state === "published" && version ? (
            <NewVersionButton
              baseServings={version.base_servings}
              prepMinutes={version.prep_minutes}
              recipeId={recipe.id}
            />
          ) : null}
          <RecipeFavoriteButton recipeId={recipe.id} />
          <Link className="btn btn-ghost" href="/recetas">
            <Icon name="book" size={15} />
            Volver a recetas
          </Link>
        </div>
      </div>
      <article className="card" style={{ maxWidth: 560 }}>
        <div className="card-title">
          <h2>Versión {version?.version_number ?? recipe.latest_version ?? "—"}</h2>
          <span className="status available">
            {STATE_LABELS[recipe.latest_state ?? "draft"] ?? "borrador"}
          </span>
        </div>
        <p className="muted">
          {version?.base_servings ?? "—"} raciones base
          {version?.prep_minutes ? ` · ${version.prep_minutes} min de preparación` : ""}.
          Las versiones publicadas alimentan el planificador semanal y la previsión de
          demanda.
        </p>
      </article>
      <article className="card" style={{ maxWidth: 640 }}>
        <div className="card-title">
          <h2>Ingredientes</h2>
          {editable ? <span className="meta">editable en borrador</span> : null}
        </div>
        {editable && recipe.latest_version ? (
          <RecipeIngredientsEditor
            ingredients={ingredients}
            initialLines={initialLines}
            recipeId={recipe.id}
            versionNumber={recipe.latest_version}
          />
        ) : version && version.ingredients.length > 0 ? (
          <ul className="detail-list" aria-label="Ingredientes de la versión">
            {version.ingredients.map((line) => (
              <li className="detail-row" key={line.id}>
                <span className="meal-name">
                  {line.ingredient_name || "Ingrediente"} · {formatQuantity(line.amount, line.unit)}
                  {line.optional ? " (opcional)" : ""}
                </span>
              </li>
            ))}
          </ul>
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
