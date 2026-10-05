import type { components } from "@/lib/api/generated/schema";

type Memory = components["schemas"]["MemoryResponse"];
type MemoryKind = components["schemas"]["MemoryKind"];
type DinerProfile = components["schemas"]["DinerMemoryProfile"];
type Member = components["schemas"]["MemberResponse"];

const MEMORY_KIND_ORDER: MemoryKind[] = [
  "restriction",
  "dislike",
  "like",
  "goal",
  "note",
];

const MEMORY_KIND_LABELS: Record<MemoryKind, string> = {
  restriction: "Restricción",
  dislike: "No le gusta",
  like: "Le gusta",
  goal: "Objetivo",
  note: "Nota",
};

export function groupMemoriesByKind(
  memories: Memory[],
): Array<{ kind: MemoryKind; label: string; memories: Memory[] }> {
  return MEMORY_KIND_ORDER.flatMap((kind) => {
    const matchingMemories = memories.filter((memory) => memory.kind === kind);
    return matchingMemories.length > 0
      ? [{ kind, label: MEMORY_KIND_LABELS[kind], memories: matchingMemories }]
      : [];
  });
}

export function selectUnlinkedActiveMembers(
  members: Member[],
  diners: DinerProfile[],
): Member[] {
  const linkedUserIds = new Set(
    diners
      .map(({ diner }) => diner.member_user_id)
      .filter((userId): userId is string => userId !== null),
  );
  return members.filter(
    (member) => member.status === "active" && !linkedUserIds.has(member.user_id),
  );
}
