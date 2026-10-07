# Time-zone Requirements Checklist: Browser-local dashboard date

**Purpose**: Review whether date-boundary, fallback, and consistency requirements are complete and testable
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md)

## Time-zone authority

- [x] CHK001 Is a valid browser time zone via `uribap_tz` the primary date authority? [Spec §FR-001]
- [x] CHK002 Is the household time zone explicitly a fallback used only when the browser cookie is absent or invalid? [Spec §FR-004]
- [x] CHK003 Is first-visit behavior defined as household fallback followed by client cookie write and refresh? [Spec §FR-006]

## Date-window consistency

- [x] CHK004 Are today, tomorrow, week start, and week end required to derive from one selected-zone date? [Spec §FR-002, §FR-003]
- [x] CHK005 Does acceptance verify browser precedence over a different household zone for meal grouping and query windows? [Spec §User Story 1]
- [x] CHK006 Is Sunday-to-Monday week selection behavior explicitly covered for the selected date? [Spec §Edge Cases]

## Failure and recovery

- [x] CHK007 Is the fallback order browser cookie → household time zone → UTC defined? [Spec §FR-004, §FR-005]
- [x] CHK008 Are malformed cookie encoding and invalid time-zone values guarded without throwing? [Contract §Output behavior]
- [x] CHK009 Does fallback preserve dashboard availability without hiding unrelated section failures? [Spec §FR-006, §User Story 2]

## Regression evidence

- [x] CHK010 Does automated coverage require the concrete Tokyo/Bogota UTC boundary? [Spec §FR-008, §SC-002]
- [x] CHK011 Are unchanged visual behavior and isolated client cookie synchronization explicitly bounded? [Plan §Constitution Check, Contract §Non-goals]
- [x] CHK012 Are measurable outcomes sufficient to determine that the original defect is fixed? [Spec §Success Criteria]

## Notes

- The browser-first order and first-visit fallback are the user-approved date policy for this feature.
- Checklist content was revised with that approved policy; implementation evidence is recorded in `tasks.md`.
