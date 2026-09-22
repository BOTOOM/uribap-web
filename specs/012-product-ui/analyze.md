# Analyze: Product UI Redesign (Mesa)

## Consistency

- spec FR-001..FR-010 ↔ plan phases A–E ↔ tasks T001–T020: each requirement
  maps to at least one task; dashboard data sources are all existing
  endpoints (no contract drift).
- Every existing client mutation component is reused, not rewritten; only
  styling and placement change → no domain-logic duplication risk.
- `?week=` planner navigation keeps server rendering authoritative and
  shareable.

## Gaps resolved during analysis

- Root `/` was public foundation → moved under `(app)` guard; unauth users
  land on `/login` (matches reference where login precedes the app).
- `forecast/demand` without plan → treated as empty state, not error.
- Pending shopping badge: render only when count >0 to avoid noise.

## Risks (tracked)

- Large CSS surface rewrite → mitigated by porting the reference verbatim
  and adapting names to existing tokens.
- jsdom tests asserting `foundation-*` classes → updated in T017.
- Mobile nav + dialogs + sheet stacking contexts → z-index scale fixed in
  tokens (`--z-nav`, `--z-sheet`, `--z-fab`, `--z-toast`, `--z-dialog`).

## Ready

Spec, plan, tasks and checklist are internally consistent; implementation
may proceed.
