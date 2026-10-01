"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { MemoryCard } from "@/components/memory/MemoryCard";

type DinerProfile = components["schemas"]["DinerMemoryProfile"];
type ApiResult = { detail?: string } | null;

export function DinerCard({
  profile,
  linkedMemberName,
}: {
  profile: DinerProfile;
  linkedMemberName?: string | null;
}) {
  const router = useRouter();
  const id = useId();
  const { diner } = profile;
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(diner.display_name);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    setMessage(null);
    setNameError(null);
    if (name.length < 1 || name.length > 80) {
      const detail = "El nombre debe tener entre 1 y 80 caracteres.";
      setNameError(detail);
      setMessage(detail);
      setIsError(true);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/diners/${diner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name,
          expected_version: diner.version,
        }),
      });
      const result = (await response.json().catch(() => null)) as ApiResult;
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) {
          setEditing(false);
          router.refresh();
        }
        const detail = result?.detail ?? "No se pudo actualizar a la persona.";
        if (response.status === 422) setNameError(detail);
        setMessage(detail);
        setIsError(true);
        return;
      }
      setEditing(false);
      setMessage("Nombre actualizado.");
      setIsError(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo actualizar a la persona.",
      );
      setIsError(true);
    } finally {
      setPending(false);
    }
  }

  async function archive() {
      const confirmed = window.confirm(
      `Al archivar a “${diner.display_name}”, los recuerdos dejarán de usarse para sugerir comidas. ¿Quieres continuar?`,
    );
    if (!confirmed) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/diners/${diner.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as ApiResult;
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) router.refresh();
        setMessage(result?.detail ?? "No se pudo archivar a la persona.");
        setIsError(true);
        return;
      }
      setMessage("Persona archivada.");
      setIsError(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo archivar a la persona.",
      );
      setIsError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <article aria-labelledby={`${id}-title`} className="memory-diner-card card">
      <div className="memory-diner-heading">
        <div>
          <h2 id={`${id}-title`}>{diner.display_name}</h2>
          {diner.member_user_id ? (
            <span className="memory-linked-chip">
              Cuenta vinculada: {linkedMemberName ?? "Miembro del hogar"}
            </span>
          ) : (
            <span className="memory-linked-chip is-unlinked">Sin cuenta vinculada</span>
          )}
        </div>
        <div className="memory-diner-actions">
          <button
            aria-label={
              editing
                ? "Cancelar cambio de nombre"
                : `Cambiar nombre de ${diner.display_name}`
            }
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={() => {
              setEditing((value) => !value);
              setDisplayName(diner.display_name);
              setMessage(null);
              setNameError(null);
            }}
            type="button"
          >
            {editing ? "Cancelar cambio" : "Cambiar nombre"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={() => void archive()}
            type="button"
          >
            Archivar persona
          </button>
        </div>
      </div>

      {editing ? (
        <form className="memory-rename-form form" onSubmit={updateName}>
          <div className="field">
            <label className="field-label" htmlFor={`${id}-name`}>
              Nombre de la persona
            </label>
            <input
              aria-describedby={nameError ? `${id}-name-error` : undefined}
              aria-invalid={nameError ? true : undefined}
              className="input"
              id={`${id}-name`}
              maxLength={80}
              minLength={1}
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            {nameError ? (
              <span className="field-error" id={`${id}-name-error`}>
                {nameError}
              </span>
            ) : null}
          </div>
          <div className="memory-form-actions">
            <button className="btn btn-primary" disabled={pending} type="submit">
              {pending ? "Guardando…" : "Guardar nombre"}
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p
          aria-live={isError ? "assertive" : "polite"}
          className={`form-status${isError ? " error" : " success"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <MemoryCard
        dinerId={diner.id}
        headingLevel={3}
        memories={profile.memories}
        title={`Recuerdos de ${diner.display_name}`}
      />
    </article>
  );
}
