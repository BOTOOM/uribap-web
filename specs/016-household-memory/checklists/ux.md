# UX Requirements Checklist: Household Memory Settings

**Purpose**: Unit tests for the clarity and coverage of household-memory requirements
**Created**: 2026-10-01
**Feature**: [spec.md](../spec.md)
**Review Ownership**: Reviewer-owned; unchecked items require reviewer evaluation.

## Requirement Completeness

- [ ] CHK001 Does the specification define how household-wide memories are distinguished from diner memories? [Completeness, Spec §FR-002]
- [ ] CHK002 Are all five supported memory kinds and their display order specified? [Completeness, Spec §FR-003]
- [ ] CHK003 Does the specification require a textual “Restricción” label in addition to visual emphasis? [Completeness, Spec §FR-004]
- [ ] CHK004 Are all required memory and diner actions specified for the correct card or form? [Completeness, Spec §FR-005–FR-009]

## Requirement Clarity

- [ ] CHK005 Are the content and display-name limits, required fields, and optional member link unambiguous? [Clarity, Spec §FR-006–FR-007]
- [ ] CHK006 Are confirmation actions and their consequences described in user-facing terms? [Clarity, Spec §FR-005, FR-008]
- [ ] CHK007 Are the “Memoria del hogar” heading, specified Spanish labels, and intro copy exact and consistent across scenarios? [Clarity, Spec §FR-001, FR-003]

## Requirement Consistency

- [ ] CHK008 Do the ownership, server-fetch, and BFF requirements preserve the API’s active-household boundary? [Consistency, Spec §FR-010]
- [ ] CHK009 Do stale-state requirements agree across conflict, gone-record, validation, permission, and refresh behavior? [Consistency, Spec §FR-012]

## Acceptance Criteria Quality

- [ ] CHK010 Can each success criterion be checked without relying on an undefined qualitative judgment? [Measurability, Spec §Success Criteria]

## Scenario Coverage

- [ ] CHK011 Are the first-visit empty state and both creation forms explicitly covered? [Coverage, Spec §US1, FR-009]
- [ ] CHK012 Are add, edit, forget, create-person, rename, and archive journeys independently testable? [Coverage, Spec §US2–US3]

## Non-Functional Requirements

- [ ] CHK013 Are keyboard operation, visible focus, practical 44px touch targets, announced results, reduced motion, and all four responsive viewport widths explicit? [Completeness, Spec §FR-013–FR-014]
- [ ] CHK014 Is the prohibition on logging memory content explicit and scoped to the full Web flow? [Security, Spec §FR-015]

## Dependencies and Assumptions

- [ ] CHK015 Is API 018 identified as the authority, with Web-side API changes explicitly out of scope? [Dependency, Spec §Assumptions, Out of Scope]
- [ ] CHK016 Is the accepted model-list-unavailable exception clearly distinguished from live model verification? [Assumption, Spec §Assumptions]

## Ambiguities and Conflicts

- [ ] CHK017 Are any remaining ambiguities or contradictions explicitly listed rather than left implicit? [Gap, Spec §Requirements]
