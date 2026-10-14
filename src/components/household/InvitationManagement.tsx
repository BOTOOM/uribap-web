"use client";

import { useEffect, useState } from "react";

import type { components } from "@/lib/api/generated/schema";
import { formatInvitationExpiry } from "@/lib/format-invitation-expiry";

type Invitation = components["schemas"]["InvitationResponse"];

const ROLE_LABELS: Record<Invitation["requested_role"], string> = {
  admin: "administración",
  member: "miembro",
};

const STATUS_LABELS: Record<Invitation["effective_status"], string> = {
  pending: "pendiente",
  expired: "vencida",
  accepted: "aceptada",
  revoked: "revocada",
};

const STATUS_CLASSES: Record<Invitation["effective_status"], string> = {
  pending: "pending",
  expired: "expiring",
  accepted: "completed",
  revoked: "neutral",
};

const DELIVERY_LABELS: Record<NonNullable<Invitation["delivery"]>, string> = {
  sent: "enviada",
  failed: "fallida",
  existing_account: "cuenta existente",
  pending: "pendiente",
  zitadel_invite: "enviada",
  email: "enviada",
};

function deliveryLabel(delivery: Invitation["delivery"]): string {
  return delivery ? DELIVERY_LABELS[delivery] : "sin enviar";
}

function canResend(invitation: Invitation): boolean {
  return invitation.effective_status === "expired" || invitation.delivery === "failed";
}

function canRevoke(invitation: Invitation): boolean {
  return invitation.effective_status === "pending";
}

function resendLabel(invitation: Invitation): string {
  return invitation.delivery === "existing_account" ? "Reenviar en la app" : "Reenviar";
}

export function InvitationManagement({
  householdId,
  initialInvitations,
}: {
  householdId: string;
  initialInvitations: Invitation[] | null;
}) {
  const [invitations, setInvitations] = useState<Invitation[] | null>(initialInvitations);
  const [hydrated, setHydrated] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageRole, setMessageRole] = useState<"status" | "alert">("status");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function refresh() {
    const response = await fetch(`/api/households/${householdId}/invitations`);
    const result = (await response.json().catch(() => null)) as {
      items?: Invitation[];
      detail?: string;
    } | null;
    if (!response.ok) {
      throw new Error(result?.detail ?? "No se pudieron cargar las invitaciones.");
    }
    setInvitations(result?.items ?? []);
  }

  async function resend(invitation: Invitation) {
    setPendingId(invitation.id);
    setMessage(null);
    setMessageRole("status");
    try {
      const response = await fetch(`/api/households/${householdId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitation.email }),
      });
      const result = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        throw new Error(result?.detail ?? "No se pudo reenviar la invitación.");
      }
      await refresh();
      setMessage("Invitación reenviada.");
    } catch (error) {
      setMessageRole("alert");
      setMessage(
        error instanceof Error ? error.message : "No se pudo reenviar la invitación.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function revoke(invitation: Invitation) {
    setPendingId(invitation.id);
    setMessage(null);
    setMessageRole("status");
    try {
      const response = await fetch(
        `/api/households/${householdId}/invitations/${invitation.id}`,
        { method: "DELETE" },
      );
      const result = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        throw new Error(result?.detail ?? "No se pudo revocar la invitación.");
      }
      await refresh();
      setMessage("Invitación revocada.");
    } catch (error) {
      setMessageRole("alert");
      setMessage(
        error instanceof Error ? error.message : "No se pudo revocar la invitación.",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (invitations === null) {
    return (
      <div>
        <p className="form-status" role="alert">
          No se pudieron cargar las invitaciones.
        </p>
        <button className="btn btn-ghost" onClick={() => void refresh()} type="button">
          Reintentar
        </button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <p className="muted" role="status">
        Todavía no hay invitaciones enviadas.
      </p>
    );
  }

  return (
    <div>
      {invitations.map((invitation) => (
        <div className="settings-row" key={invitation.id}>
          <div style={{ minWidth: 0 }}>
            <span className="meal-name">{invitation.email}</span>
            <span className="meta" style={{ display: "block" }}>
              {ROLE_LABELS[invitation.requested_role] ?? invitation.requested_role}
              {" · entrega: "}
              {deliveryLabel(invitation.delivery)}
              {" · vence el "}
              <time dateTime={invitation.expires_at}>
                {formatInvitationExpiry(
                  invitation.expires_at,
                  hydrated ? undefined : "UTC",
                )}
              </time>
            </span>
          </div>
          <span className="planner-actions" style={{ marginLeft: 0 }}>
            <span
              className={`status status-chip ${
                STATUS_CLASSES[invitation.effective_status] ?? "neutral"
              }`}
            >
              {STATUS_LABELS[invitation.effective_status] ?? invitation.effective_status}
            </span>
            {canResend(invitation) ? (
              <button
                className="btn btn-ghost"
                disabled={pendingId !== null}
                onClick={() => void resend(invitation)}
                type="button"
              >
                {resendLabel(invitation)}
              </button>
            ) : null}
            {canRevoke(invitation) ? (
              <button
                className="btn btn-ghost"
                disabled={pendingId !== null}
                onClick={() => void revoke(invitation)}
                type="button"
              >
                Revocar
              </button>
            ) : null}
          </span>
        </div>
      ))}
      {message ? (
        <p className="form-status" role={messageRole}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
