-- Optimistic concurrency token for major-incident lifecycle updates.
ALTER TABLE "major_incidents"
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
