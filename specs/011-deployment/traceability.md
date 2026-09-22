# Traceability: Vercel Hardening and Operations Runbook

| Requirement | Artifact | Verification |
| --- | --- | --- |
| FR-001 | `next.config.ts` `headers()` | unit test asserting entries |
| FR-002 | `.env.example` | manual diff vs `env.ts` |
| FR-003 | `docs/operations/vercel.md` | runbook review |
| FR-004 | CSP `connect-src 'self'` | unit test on CSP value |
| FR-005 | unchanged app code | full gates in T004 |
