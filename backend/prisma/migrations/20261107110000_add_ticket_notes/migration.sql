CREATE TABLE IF NOT EXISTS "ticket_notes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "organisationId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "noteType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ticket_notes_ticketId_createdAt_idx"
ON "ticket_notes" ("ticketId", "createdAt");

CREATE INDEX IF NOT EXISTS "ticket_notes_organisationId_createdAt_idx"
ON "ticket_notes" ("organisationId", "createdAt");

CREATE INDEX IF NOT EXISTS "ticket_notes_authorId_idx"
ON "ticket_notes" ("authorId");

ALTER TABLE "ticket_notes"
ADD CONSTRAINT "ticket_notes_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "tickets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_notes"
ADD CONSTRAINT "ticket_notes_organisationId_fkey"
FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_notes"
ADD CONSTRAINT "ticket_notes_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_notes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_service_role_and_postgres"
ON "ticket_notes"
FOR ALL
TO postgres, service_role
USING (true)
WITH CHECK (true);
