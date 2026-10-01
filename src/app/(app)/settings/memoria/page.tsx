import { ErrorState } from "@/components/states/ErrorState";
import { MemoryProfile } from "@/components/memory/MemoryProfile";
import { serverApiFetch, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";

type CurrentUser = {
  memberships: Array<{
    household_id: string;
    status: string;
  }>;
};

type MemoryPageData = {
  profile: components["schemas"]["HouseholdMemoryProfile"];
  members: components["schemas"]["MemberResponse"][];
};

async function loadMemoryPage(): Promise<MemoryPageData | { error: string }> {
  try {
    const currentUser = await serverApiFetch<CurrentUser>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) {
      return { error: "Crea o acepta una invitación antes de consultar la memoria del hogar." };
    }
    const [profile, members] = await Promise.all([
      serverHouseholdFetch<components["schemas"]["HouseholdMemoryProfile"]>("/memory/profile"),
      serverApiFetch<components["schemas"]["MemberPage"]>(
        `/households/${membership.household_id}/members?limit=100`,
      ),
    ]);
    return { profile, members: members.items };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Inténtalo de nuevo.",
    };
  }
}

export default async function MemorySettingsPage() {
  const data = await loadMemoryPage();
  if ("error" in data) {
    return (
      <ErrorState
        description={data.error}
        title="No se pudo cargar la memoria del hogar"
      />
    );
  }

  return <MemoryProfile profile={data.profile} members={data.members} />;
}
