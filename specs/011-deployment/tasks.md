# Tasks: Vercel Hardening and Operations Runbook

## Implementation

- T001 `next.config.ts` `headers()` baseline + unit test asserting header keys
  and CSP directives.
- T002 `.env.example` parity pass with `src/lib/config/env.ts` (placeholders).
- T003 `docs/operations/vercel.md` runbook: env contract, preview vs prod,
  rotation, health probe, headers rationale, no-deploy boundary.

## Verify

- T004 Full gates: `api:check`, lint, typecheck, test, e2e, a11y, build,
  audit, licenses, performance; Docker image still builds if pipeline covers.
