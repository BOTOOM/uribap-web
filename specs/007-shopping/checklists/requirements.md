# Shopping Web Checklist

- [ ] Shopping page renders server-side with API-verbatim amounts and statuses.
- [ ] Generate action posts an explicit `from_date`/`to_date` window.
- [ ] Mutations send `expected_version` and `Idempotency-Key` through BFF routes.
- [ ] Purchase documents that it creates real inventory (lot + purchase movement).
- [ ] 409 conflicts show a reload path; 422/409 surface as form errors.
- [ ] Preparation, consumption, unit conversion, email, notifications, and deployment are out of scope.
