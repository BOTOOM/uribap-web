# Requirements Checklist: Vercel Hardening

- [x] Baseline headers on all routes via `next.config.ts` (FR-001)
- [x] CSP allows Next hydration, denies framing and cross-origin API (FR-001/FR-004)
- [x] `.env.example` covers every consumed var with placeholders (FR-002)
- [x] Vercel runbook: env contract, preview vs prod, rotation, health (FR-003)
- [x] No secrets reachable from the browser (FR-004)
- [x] Existing suites and contract unchanged (FR-005)
