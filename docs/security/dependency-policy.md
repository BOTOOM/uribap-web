# Web Dependency and License Policy

- `pnpm audit --audit-level=high` is a required CI gate.
- GPL, AGPL, SSPL, EUPL, LGPL, and non-commercial licenses are blocked by default.
- The only reviewed exception is `LGPL-3.0-or-later` for `@img/sharp-libvips-linux-x64`,
  transitively pulled by Next's `sharp` support. Uribap does not store or process food/product
  images; this package is not used as a product feature. Re-evaluate the exception if image
  processing or uploads are introduced.
- The exception is encoded in `scripts/check-licenses.mjs`; adding another exception requires a
  dated review and an explicit change to this document.
