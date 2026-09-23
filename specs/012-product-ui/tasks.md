# Tasks: Product UI Redesign (Mesa)

## Phase A — Design system

- T001 Port reference tokens to `src/styles/tokens.css` and rewrite
  `src/app/globals.css` as the mesa component layer with breakpoints
  1100/820/480 and reduced-motion guard.
- T002 Wire Newsreader/Manrope/IBM Plex Mono via `next/font/google` in the
  root layout; set `lang="es"` metadata and theme-color.
- T003 Add `date-fns`; create `Icon` wrapper over `@phosphor-icons/react`
  plus brand mark and Bloub blob SVG components.

## Phase B — Shell

- T004 Rebuild `AppShell`: sidebar (brand, icon nav, household footer),
  topbar (Spanish date crumb + member avatar), client `ShellNav` with
  `aria-current`, mobile bottom nav + `MobileMoreSheet`.
- T005 `ToastRegion` + `AssistantFab` (real next-task / shopping / expiring
  data) with open/close, Escape and outside-click handling.

## Phase C — Pages

- T006 Dashboard `/` inside `(app)`: today/tomorrow meals, forecast,
  shopping, completion, reminder sections; delete public foundation page and
  `features/foundation` remnants.
- T007 `/plan`: week toolbar with `?week=` navigation, 7-day `week-grid`,
  meal cards, empty-week state, impact panel, transition bar, entry dialog.
- T008 `recetas` list (+search/chips/favorite), `recetas/[id]` detail with
  servings control and ingredient table, `recetas/nueva` form.
- T009 `inventario` + `ingredientes`: rows with real/projected, tabs,
  movement history, lot/adjustment forms.
- T010 `compra`: grouped `shopping-item` rows with animated check, reasons,
  purchase/restore/skip actions.
- T011 `preparacion`: timeline groups, task icons, complete/cancel/manual
  forms.
- T012 `forecast`: demand table in the new card/row language.
- T013 `settings/household`: members `partner-card`s, invitation form,
  activity feed, preferences, danger/sign-out rows.
- T014 `login`, `onboarding`, `invitations/accept`, `auth-error`, `error`,
  `not-found`, `loading` restyled to the auth/reference patterns.

## Phase D — States & polish

- T015 Audit every surface for loading/empty/error/permission/conflict
  states and skeletons.
- T016 Responsive pass at 375/768/1024/1440 + reduced-motion + keyboard
  sweep; fix overflows.

## Phase E — Verification & docs

- T017 Update/add component + a11y tests for changed UI.
- T018 Chrome walkthrough of all journeys incl. edge cases; write
  `docs/journeys/*.feature` after each pass.
- T019 Local runbook update (services, demo user, Mailpit).
- T020 Full gates + build; PR with before/after screenshots.
