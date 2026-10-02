"use client";

import { useState } from "react";

import type { components } from "@/lib/api/generated/schema";
import { AddDinerForm } from "@/components/memory/AddDinerForm";
import { DinerCard } from "@/components/memory/DinerCard";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { selectUnlinkedActiveMembers } from "@/components/memory/memory-utils";

type Profile = components["schemas"]["HouseholdMemoryProfile"];
type Member = components["schemas"]["MemberResponse"];

export function MemoryProfile({
  profile,
  members,
}: {
  profile: Profile;
  members: Member[];
}) {
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const availableMembers = selectUnlinkedActiveMembers(members, profile.diners);
  const memoryCount =
    profile.household.length +
    profile.diners.reduce((total, diner) => total + diner.memories.length, 0);
  const noDiners = profile.diners.length === 0;
  const noMemories = memoryCount === 0;

  let emptyMessage: string | null = null;
  if (noDiners && noMemories) {
    emptyMessage =
      "Todavía no hay personas ni recuerdos. Agrega un recuerdo para todo el hogar o crea una persona para guardar sus gustos.";
  } else if (noDiners) {
    emptyMessage =
      "Todavía no hay personas. Puedes crear una para recordar sus gustos y restricciones.";
  } else if (noMemories) {
    emptyMessage =
      "Todavía no hay recuerdos. Agrega uno para empezar a personalizar las sugerencias.";
  }

  return (
    <div className="memory-settings">
      <p aria-live="polite" className="form-status" role="status">
        {archiveMessage}
      </p>
      <div className="page-head memory-page-head">
        <div>
          <h1>Memoria del hogar</h1>
          <p>Lo que Uribap y tus agentes recuerdan para sugerir comidas.</p>
        </div>
      </div>

      {emptyMessage ? (
        <p className="memory-empty-note" role="status">
          {emptyMessage}
        </p>
      ) : null}

      <div className="memory-settings-grid">
        <MemoryCard dinerId={null} memories={profile.household} title="Todo el hogar" />
        {profile.diners.map((dinerProfile) => {
          const linkedUserId = dinerProfile.diner.member_user_id;
          const linkedMember = linkedUserId
            ? members.find((member) => member.user_id === linkedUserId)
            : null;
          const linkedMemberName =
            linkedMember?.display_name || linkedMember?.email || null;
          return (
            <DinerCard
              key={dinerProfile.diner.id}
              linkedMemberName={linkedMemberName}
              onArchiveStart={() => setArchiveMessage(null)}
              onArchived={(dinerName) => setArchiveMessage(`Se archivó a “${dinerName}”.`)}
              profile={dinerProfile}
            />
          );
        })}
      </div>

      <AddDinerForm members={availableMembers} />
    </div>
  );
}
