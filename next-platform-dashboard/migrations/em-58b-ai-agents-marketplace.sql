-- ============================================================================
-- Phase EM-58B: AI Agents Marketplace & Templates Schema
-- Created: 2026-01-28
-- Description: Marketplace, installations, reviews, and templates
-- Dependencies: EM-58 (AI Agents Core)
-- ============================================================================

-- ============================================================================
-- AGENT TEMPLATES
-- ============================================================================

-- Pre-built Agent Templates
CREATE TABLE IF NOT EXISTS ai_agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  template_id TEXT NOT NULL UNIQUE,   -- 'lead-qualifier', 'support-triage', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  
  -- Categorization
  category TEXT NOT NULL,             -- 'sales', 'support', 'marketing', etc.
  tags TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '🤖',
  
  -- Difficulty & Setup
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  setup_time TEXT DEFAULT '5 minutes',
  
  -- Default Configuration
  default_config JSONB NOT NULL,      -- AgentConfig defaults
  
  -- Setup Wizard
  setup_questions JSONB DEFAULT '[]', -- Questions to customize template
  
  -- Customization Function (stored as template)
  customization_template TEXT,        -- Handlebars template for system prompt
  
  -- Requirements
  required_tools TEXT[] DEFAULT '{}',
  required_modules TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  
  -- Stats
  installs_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MARKETPLACE
-- ============================================================================

-- Marketplace Agent Listings
CREATE TABLE IF NOT EXISTS ai_agent_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template reference
  template_id TEXT NOT NULL UNIQUE,
  
  -- Listing info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '🤖',
  screenshots TEXT[] DEFAULT '{}',
  demo_video_url TEXT,
  
  -- Author
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_verified BOOLEAN DEFAULT false,
  
  -- Pricing
  pricing_type TEXT CHECK (pricing_type IN ('free', 'one_time', 'subscription')) DEFAULT 'free',
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  price_one_time DECIMAL(10,2),
  
  -- Stats
  installs_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  requirements TEXT[] DEFAULT '{}',   -- Required modules, integrations
  version TEXT DEFAULT '1.0.0',
  changelog JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Reviews
CREATE TABLE IF NOT EXISTS ai_agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES ai_agent_marketplace(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Helpfulness
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (marketplace_id, user_id)
);

-- Agent Installations
CREATE TABLE IF NOT EXISTS ai_agent_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  marketplace_id UUID NOT NULL REFERENCES ai_agent_marketplace(id) ON DELETE RESTRICT,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  
  -- Installation info
  installed_version TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Licensing
  license_type TEXT,
  license_expires_at TIMESTAMPTZ,
  
  -- Usage
  total_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  
  UNIQUE (site_id, marketplace_id)
);

-- ============================================================================
-- USAGE & BILLING
-- ============================================================================

-- AI Usage Limits by Plan
CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL UNIQUE,        -- 'free', 'starter', 'pro', 'enterprise'
  
  -- Limits
  max_agents INTEGER NOT NULL DEFAULT 2,
  max_runs_per_month INTEGER NOT NULL DEFAULT 100,
  max_actions_per_month INTEGER NOT NULL DEFAULT 100,
  max_tokens_per_month BIGINT DEFAULT 100000,
  
  -- Allowed models
  allowed_models TEXT[] DEFAULT '{"gpt-4o-mini"}',
  
  -- Overage
  allows_overage BOOLEAN DEFAULT false,
  overage_rate_per_run DECIMAL(10,6) DEFAULT 0.005,
  overage_rate_per_action DECIMAL(10,6) DEFAULT 0.01,
  
  -- Features
  marketplace_access BOOLEAN DEFAULT false,
  custom_agents BOOLEAN DEFAULT false,
  priority_queue BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO ai_usage_limits (plan_id, max_agents, max_runs_per_month, max_actions_per_month, allowed_models, allows_overage, marketplace_access, custom_agents, priority_queue)
VALUES 
  ('free', 2, 100, 100, '{"gpt-4o-mini"}', false, false, false, false),
  ('starter', 5, 500, 500, '{"gpt-4o-mini","gpt-4o"}', true, false, true, false),
  ('pro', 25, 5000, 5000, '{"gpt-4o-mini","gpt-4o","claude-3-5-sonnet"}', true, true, true, true),
  ('enterprise', -1, -1, -1, '{"*"}', true, true, true, true)
ON CONFLICT (plan_id) DO NOTHING;

