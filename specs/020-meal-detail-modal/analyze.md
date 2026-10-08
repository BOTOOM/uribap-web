# Analyze: Meal Detail Modal

## Gate

**Decision**: PASS — the specified design is implementable without an API contract change or a change to existing meal-detail behavior. Product code may begin after the documentation commit is ready.

## Traceability

| Requirement/scenario | Design element | Planned verification |
|---|---|---|
| FR-001 / SC-001: closed initial plan board and no initial detail request | `selectedId = null`; target is null until card activation | PlanBoard component test asserts no detail fetch/dialog on mount |
| FR-002, FR-004: card opens labelled dialog and selected state tracks open target | `MealDetailDialog`; card has `aria-haspopup="dialog"` | PlanBoard click-to-open component test |
| FR-003: day picker does not select a meal | Day callback changes only `activeDay` | PlanBoard day-picker component test |
| FR-005: keyboard and close-button dismissal | Existing Radix dialog wrapper with `DialogClose` | Escape and close-button component tests |
| FR-006: removed plan entry closes detail | Target is derived from latest entries | PlanBoard refreshed-entry component test |
| FR-007/FR-008: existing detail logic and refresh semantics | Shared `MealEntryDetail`; specified composite `refreshKey` | Existing detail tests plus plan/home detail fetch assertions |
| FR-009: home opens detail without navigation | Home row is a semantic button; client selection remains local | HomeMealList click test checks the detail endpoint |
| FR-010/FR-011: completion labels and source of truth | Server filters `state === "recorded"` and projects outcome/version | HomeMealList cooked/skipped/pending tests |
| FR-012: empty/no-plan behavior | Nullable plan context and empty-label branch | HomeMealList empty/no-plan test |
| FR-013/FR-016: preserve link/date logic and avoid unrelated edits | Minimal home page integration only | Diff review of the final home-page changes |
| FR-014/SC-004: accessible dialog | Hidden `DialogTitle`, close button, Radix keyboard behavior | Axe check against open dialog and close semantics |
| FR-015/SC-005/SC-006: responsive sheet, scrolling, no overflow | Existing 820px breakpoint, safe-area CSS, scrollable dialog | Updated gated E2E at 375px/1440px and rendered local preview |

## Design Review

- **Independent state**: Active day and selected entry are separate. No initial default selection remains.
- **Refresh correctness**: The modal does not own a snapshot of a row; its target derives from the latest entries/rows. Outcome and completion version changes update the existing detail refresh key.
- **No-plan behavior**: Nullable metadata is explicit and is never passed to `MealDetailDialog`; no synthetic ID or API request is possible.
- **Data authority**: Completion labels are projected from recorded API completions; no client-side outcome calculation is introduced.
- **Client/server boundary**: Home plan data remains in the Server Component; only opening/closing state and dialog interaction move to client leaves.
- **No contract impact**: No route, schema, generated type, or backend change is required.
- **Scope**: Home date/loading and other dashboard sections are untouched; the Mañana link remains present.
- **Accessibility**: Accessible name and close affordance are in the dialog head; existing Radix semantics provide modal/focus behavior; reduced-motion and visible focus are retained.
- **Responsive**: The content remains scrollable within the viewport, with mobile bottom-sheet safe-area padding and no duplicated detail-card chrome.
- **Preview safety**: The `/dev-preview/meal-modal` route is excluded by the auth proxy matcher and uses only static fixtures plus a local fetch mock.

## Resolved Findings

1. **Nullable HomeMealList plan context**: Resolved in `contracts/meal-detail-components.md`; an empty section cannot construct a valid detail dialog.
2. **Axe runner mismatch**: `tests/accessibility` is Vitest/jsdom, while `AxeBuilder` is browser-page-bound. Use the already locked axe-core version directly in the jsdom test; do not fake a Playwright page.
3. **Selected-entry refresh**: Resolve targets against current props; a missing ID yields a null target and closes the controlled dialog.

No unresolved design decision blocks implementation. Verify the axe-core/jsdom runtime during the focused test pass; if it lacks a required DOM API, report the exact failing rule/runtime rather than silently skipping the check.
