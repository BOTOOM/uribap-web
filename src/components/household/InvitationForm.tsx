"use client";

import { useState } from "react";

export function InvitationForm({ householdId }: { householdId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/households/${householdId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const result = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;
      if (!response.ok) throw new Error(result?.detail ?? "No se pudo crear la invitación.");
      setEmail("");
      setMessage("Invitación creada. Revisa Mailpit para ver el mensaje local.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo crear la invitación.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form aria-label="Invitar a una persona al hogar" className="form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="invite-email">
          Email
        </label>
        <input
          className="input"
          id="invite-email"
          placeholder="persona@ejemplo.local"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <span className="helper">
          En local el correo se captura en Mailpit; nada sale al exterior.
        </span>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="invite-role">
          Rol
        </label>
        <select
          className="select"
          id="invite-role"
          value={role}
          onChange={(event) => setRole(event.target.value as "member" | "admin")}
        >
          <option value="member">Persona miembro</option>
          <option value="admin">Administración</option>
        </select>
      </div>
      <div>
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Enviando…" : "Crear invitación"}
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
