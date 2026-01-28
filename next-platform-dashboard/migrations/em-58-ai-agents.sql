-- ============================================================================
-- Phase EM-58: AI Agents Schema
-- Created: 2026-01-28
-- Description: Core AI agent infrastructure tables
-- Dependencies: EM-57 (Automation Engine), Phase-59 RLS helpers
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- AGENT DEFINITIONS
-- ============================================================================

-- AI Agents Registry
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  personality TEXT,                    -- Agent personality description
  
  -- Agent Type
  agent_type TEXT NOT NULL CHECK (agent_type IN (
    'assistant',      -- General purpose assistant
    'specialist',     -- Domain-specific (sales, support, etc.)
    'orchestrator',   -- Manages other agents
    'analyst',        -- Data analysis and reporting
    'guardian'        -- Monitoring and alerting
  )),
  
  -- Specialization
  domain TEXT,                         -- 'sales', 'support', 'marketing', etc.
  capabilities TEXT[] DEFAULT '{}',    -- ['lead_qualification', 'email_drafting', ...]
  
  -- Goals & Instructions
  system_prompt TEXT NOT NULL,         -- Core instructions
  goals JSONB DEFAULT '[]',            -- Array of goal definitions
  constraints JSONB DEFAULT '[]',      -- Things agent must NOT do
  examples JSONB DEFAULT '[]',         -- Few-shot examples
  
  -- Triggers
  trigger_events TEXT[] DEFAULT '{}',  -- Events that activate this agent
  trigger_schedule TEXT,               -- Cron expression for scheduled runs
  trigger_conditions JSONB DEFAULT '{}', -- Conditions to evaluate
  
  -- Configuration
  is_active BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,     -- Available in marketplace
  
  -- LLM Settings
  llm_provider TEXT DEFAULT 'openai',
  llm_model TEXT DEFAULT 'gpt-4o',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  
  -- Execution Limits
  max_steps_per_run INTEGER DEFAULT 10,
  max_tool_calls_per_step INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 120,
  max_runs_per_hour INTEGER DEFAULT 60,
  max_runs_per_day INTEGER DEFAULT 500,
  
  -- Tool Access
  allowed_tools TEXT[] DEFAULT '{}',   -- Which tools agent can use
  denied_tools TEXT[] DEFAULT '{}',    -- Explicitly denied tools
  
  -- Stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_actions_taken INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, slug)
);

-- Agent Goals
CREATE TABLE IF NOT EXISTS ai_agent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- Goal definition
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5,          -- 1-10, higher = more important
  
  -- Success criteria
  success_metric TEXT,                 -- 'conversion_rate', 'response_time', etc.
  target_value DECIMAL(10,2),
  comparison TEXT CHECK (comparison IN ('gt', 'gte', 'lt', 'lte', 'eq')),
  
  -- Timing
  is_recurring BOOLEAN DEFAULT true,
  deadline TIMESTAMPTZ,
  
  -- Status
  current_value DECIMAL(10,2),
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT MEMORY
-- ============================================================================

-- Short-term Memory (Conversation Context)
CREATE TABLE IF NOT EXISTS ai_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Context
  context_type TEXT NOT NULL,          -- 'entity', 'user', 'session'
  context_id UUID,                     -- Related entity ID
  
  -- Conversation
  messages JSONB DEFAULT '[]',         -- Array of messages
  metadata JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,              -- Auto-cleanup
  
  -- Stats
  message_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0
);

