-- Phase 82: Form Submissions System
-- Form settings per site/form
CREATE TABLE IF NOT EXISTS form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL, -- ID from the form component
  
  -- Configuration
  form_name TEXT DEFAULT 'Contact Form',
  success_message TEXT DEFAULT 'Thank you for your submission!',
  redirect_url TEXT,
  
  -- Notifications
  notify_emails TEXT[], -- Array of email addresses
  notify_on_submission BOOLEAN DEFAULT TRUE,
  
  -- Spam protection
  enable_honeypot BOOLEAN DEFAULT TRUE,
  enable_rate_limit BOOLEAN DEFAULT TRUE,
  rate_limit_per_hour INTEGER DEFAULT 10,
  
  -- Storage
  retention_days INTEGER DEFAULT 365,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, form_id)
);

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  
  -- Submission data
  data JSONB NOT NULL, -- Form field values
  
  -- Metadata
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  
  -- Status
  status TEXT DEFAULT 'new', -- new, read, archived, spam
  is_spam BOOLEAN DEFAULT FALSE,
  
  -- Processing
  notified_at TIMESTAMPTZ,
  webhook_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS form_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT, -- NULL means all forms
  
  -- Webhook config
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST', -- POST, PUT
  headers JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_site ON form_submissions(site_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_settings_site ON form_settings(site_id);
CREATE INDEX IF NOT EXISTS idx_form_webhooks_site ON form_webhooks(site_id);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Super admins have full access to submissions" ON form_submissions;
DROP POLICY IF EXISTS "Agency members can view their agency submissions" ON form_submissions;
DROP POLICY IF EXISTS "Agency owners/admins can delete submissions" ON form_submissions;
DROP POLICY IF EXISTS "Agency members can update submissions" ON form_submissions;
DROP POLICY IF EXISTS "Super admins have full access to form settings" ON form_settings;
DROP POLICY IF EXISTS "Agency members can view form settings" ON form_settings;
DROP POLICY IF EXISTS "Agency owners/admins can manage form settings" ON form_settings;
DROP POLICY IF EXISTS "Super admins have full access to webhooks" ON form_webhooks;
DROP POLICY IF EXISTS "Agency owners/admins can manage webhooks" ON form_webhooks;
DROP POLICY IF EXISTS "Service role can insert submissions" ON form_submissions;

-- RLS Policies for form_submissions
-- Super admins can do everything
CREATE POLICY "Super admins have full access to submissions"
ON form_submissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Agency members can view submissions for sites in their agency
CREATE POLICY "Agency members can view their agency submissions"
ON form_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_submissions.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Agency owners/admins can delete submissions
CREATE POLICY "Agency owners/admins can delete submissions"
ON form_submissions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_submissions.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- Agency members can update submissions (for marking as read, etc.)
CREATE POLICY "Agency members can update submissions"
ON form_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_submissions.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Service role policy for public form submissions (via API)
CREATE POLICY "Service role can insert submissions"
ON form_submissions FOR INSERT
TO service_role
WITH CHECK (true);

-- RLS Policies for form_settings
CREATE POLICY "Super admins have full access to form settings"
ON form_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Agency members can view form settings"
ON form_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_settings.site_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Agency owners/admins can manage form settings"
ON form_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_settings.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- RLS Policies for form_webhooks
CREATE POLICY "Super admins have full access to webhooks"
ON form_webhooks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Agency owners/admins can manage webhooks"
ON form_webhooks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = form_webhooks.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- Add trigger for updated_at on form_settings
CREATE OR REPLACE FUNCTION update_form_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS form_settings_updated_at ON form_settings;
CREATE TRIGGER form_settings_updated_at
  BEFORE UPDATE ON form_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_form_settings_updated_at();

-- Add trigger for updated_at on form_webhooks
DROP TRIGGER IF EXISTS form_webhooks_updated_at ON form_webhooks;
CREATE TRIGGER form_webhooks_updated_at
  BEFORE UPDATE ON form_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_form_settings_updated_at();
