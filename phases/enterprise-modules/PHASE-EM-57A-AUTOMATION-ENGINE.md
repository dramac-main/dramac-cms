# Phase EM-57A: Automation Engine - Core Infrastructure

> **Priority**: 🔴 CRITICAL (Platform Game-Changer)
> **Estimated Time**: 2-3 weeks
> **Prerequisites**: EM-01, EM-10, EM-11, EM-12, EM-13, EM-33, Phase-59 RLS Helpers
> **Status**: 📋 READY TO IMPLEMENT
> **Module Type**: System
> **Phase Split**: This is Part A of 2 (Core Infrastructure)

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

Before implementing, ensure the following platform patterns are followed:

1. **RLS Functions**: Use `auth.can_access_site(site_id)` from `phase-59-rls-helpers.sql` (NOT `user_has_site_access`)
2. **CRM Tables**: Use `mod_crmmod01_*` prefix (NOT `crm_*`) per EM-05 conventions
3. **Events**: Integrate with existing `src/lib/modules/module-events.ts` using `emitEvent()` function
4. **Server Actions**: Follow existing pattern in `src/modules/*/actions/*-actions.ts`
5. **Supabase Client**: Use `await createClient()` from `@/lib/supabase/server`

---

## 📋 Document Overview

This is **Part A** of the Automation Engine specification. It covers:

| Part A (This Document) | Part B (EM-57B) |
|------------------------|-----------------|
| ✅ Database Schema | Visual Workflow Builder UI |
| ✅ Event Bus System | Advanced Action Library |
| ✅ Execution Engine | Workflow Templates |
| ✅ Core Triggers | External Tool Integration |
| ✅ Core Actions | Analytics Dashboard |
| ✅ Server Actions | AI-Powered Suggestions |
| ✅ Background Workers | Marketplace Templates |

---

## 🎯 Objective

Build a **production-ready Automation Engine** that enables agencies and their clients to create powerful automations connecting ALL platform modules. This transforms DRAMAC from a collection of isolated tools into an **intelligent, interconnected business platform**.

### Why This Module Changes Everything

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WITHOUT AUTOMATION ENGINE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CRM     Booking    Forms    Accounting    Email                    │
│   ●         ●         ●          ●           ●                      │
│   │         │         │          │           │                      │
│   └─────────┴─────────┴──────────┴───────────┘                      │
│                  (Manual work between each)                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     WITH AUTOMATION ENGINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CRM ────┬──── Booking ────┬──── Forms                              │
│    │     │         │       │       │                                │
│    │     │    ┌────┴───────┴───────┤                                │
│    │     │    │                    │                                │
│    └─────┴────┤   AUTOMATION     ├─────── Email                    │
│               │     ENGINE        │                                 │
│    ┌──────────┤                  ├─────── Slack                    │
│    │          │  ⚡ Triggers     │                                 │
│    │          │  🔄 Actions      │                                 │
│    │          │  📊 Analytics    │                                 │
│ Accounting ───┴──────────────────┴─────── Webhooks                  │
│                                                                      │
│              (Everything connected, automated)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Competitive Analysis

| Feature | Zapier | Make | n8n | **DRAMAC Automation** |
|---------|--------|------|-----|----------------------|
| Visual Builder | ✅ | ✅ | ✅ | ✅ |
| Native Module Integration | ❌ | ❌ | ❌ | ✅ **Built-in** |
| White-label | ❌ | ❌ | ❌ | ✅ |
| Self-hosted | ❌ | ❌ | ✅ | ✅ |
| Per-task Pricing | ✅ $0.01/task | ✅ $0.001/op | Free | **Included** |
| API Access | ✅ | ✅ | ✅ | ✅ |
| Delay/Wait Steps | ✅ | ✅ | ✅ | ✅ |
| Conditional Logic | ✅ | ✅ | ✅ | ✅ |
| Error Handling | Basic | ✅ | ✅ | ✅ |
| Real-time Events | ❌ | ❌ | ✅ | ✅ **Native** |

---

## 🔗 How This Module Uses Platform Services

| Service | From Phase | Usage in Automation |
|---------|------------|---------------------|
| Database Provisioning | EM-11 | Creates `mod_{short_id}` schema with automation tables |
| API Gateway | EM-12 | Exposes `/workflows`, `/executions`, `/triggers` endpoints |
| Module Naming | EM-05 | All tables use `${SCHEMA}.` prefix for isolation |
| Type System | EM-10 | Module type = `system` (full schema isolation) |
| Module Lifecycle | EM-01 | Syncs to marketplace, handles install/uninstall |
| Module Events | EM-33 | **Core dependency** - listens to ALL module events |
| Webhook Delivery | EM-33 | Sends webhooks to external services |
| Module Authentication | EM-13 | Secures workflow API access |

---

## 🗃️ Database Schema

### Schema Overview

```
automation_module/
├── workflows              # Workflow definitions
├── workflow_steps         # Steps within workflows  
├── workflow_triggers      # Trigger configurations
├── workflow_executions    # Execution history
├── step_execution_logs    # Per-step execution logs
├── workflow_variables     # Shared workflow variables
├── automation_connections # External service credentials
├── event_subscriptions    # Event bus subscriptions
└── scheduled_jobs         # Cron job registry
```

### Migration File: `migrations/em-57-automation-engine.sql`

```sql
-- ============================================================================
-- Phase EM-57: Automation Engine Schema
-- Created: 2026-01-XX
-- Description: Core automation infrastructure for workflow management
-- ============================================================================

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key for error branch
  CONSTRAINT fk_error_branch FOREIGN KEY (error_branch_step_id) 
    REFERENCES workflow_steps(id) ON DELETE SET NULL
);

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
  parent_execution_id UUID,           -- For retries, reference original
  
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
CREATE TABLE IF NOT EXISTS event_subscriptions (
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
-- 
-- Integration: The EventProcessor (Section 6) polls/subscribes to module_events
-- and copies relevant events here for the execution engine to process.
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT idx_event_type_time CHECK (event_type IS NOT NULL)
);

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs (
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
  
  -- Credentials (encrypted)
  credentials JSONB NOT NULL DEFAULT '{}',   -- Encrypted at rest
  
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
CREATE INDEX idx_workflows_site ON automation_workflows(site_id);
CREATE INDEX idx_workflows_active ON automation_workflows(site_id, is_active) WHERE is_active;
CREATE INDEX idx_workflows_trigger ON automation_workflows(site_id, trigger_type);

-- Steps
CREATE INDEX idx_steps_workflow ON workflow_steps(workflow_id, position);
CREATE INDEX idx_steps_type ON workflow_steps(workflow_id, step_type);

-- Executions
CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id, created_at DESC);
CREATE INDEX idx_executions_status ON workflow_executions(site_id, status);
CREATE INDEX idx_executions_pending ON workflow_executions(status, resume_at) 
  WHERE status IN ('pending', 'paused');

-- Step logs
CREATE INDEX idx_step_logs_execution ON step_execution_logs(execution_id, created_at);
CREATE INDEX idx_step_logs_step ON step_execution_logs(step_id, created_at DESC);

-- Event subscriptions
CREATE INDEX idx_subscriptions_event ON event_subscriptions(event_type, is_active) WHERE is_active;
CREATE INDEX idx_subscriptions_workflow ON event_subscriptions(workflow_id);

-- Events log
CREATE INDEX idx_events_log_site ON automation_events_log(site_id, created_at DESC);
CREATE INDEX idx_events_log_type ON automation_events_log(site_id, event_type, created_at DESC);
CREATE INDEX idx_events_log_unprocessed ON automation_events_log(site_id, processed, created_at)
  WHERE NOT processed;

-- Scheduled jobs
CREATE INDEX idx_scheduled_jobs_next ON scheduled_jobs(next_run_at) WHERE is_active;
CREATE INDEX idx_scheduled_jobs_site ON scheduled_jobs(site_id);

-- Connections
CREATE INDEX idx_connections_site ON automation_connections(site_id);
CREATE INDEX idx_connections_type ON automation_connections(site_id, service_type);

-- Webhook endpoints
CREATE INDEX idx_webhook_endpoints_path ON automation_webhook_endpoints(site_id, endpoint_path);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SERVICE ROLE BYPASS (Required for background workers & execution engine)
-- ============================================================================
-- Background workers run with service_role to execute workflows without user context

CREATE POLICY "Service role bypass" ON automation_workflows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON workflow_steps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON workflow_executions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON step_execution_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON workflow_variables
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON event_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON automation_events_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON scheduled_jobs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON automation_connections
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON automation_webhook_endpoints
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES (Using existing auth.can_access_site() from Phase-59)
-- ============================================================================
-- Note: auth.can_access_site(site_id) is defined in phase-59-rls-helpers.sql
-- It checks if current user has access to the site via their agency membership

CREATE POLICY "Users can access their site's workflows" ON automation_workflows
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's steps" ON workflow_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM automation_workflows w 
      WHERE w.id = workflow_steps.workflow_id 
      AND auth.can_access_site(w.site_id)
    )
  );

CREATE POLICY "Users can access their site's executions" ON workflow_executions
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's step logs" ON step_execution_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_executions e 
      WHERE e.id = step_execution_logs.execution_id 
      AND auth.can_access_site(e.site_id)
    )
  );

CREATE POLICY "Users can access their site's variables" ON workflow_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM automation_workflows w 
      WHERE w.id = workflow_variables.workflow_id 
      AND auth.can_access_site(w.site_id)
    )
  );

CREATE POLICY "Users can access their site's subscriptions" ON event_subscriptions
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's events" ON automation_events_log
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's jobs" ON scheduled_jobs
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's connections" ON automation_connections
  FOR ALL USING (auth.can_access_site(site_id));

CREATE POLICY "Users can access their site's webhook endpoints" ON automation_webhook_endpoints
  FOR ALL USING (auth.can_access_site(site_id));

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

-- Update workflow stats
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
$$ LANGUAGE plpgsql;

-- Calculate next scheduled run
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_cron TEXT,
  p_timezone TEXT DEFAULT 'UTC',
  p_after TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
-- This is a placeholder - actual cron parsing requires pg_cron or application logic
BEGIN
  RETURN p_after + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Event Types Registry

### Integration with Existing module-events.ts

> ⚠️ **IMPORTANT**: The automation engine MUST integrate with the existing event system 
> defined in `src/lib/modules/module-events.ts` (Phase EM-33).
>
> The existing system uses patterns like:
> - `module:installed`, `module:settings_changed`
> - `data:created`, `data:updated`, `data:deleted`
> - `user:action`, `user:form_submitted`
>
> The automation-specific events below EXTEND the existing system and are emitted 
> using the `emitEvent()` function from module-events.ts:
>
> ```typescript
> import { emitEvent } from '@/lib/modules/module-events';
> 
> // Emit automation event
> await emitEvent(
>   automationModuleId,  // source module
>   siteId,
>   'crm.contact.created',  // event name
>   { contactId, email, firstName }  // payload
> );
> ```

### Standard Platform Events

The automation engine listens to events from ALL installed modules. Here's the event registry:

```typescript
// src/modules/automation/lib/event-types.ts

