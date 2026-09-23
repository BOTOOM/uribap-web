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

const STATE_TONES: Record<string, string> = {
  draft: "pending",
  published: "available",
  archived: "neutral",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Borradores" },
  { value: "archived", label: "Archivadas" },
];

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
  searchParams: Promise<{ query?: string; estado?: string }>;
}) {
  const { query = "", estado = "" } = await searchParams;
  const data = await loadRecipes(query);
  if ("error" in data) {
    return (
      <ErrorState description={data.error} title="No se pudieron cargar las recetas" />
    );
  }
  const filtered = estado ? data.filter((r) => r.latest_state === estado) : data;
  const [featured, ...rest] = filtered;

  function filterHref(value: string): Route {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (value) params.set("estado", value);
    const qs = params.toString();
    return (qs ? `/recetas?${qs}` : "/recetas") as Route;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recetas del hogar</h1>
          <p>
            Busca por nombre y reutiliza lo que ya funciona: versiones claras,
            ingredientes compatibles y preparación visible.
          </p>
        </div>
        <Link className="btn btn-primary" href={"/recetas/nueva" as Route}>
          <Icon name="plus" size={15} />
          Nueva receta
        </Link>
      </div>

      <form action="/recetas" className="search-wrap" method="get" style={{ marginBottom: 14 }}>
        {estado ? <input name="estado" type="hidden" value={estado} /> : null}
        <Icon name="search" size={16} />
        <input
          aria-label="Buscar recetas"
          className="search"
          defaultValue={query}
          name="query"
          placeholder="Buscar por nombre…"
          type="search"
        />
      </form>

      <div aria-label="Filtrar recetas por estado" className="filters">
        {FILTERS.map((filter) => (
          <Link
            aria-current={estado === filter.value || (!estado && filter.value === "") ? "true" : undefined}
            className={`chip${estado === filter.value || (!estado && filter.value === "") ? " active" : ""}`}
            href={filterHref(filter.value)}
            key={filter.value || "all"}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty" role="status" style={{ marginTop: 16 }}>
          <span className="recipe-glyph">
            <Icon name="search" />
          </span>
          <strong>
            {query || estado
              ? "Ninguna receta coincide con ese filtro."
              : "Todavía no hay recetas para este hogar."}
          </strong>
          <p style={{ margin: "4px auto 0" }}>
            {query || estado
              ? "Prueba con otro término o crea la receta que buscas."
              : "Crea la primera receta para poder planificar comidas de verdad."}
          </p>
          <Link className="btn btn-primary" href={"/recetas/nueva" as Route} style={{ marginTop: 14 }}>
            Crear receta
          </Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {featured ? (
            <Link
              className="recipe-card is-featured"
              href={`/recetas/${featured.id}` as Route}
            >
              <div className="card-title">
                <span className="recipe-glyph">
                  <Icon name="book" size={17} />
                </span>
                <span className={`status ${STATE_TONES[featured.latest_state ?? "draft"] ?? "pending"}`}>
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
                <span className="recipe-glyph">
                  <Icon name="book" size={17} />
                </span>
                <span className={`status ${STATE_TONES[recipe.latest_state ?? "draft"] ?? "pending"}`}>
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
