# Backend development status and setup

The Express modules currently read and mutate in-memory mock data. Restarting
Node resets these changes. Prisma is a separate foundation; module owners still
need to replace their model accessors with database queries.

## Run the mock API

From the backend directory:

```powershell
npm install
npm run prisma:generate
npm start
npm test
```

Copy .env.example to .env if necessary and configure it locally. Never commit
.env. The existing .env is preserved by foundation fixes.

GET /api/health is public and reports HTTP liveness only, not database readiness.
Other /api routes require a signed token with id and a recognised role. Local
mock development can opt into ALLOW_DEV_AUTH_OVERRIDE=true; production always
disables this override. Auth/login implementation remains with the auth owner.
Documented role permissions and assigned-approval ownership are enforced.
See PERMISSIONS_AND_SCHEMA.md for the matrix and remaining record-access rules.

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
