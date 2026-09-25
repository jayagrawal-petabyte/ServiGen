# Major Incidents module

Express routes for the major-incident lifecycle, using the repository's current
in-memory placeholder data pattern. Mount this router at `/api/major-incidents`.

Endpoints:

- `GET /` — list incidents; optionally filter with `status` or `priority`
- `POST /` — declare a P1/P2 incident
- `GET /:incidentId` — retrieve one incident and its updates
- `PATCH /:incidentId` — change lifecycle status or incident details
- `POST /:incidentId/updates` — append a stakeholder update

The model functions are intentionally isolated so they can be replaced with
Prisma/Supabase calls when the shared data layer is added.
