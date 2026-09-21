# Feature Specification: Inventory Web Experience

**Feature Branch**: `004-inventory-ledger`

- **US1**: Browse lots grouped by ingredient/location with available, expired, and unavailable states.
- **US2**: Add a lot and apply a signed adjustment through server-only BFF routes.
- **US3**: Show movement history and safe conflict/no-negative errors.

Web MUST use generated API types, never compute balances, expose loading/empty/error/forbidden/conflict states, meet keyboard/a11y/responsive gates, and exclude email/deployment.
