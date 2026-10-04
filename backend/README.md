# Backend development status and setup

The Express modules currently read and mutate in-memory mock data. Restarting
Node resets these changes. Prisma is a separate foundation; module owners still
need to replace their model accessors with database queries.

## Run the mock API

From the backend directory:

```powershell
npm ci
npm run prisma:generate
npm start
npm test
```

Copy .env.example to .env if necessary and configure it locally. Never commit
.env. NODE_ENV must explicitly be development, test or production. Outside tests,
JWT_SECRET must be a unique secret of at least 32 bytes; the published example
key is rejected. Generate a key into the current PowerShell environment without
printing it, or save a generated value privately in .env:

```powershell
$env:JWT_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

The example disables header authentication. Local mock developers may explicitly
opt in, but anyone able to reach that development instance can then choose an
identity/role. Shared deployments must keep the override disabled. Rotating a
key invalidates existing local JWTs; generate new tokens with the shared helper.
The test runner uses its own environment and random key instead of local .env.

GET /api/health is public and reports HTTP liveness only, not database readiness.
Other /api routes require a signed token with id and a recognised role. Local
mock development can opt into ALLOW_DEV_AUTH_OVERRIDE=true; production always
disables this override. Auth/login implementation remains with the auth owner.
Documented role permissions and assigned-approval ownership are enforced.
See PERMISSIONS_AND_SCHEMA.md for the matrix and remaining record-access rules.

Production requires an explicit CORS_ORIGIN list of HTTP(S) browser origins;
wildcards, credentials in URLs and paths/query strings/fragments are rejected.
Development/test defaults allow localhost ports 5173 and 3000. CORS controls
browser access, while Bearer authentication still protects non-browser clients.

Helmet sets API security headers. Requests under /api are limited per client IP
to 300 per minute, with an additional AI limit of 30 per minute. The public health
check and browser preflights are exempt. RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX and
AI_RATE_LIMIT_MAX can adjust the positive limits. JSON bodies are capped at
100 KB; rejected requests return 413 or 429 with the normal JSON envelope.

These limiters use process-local memory and Express's default untrusted-proxy
setting. Before a proxied or multi-instance deployment, configure the exact
trusted proxy topology and a shared rate-limit store. Never blindly trust all
forwarded headers. Header middleware follows [Helmet](https://helmet.js.org/)
and limiter configuration follows [express-rate-limit](https://express-rate-limit.mintlify.app/reference/configuration).

package-lock.json is tracked for repeatable npm ci installs. The existing seed
script still refuses production; development seed accounts are not provisioning.

The app temporarily replaces header/query agent identity with verified req.user
identity for My Work and Dashboard. Module owners should migrate to req.user.

## Local database choices

Use either your native PostgreSQL instance or Docker PostgreSQL. Native
PostgreSQL requires its actual credentials and database name in DATABASE_URL.
The current connection has failed authentication; do not reset existing data.

Docker requires Docker Desktop (or an equivalent Docker engine) running with
Compose available. From the backend directory:

```powershell
docker compose -f deploy/docker-compose.yml up -d
docker compose -f deploy/docker-compose.yml ps
```

Compose publishes PostgreSQL on 127.0.0.1:5433 by default, leaving native port
5432 available. Set POSTGRES_PORT in the shell to change the host port, and make
DATABASE_URL match it. Compose does not load backend/.env as database settings;
its database/user/password are the local development values in the YAML.
A host-run Node backend connects through localhost and the published host port.
This Compose file runs the database only, not the Node application.

## Database integration remaining

The schema is a draft shared contract. Review organisation access rules, field
mapping, relation requirements and seed coverage with module owners before
creating the initial migration. An initial migration has been generated for review; it has not been applied.

After approval, review and commit the initial migration. Apply it against a
fresh development database using npm run prisma:deploy. Generate the
client, run npm run seed only against that development database, then verify
persistence with database integration tests. Seeding creates sample accounts
with a known password and must not be used as production provisioning.

npm run prisma:deploy applies committed migrations in deployment; it does not
create new migration files. No live database is modified by tests.
Database deployment, the application Docker image, CI, backups and secrets
provisioning remain future work. Shared changes require PR review.
