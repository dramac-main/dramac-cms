-- ======================================
-- CRM MODULE DATABASE SCHEMA
-- ======================================
-- Phase EM-50: CRM Module - Enterprise Ready
-- 
-- IMPORTANT: This SQL is processed by the Module Schema Manager
-- Table names like "contacts" become "mod_{short_id}.contacts"
-- See: PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md
--
-- Variable substitution (set by deployment system):
-- ${SCHEMA} = mod_{short_id} (e.g., mod_a1b2c3d4)
-- ======================================

-- Create the module's dedicated schema
CREATE SCHEMA IF NOT EXISTS ${SCHEMA};

-- ----------------------
-- COMPANIES / ACCOUNTS
-- ----------------------
-- Companies must be created first since contacts reference them
CREATE TABLE IF NOT EXISTS ${SCHEMA}.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,
  owner_id UUID,
  
  -- Basic Info
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  
  -- Size
  employee_count INTEGER,
  annual_revenue DECIMAL(15, 2),
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  account_type TEXT CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor', 'other')),
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- PIPELINES
-- ----------------------
-- Pipelines must be created before deals and stages reference them
CREATE TABLE IF NOT EXISTS ${SCHEMA}.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Configuration
  deal_rotting_days INTEGER DEFAULT 30, -- Days before deal is considered "stuck"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- PIPELINE STAGES
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES ${SCHEMA}.pipelines(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  
  -- Position and probability
  position INTEGER NOT NULL DEFAULT 0,
  probability INTEGER DEFAULT 50,
  
  -- Type
  stage_type TEXT DEFAULT 'open' CHECK (stage_type IN ('open', 'won', 'lost')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- CONTACTS
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,  -- Module installed on this site
  owner_id UUID,          -- User who owns this contact
  
  -- Basic Info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  
  -- Company Link
  company_id UUID REFERENCES ${SCHEMA}.companies(id) ON DELETE SET NULL,
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  lead_status TEXT CHECK (lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  
  -- Source
  source TEXT,  -- 'website', 'referral', 'cold_call', 'event', etc.
  source_details TEXT,
  
  -- Social
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  -- Custom Fields (flexible JSON)
  custom_fields JSONB DEFAULT '{}',
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- Scoring
  lead_score INTEGER DEFAULT 0,
  
  -- Timestamps
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- DEALS / OPPORTUNITIES
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,
  owner_id UUID,
  
  -- Relations
  contact_id UUID REFERENCES ${SCHEMA}.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES ${SCHEMA}.companies(id) ON DELETE SET NULL,
  
  -- Deal Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pipeline
  pipeline_id UUID REFERENCES ${SCHEMA}.pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES ${SCHEMA}.pipeline_stages(id) ON DELETE SET NULL,
  
  -- Value
  amount DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  weighted_value DECIMAL(15, 2) GENERATED ALWAYS AS (amount * probability / 100) STORED,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  close_reason TEXT,  -- Why won or lost
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- ACTIVITIES
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'task', 'note', 'sms', 'chat'
  )),
  
  -- Relations (at least one required)
  contact_id UUID REFERENCES ${SCHEMA}.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES ${SCHEMA}.companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES ${SCHEMA}.deals(id) ON DELETE CASCADE,
  
  -- Content
  subject TEXT,
  description TEXT,
  outcome TEXT,  -- Result of the activity
  
  -- Call-specific
  call_duration_seconds INTEGER,
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
  call_recording_url TEXT,
  
  -- Email-specific
  email_thread_id TEXT,
  email_message_id TEXT,
  
  -- Meeting-specific
  meeting_location TEXT,
  meeting_attendees JSONB DEFAULT '[]',  -- Array of attendee info
  
  -- Task-specific
  task_due_date TIMESTAMPTZ,
  task_completed BOOLEAN DEFAULT FALSE,
  task_priority TEXT CHECK (task_priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Assignment
  assigned_to UUID,
  created_by UUID,
  
  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- CUSTOM FIELD DEFINITIONS
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  -- What entity this field belongs to
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal', 'activity')),
  
  -- Field definition
  field_key TEXT NOT NULL,  -- Internal key (snake_case)
  field_label TEXT NOT NULL, -- Display label
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'number', 'currency', 'date', 'datetime', 
    'select', 'multiselect', 'checkbox', 'url', 'email', 'phone'
  )),
  
  -- Validation
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  placeholder TEXT,
  
  -- For select/multiselect
  options JSONB DEFAULT '[]',  -- [{ value, label, color }]
  
  -- Display
  position INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, entity_type, field_key)
);

-- ----------------------
-- TAGS
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, name)
);

-- ----------------------
-- EMAIL MESSAGES
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  user_id UUID,
  
  message_id TEXT UNIQUE,
  thread_id TEXT,
  
  contact_id UUID REFERENCES ${SCHEMA}.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES ${SCHEMA}.deals(id) ON DELETE SET NULL,
  
  from_address TEXT,
  from_name TEXT,
  to_addresses JSONB DEFAULT '[]',
  cc_addresses JSONB DEFAULT '[]',
  
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  is_outbound BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- EMAIL CONFIGS
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.email_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  email_address TEXT,
  
  credentials JSONB DEFAULT '{}',  -- Encrypted in production
  
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, user_id)
);

