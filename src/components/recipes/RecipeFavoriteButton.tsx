"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { toast } from "@/lib/toast";

export function RecipeFavoriteButton({ recipeId }: { recipeId: string }) {
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
      method: favorite ? "DELETE" : "POST",
    });
    if (!response.ok) {
      setMessage("No se pudo actualizar el favorito.");
      return;
    }
    setFavorite((value) => !value);
    toast(favorite ? "Favorito quitado" : "Receta guardada en favoritos");
    setMessage(favorite ? "Favorito quitado." : "Receta guardada en favoritos.");
  }

  return (
    <span>
      <button
        aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        aria-pressed={favorite}
        className={`favorite${favorite ? " active" : ""}`}
        onClick={() => void toggle()}
        type="button"
      >
        <Icon name="heart" size={19} />
      </button>
      {message ? (
        <span className="sr-only" role="status">
          {message}
        </span>
      ) : null}
    </span>
  );
}
