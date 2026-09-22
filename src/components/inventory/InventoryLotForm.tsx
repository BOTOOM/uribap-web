"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { toast } from "@/lib/toast";

type Location = components["schemas"]["InventoryLocation"];

const LOCATION_LABELS: Record<Location, string> = {
  pantry: "Despensa",
  refrigerator: "Refrigerador",
  freezer: "Congelador",
};

export type IngredientOption = { id: string; name: string; base_unit: string };

export function InventoryLotForm({ ingredients }: { ingredients: IngredientOption[] }) {
  const router = useRouter();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState<Location>("pantry");
  const [expiration, setExpiration] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = ingredients.find((item) => item.id === ingredientId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const payload: components["schemas"]["InventoryLotCreate"] = {
      ingredient_id: ingredientId,
      quantity,
      unit: selected?.base_unit ?? "unit",
      location,
      expiration_date: expiration || null,
    };
    try {
      const response = await fetch("/api/inventory/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear el lote.");
      toast("Lote registrado en el inventario");
      setQuantity("");
      setExpiration("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el lote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="lot-ingredient">
          Ingrediente
        </label>
        <select
          className="select"
          id="lot-ingredient"
          required
          value={ingredientId}
          onChange={(event) => setIngredientId(event.target.value)}
        >
          {ingredients.length === 0 ? <option value="">Sin ingredientes</option> : null}
          {ingredients.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.id}>
              {ingredient.name} ({ingredient.base_unit})
            </option>
          ))}
        </select>
        {ingredients.length === 0 ? (
          <span className="helper">Crea ingredientes primero para registrar lotes.</span>
        ) : null}
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="lot-quantity">
            Cantidad{selected ? ` (${selected.base_unit})` : ""}
          </label>
          <input
            className="input"
            id="lot-quantity"
            inputMode="decimal"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="lot-location">
            Ubicación
          </label>
          <select
            className="select"
            id="lot-location"
            value={location}
            onChange={(event) => setLocation(event.target.value as Location)}
          >
            {Object.entries(LOCATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="lot-expiration">
          Caducidad <span className="helper">(opcional)</span>
        </label>
        <input
          className="input"
          id="lot-expiration"
          type="date"
          value={expiration}
          onChange={(event) => setExpiration(event.target.value)}
        />
      </div>
      <div>
        <button
          className="btn btn-primary"
          disabled={pending || ingredients.length === 0}
          type="submit"
        >
          {pending ? "Guardando…" : "Añadir lote"}
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
