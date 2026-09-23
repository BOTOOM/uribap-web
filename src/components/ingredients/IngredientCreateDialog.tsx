"use client";

import { useState } from "react";

import { IngredientCreateForm } from "@/components/ingredients/IngredientCreateForm";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";

export function IngredientCreateDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)} type="button">
        <Icon name="plus" size={15} />
        Nuevo ingrediente
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent aria-describedby="ingredient-dialog-desc">
          <div className="dialog-head">
            <DialogTitle>Nuevo ingrediente</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="ingredient-dialog-desc">
              Define nombre, dimensión y unidad base: las recetas y el inventario las
              usarán sin conversiones ambiguas.
            </DialogDescription>
            <IngredientCreateForm onSuccess={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
