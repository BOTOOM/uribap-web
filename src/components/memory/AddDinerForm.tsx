"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type Member = components["schemas"]["MemberResponse"];
type ApiResult = { detail?: string } | null;

export function AddDinerForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const id = useId();
  const [displayName, setDisplayName] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      const response = await fetch("/api/diners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          display_name: name,
          member_user_id: memberUserId || null,
        }),
      });
      const result = (await response.json().catch(() => null)) as ApiResult;
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) router.refresh();
        const detail = result?.detail ?? "No se pudo agregar a la persona.";
        if (response.status === 422) setNameError(detail);
        setMessage(detail);
        setIsError(true);
        return;
      }
      setDisplayName("");
      setMemberUserId("");
      setMessage("Persona agregada.");
      setIsError(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo agregar a la persona.",
      );
      setIsError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="memory-add-diner card">
      <h2 id={`${id}-title`}>Agregar persona</h2>
      <form aria-label="Agregar persona" className="form" onSubmit={submit}>
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
        <div className="field">
          <label className="field-label" htmlFor={`${id}-member`}>
            Cuenta del hogar (opcional)
          </label>
          <select
            className="select"
            id={`${id}-member`}
            value={memberUserId}
            onChange={(event) => setMemberUserId(event.target.value)}
          >
            <option value="">Sin vincular una cuenta</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name || member.email || "Miembro del hogar"}
              </option>
            ))}
          </select>
        </div>
        <div className="memory-form-actions">
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Agregando…" : "Agregar persona"}
          </button>
        </div>
        {message ? (
          <p
            aria-live={isError ? "assertive" : "polite"}
            className={`form-status${isError ? " error" : " success"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
