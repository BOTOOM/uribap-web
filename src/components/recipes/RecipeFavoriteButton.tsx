"use client";

import { useState } from "react";

export function RecipeFavoriteButton({ recipeId }: { recipeId: string }) {
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    const response = await fetch(`/api/recipes/${recipeId}/favorite`, { method: favorite ? "DELETE" : "POST" });
    if (!response.ok) {
      setMessage("No se pudo actualizar el favorito.");
      return;
    }
    setFavorite((value) => !value);
    setMessage(favorite ? "Favorito quitado." : "Receta guardada en favoritos.");
  }

  return (
    <span>
      <button className="status status-ready" type="button" onClick={() => void toggle()}>
        {favorite ? "Quitar favorito" : "Guardar favorito"}
      </button>
      {message ? <span role="status">{message}</span> : null}
    </span>
  );
}
