# Quickstart: Web Foundation

## Prerequisites

- Node.js 24 LTS-compatible runtime
- pnpm
- Docker Engine and Docker Compose for container validation
- A pinned API contract snapshot in `contracts/`

## Start locally

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open the documented local URL and inspect the foundation shell at desktop and mobile widths.

## Validate quality

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:a11y
pnpm test:e2e
pnpm build
pnpm api:generate
pnpm api:check
```

Expected results: no type/lint errors, representative component and accessibility tests pass,
Playwright can open the shell at all required widths, production build succeeds, and API client
generation produces no diff.

## Container validation

```bash
docker compose up --build -d
curl -fsS http://localhost:3000
```

The container must serve the same shell without secrets or food/product images.

## Manual checks

1. Navigate with keyboard only and verify visible focus.
2. Open/close every foundation overlay and verify focus return.
3. Enable reduced motion and verify state changes remain understandable.
4. Test 375, 768, 1024, and 1440px widths for overflow and hierarchy.
5. Simulate API unavailable/error/empty states and confirm safe copy/retry behavior.