-- Long-term Memory (Learned Facts)
-- Note: pgvector extension must be enabled for VECTOR type
-- Run: CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS ai_agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Memory type
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'fact',           -- Learned fact about entity/situation
    'preference',     -- User/customer preference
    'pattern',        -- Observed behavior pattern
    'relationship',   -- Entity relationship
    'outcome'         -- Result of past action
  )),
  
  -- Content
  subject_type TEXT,                   -- 'contact', 'company', 'deal', etc.
  subject_id UUID,
  content TEXT NOT NULL,               -- The actual memory
  embedding VECTOR(1536),              -- For semantic search (OpenAI ada-002)
  
  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 0.8, -- 0-1 confidence score
  source TEXT,                         -- Where memory came from
  tags TEXT[] DEFAULT '{}',
  
  -- Lifecycle
  importance INTEGER DEFAULT 5,        -- 1-10
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,              -- Optional expiry
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episodic Memory (Past Actions & Results)
CREATE TABLE IF NOT EXISTS ai_agent_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  execution_id UUID,                   -- Link to execution log
  
  -- Episode details
  trigger_event TEXT,
  context_summary TEXT,
  actions_taken JSONB DEFAULT '[]',    -- Array of actions
  outcome TEXT,                        -- 'success', 'partial', 'failure'
  outcome_details TEXT,
  
  -- Learning
  lessons_learned TEXT[],              -- What agent learned
  should_repeat BOOLEAN,               -- Would agent do this again?
  
  -- Metadata
  duration_ms INTEGER,
  tokens_used INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT TOOLS
-- ============================================================================

-- Tool Registry
CREATE TABLE IF NOT EXISTS ai_agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,              -- 'crm', 'communication', 'data', 'system'
  
  -- Schema (OpenAI function calling format)
  parameters_schema JSONB NOT NULL,
  returns_schema JSONB,
  
  -- Implementation
  handler_type TEXT NOT NULL CHECK (handler_type IN (
    'internal',       -- Platform function
    'module',         -- Module API call
    'external',       -- External API
    'workflow'        -- Trigger automation workflow
  )),
  handler_config JSONB DEFAULT '{}',
  
  -- Access control
  requires_permissions TEXT[] DEFAULT '{}',
  requires_modules TEXT[] DEFAULT '{}',
  
  -- Rate limits
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  
  -- Metadata
  is_dangerous BOOLEAN DEFAULT false,  -- Requires confirmation
  is_system BOOLEAN DEFAULT false,     -- Platform-provided
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool Usage Log
CREATE TABLE IF NOT EXISTS ai_agent_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES ai_agent_tools(id) ON DELETE CASCADE,
  execution_id UUID,
  
  -- Call details
  input_params JSONB,
  output_result JSONB,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'denied'
  )),
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Tokens
  tokens_used INTEGER DEFAULT 0
);

-- ============================================================================
-- AGENT EXECUTION
-- ============================================================================

-- Agent Executions
CREATE TABLE IF NOT EXISTS ai_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Trigger
  trigger_type TEXT NOT NULL,
  trigger_event_id UUID,
  trigger_data JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'waiting_approval',    -- Needs human approval for action
    'completed',
    'failed',
    'cancelled',
    'timed_out'
  )),
  
  -- Context
  initial_context JSONB DEFAULT '{}',
  current_context JSONB DEFAULT '{}',
  
  -- Execution trace
  steps JSONB DEFAULT '[]',            -- Array of reasoning steps
  current_step INTEGER DEFAULT 0,
  
  -- Results
  result JSONB DEFAULT '{}',
  actions_taken JSONB DEFAULT '[]',
  
  -- Error handling
  error TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  
  -- Resource usage
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  llm_calls INTEGER DEFAULT 0,
  tool_calls INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Execution Steps (detailed trace)
CREATE TABLE IF NOT EXISTS ai_agent_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  
  -- Step type
  step_type TEXT NOT NULL CHECK (step_type IN (
    'observe',        -- Gathering information
    'think',          -- Reasoning/planning
    'act',            -- Taking action
    'reflect'         -- Evaluating result
  )),
  
  -- Content
  input_text TEXT,                     -- What agent received
  reasoning TEXT,                      -- Agent's reasoning
  output_text TEXT,                    -- What agent produced
  
  -- Tool call (if act step)
  tool_name TEXT,
  tool_input JSONB,
  tool_output JSONB,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Tokens
  tokens_used INTEGER DEFAULT 0
);

