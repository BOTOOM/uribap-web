FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS builder

RUN apk add --no-cache git bash ca-certificates
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /source
RUN git init && git remote add origin https://github.com/zitadel/zitadel.git && git fetch --depth=1 origin 02d07e951b0b6ff8d5fa5e74b65209a8e9efddfe && git checkout --detach FETCH_HEAD
ENV NX_DAEMON=false NX_NO_CLOUD=true NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_BASE_PATH=/uribap NEXT_PUBLIC_THEME_LAYOUT=top-to-bottom NEXT_OUTPUT_MODE=standalone
RUN pnpm install --frozen-lockfile
COPY identity/login/overlay /overlay
COPY identity/login/apply-overlay.mjs /apply-overlay.mjs
RUN node /apply-overlay.mjs /source /overlay
RUN pnpm exec nx run @zitadel/proto:generate && pnpm exec nx run @zitadel/login:build

FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS runtime
WORKDIR /app
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs && mkdir -p /.env-file && touch /.env-file/.env && chown -R nextjs:nodejs /.env-file
COPY --from=builder --chown=nextjs:nodejs /source/apps/login/.next/standalone ./
COPY --from=builder /source/apps/login/LICENSE ./LICENSE
ENV HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production NEXT_PUBLIC_BASE_PATH=/uribap NEXT_PUBLIC_THEME_LAYOUT=top-to-bottom ZITADEL_TLS_ENABLED=false NODE_OPTIONS="--use-openssl-ca --require /app/load-ssl-cert-dir.cjs" SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD ["node", "/app/healthcheck.mjs", "http://localhost:3000/uribap/healthy"]
ENTRYPOINT ["/app/entrypoint.sh", "node", "apps/login/server.js"]
