"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";

type PendingInvitation = components["schemas"]["PendingInvitationResponse"];

const ROLE_LABELS: Record<PendingInvitation["requested_role"], string> = {
  admin: "administración",
  member: "miembro",
};

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value));
}

export function PendingInvitations({ items }: { items: PendingInvitation[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(invitationId: string) {
    setPendingId(invitationId);
    setError(null);
    try {
      const response = await fetch(
        `/api/me/invitations/${encodeURIComponent(invitationId)}/accept`,
        { method: "POST" },
      );
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        throw new Error(problem?.detail ?? "No se pudo aceptar la invitación.");
      }
      router.push("/plan");
      router.refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "No se pudo aceptar la invitación.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="pending-invitations-title" className="form">
      <h2 id="pending-invitations-title">Invitaciones pendientes</h2>
      {items.map((invitation) => (
        <article className="settings-row" key={invitation.id}>
          <div style={{ minWidth: 0 }}>
            <h3 className="meal-name">Te invitaron a {invitation.household_name}</h3>
            <p className="meta">
              Rol: {ROLE_LABELS[invitation.requested_role]}
            </p>
            <p className="meta">Expira el {formatExpiry(invitation.expires_at)}</p>
          </div>
          <button
            className="btn btn-primary"
            disabled={pendingId !== null}
            onClick={() => void accept(invitation.id)}
            type="button"
          >
            {pendingId === invitation.id ? "Aceptando…" : "Aceptar invitación"}
          </button>
        </article>
      ))}
      {pendingId ? (
        <p className="form-status" role="status">
          Aceptando invitación…
        </p>
      ) : null}
      {error ? (
        <p className="form-status" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
