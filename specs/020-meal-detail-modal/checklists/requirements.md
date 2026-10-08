# Requirements Checklist: Meal Detail Modal

**Purpose**: Review the feature requirements for completeness, consistency, accessibility, and testability before implementation.
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md)

## User journeys

- [x] CHK001 Plan-board detail opens only after a user activates a meal card.
- [x] CHK002 Home meal detail opens without navigating away from the home route.
- [x] CHK003 Day-picker behavior is distinct from meal selection.
- [x] CHK004 Empty/no-plan home states and a selected entry removed on refresh are covered.

## Data authority and scope

- [x] CHK005 Recorded completion labels are explicitly mapped to cooked, skipped, and pending states.
- [x] CHK006 Existing detail fetching/actions and the API contract are explicitly unchanged.
- [x] CHK007 Home date/loading behavior and the “Ver detalle” link are explicitly out of scope.
- [x] CHK008 UI selection state and the refresh key are defined without introducing persistence.

## Accessibility and responsive behavior

- [x] CHK009 The dialog has a programmatic name, close affordance, and keyboard dismissal.
- [x] CHK010 Home rows and plan cards use semantic, keyboard-operable controls with dialog intent.
- [x] CHK011 Visible focus, reduced motion, mobile safe area, scrolling, and footer reachability are requirements.
- [x] CHK012 Axe and responsive overflow checks have explicit test coverage.
- [x] CHK013 Closing restores focus to the originating trigger, or to the owning component's fallback if refreshed data removed it.

## Notes

- Every requirement is measurable and has a corresponding scenario, test, or implementation task.
- No open clarification item remains; the behavior is specified by the user's settled design.
