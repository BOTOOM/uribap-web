# Data Model: Web Foundation

The Web foundation models UI contracts and boundaries, not persistent business data. Household,
recipe, inventory, forecast, shopping, and preparation entities remain API-owned.

## Application Shell

- `routeGroup`: public or authenticated product route boundary.
- `navigationItem`: label, icon, target, active state, and mobile visibility.
- `contentRegion`: page title, description, primary action slot, and live-status region.

## Design Token Set

- `surface`: page, elevated, control, projected, and overlay surfaces.
- `foreground`: primary, secondary, tertiary, and muted text.
- `semantic`: brand/accent, available, warning, missing, frozen, projected, success, destructive.
- `geometry`: spacing scale, radii, borders, focus ring, elevation.
- `typography`: display/body/label/mono roles and tabular numeric treatment.
- `motion`: duration/easing, reduced-motion behavior, and allowed properties.

## UI Primitive Contract

Every stateful primitive defines:

- semantic element and accessible name;
- keyboard/focus behavior;
- default, hover, focus, active, disabled, loading, error and selected states as relevant;
- mobile hit area and responsive behavior;
- reduced-motion behavior.

## API Contract Snapshot

- `sourceRevision`: API repository commit/tag.
- `schemaVersion`: `/api/v1` contract version.
- `generatedAt`: reproducible generation metadata excluded from semantic diff where necessary.
- `types/client`: generated artifacts; hand-written business DTO duplicates are not allowed.

## View State

`idle`, `loading`, `empty`, `success`, `error`, `unauthorized`, `forbidden`, `stale`, `conflict`,
and `unavailable`. Each state maps to content, action, accessibility announcement, and retry/
recovery behavior where applicable.
