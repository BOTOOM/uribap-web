# Traceability: Meal Completion Web

| Spec item | Artifact | Evidence |
| --- | --- | --- |
| US1 complete | `POST .../complete` BFF + entry action | component test |
| US2 correct | `POST .../correct` BFF + inline form | component test |
| US3 reopen | `POST .../reopen` BFF + action | component test |
| US4 conflict | 409 → reload affordance | component test |
| US5 origin/diffs | completions section | render test |
| Contract | metadata v9 | `api:check` + contract test |
