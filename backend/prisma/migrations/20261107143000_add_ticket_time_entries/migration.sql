CREATE TABLE "ticket_time_entries" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "organisationId" TEXT,
    "agentId" TEXT,
    "agentName" TEXT NOT NULL,
    "agentEmail" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_time_entries_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "ticket_time_entries_duration_check"
        CHECK ("durationMinutes" > 0),

    CONSTRAINT "ticket_time_entries_session_check"
        CHECK (
            ("startedAt" IS NULL AND "endedAt" IS NULL)
            OR
            ("startedAt" IS NOT NULL AND "endedAt" IS NOT NULL
             AND "endedAt" > "startedAt")
        )
);

ALTER TABLE "ticket_time_entries"
ADD CONSTRAINT "ticket_time_entries_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "tickets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_time_entries"
ADD CONSTRAINT "ticket_time_entries_organisationId_fkey"
FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_time_entries"
ADD CONSTRAINT "ticket_time_entries_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ticket_time_entries_ticketId_createdAt_idx"
ON "ticket_time_entries" ("ticketId", "createdAt");

CREATE INDEX "ticket_time_entries_organisationId_createdAt_idx"
ON "ticket_time_entries" ("organisationId", "createdAt");

CREATE INDEX "ticket_time_entries_agentId_createdAt_idx"
ON "ticket_time_entries" ("agentId", "createdAt");

ALTER TABLE "ticket_time_entries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_service_role_and_postgres"
ON "ticket_time_entries"
FOR ALL
TO postgres, service_role
USING (true)
WITH CHECK (true);