/**
 * Platform Event Type Registry
 * 
 * IMPORTANT: These event names are EXTENSIONS of the core module-events.ts system.
 * The automation engine subscribes to events via the existing emitEvent() infrastructure.
 * 
 * Naming Convention: {module}.{entity}.{action}
 * 
 * Examples:
 * - crm.contact.created
 * - booking.appointment.confirmed
 * - form.submission.received
 */

export const EVENT_REGISTRY = {
  // =========================================================
  // CRM MODULE (EM-50)
  // =========================================================
  crm: {
    contact: {
      created: 'crm.contact.created',
      updated: 'crm.contact.updated',
      deleted: 'crm.contact.deleted',
      merged: 'crm.contact.merged',
      tag_added: 'crm.contact.tag_added',
      tag_removed: 'crm.contact.tag_removed',
      note_added: 'crm.contact.note_added',
    },
    company: {
      created: 'crm.company.created',
      updated: 'crm.company.updated',
      deleted: 'crm.company.deleted',
    },
    deal: {
      created: 'crm.deal.created',
      updated: 'crm.deal.updated',
      deleted: 'crm.deal.deleted',
      stage_changed: 'crm.deal.stage_changed',
      won: 'crm.deal.won',
      lost: 'crm.deal.lost',
      value_changed: 'crm.deal.value_changed',
      owner_changed: 'crm.deal.owner_changed',
    },
    task: {
      created: 'crm.task.created',
      completed: 'crm.task.completed',
      overdue: 'crm.task.overdue',
    },
    activity: {
      logged: 'crm.activity.logged',
      email_sent: 'crm.activity.email_sent',
      call_logged: 'crm.activity.call_logged',
      meeting_logged: 'crm.activity.meeting_logged',
    },
  },
  
  // =========================================================
  // BOOKING MODULE (EM-51)
  // =========================================================
  booking: {
    appointment: {
      created: 'booking.appointment.created',
      confirmed: 'booking.appointment.confirmed',
      cancelled: 'booking.appointment.cancelled',
      rescheduled: 'booking.appointment.rescheduled',
      completed: 'booking.appointment.completed',
      no_show: 'booking.appointment.no_show',
      reminder_sent: 'booking.appointment.reminder_sent',
    },
    availability: {
      updated: 'booking.availability.updated',
      blocked: 'booking.availability.blocked',
    },
    service: {
      created: 'booking.service.created',
      updated: 'booking.service.updated',
    },
  },
  
  // =========================================================
  // FORMS MODULE (Built-in)
  // =========================================================
  form: {
    submission: {
      received: 'form.submission.received',
      processed: 'form.submission.processed',
      spam_detected: 'form.submission.spam_detected',
    },
    form: {
      created: 'form.form.created',
      published: 'form.form.published',
      unpublished: 'form.form.unpublished',
    },
  },
  
  // =========================================================
  // ACCOUNTING MODULE (EM-55)
  // =========================================================
  accounting: {
    invoice: {
      created: 'accounting.invoice.created',
      sent: 'accounting.invoice.sent',
      viewed: 'accounting.invoice.viewed',
      paid: 'accounting.invoice.paid',
      partial_payment: 'accounting.invoice.partial_payment',
      overdue: 'accounting.invoice.overdue',
      cancelled: 'accounting.invoice.cancelled',
    },
    payment: {
      received: 'accounting.payment.received',
      failed: 'accounting.payment.failed',
      refunded: 'accounting.payment.refunded',
    },
    expense: {
      created: 'accounting.expense.created',
      approved: 'accounting.expense.approved',
      rejected: 'accounting.expense.rejected',
    },
    client: {
      created: 'accounting.client.created',
      updated: 'accounting.client.updated',
    },
  },
  
  // =========================================================
  // E-COMMERCE MODULE (EM-52)
  // =========================================================
  ecommerce: {
    order: {
      created: 'ecommerce.order.created',
      paid: 'ecommerce.order.paid',
      shipped: 'ecommerce.order.shipped',
      delivered: 'ecommerce.order.delivered',
      cancelled: 'ecommerce.order.cancelled',
      refunded: 'ecommerce.order.refunded',
    },
    cart: {
      abandoned: 'ecommerce.cart.abandoned',
      recovered: 'ecommerce.cart.recovered',
    },
    product: {
      low_stock: 'ecommerce.product.low_stock',
      out_of_stock: 'ecommerce.product.out_of_stock',
      restocked: 'ecommerce.product.restocked',
    },
    customer: {
      created: 'ecommerce.customer.created',
      first_purchase: 'ecommerce.customer.first_purchase',
    },
  },
  
  // =========================================================
  // DOMAIN MODULE (DM-XX)
  // =========================================================
  domain: {
    domain: {
      registered: 'domain.domain.registered',        // New domain registered
      renewed: 'domain.domain.renewed',              // Domain renewed
      transferred_in: 'domain.domain.transferred_in', // Transfer completed
      transferred_out: 'domain.domain.transferred_out', // Transfer out initiated
      expiring_soon: 'domain.domain.expiring_soon',  // Expiring within X days
      expired: 'domain.domain.expired',              // Domain expired
      suspended: 'domain.domain.suspended',          // Domain suspended
      reactivated: 'domain.domain.reactivated',      // Domain reactivated
      auto_renewed: 'domain.domain.auto_renewed',    // Auto-renewal processed
      nameservers_changed: 'domain.domain.nameservers_changed', // NS changed
    },
    dns: {
      record_created: 'domain.dns.record_created',   // DNS record added
      record_updated: 'domain.dns.record_updated',   // DNS record updated
      record_deleted: 'domain.dns.record_deleted',   // DNS record deleted
      zone_created: 'domain.dns.zone_created',       // Cloudflare zone created
      ssl_provisioned: 'domain.dns.ssl_provisioned', // SSL certificate ready
      propagation_complete: 'domain.dns.propagation_complete', // DNS propagated
    },
    email: {
      subscription_created: 'domain.email.subscription_created', // Email plan purchased
      subscription_cancelled: 'domain.email.subscription_cancelled', // Email cancelled
      account_created: 'domain.email.account_created', // Email mailbox created
      account_deleted: 'domain.email.account_deleted', // Email mailbox deleted
      quota_warning: 'domain.email.quota_warning',     // Mailbox near capacity
    },
    order: {
      created: 'domain.order.created',               // New order placed
      completed: 'domain.order.completed',           // Order fulfilled
      failed: 'domain.order.failed',                 // Order failed
      refunded: 'domain.order.refunded',             // Order refunded
    },
    transfer: {
      initiated: 'domain.transfer.initiated',        // Transfer started
      auth_required: 'domain.transfer.auth_required', // Auth code needed
      approved: 'domain.transfer.approved',          // Transfer approved
      completed: 'domain.transfer.completed',        // Transfer done
      failed: 'domain.transfer.failed',              // Transfer failed
      cancelled: 'domain.transfer.cancelled',        // Transfer cancelled
    },
  },
  
  // =========================================================
  // SYSTEM EVENTS
  // =========================================================
  system: {
    webhook: {
      received: 'system.webhook.received',
      failed: 'system.webhook.failed',
    },
    schedule: {
      triggered: 'system.schedule.triggered',
    },
    module: {
      installed: 'system.module.installed',
      uninstalled: 'system.module.uninstalled',
      settings_changed: 'system.module.settings_changed',
    },
    user: {
      created: 'system.user.created',
      logged_in: 'system.user.logged_in',
      role_changed: 'system.user.role_changed',
    },
  },
} as const;

// Type helper
export type EventType = 
  | `crm.${string}.${string}`
  | `booking.${string}.${string}`
  | `form.${string}.${string}`
  | `accounting.${string}.${string}`
  | `ecommerce.${string}.${string}`
  | `domain.${string}.${string}`
  | `system.${string}.${string}`
  | string;  // Allow custom events

// Event payload interface
export interface AutomationEvent {
  id: string;
  type: EventType;
  siteId: string;
  sourceModule: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  metadata: {
    userId?: string;
    timestamp: string;
    version: string;
  };
}
```

---

## 🎯 Action Types Registry

### Core Actions

```typescript
// src/modules/automation/lib/action-types.ts

/**
 * Action Type Registry
 * 
 * Naming Convention: {category}.{action}
 */

