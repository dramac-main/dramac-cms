-- ============================================================================
-- CRM Form Builder — Form Definitions Table
-- Phase EM-50b: CRM Form Builder for custom lead capture forms
-- ============================================================================

-- Form definitions: each row is a custom form created by site owners
CREATE TABLE IF NOT EXISTS mod_crmmod01_form_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  fields        JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'archived')),
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
  submission_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique slug per site
  CONSTRAINT uq_crm_form_slug UNIQUE (site_id, slug)
);

-- Index for listing forms by site
CREATE INDEX IF NOT EXISTS idx_crm_form_definitions_site
  ON mod_crmmod01_form_definitions(site_id, status);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER trg_crm_form_definitions_updated_at
  BEFORE UPDATE ON mod_crmmod01_form_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE mod_crmmod01_form_definitions ENABLE ROW LEVEL SECURITY;

-- Members can view forms for their sites
CREATE POLICY "crm_form_defs_select" ON mod_crmmod01_form_definitions
  FOR SELECT
  USING (can_access_site(site_id));

-- Members can create forms
CREATE POLICY "crm_form_defs_insert" ON mod_crmmod01_form_definitions
  FOR INSERT
  WITH CHECK (can_access_site(site_id));

-- Members can update forms
CREATE POLICY "crm_form_defs_update" ON mod_crmmod01_form_definitions
  FOR UPDATE
  USING (can_access_site(site_id));

-- Only admins can delete (soft-delete via status = 'archived' preferred)
CREATE POLICY "crm_form_defs_delete" ON mod_crmmod01_form_definitions
  FOR DELETE
  USING (can_access_site(site_id));

-- Service role bypass
CREATE POLICY "crm_form_defs_service_role" ON mod_crmmod01_form_definitions
  FOR ALL
  USING (auth.role() = 'service_role');
