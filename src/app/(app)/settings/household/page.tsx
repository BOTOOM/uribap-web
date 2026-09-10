import { ErrorState } from "@/components/states/ErrorState";
import { InvitationForm } from "@/components/household/InvitationForm";
import { serverApiFetch } from "@/lib/api/server-client";

type CurrentUser = {
  memberships: Array<{
    household_id: string;
    household_name: string;
    role: "owner" | "admin" | "member";
    status: string;
  }>;
};

type Household = {
  id: string;
  name: string;
  locale: string;
  timezone: string;
  version: number;
};

type Members = {
  items: Array<{
    user_id: string;
    display_name: string | null;
    email: string | null;
    role: string;
    status: string;
  }>;
};

type HouseholdPageData = {
  household: Household;
  members: Members;
  membership: CurrentUser["memberships"][number];
};

async function loadHouseholdData(): Promise<HouseholdPageData | { error: string }> {
  try {
    const currentUser = await serverApiFetch<CurrentUser>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) return { error: "Crea o acepta una invitación antes de administrar el hogar." };
    const [household, members] = await Promise.all([
      serverApiFetch<Household>(`/households/${membership.household_id}`),
      serverApiFetch<Members>(`/households/${membership.household_id}/members`),
    ]);
    return { household, members, membership };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function HouseholdSettingsPage() {
  const data = await loadHouseholdData();
  if ("error" in data) {
    return <ErrorState title="No se pudo cargar el hogar" description={data.error} />;
  }
  const { household, members, membership } = data;
  const canInvite = membership.role === "owner" || membership.role === "admin";
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="household-settings-title">
        <p className="eyebrow">Uribap · hogar</p>
        <h1 id="household-settings-title">{household.name}</h1>
        <p className="lede">{household.locale} · {household.timezone} · rol {membership.role}</p>
      </section>
      <section className="foundation-list" aria-labelledby="members-title">
        <div>
          <p className="eyebrow">Personas</p>
          <h2 id="members-title">Miembros del hogar</h2>
        </div>
        <ul>
          {members.items.map((member) => (
            <li key={member.user_id}>
              <span className="item-index">{member.role.slice(0, 2).toUpperCase()}</span>
              <span>{member.display_name ?? member.email ?? "Persona"} · {member.role}</span>
            </li>
          ))}
        </ul>
      </section>
      {canInvite ? (
        <section className="foundation-hero" aria-labelledby="invite-title">
          <p className="eyebrow">Acceso</p>
          <h2 id="invite-title">Invitar a otra persona</h2>
          <InvitationForm householdId={household.id} />
        </section>
      ) : (
        <p role="status">Tu rol puede consultar miembros, pero no administrar invitaciones.</p>
      )}
    </div>
  );
}
