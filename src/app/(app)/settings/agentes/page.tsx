import { ErrorState } from "@/components/states/ErrorState";
import { McpAgentPanel } from "@/components/agents/McpAgentPanel";
import { serverApiFetch } from "@/lib/api/server-client";
import { publicEnv } from "@/lib/config/env";

type CurrentUser = {
  memberships: Array<{
    household_id: string;
    household_name: string;
    role: "owner" | "admin" | "member";
    status: string;
  }>;
};

export type McpToken = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

type AgentPageData = {
  householdId: string;
  householdName: string;
  tokens: McpToken[];
  mcpUrl: string;
};

async function loadData(): Promise<AgentPageData | { error: string }> {
  try {
    const currentUser = await serverApiFetch<CurrentUser>("/me");
    const membership = currentUser.memberships.find((item) => item.status === "active");
    if (!membership) {
      return { error: "Crea o acepta una invitación antes de conectar agentes." };
    }
    const tokens = await serverApiFetch<{ items: McpToken[] }>(
      `/households/${membership.household_id}/mcp-tokens`,
    );
    return {
      householdId: membership.household_id,
      householdName: membership.household_name,
      tokens: tokens.items,
      mcpUrl: `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/mcp`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function AgentSettingsPage() {
  const data = await loadData();
  if ("error" in data) {
    return <ErrorState description={data.error} title="No se pudo cargar la integración" />;
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Agentes MCP</h1>
          <p>
            Conecta un agente de IA a tu hogar “{data.householdName}”. El agente puede
            consultar y editar despensa, plan, recetas, compras y preparación con tu
            identidad.
          </p>
        </div>
      </div>
      <McpAgentPanel
        householdId={data.householdId}
        initialTokens={data.tokens}
        mcpUrl={data.mcpUrl}
      />
    </>
  );
}
