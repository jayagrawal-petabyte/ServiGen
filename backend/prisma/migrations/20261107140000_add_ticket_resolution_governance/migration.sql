ALTER TABLE "tickets"
    ADD COLUMN IF NOT EXISTS "resolutionCode" TEXT,
    ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT,
    ADD COLUMN IF NOT EXISTS "rootCauseSummary" TEXT,
    ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "resolvedById" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tickets_resolvedById_fkey'
    ) THEN
        ALTER TABLE "tickets"
        ADD CONSTRAINT "tickets_resolvedById_fkey"
        FOREIGN KEY ("resolvedById")
        REFERENCES "users"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "tickets_resolvedAt_idx"
ON "tickets" ("resolvedAt");
