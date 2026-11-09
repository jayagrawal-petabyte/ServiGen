-- AlterTable: Add project metadata columns
ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "code" TEXT,
  ADD COLUMN IF NOT EXISTS "priority" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- CreateIndex: Project unique code and owner index
CREATE UNIQUE INDEX IF NOT EXISTS "projects_organisationId_code_key" ON "projects"("organisationId", "code");
CREATE INDEX IF NOT EXISTS "projects_ownerId_idx" ON "projects"("ownerId");

-- AddForeignKey: projects -> users(ownerId)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_ownerId_fkey'
  ) THEN
    ALTER TABLE "projects"
      ADD CONSTRAINT "projects_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: project_subtask_dependencies
CREATE TABLE IF NOT EXISTS "project_subtask_dependencies" (
    "id" TEXT NOT NULL,
    "subtaskId" TEXT NOT NULL,
    "dependsOnSubtaskId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "lagTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_subtask_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: dependency unique & foreign key indices
CREATE UNIQUE INDEX IF NOT EXISTS "project_subtask_dependencies_subtaskId_dependsOnSubtaskId_key"
  ON "project_subtask_dependencies"("subtaskId", "dependsOnSubtaskId");
CREATE INDEX IF NOT EXISTS "project_subtask_dependencies_subtaskId_idx"
  ON "project_subtask_dependencies"("subtaskId");
CREATE INDEX IF NOT EXISTS "project_subtask_dependencies_dependsOnSubtaskId_idx"
  ON "project_subtask_dependencies"("dependsOnSubtaskId");

-- AddForeignKeys: project_subtask_dependencies -> project_subtasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_subtask_dependencies_subtaskId_fkey'
  ) THEN
    ALTER TABLE "project_subtask_dependencies"
      ADD CONSTRAINT "project_subtask_dependencies_subtaskId_fkey"
      FOREIGN KEY ("subtaskId") REFERENCES "project_subtasks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_subtask_dependencies_dependsOnSubtaskId_fkey'
  ) THEN
    ALTER TABLE "project_subtask_dependencies"
      ADD CONSTRAINT "project_subtask_dependencies_dependsOnSubtaskId_fkey"
      FOREIGN KEY ("dependsOnSubtaskId") REFERENCES "project_subtasks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: project_resource_assignments
CREATE TABLE IF NOT EXISTS "project_resource_assignments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allocatedHours" DOUBLE PRECISION NOT NULL,
    "capacityHours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_resource_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: resource assignment unique & user index
CREATE UNIQUE INDEX IF NOT EXISTS "project_resource_assignments_projectId_userId_key"
  ON "project_resource_assignments"("projectId", "userId");
CREATE INDEX IF NOT EXISTS "project_resource_assignments_userId_idx"
  ON "project_resource_assignments"("userId");

-- AddForeignKeys: project_resource_assignments -> projects and users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_resource_assignments_projectId_fkey'
  ) THEN
    ALTER TABLE "project_resource_assignments"
      ADD CONSTRAINT "project_resource_assignments_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_resource_assignments_userId_fkey'
  ) THEN
    ALTER TABLE "project_resource_assignments"
      ADD CONSTRAINT "project_resource_assignments_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

