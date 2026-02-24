-- =============================================================================
-- CRM Module Enhancement Migration
-- Phase: CRM Industry-Leader Feature Parity
-- 
-- New tables: segments, segment_members, lead_scoring_rules, contact_notes,
--             form_captures
-- =============================================================================

-- ============================================================================
-- SEGMENTS (Smart Lists / Dynamic Contact Groups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  
  -- Filter criteria stored as JSONB array of filter rules
  -- Each rule: { field, operator, value }
  -- operator: equals, not_equals, contains, not_contains, starts_with,
  --           greater_than, less_than, is_empty, is_not_empty, in, not_in
  filters JSONB NOT NULL DEFAULT '[]',
  filter_logic TEXT DEFAULT 'and', -- 'and' | 'or'
  
  -- Segment type
  segment_type TEXT NOT NULL DEFAULT 'dynamic', -- 'dynamic' | 'static'
  
  -- Cached count for quick display
  contact_count INTEGER DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_segments_site ON mod_crmmod01_segments(site_id);

-- Static segment members (for static segments)
CREATE TABLE IF NOT EXISTS mod_crmmod01_segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES mod_crmmod01_segments(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES mod_crmmod01_contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(segment_id, contact_id)
);

CREATE INDEX idx_crm_segment_members_segment ON mod_crmmod01_segment_members(segment_id);
CREATE INDEX idx_crm_segment_members_contact ON mod_crmmod01_segment_members(contact_id);

-- RLS for segments
ALTER TABLE mod_crmmod01_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_segment_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "segments_site_access" ON mod_crmmod01_segments
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "segment_members_access" ON mod_crmmod01_segment_members
  FOR ALL USING (
    segment_id IN (
      SELECT seg.id FROM mod_crmmod01_segments seg
      JOIN sites s ON s.id = seg.site_id
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- ============================================================================
-- LEAD SCORING RULES (Automatic Contact Scoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Rule definition
  -- category: 'demographic' | 'behavioral' | 'engagement' | 'firmographic'
  category TEXT NOT NULL DEFAULT 'demographic',
  
  -- Condition: { field, operator, value }
  condition JSONB NOT NULL,
  
  -- Points to add/subtract (negative for decay)
  points INTEGER NOT NULL DEFAULT 0,
  
  -- Max times this rule can apply per contact (0 = unlimited)
  max_applications INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_scoring_rules_site ON mod_crmmod01_lead_scoring_rules(site_id);

ALTER TABLE mod_crmmod01_lead_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_rules_site_access" ON mod_crmmod01_lead_scoring_rules
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- ============================================================================
-- CONTACT NOTES (Rich Text Notes with Pinning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Polymorphic: can be on contact, company, or deal
  contact_id UUID REFERENCES mod_crmmod01_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES mod_crmmod01_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES mod_crmmod01_deals(id) ON DELETE CASCADE,
  
  title TEXT,
  content TEXT NOT NULL, -- Rich text HTML content
  content_plain TEXT,    -- Plain text extraction for search
  
  is_pinned BOOLEAN DEFAULT false,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_notes_contact ON mod_crmmod01_contact_notes(contact_id);
CREATE INDEX idx_crm_notes_company ON mod_crmmod01_contact_notes(company_id);
CREATE INDEX idx_crm_notes_deal ON mod_crmmod01_contact_notes(deal_id);
CREATE INDEX idx_crm_notes_site ON mod_crmmod01_contact_notes(site_id);

ALTER TABLE mod_crmmod01_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_site_access" ON mod_crmmod01_contact_notes
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FORM CAPTURES (Track Website Form → CRM Contact Pipeline)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_form_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Form info
  form_type TEXT NOT NULL DEFAULT 'contact', -- 'contact' | 'newsletter' | 'lead_capture' | 'custom'
  form_name TEXT,
  page_url TEXT,
  
  -- Submitted data (raw)
  form_data JSONB NOT NULL DEFAULT '{}',
  
  -- CRM linkage
  contact_id UUID REFERENCES mod_crmmod01_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES mod_crmmod01_deals(id) ON DELETE SET NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'new', -- 'new' | 'processed' | 'duplicate' | 'spam' | 'error'
  processing_notes TEXT,
  
  -- UTM / source tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer_url TEXT,
  
  -- Visitor info
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_form_captures_site ON mod_crmmod01_form_captures(site_id);
CREATE INDEX idx_crm_form_captures_contact ON mod_crmmod01_form_captures(contact_id);
CREATE INDEX idx_crm_form_captures_status ON mod_crmmod01_form_captures(status);
CREATE INDEX idx_crm_form_captures_type ON mod_crmmod01_form_captures(form_type);

ALTER TABLE mod_crmmod01_form_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_captures_site_access" ON mod_crmmod01_form_captures
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Allow public inserts for form submissions (no auth required)
CREATE POLICY "form_captures_public_insert" ON mod_crmmod01_form_captures
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_crm_enhanced_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_segments_updated
  BEFORE UPDATE ON mod_crmmod01_segments
  FOR EACH ROW EXECUTE FUNCTION update_crm_enhanced_timestamp();

CREATE TRIGGER trg_scoring_rules_updated
  BEFORE UPDATE ON mod_crmmod01_lead_scoring_rules
  FOR EACH ROW EXECUTE FUNCTION update_crm_enhanced_timestamp();

CREATE TRIGGER trg_notes_updated
  BEFORE UPDATE ON mod_crmmod01_contact_notes
  FOR EACH ROW EXECUTE FUNCTION update_crm_enhanced_timestamp();