-- ----------------------
-- EMAIL TEMPLATES
-- ----------------------
CREATE TABLE IF NOT EXISTS ${SCHEMA}.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- INDEXES
-- ----------------------
CREATE INDEX IF NOT EXISTS idx_crm_contacts_site ON ${SCHEMA}.contacts(site_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON ${SCHEMA}.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON ${SCHEMA}.contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON ${SCHEMA}.contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead_status ON ${SCHEMA}.contacts(lead_status);

CREATE INDEX IF NOT EXISTS idx_crm_companies_site ON ${SCHEMA}.companies(site_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_status ON ${SCHEMA}.companies(status);

CREATE INDEX IF NOT EXISTS idx_crm_deals_site ON ${SCHEMA}.deals(site_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON ${SCHEMA}.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON ${SCHEMA}.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON ${SCHEMA}.deals(status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON ${SCHEMA}.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON ${SCHEMA}.deals(company_id);

CREATE INDEX IF NOT EXISTS idx_crm_activities_site ON ${SCHEMA}.activities(site_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON ${SCHEMA}.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON ${SCHEMA}.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON ${SCHEMA}.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled ON ${SCHEMA}.activities(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_pipeline ON ${SCHEMA}.pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_messages_contact ON ${SCHEMA}.email_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_messages_thread ON ${SCHEMA}.email_messages(thread_id);

-- ----------------------
-- RLS POLICIES
-- ----------------------
ALTER TABLE ${SCHEMA}.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.email_templates ENABLE ROW LEVEL SECURITY;

-- Generic site access policy function (applies to most tables)
-- Users can access data for sites they have membership in

-- Contacts policies
CREATE POLICY "crm_contacts_select" ON ${SCHEMA}.contacts
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "crm_contacts_insert" ON ${SCHEMA}.contacts
  FOR INSERT WITH CHECK (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "crm_contacts_update" ON ${SCHEMA}.contacts
  FOR UPDATE USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "crm_contacts_delete" ON ${SCHEMA}.contacts
  FOR DELETE USING (
    site_id IN (
      SELECT site_id FROM public.site_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Companies policies
CREATE POLICY "crm_companies_all" ON ${SCHEMA}.companies
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Deals policies
CREATE POLICY "crm_deals_all" ON ${SCHEMA}.deals
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Activities policies
CREATE POLICY "crm_activities_all" ON ${SCHEMA}.activities
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Pipelines policies
CREATE POLICY "crm_pipelines_all" ON ${SCHEMA}.pipelines
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Pipeline stages policies (inherit from pipeline)
CREATE POLICY "crm_pipeline_stages_all" ON ${SCHEMA}.pipeline_stages
  FOR ALL USING (
    pipeline_id IN (
      SELECT id FROM ${SCHEMA}.pipelines WHERE site_id IN (
        SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
      )
    )
  );

-- Custom fields policies
CREATE POLICY "crm_custom_fields_all" ON ${SCHEMA}.custom_fields
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Tags policies
CREATE POLICY "crm_tags_all" ON ${SCHEMA}.tags
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Email messages policies
CREATE POLICY "crm_email_messages_all" ON ${SCHEMA}.email_messages
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- Email configs policies (user-specific)
CREATE POLICY "crm_email_configs_all" ON ${SCHEMA}.email_configs
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Email templates policies
CREATE POLICY "crm_email_templates_all" ON ${SCHEMA}.email_templates
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
    )
  );

-- ----------------------
-- TRIGGERS
-- ----------------------

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION ${SCHEMA}.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON ${SCHEMA}.contacts
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON ${SCHEMA}.companies
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON ${SCHEMA}.deals
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON ${SCHEMA}.activities
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON ${SCHEMA}.pipelines
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

CREATE TRIGGER update_crm_email_configs_updated_at
  BEFORE UPDATE ON ${SCHEMA}.email_configs
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

CREATE TRIGGER update_crm_email_templates_updated_at
  BEFORE UPDATE ON ${SCHEMA}.email_templates
  FOR EACH ROW EXECUTE FUNCTION ${SCHEMA}.update_updated_at_column();

-- ----------------------
-- DEFAULT DATA
-- ----------------------

-- Insert default pipeline for new installations (handled by application code)
-- This is a template for what gets inserted when module is installed:
-- INSERT INTO ${SCHEMA}.pipelines (site_id, name, is_default, is_active)
-- VALUES ($1, 'Sales Pipeline', true, true);
--
-- Default stages template:
-- INSERT INTO ${SCHEMA}.pipeline_stages (pipeline_id, name, position, probability, stage_type, color)
-- VALUES 
--   ($1, 'Lead', 0, 10, 'open', '#94a3b8'),
--   ($1, 'Qualified', 1, 25, 'open', '#3b82f6'),
--   ($1, 'Proposal', 2, 50, 'open', '#8b5cf6'),
--   ($1, 'Negotiation', 3, 75, 'open', '#f59e0b'),
--   ($1, 'Won', 4, 100, 'won', '#22c55e'),
--   ($1, 'Lost', 5, 0, 'lost', '#ef4444');
