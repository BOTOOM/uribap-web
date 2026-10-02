# Research: Household Memory Settings

## Decisions

### Use the API 018 profile and write endpoints as the only source of memory state

- **Decision**: Read `/memory/profile` for household and diner records; submit creates and edits through the API 018 diner/memory operations behind Web BFF routes.
- **Rationale**: The API branch is the authoritative source for scope, versioning, memory kinds, and archived state. Its pinned OpenAPI JSON was parsed for paths, request schemas, response schemas, and statuses.
- **Alternatives considered**: Duplicating household/diner list calls in the browser was rejected because profile already supplies the page’s data and the authenticated household must remain server-resolved.

### Keep authentication and household selection inside the BFF

- **Decision**: Use `serverHouseholdFetch` from all route handlers and follow the Server Component active-membership pattern for initial reads.
- **Rationale**: The helper resolves active membership and injects `X-Household-ID`; existing settings pages and route handlers already use this boundary.
- **Alternatives considered**: Client calls to the API were rejected because they would expose credentials and move household selection into the browser.

### Preserve API status and optimistic-version behavior

- **Decision**: Forward POST bodies and idempotency keys, submit `expected_version` for PATCH, preserve problem status/detail, and return bodyless 204 for DELETE.
- **Rationale**: The API contract defines 201 creates, 200 updates, 204 archive/forget, and problem responses including 403, 404, 409, and 422.
- **Alternatives considered**: Mapping all API failures to 500 or optimistic local deletion was rejected because it would hide permission, validation, conflict, and stale-record outcomes.

### Use small client leaves and server refresh after mutations

- **Decision**: Keep profile loading in the Server Component; place forms and confirmations under `src/components/memory/`, then call `router.refresh()` on successful and stale responses.
- **Rationale**: This follows the Web constitution and keeps the persisted profile authoritative after every mutation.
- **Alternatives considered**: A client-owned page-level profile cache was rejected as extra state that could diverge from server data.

### Follow local testing and accessibility patterns

- **Decision**: Use existing Vitest/Testing Library patterns in `tests/component`, `tests/unit`, and `tests/accessibility`; gate authenticated E2E behind the same explicit environment-variable pattern as existing planning tests.
- **Rationale**: Local component accessibility suites use semantic Testing Library assertions; browser axe checks exist in Playwright. E2E requires an authenticated API stack and is intentionally opt-in.
- **Alternatives considered**: Starting an identity stack for this UI-only work was rejected because the design calls for a gated test and the preview is not authenticated.

### Model assignment follows the lead-approved exception

- **Decision**: Use Web AGENTS.md IDs `gpt-5-6-luna-high`, `gpt-5-6-sol-high`, `gpt-5-6-terra-high`, `glm-5-3-max`, and `swe-2-high`.
- **Rationale**: The lead explicitly accepted the same documented `devin models list` unavailable exception as feature 014.
- **Alternatives considered**: Installing an unavailable CLI or claiming live model verification was rejected.
