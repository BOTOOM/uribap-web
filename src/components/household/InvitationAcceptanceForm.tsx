"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";

export function InvitationAcceptanceForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
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
      <form className="foundation-actions" onSubmit={submit}>
        <label>
          Código de invitación
          <input required minLength={20} value={token} onChange={(event) => setToken(event.target.value)} />
        </label>
        <button className="status status-ready" type="submit">Aceptar invitación</button>
      </form>
      {error ? <ErrorState title="No se pudo aceptar la invitación" description={error} /> : null}
    </div>
  );
}
