-- CreateTable: contracts
CREATE TABLE IF NOT EXISTS "contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT,
    "title" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorEmail" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SLA',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "contractValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: contract_ci_links
CREATE TABLE IF NOT EXISTS "contract_ci_links" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "configurationItemId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_ci_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: contracts indices
CREATE INDEX IF NOT EXISTS "contracts_organisationId_status_idx" ON "contracts"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "contracts_vendorName_idx" ON "contracts"("vendorName");

-- CreateIndex: contract_ci_links indices
CREATE UNIQUE INDEX IF NOT EXISTS "contract_ci_links_contractId_configurationItemId_key" ON "contract_ci_links"("contractId", "configurationItemId");
CREATE INDEX IF NOT EXISTS "contract_ci_links_contractId_idx" ON "contract_ci_links"("contractId");
CREATE INDEX IF NOT EXISTS "contract_ci_links_configurationItemId_idx" ON "contract_ci_links"("configurationItemId");

-- AddForeignKey: contracts -> organisations(organisationId)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_organisationId_fkey'
  ) THEN
    ALTER TABLE "contracts"
      ADD CONSTRAINT "contracts_organisationId_fkey"
      FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: contract_ci_links -> contracts(contractId)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contract_ci_links_contractId_fkey'
  ) THEN
    ALTER TABLE "contract_ci_links"
      ADD CONSTRAINT "contract_ci_links_contractId_fkey"
      FOREIGN KEY ("contractId") REFERENCES "contracts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: contract_ci_links -> configuration_items(configurationItemId)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contract_ci_links_configurationItemId_fkey'
  ) THEN
    ALTER TABLE "contract_ci_links"
      ADD CONSTRAINT "contract_ci_links_configurationItemId_fkey"
      FOREIGN KEY ("configurationItemId") REFERENCES "configuration_items"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
