# Web Foundation Performance Review

## Boundaries

- Root/app pages remain Server Components unless they need browser APIs, form state, Radix state,
  query mutations, or Motion.
- `AppShell` and static feature placeholders are server-rendered.
- `DesignSystemSpecimen`, Radix wrappers, and `MotionReveal` are isolated client islands.
- API client helpers do not execute during static shell rendering.
- No food/product images or image processing pipeline is included.

## Budget checks

- `pnpm build` completes with static foundation routes.
- `pnpm performance:check` limits `.next/static/chunks` to 2,000,000 bytes.
- `pnpm test:e2e` covers 375/768/1024/1440px and checks unintended horizontal overflow.
- Playwright axe checks report no critical/serious violations on the shell and active Radix overlays.
- Target Web Vitals remain LCP < 2.5s, CLS < 0.1, and INP < 200ms on the project test profile.

## Review result

The foundation uses server-first rendering, a small set of client islands, compositor-friendly
motion, and no image assets. The current local Docker review measured 1,187,865 bytes of client
chunks, DOMContentLoaded 395ms, and first contentful paint 300ms. CI enforces the 2MB chunk budget
and E2E/accessibility checks. Full LCP/CLS/INP measurement remains a release-preview check under
production-like network conditions rather than being inferred from the local Docker host.
