# Web Foundation Boundary Contract

## Route groups

- `(public)`: non-authenticated entry/placeholder route; no private data.
- `(app)`: authenticated route group reserved for household product views.
- Shared root error/loading/not-found boundaries exist for every route group.

## API client generation

Input: `contracts/uribap-api.openapi.json` pinned to an API commit/tag.

Output: generated TypeScript types and a typed fetch client under `src/lib/api/generated/`.

Validation:

1. Fetch or update the snapshot deliberately.
2. Run generation.
3. Run TypeScript and contract checks.
4. Fail when generated output differs from the committed snapshot/metadata or when the contract
   is invalid.

## Request state contract

A consumer MUST map server state to one of `loading`, `empty`, `success`, `error`,
`unauthorized`, `forbidden`, `stale`, `conflict`, or `unavailable` where applicable. Raw server
stack traces, tokens, and secret values MUST never reach rendered output.

## Accessibility contract

Interactive controls MUST have semantic roles/names, visible focus, keyboard operation, and
reduced-motion behavior. Overlays return focus to their trigger and live regions announce only
meaningful state changes.
