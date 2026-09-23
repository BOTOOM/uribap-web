import { IngredientCreateDialog } from "@/components/ingredients/IngredientCreateDialog";
import { ErrorState } from "@/components/states/ErrorState";
import { serverHouseholdFetch } from "@/lib/api/server-client";

type Ingredient = {
  id: string;
  name: string;
  category: string | null;
  dimension: string;
  base_unit: string;
};

const DIMENSION_LABELS: Record<string, string> = {
  mass: "peso",
  volume: "volumen",
  count: "unidades",
};

async function loadIngredients(): Promise<Ingredient[] | { error: string }> {
  try {
    const data = await serverHouseholdFetch<{ items: Ingredient[] }>("/ingredients");
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function IngredientsPage() {
  const data = await loadIngredients();
  if ("error" in data) {
    return (
      <ErrorState
        description={data.error}
        title="No se pudieron cargar los ingredientes"
      />
    );
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ingredientes</h1>
          <p>
            Una despensa con nombres claros: cada ingrediente conserva su dimensión y unidad
            base para que las recetas no hagan suposiciones.
          </p>
        </div>
        <IngredientCreateDialog />
      </div>
      <article className="card card-flush">
        <div className="card-title">
          <h2>Catálogo disponible</h2>
          <span className="meta">{data.length} ingredientes</span>
        </div>
        {data.length === 0 ? (
          <div className="empty">
            <strong>Todavía no hay ingredientes en este hogar.</strong>
            <p>Crea el primero con el botón de arriba y úsalo en tus recetas.</p>
          </div>
        ) : (
          <table className="ingredient-table">
            <thead>
              <tr>
                <th scope="col">Ingrediente</th>
                <th scope="col">Unidad base</th>
                <th scope="col">Dimensión</th>
                <th scope="col">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ingredient) => (
                <tr key={ingredient.id}>
                  <td>{ingredient.name}</td>
                  <td>{ingredient.base_unit}</td>
                  <td>{DIMENSION_LABELS[ingredient.dimension] ?? ingredient.dimension}</td>
                  <td className="muted">{ingredient.category ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </>
  );
}
