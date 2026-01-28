# Phase EM-58C: AI Agents - Real-World Integration & Polish

> **Continuation of:** PHASE-EM-58A-AI-AGENTS.md, PHASE-EM-58B-AI-AGENTS.md  
> **Focus:** Production Integration, Navigation, API Routes, Event Triggers

---

## 📋 Table of Contents

1. [Phase Overview](#phase-overview)
2. [Prerequisites](#prerequisites)
3. [Implementation Checklist](#implementation-checklist)
4. [Route Structure](#route-structure)
5. [API Routes](#api-routes)
6. [Automation Integration](#automation-integration)
7. [Environment Variables](#environment-variables)
8. [Testing Plan](#testing-plan)
9. [Deployment Checklist](#deployment-checklist)

---

## Phase Overview

### Purpose
Make the AI Agents system (EM-58A/B) production-ready by:
1. Wiring UI to actual Next.js routes
2. Integrating with the automation event system
3. Creating REST API endpoints
4. Setting up production environment variables
5. End-to-end workflow testing

### Dependencies
- ✅ Phase EM-58A: AI Agents Core Infrastructure (complete)
- ✅ Phase EM-58B: AI Agents Templates, UI & Analytics (complete)
- ✅ Phase EM-57: Automation Engine (complete)
- ✅ Event Registry includes AI Agent events

### Deliverables
1. **App Routes** - Next.js pages under `/dashboard/[siteId]/ai-agents/`
2. **API Routes** - RESTful endpoints for CRUD and execution
3. **Event Integration** - AI agents respond to automation triggers
4. **Sidebar Navigation** - AI Agents nav link in dashboard
5. **Environment Setup** - OpenAI/Anthropic API key configuration

---

## Prerequisites

### Completed in Previous Phases

```
EM-58A: Core Infrastructure
├── Database tables (13 tables)
├── Type system (types.ts)
├── LLM providers (OpenAI, Anthropic)
├── Memory system (short-term, long-term, episodic)
├── Tool system (17 built-in tools)
├── Agent executor (ReAct loop)
├── Security & approvals
└── Server actions (CRUD)

EM-58B: UI & Templates
├── 12 pre-built templates
├── Agent Builder UI (10 components)
├── Agent Marketplace
├── Analytics dashboard
├── Usage & Billing dashboard
├── Testing framework
└── AIAgentsPage unified component
```

---

## Implementation Checklist

### 1. App Routes (/dashboard/[siteId]/ai-agents/)
- [ ] `layout.tsx` - Shared layout with navigation
- [ ] `page.tsx` - Main dashboard (My Agents tab)
- [ ] `marketplace/page.tsx` - Browse agent templates
- [ ] `analytics/page.tsx` - Agent performance analytics
- [ ] `testing/page.tsx` - Agent testing interface
- [ ] `usage/page.tsx` - Usage & billing dashboard
- [ ] `[agentId]/page.tsx` - Agent detail/edit view

### 2. API Routes
- [ ] `GET/POST /api/sites/[siteId]/ai-agents` - List/create agents
- [ ] `GET/PUT/DELETE /api/sites/[siteId]/ai-agents/[agentId]` - Agent CRUD
- [ ] `POST /api/sites/[siteId]/ai-agents/[agentId]/execute` - Execute agent
- [ ] `GET /api/sites/[siteId]/ai-agents/[agentId]/executions` - Execution history
- [ ] `POST /api/sites/[siteId]/ai-agents/[agentId]/test` - Run tests
- [ ] `GET/POST /api/sites/[siteId]/ai-agents/approvals` - Approval management

### 3. Sidebar Navigation
- [ ] Add "AI Agents" link in dashboard sidebar
- [ ] Icon: `Bot` or `Brain` from Lucide
- [ ] Path: `/dashboard/[siteId]/ai-agents`
- [ ] Badge: Show pending approvals count

### 4. Automation Integration
- [ ] Create `AgentTriggerHandler` service
- [ ] Register agent triggers with automation workflow
- [ ] Execute agents on matching events
- [ ] Handle async execution results
- [ ] Log all executions for audit

### 5. Environment Variables
- [ ] `OPENAI_API_KEY` - Required for GPT models
- [ ] `ANTHROPIC_API_KEY` - Required for Claude models
- [ ] `AI_AGENT_DEFAULT_MODEL` - Default model (gpt-4o-mini)
- [ ] `AI_AGENT_MAX_TOKENS` - Default max tokens (4096)
- [ ] `AI_AGENT_TIMEOUT_MS` - Execution timeout (120000)

---

## Route Structure

```
src/app/dashboard/[siteId]/ai-agents/
├── layout.tsx              # Sub-navigation for AI Agents
├── page.tsx                # Main dashboard (agents list + builder)
├── marketplace/
│   └── page.tsx            # Agent template marketplace
├── analytics/
│   └── page.tsx            # Analytics dashboard
├── testing/
│   └── page.tsx            # Test runner interface
├── usage/
│   └── page.tsx            # Usage & billing
├── approvals/
│   └── page.tsx            # Pending approvals
└── [agentId]/
    ├── page.tsx            # Agent detail view
    ├── edit/
    │   └── page.tsx        # Full editor
    └── executions/
        └── page.tsx        # Execution history
```

---

## API Routes

### Agents CRUD

```typescript
// GET /api/sites/[siteId]/ai-agents
// Returns: { agents: AgentConfig[], total: number }

// POST /api/sites/[siteId]/ai-agents
// Body: CreateAgentRequest
// Returns: AgentConfig

// GET /api/sites/[siteId]/ai-agents/[agentId]
// Returns: AgentConfig

// PUT /api/sites/[siteId]/ai-agents/[agentId]
// Body: UpdateAgentRequest
// Returns: AgentConfig

// DELETE /api/sites/[siteId]/ai-agents/[agentId]
// Returns: { success: true }
```

### Agent Execution

```typescript
// POST /api/sites/[siteId]/ai-agents/[agentId]/execute
// Body: { input: string, context?: Record<string, any> }
// Returns: ExecutionResult

// GET /api/sites/[siteId]/ai-agents/[agentId]/executions
// Returns: { executions: Execution[], total: number }

// GET /api/sites/[siteId]/ai-agents/[agentId]/executions/[executionId]
// Returns: ExecutionDetail with steps
```

### Approvals

```typescript
// GET /api/sites/[siteId]/ai-agents/approvals
// Query: ?status=pending|approved|denied
// Returns: { approvals: Approval[], total: number }

// POST /api/sites/[siteId]/ai-agents/approvals/[approvalId]/approve
// Body: { notes?: string }
// Returns: { success: true }

// POST /api/sites/[siteId]/ai-agents/approvals/[approvalId]/deny
// Body: { reason: string }
// Returns: { success: true }
```

---

## Automation Integration

### Event Trigger Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI AGENT TRIGGER FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Event Occurs (e.g., crm.contact.created)                    │
│                     │                                            │
│                     ▼                                            │
│  2. EventProcessor receives event                                │
│                     │                                            │
│                     ▼                                            │
│  3. Check for matching agent triggers                           │
│     - ai_agents.trigger_events = ['crm.contact.created']        │
│     - ai_agents.trigger_conditions matched                       │
│                     │                                            │
│                     ▼                                            │
│  4. AgentExecutor.execute(agent, eventPayload)                  │
│     - Build context from event data                             │
│     - Run ReAct loop                                             │
│     - Execute tools                                              │
│                     │                                            │
│                     ▼                                            │
│  5. Store execution result                                       │
│     - ai_agent_executions                                        │
│     - ai_agent_execution_steps                                   │
│     - ai_usage_tracking                                          │
│                     │                                            │
│                     ▼                                            │
│  6. Emit ai_agent.execution.completed event                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Trigger Types

1. **Event Triggers** - React to platform events
   - `crm.contact.created` → Lead Qualifier agent
   - `booking.appointment.created` → Confirmation agent
   - `form.submission.received` → Triage agent

2. **Schedule Triggers** - Cron-based execution
   - Daily data cleanup
   - Weekly report generation
   - Hourly health checks

3. **Manual Triggers** - User-initiated
   - Test executions
   - Ad-hoc tasks
   - Interactive assistants

4. **Webhook Triggers** - External systems
   - Third-party integrations
   - Custom applications

---

## Environment Variables

### Required Variables

```env
# OpenAI Configuration (Required for GPT models)
OPENAI_API_KEY=sk-...

# Anthropic Configuration (Required for Claude models)
ANTHROPIC_API_KEY=sk-ant-...

# AI Agent Defaults
AI_AGENT_DEFAULT_MODEL=gpt-4o-mini
AI_AGENT_MAX_TOKENS=4096
AI_AGENT_TIMEOUT_MS=120000
AI_AGENT_MAX_STEPS=10

# Usage Tracking
AI_USAGE_TRACK_COSTS=true
AI_OVERAGE_ENABLED=true
AI_OVERAGE_RATE_MULTIPLIER=1.5
```

### Environment Setup for Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable for Production/Preview/Development
3. Redeploy for changes to take effect

---

## Testing Plan

### 1. Unit Tests
- [ ] Agent CRUD operations
- [ ] Tool execution
- [ ] Memory operations
- [ ] LLM provider calls (mocked)

### 2. Integration Tests
- [ ] Create agent → Execute → Check results
- [ ] Event trigger → Agent execution
- [ ] Approval workflow → Resume execution

### 3. E2E Tests
- [ ] Navigate to AI Agents page
- [ ] Create new agent from template
- [ ] Configure triggers
- [ ] Test execution
- [ ] Check analytics

### 4. Manual Testing Scenarios
1. **Lead Qualifier Flow**
   - Create new contact in CRM
   - Verify agent triggers
   - Check qualification score
   - Verify memory stored

2. **Approval Workflow**
   - Configure high-risk action
   - Trigger agent
   - Approve in UI
   - Verify completion

3. **Usage Limits**
   - Execute until near limit
   - Verify warning
   - Attempt over-limit
   - Check overage tracking

---

## Deployment Checklist

### Pre-Deployment
- [ ] All TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] OpenAI/Anthropic API keys valid

### Post-Deployment
- [ ] Verify AI Agents page loads
- [ ] Test agent creation
- [ ] Verify template installation
- [ ] Test execution (manual)
- [ ] Check analytics updates

### Monitoring
- [ ] Set up error alerts for agent failures
- [ ] Monitor token usage
- [ ] Track execution times
- [ ] Watch for approval backlogs

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2s | Vercel Analytics |
| Agent Creation | 100% success | Error rate |
| Execution Success | > 95% | Execution logs |
| Approval Response | < 15 min avg | Approval timestamps |
| User Adoption | 50% of sites | Installation count |

---

## Files to Create

```
src/app/dashboard/[siteId]/ai-agents/
├── layout.tsx
├── page.tsx
├── marketplace/page.tsx
├── analytics/page.tsx
├── testing/page.tsx
├── usage/page.tsx
├── approvals/page.tsx
└── [agentId]/page.tsx

src/app/api/sites/[siteId]/ai-agents/
├── route.ts
└── [agentId]/
    ├── route.ts
    ├── execute/route.ts
    └── executions/route.ts

src/app/api/sites/[siteId]/ai-agents/approvals/
├── route.ts
└── [approvalId]/
    ├── approve/route.ts
    └── deny/route.ts

src/lib/ai-agents/
└── trigger-handler.ts

Updates:
├── src/components/dashboard/sidebar.tsx (add AI Agents link)
└── next-platform-dashboard/.env.example (add AI env vars)
```

---

## Estimated Time

| Task | Hours |
|------|-------|
| App Routes | 1.5 |
| API Routes | 1.5 |
| Sidebar Integration | 0.5 |
| Trigger Handler | 1.0 |
| Environment Setup | 0.5 |
| Testing & Polish | 1.0 |
| **Total** | **6.0** |

---

**Phase Author:** GitHub Copilot  
**Created:** January 28, 2026  
**Status:** 🔄 In Progress
