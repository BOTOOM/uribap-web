# Requirements Checklist: Product UI Redesign (Mesa)

- [x] Visual authority defined: `mesa-household-app.html` reference.
- [x] Scope covers every `(app)` route plus auth/onboarding surfaces.
- [x] API contracts and domain calculations untouched (FR-004, FR-008).
- [x] Responsive targets explicit: 375/768/1024/1440, no overflow.
- [x] Accessibility requirements explicit: focus, aria-current, live
      regions, reduced-motion, ≥44px targets.
- [x] All existing mutations preserved through the new UI.
- [x] Dependencies justified: `date-fns` (week math); icons/motion already
      present.
- [x] Verification via real-browser journeys + Gherkin documentation.
- [x] Out of scope declared (no API changes, no deploy, no real email).
