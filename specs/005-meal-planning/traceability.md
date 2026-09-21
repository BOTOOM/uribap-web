# Traceability: Meal Planning Web

| Requirement | Evidence/task |
|---|---|
| US1 week view with state/version | T003/T004, server page tests |
| US2 entry CRUD while draft | T003/T004/T005, form and BFF tests |
| US3 transitions and approval rule | T003/T005, action tests + API 409 surfaces |
| US4 version conflict handling | T004/T005, stale-state tests |
| Generated types only | T002, contract snapshot sync |
| Server-only tokens | T003, BFF handlers |
| A11y/responsive/state gates | T005/T006, Vitest/Playwright/axe |
| Out-of-scope email/deployment | plan, spec, constitution review |
