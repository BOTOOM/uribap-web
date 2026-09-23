"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { toast } from "@/lib/toast";

export function RecipeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("2");
  const [prepMinutes, setPrepMinutes] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          base_servings: Number(servings),
          prep_minutes: Number(prepMinutes),
        }),
      });
      const recipe = (await response.json().catch(() => null)) as {
        id?: string;
        detail?: string;
      } | null;
      if (!response.ok || !recipe?.id) {
        throw new Error(recipe?.detail ?? "No se pudo crear la receta.");
      }
      toast("Receta creada en borrador");
      router.push(`/recetas/${recipe.id}` as Route);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la receta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="recipe-name">
          Nombre
        </label>
        <input
          className="input"
          id="recipe-name"
          placeholder="Garbanzos con espinacas"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="recipe-description">
          Descripción
        </label>
        <textarea
          className="input textarea"
          id="recipe-description"
          placeholder="De cuchara, 35 minutos, rinde bien para tuppers…"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="recipe-servings">
            Raciones base
          </label>
          <input
            className="input"
            id="recipe-servings"
            min="1"
            type="number"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="recipe-prep">
            Minutos de preparación
          </label>
          <input
            className="input"
            id="recipe-prep"
            min="0"
            type="number"
            value={prepMinutes}
            onChange={(event) => setPrepMinutes(event.target.value)}
          />
        </div>
      </div>
      <div>
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Creando…" : "Crear borrador"}
        </button>
      </div>
      {message ? (
        <p className="form-status error" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
