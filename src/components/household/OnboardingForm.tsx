"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [locale, setLocale] = useState("es");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, locale, timezone }),
      });
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(problem?.detail ?? "No se pudo crear el hogar.");
      }
      router.push("/plan");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No se pudo crear el hogar.");
    } finally {
      setPending(false);
    }
  }

  if (pending) return <LoadingState label="Creando tu hogar…" />;
  return (
    <div>
      <form className="foundation-actions" onSubmit={submit}>
        <label>
          Nombre del hogar
          <input required minLength={1} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Idioma
          <select value={locale} onChange={(event) => setLocale(event.target.value)}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          Zona horaria
          <input required value={timezone} onChange={(event) => setTimezone(event.target.value)} />
        </label>
        <button className="status status-ready" type="submit">Crear hogar</button>
      </form>
      {error ? <ErrorState title="No se pudo crear el hogar" description={error} /> : null}
    </div>
  );
}
