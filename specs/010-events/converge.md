# Converge: Household Activity Web Experience

## Scope delivered

- Contract layer — pinned `contracts/uribap-api.openapi.json` to the API 010
  events revision (`events-da5403e`, `schemaVersion v10`), regenerated
  `src/lib/api/generated/schema.ts` (`ActivityFeedResponse`, `ActivityEntry`,
  `OutboxSummary`, `GET /households/{id}/activity`), and pointed
  `contract.yml` `ref` at the API events stack until merge.
- BFF boundary — `GET /api/households/activity` resolves the active membership
  via `/me`, forwards `page`/`page_size`, and maps Problem Details.
- `/settings/household` — new `Actividad del hogar` section: the server loads
  the first page alongside household/members data (activity failure degrades
  to a status hint without breaking the page); `ActivityFeed` renders a
  kind→label map, `<time>` timestamps, and appends further pages through the
  `Cargar más` client control.
- Outbox summary — `role="group"` definition list with `pendiente`/`enviado`/
  `fallido`/`suprimido` counts plus the explanatory hint that email delivery
  is disabled and suppressed notices are recorded without sending.
- States — loading (`Cargando…`/`aria-busy`), empty, error (`role="alert"`
  with existing entries preserved), forbidden (BFF 403 → status text), and
  forward-compat raw kind labels for unknown event kinds.

## Verification

All gates in `quickstart.md` pass: `api:check`, `lint`, `typecheck`,
`pnpm test` (57 tests / 20 files incl. 5 component + 3 a11y specs), `build`,
`licenses`, `performance`, `audit`; e2e suite green with opt-in specs skipped
like the rest.

## Design notes

- The feed is strictly read-only: no mutations, no domain logic — payloads
  render only through the kind→label map and aggregate-type badge (FR-002).
- The activity section lives inside `/settings/household`; no new top-level
  navigation surface was added (FR-003).
- The BFF never exposes the household id requirement to the browser — it
  derives the active membership server-side, so no token or internal id
  leaks into client code.

## Remaining work

- After the API 010 stack merges: cleanup PR restoring `contract.yml`
  `ref: main` and `apiRevision` to the merged API SHA.
