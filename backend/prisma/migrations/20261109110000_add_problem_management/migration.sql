-- CreateTable: problems
CREATE TABLE IF NOT EXISTS "problems" (
    "id" TEXT NOT NULL,
    "problemNumber" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "urgency" TEXT NOT NULL DEFAULT 'Medium',
    "impact" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "rootCause" TEXT,
    "workaround" TEXT,
    "knownError" BOOLEAN NOT NULL DEFAULT false,
    "assignedAgentId" TEXT,
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: problems organization and agent indices
CREATE INDEX IF NOT EXISTS "problems_organisationId_status_idx" ON "problems"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "problems_assignedAgentId_idx" ON "problems"("assignedAgentId");

-- AddForeignKey: problems -> users(assignedAgentId)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'problems_assignedAgentId_fkey'
  ) THEN
    ALTER TABLE "problems"
      ADD CONSTRAINT "problems_assignedAgentId_fkey"
      FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: problems -> organisations(organisationId)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'problems_organisationId_fkey'
  ) THEN
    ALTER TABLE "problems"
      ADD CONSTRAINT "problems_organisationId_fkey"
      FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: ticket_links(problemId) -> problems(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_links_problemId_fkey'
  ) THEN
    ALTER TABLE "ticket_links"
      ADD CONSTRAINT "ticket_links_problemId_fkey"
      FOREIGN KEY ("problemId") REFERENCES "problems"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
