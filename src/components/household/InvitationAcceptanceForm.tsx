"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";

export function InvitationAcceptanceForm({
  flow,
  hasHeldInvitation,
}: {
  flow: string | null;
  hasHeldInvitation: boolean;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usesHeldInvitation = hasHeldInvitation && flow !== null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usesHeldInvitation ? { flow } : { token }),
      });
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(problem?.detail ?? "La invitación no pudo aceptarse.");
      }
      router.push("/plan");
      router.refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "La invitación no pudo aceptarse.");
    } finally {
      setPending(false);
    }
  }

  if (pending) return <LoadingState label="Validando invitación…" />;
  return (
    <div>
      <form className="form" onSubmit={submit}>
        {usesHeldInvitation ? null : (
          <div className="field">
            <label className="field-label" htmlFor="invite-token">
              Código de invitación
            </label>
            <input
              className="input"
              id="invite-token"
              maxLength={256}
              minLength={16}
              pattern="[A-Za-z0-9_-]{16,256}"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <span className="helper">
              El código llega en el correo de invitación.
            </span>
          </div>
        )}
        <div>
          <button className="btn btn-primary" type="submit">
            Aceptar invitación
          </button>
        </div>
      </form>
      {error ? <ErrorState description={error} title="No se pudo aceptar la invitación" /> : null}
    </div>
  );
}
