-- ============================================================================
-- Phase EM-57: Automation Engine Schema
-- Created: 2026-01-25
-- Description: Core automation infrastructure for workflow management
-- 
-- This migration creates the automation engine tables that enable:
-- - Workflow definitions with triggers and steps
-- - Event-based automation (integrates with module_events)
-- - Scheduled workflows (cron-based)
-- - External connections (Slack, Discord, Webhooks)
-- - Execution tracking and logging
-- ============================================================================

-- ============================================================================
-- PREREQUISITE: RLS HELPER FUNCTIONS
-- ============================================================================
-- This section ensures required RLS helper functions exist
-- Normally these would be in phase-59-rls-helpers.sql, but we include them
-- here for migration independence

-- Helper: Get current user's agency ID
CREATE OR REPLACE FUNCTION public.get_current_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1
$$;

-- Helper: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
$$;

-- Helper: Check if user can access a site
CREATE OR REPLACE FUNCTION public.can_access_site(check_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.sites s
    WHERE s.id = check_site_id
    AND (
      s.agency_id = public.get_current_agency_id()
      OR public.is_super_admin()
    )
  )
$$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Automation Workflows
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  icon TEXT DEFAULT '⚡',
  color TEXT DEFAULT '#6366f1',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  
  -- Trigger configuration (what starts the workflow)
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'event',          -- Platform event (crm.contact.created, etc.)
    'schedule',       -- Cron schedule
    'webhook',        -- Incoming webhook
    'manual',         -- Manual trigger via UI/API
    'form_submission' -- Form submission (shortcut for event)
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  
  -- Execution settings
  is_active BOOLEAN DEFAULT false,
  run_once BOOLEAN DEFAULT false,          -- Only run once per trigger
  max_executions_per_hour INTEGER DEFAULT 100,
  timeout_seconds INTEGER DEFAULT 300,     -- 5 minute default
  retry_on_failure BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  
  -- Stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, slug)
);

-- Workflow Steps (Actions)
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  
  -- Step position
  position INTEGER NOT NULL,
  
  -- Step type
  step_type TEXT NOT NULL CHECK (step_type IN (
    -- Control flow
    'condition',        -- If/else branching
    'delay',            -- Wait for duration
    'wait_for_event',   -- Wait for specific event
    'loop',             -- Loop over array
    'parallel',         -- Run steps in parallel
    'stop',             -- Stop workflow
    
    -- Data operations
    'transform',        -- Transform/map data
    'filter',           -- Filter array
    'aggregate',        -- Aggregate data
    'set_variable',     -- Set workflow variable
    
    -- Actions (see action_type)
    'action'
  )),
  
  -- Action details (when step_type = 'action')
  action_type TEXT,     -- crm.create_contact, email.send, etc.
  action_config JSONB DEFAULT '{}',
  
  -- Condition (for condition steps)
  condition_config JSONB DEFAULT '{}',
  -- { operator: 'and'|'or', conditions: [{ field, op, value }] }
  
  -- Delay config
  delay_config JSONB DEFAULT '{}',
  -- { type: 'fixed'|'until'|'expression', value: '5m'|'2025-01-01'|'{{date}}' }
  
  -- Loop config
  loop_config JSONB DEFAULT '{}',
  -- { source: '{{array}}', itemVariable: 'item', maxIterations: 100 }
  
  -- Parallel config
  parallel_config JSONB DEFAULT '{}',
  -- { branches: [{ steps: [...] }], waitForAll: true }
  
  -- Input/Output mapping
  input_mapping JSONB DEFAULT '{}',   -- Maps trigger/previous data to step input
  output_key TEXT,                     -- Key to store step output
  
  -- Error handling
  on_error TEXT DEFAULT 'fail' CHECK (on_error IN ('fail', 'continue', 'retry', 'branch')),
  error_branch_step_id UUID,           -- Step to jump to on error
  max_retries INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Metadata
  name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add self-referencing foreign key for error branch (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_error_branch' 
    AND conrelid = 'workflow_steps'::regclass
  ) THEN
    ALTER TABLE workflow_steps 
    ADD CONSTRAINT fk_error_branch 
    FOREIGN KEY (error_branch_step_id) 
    REFERENCES workflow_steps(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Workflow Executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Execution status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Queued, waiting to start
    'running',     -- Currently executing
    'paused',      -- Paused (waiting for event/delay)
    'completed',   -- Successfully completed
    'failed',      -- Failed with error
    'cancelled',   -- Manually cancelled
    'timed_out'    -- Exceeded timeout
  )),
  
  -- Trigger info
  trigger_type TEXT NOT NULL,
  trigger_event_id UUID,              -- Reference to source event
  trigger_data JSONB DEFAULT '{}',    -- Snapshot of trigger data
  
  -- Execution context
  context JSONB DEFAULT '{}',         -- Current execution context/variables
  current_step_id UUID,               -- Currently executing step
  current_step_index INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resume_at TIMESTAMPTZ,              -- When to resume (for delays)
  
  -- Results
  output JSONB DEFAULT '{}',          -- Final output data
  error TEXT,
  error_details JSONB,
  
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  parent_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
  
  -- Stats
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,
  duration_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step Execution Logs
