"use client";

import { useState } from "react";

import type { components } from "@/lib/api/generated/schema";

type InvitationCreatePayload = Pick<
  components["schemas"]["InvitationCreate"],
  "email" | "role" | "display_name"
>;
type InvitationDelivery = components["schemas"]["InvitationCreatedResponse"]["delivery"];

const DELIVERY_MESSAGES: Record<InvitationDelivery, (email: string) => string> = {
  zitadel_invite: (email) =>
    `Invitación creada. ${email} recibirá un correo para crear su acceso y verá la invitación al entrar a Uribap.`,
  existing_account:
    () =>
      "Invitación creada. Esta persona ya tiene cuenta: verá la invitación al entrar a Uribap.",
  email: () => "Invitación enviada por correo.",
  failed: () =>
    "La invitación quedó creada, pero no se pudo enviar el correo. Pídele que entre a Uribap con este email para aceptarla.",
};

export function InvitationForm({ householdId }: { householdId: string }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<components["schemas"]["InvitationCreate"]["role"]>("member");
  const [message, setMessage] = useState<string | null>(null);
  const [messageRole, setMessageRole] = useState<"status" | "alert">("status");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setMessageRole("status");
    const trimmedDisplayName = displayName.trim();
    const payload: InvitationCreatePayload = {
      email,
      role,
      ...(trimmedDisplayName ? { display_name: trimmedDisplayName } : {}),
    };
    try {
      const response = await fetch(`/api/households/${householdId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as
        | (Partial<components["schemas"]["InvitationCreatedResponse"]> & { detail?: string })
        | null;
      if (!response.ok) throw new Error(result?.detail ?? "No se pudo crear la invitación.");
      if (!result?.delivery) throw new Error("No se pudo crear la invitación.");
      setEmail("");
      setDisplayName("");
      setMessage(DELIVERY_MESSAGES[result.delivery](email));
    } catch (error) {
      setMessageRole("alert");
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
          Si la persona no tiene cuenta, recibirá un correo para crear su acceso.
        </span>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="invite-name">
          Nombre (opcional)
        </label>
        <input
          className="input"
          id="invite-name"
          maxLength={200}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="invite-role">
          Rol
        </label>
        <select
          className="select"
          id="invite-role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as components["schemas"]["InvitationCreate"]["role"])
          }
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
        <p className="form-status" role={messageRole}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
