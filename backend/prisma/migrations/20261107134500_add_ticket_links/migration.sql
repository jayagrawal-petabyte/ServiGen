CREATE TABLE "ticket_links" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "relatedTicketId" TEXT,
    "problemId" TEXT,
    "configurationItemId" TEXT,
    "organisationId" TEXT,
    "createdById" TEXT,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_links_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "ticket_links_target_check" CHECK (
        (
            "relationType" IN ('PARENT', 'CHILD', 'RELATED')
            AND "relatedTicketId" IS NOT NULL
            AND "problemId" IS NULL
            AND "configurationItemId" IS NULL
        )
        OR
        (
            "relationType" = 'PROBLEM'
            AND "relatedTicketId" IS NULL
            AND "problemId" IS NOT NULL
            AND "configurationItemId" IS NULL
        )
        OR
        (
            "relationType" = 'AFFECTED_CI'
            AND "relatedTicketId" IS NULL
            AND "problemId" IS NULL
            AND "configurationItemId" IS NOT NULL
        )
    ),

    CONSTRAINT "ticket_links_no_self_reference_check"
        CHECK ("relatedTicketId" IS NULL OR "relatedTicketId" <> "ticketId")
);

ALTER TABLE "ticket_links"
ADD CONSTRAINT "ticket_links_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "tickets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_links"
ADD CONSTRAINT "ticket_links_relatedTicketId_fkey"
FOREIGN KEY ("relatedTicketId") REFERENCES "tickets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_links"
ADD CONSTRAINT "ticket_links_configurationItemId_fkey"
FOREIGN KEY ("configurationItemId") REFERENCES "configuration_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_links"
ADD CONSTRAINT "ticket_links_organisationId_fkey"
FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_links"
ADD CONSTRAINT "ticket_links_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ticket_links_ticketId_relatedTicketId_relationType_key"
ON "ticket_links" ("ticketId", "relatedTicketId", "relationType");

CREATE UNIQUE INDEX "ticket_links_ticketId_problemId_relationType_key"
ON "ticket_links" ("ticketId", "problemId", "relationType");

CREATE UNIQUE INDEX "ticket_links_ticketId_configurationItemId_relationType_key"
ON "ticket_links" ("ticketId", "configurationItemId", "relationType");

CREATE INDEX "ticket_links_organisationId_createdAt_idx"
ON "ticket_links" ("organisationId", "createdAt");

CREATE INDEX "ticket_links_relatedTicketId_idx"
ON "ticket_links" ("relatedTicketId");

CREATE INDEX "ticket_links_configurationItemId_idx"
ON "ticket_links" ("configurationItemId");

ALTER TABLE "ticket_links" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_service_role_and_postgres"
ON "ticket_links"
FOR ALL
TO postgres, service_role
USING (true)
WITH CHECK (true);