CREATE TABLE IF NOT EXISTS step_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  
  -- Execution details
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'skipped', 'cancelled'
  )),
  
  -- Input/Output
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Errors
  error TEXT,
  error_stack TEXT,
  error_code TEXT,
  
  -- Metadata
  attempt_number INTEGER DEFAULT 1,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Variables (persistent across runs)
CREATE TABLE IF NOT EXISTS workflow_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  value_type TEXT DEFAULT 'string' CHECK (value_type IN (
    'string', 'number', 'boolean', 'array', 'object', 'date'
  )),
  
  description TEXT,
  is_secret BOOLEAN DEFAULT false,     -- Encrypted at rest
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (workflow_id, key)
);

-- ============================================================================
-- EVENT SYSTEM TABLES
-- ============================================================================

-- Event Subscriptions (what events trigger workflows)
CREATE TABLE IF NOT EXISTS automation_event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  
  -- Event matching
  event_type TEXT NOT NULL,           -- e.g., 'crm.contact.created'
  source_module TEXT,                 -- Filter by source module (optional)
  event_filter JSONB DEFAULT '{}',    -- Filter conditions on event data
  
  -- Subscription status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  events_received INTEGER DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate subscriptions
  UNIQUE (workflow_id, event_type, source_module)
);

-- Platform Events Log (for replay/debugging)
-- NOTE: This table SUPPLEMENTS the existing module_events table from EM-33.
-- The automation engine SUBSCRIBES to events via emitEvent() in module-events.ts
-- This table is for:
--   1. Local audit trail of events that triggered workflows
--   2. Event replay for debugging failed workflows
--   3. Faster queries (filtered to automation-relevant events only)
CREATE TABLE IF NOT EXISTS automation_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Link to source event
  source_event_id UUID,               -- References module_events.id
  
  -- Event details
  event_type TEXT NOT NULL,
  source_module TEXT,
  source_entity_type TEXT,            -- 'contact', 'deal', 'booking', etc.
  source_entity_id UUID,
  
  -- Event data
  payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  workflows_triggered INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  
  -- Schedule
  cron_expression TEXT NOT NULL,      -- e.g., '0 9 * * 1' (9am Mondays)
  timezone TEXT DEFAULT 'UTC',
  
  -- Execution tracking
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Limits
  max_consecutive_failures INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXTERNAL CONNECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Connection type
  service_type TEXT NOT NULL,         -- 'slack', 'discord', 'twilio', 'smtp', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Credentials (should be encrypted at rest)
  credentials JSONB NOT NULL DEFAULT '{}',
  
  -- OAuth tokens (if applicable)
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMPTZ,
  
  -- Connection status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, service_type, name)
);

