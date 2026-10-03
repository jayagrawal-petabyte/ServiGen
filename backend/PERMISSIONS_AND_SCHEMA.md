# Shared permissions and schema contract

Shared changes require PR review. This change does not modify other developers'
module files or apply SQL to a live database.

## Access rules

Admin passes all shared role and approval ownership guards. Business validation
and status transition rules still apply. Admin has no automatic sample account. Admin may select another agent queue
through agentId; the signed acting identity remains in req.user.

- Dashboard summary: all four documented roles (SCR-002).
- Other dashboard functions: Service User, Service Agent, Support Team User.
- My Work, Projects, CMDB, Change Requests, Custom Lists, Major Incident reads:
  Service Agent and Support Team User.
- Catalogue browse and request submission: Service User and Service Agent.
- Approvals: Approver, limited to records whose approverId equals verified user id.
- Unspecified Major Incident mutation rights: Admin-only until agreed.
- AI endpoints: authenticated access retained; the document does not specify a
  narrower role matrix for them.

Approval listing filters the module response; detail and actions check the
module repository before entering its controller. Unassigned mock approvals
are hidden from approvers and cannot be acted on; Admin can access them. No mock
assignments are invented. The approvals owner must populate approverId and,
when switching to Prisma, enforce assignment and pending status in the same
transaction/update predicate to prevent races. Retain these route guards.

My Work and Dashboard still consume verified identity through an app-level
compatibility bridge. Record-level team/organisation access remains undecided;
these role guards do not implement that policy.

## Schema changes

User gains optional unique username, phoneNumber, networkLogin, availability,
team membership, assigned changes, authored articles and calendar relations.
Teams and memberships model team assignment; existing assignedTeam text remains
for API compatibility. Calendar events store an assigned user and a time range.
Knowledge articles support drafts, content, category, priority, approval status
and SLA deadline; retrieval/LLM functionality is not implemented here.

Major Incidents gain response/resolution deadlines, updateDueAt and productTags.
Update Required should be derived from an overdue updateDueAt on an unresolved
incident; deadlines must be populated by the future SLA/update policy.
Catalogue items gain status/icon. Changes gain assignedAgentId. Custom lists
gain scope/group, columnProfile, sequence, displayType and a creator relation.
Completion percentage remains derived from subtasks; timeSpent units still need
agreement. A User still has one display-name role string, not multiple roles.

Approvals gain typed ServiceRequest/ChangeRequest relations and an assignment
index. Legacy entityType/entityId remain for compatibility. The SQL migration
prevents simultaneous typed targets and inconsistent typed target identifiers;
legacy targets without a typed FK still require migration by module owners.
The migration also restricts user roles to the five supported display names.

## Database rollout and verification

The initial SQL migration was generated offline from the schema, with target
and calendar interval constraints. It is intended for a fresh database only.
If an existing database has tables, inspect/baseline it before migration; do not
blindly apply this initial migration. No current tables have been verified.

Prisma schema validation, client generation and HTTP permission tests can run
without a database. Actual migration, foreign-key, check-constraint and seed
execution tests remain pending valid PostgreSQL credentials. The development
seed now links sample tickets, incident, service request, approval, team and CI;
it refuses to provision known sample passwords in production.
