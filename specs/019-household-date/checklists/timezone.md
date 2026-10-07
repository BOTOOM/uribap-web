# Time-zone Requirements Checklist: Household-local dashboard date

**Purpose**: Review whether date-boundary, fallback, and consistency requirements are complete and testable
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md)

## Household calendar authority

- [x] CHK001 Is the active household explicitly identified as the authority for the calendar date? [Spec §FR-001, §FR-004]
- [x] CHK002 Is browser-local time clearly excluded when it differs from the household time zone? [Spec §Assumptions]
- [x] CHK003 Is the behavior for households ahead of UTC covered as well as households behind UTC? [Spec §Edge Cases]

## Date-window consistency

- [x] CHK004 Are today, tomorrow, week start, and week end required to derive from one household-local date? [Spec §FR-002, §FR-003]
- [x] CHK005 Does the acceptance criteria verify both meal grouping and API query windows at a UTC boundary? [Spec §User Story 1]
- [x] CHK006 Is Sunday-to-Monday week selection behavior explicitly covered? [Spec §Edge Cases]

## Failure and recovery

- [x] CHK007 Is the fallback defined for missing membership, failed household lookup, and invalid time zone? [Spec §FR-005]
- [x] CHK008 Is account failure distinguished from household time-zone lookup failure? [Contract §Failure behavior]
- [x] CHK009 Does fallback preserve dashboard availability without hiding unrelated section failures? [Spec §FR-006, §User Story 2]

## Regression evidence

- [x] CHK010 Does automated coverage require the concrete Colombia/UTC boundary reported by the user? [Spec §FR-007, §SC-002]
- [x] CHK011 Are unchanged visual, accessibility, and client-bundle behaviors explicitly bounded? [Plan §Constitution Check, Contract §Non-goals]
- [x] CHK012 Are measurable outcomes sufficient to determine that the original defect is fixed? [Spec §Success Criteria]

## Notes

- Mark items only after reviewer assessment; implementation completion does not automatically satisfy this checklist.