-- Webhook Endpoints (for incoming webhooks)
CREATE TABLE IF NOT EXISTS automation_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  
  -- Endpoint configuration
  endpoint_path TEXT NOT NULL,        -- Unique path for this webhook
  secret_key TEXT NOT NULL,           -- For signature verification
  
  -- Allowed methods
  allowed_methods TEXT[] DEFAULT ARRAY['POST'],
  
  -- IP restrictions (optional)
  allowed_ips TEXT[],
  
  -- Stats
  total_calls INTEGER DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, endpoint_path)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Workflows
CREATE INDEX IF NOT EXISTS idx_auto_workflows_site ON automation_workflows(site_id);
CREATE INDEX IF NOT EXISTS idx_auto_workflows_active ON automation_workflows(site_id, is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_auto_workflows_trigger ON automation_workflows(site_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_auto_workflows_category ON automation_workflows(site_id, category);

-- Steps
CREATE INDEX IF NOT EXISTS idx_auto_steps_workflow ON workflow_steps(workflow_id, position);
CREATE INDEX IF NOT EXISTS idx_auto_steps_type ON workflow_steps(workflow_id, step_type);

-- Executions
CREATE INDEX IF NOT EXISTS idx_auto_executions_workflow ON workflow_executions(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_executions_status ON workflow_executions(site_id, status);
CREATE INDEX IF NOT EXISTS idx_auto_executions_pending ON workflow_executions(status, resume_at) 
  WHERE status IN ('pending', 'paused');
CREATE INDEX IF NOT EXISTS idx_auto_executions_site ON workflow_executions(site_id, created_at DESC);

-- Step logs
CREATE INDEX IF NOT EXISTS idx_auto_step_logs_execution ON step_execution_logs(execution_id, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_step_logs_step ON step_execution_logs(step_id, created_at DESC);

-- Event subscriptions
CREATE INDEX IF NOT EXISTS idx_auto_subscriptions_event ON automation_event_subscriptions(event_type, is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_auto_subscriptions_workflow ON automation_event_subscriptions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_auto_subscriptions_site ON automation_event_subscriptions(site_id);

-- Events log
CREATE INDEX IF NOT EXISTS idx_auto_events_log_site ON automation_events_log(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_events_log_type ON automation_events_log(site_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_events_log_unprocessed ON automation_events_log(site_id, processed, created_at)
  WHERE NOT processed;

-- Scheduled jobs
CREATE INDEX IF NOT EXISTS idx_auto_scheduled_jobs_next ON automation_scheduled_jobs(next_run_at) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_auto_scheduled_jobs_site ON automation_scheduled_jobs(site_id);

-- Connections
CREATE INDEX IF NOT EXISTS idx_auto_connections_site ON automation_connections(site_id);
CREATE INDEX IF NOT EXISTS idx_auto_connections_type ON automation_connections(site_id, service_type);

-- Webhook endpoints
CREATE INDEX IF NOT EXISTS idx_auto_webhook_endpoints_path ON automation_webhook_endpoints(site_id, endpoint_path);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SERVICE ROLE BYPASS (Required for background workers & execution engine)
-- ============================================================================
-- Background workers run with service_role to execute workflows without user context

CREATE POLICY "Service role bypass workflows" ON automation_workflows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass steps" ON workflow_steps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass executions" ON workflow_executions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass step logs" ON step_execution_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass variables" ON workflow_variables
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass subscriptions" ON automation_event_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass events log" ON automation_events_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass scheduled jobs" ON automation_scheduled_jobs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass connections" ON automation_connections
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass webhook endpoints" ON automation_webhook_endpoints
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES (Using public.can_access_site() helper function)
-- ============================================================================
-- Note: can_access_site(site_id) checks if current user has access to the site
-- via their agency membership (defined above for migration independence)

CREATE POLICY "Users can access their site workflows" ON automation_workflows
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "Users can access their site steps" ON workflow_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM automation_workflows w 
      WHERE w.id = workflow_steps.workflow_id 
      AND public.can_access_site(w.site_id)
    )
  );

CREATE POLICY "Users can access their site executions" ON workflow_executions
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "Users can access their site step logs" ON step_execution_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_executions e 
      WHERE e.id = step_execution_logs.execution_id 
      AND public.can_access_site(e.site_id)
    )
  );

CREATE POLICY "Users can access their site variables" ON workflow_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM automation_workflows w 
      WHERE w.id = workflow_variables.workflow_id 
      AND public.can_access_site(w.site_id)
    )
  );

CREATE POLICY "Users can access their site subscriptions" ON automation_event_subscriptions
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "Users can access their site events" ON automation_events_log
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "Users can access their site jobs" ON automation_scheduled_jobs
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "Users can access their site connections" ON automation_connections
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "Users can access their site webhook endpoints" ON automation_webhook_endpoints
  FOR ALL USING (public.can_access_site(site_id));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate webhook endpoint path
CREATE OR REPLACE FUNCTION generate_webhook_path()
RETURNS TEXT AS $$
BEGIN
  RETURN 'wh_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Generate webhook secret
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN 'whsec_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Update workflow stats after execution
CREATE OR REPLACE FUNCTION update_workflow_stats(
  p_workflow_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE automation_workflows
  SET 
    total_runs = total_runs + 1,
    successful_runs = successful_runs + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_runs = failed_runs + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    last_run_at = NOW(),
    last_success_at = CASE WHEN p_success THEN NOW() ELSE last_success_at END,
    last_error_at = CASE WHEN NOT p_success THEN NOW() ELSE last_error_at END,
    last_error = CASE WHEN NOT p_success THEN p_error ELSE last_error END,
    updated_at = NOW()
  WHERE id = p_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate next scheduled run (placeholder - real implementation requires pg_cron or app logic)
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_cron TEXT,
  p_timezone TEXT DEFAULT 'UTC',
  p_after TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next TIMESTAMPTZ;
BEGIN
  -- This is a simplified placeholder
  -- Real cron parsing requires pg_cron extension or application-level parsing
  -- For now, return 1 hour from now as a default
  v_next := p_after + INTERVAL '1 hour';
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON automation_workflows
  FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER update_workflow_variables_updated_at
  BEFORE UPDATE ON workflow_variables
  FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER update_automation_event_subscriptions_updated_at
  BEFORE UPDATE ON automation_event_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER update_automation_scheduled_jobs_updated_at
  BEFORE UPDATE ON automation_scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER update_automation_connections_updated_at
  BEFORE UPDATE ON automation_connections
  FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_webhook_path() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_webhook_secret() TO authenticated;
GRANT EXECUTE ON FUNCTION update_workflow_stats(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_run(TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE automation_workflows IS 'Workflow definitions with triggers and execution settings';
COMMENT ON TABLE workflow_steps IS 'Steps within a workflow (actions, conditions, delays)';
COMMENT ON TABLE workflow_executions IS 'Execution history for workflow runs';
COMMENT ON TABLE step_execution_logs IS 'Detailed logs for each step in an execution';
COMMENT ON TABLE workflow_variables IS 'Persistent variables for workflows';
COMMENT ON TABLE automation_event_subscriptions IS 'Event subscriptions that trigger workflows';
COMMENT ON TABLE automation_events_log IS 'Audit log of events that triggered workflows';
COMMENT ON TABLE automation_scheduled_jobs IS 'Cron-scheduled workflow triggers';
COMMENT ON TABLE automation_connections IS 'External service connections (Slack, Discord, etc.)';
COMMENT ON TABLE automation_webhook_endpoints IS 'Incoming webhook endpoint configurations';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
