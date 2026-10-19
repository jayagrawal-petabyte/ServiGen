# Supabase login and database readiness

## Cause and recovery

The Render login investigation on 19 October 2026 identified two connection
configuration problems. Prisma 5's native PostgreSQL engine does not support
`sslmode=no-verify`; the Supabase connection needs encryption and its trusted
certificate authority. After verified TLS was configured, Render's diagnostic
reported that `DATABASE_URL` still contained a placeholder password and did not
match the password in `DIRECT_URL`. Replacing the placeholder restored login.

Live checks against `https://servigen-backend.onrender.com` then passed login,
authenticated session loading, and token refresh for all five supplied roles.
An incorrect password returned 401. Those checks established recovery of the
deployed authentication flow through environment changes; they did not establish
that the local changes described below were deployed.

## Runtime connection configuration

`src/config/database-url.js` configures recognized Supabase PostgreSQL hosts with
`sslmode=require`, `sslaccept=strict`, and the bundled public CA in `certs/`.
An explicitly configured `sslcert` is retained, including Render Secret File
paths. Transaction pooler port 6543 also receives `pgbouncer=true`. Other
PostgreSQL providers and local database URLs retain their original settings.

Keep `certs/supabase-prod-ca-2021.crt` in the backend deployment artifact. It is a
public trust certificate, not a private key. Its source, fingerprint, expiry,
and renewal instructions are documented in `certs/README.md`. Database
credentials belong in the deployment environment, never in source control.

This normalization applies to the application runtime. Prisma CLI commands read
`DATABASE_URL` independently, so configure their TLS parameters explicitly.
`DIRECT_URL` is currently unused by `prisma/schema.prisma`. No schema, migration,
seed, password, or PostgreSQL extension changes are part of this patch.

## Public database readiness

The existing frontend requests `GET /api/health/db` without a token. A deployment
without that route returned 401 anonymously and 404 with a valid token, causing
the frontend to show a database warning even after login recovered.

The backend now exposes a small public readiness response before authentication:

- 200 with `success=true` and `connected=true` after a real `SELECT 1` succeeds.
- 503 with `connected=false` and a generic message if the probe fails.
- No datasource details, table counts, credentials, or underlying errors.

Concurrent requests share a probe, and the server caches its result for five
seconds. Responses set `Cache-Control: no-store`. The existing `/api/health`
remains a process health check; business APIs continue to require authentication.
The readiness probe establishes connectivity, not that every table or workflow
is healthy.

## Deployment checks

Use the backend directory as Render's service root. Its existing install step
generates Prisma Client through `postinstall`; the normal Start Command is
`npm start`. Keep the working database credentials and CORS origins in Render.
An existing `/etc/secrets/...` CA path remains supported. After deployment:

1. Check `/api/health` and `/api/health/db`.
2. Sign in and verify authenticated session loading and token refresh.
3. Verify a rejected login and an anonymous business request still return 401.

If command execution is available, `node scripts/check-db.js` performs a
read-only connection and User-model check with redacted error output. Shell
access is optional; HTTP checks and application logs also work on Render's free
plan. Restore `npm start` if a temporary startup diagnostic was used.

Automated coverage includes verified TLS configuration, preservation of custom
CA settings, readiness privacy, concurrent probes, failure/recovery, and public
readiness alongside protected business routes. Production-mode local checks
against Supabase passed readiness and authentication. A local test cannot
guarantee a future Render deployment; repeat the HTTP checks after deploying.

## References

- [Prisma 5.22 PostgreSQL URL parser](https://github.com/prisma/prisma-engines/blob/5.22.0/quaint/src/connector/postgres/url.rs)
- [Supabase SSL configuration](https://supabase.com/docs/guides/platform/ssl-enforcement)
- [Prisma with Supabase](https://supabase.com/docs/guides/database/prisma)
