# Analyze: Vercel Hardening and Operations Runbook

## Coverage

- FR-001 → T001 (config headers + test).
- FR-002 → T002 (env parity).
- FR-003 → T003 (runbook).
- FR-004 → T001 (CSP `connect-src 'self'` only; BFF boundary unchanged).
- FR-005 → T004 (unchanged contract + green suites).

## Consistency

- `next.config.ts headers()` is the canonical Next/Vercel way — no
  `vercel.json` needed for headers; framework detection stays automatic.
- No contract change → no `contracts/` sync needed this phase.

## Risks → mitigations

- CSP breaks hydration → `script-src 'self' 'unsafe-inline'` documented as the
  pragmatic Next baseline; nonce-based CSP deferred (needs per-request config).
- Env drift → runbook + `.env.example` generated from `env.ts` review.

## Open questions

None — deployment itself stays out of scope per the roadmap.
