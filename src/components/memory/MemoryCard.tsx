"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { components } from "@/lib/api/generated/schema";
import { groupMemoriesByKind } from "@/components/memory/memory-utils";

type Memory = components["schemas"]["MemoryResponse"];
type MemoryKind = components["schemas"]["MemoryKind"];

type MemoryCardProps = {
  title: string;
  memories: Memory[];
  dinerId: string | null;
  headingLevel?: 2 | 3;
};

type ApiResult = { detail?: string } | null;

const MEMORY_KIND_OPTIONS: Array<{ value: MemoryKind; label: string }> = [
  { value: "restriction", label: "Restricción" },
  { value: "dislike", label: "No le gusta" },
  { value: "like", label: "Le gusta" },
  { value: "goal", label: "Objetivo" },
  { value: "note", label: "Nota" },
];

async function readApiResult(response: Response): Promise<ApiResult> {
  return (await response.json().catch(() => null)) as ApiResult;
}

export function MemoryCard({
  title,
  memories,
  dinerId,
  headingLevel = 2,
}: MemoryCardProps) {
  const router = useRouter();
  const id = useId();
  const newKindId = `${id}-new-kind`;
  const newContentId = `${id}-new-content`;
  const newCountId = `${id}-new-count`;
  const editKindId = `${id}-edit-kind`;
  const editContentId = `${id}-edit-content`;
  const [newKind, setNewKind] = useState<MemoryKind>("note");
  const [newContent, setNewContent] = useState("");
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editingKind, setEditingKind] = useState<MemoryKind>("note");
  const [editingContent, setEditingContent] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [newContentError, setNewContentError] = useState<string | null>(null);
  const [editingContentError, setEditingContentError] = useState<string | null>(null);

  function announce(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function submitNewMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = newContent.trim();
    setMessage(null);
    setNewContentError(null);
    if (!content) {
      const detail = "Escribe un recuerdo antes de guardarlo.";
      setNewContentError(detail);
      announce(detail, true);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          content,
          kind: newKind,
          ...(dinerId ? { diner_id: dinerId } : {}),
        }),
      });
      const result = await readApiResult(response);
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) router.refresh();
        const detail = result?.detail ?? "No se pudo agregar el recuerdo.";
        if (response.status === 422) setNewContentError(detail);
        announce(detail, true);
        return;
      }
      setNewContent("");
      setNewKind("note");
      announce("Recuerdo agregado.");
      router.refresh();
    } catch (error) {
      announce(
        error instanceof Error ? error.message : "No se pudo agregar el recuerdo.",
        true,
      );
    } finally {
      setPending(false);
    }
  }

  function beginEditing(memory: Memory) {
    setEditingMemory(memory);
    setEditingKind(memory.kind);
    setEditingContent(memory.content);
    setMessage(null);
    setEditingContentError(null);
  }

  async function submitMemoryEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMemory) return;
    const content = editingContent.trim();
    setMessage(null);
    setEditingContentError(null);
    if (!content) {
      const detail = "Escribe un recuerdo antes de guardarlo.";
      setEditingContentError(detail);
      announce(detail, true);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/memories/${editingMemory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          expected_version: editingMemory.version,
          kind: editingKind,
        }),
      });
      const result = await readApiResult(response);
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) {
          setEditingMemory(null);
          router.refresh();
        }
        const detail = result?.detail ?? "No se pudo actualizar el recuerdo.";
        if (response.status === 422) setEditingContentError(detail);
        announce(detail, true);
        return;
      }
      setEditingMemory(null);
      announce("Recuerdo actualizado.");
      router.refresh();
    } catch (error) {
      announce(
        error instanceof Error ? error.message : "No se pudo actualizar el recuerdo.",
        true,
      );
    } finally {
      setPending(false);
    }
  }

  async function forgetMemory(memory: Memory) {
    if (!window.confirm(`¿Quieres olvidar “${memory.content}”?`)) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
      const result = await readApiResult(response);
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) router.refresh();
        announce(result?.detail ?? "No se pudo olvidar el recuerdo.", true);
        return;
      }
      announce("Recuerdo olvidado.");
      router.refresh();
    } catch (error) {
      announce(
        error instanceof Error ? error.message : "No se pudo olvidar el recuerdo.",
        true,
      );
    } finally {
      setPending(false);
    }
  }

  const groups = groupMemoriesByKind(memories);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const GroupHeading = headingLevel === 2 ? "h3" : "h4";

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`memory-card${dinerId ? " memory-card-nested" : " card"}`}
    >
      <div className="memory-card-heading">
        <Heading id={`${id}-title`}>{title}</Heading>
      </div>

      {groups.length > 0 ? (
        <div className="memory-groups">
          {groups.map((group) => (
            <section
              aria-labelledby={`${id}-${group.kind}`}
              className={`memory-kind-group${group.kind === "restriction" ? " is-restriction" : ""}`}
              key={group.kind}
            >
              <GroupHeading id={`${id}-${group.kind}`}>{group.label}</GroupHeading>
              <ul className="memory-list">
                {group.memories.map((memory) => (
                  <li className="memory-item" key={memory.id}>
                    <p className="memory-content">{memory.content}</p>
                    <div className="memory-actions">
                      <button
                        aria-label={`Editar recuerdo: ${memory.content}`}
                        className="btn btn-ghost btn-sm"
                        disabled={pending}
                        onClick={() => beginEditing(memory)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        aria-label={`Olvidar recuerdo: ${memory.content}`}
                        className="btn btn-ghost btn-sm"
                        disabled={pending}
                        onClick={() => void forgetMemory(memory)}
                        type="button"
                      >
                        Olvidar
                      </button>
                    </div>
                    {editingMemory?.id === memory.id ? (
                      <form
                        aria-label="Editar recuerdo"
                        className="memory-edit-form form"
                        onSubmit={submitMemoryEdit}
                      >
                        <div className="field">
                          <label className="field-label" htmlFor={editKindId}>
                            Tipo de recuerdo
                          </label>
                          <select
                            className="select"
                            id={editKindId}
                            value={editingKind}
                            onChange={(event) =>
                              setEditingKind(event.target.value as MemoryKind)
                            }
                          >
                            {MEMORY_KIND_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label className="field-label" htmlFor={editContentId}>
                            Contenido del recuerdo
                          </label>
                          <textarea
                            aria-describedby={
                              editingContentError ? `${id}-edit-content-error` : undefined
                            }
                            aria-invalid={editingContentError ? true : undefined}
                            className="input textarea"
                            id={editContentId}
                            maxLength={1000}
                            required
                            value={editingContent}
                            onChange={(event) => setEditingContent(event.target.value)}
                          />
                          {editingContentError ? (
                            <span className="field-error" id={`${id}-edit-content-error`}>
                              {editingContentError}
                            </span>
                          ) : null}
                        </div>
                        <div className="memory-form-actions">
                          <button className="btn btn-primary" disabled={pending} type="submit">
                            {pending ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button
                            className="btn btn-ghost"
                            disabled={pending}
                            onClick={() => setEditingMemory(null)}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="memory-no-memories muted">Todavía no hay recuerdos para esta sección.</p>
      )}

      <form
        aria-label={`Agregar recuerdo para ${title}`}
        className="memory-add-form form"
        onSubmit={submitNewMemory}
      >
        <div className="field">
          <label className="field-label" htmlFor={newKindId}>
            Tipo de recuerdo nuevo
          </label>
          <select
            className="select"
            id={newKindId}
            value={newKind}
            onChange={(event) => setNewKind(event.target.value as MemoryKind)}
          >
            {MEMORY_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={newContentId}>
            Recuerdo nuevo
          </label>
          <textarea
            aria-describedby={`${newCountId}${newContentError ? ` ${id}-new-content-error` : ""}`}
            aria-invalid={newContentError ? true : undefined}
            className="input textarea"
            id={newContentId}
            maxLength={1000}
            required
            value={newContent}
            onChange={(event) => setNewContent(event.target.value)}
          />
          <span className="helper" id={newCountId}>
            {newContent.length}/1000 caracteres
          </span>
          {newContentError ? (
            <span className="field-error" id={`${id}-new-content-error`}>
              {newContentError}
            </span>
          ) : null}
        </div>
        <div className="memory-form-actions">
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Guardando..." : "Agregar recuerdo"}
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
