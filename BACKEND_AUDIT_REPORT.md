# ServiGen Full Backend Audit & Defect Report

**Date:** 2026-10-19  
**Target System:** ServiGen Backend (Node.js, Express, Prisma ORM, PostgreSQL / Supabase, hosted on Render)  
**Scope:** Architecture, Data Layer, Security & RBAC, Multi-tenancy, Routing & External Services  

---

## 1. Executive Summary
During end-to-end integration testing between the frontend and the live Render backend (`https://servigen-1.onrender.com`), multiple data persistence anomalies and visual mismatches were discovered. 

A comprehensive code audit across all backend modules identified **25 distinct issues** grouped into 5 critical categories:
1. **Data Desynchronization & Static Mocks** (Dashboard and other core screens returning fabricated constants).
2. **Silent Database Failures & Faked Writes** (41 `try/catch` fallback blocks swallowing real database connection/query errors).
3. **Infrastructure & Network Incompatibilities** (Render IPv4 egress vs. Supabase direct connection, missing reverse proxy trust).
4. **Authentication & Authorization Gaps** (Missing endpoints, RBAC blocking legitimate agent updates).
5. **Multi-Tenancy & Schema Leakage** (Global data exposure across organisations due to missing `organisationId` constraints).

---

## 2. Critical Issues Breakdown

### Category A: Screens Showing Inconsistent / Static Data

#### 1. Dashboard Metrics Hardcoded in Code (`dashboard.model.js`)
* **File:** `backend/src/modules/dashboard/dashboard.model.js`
* **Defect:** Five of the seven dashboard query accessors return hardcoded JavaScript constants rather than querying the database:
  * `getKpis()` returns `{ openIncidents: 42, slaBreaches: 7, avgResolutionTimeMinutes: 185 }`.
  * `getTeamBreakdown()` returns static hardcoded arrays (`[24, 12, 6]`).
  * `getCategoryBreakdown()` returns static counts (`Network 15, Hardware 10...`).
  * `getAgentSummaryData()` is statically keyed to the literal string `'agent-001'`.
  * `getMoodEntries()` returns a static array.
* **Impact:** The Dashboard never reflects real ticket, team, or SLA counts in Supabase, leading to total desynchronization with Incidents, My Work, and Projects screens.
* **Required Fix:** Replace hardcoded objects with Prisma aggregate queries (`db.ticket.count()`, `groupBy({ by: ['category'] })`, etc.).

---

#### 1b. Major Incident Lifecycle Stage Mathematical Collapse (6 Stages in UI vs 4 Statuses in Backend)
* **File:** `backend/src/modules/major-incidents/major-incidents.service.js` (`VALID_STATUSES`), `src/services/majorIncidentsService.ts` (`mapStageToBackendStatus`, `buildLifecycleStages`)
* **Defect:** 
  The frontend UI displays a 6-stage lifecycle pipeline:
  `[0: Started, 1: Escalated, 2: Diagnosed, 3: Mitigated, 4: Resolved, 5: Closed]`
  
  However, the backend restricts `VALID_STATUSES` to only 4 values:
  `['Investigating', 'Identified', 'Monitoring', 'Resolved']`

  Because 6 stages are compressed into 4 backend statuses and re-expanded, the transformation is **non-invertible and lossy**:
  
  | Stage Clicked in UI | Mapped & Sent to Backend | Status Returned by Backend | Re-expanded UI Rendering | Result |
  |---|---|---|---|---|
  | **0: Started** | `'Investigating'` | `'Investigating'` | **1: Escalated** | ❌ Cannot stay on 'Started' |
  | **1: Escalated** | `'Investigating'` | `'Investigating'` | **1: Escalated** | ✅ Works |
  | **2: Diagnosed** | `'Identified'` | `'Identified'` | **2: Diagnosed** | ✅ Works |
  | **3: Mitigated** | `'Monitoring'` | `'Monitoring'` | **3: Mitigated** | ✅ Works |
  | **4: Resolved** | `'Resolved'` (+ `resolvedAt`) | `'Resolved'` (+ `resolvedAt`) | **5: Closed** | ❌ Cannot stay on 'Resolved' |
  | **5: Closed** | `'Resolved'` (+ `resolvedAt`) | `'Resolved'` (+ `resolvedAt`) | **5: Closed** | ✅ Works |

