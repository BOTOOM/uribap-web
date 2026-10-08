# Data Model: Meal Detail Modal

This feature adds no persisted or API data model. It uses transient client state and server-projected values only.

## UI State

### `MealDetailTarget`

Identifies the currently open meal detail:

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | Current plan-entry ID |
| `outcome` | `"cooked" \| "skipped" \| null` | Recorded completion outcome, or pending |
| `completionVersion` | `number \| null` | Current recorded completion version, or none |

`null` as the component target means the dialog is closed. The detail refresh key is derived from the target as `${id}:${outcome ?? "pending"}:${completionVersion ?? "none"}`.

### Plan-board selection

- `selectedId: string | null` starts as `null`.
- A meal-card activation sets the ID; a day-picker activation only changes `activeDay`.
- The dialog target is derived from the currently supplied entries, not cached entry data.
- If the selected ID is absent from the latest entries, the derived target is `null`; a stale detail is not rendered.
- Dismissing the dialog clears `selectedId`.

### Home-list selection

- `selectedId: string | null` starts as `null`.
- A row activation sets the ID.
- The target is derived from the current projected `rows`, so updated completion metadata is passed into the shared dialog and its refresh key.
- Missing/nullable plan metadata or no rows means the empty label is rendered and no dialog target exists.
- Dismissing the dialog clears `selectedId`.

### Server-projected `HomeMealRow`

Each home row is a presentation projection of an existing plan entry:

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | Existing entry ID |
| `mealLabel` | `string` | Localized meal type label |
| `recipeName` | `string` | Existing recipe name |
| `servings` | `number` | Existing servings |
| `outcome` | `"cooked" \| "skipped" \| null` | Only a recorded completion outcome |
| `completionVersion` | `number \| null` | Recorded completion version, or none |

No outcome or completion metadata is persisted by the client.
