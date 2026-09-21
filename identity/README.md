# Web local identity boundary

The Web repository does not duplicate the identity provider. Start the canonical stack from
`../api/identity/compose.identity.yml`, then run this application with server-only values in
`.env.local`.

Required local endpoints:

- ZITADEL issuer: `http://localhost:8080`
- API: `http://localhost:8010`
- Mailpit: `http://localhost:8025`

The Web callback is:

```text
http://localhost:3000/api/auth/callback/zitadel
```

Use synthetic local credentials only. Provider access/refresh tokens remain in the Auth.js server
session and are never placed in localStorage, client props, or readable cookies.
