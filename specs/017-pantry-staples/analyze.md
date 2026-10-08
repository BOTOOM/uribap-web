# Specification Analysis Report

**Feature**: 017 — Pantry Staple Ingredients
**Analyzed**: 2026-10-06
**Inputs**: `spec.md`, `plan.md`, `tasks.md`, `contracts/pantry-staples.md`, `.specify/memory/constitution.md`

## Findings

| ID | Category | Severity | Location(s) | Summary | Resolution |
|---|---|---|---|---|---|
| A1 | Existing UI coverage | MEDIUM — RESOLVED | Ingredient catalog; `plan.md` Ingredient form and BFF | The current Web catalog has create-only UI and no ingredient update BFF route, while the requirement calls for an edit checkbox. | Add a minimal edit dialog for name, category, and pantry-staple state, backed by the existing API PATCH endpoint. Do not add dimension/base-unit editing. |
| A2 | API authority | HIGH — RESOLVED | Plan detail, forecast, `plan.md` projection labels | Deriving “finished” from client on-hand arithmetic would duplicate API inventory logic. | Use only `pantry_staple` and API-provided `shortfall_amount`; do not calculate stock or shopping quantities. |
| A3 | Global ingredient permissions | HIGH — RESOLVED | Ingredient table | The API keeps global ingredients read-only. | Show the edit action only when the response identifies a household-owned ingredient; retain global rows as read-only. |
| A4 | Completion copy | MEDIUM — RESOLVED | Plan detail | Existing cooked-state copy says all ingredients were deducted, which is inaccurate when a recipe includes pantry staples. | Update the explanation and keep staple state visible on recorded meal rows; verify both with component coverage. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---:|---|---|
| FR-001 | Yes | T001, T011 | Pin and verify generated v15 contract |
| FR-002 | Yes | T002, T006, T010 | Accessible create/edit checkbox and Spanish helper |
| FR-003 | Yes | T002, T006, T007 | Boolean payloads through BFF |
| FR-004 | Yes | T003, T008 | Badge and household-only edit action |
| FR-005 | Yes | T004, T009 | API-only plan-detail labels |
| FR-006 | Yes | T005, T009 | API-only forecast labels |
| FR-007 | Yes | T002–T005, T009, T011 | Existing labels/states preserved and covered |
| FR-008 | Yes | T004, T005, T009 | No client stock or shortfall calculations |
| FR-009 | Yes | T002, T003, T010 | Semantic text, form accessibility, and mobile-friendly styles |
| FR-010 | Yes | T004, T009 | Recorded-meal copy describes consumable-only deduction |
| SC-001 | Yes | T002, T006, T007 | Create/edit checkbox round trip |
| SC-002 | Yes | T003, T008 | Catalog state and read-only global rows |
| SC-003 | Yes | T004, T005, T009 | Plan and forecast projection coverage |
| SC-004 | Yes | T001, T011 | Generated contract check and byte comparison |
| SC-005 | Yes | T011 | Requested lint, typecheck, tests, and build |
| SC-006 | Yes | T004, T009 | Cooked-meal copy remains accurate |

## Constitution Alignment

- The API remains authoritative for pantry status and shortage.
- Authenticated ingredient mutations remain behind same-origin BFF routes.
- The checkbox has a visible label and described help; edit remains a semantic dialog.
- Plan and forecast state remains textually explicit and non-staple status is unchanged.
- The design does not introduce a business calculation or dependency.
- Next.js 16.3.6 Route Handler and Server/Client Component guidance was read from the installed documentation before implementation.

## Unmapped Tasks

None. Every implementation and verification task maps to a requirement or success criterion.

## Metrics

- Total functional requirements and buildable success criteria: **16**
- Total tasks: **12**
- Requirement coverage: **100%**
- Unresolved critical issues: **0**

## Next Actions

Proceed with API contract sync and tests before implementation. Keep the final contract byte comparison as the last Web-layer verification step.