* **Compounding Bug in `changeMajorIncident`:**
  When transitioning away from Closed/Resolved, the frontend sends `{ status: 'Monitoring', resolvedAt: null }`. But in `major-incidents.service.js`:
  ```javascript
  if (changes.status === 'Resolved' && !changes.resolvedAt) {
    changes.resolvedAt = new Date().toISOString();
  }
  ```
  Because `null` is falsy, un-resolving an incident immediately overwrites `resolvedAt` with a new timestamp, locking it permanently.
* **Impact:** 
  Users click "Started" or "Resolved", the UI optimistically updates for a moment, and on refetch from the API it snaps to "Escalated" or "Closed". It visually appears that "changing stages does nothing" or behaves erratically.
* **Required Backend Fix:**
  In `backend/prisma/schema.prisma`, `status` is already a free `String`. Update `VALID_STATUSES` in `backend/src/modules/major-incidents/major-incidents.service.js` to support all 6 native stage names:
  ```javascript
  const VALID_STATUSES = ['Started', 'Escalated', 'Diagnosed', 'Mitigated', 'Resolved', 'Closed'];
  ```
  This eliminates all lossy mapping layers and makes frontend stage indexing a direct 1:1 identity function.

---


### Category B: Data Persistence & Silent Fallbacks

#### 2. 41 Silent Fallback Catch Blocks Across 15 Models
* **Files:** All models in `backend/src/modules/**/*.model.js` (Major Incidents, Approvals, Projects, Calendar, Services, etc.)
* **Defect:** Every Prisma query is wrapped in:
  ```javascript
  try {
    return await db.<model>.findMany(...);
  } catch (_err) {
    // Database connection fallback
  }
  return mockDataArray;
  ```
* **Impact:** When Render fails to reach Supabase (due to network timeout, migration mismatch, or invalid credentials), the backend silently serves hardcoded in-memory arrays. The frontend has no indication that the database failed.
* **Required Fix:** In production/staging, rethrow Prisma errors to standard error handlers (HTTP 500 / 503) instead of masking outages with mock data.

#### 3. Faked Writes That Never Reach Database
* **Files:**
  * `backend/src/modules/services-catalogue/services-catalogue.model.js` (`createRequest`)
  * `backend/src/modules/major-incidents/major-incidents.model.js` (`saveMajorIncident`, `addIncidentUpdate`)
  * `backend/src/modules/calendar/calendar.model.js` (`createCalendarEvent`)
  * `backend/src/modules/knowledge/knowledge.model.js` (`createArticle`, `updateArticle`)
  * `backend/src/modules/approvals/approvals.model.js` (`updateStatus`)
* **Defect:** Write operations push new records into in-memory arrays (e.g. `mockRequests.push(...)`, `mockMajorIncidents.push(...)`) or return fabricated response objects without executing `db.<entity>.create()` or `db.<entity>.update()`.
* **Impact:** User actions (submitting service requests, creating major incidents, posting timeline updates) disappear permanently whenever Render restarts or sleeps.
* **Required Fix:** Wire every create/update accessor to its respective Prisma model with proper transaction safety and error propagation.

#### 4. Missing Database Seed Data for Major Incidents
* **File:** `backend/prisma/seed.js`
* **Defect:** `seed.js` seeds users, teams, and general tickets, but contains zero inserts for `MajorIncident` or `MajorIncidentUpdate`.
* **Impact:** Even on a clean, functioning Supabase instance, the Major Incidents table is completely empty on initial deployment.
* **Required Fix:** Add default seed records (`MI-1001`, `MI-1002`) with sample updates to `prisma/seed.js`.

---

### Category C: Infrastructure, Network & Routing

#### 5. Render Egress IPv4 Incompatibility with Supabase Direct Host (`P1001`)
* **Location:** Render environment variable `DATABASE_URL`
* **Defect:** Using direct Supabase URLs (`postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres`) fails on Render with `P1001: Can't reach database server`. Supabase direct connection resolves only over IPv6, while Render container egress operates over IPv4.
* **Required Fix:** Configure Render's `DATABASE_URL` to use the **Supavisor connection pooler URL** (port `6543` / `5432` on `aws-0-[region].pooler.supabase.com` with `?pgbouncer=true`).

