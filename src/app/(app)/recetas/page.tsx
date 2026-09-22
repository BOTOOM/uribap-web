import Link from "next/link";
import type { Route } from "next";

import { ErrorState } from "@/components/states/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { serverHouseholdFetch } from "@/lib/api/server-client";

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  latest_version: number | null;
  latest_state: string | null;
};

const STATE_LABELS: Record<string, string> = {
  draft: "borrador",
  published: "publicada",
  archived: "archivada",
};

async function loadRecipes(query: string): Promise<Recipe[] | { error: string }> {
  try {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    const data = await serverHouseholdFetch<{ items: Recipe[] }>(
      `/recipes?${params.toString()}`,
    );
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query = "" } = await searchParams;
  const data = await loadRecipes(query);
  if ("error" in data) {
    return (
      <ErrorState description={data.error} title="No se pudieron cargar las recetas" />
    );
  }
  const [featured, ...rest] = data;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recetas</h1>
          <p>
            Recetas que se pueden volver a cocinar: versiones claras, ingredientes
            compatibles y preparación visible.
          </p>
        </div>
        <Link className="btn btn-primary" href={"/recetas/nueva" as Route}>
          <Icon name="plus" size={15} />
          Nueva receta
        </Link>
      </div>

      <form action="/recetas" className="filters" method="get">
        <div className="search-wrap">
          <Icon name="search" size={16} />
          <input
            aria-label="Buscar receta"
            className="search"
            defaultValue={query}
            name="query"
            placeholder="Buscar por nombre…"
            type="search"
          />
        </div>
        <button className="btn btn-secondary" type="submit">
          Buscar
        </button>
      </form>

      {data.length === 0 ? (
        <article className="card">
          <div className="empty">
            <strong>
              {query
                ? `Ninguna receta coincide con "${query}".`
                : "Todavía no hay recetas para este hogar."}
            </strong>
            <p>
              {query
                ? "Prueba con otro término o crea la receta que buscas."
                : "Crea la primera receta para poder planificar comidas de verdad."}
            </p>
            <Link className="btn btn-primary" href={"/recetas/nueva" as Route}>
              Crear receta
            </Link>
          </div>
        </article>
      ) : (
        <div className="recipe-grid">
          {featured ? (
            <Link
              className="recipe-card is-featured"
              href={`/recetas/${featured.id}` as Route}
            >
              <div className="card-title">
                <span className="status available">
                  {STATE_LABELS[featured.latest_state ?? "draft"] ?? "borrador"}
                </span>
              </div>
              <h2 className="recipe-name">{featured.name}</h2>
              <p className="muted">
                {featured.description ?? "Sin descripción todavía."}
              </p>
              <div className="tags">
                <span className="tag">v{featured.latest_version ?? "—"}</span>
                <span className="tag">receta del hogar</span>
              </div>
            </Link>
          ) : null}
          {rest.map((recipe) => (
            <Link className="recipe-card" href={`/recetas/${recipe.id}` as Route} key={recipe.id}>
              <div className="card-title">
                <span className="status pending">
                  {STATE_LABELS[recipe.latest_state ?? "draft"] ?? "borrador"}
                </span>
              </div>
              <h2 className="recipe-name recipe-title-action">{recipe.name}</h2>
              <p className="muted">{recipe.description ?? "Sin descripción todavía."}</p>
              <div className="tags">
                <span className="tag">v{recipe.latest_version ?? "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
