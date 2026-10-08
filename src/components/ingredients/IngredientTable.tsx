import { IngredientEditDialog } from "@/components/ingredients/IngredientEditDialog";
import type { components } from "@/lib/api/generated/schema";

type Ingredient = components["schemas"]["IngredientResponse"];
type IngredientDimension = components["schemas"]["IngredientDimension"];

const DIMENSION_LABELS: Record<IngredientDimension, string> = {
  mass: "peso",
  volume: "volumen",
  count: "unidades",
};

export function IngredientTable({ ingredients }: { ingredients: Ingredient[] }) {
  return (
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
        {ingredients.map((ingredient) => (
          <tr key={ingredient.id}>
            <td>
              <div className="ingredient-first-cell">
                <span className="ingredient-name">
                  {ingredient.name}
                  {ingredient.pantry_staple ? (
                    <span className="ingredient-staple-badge">Básico</span>
                  ) : null}
                </span>
                {ingredient.household_id !== null ? (
                  <IngredientEditDialog ingredient={ingredient} />
                ) : null}
              </div>
            </td>
            <td>{ingredient.base_unit}</td>
            <td>{DIMENSION_LABELS[ingredient.dimension] ?? ingredient.dimension}</td>
            <td className="muted">{ingredient.category ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
