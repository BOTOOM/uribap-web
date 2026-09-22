# Implementation Plan: Product UI Redesign (Mesa)

## Context

Replace the spec-driven `foundation-*` presentation UI with the operational
household experience defined by `mesa-household-app.html` (reference visual
authority), keeping every API contract and mutation intact. All data remains
server-fetched; client components stay interactive leaves.

## Technical decisions

- **Design tokens**: port the reference `:root` verbatim into
  `src/styles/tokens.css` (`--fg` kept as `--foreground` alias for existing
  code) + semantic state colors, radii, shadows, easing.
- **Globals**: rewrite `globals.css` as the mesa component layer (`.card`,
  `.btn-*`, `.nav-item`, `.meal-card`, `.week-grid`, `.impact-panel`,
  `.inventory-row`, `.shopping-item`, `.timeline-*`, `.settings-row`,
  `.toggle`, `.chip`, `.tab`, `.field/.input/.select`, `.callout`, `.empty`,
  `.toast`, `.planner-*`, `.day-picker`, `.avatar`, `.partner-card`,
  `.auth-card`, `.steps`, `.dialog-*`, `.assistant-*`, `.state-bot`,
  `.skeleton`, `.inline-alert`, `.mobile-nav`, `.mobile-more-panel`) with the
  reference breakpoints (1100/820/480 px) and reduced-motion guard. Tailwind
  import stays for utilities used inside components.
- **Fonts**: `next/font/google` — `Newsreader` (opsz variable, display),
  `Manrope` (body), `IBM Plex Mono` (mono); CSS vars `--font-display`,
  `--font-body`, `--font-mono`.
- **Icons**: `@phosphor-icons/react` (already a dep) wrapped in a small
  `Icon` component; custom brand mark + `Bloub` blob SVG (MIT, per
  reference attribution note) for the assistant.
- **Motion**: CSS keyframes for nav/press/hover/enter; `motion` for dialog /
  panel transitions where CSS is insufficient. Everything under
  `prefers-reduced-motion`.
- **Dates**: add `date-fns` for week math (`startOfWeek`, `addWeeks`,
  `format`, `isSameDay`) in the planner; server computes the initial week,
  a client leaf owns offset navigation.
- **App shell**: server `AppShell` + client `ShellNav` (`usePathname` for
  `aria-current`), household footer with member initials, topbar date in
  Spanish, mobile `mobile-nav` + `MobileMoreSheet`, `AssistantFab` surfacing
  real data (next preparation task / pending shopping count / expiring
  lots), `ToastRegion` for mutation feedback.
- **Dashboard `/`**: move into `(app)` (delete the public root page);
  server-composed sections from `/plans/current`, `/forecast/demand`,
  `/shopping-lists/current`, `/preparation-tasks`, `/meal-completions`,
  `/me`. Each section tolerates partial failure independently.
- **Planner `/plan`**: `?week=YYYY-MM-DD` param; toolbar + week grid +
  per-day meal cards; existing `MealPlanEntryForm/Actions`,
  `MealPlanTransitionBar`, `CompleteMealButton`, `CorrectLineForm`,
  `ReopenCompletionButton` restyled into the meal cards and an entry dialog
  (`@radix-ui/react-dialog`).
- **Routes restyled**: `recetas` (list + `[recipeId]` + `nueva`),
  `ingredientes`, `inventario`, `forecast`, `compra`, `preparacion`,
  `settings/household`, `login`, `onboarding`, `invitations/accept`,
  `auth-error`, `error.tsx`, `not-found.tsx`, `loading.tsx`.
- **Gherkin**: `docs/journeys/*.feature` authored after each verified
  browser pass.

## Data sources for the dashboard

| Section | Endpoint |
| --- | --- |
| Today / tomorrow meals | `GET /plans/current?week_start=` (entries filtered by date) |
| Inventory forecast | `GET /forecast/demand` + `GET /inventory/lots` |
| Shopping summary | `GET /shopping-lists/current` |
| Recent completion | `GET /meal-completions` |
| Preparation reminder | `GET /preparation-tasks` |
| Members | `GET /me` + household members |

Partial failures degrade to a muted "no disponible" line, never a broken
page; a total API outage renders the dashboard error state.

## Testing

- Component tests for new presentational pieces (nav, week grid, dashboard
  sections, assistant states, toasts).
- Update existing component tests that assert old classes/labels.
- a11y spec rerun; new axe pass over dashboard + planner.
- Manual Chrome pass per `docs/journeys`; responsive checks at
  375/768/1024/1440; `prefers-reduced-motion` emulation.

## Risks

- Root `/` moving under the auth guard changes the public landing — accepted:
  the product starts at login/onboarding like the reference.
- `forecast/demand` may 404 without a plan — dashboard treats it as empty.
- Bundle budget: `date-fns` tree-shakes; `motion` already shipped.

## Gates

`pnpm api:check lint typecheck test build test:e2e test:a11y
performance:check licenses:check` + browser-verified journeys.
