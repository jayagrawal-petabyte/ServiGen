-- Multi-Tenancy Migration: Add organisationId across 11 domain models with backfill and indexes

-- Step 1: Add nullable organisationId columns
ALTER TABLE "major_incidents" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "configuration_items" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "change_requests" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "knowledge_articles" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "service_catalogue_items" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "custom_lists" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "agent_moods" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;

-- Step 2: Intelligent Backfill from Existing Relational Hierarchies
-- 2a. Approvals from linked Tickets
UPDATE "approvals" a
SET "organisationId" = t."organisationId"
FROM "tickets" t
WHERE a."ticketId" = t."id" AND a."organisationId" IS NULL;

-- 2b. Configuration Items from linked Sites
UPDATE "configuration_items" ci
SET "organisationId" = s."organisationId"
FROM "sites" s
WHERE ci."siteId" = s."id" AND ci."organisationId" IS NULL;

-- 2c. Change Requests from linked Configuration Items or assigned Agents
UPDATE "change_requests" cr
SET "organisationId" = ci."organisationId"
FROM "configuration_items" ci
WHERE cr."ciId" = ci."id" AND cr."organisationId" IS NULL;

UPDATE "change_requests" cr
SET "organisationId" = u."organisationId"
FROM "users" u
WHERE cr."assignedAgentId" = u."id" AND cr."organisationId" IS NULL;

-- 2d. Knowledge Articles from author Users
UPDATE "knowledge_articles" ka
SET "organisationId" = u."organisationId"
FROM "users" u
WHERE ka."authorId" = u."id" AND ka."organisationId" IS NULL;

-- 2e. Custom Lists from creator Users
UPDATE "custom_lists" cl
SET "organisationId" = u."organisationId"
FROM "users" u
WHERE cl."createdById" = u."id" AND cl."organisationId" IS NULL;

-- 2f. Agent Moods from linked Agents (Users)
UPDATE "agent_moods" am
SET "organisationId" = u."organisationId"
FROM "users" u
WHERE am."agentId" = u."id" AND am."organisationId" IS NULL;

-- 2g. Calendar Events from linked Agents (Users)
UPDATE "calendar_events" ce
SET "organisationId" = u."organisationId"
FROM "users" u
WHERE ce."agentId" = u."id" AND ce."organisationId" IS NULL;

-- 2h. Fallback any remaining unattached records to primary tenant ('org-001')
UPDATE "major_incidents" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "approvals" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "configuration_items" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "change_requests" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "projects" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "knowledge_articles" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "teams" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "agent_moods" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
UPDATE "calendar_events" SET "organisationId" = 'org-001' WHERE "organisationId" IS NULL;
-- Note: service_catalogue_items can remain NULL to signify global system offerings

-- Step 3: Add Foreign Key Constraints safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'major_incidents_organisationId_fkey') THEN
    ALTER TABLE "major_incidents" ADD CONSTRAINT "major_incidents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approvals_organisationId_fkey') THEN
    ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'configuration_items_organisationId_fkey') THEN
    ALTER TABLE "configuration_items" ADD CONSTRAINT "configuration_items_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'change_requests_organisationId_fkey') THEN
    ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_organisationId_fkey') THEN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_articles_organisationId_fkey') THEN
    ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_catalogue_items_organisationId_fkey') THEN
    ALTER TABLE "service_catalogue_items" ADD CONSTRAINT "service_catalogue_items_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_lists_organisationId_fkey') THEN
    ALTER TABLE "custom_lists" ADD CONSTRAINT "custom_lists_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_organisationId_fkey') THEN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_moods_organisationId_fkey') THEN
    ALTER TABLE "agent_moods" ADD CONSTRAINT "agent_moods_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_organisationId_fkey') THEN
    ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 4: Add Performance Indexes for Tenant-Scoped Queries
CREATE INDEX IF NOT EXISTS "major_incidents_organisationId_status_idx" ON "major_incidents"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "approvals_organisationId_status_idx" ON "approvals"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "configuration_items_organisationId_status_idx" ON "configuration_items"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "change_requests_organisationId_status_idx" ON "change_requests"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "projects_organisationId_status_idx" ON "projects"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "knowledge_articles_organisationId_status_idx" ON "knowledge_articles"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "service_catalogue_items_organisationId_status_idx" ON "service_catalogue_items"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "custom_lists_organisationId_idx" ON "custom_lists"("organisationId");
CREATE INDEX IF NOT EXISTS "teams_organisationId_idx" ON "teams"("organisationId");
CREATE INDEX IF NOT EXISTS "agent_moods_organisationId_submittedAt_idx" ON "agent_moods"("organisationId", "submittedAt");
CREATE INDEX IF NOT EXISTS "calendar_events_organisationId_startsAt_idx" ON "calendar_events"("organisationId", "startsAt");