-- Overage Tracking
CREATE TABLE IF NOT EXISTS ai_usage_overage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Overage details
  overage_type TEXT NOT NULL CHECK (overage_type IN ('ai_run', 'ai_action', 'ai_tokens')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,6) NOT NULL,
  total_amount DECIMAL(10,4) NOT NULL,
  
  -- Model used (for pricing tier)
  model_used TEXT,
  
  -- Status
  is_billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMPTZ,
  invoice_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, billing_period_start, overage_type, model_used)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_agent_templates_category ON ai_agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_agent_templates_active ON ai_agent_templates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_agent_marketplace_category ON ai_agent_marketplace(category);
CREATE INDEX IF NOT EXISTS idx_ai_agent_marketplace_status ON ai_agent_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_marketplace_rating ON ai_agent_marketplace(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_marketplace_installs ON ai_agent_marketplace(installs_count DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_reviews_marketplace ON ai_agent_reviews(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_reviews_user ON ai_agent_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_installations_site ON ai_agent_installations(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_installations_marketplace ON ai_agent_installations(marketplace_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_overage_site ON ai_usage_overage(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_overage_period ON ai_usage_overage(billing_period_start, billing_period_end);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ai_agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_overage ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "ai_agent_templates_service_role" ON ai_agent_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_marketplace_service_role" ON ai_agent_marketplace FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_reviews_service_role" ON ai_agent_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_installations_service_role" ON ai_agent_installations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_usage_limits_service_role" ON ai_usage_limits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_usage_overage_service_role" ON ai_usage_overage FOR ALL USING (auth.role() = 'service_role');

-- Templates are public read
CREATE POLICY "ai_agent_templates_read" ON ai_agent_templates
  FOR SELECT USING (is_active = true);

-- Marketplace is public read (approved only)
CREATE POLICY "ai_agent_marketplace_read" ON ai_agent_marketplace
  FOR SELECT USING (status = 'approved');

-- Authors can manage their listings
CREATE POLICY "ai_agent_marketplace_author" ON ai_agent_marketplace
  FOR ALL USING (author_id = auth.uid());

-- Reviews are public read, own write
CREATE POLICY "ai_agent_reviews_read" ON ai_agent_reviews
  FOR SELECT USING (NOT is_hidden);

CREATE POLICY "ai_agent_reviews_own" ON ai_agent_reviews
  FOR ALL USING (user_id = auth.uid());

-- Installations are site-scoped
CREATE POLICY "ai_agent_installations_access" ON ai_agent_installations
  FOR ALL USING (public.can_access_site(site_id));

-- Usage limits are read-only
CREATE POLICY "ai_usage_limits_read" ON ai_usage_limits
  FOR SELECT USING (true);

-- Overage is site-scoped
CREATE POLICY "ai_usage_overage_access" ON ai_usage_overage
  FOR ALL USING (public.can_access_site(site_id));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Increment install count
CREATE OR REPLACE FUNCTION increment_marketplace_installs(p_marketplace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ai_agent_marketplace
  SET installs_count = installs_count + 1
  WHERE id = p_marketplace_id;
  
  -- Also update template if exists
  UPDATE ai_agent_templates
  SET installs_count = installs_count + 1
  WHERE template_id = (
    SELECT template_id FROM ai_agent_marketplace WHERE id = p_marketplace_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update marketplace rating
CREATE OR REPLACE FUNCTION update_marketplace_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg DECIMAL(3,2);
  v_count INTEGER;
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*)
  INTO v_avg, v_count
  FROM ai_agent_reviews
  WHERE marketplace_id = COALESCE(NEW.marketplace_id, OLD.marketplace_id)
    AND NOT is_hidden;
  
  UPDATE ai_agent_marketplace
  SET 
    rating_average = COALESCE(v_avg, 0),
    rating_count = COALESCE(v_count, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.marketplace_id, OLD.marketplace_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_marketplace_rating ON ai_agent_reviews;
CREATE TRIGGER trigger_update_marketplace_rating
  AFTER INSERT OR UPDATE OR DELETE ON ai_agent_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_rating();

-- Increment AI usage with overage tracking
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_site_id UUID,
  p_date DATE,
  p_runs INTEGER DEFAULT 0,
  p_tokens BIGINT DEFAULT 0,
  p_tool_calls INTEGER DEFAULT 0
)
RETURNS void AS $$
DECLARE
  v_plan_id TEXT;
  v_limits RECORD;
  v_current_runs INTEGER;
  v_current_tokens BIGINT;
  v_overage_runs INTEGER;
  v_overage_tokens BIGINT;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Upsert daily usage
  INSERT INTO ai_usage_daily (site_id, date, agent_runs, tokens_used, tool_calls)
  VALUES (p_site_id, p_date, p_runs, p_tokens, p_tool_calls)
  ON CONFLICT (site_id, date) 
  DO UPDATE SET 
    agent_runs = ai_usage_daily.agent_runs + p_runs,
    tokens_used = ai_usage_daily.tokens_used + p_tokens,
    tool_calls = ai_usage_daily.tool_calls + p_tool_calls;
  
  -- Get site's plan and limits
  SELECT COALESCE(s.plan_id, 'free') INTO v_plan_id
  FROM sites s WHERE s.id = p_site_id;
  
  SELECT * INTO v_limits FROM ai_usage_limits WHERE plan_id = v_plan_id;
  
  IF v_limits IS NULL THEN
    v_limits := (SELECT * FROM ai_usage_limits WHERE plan_id = 'free');
  END IF;
  
  -- Check for overage if limits apply
  IF v_limits.max_runs_per_month > 0 AND v_limits.allows_overage THEN
    v_period_start := date_trunc('month', p_date)::DATE;
    v_period_end := (date_trunc('month', p_date) + INTERVAL '1 month - 1 day')::DATE;
    
    SELECT COALESCE(SUM(agent_runs), 0) INTO v_current_runs
    FROM ai_usage_daily
    WHERE site_id = p_site_id
      AND date >= v_period_start
      AND date <= v_period_end;
    
    IF v_current_runs > v_limits.max_runs_per_month THEN
      v_overage_runs := v_current_runs - v_limits.max_runs_per_month;
      
      INSERT INTO ai_usage_overage (
        site_id, billing_period_start, billing_period_end,
        overage_type, quantity, unit_price, total_amount
      )
      VALUES (
        p_site_id, v_period_start, v_period_end,
        'ai_run', v_overage_runs, v_limits.overage_rate_per_run,
        v_overage_runs * v_limits.overage_rate_per_run
      )
      ON CONFLICT (site_id, billing_period_start, overage_type, model_used)
      DO UPDATE SET
        quantity = ai_usage_overage.quantity + p_runs,
        total_amount = (ai_usage_overage.quantity + p_runs) * v_limits.overage_rate_per_run;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if site can run agent (usage limits)
CREATE OR REPLACE FUNCTION can_run_agent(
  p_site_id UUID,
  p_model TEXT DEFAULT 'gpt-4o-mini'
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_runs INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_plan_id TEXT;
  v_limits RECORD;
  v_current_runs INTEGER;
  v_period_start DATE;
BEGIN
  -- Get site's plan
  SELECT COALESCE(s.plan_id, 'free') INTO v_plan_id
  FROM sites s WHERE s.id = p_site_id;
  
  SELECT * INTO v_limits FROM ai_usage_limits WHERE plan_id = v_plan_id;
  
  IF v_limits IS NULL THEN
    RETURN QUERY SELECT false, 0, 'No usage limits configured';
    RETURN;
  END IF;
  
  -- Check model allowance
  IF NOT (v_limits.allowed_models @> ARRAY[p_model] OR v_limits.allowed_models @> ARRAY['*']) THEN
    RETURN QUERY SELECT false, 0, format('Model %s not available on %s plan', p_model, v_plan_id);
    RETURN;
  END IF;
  
  -- Enterprise has unlimited
  IF v_limits.max_runs_per_month < 0 THEN
    RETURN QUERY SELECT true, -1, 'Unlimited';
    RETURN;
  END IF;
  
  -- Check current month usage
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  
  SELECT COALESCE(SUM(agent_runs), 0) INTO v_current_runs
  FROM ai_usage_daily
  WHERE site_id = p_site_id
    AND date >= v_period_start;
  
  IF v_current_runs >= v_limits.max_runs_per_month THEN
    IF v_limits.allows_overage THEN
      RETURN QUERY SELECT true, -1, 'Overage enabled';
    ELSE
      RETURN QUERY SELECT false, 0, format('Monthly limit of %s runs reached', v_limits.max_runs_per_month);
    END IF;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_limits.max_runs_per_month - v_current_runs, 'OK';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================

INSERT INTO ai_agent_templates (template_id, name, description, category, icon, difficulty, setup_time, default_config)
VALUES
  (
    'lead-qualifier',
    'Lead Qualifier',
    'Automatically qualifies and scores new leads based on your ICP',
    'sales',
    '🎯',
    'beginner',
    '5 minutes',
    '{
      "name": "Lead Qualifier",
      "agentType": "specialist",
      "domain": "sales",
      "personality": "You are an expert lead qualifier with deep knowledge of B2B sales. You analyze leads quickly and accurately, looking for signals that indicate a good fit with your company''s ideal customer profile (ICP).",
      "systemPrompt": "## Your Mission\nQualify every new lead that enters the system by:\n1. Researching the lead''s company and role\n2. Scoring them against the ICP criteria\n3. Recommending next actions based on score\n\n## Scoring System\n- 80-100: Hot lead → Immediate outreach\n- 60-79: Warm lead → Nurture sequence\n- 40-59: Cold lead → Add to long-term nurture\n- 0-39: Unqualified → Archive",
      "goals": [{"name": "Qualification Accuracy", "priority": 9, "successMetric": "qualification_accuracy", "targetValue": 0.85}],
      "triggerEvents": ["crm.contact.created", "form.submitted"],
      "allowedTools": ["crm_get_contact", "crm_update_contact", "crm_add_note", "crm_add_tag", "web_search", "data_query"],
      "constraints": ["Do not send emails directly - only draft or recommend", "Do not delete or modify contact information"],
      "llmModel": "gpt-4o-mini",
      "temperature": 0.3,
      "maxStepsPerRun": 5
    }'
  ),
  (
    'customer-health-monitor',
    'Customer Health Monitor',
    'Monitors customer engagement and predicts churn risk',
    'customer-success',
    '💚',
    'intermediate',
    '10 minutes',
    '{
      "name": "Health Monitor",
      "agentType": "guardian",
      "domain": "operations",
      "personality": "You are a vigilant customer success monitor who deeply cares about customer outcomes. You are proactive in identifying at-risk customers and always provide actionable recommendations.",
      "systemPrompt": "## Your Mission\nMonitor all customers daily and:\n1. Calculate health scores based on engagement signals\n2. Identify at-risk customers early\n3. Recommend interventions for declining accounts\n\n## Health Score Components\n- Login Frequency (25%)\n- Feature Usage (25%)\n- Support Tickets (20%)\n- Billing Status (15%)\n- Engagement Trend (15%)\n\n## Alert Thresholds\n- 80-100: Healthy\n- 60-79: Needs Attention\n- 40-59: At Risk\n- 0-39: Critical",
      "goals": [{"name": "Early Detection", "priority": 10, "successMetric": "early_churn_detection_rate", "targetValue": 0.90}],
      "triggerEvents": ["schedule:daily_6am"],
      "allowedTools": ["data_query", "data_aggregate", "crm_search_contacts", "crm_add_note", "crm_add_tag", "task_create", "notify_user"],
      "constraints": ["Never contact customers directly", "Escalate critical accounts to humans immediately"],
      "llmModel": "gpt-4o",
      "temperature": 0.5,
      "maxStepsPerRun": 15
    }'
  ),
  (
    'support-triage',
    'Support Triage',
    'Automatically categorizes, prioritizes, and routes support tickets',
    'support',
    '🎫',
    'beginner',
    '5 minutes',
    '{
      "name": "Support Triage",
      "agentType": "specialist",
      "domain": "support",
      "personality": "You are an efficient support triage specialist who ensures every ticket gets to the right person quickly. You are empathetic to customer frustration but systematic in your approach.",
      "systemPrompt": "## Your Mission\nFor every new support ticket:\n1. Categorize the issue type\n2. Assess priority based on impact and urgency\n3. Route to the appropriate team/person\n4. Provide initial response if possible\n\n## Categories\n- Technical: Bugs, errors, integration issues\n- Billing: Invoices, payments, refunds\n- Account: Login, permissions, settings\n- Feature Request: New features, improvements\n- How-To: Usage questions, documentation\n- Complaint: Service issues, dissatisfaction",
      "goals": [{"name": "Triage Speed", "priority": 8, "successMetric": "avg_triage_time_seconds", "targetValue": 300}],
      "triggerEvents": ["support.ticket.created"],
      "allowedTools": ["data_query", "crm_get_contact", "crm_add_note", "email_draft", "task_create", "notify_user"],
      "constraints": ["Never close a ticket without resolution", "Always be empathetic in responses", "Escalate billing disputes to humans"],
      "llmModel": "gpt-4o-mini",
      "temperature": 0.3,
      "maxStepsPerRun": 5
    }'
  ),
  (
    'meeting-scheduler',
    'Meeting Scheduler',
    'Intelligently schedules meetings based on availability and preferences',
    'scheduling',
    '📅',
    'beginner',
    '5 minutes',
    '{
      "name": "Meeting Scheduler",
      "agentType": "assistant",
      "domain": "operations",
      "personality": "You are a helpful scheduling assistant who finds the perfect meeting times for everyone. You respect time zones, preferences, and working hours.",
      "systemPrompt": "## Your Mission\nSchedule meetings efficiently by:\n1. Understanding the meeting purpose and participants\n2. Checking availability across calendars\n3. Proposing optimal time slots\n4. Sending calendar invites\n\n## Considerations\n- Time zone differences\n- Working hours preferences\n- Meeting buffer time\n- Priority of the meeting",
      "goals": [{"name": "Scheduling Success", "priority": 8, "successMetric": "meeting_scheduled_rate", "targetValue": 0.95}],
      "triggerEvents": ["meeting.request", "manual"],
      "allowedTools": ["calendar_check_availability", "calendar_create_event", "notify_user", "email_draft"],
      "constraints": ["Do not double-book participants", "Respect out-of-office blocks", "Always confirm time zones"],
      "llmModel": "gpt-4o-mini",
      "temperature": 0.4,
      "maxStepsPerRun": 5
    }'
  ),
  (
    'data-cleaner',
    'Data Cleaner',
    'Automatically finds and fixes data quality issues',
    'operations',
    '🧹',
    'intermediate',
    '10 minutes',
    '{
      "name": "Data Cleaner",
      "agentType": "analyst",
      "domain": "operations",
      "personality": "You are a meticulous data quality specialist who ensures data is clean, consistent, and reliable. You spot patterns and anomalies that humans might miss.",
      "systemPrompt": "## Your Mission\nMaintain data quality by:\n1. Finding duplicate records\n2. Identifying inconsistent formats\n3. Detecting missing required fields\n4. Flagging potential errors\n5. Suggesting or applying fixes\n\n## Data Quality Checks\n- Duplicate detection\n- Format validation (email, phone, etc.)\n- Required field completion\n- Value range validation\n- Cross-field consistency",
      "goals": [{"name": "Data Quality Score", "priority": 9, "successMetric": "data_quality_score", "targetValue": 0.95}],
      "triggerEvents": ["schedule:weekly"],
      "allowedTools": ["data_query", "data_aggregate", "crm_update_contact", "crm_merge_duplicates", "notify_user"],
      "constraints": ["Do not delete data without approval", "Always log changes made", "Keep backup of original values"],
      "llmModel": "gpt-4o",
      "temperature": 0.2,
      "maxStepsPerRun": 20
    }'
  ),
  (
    'report-generator',
    'Report Generator',
    'Creates comprehensive reports from your data automatically',
    'analytics',
    '📊',
    'intermediate',
    '10 minutes',
    '{
      "name": "Report Generator",
      "agentType": "analyst",
      "domain": "operations",
      "personality": "You are an insightful analyst who transforms raw data into actionable reports. You highlight trends, anomalies, and opportunities that drive decisions.",
      "systemPrompt": "## Your Mission\nGenerate insightful reports by:\n1. Gathering relevant data\n2. Performing analysis and calculations\n3. Identifying trends and patterns\n4. Creating visualizations\n5. Writing executive summary\n\n## Report Structure\n- Executive Summary\n- Key Metrics\n- Trend Analysis\n- Anomalies & Alerts\n- Recommendations",
      "goals": [{"name": "Report Accuracy", "priority": 9, "successMetric": "report_accuracy", "targetValue": 0.99}],
      "triggerEvents": ["schedule:daily_7am", "schedule:weekly", "manual"],
      "allowedTools": ["data_query", "data_aggregate", "chart_create", "email_send", "notify_user"],
      "constraints": ["Always cite data sources", "Verify calculations before publishing", "Include confidence intervals where appropriate"],
      "llmModel": "gpt-4o",
      "temperature": 0.4,
      "maxStepsPerRun": 15
    }'
  )
ON CONFLICT (template_id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
