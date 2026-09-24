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

## Production custom Login V2

The custom presentation is a separate Coolify Git Compose resource built from the Web repository with
`identity/login/compose.coolify.yml`. Create the Compose resource with the repository root as its
build context; the Dockerfile is `identity/login/Dockerfile`. Do not assign a Coolify domain to this
service: its labels route only `Path(`/uribap`)` and `PathPrefix(`/uribap/`)` on the existing
`zitadel.edwardiaz.dev` host.

Set `URIBAP_LOGIN_PAT` only in this service's Coolify runtime secrets. It must be a PAT for the
purpose-built `IAM_LOGIN_CLIENT` service user, not an administrator credential. The OIDC client
secret is separate and belongs only in the main Uribap Web Vercel environment. After deploying the
service, verify `https://zitadel.edwardiaz.dev/uribap/healthy` first. Only after it responds
successfully, set the **Uribap Web application's per-application** custom Login V2 base URI to
`https://zitadel.edwardiaz.dev/uribap/`. Do not change the ZITADEL instance base URI, instance-wide
branding, or other projects; the console and other applications continue using `/ui/v2/login`.

The main Web application remains on Vercel with issuer `https://zitadel.edwardiaz.dev`, callback
`https://uribap.edwardiaz.dev/api/auth/callback/zitadel`, and both API base settings pointed at
`https://uribap-api.edwardiaz.dev/api/v1`. Set `AUTH_URL=https://uribap.edwardiaz.dev` for the
canonical logout origin. `AUTH_ZITADEL_ID` and `AUTH_ZITADEL_SECRET` are the existing Web OIDC
client credentials and are not the login-service PAT.

The custom image builds the complete upstream ZITADEL workspace at the pinned commit recorded in
`identity/login/Dockerfile`, including its frozen pnpm lockfile and client/proto generation. Keep
the overlay limited to presentation; review upstream upgrades as a unit and update the pin only
with its workspace dependencies and build verified together.

ZITADEL identity email text is configured per organization under **Organization Settings → Message
Texts**; appearance is a separate **Branding** setting. These organization/project settings are not
instance-wide. Uribap's API mailer separately creates text/plain content from its own template data;
there is no shared turnkey email-template editor or new delivery feature in this login service.
