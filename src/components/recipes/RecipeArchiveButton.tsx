"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/lib/toast";

const ARCHIVE_EXPLANATION =
  "Se oculta de recetas y del planificador. Las comidas ya planificadas o cocinadas conservan su historial. Puedes restaurarla cuando quieras.";

export function RecipeArchiveButton({
  recipeId,
  archived,
}: {
  recipeId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function mutate(action: "archive" | "unarchive") {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/${action}`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as
        | { detail?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.detail ?? "No se pudo actualizar el estado de la receta.");
      }
      toast(action === "archive" ? "Receta archivada" : "Receta restaurada");
      router.refresh();
      setOpen(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado de la receta.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          if (archived) void mutate("unarchive");
          else setOpen(true);
        }}
        type="button"
      >
        {pending ? "Guardando…" : archived ? "Restaurar" : "Archivar"}
      </button>
      {message && archived ? (
        <p className="form-status error" role="alert">
          {message}
        </p>
      ) : null}
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent aria-describedby="recipe-archive-description">
          <div className="dialog-head">
            <DialogTitle>Archivar receta</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <div className="dialog-body">
            <DialogDescription className="muted" id="recipe-archive-description">
              {ARCHIVE_EXPLANATION}
            </DialogDescription>
            {message && !archived ? (
              <p className="form-status error" role="alert">
                {message}
              </p>
            ) : null}
            <div className="dialog-foot">
              <button
                className="btn btn-ghost"
                disabled={pending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={pending}
                onClick={() => void mutate("archive")}
                type="button"
              >
                {pending ? "Archivando…" : "Sí, archivar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
