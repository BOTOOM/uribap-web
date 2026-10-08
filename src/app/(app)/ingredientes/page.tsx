import { IngredientCreateDialog } from "@/components/ingredients/IngredientCreateDialog";
import { IngredientTable } from "@/components/ingredients/IngredientTable";
import { ErrorState } from "@/components/states/ErrorState";
import { listAllIngredients } from "@/lib/api/list-all-ingredients";
import type { components } from "@/lib/api/generated/schema";

type Ingredient = components["schemas"]["IngredientResponse"];

async function loadIngredients(): Promise<Ingredient[] | { error: string }> {
  try {
    return await listAllIngredients();
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
          <IngredientTable ingredients={data} />
        )}
      </article>
    </>
  );
}