-- ============================================================================
-- AGENT APPROVALS
-- ============================================================================

-- Pending Approvals (for dangerous actions)
CREATE TABLE IF NOT EXISTS ai_agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Action needing approval
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_params JSONB,
  
  -- Risk assessment
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_explanation TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'denied', 'expired'
  )),
  
  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  
  -- Timing
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LLM CONFIGURATION
-- ============================================================================

-- LLM Provider Configurations
CREATE TABLE IF NOT EXISTS ai_llm_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,  -- NULL = platform default
  
  -- Provider info
  provider_name TEXT NOT NULL,         -- 'openai', 'anthropic', 'google', 'local'
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- API Configuration (encrypted)
  api_key_encrypted TEXT,
  api_endpoint TEXT,
  organization_id TEXT,
  
  -- Available models
  available_models JSONB DEFAULT '[]',
  default_model TEXT,
  
  -- Rate limits
  requests_per_minute INTEGER,
  tokens_per_minute INTEGER,
  
  -- Costs (for tracking)
  cost_per_1k_input_tokens DECIMAL(10,6),
  cost_per_1k_output_tokens DECIMAL(10,6),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, provider_name)
);

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

-- AI Usage Tracking (for billing)
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Usage counts
  total_agent_runs INTEGER DEFAULT 0,
  total_tokens_input BIGINT DEFAULT 0,
  total_tokens_output BIGINT DEFAULT 0,
  total_tool_calls INTEGER DEFAULT 0,
  total_approvals INTEGER DEFAULT 0,
  
  -- By provider
  usage_by_provider JSONB DEFAULT '{}',
  
  -- Costs
  estimated_cost DECIMAL(10,4) DEFAULT 0,
  
  -- Limits
  included_runs INTEGER DEFAULT 500,
  included_tokens BIGINT DEFAULT 500000,
  overage_runs INTEGER DEFAULT 0,
  overage_tokens BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, period_start, period_end)
);

-- Daily Usage Snapshot
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Counts
  agent_runs INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  tool_calls INTEGER DEFAULT 0,
  
  -- By agent
  runs_by_agent JSONB DEFAULT '{}',
  
  -- Costs
  estimated_cost DECIMAL(10,4) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (site_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_agents_site ON ai_agents(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON ai_agents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_triggers ON ai_agents USING GIN(trigger_events);

CREATE INDEX IF NOT EXISTS idx_ai_agent_memories_agent ON ai_agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_memories_subject ON ai_agent_memories(subject_type, subject_id);
-- Vector index (requires pgvector extension)
-- CREATE INDEX IF NOT EXISTS idx_ai_agent_memories_embedding ON ai_agent_memories USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_agent ON ai_agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_site ON ai_agent_executions(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_status ON ai_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_created ON ai_agent_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_approvals_pending ON ai_agent_approvals(status, site_id) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_site_date ON ai_usage_daily(site_id, date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_llm_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for background agent execution)
CREATE POLICY "ai_agents_service_role" ON ai_agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_goals_service_role" ON ai_agent_goals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_conversations_service_role" ON ai_agent_conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_memories_service_role" ON ai_agent_memories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_episodes_service_role" ON ai_agent_episodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_tools_service_role" ON ai_agent_tools FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_tool_calls_service_role" ON ai_agent_tool_calls FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_executions_service_role" ON ai_agent_executions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_execution_steps_service_role" ON ai_agent_execution_steps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_agent_approvals_service_role" ON ai_agent_approvals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_llm_providers_service_role" ON ai_llm_providers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_usage_tracking_service_role" ON ai_usage_tracking FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ai_usage_daily_service_role" ON ai_usage_daily FOR ALL USING (auth.role() = 'service_role');

-- User policies using existing RLS helper from phase-59-rls-helpers.sql
-- IMPORTANT: Functions are in public schema (not auth schema)
CREATE POLICY "ai_agents_user_access" ON ai_agents 
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "ai_agent_goals_user_access" ON ai_agent_goals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.id = ai_agent_goals.agent_id 
    AND public.can_access_site(a.site_id)
  ));

CREATE POLICY "ai_agent_conversations_user_access" ON ai_agent_conversations
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "ai_agent_memories_user_access" ON ai_agent_memories
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "ai_agent_episodes_user_access" ON ai_agent_episodes
  FOR ALL USING (public.can_access_site(site_id));

-- Tools are global (read-only for users)
CREATE POLICY "ai_agent_tools_user_read" ON ai_agent_tools
  FOR SELECT USING (is_active = true);

CREATE POLICY "ai_agent_tool_calls_user_access" ON ai_agent_tool_calls
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.id = ai_agent_tool_calls.agent_id 
    AND public.can_access_site(a.site_id)
  ));

