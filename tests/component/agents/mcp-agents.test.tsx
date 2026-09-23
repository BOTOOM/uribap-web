import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";

import { McpAgentPanel } from "@/components/agents/McpAgentPanel";

const MCP_URL = "http://localhost:8010/api/v1/mcp";

const TOKENS = [
  {
    id: "tok-1",
    name: "Devin Desktop",
    token_prefix: "uribap_mcp_abc123",
    last_used_at: "2026-09-22T10:00:00Z",
    created_at: "2026-09-20T08:00:00Z",
  },
  {
    id: "tok-2",
    name: "Claude",
    token_prefix: "uribap_mcp_def456",
    last_used_at: null,
    created_at: "2026-09-21T08:00:00Z",
  },
];

function renderPanel() {
  return render(
    <McpAgentPanel householdId="hh-1" initialTokens={TOKENS} mcpUrl={MCP_URL} />,
  );
}

function tokenList() {
  return screen.getByRole("list", { name: "Tokens MCP activos" });
}

describe("MCP agent tokens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists active tokens with name, prefix and usage dates", () => {
    renderPanel();
    const list = tokenList();
    expect(within(list).getByText("Devin Desktop")).toBeInTheDocument();
    expect(within(list).getByText("Claude")).toBeInTheDocument();
    expect(within(list).getByText(/uribap_mcp_abc123/)).toBeInTheDocument();
    expect(screen.getByText("2 activos")).toBeInTheDocument();
  });

  it("shows the MCP server URL and all client guides", () => {
    renderPanel();
    expect(screen.getByText(MCP_URL)).toBeInTheDocument();
    for (const label of [
      "Devin Desktop",
      "Devin Cloud",
      "VS Code",
      "Claude",
      "Otros clientes",
    ]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("creates a token, reveals the secret once and adds it to the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "tok-3",
        name: "Cursor",
        token_prefix: "uribap_mcp_xyz",
        last_used_at: null,
        created_at: "2026-09-22T12:00:00Z",
        token: "uribap_mcp_secret-value",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    fireEvent.change(screen.getByLabelText("Nombre del token"), {
      target: { value: "Cursor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear token" }));

    await waitFor(() =>
      expect(screen.getByText("uribap_mcp_secret-value")).toBeInTheDocument(),
    );
    expect(screen.getByText(/se muestra una sola vez/i)).toBeInTheDocument();
    expect(within(tokenList()).getByText("Cursor")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/households/hh-1/mcp-tokens",
      expect.objectContaining({ method: "POST" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Ya lo guardé" }));
    expect(screen.queryByText("uribap_mcp_secret-value")).not.toBeInTheDocument();
  });

  it("revokes a token and removes it from the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    fireEvent.click(
      within(tokenList()).getAllByRole("button", { name: "Revocar" })[0],
    );

    await waitFor(() =>
      expect(
        within(tokenList()).queryByText("Devin Desktop"),
      ).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/households/hh-1/mcp-tokens/tok-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(screen.getByText("1 activos")).toBeInTheDocument();
  });

  it("shows an empty state without tokens", () => {
    render(<McpAgentPanel householdId="hh-1" initialTokens={[]} mcpUrl={MCP_URL} />);
    expect(screen.getByText(/Todavía no hay tokens/)).toBeInTheDocument();
  });

  it("renders guide steps and snippets inside tabs", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(screen.getByText(/devin mcp add uribap/)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "VS Code" }));
    expect(await screen.findByText(/MCP: Add Server/)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Claude" }));
    expect(await screen.findByText(/claude_desktop_config\.json/)).toBeInTheDocument();
  });
});
