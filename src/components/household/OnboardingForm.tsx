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
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label className="field-label" htmlFor="onboarding-name">
            Nombre del hogar
          </label>
          <input
            className="input"
            id="onboarding-name"
            maxLength={120}
            minLength={1}
            placeholder="Casa de los García"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="onboarding-locale">
              Idioma
            </label>
            <select
              className="select"
              id="onboarding-locale"
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="onboarding-timezone">
              Zona horaria
            </label>
            <input
              className="input"
              id="onboarding-timezone"
              placeholder="Europe/Madrid"
              required
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </div>
        </div>
        <div>
          <button className="btn btn-primary" type="submit">
            Crear hogar
          </button>
        </div>
      </form>
      {error ? <ErrorState description={error} title="No se pudo crear el hogar" /> : null}
    </div>
  );
}
