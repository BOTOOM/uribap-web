# Tasks: Recipe Lifecycle Web Controls

## Phase 1: Specification and API contract

- [x] T001 Complete feature specification, implementation plan, checklist, tasks, analysis, and quickstart.
- [x] T002 Pin API revision `acc8c684e930ac62dee26fe0ce053e317f1d1a52`, schema version `v11`, and regenerate the Web client.

## Phase 2: Client regression coverage

- [x] T003 Add `RecipeEditDialog` tests for metadata-only updates, draft/published revisions, combined changes, and error rendering.
- [x] T004 Add archive/restore confirmation tests and verify `NewVersionButton` uses `POST /revisions` with `publish:false`.

## Phase 3: BFF and recipe lifecycle UI

- [x] T005 Add authenticated PATCH, revisions, archive, and unarchive BFF handlers.
- [x] T006 Implement edit/archive dialogs and update draft creation to use the revisions endpoint.
- [x] T007 Update recipe detail/list pages for archived state, read-only behavior, the archive filter, and responsive action wrapping.

## Phase 4: Verification and convergence

- [x] T008 Run the documented install, lint, typecheck, test, API generation, and build gates; resolve failures caused by this feature.
- [x] T009 Record quickstart evidence, complete convergence notes, commit and push the feature branch.
- [x] T010 Resolve the visual-review environment request; setup was removed from scope by the follow-up and was not left running.
