-- =============================================================================
-- Phase EM-50: CRM Module Database Schema
-- =============================================================================
-- Creates all tables for the CRM module with proper RLS policies
-- Module Short ID: crmmod01
-- Table Prefix: mod_crmmod01_
-- =============================================================================

-- =============================================================================
-- COMPANIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  domain TEXT,
  description TEXT,
  industry TEXT,
  website TEXT,
  phone TEXT,
  
  -- Size
  employee_count INTEGER,
  annual_revenue NUMERIC,
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  account_type TEXT CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor', 'other')),
  
  -- Custom
  custom_fields JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_crmmod01_companies_site ON mod_crmmod01_companies(site_id);
CREATE INDEX idx_mod_crmmod01_companies_status ON mod_crmmod01_companies(status);
CREATE INDEX idx_mod_crmmod01_companies_account_type ON mod_crmmod01_companies(account_type);

-- =============================================================================
-- CONTACTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic Info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  
  -- Company
  company_id UUID REFERENCES mod_crmmod01_companies(id) ON DELETE SET NULL,
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  lead_status TEXT CHECK (lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  
  -- Source
  source TEXT,
  source_details TEXT,
  
  -- Social
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  -- Custom
  custom_fields JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Scoring
  lead_score INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_crmmod01_contacts_site ON mod_crmmod01_contacts(site_id);
CREATE INDEX idx_mod_crmmod01_contacts_company ON mod_crmmod01_contacts(company_id);
CREATE INDEX idx_mod_crmmod01_contacts_email ON mod_crmmod01_contacts(email);
CREATE INDEX idx_mod_crmmod01_contacts_status ON mod_crmmod01_contacts(status);

-- =============================================================================
-- PIPELINES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_crmmod01_pipelines_site ON mod_crmmod01_pipelines(site_id);

-- =============================================================================
-- PIPELINE STAGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES mod_crmmod01_pipelines(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  
  position INTEGER NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0,
  stage_type TEXT NOT NULL DEFAULT 'open' CHECK (stage_type IN ('open', 'won', 'lost')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_crmmod01_stages_pipeline ON mod_crmmod01_pipeline_stages(pipeline_id);
CREATE INDEX idx_mod_crmmod01_stages_position ON mod_crmmod01_pipeline_stages(position);

-- =============================================================================
-- DEALS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Relations
  contact_id UUID REFERENCES mod_crmmod01_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES mod_crmmod01_companies(id) ON DELETE SET NULL,
  
  -- Deal Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pipeline
  pipeline_id UUID REFERENCES mod_crmmod01_pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES mod_crmmod01_pipeline_stages(id) ON DELETE SET NULL,
  
  -- Value
  amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  probability INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  close_reason TEXT,
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Custom
  custom_fields JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_crmmod01_deals_site ON mod_crmmod01_deals(site_id);
CREATE INDEX idx_mod_crmmod01_deals_pipeline ON mod_crmmod01_deals(pipeline_id);
CREATE INDEX idx_mod_crmmod01_deals_stage ON mod_crmmod01_deals(stage_id);
CREATE INDEX idx_mod_crmmod01_deals_contact ON mod_crmmod01_deals(contact_id);
CREATE INDEX idx_mod_crmmod01_deals_company ON mod_crmmod01_deals(company_id);
CREATE INDEX idx_mod_crmmod01_deals_status ON mod_crmmod01_deals(status);

-- =============================================================================
-- ACTIVITIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'sms', 'chat')),
  
  -- Relations
  contact_id UUID REFERENCES mod_crmmod01_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES mod_crmmod01_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES mod_crmmod01_deals(id) ON DELETE SET NULL,
  
  -- Content
  subject TEXT,
  description TEXT,
  outcome TEXT,
  
  -- Call-specific
  call_duration_seconds INTEGER,
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
  call_recording_url TEXT,
  
  -- Email-specific
  email_thread_id TEXT,
  email_message_id TEXT,
  
  -- Meeting-specific
  meeting_location TEXT,
  meeting_attendees JSONB,
  
  -- Task-specific
  task_due_date TIMESTAMPTZ,
  task_completed BOOLEAN NOT NULL DEFAULT false,
  task_priority TEXT CHECK (task_priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_crmmod01_activities_site ON mod_crmmod01_activities(site_id);
CREATE INDEX idx_mod_crmmod01_activities_type ON mod_crmmod01_activities(activity_type);
CREATE INDEX idx_mod_crmmod01_activities_contact ON mod_crmmod01_activities(contact_id);
CREATE INDEX idx_mod_crmmod01_activities_deal ON mod_crmmod01_activities(deal_id);
CREATE INDEX idx_mod_crmmod01_activities_created ON mod_crmmod01_activities(created_at DESC);

-- =============================================================================
-- TAGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(site_id, name, entity_type)
);

CREATE INDEX idx_mod_crmmod01_tags_site ON mod_crmmod01_tags(site_id);
CREATE INDEX idx_mod_crmmod01_tags_type ON mod_crmmod01_tags(entity_type);

-- =============================================================================
-- CUSTOM FIELDS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_crmmod01_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date', 'select', 'multiselect', 'url', 'email', 'phone')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB, -- For select/multiselect types
  
  position INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(site_id, field_key, entity_type)
);

