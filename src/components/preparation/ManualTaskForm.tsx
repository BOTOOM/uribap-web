"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { toast } from "@/lib/toast";

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
      toast("Tarea de preparación creada");
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
    <form aria-label="Crear tarea manual" className="form" onSubmit={submit}>
      <div className="form-row">
        <div className="field" style={{ flex: 2 }}>
          <label className="field-label" htmlFor="manual-title">
            Título
          </label>
          <input
            className="input"
            id="manual-title"
            maxLength={200}
            minLength={1}
            placeholder="Poner las legumbres en remojo"
            required
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="manual-due">
            Vence
          </label>
          <input
            className="input"
            id="manual-due"
            required
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="manual-instruction">
          Instrucción <span className="helper">(opcional)</span>
        </label>
        <input
          className="input"
          id="manual-instruction"
          maxLength={2000}
          type="text"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="field" style={{ flex: 2 }}>
          <label className="field-label" htmlFor="manual-ingredient">
            Ingrediente <span className="helper">(opcional)</span>
          </label>
          <select
            className="select"
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
        </div>
        <div className="field">
          <label className="field-label" htmlFor="manual-amount">
            Cantidad <span className="helper">(opcional)</span>
          </label>
          <input
            className="input"
            id="manual-amount"
            min="0.000001"
            step="any"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="field" style={{ maxWidth: 110 }}>
          <label className="field-label" htmlFor="manual-unit">
            Unidad <span className="helper">(opcional)</span>
          </label>
          <input
            className="input"
            id="manual-unit"
            maxLength={8}
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </div>
      </div>
      <div>
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Creando…" : "Crear tarea"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
