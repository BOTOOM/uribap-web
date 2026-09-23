"use client";

import { useState } from "react";

import { Tabs, TabContent, TabTrigger, StyledTabList } from "@/components/ui/Tabs";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/lib/toast";

export type McpToken = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

type CreatedToken = McpToken & { token: string };

const TOKEN_PLACEHOLDER = "<pega-tu-token>";

type Guide = {
  id: string;
  label: string;
  steps: string[];
  snippet: (mcpUrl: string) => string;
};

const GUIDES: Guide[] = [
  {
    id: "devin-desktop",
    label: "Devin Desktop",
    steps: [
      "Crea un token arriba y cópialo (solo se muestra una vez).",
      "Abre tu proyecto y ejecuta `devin mcp add uribap <URL>` para registrar el servidor, o edita directamente el archivo de configuración.",
      "Guarda el token en el alcance local o de usuario (`.devin/mcp_config.local.json` o `~/.config/devin/mcp_config.json`) — nunca en un archivo versionado.",
    ],
    snippet: (mcpUrl) => `{
  "mcpServers": {
    "uribap": {
      "url": "${mcpUrl}",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer ${TOKEN_PLACEHOLDER}"
      }
    }
  }
}`,
  },
  {
    id: "devin-cloud",
    label: "Devin Cloud",
    steps: [
      "En Devin Cloud, los servidores MCP se gestionan en Team Settings → MCP servers para todo el equipo, o por repositorio.",
      "Si el agente trabaja dentro de un repositorio, añade `.devin/mcp_config.json` con este bloque y guarda el token en `.devin/mcp_config.local.json` (ignorado por git).",
      "Alternativa: configura el token como secreto de entorno en Devin y referencia `${env:URIBAP_MCP_TOKEN}` en headers.",
    ],
    snippet: (mcpUrl) => `{
  "mcpServers": {
    "uribap": {
      "url": "${mcpUrl}",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer \${env:URIBAP_MCP_TOKEN}"
      }
    }
  }
}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    steps: [
      "Crea el archivo `.vscode/mcp.json` en tu workspace (o usa el comando «MCP: Add Server» de GitHub Copilot Chat).",
      "Pega este bloque sustituyendo el token. Recarga la ventana si el servidor no aparece.",
      "El token queda en el archivo: añade `.vscode/mcp.json` a `.gitignore` si tu repo es compartido.",
    ],
    snippet: (mcpUrl) => `{
  "servers": {
    "uribap": {
      "type": "http",
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${TOKEN_PLACEHOLDER}"
      }
    }
  }
}`,
  },
  {
    id: "claude",
    label: "Claude",
    steps: [
      "Claude Code (CLI): `claude mcp add --transport http uribap <URL> --header \"Authorization: Bearer <tu-token>\"`.",
      "Claude Desktop no acepta servidores remotos con headers directamente: usa el proxy `mcp-remote` en `claude_desktop_config.json` con este bloque.",
      "En claude.ai puedes añadir la URL como «conector personalizado» con el header de autorización.",
    ],
    snippet: (mcpUrl) => `{
  "mcpServers": {
    "uribap": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${mcpUrl}",
        "--header",
        "Authorization: Bearer ${TOKEN_PLACEHOLDER}"
      ]
    }
  }
}`,
  },
  {
    id: "otros",
    label: "Otros clientes",
    steps: [
      "Cualquier cliente MCP con transporte Streamable HTTP funciona: Cursor (`~/.cursor/mcp.json`), Windsurf, Zed, etc.",
      "Transporte: Streamable HTTP (POST). Autenticación: header `Authorization: Bearer <tu-token>` en cada petición.",
      "El token no expira; revócalo aquí mismo si dejas de usar el cliente o crees que se filtró.",
    ],
    snippet: (mcpUrl) => `{
  "mcpServers": {
    "uribap": {
      "url": "${mcpUrl}",
      "type": "http",
      "headers": {
        "Authorization": "Bearer ${TOKEN_PLACEHOLDER}"
      }
    }
  }
}`,
  },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`);
  } catch {
    toast(`No se pudo copiar — selecciona y copia manualmente`);
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => void copyText(text, label)}
      type="button"
    >
      Copiar
    </button>
  );
}

export function McpAgentPanel({
  householdId,
  initialTokens,
  mcpUrl,
}: {
  householdId: string;
  initialTokens: McpToken[];
  mcpUrl: string;
}) {
  const [tokens, setTokens] = useState<McpToken[]>(initialTokens);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedToken | null>(null);

  async function createToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(`/api/households/${householdId}/mcp-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = (await response.json().catch(() => null)) as
        | (CreatedToken & { detail?: string })
        | null;
      if (!response.ok || !result) {
        throw new Error(result?.detail ?? "No se pudo crear el token.");
      }
      const meta: McpToken = {
        id: result.id,
        name: result.name,
        token_prefix: result.token_prefix,
        last_used_at: result.last_used_at,
        created_at: result.created_at,
      };
      setCreated(result);
      setTokens((items) => [meta, ...items]);
      setName("");
      toast("Token creado — cópialo ahora, no volverá a mostrarse");
    } catch (error) {
      toast(error instanceof Error ? error.message : "No se pudo crear el token.");
    } finally {
      setPending(false);
    }
  }

  async function revokeToken(token: McpToken) {
    setRevoking(token.id);
    try {
      const response = await fetch(
        `/api/households/${householdId}/mcp-tokens/${token.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(result?.detail ?? "No se pudo revocar el token.");
      }
      setTokens((items) => items.filter((item) => item.id !== token.id));
      toast(`Token “${token.name}” revocado — deja de funcionar al instante`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "No se pudo revocar el token.");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <>
      <div className="grid grid-2">
        <article className="card card-flush">
          <div className="card-title">
            <h2>Tokens de agente</h2>
            <span className="meta">{tokens.length} activos</span>
          </div>
          <p className="muted">
            Cada token da acceso MCP a este hogar con tu identidad. Puedes crear varios
            (uno por cliente o agente), no caducan y se revocan al instante.
          </p>

          <form aria-label="Crear un token MCP" className="form" onSubmit={createToken}>
            <div className="field">
              <label className="field-label" htmlFor="token-name">
                Nombre del token
              </label>
              <input
                className="input"
                id="token-name"
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                placeholder="Devin Desktop, Claude, agente del trabajo…"
                required
                value={name}
              />
              <span className="field-hint">
                Te ayuda a reconocer qué cliente lo usa al revocarlo.
              </span>
            </div>
            <button className="btn btn-primary" disabled={pending || !name.trim()} type="submit">
              {pending ? "Creando…" : "Crear token"}
            </button>
          </form>

          {created ? (
            <div aria-live="polite" className="token-secret" role="status">
              <strong>Este es tu token — se muestra una sola vez.</strong>
              <p className="muted">
                Guárdalo en un gestor de contraseñas o como secreto. Si lo pierdes,
                revócalo y crea otro.
              </p>
              <div className="code-block">
                <code>{created.token}</code>
                <CopyButton label="Token" text={created.token} />
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setCreated(null)}
                type="button"
              >
                Ya lo guardé
              </button>
            </div>
          ) : null}

          {tokens.length === 0 ? (
            <p className="muted" role="status">
              Todavía no hay tokens. Crea el primero para conectar un agente.
            </p>
          ) : (
            <ul aria-label="Tokens MCP activos" className="token-list">
              {tokens.map((token) => (
                <li className="token-row" key={token.id}>
                  <div className="token-main">
                    <strong>{token.name}</strong>
                    <span className="meta">{token.token_prefix}…</span>
                  </div>
                  <div className="token-meta">
                    <span>Creado {formatDate(token.created_at)}</span>
                    <span>Último uso {formatDate(token.last_used_at)}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={revoking === token.id}
                    onClick={() => void revokeToken(token)}
                    type="button"
                  >
                    {revoking === token.id ? "Revocando…" : "Revocar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <div className="card-title">
            <h2>Servidor MCP</h2>
          </div>
          <p className="muted">
            Uribap expone un servidor MCP remoto (transporte Streamable HTTP) con 32
            herramientas: leer y editar despensa, plan semanal, recetas, ingredientes,
            compras, preparación y actividad del hogar.
          </p>
          <div className="field">
            <span className="field-label" id="mcp-url-label">
              URL del servidor
            </span>
            <div aria-labelledby="mcp-url-label" className="code-block">
              <code>{mcpUrl}</code>
              <CopyButton label="URL" text={mcpUrl} />
            </div>
          </div>
          <p className="muted">
            Autenticación en cada petición: <code>Authorization: Bearer &lt;token&gt;</code>.
            El token determina tu usuario y hogar — el agente solo ve lo que tú ves.
          </p>
        </article>
      </div>

      <article className="card card-flush" style={{ marginTop: 18 }}>
        <div className="card-title">
          <div>
            <h2>Configura tu cliente</h2>
            <span className="muted">
              Pega la configuración correspondiente y sustituye el token.
            </span>
          </div>
        </div>
        <Tabs defaultValue="devin-desktop">
          <StyledTabList aria-label="Clientes MCP">
            {GUIDES.map((guide) => (
              <TabTrigger key={guide.id} value={guide.id}>
                {guide.label}
              </TabTrigger>
            ))}
          </StyledTabList>
          {GUIDES.map((guide) => (
            <TabContent className="guide-panel" key={guide.id} value={guide.id}>
              <ol className="guide-steps">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="code-block code-block-multiline">
                <pre>{guide.snippet(mcpUrl)}</pre>
                <CopyButton label="Configuración" text={guide.snippet(mcpUrl)} />
              </div>
            </TabContent>
          ))}
        </Tabs>
      </article>

      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-title">
          <div>
            <h2>Qué puede hacer el agente</h2>
          </div>
        </div>
        <ul className="guide-steps">
          <li>Consultar contexto, despensa real, previsión de demanda y actividad.</li>
          <li>Crear y editar ingredientes, recetas y entradas del plan semanal.</li>
          <li>Registrar compras y ajustes de inventario, completar comidas y preparaciones.</li>
          <li>Generar y cerrar listas de compra con los mismos controles de la app.</li>
        </ul>
        <p className="muted">
          <Icon name="bell" size={14} /> Las escrituras aplican las mismas reglas del API:
          aislamiento por hogar, idempotencia y concurrencia optimista. Si un token se
          compromete, revócalo arriba y deja de responder de inmediato.
        </p>
      </article>
    </>
  );
}
