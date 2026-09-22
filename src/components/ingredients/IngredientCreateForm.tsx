"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { toast } from "@/lib/toast";

type Dimension = components["schemas"]["IngredientDimension"];

const DIMENSION_LABELS: Record<Dimension, string> = {
  count: "Unidades",
  mass: "Peso",
  volume: "Volumen",
};

const UNITS_BY_DIMENSION: Record<Dimension, string[]> = {
  count: ["unit"],
  mass: ["g", "kg"],
  volume: ["ml", "l"],
};

export function IngredientCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [dimension, setDimension] = useState<Dimension>("mass");
  const [baseUnit, setBaseUnit] = useState("g");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const payload: components["schemas"]["IngredientCreate"] = {
      name: name.trim(),
      category: category.trim() || null,
      dimension,
      base_unit: baseUnit,
    };
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear el ingrediente.");
      toast("Ingrediente añadido a la despensa");
      setName("");
      setCategory("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el ingrediente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="ing-name">
            Nombre
          </label>
          <input
            className="input"
            id="ing-name"
            maxLength={160}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ing-category">
            Categoría <span className="helper">(opcional)</span>
          </label>
          <input
            className="input"
            id="ing-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="ing-dimension">
            Dimensión
          </label>
          <select
            className="select"
            id="ing-dimension"
            value={dimension}
            onChange={(event) => {
              const next = event.target.value as Dimension;
              setDimension(next);
              setBaseUnit(UNITS_BY_DIMENSION[next][0]);
            }}
          >
            {Object.entries(DIMENSION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ing-unit">
            Unidad base
          </label>
          <select
            className="select"
            id="ing-unit"
            value={baseUnit}
            onChange={(event) => setBaseUnit(event.target.value)}
          >
            {UNITS_BY_DIMENSION[dimension].map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : "Añadir ingrediente"}
        </button>
      </div>
      {message ? (
        <p className="form-status" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
