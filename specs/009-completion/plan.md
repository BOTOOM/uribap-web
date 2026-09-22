# Implementation Plan: Meal Completion Web Experience

## Stack layers

1. **Spec** — this artifact set.
2. **Contract** — `pnpm api:sync` against the API service branch; metadata
   `schemaVersion: v9`, `apiRevision: completion-*`; workflow `ref` pinned to the
   API stack SHA during development, restored to `main` in the cleanup PR.
3. **UI** — BFF routes for complete/correct/reopen, plan-page integration
   (complete affordance on approved entries, completions section), component +
   e2e + a11y coverage.

## Key decisions

- Completion UI lives on `/plan` — completions belong to plan entries, so no new
  top-level page; a `Completadas` section lists active/reopened completions for
  the current plan.
- Complete defaults to planned amounts (empty `lines` body); an expandable line
  editor MAY let members adjust actuals before submitting — kept minimal.
- Correct and reopen are inline controls on each completion card; both send
  `expected_version` and route 409 to the shared conflict/reload affordance.
- No new navigation entry; `/plan` remains the single planning surface.

## Models

- Architecture: `gpt-5-6-luna-high`; implementation: `gpt-5-6-sol-high`;
  auth/accessibility review: `gpt-5-6-terra-high`; bounded fixes: `swe-2-high`.
