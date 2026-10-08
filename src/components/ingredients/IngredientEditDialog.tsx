"use client";

import { useState } from "react";

import { IngredientForm } from "@/components/ingredients/IngredientForm";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";

type Ingredient = Pick<
  components["schemas"]["IngredientResponse"],
  "id" | "name" | "category" | "pantry_staple"
>;

export function IngredientEditDialog({ ingredient }: { ingredient: Ingredient }) {
  const [open, setOpen] = useState(false);
  const descriptionId = `ingredient-edit-description-${ingredient.id}`;

  return (
    <>
      <button
        aria-label={`Editar ${ingredient.name}`}
        className="btn btn-ghost ingredient-edit-button"
        onClick={() => setOpen(true)}
        type="button"
      >
        Editar
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent aria-describedby={descriptionId}>
          <div className="dialog-head">
            <DialogTitle>Editar ingrediente</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id={descriptionId}>
              Actualiza el nombre, la categoría o si es un básico de despensa.
            </DialogDescription>
            <IngredientForm
              ingredient={ingredient}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
