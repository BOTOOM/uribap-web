"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type Ingredient = { id: string; name: string; base_unit: string };

export function ManualTaskForm({ ingredients }: { ingredients: Ingredient[] }) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const parsedAmount = amount.trim() ? Number(amount.trim()) : null;
      const payload: components["schemas"]["PreparationTaskCreate"] = {
        title: title.trim(),
        due_at: new Date(dueAt).toISOString(),
        instruction: instruction.trim() ? instruction.trim() : null,
        ingredient_id: ingredientId || null,
        amount: parsedAmount,
        unit: unit.trim() ? unit.trim() : null,
      };
      const response = await fetch("/api/preparation-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear la tarea.");
      setIdempotencyKey(crypto.randomUUID());
      setTitle("");
      setDueAt("");
      setInstruction("");
      setIngredientId("");
      setAmount("");
      setUnit("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la tarea.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form aria-label="Crear tarea manual" onSubmit={submit}>
      <label htmlFor="manual-title">Título</label>
      <input
        id="manual-title"
        type="text"
        required
        minLength={1}
        maxLength={200}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <label htmlFor="manual-due">Vence</label>
      <input
        id="manual-due"
        type="datetime-local"
        required
        value={dueAt}
        onChange={(event) => setDueAt(event.target.value)}
      />
      <label htmlFor="manual-instruction">Instrucción (opcional)</label>
      <input
        id="manual-instruction"
        type="text"
        maxLength={2000}
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
      />
      <label htmlFor="manual-ingredient">Ingrediente (opcional)</label>
      <select
        id="manual-ingredient"
        value={ingredientId}
        onChange={(event) => setIngredientId(event.target.value)}
      >
        <option value="">Ninguno</option>
        {ingredients.map((ingredient) => (
          <option key={ingredient.id} value={ingredient.id}>
            {ingredient.name} ({ingredient.base_unit})
          </option>
        ))}
      </select>
      <label htmlFor="manual-amount">Cantidad (opcional)</label>
      <input
        id="manual-amount"
        type="number"
        min="0.000001"
        step="any"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <label htmlFor="manual-unit">Unidad (opcional)</label>
      <input
        id="manual-unit"
        type="text"
        maxLength={8}
        value={unit}
        onChange={(event) => setUnit(event.target.value)}
      />
      <button type="submit" className="status status-ready" disabled={pending}>
        {pending ? "Creando…" : "Crear tarea"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
