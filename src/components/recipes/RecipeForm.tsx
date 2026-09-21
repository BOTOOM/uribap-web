"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

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
        body: JSON.stringify({ name, description, base_servings: Number(servings), prep_minutes: Number(prepMinutes) }),
      });
      const recipe = (await response.json().catch(() => null)) as { id?: string; detail?: string } | null;
      if (!response.ok || !recipe?.id) throw new Error(recipe?.detail ?? "No se pudo crear la receta.");
      router.push(`/recetas/${recipe.id}` as Route);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la receta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="foundation-actions" onSubmit={submit}>
      <label>Nombre<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label>Raciones base<input type="number" min="1" value={servings} onChange={(event) => setServings(event.target.value)} /></label>
      <label>Minutos de preparación<input type="number" min="0" value={prepMinutes} onChange={(event) => setPrepMinutes(event.target.value)} /></label>
      <button className="status status-ready" disabled={pending} type="submit">{pending ? "Creando…" : "Crear borrador"}</button>
      {message ? <p role="alert">{message}</p> : null}
    </form>
  );
}
