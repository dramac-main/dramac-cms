-- ============================================================
-- LPB-11: Add migration tracking columns
-- ============================================================

ALTER TABLE mod_mktmod01_landing_pages
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS migration_source TEXT DEFAULT NULL;
-- migration_source: 'auto' | 'manual' | null

-- Index for finding unmigrated pages
CREATE INDEX IF NOT EXISTS idx_lp_migration_status
ON mod_mktmod01_landing_pages(use_studio_format, migrated_at)
WHERE use_studio_format = false OR use_studio_format IS NULL;
