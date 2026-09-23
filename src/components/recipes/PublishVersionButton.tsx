"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import { toast } from "@/lib/toast";

export function PublishVersionButton({
  recipeId,
  versionNumber,
}: {
  recipeId: string;
  versionNumber: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function publish() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/recipes/${recipeId}/versions/${versionNumber}/publish`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo publicar la versión.");
      toast("Versión publicada — ya se puede planificar");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo publicar la versión.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-primary"
        disabled={pending}
        onClick={() => void publish()}
        type="button"
      >
        <Icon name="check" size={15} />
        {pending ? "Publicando…" : `Publicar v${versionNumber}`}
      </button>
      {message ? (
        <p className="form-status" role="alert">
          {message}
        </p>
      ) : null}
    </>
  );
}