CREATE INDEX idx_mod_crmmod01_custom_fields_site ON mod_crmmod01_custom_fields(site_id);
CREATE INDEX idx_mod_crmmod01_custom_fields_type ON mod_crmmod01_custom_fields(entity_type);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE mod_crmmod01_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crmmod01_custom_fields ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view companies in their sites"
  ON mod_crmmod01_companies FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert companies in their sites"
  ON mod_crmmod01_companies FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update companies in their sites"
  ON mod_crmmod01_companies FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete companies in their sites"
  ON mod_crmmod01_companies FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- Contacts policies
CREATE POLICY "Users can view contacts in their sites"
  ON mod_crmmod01_contacts FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert contacts in their sites"
  ON mod_crmmod01_contacts FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update contacts in their sites"
  ON mod_crmmod01_contacts FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete contacts in their sites"
  ON mod_crmmod01_contacts FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- Pipelines policies
CREATE POLICY "Users can view pipelines in their sites"
  ON mod_crmmod01_pipelines FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Admins can manage pipelines"
  ON mod_crmmod01_pipelines FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- Pipeline stages policies (based on pipeline access)
CREATE POLICY "Users can view stages"
  ON mod_crmmod01_pipeline_stages FOR SELECT
  USING (pipeline_id IN (
    SELECT id FROM mod_crmmod01_pipelines 
    WHERE public.can_access_site(site_id)
  ));

CREATE POLICY "Admins can manage stages"
  ON mod_crmmod01_pipeline_stages FOR ALL
  USING (pipeline_id IN (
    SELECT p.id FROM mod_crmmod01_pipelines p
    JOIN sites s ON s.id = p.site_id
    JOIN agency_members am ON am.agency_id = s.agency_id
    WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
  ));

-- Deals policies
CREATE POLICY "Users can view deals in their sites"
  ON mod_crmmod01_deals FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert deals in their sites"
  ON mod_crmmod01_deals FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update deals in their sites"
  ON mod_crmmod01_deals FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete deals in their sites"
  ON mod_crmmod01_deals FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- Activities policies
CREATE POLICY "Users can view activities in their sites"
  ON mod_crmmod01_activities FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert activities in their sites"
  ON mod_crmmod01_activities FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update activities in their sites"
  ON mod_crmmod01_activities FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can delete their own activities"
  ON mod_crmmod01_activities FOR DELETE
  USING (
    created_by = auth.uid() OR (
      public.can_access_site(site_id) AND
      EXISTS (
        SELECT 1 FROM sites s
        JOIN agency_members am ON am.agency_id = s.agency_id
        WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
      )
    )
  );

