# Backend audit reassessment

Date: 3 October 2026
Purpose: distinguish current defects, integration contracts and future risks.
No backend implementation files changed during this reassessment.

The previously referenced BACKEND_AUDIT_FIX_REQUESTS.md was not present in the
workspace at reassessment time. This is a new, standalone reassessment rather
than a claim that the missing document was edited.

## What the recheck establishes

Existing source was re-read and HTTP/service probes repeated in a disposable
local process. Probes changed only that process's mock memory. Authentication was
enabled with verified test JWTs, so findings do not depend on the unfinished login
module. None of the reproduced validation/data-overwrite defects needs a deployed
database or a completed organisations module to correct.

Twenty pairs of concurrent HTTP approval decisions produced zero cases where both
succeeded. Twenty pairs of HTTP time increments produced zero lost totals. Direct
Promise.all calls to the services still reproduced both races. These findings
must not be presented as confirmed current HTTP races.

## Decision table

| ID | Reassessment | Action |
|---|---|---|
| SC-01 | Confirmed current HTTP data-integrity defect | Fix reserved metadata overwrite now |
| MI-01 | Confirmed current HTTP corruption, reachable as Admin | Fix writable fields and value validation now |
| MW-03 | Confirmed current HTTP data corruption | Fix finite numeric validation now |
| LB-01 | Confirmed invalid input; creator meaning needs clarification | Fix name/field types now; agree creator identity contract |
| VAL-01 | Confirmed current HTTP 500s from client input | Add small module-local type checks now |
| MI-02 / SC-02 | Real identifier-generation collision risk, fixed-clock reproduced | Small ID correction now; preserve public prefixes |
| AI-01 | Confirmed heuristic bug | Fix partial-word matching; no new classifier architecture |
| MW-04 | Confirmed inconsistency against existing threshold comment | Include negative SLA in threshold logic; retain existing status policy |
| MW-01 | Missing record check confirmed; team scope not settled | Agree detail/action scope, then add minimal check |
| AI-02 | User ID is echoed from body; currently no ticket/action performed | Agree requester versus actor contract before workflow integration |
| MW-02 / AP-01 | Service-level races only; not reproduced through current HTTP path | Defer DB-style concurrency design; optional small mock atomic helper |
| DB-01 | Correct with current ordered fixture; wrong for shuffled data | Low-priority correction when ordering assumptions change |
| DB-02 | Latest-value store conflicts with a daily comment; history not specified | Clarify intended semantics; do not mandate historical storage |

## Confirmed fixes with minimal scope and compatibility risks

### SC-01 — Service Catalogue metadata overwrite

Service implementation: src/modules/services-catalogue/services-catalogue.service.js:41-48.
Model: src/modules/services-catalogue/services-catalogue.model.js:30-35.
POST /api/services/1/requests accepted serviceId 4, id chosen and submittedAt fake.
This is caused by object spread order inside this module, not missing dependencies.

Minimum fix: prevent form data overriding server-owned serviceId/serviceName/id/time.
Keep legitimate dynamic request fields. Do not enforce an exhaustive form-field
allowlist until service form definitions exist. Deriving requester identity is a
separate authenticated request contract; keep actor/requester distinctions explicit.

Risk: moving all form fields into requestedData without coordinating the API can
break existing frontend consumers and service tests. Preserve the current response
shape or document an intentional contract change. Preserve req_ ID prefix.

### MI-01 — Major Incident patch corruption

src/modules/major-incidents/major-incidents.service.js:45-63.
Admin PATCH with id renamed, updates null and empty status returned 200; activity
append then returned 500. Admin access permits operations, not invalid data.

Minimum fix: allowlist the currently supported editable fields; reject protected
identity/history edits and validate fields when present, including empty/null.
No full new lifecycle state machine is needed to fix this.

Risk: blocking commander/title edits accidentally or adding invented transition
rules would break valid existing behaviour. Keep current documented lifecycle
values; agree reopen/resolved timestamp semantics before changing them.

### MW-03 — Invalid time values

src/modules/my-work/my-work.service.js:257-274.
minutesSpent Infinity (string) produced a 200 response with timeRecord null in JSON;
true is coerced into one minute. This is local numeric validation, not a DB issue.

Minimum fix: reject non-finite numbers, booleans, arrays/objects and non-positive
values before updating. A finite-number guard does not require a validation library.

Risk: rejecting all numeric strings or rounding decimals immediately may break
forms/current users. Agree permitted input representation and units; preserve
supported numeric strings if needed. Prisma timeRecord is Int, so resolve fractional
minutes before DB migration, rather than silently rounding them now.

### LB-01 and VAL-01 — Input shape validation

List controller accepts name 123 and fields string with 201. Dashboard mood 123,
AI Response knowledge object, and repeated Catalogue category query produce 500.
These fail in current local module code and do not depend on unfinished modules.

Minimum fix: validate nonblank strings, array shapes/entries and supported query
representations. Return 400 for invalid client input. Derive creator identity only
after deciding whether createdBy is an identity or a display label. A simple local
validator is sufficient; do not add a schema framework solely for these checks.

