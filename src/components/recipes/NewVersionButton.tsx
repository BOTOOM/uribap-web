"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import { toast } from "@/lib/toast";

export function NewVersionButton({
  recipeId,
  baseServings,
  prepMinutes,
}: {
  recipeId: string;
  baseServings: number;
  prepMinutes: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function create() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_servings: baseServings,
          prep_minutes: prepMinutes,
        }),
      });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(body?.detail ?? "No se pudo crear la versión.");
      toast("Nueva versión en borrador");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la versión.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost"
        disabled={pending}
        onClick={() => void create()}
        type="button"
      >
        <Icon name="plus" size={15} />
        {pending ? "Creando…" : "Nueva versión"}
      </button>
      {message ? (
        <p className="form-status" role="alert">
          {message}
        </p>
      ) : null}
    </>
  );
}
