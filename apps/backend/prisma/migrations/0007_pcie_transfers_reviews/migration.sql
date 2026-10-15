-- Add pcie_status and custodian_id to batches
ALTER TABLE "batches"
  ADD COLUMN IF NOT EXISTS "pcie_status" TEXT DEFAULT 'PASS',
  ADD COLUMN IF NOT EXISTS "custodian_id" TEXT;

-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Create plantation_versions table
CREATE TABLE IF NOT EXISTS "plantation_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "farm_plot_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "polygon_geojson" JSONB NOT NULL,
  "area_ha" DECIMAL(12, 4) NOT NULL,
  "crop" TEXT NOT NULL,
  "variety" TEXT,
  "valid_from" TIMESTAMP(3) NOT NULL,
  "valid_to" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plantation_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "plantation_versions_farm_plot_id_fkey" FOREIGN KEY ("farm_plot_id") REFERENCES "farm_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "plantation_versions_farm_plot_id_version_idx"
  ON "plantation_versions"("farm_plot_id", "version");

-- Create transfers table
CREATE TABLE IF NOT EXISTS "transfers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "batch_id" TEXT NOT NULL,
  "sender_actor_id" TEXT NOT NULL,
  "receiver_actor_id" TEXT NOT NULL,
  "quantity_kg" DECIMAL(14, 3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_RECEIPT',
  "notes" TEXT,
  "rejection_reason" TEXT,
  "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decided_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transfers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transfers_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "transfers_batch_id_idx"
  ON "transfers"("batch_id");

CREATE INDEX IF NOT EXISTS "transfers_receiver_actor_id_status_idx"
  ON "transfers"("receiver_actor_id", "status");

-- Create review_cases table
CREATE TABLE IF NOT EXISTS "review_cases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "batch_id" TEXT NOT NULL,
  "event_id" TEXT,
  "rule_code" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'WARNING',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "assigned_to" TEXT,
  "title" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "expected" JSONB,
  "observed" JSONB,
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  "disposition" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_cases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_cases_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "review_cases_status_idx"
  ON "review_cases"("status");

CREATE INDEX IF NOT EXISTS "review_cases_batch_id_idx"
  ON "review_cases"("batch_id");

-- Create review_actions table
CREATE TABLE IF NOT EXISTS "review_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "case_id" UUID NOT NULL,
  "reviewer_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "supplemental_evidence_ids" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "review_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "review_actions_case_id_idx"
  ON "review_actions"("case_id");
