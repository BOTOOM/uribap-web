import Link from "next/link";
import type { Route } from "next";

import { ErrorState } from "@/components/states/ErrorState";
import { serverHouseholdFetch } from "@/lib/api/server-client";

type Recipe = { id: string; name: string; description: string | null; latest_version: number | null; latest_state: string | null };

async function loadRecipes(query: string): Promise<Recipe[] | { error: string }> {
  try {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    const data = await serverHouseholdFetch<{ items: Recipe[] }>(`/recipes?${params.toString()}`);
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const { query = "" } = await searchParams;
  const data = await loadRecipes(query);
  if ("error" in data) return <ErrorState title="No se pudieron cargar las recetas" description={data.error} />;
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="recipes-title">
        <p className="eyebrow">Uribap · recetas</p>
        <h1 id="recipes-title">Recetas que se pueden volver a cocinar.</h1>
        <p className="lede">Versiones claras, ingredientes compatibles y preparación visible.</p>
        <form action="/recetas" method="get" className="foundation-actions">
          <label>Buscar receta<input name="query" defaultValue={query} /></label>
          <button className="status status-ready" type="submit">Buscar</button>
          <Link className="status status-ready" href={"/recetas/nueva" as Route}>Nueva receta</Link>
        </form>
      </section>
      <section className="foundation-list" aria-labelledby="recipe-list-title">
        <h2 id="recipe-list-title">Recetas activas</h2>
        {data.length === 0 ? <p role="status">Todavía no hay recetas para este hogar.</p> : (
          <ul>
            {data.map((recipe) => (
              <li key={recipe.id}>
                <span className="item-index">{recipe.latest_version ?? "—"}</span>
                <Link href={`/recetas/${recipe.id}` as Route}>{recipe.name}</Link>
                <span>{recipe.latest_state ?? "draft"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
