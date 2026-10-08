# Component Props Contract: Meal Detail Modal

These are internal Web component contracts. They do not change the OpenAPI or BFF contract.

## `MealDetailTarget`

```ts
export type MealDetailTarget = {
  id: string;
  outcome: "cooked" | "skipped" | null;
  completionVersion: number | null;
};
```

The dialog is closed when `target` is `null`. The current target is derived from the latest plan entries or home rows.

## `MealDetailDialog`

```tsx
export function MealDetailDialog(props: {
  planId: string;
  planState: MealPlanState;
  version: number;
  target: MealDetailTarget | null;
  onClose: () => void;
  fallbackFocus?: () => HTMLElement | null;
}): JSX.Element;
```

- `planId`, `planState`, and `version` are the existing plan context consumed by `MealEntryDetail`.
- `target` controls `Dialog.open`; a missing target renders no detail request.
- `onClose` clears selection in the owning client component.
- On close, focus returns to the most recent target's `data-meal-entry-trigger` if it remains in the DOM. If it was removed, `fallbackFocus` supplies the owning board's active day selector or that HomeMealList's own `.meal-list` container; if no focus target exists, default dialog behavior is preserved.
- The child `MealEntryDetail` receives the target ID and refresh key `${id}:${outcome ?? "pending"}:${completionVersion ?? "none"}`.
- The dialog title is “Detalle de la comida”; the existing `MealEntryDetailView` retains the visible recipe heading.

## `HomeMealList`

```tsx
export type HomeMealRow = {
  id: string;
  mealLabel: string;
  recipeName: string;
  servings: number;
  outcome: "cooked" | "skipped" | null;
  completionVersion: number | null;
};

export function HomeMealList(props: {
  planId: string | null;
  planState: MealPlanState | null;
  planVersion: number | null;
  emptyLabel: string;
  rows: HomeMealRow[];
}): JSX.Element;
```

- Each row is a button with `aria-haspopup="dialog"` and preserves the current home meal-row layout.
- A null plan context renders `emptyLabel` without an interactive dialog. With a plan but no rows, the list keeps its scoped `.meal-list` fallback container around the empty label; no dialog can open.
- Each row exposes `data-meal-entry-trigger={row.id}`. The local `.meal-list` container is programmatically focusable for deleted-row focus restoration and is not a sequential tab stop.
- `outcome === "cooked"` renders “Cocinada” with the completed/check treatment; `"skipped"` renders neutral “Domicilio”; `null` renders available “Planeada”.
- Activating a row opens its existing detail without changing routes.

## Server projection

The server page supplies only recorded completion outcomes and versions. Other completion states are not used to label the row. Existing plan loading, dates, route navigation, and API response types remain unchanged.