export const ACTION_REGISTRY = {
  // =========================================================
  // CRM ACTIONS
  // =========================================================
  crm: {
    create_contact: {
      id: 'crm.create_contact',
      name: 'Create Contact',
      description: 'Create a new contact in CRM',
      category: 'crm',
      icon: '👤',
      inputs: {
        email: { type: 'string', required: true },
        first_name: { type: 'string', required: false },
        last_name: { type: 'string', required: false },
        phone: { type: 'string', required: false },
        company: { type: 'string', required: false },
        tags: { type: 'array', required: false },
        custom_fields: { type: 'object', required: false },
      },
      outputs: {
        contact_id: { type: 'string' },
        contact: { type: 'object' },
      },
    },
    update_contact: {
      id: 'crm.update_contact',
      name: 'Update Contact',
      description: 'Update an existing contact',
      category: 'crm',
      icon: '✏️',
      inputs: {
        contact_id: { type: 'string', required: true },
        fields: { type: 'object', required: true },
      },
      outputs: {
        contact: { type: 'object' },
      },
    },
    add_tag: {
      id: 'crm.add_tag',
      name: 'Add Tag to Contact',
      description: 'Add a tag to a contact',
      category: 'crm',
      icon: '🏷️',
      inputs: {
        contact_id: { type: 'string', required: true },
        tag: { type: 'string', required: true },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
    create_deal: {
      id: 'crm.create_deal',
      name: 'Create Deal',
      description: 'Create a new deal/opportunity',
      category: 'crm',
      icon: '💰',
      inputs: {
        title: { type: 'string', required: true },
        value: { type: 'number', required: false },
        contact_id: { type: 'string', required: false },
        company_id: { type: 'string', required: false },
        stage: { type: 'string', required: false },
      },
      outputs: {
        deal_id: { type: 'string' },
        deal: { type: 'object' },
      },
    },
    move_deal_stage: {
      id: 'crm.move_deal_stage',
      name: 'Move Deal Stage',
      description: 'Move a deal to a different pipeline stage',
      category: 'crm',
      icon: '➡️',
      inputs: {
        deal_id: { type: 'string', required: true },
        stage: { type: 'string', required: true },
      },
      outputs: {
        deal: { type: 'object' },
      },
    },
    create_task: {
      id: 'crm.create_task',
      name: 'Create Task',
      description: 'Create a follow-up task',
      category: 'crm',
      icon: '✅',
      inputs: {
        title: { type: 'string', required: true },
        description: { type: 'string', required: false },
        due_date: { type: 'date', required: false },
        assigned_to: { type: 'string', required: false },
        contact_id: { type: 'string', required: false },
        deal_id: { type: 'string', required: false },
      },
      outputs: {
        task_id: { type: 'string' },
      },
    },
    log_activity: {
      id: 'crm.log_activity',
      name: 'Log Activity',
      description: 'Log an activity (call, meeting, note)',
      category: 'crm',
      icon: '📝',
      inputs: {
        contact_id: { type: 'string', required: true },
        type: { type: 'enum', values: ['call', 'meeting', 'note', 'email'], required: true },
        description: { type: 'string', required: true },
      },
      outputs: {
        activity_id: { type: 'string' },
      },
    },
  },
  
  // =========================================================
  // EMAIL ACTIONS
  // =========================================================
  email: {
    send: {
      id: 'email.send',
      name: 'Send Email',
      description: 'Send an email using platform email service',
      category: 'email',
      icon: '📧',
      inputs: {
        to: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        body: { type: 'string', required: true },  // HTML supported
        from_name: { type: 'string', required: false },
        reply_to: { type: 'string', required: false },
        cc: { type: 'array', required: false },
        bcc: { type: 'array', required: false },
        attachments: { type: 'array', required: false },
      },
      outputs: {
        message_id: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    send_template: {
      id: 'email.send_template',
      name: 'Send Template Email',
      description: 'Send email using a predefined template',
      category: 'email',
      icon: '📨',
      inputs: {
        to: { type: 'string', required: true },
        template_id: { type: 'string', required: true },
        variables: { type: 'object', required: false },
      },
      outputs: {
        message_id: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  },
  
  // =========================================================
  // NOTIFICATION ACTIONS
  // =========================================================
  notification: {
    send_sms: {
      id: 'notification.send_sms',
      name: 'Send SMS',
      description: 'Send SMS via Twilio',
      category: 'notification',
      icon: '📱',
      requires_connection: 'twilio',
      inputs: {
        to: { type: 'string', required: true },
        body: { type: 'string', required: true },
      },
      outputs: {
        message_sid: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    send_slack: {
      id: 'notification.send_slack',
      name: 'Send Slack Message',
      description: 'Send message to Slack channel',
      category: 'notification',
      icon: '💬',
      requires_connection: 'slack',
      inputs: {
        channel: { type: 'string', required: true },
        message: { type: 'string', required: true },
        blocks: { type: 'array', required: false },  // Slack Block Kit
      },
      outputs: {
        ts: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    send_discord: {
      id: 'notification.send_discord',
      name: 'Send Discord Message',
      description: 'Send message to Discord webhook',
      category: 'notification',
      icon: '🎮',
      requires_connection: 'discord',
      inputs: {
        content: { type: 'string', required: true },
        embeds: { type: 'array', required: false },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
    push_notification: {
      id: 'notification.push',
      name: 'Send Push Notification',
      description: 'Send push notification to user',
      category: 'notification',
      icon: '🔔',
      inputs: {
        user_id: { type: 'string', required: true },
        title: { type: 'string', required: true },
        body: { type: 'string', required: true },
        url: { type: 'string', required: false },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
    in_app: {
      id: 'notification.in_app',
      name: 'Create In-App Notification',
      description: 'Create notification in platform',
      category: 'notification',
      icon: '🔔',
      inputs: {
        user_id: { type: 'string', required: true },
        title: { type: 'string', required: true },
        message: { type: 'string', required: true },
        type: { type: 'enum', values: ['info', 'success', 'warning', 'error'], required: false },
        link: { type: 'string', required: false },
      },
      outputs: {
        notification_id: { type: 'string' },
      },
    },
  },
  
  // =========================================================
  // WEBHOOK ACTIONS
  // =========================================================
  webhook: {
    send: {
      id: 'webhook.send',
      name: 'Send Webhook',
      description: 'Send HTTP request to external URL',
      category: 'webhook',
      icon: '🌐',
      inputs: {
        url: { type: 'string', required: true },
        method: { type: 'enum', values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], required: true },
        headers: { type: 'object', required: false },
        body: { type: 'object', required: false },
        timeout_ms: { type: 'number', required: false, default: 30000 },
      },
      outputs: {
        status_code: { type: 'number' },
        response_body: { type: 'object' },
        success: { type: 'boolean' },
      },
    },
  },
  
  // =========================================================
  // DATA ACTIONS
  // =========================================================
  data: {
    lookup: {
      id: 'data.lookup',
      name: 'Lookup Record',
      description: 'Find a record by field value',
      category: 'data',
      icon: '🔍',
      inputs: {
        module: { type: 'string', required: true },
        table: { type: 'string', required: true },
        field: { type: 'string', required: true },
        value: { type: 'any', required: true },
      },
      outputs: {
        record: { type: 'object' },
        found: { type: 'boolean' },
      },
    },
    create: {
      id: 'data.create',
      name: 'Create Record',
      description: 'Create a new database record',
      category: 'data',
      icon: '➕',
      inputs: {
        module: { type: 'string', required: true },
        table: { type: 'string', required: true },
        data: { type: 'object', required: true },
      },
      outputs: {
        record: { type: 'object' },
        id: { type: 'string' },
      },
    },
    update: {
      id: 'data.update',
      name: 'Update Record',
      description: 'Update an existing record',
      category: 'data',
      icon: '✏️',
      inputs: {
        module: { type: 'string', required: true },
        table: { type: 'string', required: true },
        id: { type: 'string', required: true },
        data: { type: 'object', required: true },
      },
      outputs: {
        record: { type: 'object' },
        success: { type: 'boolean' },
      },
    },
    delete: {
      id: 'data.delete',
      name: 'Delete Record',
      description: 'Delete a database record',
      category: 'data',
      icon: '🗑️',
      inputs: {
        module: { type: 'string', required: true },
        table: { type: 'string', required: true },
        id: { type: 'string', required: true },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
  },
  
  // =========================================================
  // DOMAIN ACTIONS (DM Module Integration)
  // =========================================================
  domain: {
    check_availability: {
      id: 'domain.check_availability',
      name: 'Check Domain Availability',
      description: 'Check if a domain is available for registration',
      category: 'domain',
      icon: '🔍',
      inputs: {
        domain_name: { type: 'string', required: true },
        tlds: { type: 'array', required: false },  // ['.com', '.net']
      },
      outputs: {
        available: { type: 'boolean' },
        suggestions: { type: 'array' },
        prices: { type: 'object' },
      },
    },
    register: {
      id: 'domain.register',
      name: 'Register Domain',
      description: 'Register a new domain',
      category: 'domain',
      icon: '🌐',
      inputs: {
        domain_name: { type: 'string', required: true },
        years: { type: 'number', required: true, default: 1 },
        client_id: { type: 'string', required: false },
        privacy: { type: 'boolean', required: false, default: true },
        auto_renew: { type: 'boolean', required: false, default: true },
      },
      outputs: {
        domain_id: { type: 'string' },
        order_id: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    renew: {
      id: 'domain.renew',
      name: 'Renew Domain',
      description: 'Renew an existing domain',
      category: 'domain',
      icon: '🔄',
      inputs: {
        domain_id: { type: 'string', required: true },
        years: { type: 'number', required: true, default: 1 },
      },
      outputs: {
        order_id: { type: 'string' },
        new_expiry: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    set_auto_renew: {
      id: 'domain.set_auto_renew',
      name: 'Set Auto-Renew',
      description: 'Enable or disable domain auto-renewal',
      category: 'domain',
      icon: '⚙️',
      inputs: {
        domain_id: { type: 'string', required: true },
        enabled: { type: 'boolean', required: true },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
    add_dns_record: {
      id: 'domain.add_dns_record',
      name: 'Add DNS Record',
      description: 'Add a DNS record to a domain',
      category: 'domain',
      icon: '📝',
      inputs: {
        domain_id: { type: 'string', required: true },
        type: { type: 'enum', values: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'], required: true },
        name: { type: 'string', required: true },
        content: { type: 'string', required: true },
        ttl: { type: 'number', required: false, default: 3600 },
        priority: { type: 'number', required: false },  // For MX records
      },
      outputs: {
        record_id: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    delete_dns_record: {
      id: 'domain.delete_dns_record',
      name: 'Delete DNS Record',
      description: 'Remove a DNS record from a domain',
      category: 'domain',
      icon: '🗑️',
      inputs: {
        domain_id: { type: 'string', required: true },
        record_id: { type: 'string', required: true },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
    create_email_account: {
      id: 'domain.create_email_account',
      name: 'Create Email Account',
      description: 'Create a new email mailbox on a domain',
      category: 'domain',
      icon: '📧',
      inputs: {
        domain_id: { type: 'string', required: true },
        username: { type: 'string', required: true },  // local part before @
        display_name: { type: 'string', required: false },
        mailbox_size_gb: { type: 'number', required: false, default: 10 },
      },
      outputs: {
        email_address: { type: 'string' },
        account_id: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    delete_email_account: {
      id: 'domain.delete_email_account',
      name: 'Delete Email Account',
      description: 'Delete an email mailbox',
      category: 'domain',
      icon: '🗑️',
      inputs: {
        account_id: { type: 'string', required: true },
      },
      outputs: {
        success: { type: 'boolean' },
      },
    },
    initiate_transfer: {
      id: 'domain.initiate_transfer',
      name: 'Initiate Domain Transfer',
      description: 'Start transferring a domain to the platform',
      category: 'domain',
      icon: '↔️',
      inputs: {
        domain_name: { type: 'string', required: true },
        auth_code: { type: 'string', required: true },
      },
      outputs: {
        transfer_id: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    get_auth_code: {
      id: 'domain.get_auth_code',
      name: 'Get Transfer Auth Code',
      description: 'Get auth/EPP code for domain transfer out',
      category: 'domain',
      icon: '🔑',
      inputs: {
        domain_id: { type: 'string', required: true },
      },
      outputs: {
        auth_code: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
    lookup: {
      id: 'domain.lookup',
      name: 'Lookup Domain',
      description: 'Get domain details by name',
      category: 'domain',
      icon: '🔎',
      inputs: {
        domain_name: { type: 'string', required: true },
      },
      outputs: {
        domain: { type: 'object' },
        found: { type: 'boolean' },
        expiry_date: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },
  
  // =========================================================
  // FLOW CONTROL
  // =========================================================
  flow: {
    delay: {
      id: 'flow.delay',
      name: 'Delay',
      description: 'Wait for specified duration',
      category: 'flow',
      icon: '⏱️',
      inputs: {
        duration: { type: 'string', required: true },  // e.g., '5m', '1h', '1d'
      },
      outputs: {
        resumed_at: { type: 'string' },
      },
    },
    condition: {
      id: 'flow.condition',
      name: 'Condition',
      description: 'Branch based on condition',
      category: 'flow',
      icon: '🔀',
      inputs: {
        conditions: { type: 'array', required: true },
        // [{ field: 'x', operator: 'equals', value: 'y' }]
      },
      outputs: {
        result: { type: 'boolean' },
        matched_branch: { type: 'string' },
      },
    },
    loop: {
      id: 'flow.loop',
      name: 'Loop',
      description: 'Iterate over array',
      category: 'flow',
      icon: '🔁',
      inputs: {
        items: { type: 'array', required: true },
        max_iterations: { type: 'number', required: false, default: 100 },
      },
      outputs: {
        current_item: { type: 'any' },
        index: { type: 'number' },
        is_last: { type: 'boolean' },
      },
    },
    stop: {
      id: 'flow.stop',
      name: 'Stop Workflow',
      description: 'Stop workflow execution',
      category: 'flow',
      icon: '🛑',
      inputs: {
        reason: { type: 'string', required: false },
      },
      outputs: {},
    },
  },
  
  // =========================================================
  // TRANSFORM ACTIONS
  // =========================================================
  transform: {
    map: {
      id: 'transform.map',
      name: 'Map Data',
      description: 'Transform data structure',
      category: 'transform',
      icon: '🔄',
      inputs: {
        source: { type: 'object', required: true },
        mapping: { type: 'object', required: true },
        // { targetField: '{{source.field}}' }
      },
      outputs: {
        result: { type: 'object' },
      },
    },
    filter: {
      id: 'transform.filter',
      name: 'Filter Array',
      description: 'Filter items from array',
      category: 'transform',
      icon: '🔍',
      inputs: {
        array: { type: 'array', required: true },
        conditions: { type: 'array', required: true },
      },
      outputs: {
        result: { type: 'array' },
        count: { type: 'number' },
      },
    },
    aggregate: {
      id: 'transform.aggregate',
      name: 'Aggregate',
      description: 'Calculate sum, average, count, etc.',
      category: 'transform',
      icon: '📊',
      inputs: {
        array: { type: 'array', required: true },
        operation: { type: 'enum', values: ['sum', 'average', 'count', 'min', 'max'], required: true },
        field: { type: 'string', required: false },
      },
      outputs: {
        result: { type: 'number' },
      },
    },
    format_date: {
      id: 'transform.format_date',
      name: 'Format Date',
      description: 'Format a date string',
      category: 'transform',
      icon: '📅',
      inputs: {
        date: { type: 'string', required: true },
        format: { type: 'string', required: true },  // e.g., 'YYYY-MM-DD'
        timezone: { type: 'string', required: false },
      },
      outputs: {
        formatted: { type: 'string' },
      },
    },
    template: {
      id: 'transform.template',
      name: 'Render Template',
      description: 'Render text template with variables',
      category: 'transform',
      icon: '📝',
      inputs: {
        template: { type: 'string', required: true },
        variables: { type: 'object', required: false },
      },
      outputs: {
        result: { type: 'string' },
      },
    },
  },
} as const;

export type ActionType = keyof typeof ACTION_REGISTRY;
```

---

## 🔧 Core Services Implementation

> ⚠️ **IMPLEMENTATION NOTE**: While this document shows class-based services for clarity,
> the actual implementation should use **Server Actions** pattern as established in the 
> platform. The classes below can be converted to standalone async functions with 
> the `"use server"` directive. See `src/modules/crm/actions/crm-actions.ts` as the 
> reference implementation.
>
> **Example conversion:**
> ```typescript
> // Class-based (as shown in docs)
> class EventListenerService {
>   async processPendingEvents(siteId: string) { ... }
> }
> 
> // Server Actions pattern (preferred implementation)
> 'use server'
> export async function processPendingEvents(siteId: string) { ... }
> ```

### 1. Event Listener Service

```typescript
// src/modules/automation/services/event-listener.ts

/**
 * Event Listener Service
 * 
 * Subscribes to platform events and triggers workflows.
 * Uses the existing module-events.ts infrastructure.
 */

import { createClient } from '@/lib/supabase/server';
import { getPendingEvents, markEventProcessed } from '@/lib/modules/module-events';

export interface EventListenerConfig {
  pollIntervalMs: number;
  batchSize: number;
  maxConcurrentWorkflows: number;
}

const DEFAULT_CONFIG: EventListenerConfig = {
  pollIntervalMs: 1000,    // Poll every 1 second
  batchSize: 100,           // Process 100 events per batch
  maxConcurrentWorkflows: 10,
};

export class EventListenerService {
  private config: EventListenerConfig;
  private isRunning: boolean = false;
  private automationModuleId: string;

  constructor(
    automationModuleId: string,
    config: Partial<EventListenerConfig> = {}
  ) {
    this.automationModuleId = automationModuleId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start listening for events
   */
  async start(siteId: string): Promise<void> {
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.processPendingEvents(siteId);
      } catch (error) {
        console.error('[EventListener] Error processing events:', error);
      }

      // Wait before next poll
      await this.sleep(this.config.pollIntervalMs);
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Process pending events
   */
  private async processPendingEvents(siteId: string): Promise<void> {
    const supabase = await createClient();

    // Get unprocessed events from automation_events_log
    const { data: events, error } = await supabase
      .from('automation_events_log')
      .select('*')
      .eq('site_id', siteId)
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(this.config.batchSize);

    if (error || !events?.length) {
      return;
    }

    // Process each event
    for (const event of events) {
      try {
        await this.handleEvent(siteId, event);
        
        // Mark as processed
        await supabase
          .from('automation_events_log')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', event.id);
      } catch (err) {
        console.error('[EventListener] Error handling event:', event.id, err);
      }
    }
  }

  /**
   * Handle a single event
   */
  private async handleEvent(siteId: string, event: any): Promise<void> {
    const supabase = await createClient();

    // Find workflows subscribed to this event
    const { data: subscriptions } = await supabase
      .from('event_subscriptions')
      .select(`
        *,
        workflow:automation_workflows(*)
      `)
      .eq('site_id', siteId)
      .eq('event_type', event.event_type)
      .eq('is_active', true);

    if (!subscriptions?.length) {
      return;
    }

    // Trigger each subscribed workflow
    for (const sub of subscriptions) {
      if (!sub.workflow?.is_active) continue;

      // Check event filter (if any)
      if (sub.event_filter && Object.keys(sub.event_filter).length > 0) {
        if (!this.matchesFilter(event.payload, sub.event_filter)) {
          continue;
        }
      }

      // Queue workflow execution
      await this.queueWorkflowExecution(
        sub.workflow.id,
        siteId,
        'event',
        event.id,
        event.payload
      );

      // Update subscription stats
      await supabase
        .from('event_subscriptions')
        .update({
          events_received: (sub.events_received || 0) + 1,
          last_event_at: new Date().toISOString(),
        })
        .eq('id', sub.id);
    }

    // Update event with workflows triggered count
    await supabase
      .from('automation_events_log')
      .update({
        workflows_triggered: subscriptions.length,
      })
      .eq('id', event.id);
  }

  /**
   * Queue a workflow execution
   */
  private async queueWorkflowExecution(
    workflowId: string,
    siteId: string,
    triggerType: string,
    triggerEventId: string | null,
    triggerData: Record<string, unknown>
  ): Promise<string> {
    const supabase = await createClient();

    // Count total steps in workflow
    const { count: stepsCount } = await supabase
      .from('workflow_steps')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', workflowId);

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        site_id: siteId,
        status: 'pending',
        trigger_type: triggerType,
        trigger_event_id: triggerEventId,
        trigger_data: triggerData,
        context: { trigger: triggerData },
        steps_total: stepsCount || 0,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Check if payload matches filter conditions
   */
  private matchesFilter(
    payload: Record<string, unknown>,
    filter: Record<string, unknown>
  ): boolean {
    for (const [key, expected] of Object.entries(filter)) {
      const actual = this.getNestedValue(payload, key);
      
      if (typeof expected === 'object' && expected !== null) {
        // Handle operators: { $eq: value }, { $contains: value }, etc.
        const op = Object.keys(expected)[0];
        const opValue = (expected as Record<string, unknown>)[op];
        
        switch (op) {
          case '$eq':
            if (actual !== opValue) return false;
            break;
          case '$ne':
            if (actual === opValue) return false;
            break;
          case '$gt':
            if (!(actual > (opValue as number))) return false;
            break;
          case '$gte':
            if (!(actual >= (opValue as number))) return false;
            break;
          case '$lt':
            if (!(actual < (opValue as number))) return false;
            break;
          case '$lte':
            if (!(actual <= (opValue as number))) return false;
            break;
          case '$contains':
            if (typeof actual !== 'string' || !actual.includes(opValue as string)) return false;
            break;
          case '$in':
            if (!Array.isArray(opValue) || !opValue.includes(actual)) return false;
            break;
        }
      } else {
        // Direct equality
        if (actual !== expected) return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Workflow Execution Engine

```typescript
// src/modules/automation/services/execution-engine.ts

/**
 * Workflow Execution Engine
 * 
 * Executes workflows step by step with:
 * - Variable resolution ({{trigger.field}})
 * - Condition evaluation
 * - Error handling and retries
 * - Parallel execution support
 * - Delay/wait support
 */

import { createClient } from '@/lib/supabase/server';
import { ActionExecutor } from './action-executor';

export interface ExecutionContext {
  trigger: Record<string, unknown>;
  steps: Record<string, unknown>;      // Output from each step
  variables: Record<string, unknown>;   // Workflow variables
  execution: {
    id: string;
    workflowId: string;
    siteId: string;
    startedAt: string;
  };
}

export class WorkflowExecutionEngine {
  private actionExecutor: ActionExecutor;

  constructor() {
    this.actionExecutor = new ActionExecutor();
  }

  /**
   * Execute a workflow
   */
  async execute(executionId: string): Promise<void> {
    const supabase = await createClient();

    // Get execution details
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflow:automation_workflows(*)
      `)
      .eq('id', executionId)
      .single();

    if (execError || !execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Check if already completed or cancelled
    if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
      return;
    }

    // Mark as running
    await this.updateExecutionStatus(executionId, 'running', {
      started_at: new Date().toISOString(),
    });

    try {
      // Initialize context
      const context: ExecutionContext = {
        trigger: execution.trigger_data || {},
        steps: {},
        variables: execution.context?.variables || {},
        execution: {
          id: executionId,
          workflowId: execution.workflow_id,
          siteId: execution.site_id,
          startedAt: new Date().toISOString(),
        },
      };

      // Load workflow variables
      const { data: workflowVars } = await supabase
        .from('workflow_variables')
        .select('key, value')
        .eq('workflow_id', execution.workflow_id);

      if (workflowVars) {
        for (const v of workflowVars) {
          context.variables[v.key] = v.value;
        }
      }

      // Get workflow steps
      const { data: steps } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', execution.workflow_id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (!steps?.length) {
        await this.completeExecution(executionId, context, 'completed');
        return;
      }

      // Execute steps
      let currentStepIndex = execution.current_step_index || 0;

      while (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];

        // Update current step
        await supabase
          .from('workflow_executions')
          .update({
            current_step_id: step.id,
            current_step_index: currentStepIndex,
          })
          .eq('id', executionId);

        // Execute step
        const result = await this.executeStep(executionId, step, context);

        if (result.status === 'failed' && step.on_error === 'fail') {
          await this.failExecution(executionId, result.error || 'Step failed');
          return;
        }

        if (result.status === 'paused') {
          // Workflow is paused (waiting for delay or event)
          await this.pauseExecution(executionId, result.resumeAt);
          return;
        }

        // Store step output in context
        if (step.output_key && result.output) {
          context.steps[step.output_key] = result.output;
        }

        // Handle condition branching
        if (step.step_type === 'condition' && result.branchIndex !== undefined) {
          // Find the target step for this branch
          // This is simplified - real implementation needs branch mapping
          currentStepIndex++;
        } else {
          currentStepIndex++;
        }

        // Update execution context
        await supabase
          .from('workflow_executions')
          .update({
            context: { ...context, variables: context.variables },
            steps_completed: currentStepIndex,
          })
          .eq('id', executionId);
      }

      // All steps completed
      await this.completeExecution(executionId, context, 'completed');
    } catch (error) {
      await this.failExecution(
        executionId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    executionId: string,
    step: any,
    context: ExecutionContext
  ): Promise<{
    status: 'completed' | 'failed' | 'paused' | 'skipped';
    output?: unknown;
    error?: string;
    resumeAt?: string;
    branchIndex?: number;
  }> {
    const supabase = await createClient();
    const startTime = Date.now();

    // Create step log
    const { data: stepLog } = await supabase
      .from('step_execution_logs')
      .insert({
        execution_id: executionId,
        step_id: step.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    try {
      // Resolve input data
      const inputData = this.resolveVariables(step.input_mapping || {}, context);

      // Update log with input
      await supabase
        .from('step_execution_logs')
        .update({ input_data: inputData })
        .eq('id', stepLog!.id);

      let result: { status: string; output?: unknown; error?: string; resumeAt?: string; branchIndex?: number };

      // Execute based on step type
      switch (step.step_type) {
        case 'action':
          result = await this.executeAction(step, inputData, context);
          break;

        case 'condition':
          result = await this.evaluateCondition(step, context);
          break;

        case 'delay':
          result = await this.executeDelay(step, context);
          break;

        case 'set_variable':
          result = await this.setVariable(step, inputData, context);
          break;

        case 'transform':
          result = await this.executeTransform(step, inputData, context);
          break;

        case 'stop':
          result = { status: 'completed', output: { stopped: true, reason: step.action_config?.reason } };
          break;

        default:
          result = { status: 'failed', error: `Unknown step type: ${step.step_type}` };
      }

      // Update step log
      const duration = Date.now() - startTime;
      await supabase
        .from('step_execution_logs')
        .update({
          status: result.status,
          output_data: result.output,
          error: result.error,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', stepLog!.id);

      return result as any;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      await supabase
        .from('step_execution_logs')
        .update({
          status: 'failed',
          error: errorMsg,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', stepLog!.id);

      return { status: 'failed', error: errorMsg };
    }
  }

  /**
   * Execute an action step
   */
  private async executeAction(
    step: any,
    inputData: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<{ status: string; output?: unknown; error?: string }> {
    const actionType = step.action_type;
    const config = this.resolveVariables(step.action_config || {}, context);

    return this.actionExecutor.execute(
      actionType,
      { ...inputData, ...config },
      context
    );
  }

  /**
   * Evaluate a condition
   */
  private async evaluateCondition(
    step: any,
    context: ExecutionContext
  ): Promise<{ status: string; output?: unknown; branchIndex?: number }> {
    const config = step.condition_config;
    const conditions = config?.conditions || [];
    const operator = config?.operator || 'and';

    let results: boolean[] = [];

    for (const cond of conditions) {
      const field = this.resolveVariables(cond.field, context);
      const value = this.resolveVariables(cond.value, context);
      const result = this.evaluateOperator(field, cond.operator, value);
      results.push(result);
    }

    const passed = operator === 'and'
      ? results.every(r => r)
      : results.some(r => r);

    return {
      status: 'completed',
      output: { passed, results },
      branchIndex: passed ? 0 : 1,  // 0 = true branch, 1 = false branch
    };
  }

  /**
   * Execute a delay step
   */
  private async executeDelay(
    step: any,
    context: ExecutionContext
  ): Promise<{ status: string; output?: unknown; resumeAt?: string }> {
    const config = step.delay_config;
    const delayType = config?.type || 'fixed';
    
    let resumeAt: Date;

    switch (delayType) {
      case 'fixed':
        const duration = this.parseDuration(config.value || '5m');
        resumeAt = new Date(Date.now() + duration);
        break;

      case 'until':
        resumeAt = new Date(this.resolveVariables(config.value, context) as string);
        break;

      default:
        resumeAt = new Date(Date.now() + 5 * 60 * 1000);  // Default 5 minutes
    }

    return {
      status: 'paused',
      output: { delayUntil: resumeAt.toISOString() },
      resumeAt: resumeAt.toISOString(),
    };
  }

  /**
   * Set a workflow variable
   */
  private async setVariable(
    step: any,
    inputData: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<{ status: string; output?: unknown }> {
    const key = step.action_config?.key;
    const value = this.resolveVariables(step.action_config?.value, context);

    if (key) {
      context.variables[key] = value;
    }

    return {
      status: 'completed',
      output: { [key]: value },
    };
  }

  /**
   * Execute a transform step
   */
  private async executeTransform(
    step: any,
    inputData: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<{ status: string; output?: unknown }> {
    const config = step.action_config || {};
    const mapping = config.mapping || {};

    const result: Record<string, unknown> = {};

    for (const [targetKey, sourceExpr] of Object.entries(mapping)) {
      result[targetKey] = this.resolveVariables(sourceExpr as string, context);
    }

    return {
      status: 'completed',
      output: result,
    };
  }

  /**
   * Resolve variables in a value ({{trigger.field}} syntax)
   */
  private resolveVariables(value: unknown, context: ExecutionContext): unknown {
    if (typeof value !== 'string') {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.map(v => this.resolveVariables(v, context));
        }
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          result[k] = this.resolveVariables(v, context);
        }
        return result;
      }
      return value;
    }

    // Match {{path.to.value}}
    return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const resolved = this.getValueByPath(context, path.trim());
      if (resolved === undefined) return match;
      if (typeof resolved === 'object') return JSON.stringify(resolved);
      return String(resolved);
    });
  }

  /**
   * Get value by dot-notation path
   */
  private getValueByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Evaluate condition operator
   */
  private evaluateOperator(left: unknown, operator: string, right: unknown): boolean {
    switch (operator) {
      case 'equals':
      case 'eq':
        return left === right;
      case 'not_equals':
      case 'ne':
        return left !== right;
      case 'contains':
        return typeof left === 'string' && left.includes(String(right));
      case 'not_contains':
        return typeof left === 'string' && !left.includes(String(right));
      case 'starts_with':
        return typeof left === 'string' && left.startsWith(String(right));
      case 'ends_with':
        return typeof left === 'string' && left.endsWith(String(right));
      case 'greater_than':
      case 'gt':
        return Number(left) > Number(right);
      case 'greater_than_or_equals':
      case 'gte':
        return Number(left) >= Number(right);
      case 'less_than':
      case 'lt':
        return Number(left) < Number(right);
      case 'less_than_or_equals':
      case 'lte':
        return Number(left) <= Number(right);
      case 'is_empty':
        return left === null || left === undefined || left === '' || 
               (Array.isArray(left) && left.length === 0);
      case 'is_not_empty':
        return left !== null && left !== undefined && left !== '' && 
               (!Array.isArray(left) || left.length > 0);
      case 'in':
        return Array.isArray(right) && right.includes(left);
      case 'not_in':
        return Array.isArray(right) && !right.includes(left);
      default:
        return false;
    }
  }

  /**
   * Parse duration string (5m, 1h, 1d)
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 5 * 60 * 1000; // Default 5 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 5 * 60 * 1000;
    }
  }

  // Helper methods for status updates
  private async updateExecutionStatus(
    executionId: string,
    status: string,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from('workflow_executions')
      .update({ status, ...extra })
      .eq('id', executionId);
  }

  private async pauseExecution(executionId: string, resumeAt?: string): Promise<void> {
    await this.updateExecutionStatus(executionId, 'paused', {
      paused_at: new Date().toISOString(),
      resume_at: resumeAt,
    });
  }

  private async completeExecution(
    executionId: string,
    context: ExecutionContext,
    status: 'completed' | 'failed'
  ): Promise<void> {
    const supabase = await createClient();
    const duration = Date.now() - new Date(context.execution.startedAt).getTime();

    await supabase
      .from('workflow_executions')
      .update({
        status,
        completed_at: new Date().toISOString(),
        output: context.steps,
        duration_ms: duration,
      })
      .eq('id', executionId);

    // Update workflow stats
    await supabase.rpc('update_workflow_stats', {
      p_workflow_id: context.execution.workflowId,
      p_success: status === 'completed',
      p_error: null,
    });
  }

  private async failExecution(executionId: string, error: string): Promise<void> {
    const supabase = await createClient();

    const { data: execution } = await supabase
      .from('workflow_executions')
      .select('workflow_id, started_at')
      .eq('id', executionId)
      .single();

    const duration = execution?.started_at
      ? Date.now() - new Date(execution.started_at).getTime()
      : 0;

    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error,
        duration_ms: duration,
      })
      .eq('id', executionId);

    // Update workflow stats
    if (execution) {
      await supabase.rpc('update_workflow_stats', {
        p_workflow_id: execution.workflow_id,
        p_success: false,
        p_error: error,
      });
    }
  }
}
```

### 3. Action Executor

```typescript
// src/modules/automation/services/action-executor.ts

/**
 * Action Executor
 * 
 * Executes individual actions within workflows.
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send-email';
import type { ExecutionContext } from './execution-engine';

export interface ActionResult {
  status: 'completed' | 'failed';
  output?: unknown;
  error?: string;
}

export class ActionExecutor {
  /**
   * Execute an action
   */
  async execute(
    actionType: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const [category, action] = actionType.split('.');

    switch (category) {
      case 'crm':
        return this.executeCrmAction(action, config, context);
      case 'email':
        return this.executeEmailAction(action, config, context);
      case 'notification':
        return this.executeNotificationAction(action, config, context);
      case 'webhook':
        return this.executeWebhookAction(action, config, context);
      case 'data':
        return this.executeDataAction(action, config, context);
      case 'transform':
        return this.executeTransformAction(action, config, context);
      default:
        return { status: 'failed', error: `Unknown action category: ${category}` };
    }
  }

  // =========================================================
  // CRM ACTIONS
  // =========================================================

  private async executeCrmAction(
    action: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const supabase = await createClient();
    const siteId = context.execution.siteId;

    switch (action) {
      case 'create_contact': {
        const { data, error } = await supabase
          .from(`mod_crmmod01_contacts`)  // Uses module-prefixed table per EM-05
          .insert({
            site_id: siteId,
            email: config.email,
            first_name: config.first_name,
            last_name: config.last_name,
            phone: config.phone,
            company: config.company,
            tags: config.tags || [],
            custom_fields: config.custom_fields || {},
          })
          .select('id, *')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { contact_id: data.id, contact: data } };
      }

      case 'update_contact': {
        const { data, error } = await supabase
          .from(`mod_crmmod01_contacts`)
          .update(config.fields as Record<string, unknown>)
          .eq('id', config.contact_id)
          .eq('site_id', siteId)
          .select('*')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { contact: data } };
      }

      case 'add_tag': {
        const { data: contact, error: fetchError } = await supabase
          .from(`mod_crmmod01_contacts`)
          .select('tags')
          .eq('id', config.contact_id)
          .eq('site_id', siteId)
          .single();

        if (fetchError) {
          return { status: 'failed', error: fetchError.message };
        }

        const tags = [...(contact.tags || []), config.tag].filter(
          (v, i, a) => a.indexOf(v) === i
        );

        const { error } = await supabase
          .from(`mod_crmmod01_contacts`)
          .update({ tags })
          .eq('id', config.contact_id);

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { success: true, tags } };
      }

      case 'create_deal': {
        const { data, error } = await supabase
          .from(`mod_crmmod01_deals`)  // Uses module-prefixed table per EM-05
          .insert({
            site_id: siteId,
            title: config.title,
            value: config.value || 0,
            contact_id: config.contact_id,
            company_id: config.company_id,
            stage: config.stage || 'new',
          })
          .select('id, *')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { deal_id: data.id, deal: data } };
      }

      case 'move_deal_stage': {
        const { data, error } = await supabase
          .from(`mod_crmmod01_deals`)  // Uses module-prefixed table per EM-05
          .update({ stage: config.stage })
          .eq('id', config.deal_id)
          .eq('site_id', siteId)
          .select('*')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { deal: data } };
      }

      case 'create_task': {
        const { data, error } = await supabase
          .from(`mod_crmmod01_tasks`)  // Uses module-prefixed table per EM-05
          .insert({
            site_id: siteId,
            title: config.title,
            description: config.description,
            due_date: config.due_date,
            assigned_to: config.assigned_to,
            contact_id: config.contact_id,
            deal_id: config.deal_id,
          })
          .select('id')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { task_id: data.id } };
      }

      case 'log_activity': {
        const { data, error } = await supabase
          .from(`mod_crmmod01_activities`)  // Uses module-prefixed table per EM-05
          .insert({
            site_id: siteId,
            contact_id: config.contact_id,
            type: config.type,
            description: config.description,
          })
          .select('id')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { activity_id: data.id } };
      }

      default:
        return { status: 'failed', error: `Unknown CRM action: ${action}` };
    }
  }

  // =========================================================
  // EMAIL ACTIONS
  // =========================================================

  private async executeEmailAction(
    action: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    switch (action) {
      case 'send': {
        try {
          const result = await sendEmail({
            to: { email: config.to as string, name: config.to_name as string },
            type: 'custom',
            data: {
              subject: config.subject,
              body: config.body,
              from_name: config.from_name,
            },
          });

          if (!result.success) {
            return { status: 'failed', error: result.error };
          }
          return { status: 'completed', output: { success: true, message_id: result.messageId } };
        } catch (error) {
          return { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Failed to send email' 
          };
        }
      }

      case 'send_template': {
        try {
          const result = await sendEmail({
            to: { email: config.to as string },
            type: config.template_id as string,
            data: config.variables as Record<string, unknown>,
          });

          if (!result.success) {
            return { status: 'failed', error: result.error };
          }
          return { status: 'completed', output: { success: true, message_id: result.messageId } };
        } catch (error) {
          return { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Failed to send template email' 
          };
        }
      }

      default:
        return { status: 'failed', error: `Unknown email action: ${action}` };
    }
  }

  // =========================================================
  // NOTIFICATION ACTIONS
  // =========================================================

  private async executeNotificationAction(
    action: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    switch (action) {
      case 'in_app': {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: config.user_id,
            title: config.title,
            message: config.message,
            type: config.type || 'info',
            link: config.link,
          })
          .select('id')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { notification_id: data.id } };
      }

      case 'send_slack': {
        // Get connection
        const supabase = await createClient();
        const { data: connection } = await supabase
          .from('automation_connections')
          .select('credentials')
          .eq('site_id', context.execution.siteId)
          .eq('service_type', 'slack')
          .eq('status', 'active')
          .single();

        if (!connection) {
          return { status: 'failed', error: 'Slack connection not found' };
        }

        // Send to Slack webhook
        try {
          const response = await fetch(connection.credentials.webhook_url as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel: config.channel,
              text: config.message,
              blocks: config.blocks,
            }),
          });

          if (!response.ok) {
            return { status: 'failed', error: `Slack API error: ${response.status}` };
          }
          return { status: 'completed', output: { success: true } };
        } catch (error) {
          return { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Failed to send Slack message' 
          };
        }
      }

      case 'send_discord': {
        const supabase = await createClient();
        const { data: connection } = await supabase
          .from('automation_connections')
          .select('credentials')
          .eq('site_id', context.execution.siteId)
          .eq('service_type', 'discord')
          .eq('status', 'active')
          .single();

        if (!connection) {
          return { status: 'failed', error: 'Discord connection not found' };
        }

        try {
          const response = await fetch(connection.credentials.webhook_url as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: config.content,
              embeds: config.embeds,
            }),
          });

          if (!response.ok) {
            return { status: 'failed', error: `Discord API error: ${response.status}` };
          }
          return { status: 'completed', output: { success: true } };
        } catch (error) {
          return { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Failed to send Discord message' 
          };
        }
      }

      default:
        return { status: 'failed', error: `Unknown notification action: ${action}` };
    }
  }

  // =========================================================
  // WEBHOOK ACTIONS
  // =========================================================

  private async executeWebhookAction(
    action: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    switch (action) {
      case 'send': {
        const url = config.url as string;
        const method = (config.method as string) || 'POST';
        const headers = (config.headers as Record<string, string>) || {};
        const body = config.body;
        const timeout = (config.timeout_ms as number) || 30000;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          let responseBody: unknown;
          try {
            responseBody = await response.json();
          } catch {
            responseBody = await response.text();
          }

          return {
            status: response.ok ? 'completed' : 'failed',
            output: {
              status_code: response.status,
              response_body: responseBody,
              success: response.ok,
            },
            error: response.ok ? undefined : `HTTP ${response.status}`,
          };
        } catch (error) {
          return { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Webhook request failed' 
          };
        }
      }

      default:
        return { status: 'failed', error: `Unknown webhook action: ${action}` };
    }
  }

  // =========================================================
  // DATA ACTIONS
  // =========================================================

  private async executeDataAction(
    action: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const supabase = await createClient();
    const siteId = context.execution.siteId;
    const table = config.table as string;

    switch (action) {
      case 'lookup': {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('site_id', siteId)
          .eq(config.field as string, config.value)
          .maybeSingle();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { record: data, found: !!data } };
      }

      case 'create': {
        const { data, error } = await supabase
          .from(table)
          .insert({ site_id: siteId, ...(config.data as Record<string, unknown>) })
          .select('*')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { record: data, id: data.id } };
      }

      case 'update': {
        const { data, error } = await supabase
          .from(table)
          .update(config.data as Record<string, unknown>)
          .eq('id', config.id)
          .eq('site_id', siteId)
          .select('*')
          .single();

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { record: data, success: true } };
      }

      case 'delete': {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', config.id)
          .eq('site_id', siteId);

        if (error) {
          return { status: 'failed', error: error.message };
        }
        return { status: 'completed', output: { success: true } };
      }

      default:
        return { status: 'failed', error: `Unknown data action: ${action}` };
    }
  }

  // =========================================================
  // TRANSFORM ACTIONS
  // =========================================================

  private async executeTransformAction(
    action: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    switch (action) {
      case 'map': {
        const source = config.source as Record<string, unknown>;
        const mapping = config.mapping as Record<string, string>;
        const result: Record<string, unknown> = {};

        for (const [targetKey, sourceExpr] of Object.entries(mapping)) {
          result[targetKey] = this.getValueByPath(source, sourceExpr);
        }

        return { status: 'completed', output: { result } };
      }

      case 'filter': {
        const array = config.array as unknown[];
        const conditions = config.conditions as Array<{ field: string; operator: string; value: unknown }>;

        const filtered = array.filter(item => {
          return conditions.every(cond => {
            const value = this.getValueByPath(item as Record<string, unknown>, cond.field);
            return this.evaluateCondition(value, cond.operator, cond.value);
          });
        });

        return { status: 'completed', output: { result: filtered, count: filtered.length } };
      }

      case 'aggregate': {
        const array = config.array as unknown[];
        const operation = config.operation as string;
        const field = config.field as string | undefined;

        const values = field
          ? array.map(item => Number(this.getValueByPath(item as Record<string, unknown>, field)))
          : array.map(Number);

        let result: number;
        switch (operation) {
          case 'sum':
            result = values.reduce((a, b) => a + b, 0);
            break;
          case 'average':
            result = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'count':
            result = values.length;
            break;
          case 'min':
            result = Math.min(...values);
            break;
          case 'max':
            result = Math.max(...values);
            break;
          default:
            result = 0;
        }

        return { status: 'completed', output: { result } };
      }

      default:
        return { status: 'failed', error: `Unknown transform action: ${action}` };
    }
  }

  private getValueByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private evaluateCondition(left: unknown, operator: string, right: unknown): boolean {
    switch (operator) {
      case 'equals':
        return left === right;
      case 'not_equals':
        return left !== right;
      case 'contains':
        return typeof left === 'string' && left.includes(String(right));
      case 'greater_than':
        return Number(left) > Number(right);
      case 'less_than':
        return Number(left) < Number(right);
      default:
        return false;
    }
  }
}
```

---

## 🔧 Server Actions

```typescript
// src/modules/automation/actions/workflow-actions.ts

"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WorkflowExecutionEngine } from '../services/execution-engine';

// =========================================================
// WORKFLOW CRUD
// =========================================================

export async function createWorkflow(
  siteId: string,
  data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    category?: string;
    tags?: string[];
  }
) {
  const supabase = await createClient();

  // Generate slug
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: workflow, error } = await supabase
    .from('automation_workflows')
    .insert({
      site_id: siteId,
      name: data.name,
      description: data.description,
      slug,
      trigger_type: data.trigger_type,
      trigger_config: data.trigger_config,
      category: data.category || 'general',
      tags: data.tags || [],
    })
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Create event subscription if trigger type is event
  if (data.trigger_type === 'event' && data.trigger_config.event_type) {
    await supabase.from('event_subscriptions').insert({
      site_id: siteId,
      workflow_id: workflow.id,
      event_type: data.trigger_config.event_type as string,
      source_module: data.trigger_config.source_module as string,
      event_filter: data.trigger_config.filter as Record<string, unknown>,
    });
  }

  revalidatePath('/dashboard/automation');
  return { success: true, workflow };
}

export async function updateWorkflow(
  workflowId: string,
  data: Partial<{
    name: string;
    description: string;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    is_active: boolean;
    category: string;
    tags: string[];
    timeout_seconds: number;
    max_retries: number;
  }>
) {
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from('automation_workflows')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation');
  return { success: true, workflow };
}

export async function deleteWorkflow(workflowId: string) {
  const supabase = await createClient();

  // Delete will cascade to steps, executions, subscriptions
  const { error } = await supabase
    .from('automation_workflows')
    .delete()
    .eq('id', workflowId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation');
  return { success: true };
}

export async function duplicateWorkflow(workflowId: string, newName: string) {
  const supabase = await createClient();

  // Get original workflow with steps
  const { data: original, error: fetchError } = await supabase
    .from('automation_workflows')
    .select(`
      *,
      steps:workflow_steps(*)
    `)
    .eq('id', workflowId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: 'Workflow not found' };
  }

  // Create new workflow
  const slug = newName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: newWorkflow, error: createError } = await supabase
    .from('automation_workflows')
    .insert({
      site_id: original.site_id,
      name: newName,
      description: original.description,
      slug,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config,
      category: original.category,
      tags: original.tags,
      timeout_seconds: original.timeout_seconds,
      max_retries: original.max_retries,
      is_active: false, // Start inactive
    })
    .select('*')
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  // Copy steps
  if (original.steps?.length > 0) {
    const newSteps = original.steps.map((step: any) => ({
      workflow_id: newWorkflow.id,
      position: step.position,
      step_type: step.step_type,
      action_type: step.action_type,
      action_config: step.action_config,
      condition_config: step.condition_config,
      delay_config: step.delay_config,
      input_mapping: step.input_mapping,
      output_key: step.output_key,
      on_error: step.on_error,
      max_retries: step.max_retries,
      name: step.name,
      description: step.description,
    }));

    await supabase.from('workflow_steps').insert(newSteps);
  }

  revalidatePath('/dashboard/automation');
  return { success: true, workflow: newWorkflow };
}

// =========================================================
// WORKFLOW STEPS
// =========================================================

export async function addWorkflowStep(
  workflowId: string,
  data: {
    step_type: string;
    action_type?: string;
    action_config?: Record<string, unknown>;
    condition_config?: Record<string, unknown>;
    delay_config?: Record<string, unknown>;
    input_mapping?: Record<string, unknown>;
    output_key?: string;
    name?: string;
    description?: string;
    on_error?: string;
  }
) {
  const supabase = await createClient();

  // Get next position
  const { data: lastStep } = await supabase
    .from('workflow_steps')
    .select('position')
    .eq('workflow_id', workflowId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (lastStep?.position || 0) + 1;

  const { data: step, error } = await supabase
    .from('workflow_steps')
    .insert({
      workflow_id: workflowId,
      position,
      ...data,
    })
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation');
  return { success: true, step };
}

export async function updateWorkflowStep(
  stepId: string,
  data: Partial<{
    step_type: string;
    action_type: string;
    action_config: Record<string, unknown>;
    condition_config: Record<string, unknown>;
    delay_config: Record<string, unknown>;
    input_mapping: Record<string, unknown>;
    output_key: string;
    name: string;
    description: string;
    on_error: string;
    is_active: boolean;
  }>
) {
  const supabase = await createClient();

  const { data: step, error } = await supabase
    .from('workflow_steps')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation');
  return { success: true, step };
}

export async function deleteWorkflowStep(stepId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflow_steps')
    .delete()
    .eq('id', stepId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation');
  return { success: true };
}

export async function reorderWorkflowSteps(
  workflowId: string,
  stepOrder: string[] // Array of step IDs in new order
) {
  const supabase = await createClient();

  // Update positions
  const updates = stepOrder.map((stepId, index) => ({
    id: stepId,
    position: index + 1,
  }));

  for (const update of updates) {
    await supabase
      .from('workflow_steps')
      .update({ position: update.position })
      .eq('id', update.id);
  }

  revalidatePath('/dashboard/automation');
  return { success: true };
}

// =========================================================
// WORKFLOW EXECUTION
// =========================================================

export async function triggerWorkflow(
  workflowId: string,
  siteId: string,
  triggerData: Record<string, unknown> = {}
) {
  const supabase = await createClient();

  // Get workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('automation_workflows')
    .select('*, steps:workflow_steps(count)')
    .eq('id', workflowId)
    .single();

  if (workflowError || !workflow) {
    return { success: false, error: 'Workflow not found' };
  }

  if (!workflow.is_active) {
    return { success: false, error: 'Workflow is not active' };
  }

  // Create execution
  const { data: execution, error: execError } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflowId,
      site_id: siteId,
      status: 'pending',
      trigger_type: 'manual',
      trigger_data: triggerData,
      context: { trigger: triggerData },
      steps_total: workflow.steps?.[0]?.count || 0,
    })
    .select('id')
    .single();

  if (execError) {
    return { success: false, error: execError.message };
  }

  // Start execution async (don't await)
  const engine = new WorkflowExecutionEngine();
  engine.execute(execution.id).catch(console.error);

  return { success: true, executionId: execution.id };
}

export async function cancelExecution(executionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflow_executions')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId)
    .in('status', ['pending', 'running', 'paused']);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation');
  return { success: true };
}

export async function retryExecution(executionId: string) {
  const supabase = await createClient();

  // Get original execution
  const { data: original, error: fetchError } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: 'Execution not found' };
  }

  // Create new execution
  const { data: execution, error: createError } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: original.workflow_id,
      site_id: original.site_id,
      status: 'pending',
      trigger_type: original.trigger_type,
      trigger_event_id: original.trigger_event_id,
      trigger_data: original.trigger_data,
      context: { trigger: original.trigger_data },
      steps_total: original.steps_total,
      parent_execution_id: executionId,
      attempt_number: original.attempt_number + 1,
    })
    .select('id')
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  // Start execution
  const engine = new WorkflowExecutionEngine();
  engine.execute(execution.id).catch(console.error);

  return { success: true, executionId: execution.id };
}

// =========================================================
// CONNECTIONS
// =========================================================

export async function createConnection(
  siteId: string,
  data: {
    service_type: string;
    name: string;
    description?: string;
    credentials: Record<string, unknown>;
  }
) {
  const supabase = await createClient();

  // TODO: Encrypt credentials before storing

  const { data: connection, error } = await supabase
    .from('automation_connections')
    .insert({
      site_id: siteId,
      service_type: data.service_type,
      name: data.name,
      description: data.description,
      credentials: data.credentials,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation/connections');
  return { success: true, connection };
}

export async function deleteConnection(connectionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('automation_connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/automation/connections');
  return { success: true };
}

export async function testConnection(connectionId: string) {
  const supabase = await createClient();

  const { data: connection, error: fetchError } = await supabase
    .from('automation_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (fetchError || !connection) {
    return { success: false, error: 'Connection not found' };
  }

  // Test based on service type
  try {
    switch (connection.service_type) {
      case 'slack':
        // Try to send a test message or validate webhook
        const response = await fetch(connection.credentials.webhook_url as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'DRAMAC Automation connection test' }),
        });
        if (!response.ok) {
          throw new Error(`Slack returned ${response.status}`);
        }
        break;

      case 'discord':
        const discordResponse = await fetch(connection.credentials.webhook_url as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'DRAMAC Automation connection test' }),
        });
        if (!discordResponse.ok) {
          throw new Error(`Discord returned ${discordResponse.status}`);
        }
        break;

      default:
        // Generic URL test
        if (connection.credentials.url) {
          const genericResponse = await fetch(connection.credentials.url as string, {
            method: 'HEAD',
          });
          if (!genericResponse.ok) {
            throw new Error(`URL returned ${genericResponse.status}`);
          }
        }
    }

    // Update last used
    await supabase
      .from('automation_connections')
      .update({
        last_used_at: new Date().toISOString(),
        status: 'active',
        last_error: null,
      })
      .eq('id', connectionId);

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Connection test failed';

    await supabase
      .from('automation_connections')
      .update({
        status: 'error',
        last_error: errorMsg,
      })
      .eq('id', connectionId);

    return { success: false, error: errorMsg };
  }
}

// =========================================================
// QUERIES
// =========================================================

export async function getWorkflows(siteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('automation_workflows')
    .select(`
      *,
      steps:workflow_steps(count),
      recent_executions:workflow_executions(
        id, status, created_at, duration_ms
      )
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, workflows: data };
}

export async function getWorkflow(workflowId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('automation_workflows')
    .select(`
      *,
      steps:workflow_steps(*),
      subscriptions:event_subscriptions(*)
    `)
    .eq('id', workflowId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Sort steps by position
  if (data.steps) {
    data.steps.sort((a: any, b: any) => a.position - b.position);
  }

  return { success: true, workflow: data };
}

export async function getExecutions(
  workflowId: string,
  options: { limit?: number; status?: string } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from('workflow_executions')
    .select(`
      *,
      step_logs:step_execution_logs(*)
    `)
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, executions: data };
}

export async function getConnections(siteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('automation_connections')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Remove sensitive data from credentials
  const sanitized = data.map((c: any) => ({
    ...c,
    credentials: c.credentials ? { configured: true } : { configured: false },
  }));

  return { success: true, connections: sanitized };
}
```

---

## 📁 File Structure

> **Note**: Follows the established module pattern used by CRM, Booking, and E-Commerce modules.

```
src/modules/automation/
├── actions/
│   └── automation-actions.ts      # Server actions (CRUD, execution)
├── components/
│   ├── workflow-list.tsx          # List of workflows
│   ├── workflow-card.tsx          # Workflow summary card
│   ├── execution-log.tsx          # Execution history table
│   └── connection-card.tsx        # Connection card
├── context/
│   └── automation-context.tsx     # Automation React context
├── hooks/
│   └── use-workflow-builder.ts    # Workflow builder state
├── lib/
│   ├── event-types.ts             # Event type registry
│   └── action-types.ts            # Action type registry
├── services/
│   ├── event-listener.ts          # Event listener service
│   ├── execution-engine.ts        # Workflow execution engine
│   └── action-executor.ts         # Action executor
├── types/
│   └── automation-types.ts        # TypeScript types
├── index.ts                       # Module exports
└── manifest.ts                    # Module manifest (per EM-01)

next-platform-dashboard/migrations/
└── em-57-automation-engine.sql    # Database schema
```

---

## 📊 Pricing Tiers

| Feature | Free | Pro ($29/mo) | Enterprise ($99/mo) |
|---------|------|--------------|---------------------|
| Workflows | 3 | 25 | Unlimited |
| Executions/month | 100 | 5,000 | 50,000 |
| Steps per workflow | 5 | 25 | Unlimited |
| Delay duration | 1 hour max | 7 days | 30 days |
| Connections | 2 | 10 | Unlimited |
| Execution history | 7 days | 30 days | 90 days |
| Webhook endpoints | 1 | 5 | Unlimited |
| Scheduled workflows | ❌ | 5 | Unlimited |
| Conditional branches | ❌ | ✅ | ✅ |
| Parallel execution | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## ✅ Implementation Checklist - Phase A

### Database
- [ ] Create `em-57-automation-engine.sql` migration
- [ ] Run migration on Supabase
- [ ] Verify RLS policies work correctly
- [ ] Test helper functions

### Core Services
- [ ] Implement `event-listener.ts`
- [ ] Implement `execution-engine.ts`
- [ ] Implement `action-executor.ts`
- [ ] Add proper error handling
- [ ] Add logging

### Server Actions
- [ ] Implement workflow CRUD actions
- [ ] Implement step CRUD actions
- [ ] Implement execution actions
- [ ] Implement connection actions
- [ ] Add input validation

### Event Integration
- [ ] Integrate with existing `module-events.ts`
- [ ] Add automation event logging
- [ ] Set up event subscriptions

### Testing
- [ ] Unit tests for execution engine
- [ ] Unit tests for action executor
- [ ] Integration tests for workflows
- [ ] Test event triggering

---

## 📋 Next Steps (Phase B)

Part B (PHASE-EM-57B) will cover:

1. **Visual Workflow Builder UI**
   - Drag-and-drop step builder
   - Visual condition editor
   - Step configuration panels

2. **Advanced Actions**
   - Full CRM action library
   - Booking module actions
   - Accounting module actions
   - AI-powered actions

3. **Workflow Templates**
   - Pre-built templates by industry
   - Template marketplace
   - One-click installation

4. **External Integrations**
   - Twilio SMS
   - Mailchimp
   - Google Sheets
   - Airtable
   - Stripe

5. **Analytics Dashboard**
   - Execution metrics
   - Error tracking
   - Performance insights

---

**End of Phase EM-57A**
