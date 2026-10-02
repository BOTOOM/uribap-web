import { describe, expect, it } from "vitest";

import type { components } from "@/lib/api/generated/schema";
import {
  groupMemoriesByKind,
  selectUnlinkedActiveMembers,
} from "@/components/memory/memory-utils";

type Memory = components["schemas"]["MemoryResponse"];
type Member = components["schemas"]["MemberResponse"];
type DinerProfile = components["schemas"]["DinerMemoryProfile"];

function memory(
  id: string,
  kind: Memory["kind"],
  content: string,
): Memory {
  return {
    archived_at: null,
    content,
    created_at: "2026-10-01T12:00:00Z",
    created_by_user_id: null,
    diner_id: null,
    id,
    kind,
    updated_at: "2026-10-01T12:00:00Z",
    version: 1,
  };
}

function member(id: string, userId: string, status = "active"): Member {
  return {
    display_name: id,
    email: `${id.toLowerCase()}@example.test`,
    email_verified: true,
    id: `membership-${id}`,
    joined_at: "2026-10-01T12:00:00Z",
    role: "member",
    status,
    user_id: userId,
    version: 1,
  };
}

function dinerProfile(id: string, memberUserId: string | null): DinerProfile {
  return {
    diner: {
      archived_at: null,
      created_at: "2026-10-01T12:00:00Z",
      display_name: id,
      id,
      member_user_id: memberUserId,
      updated_at: "2026-10-01T12:00:00Z",
      version: 1,
    },
    memories: [],
  };
}

describe("memory profile helpers", () => {
  it("groups supported kinds in the required order and preserves order within each kind", () => {
    const grouped = groupMemoriesByKind([
      memory("note-1", "note", "Nota"),
      memory("like-1", "like", "Primero"),
      memory("restriction-1", "restriction", "Restricción"),
      memory("like-2", "like", "Segundo"),
      memory("goal-1", "goal", "Objetivo"),
      memory("dislike-1", "dislike", "No le gusta"),
    ]);

    expect(grouped.map(({ kind, label }) => [kind, label])).toEqual([
      ["restriction", "Restricción"],
      ["dislike", "No le gusta"],
      ["like", "Le gusta"],
      ["goal", "Objetivo"],
      ["note", "Nota"],
    ]);
    expect(grouped.find(({ kind }) => kind === "like")?.memories.map(({ id }) => id)).toEqual([
      "like-1",
      "like-2",
    ]);
  });

  it("omits empty kind groups", () => {
    expect(groupMemoriesByKind([memory("note-1", "note", "Nota")])).toEqual([
      { kind: "note", label: "Nota", memories: [memory("note-1", "note", "Nota")] },
    ]);
    expect(groupMemoriesByKind([])).toEqual([]);
  });

  it("selects only active household members not already linked to a diner", () => {
    const eligible = selectUnlinkedActiveMembers(
      [
        member("Vinculado", "user-linked"),
        member("Disponible", "user-available"),
        member("Invitado pendiente", "user-pending", "pending"),
      ],
      [dinerProfile("Edwar", "user-linked"), dinerProfile("Pareja", null)],
    );

    expect(eligible.map(({ user_id }) => user_id)).toEqual(["user-available"]);
  });
});
