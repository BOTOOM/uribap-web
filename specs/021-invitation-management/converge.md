# Convergence: Household Invitation Management

**Branch**: `devin/1791942362-invitation-management` | **Date**: 2026-10-14

## Delivered

- Pinned API contract to revision `c0386230a7b04176e86eaa0984b99a4d90c327e5`
  ([API PR #160](https://github.com/BOTOOM/uribap-api/pull/160), unmerged) with metadata v17 and
  regenerated `src/lib/api/generated/schema.ts` exposing `InvitationResponse.effective_status` and
  `InvitationResponse.delivery`.
- BFF proxies: `GET /api/households/{householdId}/invitations` (limit 100) in the existing route
  file and `DELETE /api/households/{householdId}/invitations/{invitationId}` in a new route file
  following the members pattern (`204`, shared `{ code, detail }` error mapping).
- `InvitationManagement` panel on `settings/household` for owner/admin: per invitation it shows
  email, Spanish role, effective-status badge (pendiente/vencida/aceptada/revocada), delivery
  outcome (enviada/fallida/cuenta existente/pendiente/sin enviar), and expiry date. `Reenviar`
  (`Reenviar en la app` for existing-account invitees) appears only on expired or failed-delivery
  rows; `Revocar` only on pending rows; both refetch the list and surface action errors.
- Component coverage for rendering, action enablement, resend/revoke flows, existing-account label,
  refetches, error alerts, empty and error states; contract and settings-route tests updated.

## Verification results

- `pnpm exec vitest run … InvitationManagement.test.tsx api-contract.test.ts`: 11/11 passed.
- `pnpm lint` (Biome): clean for changed files; 4 pre-existing warnings elsewhere.
- `pnpm typecheck` (`tsc --noEmit`): clean.
- `pnpm test`: 335/335 passed across 64 files (settings-route test updated for the new listing call).
- `pnpm api:check`: regenerated schema has no drift.
- `pnpm build`: production build succeeds.
- `cmp contracts/uribap-api.openapi.json` vs API branch `openapi/openapi.json`: identical.
- `git diff --check`: clean.
- `/uribap-web-testing`: not run — the full local identity stack (ZITADEL/PostgreSQL/Mailpit) and a
  deployed API carrying PR #160 are not available in this session; E2E coverage of this flow
  requires that environment.

## Pending

- API PR #160 must merge and deploy before this Web change ships; the Web PR stays a draft until
  then.
- The contract `cmp` target is the API feature branch, not API `main`; after the API merges, the
  pin can be re-pointed at the merged revision if it changes.