#### 6. Missing Reverse Proxy IP Trust (`app.set('trust proxy', 1)`)
* **File:** `backend/src/app.js`
* **Defect:** Express is not configured to trust reverse proxies (`app.set('trust proxy', 1)` is missing).
* **Impact:** When deployed behind Render's load balancer, `req.ip` is identical for all incoming user requests. The rate limiter (`300 requests/window`) is shared globally across all concurrent users, causing accidental `429 Too Many Requests` lockouts.
* **Required Fix:** Add `app.set('trust proxy', 1);` immediately after creating the Express app instance.

#### 7. Missing Build Step & Prisma Binary Targets on Render
* **File:** `backend/package.json`, `backend/prisma/schema.prisma`
* **Defect:** `package.json` lacks a `postinstall` script to execute `prisma generate`. In `schema.prisma`, `generator client` only specifies `native` without Linux targets.
* **Impact:** Deployments to Linux (Render/Docker) can fail at query time with `PrismaClientInitializationError: Query engine binary not found`.
* **Required Fix:** 
  * Add `binaryTargets = ["native", "debian-openssl-3.0.x"]` in `schema.prisma`.
  * Add `"postinstall": "prisma generate"` in `backend/package.json`.

---

### Category D: Authentication, RBAC & Endpoints

#### 8. Major Incidents RBAC Blocks Agent Stage Updates (`403 Forbidden`)
* **File:** `backend/src/app.js` (lines 148–150)
* **Defect:** Mutations on `/api/major-incidents` are guarded with `PERMISSIONS.ADMIN_ONLY`:
  ```javascript
  app.use('/api/major-incidents', (req, res, next) =>
    restrictTo(...(['GET', 'HEAD'].includes(req.method) ? PERMISSIONS.STAFF : PERMISSIONS.ADMIN_ONLY))(req, res, next), majorIncidentsRouter);
  ```
* **Impact:** Any standard support agent (`Service Agent` / `agent-001`) who clicks to change a lifecycle stage (e.g. from Investigating to Diagnosed) receives `403 Forbidden`.
* **Required Fix:** Allow `PERMISSIONS.STAFF` for mutations on `/api/major-incidents`.

#### 9. Missing `resolvedAt` in Service `EDITABLE_FIELDS` (`400 Bad Request`)
* **File:** `backend/src/modules/major-incidents/major-incidents.service.js`
* **Defect:** When moving an incident stage back from Resolved/Closed, the client sends `{ status: 'Monitoring', resolvedAt: null }`. Because `resolvedAt` is missing from `EDITABLE_FIELDS`, the service rejects the request with:
  `400: cannot update protected fields: resolvedAt`.
* **Required Fix:** Add `resolvedAt` to `EDITABLE_FIELDS` and handle Prisma `null` assignments cleanly via `{ set: null }`.

#### 10. Missing `/api/auth/refresh` Endpoint (`404 / 401`)
* **Files:** `backend/src/modules/auth/auth.routes.js`, `src/services/apiClient.ts`
* **Defect:** The frontend attempts to refresh JWT tokens by calling `POST /api/auth/refresh`. The backend auth router only defines `/login`, `/forgot-password`, and `/session`.
* **Impact:** On every page load, a failed request to `/api/auth/refresh` triggers an error before falling back to re-login.
* **Required Fix:** Implement `POST /api/auth/refresh` in `auth.controller.js` to verify and issue updated JWT tokens.

#### 11. `forgot-password` Handler is a Mock No-Op
* **File:** `backend/src/modules/auth/auth.controller.js`
* **Defect:** `forgotPasswordHandler` validates that an email was provided and immediately returns `{ success: true, message: 'Instructions sent' }`. No token is generated, no notification is dispatched, and no `reset-password` endpoint exists.
* **Required Fix:** Implement real password reset token generation, storage, and a corresponding `POST /api/auth/reset-password` endpoint.

---

### Category E: Multi-Tenancy & Data Security

