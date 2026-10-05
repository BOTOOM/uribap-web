# Web BFF Contract: Household Memory

The API 018 OpenAPI snapshot in `contracts/uribap-api.openapi.json` is the upstream contract. The browser talks only to same-origin Web routes. Each handler uses `serverHouseholdFetch` so active household resolution and `X-Household-ID` stay server-side.

| Web route | Method | Upstream API path | Request forwarding | Success |
|---|---|---|---|---|
| `/api/memory/profile` | GET | `/memory/profile` | No body | Preserve profile response and status |
| `/api/diners` | POST | `/diners` | JSON body and `Idempotency-Key` | Preserve 201 and diner response |
| `/api/diners/{dinerId}` | PATCH | `/diners/{diner_id}` | JSON including `expected_version` | Preserve 200 and diner response |
| `/api/diners/{dinerId}` | DELETE | `/diners/{diner_id}` | No body | Empty 204 |
| `/api/memories` | POST | `/memories` | JSON body and `Idempotency-Key` | Preserve 201 and memory response |
| `/api/memories/{memoryId}` | PATCH | `/memories/{memory_id}` | JSON including `expected_version` | Preserve 200 and memory response |
| `/api/memories/{memoryId}` | DELETE | `/memories/{memory_id}` | No body | Empty 204 |

For upstream problem responses, preserve HTTP status and problem detail. Relevant statuses are 401, 403, 404, 409, and 422. Do not log request bodies, memory content, authorization data, or cookies.
