# Tasks: Preparation Web

- [x] T001 [P] Complete analyze/checklist traceability in `specs/008-preparation/analyze.md` and `traceability.md`.
- [x] T002 Sync API 008 OpenAPI snapshot/generated schema and pin the API revision in `contracts/metadata.json` + workflow `ref`. (`preparation-bd7bff0`, `v8`)
- [x] T003 Add BFF route handlers under `src/app/api/preparation-tasks/` (POST create, `/{taskId}/{action}` complete/cancel with forwarded `Idempotency-Key`).
- [x] T004 Replace `/preparacion` placeholder with the task page plus `src/components/preparation/` (`ManualTaskForm`, `PreparationTaskActions`, pending/resolved sections, overdue badge, empty/error states).
- [x] T005 Add state/a11y/responsive/E2E tests in `tests/component/preparation/` (7), `tests/accessibility/preparation.a11y.test.tsx` (3), and `e2e/preparation.spec.ts` (opt-in).
- [x] T006 Run Web gates and record `specs/008-preparation/quickstart.md`.
- [x] T007 Write `specs/008-preparation/converge.md`.