#### 12. Cross-Tenant Ticket Leakage in My Work
* **File:** `backend/src/modules/my-work/my-work.model.js` (`getTickets`)
* **Defect:** The query filter only checks `assignedAgentId`, `status`, `priority`, and `ticketType`. It never checks `organisationId`.
* **Impact:** An agent in Organisation A can see tickets belonging to Organisation B if assigned to them or if organization filtering is omitted.
* **Required Fix:** Include `where: { organisationId: req.user.organisationId }` in all tenant-scoped queries.

#### 13. Schema Multi-Tenancy Incompleteness
* **File:** `backend/prisma/schema.prisma`
* **Defect:** Only 3 of 20 database models have an `organisationId` foreign key (`Site`, `User`, `Ticket`). Models such as `MajorIncident`, `Approval`, `ConfigurationItem`, `Project`, `KnowledgeArticle`, and `ServiceCatalogueItem` have no tenant isolation column.
* **Impact:** Data from these tables is exposed globally across all client tenants.
* **Required Fix:** Plan a Prisma schema migration adding `organisationId` and relations across all tenant-scoped domain entities.

#### 14. Approvals Query Reverses Requester and Approver
* **File:** `backend/src/modules/approvals/approvals.model.js` (`getPendingApprovals`)
* **Defect:** `requester` is populated from `a.approver` (``${a.approver.firstName} ${a.approver.lastName}``).
* **Impact:** In the Approvals queue UI, the "Requester" column displays the name of the user assigned to approve the request, rather than the person who submitted it.
* **Required Fix:** Adjust the relation to load and display `a.requester` or `a.ticket.creator`.

---

### Category F: AI Core Prototype Disconnect

#### 15. `ai-core` Modules Are Completely Disconnected from Database & LLM
* **Directory:** `backend/src/modules/ai-core/` (`intent`, `retrieval`, `response`, `escalation`)
* **Defect:**
  * `intent`: Classifies text using regex keyword matching against software engineering tags (`Frontend`, `Backend`, `React Native`, `Cybersecurity`) which conflict with the application's ITSM categories (`Hardware`, `Software`, `Network`, `Access & Identity`).
  * `retrieval`: Searches a static in-memory 3-item array (`doc-001/002/003`) and ignores the actual `knowledge_articles` database table.
  * No LLM APIs, embedding models, or vector databases (`pgvector`) are connected.
* **Impact:** AI features cannot provide functional semantic routing or knowledge retrieval in production.
* **Required Fix:** Connect `retrieval` to the PostgreSQL `knowledge_articles` table and integrate genuine embedding/LLM endpoints.

---

## 3. Recommended Remediation Roadmap

| Priority | Action Item | Affected Files | Effort |
|:---:|---|---|:---:|
| **P0** | Switch Render `DATABASE_URL` to Supabase Pooler (`aws-0-*.pooler.supabase.com:6543`) | Render Dashboard | 5 mins |
| **P0** | Add `app.set('trust proxy', 1)` to prevent global 429 lockouts | `backend/src/app.js` | 5 mins |
| **P0** | Fix RBAC on `/api/major-incidents` to allow `PERMISSIONS.STAFF` mutations | `backend/src/app.js` | 10 mins |
| **P0** | Add `resolvedAt` to `EDITABLE_FIELDS` in Major Incidents service | `major-incidents.service.js` | 10 mins |
| **P1** | Eliminate 41 silent `try/catch` fallbacks and return real error responses | `backend/src/modules/**/*.model.js` | 1 hour |
| **P1** | Add seed records for `MajorIncident` and `MajorIncidentUpdate` | `backend/prisma/seed.js` | 20 mins |
| **P1** | Rewrite Dashboard accessors to run real Prisma count/aggregate queries | `dashboard.model.js` | 1.5 hours |
| **P2** | Implement `POST /api/auth/refresh` | `auth.routes.js`, `auth.controller.js` | 30 mins |
| **P2** | Fix Approvals requester mapping and wire `services-catalogue.createRequest` to Prisma | `approvals.model.js`, `services-catalogue.model.js` | 45 mins |
| **P3** | Add `organisationId` schema migration for full multi-tenancy | `backend/prisma/schema.prisma` | 2–3 hours |
| **P3** | Replace `ai-core` keyword regexes with actual embeddings and DB retrieval | `backend/src/modules/ai-core/*` | Roadmap |
