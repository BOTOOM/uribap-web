# Implementation Plan: Household Activity Web Experience

## Stack layers

1. **Spec** — this artifact set.
2. **Contract** — `pnpm api:sync` against the API service branch; metadata
   `schemaVersion: v10`, `apiRevision: events-*`; workflow `ref` pinned to the
   API stack during development, restored to `main` in the cleanup PR.
3. **UI** — BFF route `GET /api/households/activity` (page/page_size
   passthrough), `Actividad` section on `/settings/household` (server-loaded
   first page + client-side `Cargar más`), kind→label map, outbox summary,
   component + a11y coverage.

## Key decisions

- Activity lives on `/settings/household` — it is household-scoped
  observability, not a daily-workflow surface, so no new nav entry.
- First page renders server-side; `LoadMoreActivity` (client) fetches
  subsequent pages through the BFF and appends.
- Event kind labels map through a static `Record<string, string>`; unknown
  kinds fall back to the raw kind string — forward-compatible with API growth.
- The outbox summary is a compact counts row with a suppression hint — it
  explains "no email was sent" rather than offering any send action.

## Models

- Architecture: `gpt-5-6-luna-high`; implementation: `gpt-5-6-sol-high`;
  auth/accessibility review: `gpt-5-6-terra-high`; bounded fixes: `swe-2-high`.