Risk: over-restricting arbitrary dynamic form fields, treating null optional arrays
as mandatory, or changing every error format can break clients. Preserve existing
valid defaults and response envelopes. Unknown fields need not all be forbidden.

### MI-02 and SC-02 — Identifier generation

Major incident IDs truncate timestamps to six digits, repeating every 1,000 seconds;
fixed-clock double creation gives duplicate IDs. Catalogue requests and activity
updates can duplicate within one millisecond as well. These are real risks, but no
ordinary HTTP collision was claimed during this recheck.

Minimum fix: use a local sequence for a mock store or a collision-resistant suffix.
Preserve MI-/req_/activity prefixes if callers/tests depend on them. No distributed
ID service or database deployment is needed.

Risk: switching the public format wholesale or renaming existing records breaks
lookups and tests. Existing IDs should remain stable; update creation only.

### AI-01 — Heuristic partial-word match

src/modules/ai-core/intent/intent.model.js:40-42.
Please build a server API returns Frontend because ui matches inside build.
This is independent of the unfinished real LLM and AI integration modules.

Minimum fix: match intended words/phrases rather than arbitrary substrings.
Keep existing categories and fallback. Word boundaries require deliberate handling
of punctuation, UI/UX and React Native. Retaining current rule precedence is enough
to remove this particular bug; a scoring/ranking rewrite is optional, not required.

Risk: naive splitting can break multiword phrases or punctuation. Test existing
keywords and phrases alongside the reproduced false match.

### MW-04 — Negative SLA escalation

src/modules/my-work/my-work.service.js:70-75.
A negative SLA is displayed as breached but excluded by the >= 0 condition. Existing
comments specify escalation at or below the priority threshold.

Minimum fix: include finite negative SLA values in that condition. Do not implement
an SLA scheduler/calculation engine or change status rules to solve this comparison.

Risk: broadening escalation for closed tickets should not be inferred here. Keep
the module's current applicable status policy until the workflow is agreed.

## Findings that need an access/identity decision

### MW-01 — My Work record access

Confirmed: agent-001 can read and change agent-002's REQ-1007 by direct ID, while its
list is agent-scoped. Current controllers pass no actor to the detail/action service.
Shared authentication verifies identity; it cannot provide record scope by itself.

However, the document does not settle whether Service Agents or Support Team Users
can act across queues. Calling every such access unauthorised is stronger than the
available policy evidence. The personal queue implies a restriction but does not
fully define detail access. This is not caused by the absent auth/organisation
modules: req.user is available now. It is an unresolved integration/access contract.

Decision needed: own records only, defined team scope, or wider staff scope per
operation. Once decided, pass actor context and apply a small repository check,
including Admin bypass. Do not implement strict organisation equality: current
mock agents intentionally work across organisations.

Regression risk: a blanket owner-only check could block valid team-support work;
changing service signatures without updating callers/tests can break integrations.

### AI-02 — Escalation requester identity

Confirmed: userId victim in the body is returned in a handoff requested by agent-001.
It does not create a ticket or perform an action on that user's resources today.
The current service may be preparing an on-behalf request, so identity echo alone
is not proof of an exploited account or completed workflow impersonation.

Decision needed: separate verified actorId from target/requester identity. Ordinary
self-service should not choose arbitrary requesters; permitted staff/Admin on-behalf
operations need a defined rule. Resolve this before consuming the handoff for ticket
creation. Do not remove legitimate staff on-behalf use accidentally.

## Findings to defer or downgrade

### MW-02 and AP-01 — Concurrency

Direct concurrent service calls still lose a time increment (45 + 10 + 20 becomes
65) and allow both approval decisions. Current mock repository operations complete
without real IO; event-loop microtasks finish each HTTP handler's critical work
before another incoming handler runs. In 20 HTTP trials per case, these failures
were not reproduced. This does not prove all possible future callers are safe.

Proportionate action: document service-level limitation; optionally move each
check/update into a single synchronous mock repository helper. Do not introduce
locks, queues, mutex libraries or transactions around the current array stores.
When real asynchronous database access or concurrent orchestration is added,
atomic increments and conditional Pending/assignment updates become required.

### DB-01 — Latest ticket ordering

Current fixture is already sorted, so today's API returns the expected newest
entry. A shuffled-date probe fails because slicing happens before sorting. This
is a latent ordering assumption, not a missing database-caused failure and not a
current stock-data blocker. Fix cheaply when sorting assumptions change; keep
sorting at one layer, preferably the repository/query, before limit.

### DB-02 — Mood history

Current code maintains one latest value per agent. The comment says replaces
existing entry for today, but the business document only requires mood check-in;
it does not explicitly require historical records or daily uniqueness.

Withdraw the mandatory history-storage recommendation. Either clarify the comment
for a latest-value store or, if daily history is approved, update save and read
semantics together. Changing storage alone while getAgentMood returns entries[0]
would expose yesterday's mood as current. Do not add timezone/history machinery
without a requirement.

## Recommendation to developers

Start with reserved-field protection, finite-number/type validation, the small
identifier correction and heuristic match fix. Confirm record/requester access
rules separately. Defer speculative concurrency and history architecture.
Preserve existing payloads/defaults where possible and test the actual changed
behaviour. No missing module needs to be completed for the confirmed local fixes.
