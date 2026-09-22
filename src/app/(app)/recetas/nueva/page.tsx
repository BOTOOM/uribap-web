import Link from "next/link";

import { RecipeForm } from "@/components/recipes/RecipeForm";

export default function NewRecipePage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Nueva receta</h1>
          <p>
            Crea un borrador reproducible: la versión queda en borrador hasta que sus
            ingredientes e instrucciones estén listos.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/recetas">
          Volver
        </Link>
      </div>
      <article className="card" style={{ maxWidth: 560 }}>
        <RecipeForm />
      </article>
    </>
  );
}
