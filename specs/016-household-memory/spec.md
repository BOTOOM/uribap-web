# Feature Specification: Household Memory Settings

**Feature Branch**: `devin/1790823174-household-memory`

**Created**: 2026-10-01

**Status**: Ready for implementation

**Input**: Present household and diner memories from API feature 018 in a settings page where household members can review and manage them.

## User Scenarios & Testing

### User Story 1 - Review household and diner memories (Priority: P1)

A household member opens “Memoria” to understand what Uribap and its agents remember for meal suggestions. Household-wide memories appear under “Todo el hogar”; each diner has a separate card showing its linked account state and memories in a predictable, labeled order. Restrictions are unmistakable without relying on color alone.

**Why this priority**: The feature exists to make durable household and personal context visible and trustworthy before it is used for suggestions.

**Independent Test**: Render household memories, two diner profiles, and a linked account; verify grouping, ordering, Spanish labels, restriction emphasis, and the linked chip.

**Acceptance Scenarios**:

1. **Given** a household profile has household memories and diner memories, **When** a member opens “Memoria”, **Then** all profile memories are shown in the household or correct diner card.
2. **Given** a diner has memories of multiple kinds, **When** its card renders, **Then** memories follow restriction, dislike, like, goal, note order with the labels “Restricción”, “No le gusta”, “Le gusta”, “Objetivo”, and “Nota”.
3. **Given** a diner has a restriction, **When** its card renders, **Then** the restriction is visually emphasized and includes its textual “Restricción” label.
4. **Given** a diner is associated with a household member, **When** its card renders, **Then** it includes the “cuenta vinculada” chip.
5. **Given** the household has no diners and no memories, **When** the page renders, **Then** a helpful empty state explains memory and diner setup and both creation forms remain available.

### User Story 2 - Add, edit, and forget memories (Priority: P1)

A member can add a household-wide or diner-specific memory, change its content and kind, or forget it after confirmation. The interface clearly reports validation, permission, conflict, and gone-record outcomes, and refreshes from the server after successful or stale mutations.

**Why this priority**: Members need direct control over the information used to personalize suggestions.

**Independent Test**: Add a memory and verify the idempotency header; edit it and verify optimistic versioning; exercise validation, conflict, permission, gone-record, and forget-confirmation flows.

**Acceptance Scenarios**:

1. **Given** a household or diner card, **When** a member submits a valid kind and content, **Then** the memory is created once and appears after server data refresh.
2. **Given** a memory, **When** a member changes its kind or content and saves, **Then** the update includes the memory’s expected version and refreshed content is displayed.
3. **Given** a member chooses “Olvidar”, **When** they decline confirmation, **Then** the memory remains; **when** they confirm, **Then** it is removed from the refreshed profile.
4. **Given** a save conflicts with a newer version, **When** the server returns 409, **Then** an accessible conflict message appears and the page refreshes without silently overwriting newer data.
5. **Given** a record has been removed or a field is invalid, **When** the server returns 404 or 422, **Then** the UI refreshes stale data or associates the validation error with the relevant field.

### User Story 3 - Manage diner profiles (Priority: P2)

A member can add a diner, optionally link it to an active household member who is not already linked, rename an existing diner, or archive it. Archiving requires confirmation and explains that its memories will no longer be used.

**Why this priority**: Diner-specific memory is useful only when household members can maintain the people it belongs to.

**Independent Test**: Add and rename a diner, verify that linked members are selectable once, then confirm and cancel archive actions and verify accessible status and server refresh.

**Acceptance Scenarios**:

1. **Given** active household members with and without diner links, **When** the add-person form opens, **Then** only members not already linked are selectable.
2. **Given** a valid display name and optional member, **When** a member adds a diner, **Then** the diner appears in its own card after refresh.
3. **Given** a diner, **When** a member renames it, **Then** the update uses its expected version and the displayed name refreshes.
4. **Given** a member chooses to archive a diner, **When** they confirm, **Then** the diner is archived; the confirmation explains its memories stop being used.

