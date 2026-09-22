# Quickstart: Vercel Hardening

```bash
# Header config unit test
pnpm vitest run tests/unit/security-headers.test.ts

# Full gates
pnpm api:check
pnpm lint && pnpm typecheck
pnpm test
pnpm test:e2e        # opt-in specs stay skipped
pnpm build
pnpm audit --prod
pnpm licenses:check
pnpm performance:check

# Manual
curl -I http://localhost:3000/   # dev server shows the new headers
```

Manual flow:

1. `cp .env.example .env.local` with local values → `pnpm dev` → login flow
   still redirects to ZITADEL and back.
2. `curl -I` any route → `nosniff`, `DENY`, `strict-origin-when-cross-origin`,
   `frame-ancestors 'none'`, `connect-src 'self'`.
