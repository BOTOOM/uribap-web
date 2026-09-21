# Convergence: Demand Forecast Web

**Status**: implemented and verified — all tasks T001–T007 complete.

## Delivered

- `contracts/uribap-api.openapi.json` + `src/lib/api/generated/schema.ts` synced to API revision `demand-forecasting-cfd73ef…`; `contracts/metadata.json` v6, workflow `ref` pinned to the same SHA, and the contract test asserts it.
- `src/app/api/forecast/demand/route.ts`: read-only BFF proxy forwarding `from_date`/`to_date` and household auth; Problem Details surfaced verbatim.
- `src/app/(app)/forecast/page.tsx`: server-rendered week projection — hero, previous/next-week links via `?week=` search param, `DemandTable`, and explicit empty/error/forbidden states.
- `src/components/forecast/DemandTable.tsx`: API-verbatim lines (required, optional, on-hand, shortfall) with `status-missing`/`status-ready` badges — meaning carried by text, not color alone.
- `src/lib/forecast/window.ts`: Monday–Sunday window math shared by the page and tests.
- Nav link "Previsión" in `AppShell`.

## Verification

See `quickstart.md` evidence: api:check, lint, typecheck, 25 Vitest cases, build, audit, licenses, and performance budget all pass; e2e compiles with authenticated-session opt-in skips.

## Remaining work

None in scope. Shopping list UI and purchase flows land in phase 007.