## Requirements

### Functional Requirements

- **FR-001**: The settings page MUST have the “Memoria del hogar” heading, introduce the feature with “Lo que Uribap y tus agentes recuerdan para sugerir comidas.”, and provide a “Memoria” navigation entry.
- **FR-002**: The page MUST render household-scoped memories in a “Todo el hogar” card and diner-scoped memories in one card per diner.
- **FR-003**: Diner memory groups MUST be ordered restriction, dislike, like, goal, note and use the Spanish labels specified in User Story 1.
- **FR-004**: Restriction memories MUST use an existing accent or danger treatment and retain a visible text label.
- **FR-005**: Each memory MUST support inline editing of content and kind with the current expected version, plus an “Olvidar” action that requires confirmation.
- **FR-006**: Every household or diner card MUST provide an add-memory form with a kind selector, content limit of 1–1000 characters, and a visible character counter.
- **FR-007**: The add-person form MUST require a display name of 1–80 characters and optionally link an active household member not already linked to another diner.
- **FR-008**: Diner cards MUST support rename and confirmed archive; archive confirmation MUST explain that archived diner memories stop being used.
- **FR-009**: The page MUST explain the no-diner/no-memory state and keep both add-memory and add-person forms available.
- **FR-010**: Authenticated reads and mutations MUST use the server-side household BFF boundary and the active household membership; the browser MUST NOT receive session credentials.
- **FR-011**: Memory and diner POST requests MUST carry a fresh `Idempotency-Key`; updates MUST send the server-provided expected version.
- **FR-012**: Mutations MUST expose pending and accessible result states, render field validation, show 409 conflicts, treat 404 records as gone, preserve permission errors, and refresh server data after success or stale state.
- **FR-013**: Interactive forms and confirmations MUST be keyboard-operable with visible focus; primary controls MUST provide touch targets of at least 44px where practical; status/error feedback MUST be announced; motion MUST respect reduced-motion preferences.
- **FR-014**: Layouts MUST remain usable without horizontal overflow at 375px, 768px, 1024px, and 1440px.
- **FR-015**: Memory content MUST NOT be written to browser or server console logs.

### Key Entities

- **Household memory**: A memory with no diner association, scoped to the active household and categorized as like, dislike, restriction, goal, or note.
- **Diner**: A household-scoped person profile with a display name, optional active household-member link, version, and associated memories.
- **Diner memory**: A categorized memory associated with one diner and managed independently from household-wide memories.
- **Household member**: An active member eligible for a diner link only when not already linked to another diner.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every memory returned in the profile is displayed exactly once under its household or diner owner, with each diner’s five supported kinds in the required order.
- **SC-002**: A member can complete add, edit, forget, add-person, rename, and archive flows using keyboard-accessible controls and receives visible, announced outcomes.
- **SC-003**: The memory page and forms fit 375px, 768px, 1024px, and 1440px viewports without horizontal overflow.
- **SC-004**: Conflict, validation, permission, and gone-record responses are distinguishable and never silently presented as successful saves.
- **SC-005**: No memory content is included in console output or logs.

## Assumptions

- API feature 018 on `devin/1790821649-household-memory` is the authoritative implementation and contract; this Web feature does not modify API behavior.
- `/memory/profile` returns household memories and diner profiles with each diner’s memories; active household members are loaded server-side for optional linking.
- Existing authenticated BFF, shell navigation, design tokens, and UI confirmation patterns are reused.
- The `devin models list` CLI is unavailable in this environment. The lead accepted the same documented exception used by feature 014: use the Web AGENTS.md model matrix IDs without claiming live verification.

## Out of Scope

- Changing API 018 endpoints, persistence, authorization, or memory semantics.
- Showing or editing archived diner profiles.
- Sending memory content to a browser LLM, adding agent settings, or introducing new storage.
