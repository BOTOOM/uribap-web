import { ErrorState } from "@/components/states/ErrorState";
import { ActivityFeed } from "@/components/household/ActivityFeed";
import { InvitationForm } from "@/components/household/InvitationForm";
import { MemberManagement } from "@/components/household/MemberManagement";
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
    version: number;
  }>;
};

type Activity = {
  entries: Array<{
    id: string;
    kind: string;
    occurredAt: string;
    aggregateType: string;
    aggregateId: string | null;
    actorUserId: string | null;
    payload: Record<string, unknown>;
  }>;
  page: number;
  pageSize: number;
  hasMore: boolean;
  outbox: {
    pending: number;
    sent: number;
    failed: number;
    suppressed: number;
  };
};

type HouseholdPageData = {
  household: Household;
  members: Members;
  membership: CurrentUser["memberships"][number];
  activity: Activity | null;
};

async function loadHouseholdData(): Promise<HouseholdPageData | { error: string }> {
  try {
    const currentUser = await serverApiFetch<CurrentUser>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) {
      return { error: "Crea o acepta una invitación antes de administrar el hogar." };
    }
    const [household, members, activity] = await Promise.all([
      serverApiFetch<Household>(`/households/${membership.household_id}`),
      serverApiFetch<Members>(`/households/${membership.household_id}/members`),
      serverApiFetch<Activity>(`/households/${membership.household_id}/activity`).catch(
        () => null,
      ),
    ]);
    return { household, members, membership, activity };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

const ROLE_LABELS: Record<string, string> = {
  owner: "propietario",
  admin: "administración",
  member: "miembro",
};

export default async function HouseholdSettingsPage() {
  const data = await loadHouseholdData();
  if ("error" in data) {
    return <ErrorState description={data.error} title="No se pudo cargar el hogar" />;
  }
  const { household, members, membership, activity } = data;
  const canInvite = membership.role === "owner" || membership.role === "admin";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{household.name}</h1>
          <p>
            {household.locale} · {household.timezone} · tu rol:{" "}
            {ROLE_LABELS[membership.role] ?? membership.role}
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <article className="card card-flush">
          <div className="card-title">
            <h2>Miembros del hogar</h2>
            <span className="meta">
              {members.items.filter((item) => item.status === "active").length} activos
            </span>
          </div>
          <MemberManagement
            canManage={canInvite}
            householdId={household.id}
            initialMembers={members.items}
          />
        </article>

        <article className="card">
          <div className="card-title">
            <h2>Invitar a otra persona</h2>
          </div>
          {canInvite ? (
            <InvitationForm householdId={household.id} />
          ) : (
            <p className="muted" role="status">
              Tu rol puede consultar miembros, pero no administrar invitaciones.
            </p>
          )}
        </article>
      </div>

      <article className="card card-flush" style={{ marginTop: 18 }}>
        <div className="card-title">
          <div>
            <h2>Actividad del hogar</h2>
            <span className="muted">
              Registro de eventos y avisos de correo capturados localmente.
            </span>
          </div>
        </div>
        {activity ? (
          <ActivityFeed initialFeed={activity} outbox={activity.outbox} />
        ) : (
          <p className="muted" role="status">
            No se pudo cargar la actividad del hogar.
          </p>
        )}
      </article>
    </>
  );
}
