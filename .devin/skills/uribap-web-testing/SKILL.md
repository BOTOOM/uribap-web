---
name: uribap-web-testing
description: Run the Uribap Web verification workflow for a feature, including component tests, API states, Playwright, accessibility, responsive behavior, performance, and Docker.
argument-hint: "[feature or scope]"
triggers:
  - user
  - model
allowed-tools:
  - read
  - grep
  - glob
  - exec
---

# Uribap Web Testing Workflow

Use this skill before declaring any Web feature complete. The active feature's `spec.md`,
`plan.md`, `tasks.md`, `.specify/memory/constitution.md`, and `AGENTS.md` are authoritative.

## Non-negotiable rules

- Do not modify application code, specs, tasks, lockfiles, or configuration while running this
  skill. Report proposed fixes separately.
- Do not use production sessions, tokens, identity providers, or Brevo credentials in tests.
- Do not mark an interaction green only because a visual screenshot exists; verify semantics,
  keyboard operation, errors, reduced motion, and responsive behavior.
- Business calculations belong to FastAPI; Web tests must assert rendered API results/states, not
  duplicate forecast or inventory formulas.
- A feature cannot be reported green if a required browser, API contract, or local service was
  unavailable and the test was silently skipped.

## Required verification order

1. Read feature artifacts and map each FR/SC/user-story scenario to tests.
2. Validate static quality and client contract:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm api:check
   ```

3. Run component/state tests:

   ```bash
   pnpm test
   ```

4. Build and run local Docker health:

   ```bash
   pnpm build
   docker compose up -d --build
   docker compose ps
   ```

5. Run browser and accessibility checks:

   ```bash
   pnpm test:e2e
   pnpm test:a11y
   ```

   Required viewport coverage is 375, 768, 1024, and 1440px. Check no horizontal overflow,
   visible focus, skip links, dialog/menu focus return, semantic names, and reduced motion.

6. Run dependency/license/performance gates:

   ```bash
   pnpm audit --audit-level=high
   pnpm licenses:check
   pnpm performance:check
   ```

   `licenses:check` allows only the reviewed transitive LGPL libvips exception documented in
   `docs/security/dependency-policy.md`. The client chunk budget is 2MB unless the feature plan
   explicitly changes it.

## API and identity state testing

- For API unavailable/error tests, intercept or fail the local API request and assert safe
  `unavailable`/`error` copy, retry behavior, and no raw stack trace.
- For unauthorized/forbidden tests, use the local ZITADEL skill only after the identity spec is
  active. Do not fake production cookies or treat a missing login as an implementation detail.
- For local OIDC/email flows, run ZITADEL and its dedicated PostgreSQL plus Mailpit in Docker;
  inspect messages locally and never use external SMTP.
- For mutations, assert loading, stale/conflict, success, and rollback/recovery states.

## Report format

Return a table with command, result, viewport coverage, accessibility violations, audit findings,
chunk size, Web Vitals sample, Docker status, skipped tests, and unresolved task IDs. Distinguish
`PASS`, `FAIL`, and `NOT RUN`.
