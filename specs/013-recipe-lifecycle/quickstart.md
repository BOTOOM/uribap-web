# Quickstart: Recipe Lifecycle Web Controls

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm api:check
pnpm build
```

Use the API OpenAPI snapshot from revision `acc8c684e930ac62dee26fe0ce053e317f1d1a52`. Verify metadata-only edits, published and draft revisions, archive confirmation, restore, and cloned draft creation. For local visual review, inspect `/recetas` and recipe detail pages with one published recipe, one draft, and one archived recipe at 375, 768, 1024, and 1440 pixel widths. The GitHub contract compatibility comparison against API `main` remains expected to fail until PR #149 merges.

## Validation record (2026-09-29)

- `pnpm install --frozen-lockfile` and `pnpm api:generate` completed successfully.
- `pnpm lint`, `pnpm typecheck`, `pnpm api:check`, and `pnpm build` passed.
- `pnpm test` passed: 34 files, 155 tests.
- Full command details and scope notes are in `converge.md`.
