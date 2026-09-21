import { ErrorState } from "@/components/states/ErrorState";
import { serverHouseholdFetch } from "@/lib/api/server-client";

type Ingredient = { id: string; name: string; category: string | null; dimension: string; base_unit: string };

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
  if ("error" in data) return <ErrorState title="No se pudieron cargar los ingredientes" description={data.error} />;
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="ingredients-title">
        <p className="eyebrow">Uribap · ingredientes</p>
        <h1 id="ingredients-title">Una despensa con nombres claros.</h1>
        <p className="lede">Cada ingrediente conserva su dimensión y unidad base para que las recetas no hagan suposiciones.</p>
      </section>
      <section className="foundation-list" aria-labelledby="ingredient-list-title">
        <h2 id="ingredient-list-title">Catálogo disponible</h2>
        {data.length === 0 ? <p role="status">Todavía no hay ingredientes en este hogar.</p> : (
          <ul>
            {data.map((ingredient) => (
              <li key={ingredient.id}>
                <span className="item-index">{ingredient.base_unit}</span>
                <span>{ingredient.name}</span>
                <span>{ingredient.dimension}{ingredient.category ? ` · ${ingredient.category}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