-- Tags policies
CREATE POLICY "Users can view tags in their sites"
  ON mod_crmmod01_tags FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can manage tags"
  ON mod_crmmod01_tags FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

-- Custom fields policies
CREATE POLICY "Users can view custom fields in their sites"
  ON mod_crmmod01_custom_fields FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Admins can manage custom fields"
  ON mod_crmmod01_custom_fields FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- SERVICE ROLE BYPASS POLICIES
-- =============================================================================

CREATE POLICY "Service role bypass for companies"
  ON mod_crmmod01_companies FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for contacts"
  ON mod_crmmod01_contacts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for pipelines"
  ON mod_crmmod01_pipelines FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for stages"
  ON mod_crmmod01_pipeline_stages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for deals"
  ON mod_crmmod01_deals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for activities"
  ON mod_crmmod01_activities FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for tags"
  ON mod_crmmod01_tags FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for custom fields"
  ON mod_crmmod01_custom_fields FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION mod_crmmod01_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_timestamp
  BEFORE UPDATE ON mod_crmmod01_companies
  FOR EACH ROW EXECUTE FUNCTION mod_crmmod01_update_timestamp();

CREATE TRIGGER update_contacts_timestamp
  BEFORE UPDATE ON mod_crmmod01_contacts
  FOR EACH ROW EXECUTE FUNCTION mod_crmmod01_update_timestamp();

CREATE TRIGGER update_deals_timestamp
  BEFORE UPDATE ON mod_crmmod01_deals
  FOR EACH ROW EXECUTE FUNCTION mod_crmmod01_update_timestamp();

CREATE TRIGGER update_activities_timestamp
  BEFORE UPDATE ON mod_crmmod01_activities
  FOR EACH ROW EXECUTE FUNCTION mod_crmmod01_update_timestamp();

CREATE TRIGGER update_custom_fields_timestamp
  BEFORE UPDATE ON mod_crmmod01_custom_fields
  FOR EACH ROW EXECUTE FUNCTION mod_crmmod01_update_timestamp();

-- =============================================================================
-- SEED DEFAULT DATA FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION mod_crmmod01_init_site(p_site_id UUID)
RETURNS VOID AS $$
DECLARE
  v_pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO mod_crmmod01_pipelines (site_id, name, description, is_default)
  VALUES (p_site_id, 'Sales Pipeline', 'Default sales pipeline', true)
  RETURNING id INTO v_pipeline_id;
  
  -- Create default stages
  INSERT INTO mod_crmmod01_pipeline_stages (pipeline_id, name, color, position, probability, stage_type) VALUES
    (v_pipeline_id, 'Lead', '#94a3b8', 0, 10, 'open'),
    (v_pipeline_id, 'Qualified', '#3b82f6', 1, 25, 'open'),
    (v_pipeline_id, 'Proposal', '#8b5cf6', 2, 50, 'open'),
    (v_pipeline_id, 'Negotiation', '#f59e0b', 3, 75, 'open'),
    (v_pipeline_id, 'Won', '#22c55e', 4, 100, 'won'),
    (v_pipeline_id, 'Lost', '#ef4444', 5, 0, 'lost');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE mod_crmmod01_companies IS 'CRM Module: Company/Account records';
COMMENT ON TABLE mod_crmmod01_contacts IS 'CRM Module: Contact/Person records';
COMMENT ON TABLE mod_crmmod01_pipelines IS 'CRM Module: Sales pipelines';
COMMENT ON TABLE mod_crmmod01_pipeline_stages IS 'CRM Module: Pipeline stages/steps';
COMMENT ON TABLE mod_crmmod01_deals IS 'CRM Module: Deal/Opportunity records';
COMMENT ON TABLE mod_crmmod01_activities IS 'CRM Module: Activity log (calls, emails, meetings, tasks)';
COMMENT ON TABLE mod_crmmod01_tags IS 'CRM Module: Tags for organizing records';
COMMENT ON TABLE mod_crmmod01_custom_fields IS 'CRM Module: Custom field definitions';
