# Data Model: Household Memory Settings

The API remains authoritative. Web components use these DTOs from the generated OpenAPI schema and do not introduce persistence or transform ownership/version semantics.

## Memory

An API memory is either household-scoped (`diner_id: null`) or associated with one diner.

| Field | API shape | Web behavior |
|---|---|---|
| `id` | UUID string | Stable key for edits and forget requests |
| `diner_id` | UUID string or null | Determines household card vs. diner card |
| `kind` | `like`, `dislike`, `restriction`, `goal`, `note` | Drives grouping, order, and Spanish label |
| `content` | String, 1–1000 characters | Rendered as supplied; editable without logging |
| `version` | Integer | Sent as `expected_version` on PATCH |
| `archived_at` | Timestamp or null | Active profile memories are displayed |

`MemoryCreate` requires `kind` and `content`; `diner_id` is nullable/optional. `MemoryUpdate` requires `expected_version` and may update `kind` or `content`. The settings UI does not move a memory between owners.

## Diner

| Field | API shape | Web behavior |
|---|---|---|
| `id` | UUID string | Stable card key and route segment |
| `display_name` | String, 1–80 characters | Required when adding; editable when renaming |
| `member_user_id` | UUID string or null | Optional link to an active unlinked member |
| `version` | Integer | Sent as `expected_version` when renaming |
| `archived_at` | Timestamp or null | Archive removes diner from active profile use |

`DinerCreate` requires `display_name` and optionally accepts `member_user_id`. `DinerUpdate` requires `expected_version`; rename submits the new display name. Diner deletion is an API archive operation and returns 204.

## Household memory profile

`HouseholdMemoryProfile` contains:

- `household`: an array of household-scoped `MemoryResponse`.
- `diners`: an array of objects containing one `DinerResponse` and that diner’s memory array.

The page preserves this ownership and groups memories by kind. Household groups follow API profile order; diner groups use the required UI order: restriction, dislike, like, goal, note.

## Active household member

The server page loads active membership choices using the existing household settings pattern. A user already linked to a diner is excluded from the optional selector. The browser receives only display data and member IDs needed for selection; authentication credentials stay server-side.

## Mutation lifecycle

- POST create: new idempotency key for each submit; API returns 201 and the new DTO.
- PATCH update: submit `expected_version`; API returns 200 or a problem response, notably 409 for a stale version.
- DELETE forget/archive: require confirmation; API returns 204 and no response body.
- 404/409 indicate stale UI state and trigger profile refresh; 422 is associated with the relevant form; 403 remains a visible permission error.
