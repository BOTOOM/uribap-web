import Link from "next/link";

import { ErrorState } from "@/components/states/ErrorState";
import { RecipeFavoriteButton } from "@/components/recipes/RecipeFavoriteButton";
import { serverHouseholdFetch } from "@/lib/api/server-client";

type Recipe = { id: string; name: string; description: string | null; latest_version: number | null; latest_state: string | null };

async function loadRecipe(recipeId: string): Promise<Recipe | { error: string }> {
  try {
    return await serverHouseholdFetch<Recipe>(`/recipes/${recipeId}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = await params;
  const recipe = await loadRecipe(recipeId);
  if ("error" in recipe) return <ErrorState title="No se pudo cargar la receta" description={recipe.error} />;
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="recipe-title">
        <p className="eyebrow">Uribap · receta</p>
        <h1 id="recipe-title">{recipe.name}</h1>
        <p className="lede">{recipe.description ?? "Sin descripción todavía."}</p>
        <div className="foundation-actions">
          <span className="status">Versión {recipe.latest_version ?? "—"} · {recipe.latest_state ?? "draft"}</span>
          <RecipeFavoriteButton recipeId={recipe.id} />
          <Link className="status status-ready" href="/recetas">Volver a recetas</Link>
        </div>
      </section>
    </div>
  );
}
