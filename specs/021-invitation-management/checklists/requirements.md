# Requirements Checklist: Household Invitation Management

**Purpose**: Review the completeness, clarity, consistency, and testability of invitation-management requirements.
**Created**: 2026-10-14
**Feature**: [spec.md](../spec.md)

**Note**: This custom checklist is a reviewer-owned requirements-quality review artifact. Mark an item `[x]` only when the reviewer determines the requirements-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the criterion has been reviewed and satisfied for requirements quality. It does not mean implementation work is complete.

## Requirement Completeness

- [x] CHK001 Does the spec cover listing every invitation with email, role, effective status, delivery outcome, and expiry? [Completeness, Spec §FR-001–003]
- [x] CHK002 Are the resend and revoke conditions and their post-action refresh behavior fully specified? [Completeness, Spec §FR-004–007]
- [x] CHK003 Are loading, empty, error, action-pending, and permission states addressed? [Completeness, Spec §FR-009; US1]

## Requirement Clarity

- [x] CHK004 Is it explicit that `effective_status` and `delivery` are API-computed and rendered verbatim? [Clarity, Spec §FR-010; Data Model]
- [x] CHK005 Is the resend path (reuse of create-invitation with `{ email }`) unambiguous? [Clarity, Spec §FR-005; Contracts]

## Requirement Consistency

- [x] CHK006 Are action enablement rules consistent across spec, data model, and contracts? [Consistency, Spec §FR-004/§FR-007; Data Model §Action Rules]
- [x] CHK007 Is the member-role restriction stated consistently for the panel and the API? [Consistency, Spec §FR-008; Contracts §Endpoints]

## Acceptance Criteria Quality

- [x] CHK008 Can each acceptance scenario be verified from rendered output and mockable API responses? [Measurability, Spec §SC-001–005]
- [x] CHK009 Are failure paths (listing failure, resend failure, revoke failure) each assigned observable behavior? [Measurability, Spec §SC-003/§SC-005]

## Scenario Coverage

- [x] CHK010 Do scenarios cover all four effective statuses and all delivery outcomes, including the absent-outbox case? [Coverage, Spec §US1; §FR-003]
- [x] CHK011 Is the existing-account resend path covered as a distinct acceptance scenario? [Coverage, Spec §US2 scenario 3]

## Edge Case Coverage

- [x] CHK012 Are empty listings, mid-session expiry, and resend-against-valid-pending rejections addressed? [Coverage, Spec §Edge Cases]

## Non-Functional Requirements

- [x] CHK013 Are role-based access and server-side credential boundaries stated without implementation conflict? [Security, Spec §FR-008/§FR-010]

## Dependencies and Assumptions

- [x] CHK014 Is the dependency on the unmerged API pull request and its deploy-before-Web ordering explicit? [Dependency, Spec §Assumptions; Plan §API Contract Sequence]

## Ambiguities and Conflicts

- [x] CHK015 Is it unambiguous that resend creates a new invitation row rather than mutating the listed one? [Ambiguity, Data Model §Action Rules]

## Notes

- The Web panel relies entirely on API-computed `effective_status`/`delivery`; reviewers should not
  expect local expiry math in requirements.
