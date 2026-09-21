"use client";

import { useState } from "react";

export function InventoryLotForm() {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unit");
  const [location, setLocation] = useState("pantry");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/inventory/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_id: ingredientId, quantity, unit, location }),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear el lote.");
      setMessage("Lote registrado en el inventario.");
      setQuantity("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el lote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="foundation-actions" onSubmit={submit}>
      <label>ID del ingrediente<input required value={ingredientId} onChange={(event) => setIngredientId(event.target.value)} /></label>
      <label>Cantidad<input required inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      <label>Unidad<input required value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
      <label>Ubicación<select value={location} onChange={(event) => setLocation(event.target.value)}><option value="pantry">Despensa</option><option value="refrigerator">Refrigerador</option><option value="freezer">Congelador</option></select></label>
      <button className="status status-ready" disabled={pending} type="submit">{pending ? "Guardando…" : "Añadir lote"}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
