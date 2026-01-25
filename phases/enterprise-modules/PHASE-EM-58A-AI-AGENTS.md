# Phase EM-58A: AI Agents - Core Infrastructure

> **Phase Type:** Enterprise Feature  
> **Complexity:** High  
> **Dependencies:** EM-57 (Automation Engine), EM-33 (Module Events), EM-12 (API Gateway)  
> **Estimated Effort:** 6-8 weeks  
> **Business Impact:** 🚀 Critical Revenue Opportunity

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [What Are AI Agents?](#what-are-ai-agents)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Core Agent Types](#core-agent-types)
6. [Agent Runtime Engine](#agent-runtime-engine)
7. [Memory & Context System](#memory--context-system)
8. [Tool System](#tool-system)
9. [LLM Provider Abstraction](#llm-provider-abstraction)
10. [Security & Governance](#security--governance)

---

## Executive Summary

### The Opportunity

AI Agents represent the next evolution beyond simple automation. While automation executes predefined workflows, **AI Agents reason, decide, and adapt**.

```
AUTOMATION (EM-57):          AI AGENTS (EM-58):
───────────────────          ──────────────────
IF lead score > 80           "Analyze this lead and decide
THEN send email              the best engagement approach
ELSE wait 3 days             based on their behavior,
                             industry, and our past success
                             with similar prospects."
```

### Business Value

| Metric | Without AI Agents | With AI Agents |
|--------|-------------------|----------------|
| Lead Response Time | 2-4 hours | < 5 minutes |
| Support Ticket Resolution | 40% auto | 85% auto |
| Data Entry Accuracy | 92% | 99.5% |
| Customer Personalization | Segment-based | Individual |
| Agency Efficiency Gain | - | 300-500% |

### Revenue Potential

```
Conservative Estimate (Year 1):
├─ 500 agencies × $50/month AI add-on = $300K ARR
├─ Usage overage (30% agencies)      = $90K ARR  
├─ Custom agent builds (50 × $500)   = $25K
└─ Total: ~$415K additional ARR

Aggressive Estimate (Year 2):
├─ 2,000 agencies × $75/month       = $1.8M ARR
├─ Usage overage (40% agencies)     = $540K ARR
├─ Marketplace agents (rev share)   = $200K ARR
└─ Total: ~$2.5M additional ARR
```

---

## What Are AI Agents?

### Traditional AI vs AI Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL AI (Reactive)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    User ───────► AI ───────► Response                           │
│    "Write email"    │        "Here's your email..."             │
│                     │                                            │
│              Single interaction, no memory, no action            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AI AGENTS (Proactive)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    Goal ───────► Agent ───────► Environment                     │
│  "Maximize         │              │                              │
│   lead             │              ▼                              │
│   conversion"      │    ┌─────────────────────┐                 │
│                    │    │ Observe: New lead   │                 │
│                    │    │ Think: Best approach│                 │
│                    │    │ Act: Send email     │                 │
│                    │    │ Learn: Track result │                 │
│                    │    └─────────────────────┘                 │
│                    │              │                              │
│                    └──────────────┴─── Continuous loop          │
│                                                                  │
│         Multiple actions, persistent memory, autonomous          │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Components

Every AI Agent has 5 core components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI AGENT                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   GOALS     │  │  REASONING  │  │        TOOLS            │ │
│  │             │  │             │  │                         │ │
│  │ • Objective │  │ • Planning  │  │ • CRM: CRUD contacts    │ │
│  │ • Success   │  │ • Analysis  │  │ • Email: Send/read      │ │
│  │   criteria  │  │ • Decision  │  │ • Calendar: Book        │ │
│  │ • Guardrails│  │   making    │  │ • Search: Web/DB        │ │
│  └─────────────┘  └─────────────┘  │ • Forms: Create/read    │ │
│                                    └─────────────────────────┘ │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐ │
│  │          MEMORY             │  │       PERCEPTION        │ │
│  │                             │  │                         │ │
│  │ • Short-term (conversation) │  │ • Events (triggers)     │ │
│  │ • Long-term (learned facts) │  │ • Schedules (cron)      │ │
│  │ • Episodic (past actions)   │  │ • Webhooks (external)   │ │
│  │ • Semantic (knowledge)      │  │ • Manual (user request) │ │
│  └─────────────────────────────┘  └─────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DRAMAC Platform                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MODULE LAYER                           │   │
│  │   CRM    │  Forms  │  Booking  │  Email  │  Accounting   │   │
│  └────┬─────┴────┬────┴─────┬─────┴────┬────┴───────┬───────┘   │
│       │          │          │          │            │           │
│       ▼          ▼          ▼          ▼            ▼           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              EVENT BUS (module_events)                    │   │
│  │   contact.*, form.*, booking.*, email.*, invoice.*       │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AUTOMATION ENGINE (EM-57)                    │   │
│  │         Workflows • Triggers • Scheduled Jobs             │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ╔══════════════════════════════════════════════════════════╗   │
│  ║              AI AGENT LAYER (EM-58)                       ║   │
│  ║  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  ║   │
│  ║  │   Agent    │  │   Agent    │  │      Agent         │  ║   │
│  ║  │  Registry  │  │  Runtime   │  │     Memory         │  ║   │
│  ║  │            │  │  Engine    │  │     Store          │  ║   │
│  ║  └────────────┘  └────────────┘  └────────────────────┘  ║   │
│  ║  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  ║   │
│  ║  │   Tool     │  │    LLM     │  │    Governance      │  ║   │
│  ║  │  System    │  │  Provider  │  │    & Safety        │  ║   │
│  ║  └────────────┘  └────────────┘  └────────────────────┘  ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  LLM PROVIDERS                            │   │
│  │    OpenAI  │  Anthropic  │  Google  │  Local (Ollama)    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. TRIGGER (Event/Schedule/Manual/Webhook)
        │
        ▼
2. AGENT SELECTION
   ├─ Find matching agents for trigger
   ├─ Check if agent is active
   └─ Verify permissions & quotas
        │
        ▼
3. CONTEXT ASSEMBLY
   ├─ Load agent configuration
   ├─ Retrieve relevant memories
   ├─ Fetch current entity state
   └─ Build system prompt
        │
        ▼
4. REASONING LOOP (ReAct Pattern)
   ┌────────────────────────────────┐
   │  OBSERVE → THINK → ACT        │
   │      ▲                 │      │
   │      └─────────────────┘      │
   │   (repeat until goal met)     │
   └────────────────────────────────┘
        │
        ▼
5. ACTION EXECUTION
   ├─ Validate action is permitted
   ├─ Execute via Tool System
   ├─ Record action in memory
   └─ Emit events for other systems
        │
        ▼
6. COMPLETION
   ├─ Summarize actions taken
   ├─ Update memory with learnings
   ├─ Log execution for analytics
   └─ Return result
```

---

## Database Schema

### Migration File: `migrations/em-58-ai-agents.sql`

```sql
-- ============================================================================
-- Phase EM-58: AI Agents Schema
-- Created: 2026-01-XX
-- Description: Core AI agent infrastructure tables
-- ============================================================================

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
  embedding VECTOR(1536),              -- For semantic search
  
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

CREATE INDEX idx_ai_agents_site ON ai_agents(site_id);
CREATE INDEX idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX idx_ai_agents_active ON ai_agents(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_agents_triggers ON ai_agents USING GIN(trigger_events);

CREATE INDEX idx_ai_agent_memories_agent ON ai_agent_memories(agent_id);
CREATE INDEX idx_ai_agent_memories_subject ON ai_agent_memories(subject_type, subject_id);
CREATE INDEX idx_ai_agent_memories_embedding ON ai_agent_memories USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_ai_agent_executions_agent ON ai_agent_executions(agent_id);
CREATE INDEX idx_ai_agent_executions_site ON ai_agent_executions(site_id);
CREATE INDEX idx_ai_agent_executions_status ON ai_agent_executions(status);
CREATE INDEX idx_ai_agent_executions_created ON ai_agent_executions(created_at DESC);

CREATE INDEX idx_ai_agent_approvals_pending ON ai_agent_approvals(status, site_id) 
  WHERE status = 'pending';

CREATE INDEX idx_ai_usage_daily_site_date ON ai_usage_daily(site_id, date DESC);

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
CREATE POLICY "Service role bypass" ON ai_agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_goals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_memories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_episodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_tools FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_tool_calls FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_executions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_execution_steps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_agent_approvals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_llm_providers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_usage_tracking FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON ai_usage_daily FOR ALL USING (auth.role() = 'service_role');

-- User policies using existing RLS helper from phase-59-rls-helpers.sql
-- IMPORTANT: Use auth.can_access_site() NOT user_has_site_access()
CREATE POLICY "Users can access their site's agents" ON ai_agents 
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their agent goals" ON ai_agent_goals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.id = ai_agent_goals.agent_id 
    AND auth.can_access_site(a.site_id)
  ));

CREATE POLICY "Users can access their site's conversations" ON ai_agent_conversations
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's memories" ON ai_agent_memories
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's episodes" ON ai_agent_episodes
  FOR ALL USING (auth.can_access_site(site_id));

-- Tools are global (read-only for users)
CREATE POLICY "Users can read active tools" ON ai_agent_tools
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can access their agent tool calls" ON ai_agent_tool_calls
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.id = ai_agent_tool_calls.agent_id 
    AND auth.can_access_site(a.site_id)
  ));

CREATE POLICY "Users can access their site's executions" ON ai_agent_executions
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their execution steps" ON ai_agent_execution_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ai_agent_executions e WHERE e.id = ai_agent_execution_steps.execution_id 
    AND auth.can_access_site(e.site_id)
  ));

CREATE POLICY "Users can access their site's approvals" ON ai_agent_approvals
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's LLM providers" ON ai_llm_providers
  FOR ALL USING (site_id IS NULL OR auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's usage" ON ai_usage_tracking
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's daily usage" ON ai_usage_daily
  FOR ALL USING (auth.can_access_site(site_id));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Track AI usage
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_ai_usage
  AFTER INSERT ON ai_agent_executions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION track_ai_usage();

-- Update agent stats
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_stats
  AFTER UPDATE ON ai_agent_executions
  FOR EACH ROW
  WHEN (OLD.status = 'running' AND NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION update_agent_stats();

-- Semantic memory search
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Default Tools
-- ============================================================================

INSERT INTO ai_agent_tools (name, display_name, description, category, parameters_schema, handler_type, handler_config, is_system) VALUES

-- CRM Tools
('crm_get_contact', 'Get Contact', 'Retrieve a contact by ID or email', 'crm', 
 '{"type": "object", "properties": {"contact_id": {"type": "string"}, "email": {"type": "string"}}, "oneOf": [{"required": ["contact_id"]}, {"required": ["email"]}]}',
 'module', '{"module": "crm", "action": "getContact"}', true),

('crm_search_contacts', 'Search Contacts', 'Search contacts by name, email, or tags', 'crm',
 '{"type": "object", "properties": {"query": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}, "limit": {"type": "integer", "default": 10}}, "required": ["query"]}',
 'module', '{"module": "crm", "action": "searchContacts"}', true),

('crm_create_contact', 'Create Contact', 'Create a new contact', 'crm',
 '{"type": "object", "properties": {"email": {"type": "string"}, "first_name": {"type": "string"}, "last_name": {"type": "string"}, "phone": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}}, "required": ["email"]}',
 'module', '{"module": "crm", "action": "createContact"}', true),

('crm_update_contact', 'Update Contact', 'Update an existing contact', 'crm',
 '{"type": "object", "properties": {"contact_id": {"type": "string"}, "updates": {"type": "object"}}, "required": ["contact_id", "updates"]}',
 'module', '{"module": "crm", "action": "updateContact"}', true),

('crm_add_note', 'Add Contact Note', 'Add a note to a contact', 'crm',
 '{"type": "object", "properties": {"contact_id": {"type": "string"}, "content": {"type": "string"}, "type": {"type": "string", "enum": ["note", "call", "meeting", "email"]}}, "required": ["contact_id", "content"]}',
 'module', '{"module": "crm", "action": "addNote"}', true),

-- Communication Tools  
('email_send', 'Send Email', 'Send an email to one or more recipients', 'communication',
 '{"type": "object", "properties": {"to": {"type": "array", "items": {"type": "string"}}, "subject": {"type": "string"}, "body": {"type": "string"}, "template_id": {"type": "string"}}, "required": ["to", "subject", "body"]}',
 'module', '{"module": "email", "action": "send"}', true),

('email_draft', 'Draft Email', 'Create an email draft for review', 'communication',
 '{"type": "object", "properties": {"to": {"type": "array", "items": {"type": "string"}}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "subject", "body"]}',
 'internal', '{"handler": "createEmailDraft"}', true),

-- Calendar Tools
('calendar_create_event', 'Create Calendar Event', 'Schedule a new calendar event', 'calendar',
 '{"type": "object", "properties": {"title": {"type": "string"}, "start_time": {"type": "string", "format": "date-time"}, "end_time": {"type": "string", "format": "date-time"}, "attendees": {"type": "array", "items": {"type": "string"}}, "description": {"type": "string"}}, "required": ["title", "start_time", "end_time"]}',
 'module', '{"module": "booking", "action": "createEvent"}', true),

('calendar_check_availability', 'Check Availability', 'Check calendar availability for a time range', 'calendar',
 '{"type": "object", "properties": {"start_time": {"type": "string", "format": "date-time"}, "end_time": {"type": "string", "format": "date-time"}, "user_id": {"type": "string"}}, "required": ["start_time", "end_time"]}',
 'module', '{"module": "booking", "action": "checkAvailability"}', true),

-- Task Tools
('task_create', 'Create Task', 'Create a new task', 'task',
 '{"type": "object", "properties": {"title": {"type": "string"}, "description": {"type": "string"}, "due_date": {"type": "string", "format": "date-time"}, "priority": {"type": "string", "enum": ["low", "medium", "high"]}, "assigned_to": {"type": "string"}}, "required": ["title"]}',
 'internal', '{"handler": "createTask"}', true),

-- Data Tools
('data_query', 'Query Data', 'Run a structured query against platform data', 'data',
 '{"type": "object", "properties": {"entity_type": {"type": "string"}, "filters": {"type": "object"}, "limit": {"type": "integer", "default": 100}, "order_by": {"type": "string"}}, "required": ["entity_type"]}',
 'internal', '{"handler": "queryData"}', true),

('data_aggregate', 'Aggregate Data', 'Get aggregated statistics', 'data',
 '{"type": "object", "properties": {"entity_type": {"type": "string"}, "metric": {"type": "string"}, "group_by": {"type": "string"}, "date_range": {"type": "object"}}, "required": ["entity_type", "metric"]}',
 'internal', '{"handler": "aggregateData"}', true),

-- Web Tools
('web_search', 'Web Search', 'Search the web for information', 'web',
 '{"type": "object", "properties": {"query": {"type": "string"}, "num_results": {"type": "integer", "default": 5}}, "required": ["query"]}',
 'external', '{"provider": "serper", "action": "search"}', true),

('web_scrape', 'Scrape Webpage', 'Extract content from a webpage', 'web',
 '{"type": "object", "properties": {"url": {"type": "string"}, "selector": {"type": "string"}}, "required": ["url"]}',
 'external', '{"provider": "firecrawl", "action": "scrape"}', true),

-- System Tools
('wait', 'Wait', 'Pause execution for a specified duration', 'system',
 '{"type": "object", "properties": {"seconds": {"type": "integer", "minimum": 1, "maximum": 3600}}, "required": ["seconds"]}',
 'internal', '{"handler": "wait"}', true),

('notify_user', 'Notify User', 'Send a notification to a user', 'system',
 '{"type": "object", "properties": {"user_id": {"type": "string"}, "message": {"type": "string"}, "channel": {"type": "string", "enum": ["in_app", "email", "sms"]}}, "required": ["message"]}',
 'internal', '{"handler": "notifyUser"}', true),

('trigger_workflow', 'Trigger Workflow', 'Start an automation workflow', 'system',
 '{"type": "object", "properties": {"workflow_id": {"type": "string"}, "input_data": {"type": "object"}}, "required": ["workflow_id"]}',
 'workflow', '{"action": "trigger"}', true)

ON CONFLICT (name) DO NOTHING;
```

---

## Core Agent Types

### 1. Assistant Agents

General-purpose agents that help users with various tasks.

```typescript
// Example: Personal Assistant Agent
const personalAssistant: AgentConfig = {
  name: "Alex",
  type: "assistant",
  personality: `You are Alex, a helpful and proactive personal assistant.
    You're friendly but professional, always looking for ways to help
    the user be more productive. You remember past conversations and
    use that context to provide better assistance.`,
  
  goals: [
    { name: "User Productivity", metric: "tasks_completed", priority: 9 },
    { name: "Response Quality", metric: "user_satisfaction", priority: 8 }
  ],
  
  triggers: ["manual", "schedule:daily_9am"],
  
  allowedTools: [
    "crm_*", "email_draft", "calendar_*", "task_create", "data_query"
  ],
  
  constraints: [
    "Never send emails without user approval",
    "Don't access financial data without explicit permission",
    "Always confirm before deleting any data"
  ]
};
```

### 2. Specialist Agents

Domain-specific agents with deep expertise in one area.

```typescript
// Example: Sales Development Agent
const salesDevRep: AgentConfig = {
  name: "SDR Agent",
  type: "specialist",
  domain: "sales",
  
  personality: `You are an expert Sales Development Representative.
    You excel at qualifying leads, researching prospects, and crafting
    personalized outreach. You understand sales psychology and timing.`,
  
  goals: [
    { name: "Lead Qualification", metric: "leads_qualified_per_day", target: 20 },
    { name: "Response Rate", metric: "email_response_rate", target: 0.15 },
    { name: "Meeting Bookings", metric: "meetings_booked_per_week", target: 5 }
  ],
  
  triggers: [
    "event:crm.contact.created",
    "event:form.submitted",
    "schedule:hourly"
  ],
  
  allowedTools: [
    "crm_*", "email_send", "email_draft", "calendar_create_event",
    "web_search", "data_query", "task_create"
  ],
  
  systemPrompt: `
    When a new lead comes in:
    1. Research their company (size, industry, recent news)
    2. Look up the contact on LinkedIn (if possible)
    3. Check if we've had any previous interactions
    4. Score the lead based on ICP fit
    5. If score > 70: Draft personalized outreach email
    6. If score 40-70: Add to nurture sequence
    7. If score < 40: Tag as low priority
    
    For follow-ups:
    - Check if lead opened previous emails
    - Vary messaging based on engagement
    - After 3 no-responses, suggest closing
  `
};
```

### 3. Orchestrator Agents

Agents that coordinate other agents for complex workflows.

```typescript
// Example: Customer Success Orchestrator
const customerSuccessOrchestrator: AgentConfig = {
  name: "CS Orchestrator",
  type: "orchestrator",
  
  personality: `You coordinate customer success activities by delegating
    to specialized agents and ensuring nothing falls through the cracks.`,
  
  managedAgents: [
    "onboarding_specialist",
    "health_monitor",
    "renewal_manager",
    "support_triage"
  ],
  
  goals: [
    { name: "Customer Health", metric: "avg_health_score", target: 80 },
    { name: "Churn Prevention", metric: "churn_rate", target: 0.05 },
    { name: "NPS Score", metric: "nps", target: 50 }
  ],
  
  triggers: [
    "event:customer.subscription.created",
    "event:customer.health_score.changed",
    "event:support.ticket.escalated",
    "schedule:daily_8am"
  ],
  
  delegationRules: [
    { condition: "new_customer", agent: "onboarding_specialist" },
    { condition: "health_score < 50", agent: "health_monitor", priority: "high" },
    { condition: "renewal_in_30_days", agent: "renewal_manager" },
    { condition: "support_ticket", agent: "support_triage" }
  ]
};
```

### 4. Analyst Agents

Data analysis and reporting specialists.

```typescript
// Example: Business Intelligence Agent
const biAgent: AgentConfig = {
  name: "BI Agent",
  type: "analyst",
  
  personality: `You are a data analyst who excels at finding insights
    in business data. You present findings clearly and always
    provide actionable recommendations.`,
  
  goals: [
    { name: "Insight Generation", metric: "insights_per_report", target: 5 },
    { name: "Accuracy", metric: "prediction_accuracy", target: 0.85 }
  ],
  
  triggers: [
    "schedule:weekly_monday_6am",
    "manual",
    "event:report.requested"
  ],
  
  allowedTools: [
    "data_query", "data_aggregate", "notify_user"
  ],
  
  reportTemplates: [
    "weekly_performance",
    "monthly_trends",
    "quarterly_forecast",
    "anomaly_detection"
  ]
};
```

### 5. Guardian Agents

Monitoring and alerting agents that protect the system.

```typescript
// Example: Security Guardian
const securityGuardian: AgentConfig = {
  name: "Security Guardian",
  type: "guardian",
  
  personality: `You are a vigilant security monitor, always watching
    for unusual patterns or potential threats. You alert humans
    when something needs attention but avoid false alarms.`,
  
  goals: [
    { name: "Threat Detection", metric: "threats_detected", priority: 10 },
    { name: "False Positive Rate", metric: "false_positive_rate", target: 0.05 }
  ],
  
  triggers: [
    "event:auth.login.*",
    "event:data.export.*",
    "event:api.rate_limit.*",
    "schedule:every_5_minutes"
  ],
  
  allowedTools: [
    "data_query", "notify_user"
  ],
  
  monitoringRules: [
    { pattern: "multiple_failed_logins", threshold: 5, window: "5m", severity: "high" },
    { pattern: "unusual_data_access", baseline: "user_normal", severity: "medium" },
    { pattern: "api_abuse", threshold: 1000, window: "1h", severity: "critical" }
  ],
  
  constraints: [
    "Never take destructive action without human approval",
    "Don't block legitimate users",
    "Always log reasoning for alerts"
  ]
};
```

---

## Agent Runtime Engine

### Core Execution Loop

```typescript
// src/lib/ai-agents/runtime/agent-executor.ts

import { AgentConfig, AgentContext, ExecutionResult } from '../types';
import { LLMProvider } from '../llm/provider';
import { ToolExecutor } from '../tools/executor';
import { MemoryManager } from '../memory/manager';

export class AgentExecutor {
  constructor(
    private llm: LLMProvider,
    private tools: ToolExecutor,
    private memory: MemoryManager
  ) {}

  async execute(
    agent: AgentConfig,
    trigger: TriggerContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const executionId = crypto.randomUUID();
    
    // 1. Initialize execution context
    const context = await this.initializeContext(agent, trigger);
    
    // 2. Load relevant memories
    const memories = await this.memory.retrieveRelevant(
      agent.id,
      context.summary,
      { limit: 10, types: ['fact', 'preference', 'outcome'] }
    );
    
    // 3. Build system prompt
    const systemPrompt = this.buildSystemPrompt(agent, memories);
    
    // 4. Create conversation
    const conversation = await this.initializeConversation(
      agent.id,
      context,
      systemPrompt
    );
    
    // 5. Run ReAct loop
    const result = await this.runReActLoop(
      agent,
      conversation,
      context,
      options
    );
    
    // 6. Update memories with learnings
    await this.updateMemories(agent, result);
    
    // 7. Record episode
    await this.recordEpisode(agent, executionId, trigger, result);
    
    return result;
  }

  private async runReActLoop(
    agent: AgentConfig,
    conversation: Conversation,
    context: AgentContext,
    options: ExecutionOptions
  ): Promise<ReActResult> {
    const maxSteps = options.maxSteps || agent.max_steps_per_run || 10;
    const steps: ExecutionStep[] = [];
    let isComplete = false;
    
    for (let step = 0; step < maxSteps && !isComplete; step++) {
      // OBSERVE: Get current state
      const observation = await this.observe(context);
      steps.push({ type: 'observe', content: observation });
      
      // THINK: Reason about what to do
      const thought = await this.think(
        conversation,
        observation,
        agent.goals
      );
      steps.push({ type: 'think', content: thought });
      
      // Check if agent wants to finish
      if (thought.action === 'finish') {
        isComplete = true;
        break;
      }
      
      // ACT: Execute the chosen action
      if (thought.action === 'use_tool') {
        // Check if action needs approval
        if (await this.needsApproval(agent, thought.tool, thought.input)) {
          return await this.requestApproval(agent, thought, steps);
        }
        
        const result = await this.act(
          agent,
          thought.tool,
          thought.input,
          context
        );
        steps.push({ type: 'act', tool: thought.tool, result });
        
        // Update context with action result
        context = this.updateContext(context, result);
        
        // Add to conversation
        conversation.addMessage('assistant', thought.reasoning);
        conversation.addMessage('tool', result);
      }
    }
    
    // Generate final response
    const finalResponse = await this.generateFinalResponse(
      conversation,
      steps,
      context
    );
    
    return {
      success: isComplete,
      steps,
      finalResponse,
      context,
      actions: steps.filter(s => s.type === 'act')
    };
  }

  private async think(
    conversation: Conversation,
    observation: string,
    goals: AgentGoal[]
  ): Promise<ThoughtResult> {
    const prompt = `
Current observation:
${observation}

Your goals (in priority order):
${goals.map((g, i) => `${i + 1}. ${g.name}: ${g.description}`).join('\n')}

Based on this observation and your goals, decide what to do next.

You can either:
1. Use a tool to take an action
2. Finish if your goal is achieved

Respond with your reasoning and decision in this format:
{
  "reasoning": "Your step-by-step reasoning...",
  "action": "use_tool" | "finish",
  "tool": "tool_name (if using tool)",
  "input": { tool input parameters (if using tool) },
  "confidence": 0.0-1.0
}`;

    const response = await this.llm.complete(conversation, prompt, {
      responseFormat: 'json'
    });
    
    return JSON.parse(response.content);
  }

  private async act(
    agent: AgentConfig,
    toolName: string,
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<ToolResult> {
    // Validate tool access
    if (!this.canUseTool(agent, toolName)) {
      throw new Error(`Agent not authorized to use tool: ${toolName}`);
    }
    
    // Execute tool
    return await this.tools.execute(toolName, input, {
      siteId: context.siteId,
      agentId: agent.id,
      executionId: context.executionId
    });
  }

  private buildSystemPrompt(
    agent: AgentConfig,
    memories: Memory[]
  ): string {
    return `
${agent.personality}

${agent.system_prompt}

## Your Capabilities
You have access to the following tools:
${agent.allowed_tools.map(t => `- ${t}`).join('\n')}

## Relevant Context from Memory
${memories.map(m => `- [${m.memory_type}] ${m.content}`).join('\n')}

## Constraints
${agent.constraints.map(c => `- ${c}`).join('\n')}

## Response Guidelines
- Think step by step before taking action
- Use tools when needed to gather information or take action
- Be concise but thorough
- Always explain your reasoning
- If unsure, ask for clarification rather than guessing
`;
  }
}
```

### Streaming Execution

```typescript
// src/lib/ai-agents/runtime/streaming-executor.ts

export class StreamingAgentExecutor extends AgentExecutor {
  async *executeStream(
    agent: AgentConfig,
    trigger: TriggerContext,
    options: ExecutionOptions = {}
  ): AsyncGenerator<ExecutionEvent> {
    const executionId = crypto.randomUUID();
    
    yield { type: 'execution_started', executionId };
    
    try {
      // Initialize
      yield { type: 'status', message: 'Initializing context...' };
      const context = await this.initializeContext(agent, trigger);
      
      yield { type: 'status', message: 'Loading memories...' };
      const memories = await this.memory.retrieveRelevant(agent.id, context.summary);
      
      // Stream the ReAct loop
      for await (const event of this.streamReActLoop(agent, context, memories)) {
        yield event;
      }
      
      yield { type: 'execution_completed', executionId };
      
    } catch (error) {
      yield { type: 'execution_failed', executionId, error: error.message };
    }
  }

  private async *streamReActLoop(
    agent: AgentConfig,
    context: AgentContext,
    memories: Memory[]
  ): AsyncGenerator<ExecutionEvent> {
    const maxSteps = agent.max_steps_per_run || 10;
    
    for (let step = 0; step < maxSteps; step++) {
      yield { type: 'step_started', step };
      
      // Observe
      yield { type: 'observe_started' };
      const observation = await this.observe(context);
      yield { type: 'observe_completed', observation };
      
      // Think (stream tokens)
      yield { type: 'think_started' };
      const thought = await this.thinkWithStreaming(context, observation);
      yield { type: 'think_completed', thought };
      
      if (thought.action === 'finish') {
        yield { type: 'agent_finished', reason: thought.reasoning };
        break;
      }
      
      // Act
      if (thought.action === 'use_tool') {
        yield { type: 'act_started', tool: thought.tool, input: thought.input };
        
        try {
          const result = await this.act(agent, thought.tool, thought.input, context);
          yield { type: 'act_completed', tool: thought.tool, result };
          context = this.updateContext(context, result);
        } catch (error) {
          yield { type: 'act_failed', tool: thought.tool, error: error.message };
        }
      }
      
      yield { type: 'step_completed', step };
    }
  }
}
```

---

## Memory & Context System

### Memory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MEMORY SYSTEM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           SHORT-TERM MEMORY (Conversations)              │    │
│  │                                                          │    │
│  │   • Current conversation context                         │    │
│  │   • Recent tool outputs                                  │    │
│  │   • Temporary working memory                             │    │
│  │   • Expires after session/timeout                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            LONG-TERM MEMORY (Persistent)                 │    │
│  │                                                          │    │
│  │   Facts: "John prefers email over phone"                 │    │
│  │   Preferences: "Company X uses Slack for comms"          │    │
│  │   Patterns: "Leads from LinkedIn convert 2x better"      │    │
│  │   Relationships: "Jane reports to Mike"                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            EPISODIC MEMORY (Past Actions)                │    │
│  │                                                          │    │
│  │   Episode 1: Qualified lead → Booked meeting → Won deal  │    │
│  │   Episode 2: Sent email → No response → Tried call →...  │    │
│  │   Episode 3: Detected fraud → Alerted user → Resolved    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           SEMANTIC MEMORY (Embeddings)                   │    │
│  │                                                          │    │
│  │   Vector store for similarity search                     │    │
│  │   Enables "find similar situations"                      │    │
│  │   Powers contextual retrieval                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Memory Manager Implementation

```typescript
// src/lib/ai-agents/memory/memory-manager.ts

import { createClient } from '@/lib/supabase/server';
import { OpenAIEmbeddings } from '../llm/embeddings';

export interface Memory {
  id: string;
  type: 'fact' | 'preference' | 'pattern' | 'relationship' | 'outcome';
  content: string;
  confidence: number;
  importance: number;
  subjectType?: string;
  subjectId?: string;
  tags: string[];
  createdAt: Date;
  lastAccessedAt: Date;
}

export class MemoryManager {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings();
  }

  /**
   * Store a new memory
   */
  async store(
    agentId: string,
    siteId: string,
    memory: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt'>
  ): Promise<Memory> {
    const supabase = await createClient();
    
    // Generate embedding for semantic search
    const embedding = await this.embeddings.embed(memory.content);
    
    const { data, error } = await supabase
      .from('ai_agent_memories')
      .insert({
        agent_id: agentId,
        site_id: siteId,
        memory_type: memory.type,
        content: memory.content,
        embedding,
        confidence: memory.confidence,
        importance: memory.importance,
        subject_type: memory.subjectType,
        subject_id: memory.subjectId,
        tags: memory.tags
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapMemory(data);
  }

  /**
   * Retrieve relevant memories using semantic search
   */
  async retrieveRelevant(
    agentId: string,
    query: string,
    options: {
      limit?: number;
      types?: Memory['type'][];
      subjectType?: string;
      subjectId?: string;
      minConfidence?: number;
    } = {}
  ): Promise<Memory[]> {
    const supabase = await createClient();
    
    // Generate query embedding
    const queryEmbedding = await this.embeddings.embed(query);
    
    // Use the database function for vector similarity search
    const { data, error } = await supabase.rpc('search_agent_memories', {
      p_agent_id: agentId,
      p_query_embedding: queryEmbedding,
      p_limit: options.limit || 10,
      p_memory_types: options.types || null
    });

    if (error) throw error;
    
    // Update access timestamps
    const memoryIds = data.map((m: any) => m.id);
    await supabase
      .from('ai_agent_memories')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.sql`access_count + 1`
      })
      .in('id', memoryIds);

    return data.map(this.mapMemory);
  }

  /**
   * Extract and store memories from agent execution
   */
  async extractAndStore(
    agentId: string,
    siteId: string,
    execution: ExecutionResult
  ): Promise<void> {
    const memories = await this.extractMemories(execution);
    
    for (const memory of memories) {
      // Check for duplicates
      const existing = await this.findSimilar(agentId, memory.content);
      
      if (existing && existing.similarity > 0.95) {
        // Update confidence of existing memory
        await this.updateConfidence(existing.id, memory.confidence);
      } else {
        // Store new memory
        await this.store(agentId, siteId, memory);
      }
    }
  }

  /**
   * Use LLM to extract memories from execution
   */
  private async extractMemories(
    execution: ExecutionResult
  ): Promise<Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt'>[]> {
    const prompt = `
Analyze this agent execution and extract important facts, preferences, 
patterns, or outcomes that should be remembered for future reference.

Execution summary:
- Trigger: ${execution.trigger}
- Actions taken: ${JSON.stringify(execution.actions)}
- Result: ${execution.result}
- Success: ${execution.success}

For each memory, provide:
1. Type: fact, preference, pattern, relationship, or outcome
2. Content: Clear, concise statement
3. Confidence: 0-1 how confident the agent should be
4. Importance: 1-10 how important to remember
5. Tags: Relevant categories

Return as JSON array.`;

    // Call LLM to extract memories
    const response = await this.llm.complete(prompt, {
      responseFormat: 'json'
    });
    
    return JSON.parse(response.content);
  }

  /**
   * Consolidate and prune memories periodically
   */
  async consolidate(agentId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get all memories for agent
    const { data: memories } = await supabase
      .from('ai_agent_memories')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });

    if (!memories || memories.length < 100) return;

    // Find similar memories to merge
    const clusters = await this.clusterSimilarMemories(memories);
    
    for (const cluster of clusters) {
      if (cluster.length > 1) {
        // Merge cluster into single memory
        const merged = await this.mergeMemories(cluster);
        
        // Delete old, keep merged
        await supabase
          .from('ai_agent_memories')
          .delete()
          .in('id', cluster.map(m => m.id).filter(id => id !== merged.id));
      }
    }

    // Prune low-importance, old, rarely accessed memories
    await supabase
      .from('ai_agent_memories')
      .delete()
      .eq('agent_id', agentId)
      .lt('importance', 3)
      .lt('access_count', 2)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  }
}
```

---

## Tool System

### Tool Interface

```typescript
// src/lib/ai-agents/tools/types.ts

export interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: 'crm' | 'communication' | 'calendar' | 'data' | 'web' | 'system';
  
  // OpenAI function calling format
  parametersSchema: JSONSchema;
  returnsSchema?: JSONSchema;
  
  // Execution
  handler: ToolHandler;
  
  // Permissions
  requiresPermissions?: string[];
  requiresModules?: string[];
  isDangerous?: boolean;
  
  // Rate limits
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>;

export interface ToolContext {
  siteId: string;
  agentId: string;
  executionId: string;
  userId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    durationMs?: number;
  };
}
```

### Tool Executor

```typescript
// src/lib/ai-agents/tools/executor.ts

import { createClient } from '@/lib/supabase/server';
import { ToolDefinition, ToolContext, ToolResult } from './types';
import { builtInTools } from './built-in';
import { moduleTools } from './module-tools';

export class ToolExecutor {
  private tools: Map<string, ToolDefinition> = new Map();
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.registerBuiltInTools();
  }

  private registerBuiltInTools(): void {
    // Register all built-in tools
    for (const tool of builtInTools) {
      this.tools.set(tool.name, tool);
    }
  }

  async execute(
    toolName: string,
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    // Get tool definition
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${toolName}` };
    }

    // Check rate limits
    if (!await this.rateLimiter.checkAndIncrement(toolName, context.agentId)) {
      return { success: false, error: 'Rate limit exceeded for tool' };
    }

    // Validate input
    const validation = this.validateInput(tool, input);
    if (!validation.valid) {
      return { success: false, error: `Invalid input: ${validation.error}` };
    }

    // Check permissions
    if (tool.requiresPermissions?.length) {
      const hasPermission = await this.checkPermissions(
        context,
        tool.requiresPermissions
      );
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions for tool' };
      }
    }

    // Log tool call start
    const callId = await this.logToolCallStart(tool, input, context);

    try {
      // Execute tool
      const result = await tool.handler(input, context);
      
      // Log completion
      await this.logToolCallComplete(callId, result, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      const errorResult: ToolResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await this.logToolCallComplete(callId, errorResult, Date.now() - startTime);
      
      return errorResult;
    }
  }

  /**
   * Get tools available to an agent
   */
  getAvailableTools(
    allowedTools: string[],
    deniedTools: string[] = []
  ): ToolDefinition[] {
    const available: ToolDefinition[] = [];
    
    for (const [name, tool] of this.tools) {
      // Check if explicitly denied
      if (deniedTools.includes(name)) continue;
      
      // Check if allowed (supports wildcards)
      const isAllowed = allowedTools.some(pattern => {
        if (pattern.endsWith('*')) {
          return name.startsWith(pattern.slice(0, -1));
        }
        return name === pattern;
      });
      
      if (isAllowed) {
        available.push(tool);
      }
    }
    
    return available;
  }

  /**
   * Format tools for LLM function calling
   */
  formatForLLM(tools: ToolDefinition[]): OpenAITool[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parametersSchema
      }
    }));
  }
}
```

### Built-in Tool Examples

```typescript
// src/lib/ai-agents/tools/built-in/crm-tools.ts

import { ToolDefinition } from '../types';

export const crmGetContact: ToolDefinition = {
  name: 'crm_get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a contact by ID or email address',
  category: 'crm',
  
  parametersSchema: {
    type: 'object',
    properties: {
      contact_id: { type: 'string', description: 'Contact UUID' },
      email: { type: 'string', format: 'email', description: 'Contact email' }
    },
    oneOf: [
      { required: ['contact_id'] },
      { required: ['email'] }
    ]
  },
  
  requiresModules: ['crm'],
  
  handler: async (input, context) => {
    const supabase = await createClient();
    
    let query = supabase
      .from('crm_contacts')
      .select('*')
      .eq('site_id', context.siteId);
    
    if (input.contact_id) {
      query = query.eq('id', input.contact_id);
    } else if (input.email) {
      query = query.eq('email', input.email);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  }
};

export const crmSearchContacts: ToolDefinition = {
  name: 'crm_search_contacts',
  displayName: 'Search Contacts',
  description: 'Search contacts by name, email, company, or tags',
  category: 'crm',
  
  parametersSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      tags: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Filter by tags' 
      },
      status: { 
        type: 'string',
        enum: ['active', 'inactive', 'lead', 'customer'],
        description: 'Filter by status'
      },
      limit: { type: 'integer', default: 10, maximum: 100 }
    },
    required: ['query']
  },
  
  requiresModules: ['crm'],
  
  handler: async (input, context) => {
    const supabase = await createClient();
    
    let query = supabase
      .from('crm_contacts')
      .select('id, email, first_name, last_name, company, tags, status, created_at')
      .eq('site_id', context.siteId)
      .or(`email.ilike.%${input.query}%,first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%,company.ilike.%${input.query}%`)
      .limit(input.limit || 10);
    
    if (input.tags?.length) {
      query = query.contains('tags', input.tags);
    }
    
    if (input.status) {
      query = query.eq('status', input.status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data: {
        contacts: data,
        count: data.length
      }
    };
  }
};

export const crmCreateContact: ToolDefinition = {
  name: 'crm_create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in the CRM',
  category: 'crm',
  isDangerous: false,
  
  parametersSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      company: { type: 'string' },
      phone: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      custom_fields: { type: 'object' }
    },
    required: ['email']
  },
  
  requiresModules: ['crm'],
  
  handler: async (input, context) => {
    const supabase = await createClient();
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('site_id', context.siteId)
      .eq('email', input.email)
      .single();
    
    if (existing) {
      return { 
        success: false, 
        error: 'Contact with this email already exists',
        data: { existingId: existing.id }
      };
    }
    
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        site_id: context.siteId,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        company: input.company,
        phone: input.phone,
        tags: input.tags || [],
        custom_fields: input.custom_fields || {},
        source: 'ai_agent',
        source_details: { agentId: context.agentId }
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Emit event for other systems
    await emitEvent('crm.contact.created', {
      siteId: context.siteId,
      contactId: data.id,
      source: 'ai_agent',
      agentId: context.agentId
    });
    
    return { success: true, data };
  }
};
```

---

## LLM Provider Abstraction

### Provider Interface

```typescript
// src/lib/ai-agents/llm/provider.ts

export interface LLMProvider {
  name: string;
  
  complete(
    messages: Message[],
    options: CompletionOptions
  ): Promise<CompletionResult>;
  
  completeWithTools(
    messages: Message[],
    tools: OpenAITool[],
    options: CompletionOptions
  ): Promise<ToolCompletionResult>;
  
  stream(
    messages: Message[],
    options: CompletionOptions
  ): AsyncGenerator<StreamChunk>;
  
  embed(text: string): Promise<number[]>;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  stop?: string[];
}

export interface CompletionResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  finishReason: 'stop' | 'length' | 'tool_calls';
}
```

### OpenAI Provider

```typescript
// src/lib/ai-agents/llm/providers/openai.ts

import OpenAI from 'openai';
import { LLMProvider, CompletionOptions, CompletionResult } from '../provider';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI;
  private defaultModel = 'gpt-4o';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined
    });

    return {
      content: response.choices[0].message.content || '',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      finishReason: response.choices[0].finish_reason as any
    };
  }

  async completeWithTools(
    messages: Message[],
    tools: OpenAITool[],
    options: CompletionOptions = {}
  ): Promise<ToolCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_calls: m.toolCalls,
        tool_call_id: m.toolCallId
      })),
      tools,
      tool_choice: 'auto',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096
    });

    const message = response.choices[0].message;

    return {
      content: message.content || '',
      toolCalls: message.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })) || [],
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      finishReason: response.choices[0].finish_reason as any
    };
  }

  async *stream(
    messages: Message[],
    options: CompletionOptions = {}
  ): AsyncGenerator<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { type: 'content', content: delta.content };
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }
}
```

### Anthropic Provider

```typescript
// src/lib/ai-agents/llm/providers/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, CompletionOptions, CompletionResult } from '../provider';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      max_tokens: options.maxTokens ?? 4096
    });

    return {
      content: response.content[0].type === 'text' 
        ? response.content[0].text 
        : '',
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      finishReason: response.stop_reason as any
    };
  }

  async completeWithTools(
    messages: Message[],
    tools: OpenAITool[],
    options: CompletionOptions = {}
  ): Promise<ToolCompletionResult> {
    // Convert OpenAI tool format to Anthropic format
    const anthropicTools = tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }));

    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      tools: anthropicTools,
      max_tokens: options.maxTokens ?? 4096
    });

    // Extract tool calls from response
    const toolCalls = response.content
      .filter(c => c.type === 'tool_use')
      .map(c => ({
        id: c.id,
        name: c.name,
        arguments: c.input
      }));

    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    return {
      content: textContent,
      toolCalls,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      finishReason: response.stop_reason as any
    };
  }
}
```

---

## Security & Governance

### Permission System

```typescript
// src/lib/ai-agents/security/permissions.ts

export interface AgentPermissions {
  // Data access
  canReadContacts: boolean;
  canWriteContacts: boolean;
  canDeleteContacts: boolean;
  
  canReadDeals: boolean;
  canWriteDeals: boolean;
  
  canReadFinancials: boolean;
  
  // Actions
  canSendEmails: boolean;
  canSendSMS: boolean;
  canMakeAPICalls: boolean;
  canTriggerWorkflows: boolean;
  
  // External
  canAccessWeb: boolean;
  canAccessExternalAPIs: boolean;
  
  // System
  canCreateTasks: boolean;
  canModifySettings: boolean;
}

export class PermissionChecker {
  async checkAgentPermissions(
    agentId: string,
    siteId: string,
    requiredPermissions: string[]
  ): Promise<{ allowed: boolean; denied: string[] }> {
    const supabase = await createClient();
    
    // Get agent's allowed/denied tools
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('allowed_tools, denied_tools, constraints')
      .eq('id', agentId)
      .single();
    
    if (!agent) {
      return { allowed: false, denied: requiredPermissions };
    }
    
    const denied: string[] = [];
    
    for (const permission of requiredPermissions) {
      // Check if explicitly denied
      if (agent.denied_tools.includes(permission)) {
        denied.push(permission);
        continue;
      }
      
      // Check if allowed (with wildcard support)
      const isAllowed = agent.allowed_tools.some((allowed: string) => {
        if (allowed.endsWith('*')) {
          return permission.startsWith(allowed.slice(0, -1));
        }
        return allowed === permission;
      });
      
      if (!isAllowed) {
        denied.push(permission);
      }
    }
    
    return {
      allowed: denied.length === 0,
      denied
    };
  }
}
```

### Action Approval System

```typescript
// src/lib/ai-agents/security/approvals.ts

export interface ApprovalRequest {
  executionId: string;
  agentId: string;
  actionType: string;
  actionDescription: string;
  actionParams: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskExplanation: string;
  expiresAt: Date;
}

export class ApprovalManager {
  /**
   * Check if action needs human approval
   */
  async needsApproval(
    agent: AgentConfig,
    tool: ToolDefinition,
    input: Record<string, unknown>
  ): Promise<{ needed: boolean; reason?: string }> {
    // Always require approval for dangerous tools
    if (tool.isDangerous) {
      return { needed: true, reason: 'Tool marked as dangerous' };
    }
    
    // Check agent-specific rules
    if (agent.constraints) {
      for (const constraint of agent.constraints) {
        if (this.constraintRequiresApproval(constraint, tool, input)) {
          return { needed: true, reason: constraint };
        }
      }
    }
    
    // Check risk assessment
    const riskLevel = await this.assessRisk(tool, input);
    if (riskLevel === 'high' || riskLevel === 'critical') {
      return { needed: true, reason: `Risk level: ${riskLevel}` };
    }
    
    return { needed: false };
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(
    executionId: string,
    agent: AgentConfig,
    tool: ToolDefinition,
    input: Record<string, unknown>,
    reason: string
  ): Promise<ApprovalRequest> {
    const supabase = await createClient();
    
    const riskLevel = await this.assessRisk(tool, input);
    
    const { data, error } = await supabase
      .from('ai_agent_approvals')
      .insert({
        execution_id: executionId,
        agent_id: agent.id,
        site_id: agent.site_id,
        action_type: tool.name,
        action_description: this.describeAction(tool, input),
        action_params: input,
        risk_level: riskLevel,
        risk_explanation: reason,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify relevant users
    await this.notifyApprovers(agent.site_id, data);
    
    return data;
  }

  /**
   * Process approval/denial
   */
  async resolveApproval(
    approvalId: string,
    userId: string,
    approved: boolean,
    note?: string
  ): Promise<void> {
    const supabase = await createClient();
    
    const { data: approval, error: fetchError } = await supabase
      .from('ai_agent_approvals')
      .select('*, ai_agent_executions(*)')
      .eq('id', approvalId)
      .single();
    
    if (fetchError || !approval) {
      throw new Error('Approval not found');
    }
    
    // Update approval status
    await supabase
      .from('ai_agent_approvals')
      .update({
        status: approved ? 'approved' : 'denied',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_note: note
      })
      .eq('id', approvalId);
    
    // Resume or cancel execution
    if (approved) {
      await this.resumeExecution(approval.execution_id, approval.action_params);
    } else {
      await this.cancelExecution(approval.execution_id, 'Action denied by user');
    }
  }

  private async assessRisk(
    tool: ToolDefinition,
    input: Record<string, unknown>
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    // Risk rules
    const rules = [
      { tool: 'email_send', field: 'to', threshold: 10, risk: 'high' },
      { tool: 'crm_delete_*', risk: 'critical' },
      { tool: 'data_export', risk: 'high' },
      { tool: 'settings_*', risk: 'medium' }
    ];
    
    for (const rule of rules) {
      if (tool.name.match(rule.tool.replace('*', '.*'))) {
        if (rule.field && Array.isArray(input[rule.field])) {
          if ((input[rule.field] as any[]).length >= (rule.threshold || 0)) {
            return rule.risk as any;
          }
        }
        return (rule.risk || 'medium') as any;
      }
    }
    
    return 'low';
  }
}
```

---

## Next: Part B (PHASE-EM-58B-AI-AGENTS.md)

Part B will cover:
- Pre-built Agent Templates
- Real-World Workflows by Industry
- Agent Builder UI Components
- Marketplace Integration
- Analytics & Monitoring
- Pricing & Usage Tiers
- Testing Framework
- Deployment Checklist

---

## Quick Reference

### File Locations (After Implementation)

```
src/lib/ai-agents/
├── types.ts                    # Core type definitions
├── runtime/
│   ├── agent-executor.ts       # Main execution engine
│   ├── streaming-executor.ts   # Streaming support
│   └── scheduler.ts            # Scheduled agent runs
├── memory/
│   ├── memory-manager.ts       # Memory CRUD
│   └── consolidation.ts        # Memory cleanup
├── tools/
│   ├── types.ts                # Tool interfaces
│   ├── executor.ts             # Tool execution
│   └── built-in/               # Built-in tools
├── llm/
│   ├── provider.ts             # Provider interface
│   └── providers/              # OpenAI, Anthropic, etc.
├── security/
│   ├── permissions.ts          # Permission checking
│   └── approvals.ts            # Human-in-the-loop
└── api/
    └── routes.ts               # API endpoints
```

### Key APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Create agent |
| `/api/agents/:id` | GET | Get agent details |
| `/api/agents/:id` | PATCH | Update agent |
| `/api/agents/:id/execute` | POST | Trigger agent manually |
| `/api/agents/:id/executions` | GET | Get execution history |
| `/api/agents/:id/memories` | GET | Get agent memories |
| `/api/approvals` | GET | List pending approvals |
| `/api/approvals/:id` | POST | Approve/deny action |

---

## 🔔 Automation Event Integration (CRITICAL)

### Events This Module MUST Emit

AI Agents must emit automation events to integrate with the automation engine (EM-57):

```typescript
// Required import in all agent action files
import { logAutomationEvent } from '@/modules/automation/services/event-processor'
```

### Events to Emit

| Event | Trigger | Payload |
|-------|---------|---------|
| `ai.agent.created` | New agent created | `{ id, name, type, domain }` |
| `ai.agent.updated` | Agent configuration changed | `{ id, changes }` |
| `ai.agent.deleted` | Agent removed | `{ id, name }` |
| `ai.agent.activated` | Agent enabled | `{ id, name }` |
| `ai.agent.deactivated` | Agent disabled | `{ id, name }` |
| `ai.execution.started` | Agent run begins | `{ execution_id, agent_id, trigger_type }` |
| `ai.execution.completed` | Agent run finishes successfully | `{ execution_id, agent_id, actions_taken, tokens_used }` |
| `ai.execution.failed` | Agent run fails | `{ execution_id, agent_id, error }` |
| `ai.approval.requested` | Human approval needed | `{ approval_id, agent_id, action_type, risk_level }` |
| `ai.approval.resolved` | Approval granted/denied | `{ approval_id, approved, resolved_by }` |

### Integration Code Example

```typescript
// After creating an agent
await logAutomationEvent(siteId, 'ai.agent.created', {
  id: newAgent.id,
  name: newAgent.name,
  type: newAgent.agent_type,
  domain: newAgent.domain,
}, {
  sourceModule: 'ai_agents',
  sourceEntityType: 'agent',
  sourceEntityId: newAgent.id
})

// After agent execution completes
await logAutomationEvent(siteId, 'ai.execution.completed', {
  execution_id: execution.id,
  agent_id: execution.agent_id,
  actions_taken: execution.actions_taken,
  tokens_used: execution.tokens_total,
  duration_ms: execution.duration_ms,
})
```

### EVENT_REGISTRY Addition

Add to `src/modules/automation/lib/event-types.ts`:

```typescript
'ai_agents': {
  'agent.created': {
    id: 'ai.agent.created',
    category: 'AI Agents',
    name: 'Agent Created',
    description: 'Triggered when a new AI agent is created',
    trigger_label: 'When AI agent is created',
    payload_schema: { id: 'string', name: 'string', type: 'string', domain: 'string' }
  },
  'execution.completed': {
    id: 'ai.execution.completed',
    category: 'AI Agents',
    name: 'Agent Execution Completed',
    description: 'Triggered when an AI agent completes a run',
    trigger_label: 'When AI agent completes execution',
    payload_schema: { execution_id: 'string', agent_id: 'string', tokens_used: 'number' }
  },
  // ... add all events
}
```

---

## 📊 Current Database Schema Reference

When writing the EM-58 migration, be aware of these existing tables:

**Automation Engine (EM-57) - Already Exists:**
- `automation_workflows`, `workflow_steps`, `workflow_executions`
- `step_execution_logs`, `automation_events_log`
- `automation_event_subscriptions`, `automation_connections`

**RLS Helper Functions (Phase-59) - Use These:**
- `auth.can_access_site(site_id)` - Check site access
- `auth.get_current_agency_id()` - Get user's agency
- `auth.is_agency_admin(agency_id)` - Check admin role
- `auth.is_super_admin()` - Check super admin

---

*Document Version: 1.1*  
*Created: 2026-01-24*  
*Updated: 2026-01-26 (Added automation event integration)*  
*Phase Status: Specification Complete*
