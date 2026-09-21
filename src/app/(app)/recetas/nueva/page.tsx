import Link from "next/link";

import { RecipeForm } from "@/components/recipes/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="new-recipe-title">
        <p className="eyebrow">Uribap · receta nueva</p>
        <h1 id="new-recipe-title">Crea un borrador reproducible.</h1>
        <p className="lede">La versión queda en borrador hasta que sus ingredientes e instrucciones estén listos.</p>
        <RecipeForm />
        <Link className="status status-ready" href="/recetas">Cancelar</Link>
      </section>
    </div>
  );
}
