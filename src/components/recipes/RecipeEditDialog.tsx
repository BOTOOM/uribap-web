"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";
import { toast } from "@/lib/toast";

type RecipeState = "draft" | "published";

export function RecipeEditDialog({
  recipeId,
  name,
  description,
  baseServings,
  prepMinutes,
  latestState,
}: {
  recipeId: string;
  name: string;
  description: string | null;
  baseServings: number;
  prepMinutes: number;
  latestState: RecipeState;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedDescription, setEditedDescription] = useState(description ?? "");
  const [servings, setServings] = useState(String(baseServings));
  const [minutes, setMinutes] = useState(String(prepMinutes));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = editedName.trim();
    const nextServings = Number(servings);
    const nextMinutes = Number(minutes);
    if (!nextName) {
      setMessage("El nombre de la receta es obligatorio.");
      return;
    }
    if (!Number.isInteger(nextServings) || nextServings < 1) {
      setMessage("Las raciones base deben ser un número entero mayor que cero.");
      return;
    }
    if (!Number.isInteger(nextMinutes) || nextMinutes < 0) {
      setMessage("Los minutos de preparación deben ser un entero igual o mayor que cero.");
      return;
    }

    const nextDescription = editedDescription.trim() || null;
    const currentDescription = description?.trim() || null;
    const metadata: components["schemas"]["RecipeUpdate"] = {};
    if (nextName !== name) metadata.name = nextName;
    if (nextDescription !== currentDescription) metadata.description = nextDescription;
    const revisionChanged =
      nextServings !== baseServings || nextMinutes !== prepMinutes;

    setPending(true);
    setMessage(null);
    let metadataSaved = false;
    try {
      if (Object.keys(metadata).length > 0) {
        await submitRequest(`/api/recipes/${recipeId}`, "PATCH", metadata);
        metadataSaved = true;
      }
      if (revisionChanged) {
        const revision: components["schemas"]["RecipeRevision"] = {
          base_servings: nextServings,
          prep_minutes: nextMinutes,
          publish: latestState === "published",
        };
        await submitRequest(`/api/recipes/${recipeId}/revisions`, "POST", revision);
      }
      if (Object.keys(metadata).length === 0 && !revisionChanged) {
        setOpen(false);
        return;
      }
      toast("Receta actualizada");
      router.refresh();
      setOpen(false);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "No se pudo actualizar la receta.";
      if (metadataSaved) {
        router.refresh();
        setMessage(
          `Se guardaron el nombre y la descripción, pero no se pudo crear la nueva versión: ${detail}`,
        );
      } else {
        setMessage(detail);
      }
    } finally {
      setPending(false);
    }
  }

  function openDialog() {
    setEditedName(name);
    setEditedDescription(description ?? "");
    setServings(String(baseServings));
    setMinutes(String(prepMinutes));
    setMessage(null);
    setOpen(true);
  }

  async function submitRequest(
    url: string,
    method: "PATCH" | "POST",
    payload: components["schemas"]["RecipeUpdate"] | components["schemas"]["RecipeRevision"],
  ) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    if (!response.ok) {
      throw new Error(body?.detail ?? "No se pudo guardar la receta.");
    }
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={openDialog} type="button">
        Editar
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <div className="dialog-head">
            <DialogTitle>Editar receta</DialogTitle>
            <DialogClose aria-label="Cerrar" className="icon-btn">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
          <form onSubmit={submit}>
            <div className="dialog-body">
              <DialogDescription className="muted">
                Actualiza los datos de la receta y conserva su historial.
              </DialogDescription>
              <div className="form">
                <div className="field">
                  <label className="field-label" htmlFor="recipe-edit-name">
                    Nombre
                  </label>
                  <input
                    autoFocus
                    className="input"
                    id="recipe-edit-name"
                    maxLength={200}
                    required
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="recipe-edit-description">
                    Descripción
                  </label>
                  <textarea
                    className="input textarea"
                    id="recipe-edit-description"
                    value={editedDescription}
                    onChange={(event) => setEditedDescription(event.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="field">
                    <label className="field-label" htmlFor="recipe-edit-servings">
                      Raciones base
                    </label>
                    <input
                      className="input"
                      id="recipe-edit-servings"
                      min="1"
                      required
                      type="number"
                      value={servings}
                      onChange={(event) => setServings(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="recipe-edit-prep">
                      Minutos de preparación
                    </label>
                    <input
                      className="input"
                      id="recipe-edit-prep"
                      min="0"
                      required
                      type="number"
                      value={minutes}
                      onChange={(event) => setMinutes(event.target.value)}
                    />
                  </div>
                </div>
                {latestState === "published" ? (
                  <p className="inline-note">
                    Cambiar raciones o tiempo publica una nueva versión con los mismos ingredientes y conserva el historial.
                  </p>
                ) : null}
                {message ? (
                  <p className="form-status error" role="alert">
                    {message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="dialog-foot">
              <button
                className="btn btn-ghost"
                disabled={pending}
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={pending} type="submit">
                {pending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