CREATE POLICY "ai_agent_executions_user_access" ON ai_agent_executions
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "ai_agent_execution_steps_user_access" ON ai_agent_execution_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ai_agent_executions e WHERE e.id = ai_agent_execution_steps.execution_id 
    AND public.can_access_site(e.site_id)
  ));

CREATE POLICY "ai_agent_approvals_user_access" ON ai_agent_approvals
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "ai_llm_providers_user_access" ON ai_llm_providers
  FOR ALL USING (site_id IS NULL OR public.can_access_site(site_id));

CREATE POLICY "ai_usage_tracking_user_access" ON ai_usage_tracking
  FOR ALL USING (public.can_access_site(site_id));

CREATE POLICY "ai_usage_daily_user_access" ON ai_usage_daily
  FOR ALL USING (public.can_access_site(site_id));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Track AI usage on execution completion
CREATE OR REPLACE FUNCTION track_ai_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily usage
  INSERT INTO ai_usage_daily (site_id, date, agent_runs, tokens_used)
  VALUES (NEW.site_id, CURRENT_DATE, 1, COALESCE(NEW.tokens_total, 0))
  ON CONFLICT (site_id, date) 
  DO UPDATE SET 
    agent_runs = ai_usage_daily.agent_runs + 1,
    tokens_used = ai_usage_daily.tokens_used + COALESCE(NEW.tokens_total, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_track_ai_usage ON ai_agent_executions;
CREATE TRIGGER trigger_track_ai_usage
  AFTER UPDATE ON ai_agent_executions
  FOR EACH ROW
  WHEN (OLD.status = 'running' AND NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION track_ai_usage();

-- Update agent stats on execution completion
CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_agents SET
    total_runs = total_runs + 1,
    successful_runs = successful_runs + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    failed_runs = failed_runs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_total, 0),
    total_actions_taken = total_actions_taken + COALESCE(jsonb_array_length(NEW.actions_taken), 0),
    last_run_at = NEW.completed_at,
    last_error = CASE WHEN NEW.status = 'failed' THEN NEW.error ELSE last_error END,
    updated_at = NOW()
  WHERE id = NEW.agent_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_agent_stats ON ai_agent_executions;
CREATE TRIGGER trigger_update_agent_stats
  AFTER UPDATE ON ai_agent_executions
  FOR EACH ROW
  WHEN (OLD.status = 'running' AND NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION update_agent_stats();

-- Semantic memory search (requires pgvector extension)
CREATE OR REPLACE FUNCTION search_agent_memories(
  p_agent_id UUID,
  p_query_embedding VECTOR(1536),
  p_limit INTEGER DEFAULT 10,
  p_memory_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  content TEXT,
  confidence DECIMAL,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.memory_type,
    m.content,
    m.confidence,
    1 - (m.embedding <=> p_query_embedding) as similarity
  FROM ai_agent_memories m
  WHERE m.agent_id = p_agent_id
    AND (p_memory_types IS NULL OR m.memory_type = ANY(p_memory_types))
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Default Tools
-- ============================================================================

INSERT INTO ai_agent_tools (name, display_name, description, category, parameters_schema, handler_type, handler_config, is_system) VALUES

-- CRM Tools
('crm_get_contact', 'Get Contact', 'Retrieve a contact by ID or email', 'crm', 
 '{"type": "object", "properties": {"contact_id": {"type": "string"}, "email": {"type": "string"}}, "oneOf": [{"required": ["contact_id"]}, {"required": ["email"]}]}'::jsonb,
 'module', '{"module": "crm", "action": "getContact"}'::jsonb, true),

('crm_search_contacts', 'Search Contacts', 'Search contacts by name, email, or tags', 'crm',
 '{"type": "object", "properties": {"query": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}, "limit": {"type": "integer", "default": 10}}, "required": ["query"]}'::jsonb,
 'module', '{"module": "crm", "action": "searchContacts"}'::jsonb, true),

('crm_create_contact', 'Create Contact', 'Create a new contact', 'crm',
 '{"type": "object", "properties": {"email": {"type": "string"}, "first_name": {"type": "string"}, "last_name": {"type": "string"}, "phone": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}}, "required": ["email"]}'::jsonb,
 'module', '{"module": "crm", "action": "createContact"}'::jsonb, true),

('crm_update_contact', 'Update Contact', 'Update an existing contact', 'crm',
 '{"type": "object", "properties": {"contact_id": {"type": "string"}, "updates": {"type": "object"}}, "required": ["contact_id", "updates"]}'::jsonb,
 'module', '{"module": "crm", "action": "updateContact"}'::jsonb, true),

('crm_add_note', 'Add Contact Note', 'Add a note to a contact', 'crm',
 '{"type": "object", "properties": {"contact_id": {"type": "string"}, "content": {"type": "string"}, "type": {"type": "string", "enum": ["note", "call", "meeting", "email"]}}, "required": ["contact_id", "content"]}'::jsonb,
 'module', '{"module": "crm", "action": "addNote"}'::jsonb, true),

-- Communication Tools  
('email_send', 'Send Email', 'Send an email to one or more recipients', 'communication',
 '{"type": "object", "properties": {"to": {"type": "array", "items": {"type": "string"}}, "subject": {"type": "string"}, "body": {"type": "string"}, "template_id": {"type": "string"}}, "required": ["to", "subject", "body"]}'::jsonb,
 'module', '{"module": "email", "action": "send"}'::jsonb, true),

('email_draft', 'Draft Email', 'Create an email draft for review', 'communication',
 '{"type": "object", "properties": {"to": {"type": "array", "items": {"type": "string"}}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "subject", "body"]}'::jsonb,
 'internal', '{"handler": "createEmailDraft"}'::jsonb, true),

-- Calendar Tools
('calendar_create_event', 'Create Calendar Event', 'Schedule a new calendar event', 'calendar',
 '{"type": "object", "properties": {"title": {"type": "string"}, "start_time": {"type": "string", "format": "date-time"}, "end_time": {"type": "string", "format": "date-time"}, "attendees": {"type": "array", "items": {"type": "string"}}, "description": {"type": "string"}}, "required": ["title", "start_time", "end_time"]}'::jsonb,
 'module', '{"module": "booking", "action": "createEvent"}'::jsonb, true),

('calendar_check_availability', 'Check Availability', 'Check calendar availability for a time range', 'calendar',
 '{"type": "object", "properties": {"start_time": {"type": "string", "format": "date-time"}, "end_time": {"type": "string", "format": "date-time"}, "user_id": {"type": "string"}}, "required": ["start_time", "end_time"]}'::jsonb,
 'module', '{"module": "booking", "action": "checkAvailability"}'::jsonb, true),

-- Task Tools
('task_create', 'Create Task', 'Create a new task', 'task',
 '{"type": "object", "properties": {"title": {"type": "string"}, "description": {"type": "string"}, "due_date": {"type": "string", "format": "date-time"}, "priority": {"type": "string", "enum": ["low", "medium", "high"]}, "assigned_to": {"type": "string"}}, "required": ["title"]}'::jsonb,
 'internal', '{"handler": "createTask"}'::jsonb, true),

-- Data Tools
('data_query', 'Query Data', 'Run a structured query against platform data', 'data',
 '{"type": "object", "properties": {"entity_type": {"type": "string"}, "filters": {"type": "object"}, "limit": {"type": "integer", "default": 100}, "order_by": {"type": "string"}}, "required": ["entity_type"]}'::jsonb,
 'internal', '{"handler": "queryData"}'::jsonb, true),

('data_aggregate', 'Aggregate Data', 'Get aggregated statistics', 'data',
 '{"type": "object", "properties": {"entity_type": {"type": "string"}, "metric": {"type": "string"}, "group_by": {"type": "string"}, "date_range": {"type": "object"}}, "required": ["entity_type", "metric"]}'::jsonb,
 'internal', '{"handler": "aggregateData"}'::jsonb, true),

-- Web Tools
('web_search', 'Web Search', 'Search the web for information', 'web',
 '{"type": "object", "properties": {"query": {"type": "string"}, "num_results": {"type": "integer", "default": 5}}, "required": ["query"]}'::jsonb,
 'external', '{"provider": "serper", "action": "search"}'::jsonb, true),

('web_scrape', 'Scrape Webpage', 'Extract content from a webpage', 'web',
 '{"type": "object", "properties": {"url": {"type": "string"}, "selector": {"type": "string"}}, "required": ["url"]}'::jsonb,
 'external', '{"provider": "firecrawl", "action": "scrape"}'::jsonb, true),

-- System Tools
('wait', 'Wait', 'Pause execution for a specified duration', 'system',
 '{"type": "object", "properties": {"seconds": {"type": "integer", "minimum": 1, "maximum": 3600}}, "required": ["seconds"]}'::jsonb,
 'internal', '{"handler": "wait"}'::jsonb, true),

('notify_user', 'Notify User', 'Send a notification to a user', 'system',
 '{"type": "object", "properties": {"user_id": {"type": "string"}, "message": {"type": "string"}, "channel": {"type": "string", "enum": ["in_app", "email", "sms"]}}, "required": ["message"]}'::jsonb,
 'internal', '{"handler": "notifyUser"}'::jsonb, true),

('trigger_workflow', 'Trigger Workflow', 'Start an automation workflow', 'system',
 '{"type": "object", "properties": {"workflow_id": {"type": "string"}, "input_data": {"type": "object"}}, "required": ["workflow_id"]}'::jsonb,
 'workflow', '{"action": "trigger"}'::jsonb, true)

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_agents IS 'AI Agent definitions and configurations';
COMMENT ON TABLE ai_agent_goals IS 'Goals and objectives for AI agents';
COMMENT ON TABLE ai_agent_conversations IS 'Short-term conversation memory for agents';
COMMENT ON TABLE ai_agent_memories IS 'Long-term memory storage with vector embeddings';
COMMENT ON TABLE ai_agent_episodes IS 'Episodic memory of past actions and outcomes';
COMMENT ON TABLE ai_agent_tools IS 'Registry of tools available to agents';
COMMENT ON TABLE ai_agent_tool_calls IS 'Log of tool invocations by agents';
COMMENT ON TABLE ai_agent_executions IS 'Agent execution records and status';
COMMENT ON TABLE ai_agent_execution_steps IS 'Detailed trace of agent reasoning steps';
COMMENT ON TABLE ai_agent_approvals IS 'Human-in-the-loop approval requests';
COMMENT ON TABLE ai_llm_providers IS 'LLM provider configurations per site';
COMMENT ON TABLE ai_usage_tracking IS 'Monthly usage tracking for billing';
COMMENT ON TABLE ai_usage_daily IS 'Daily usage snapshots for analytics';
