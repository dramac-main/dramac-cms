# Session 6 — BIL-09 + BIL-10: Super Admin Revenue Dashboard + Chiko AI Business Assistant

## Pre-Session Setup

**REQUIRED:** Read ALL memory bank files before starting:

1. `/memory-bank/projectbrief.md`
2. `/memory-bank/productContext.md`
3. `/memory-bank/systemPatterns.md`
4. `/memory-bank/techContext.md`
5. `/memory-bank/activeContext.md`
6. `/memory-bank/progress.md`

Then read the master guide: `/phases/PHASE-BIL-MASTER-GUIDE.md` (sections BIL-09 and BIL-10).

## Context

- **Billing V5 progress**: BIL-01 through BIL-08 are ALL complete and verified.
- **TSC baseline**: ~197 errors (all pre-existing, zero from billing work).
- **Supabase project ID**: `nfirsqmyxmmtbignofgb` — use MCP tools for migrations.
- **Paddle env**: `.env.local` still has `<fill-in: ...>` placeholders — don't touch these.
- **Database types**: `database.types.ts` is stale; use `as any` casts where needed (existing pattern).
- **Pricing**: Starter $29/mo, Growth $79/mo, Agency $149/mo. Annual: $290/$790/$1,490.

## Carry-Over Fix (Do First)

**Wire CancellationFlow into CurrentPlanCard:**

- In `src/components/billing/current-plan-card.tsx`, the "Cancel" button should open `CancellationFlow` dialog.
- Import `CancellationFlow` from `@/components/billing/cancellation-flow`.
- Add state (`cancelOpen` / `setCancelOpen`) and render `<CancellationFlow>` with required props.
- The component already exists and is fully implemented — just needs to be triggered from the plan card.

## Phase BIL-09: Super Admin Revenue Dashboard

**Goal**: Comprehensive revenue analytics page for the platform super admin.

### Files to Modify

- `src/app/(dashboard)/admin/billing/page.tsx` — Enhance with revenue overview cards
- `src/app/(dashboard)/admin/billing/revenue/page.tsx` — New deep-dive revenue page (create if doesn't exist)
- `src/components/admin/billing-overview.tsx` — Update with v5 metrics (create if doesn't exist)
- `src/components/admin/billing-activity.tsx` — Billing activity feed (create if doesn't exist)
- `src/lib/paddle/billing-actions.ts` — Add 7 admin-only server actions

### Server Actions (all super_admin auth guard)

Add to `billing-actions.ts`:

1. `getRevenueOverview()` — MRR, ARR, total agencies, churn rate, MoM growth
2. `getMrrHistory(months: number)` — Monthly MRR data points for chart
3. `getPlanDistribution()` — Count of agencies per plan (starter/growth/agency/free/trial)
4. `getTrialFunnel()` — Started, active, converted, expired counts + conversion rate
5. `getChurnAnalysis(days: number)` — Churned agencies, churn rate, avg lifetime
6. `getCancellationReasons(days: number)` — Aggregated reasons from `cancellation_feedback` table
7. `getPlatformCostEstimate()` — Revenue vs Paddle fees (5% + $0.50) vs estimated variable costs

### Dashboard Layout

Revenue Overview section with 4 stat cards: MRR, ARR, Total Agencies, Churn Rate (each with trend indicator).

Below that:

- Revenue chart (last 12 months) — line chart with MRR growth
- Plan distribution — pie or bar chart
- Trial funnel — started → active → converted → expired
- Billing activity feed — recent subscription events from `subscription_events` table
- Cancellation reasons — from `cancellation_feedback` table (last 30 days)
- Platform costs vs revenue — revenue, Paddle fees, net margin

Use Recharts for charts (already in project dependencies).

### Data Sources

- `paddle_subscriptions` — active subscription data, plan types
- `subscription_events` — activity feed
- `trial_tracking` — trial funnel
- `cancellation_feedback` — cancellation reasons
- `agencies` — total count, status

---

## Phase BIL-10: Chiko AI Business Assistant

**Goal**: AI business intelligence assistant that queries all module data and answers questions in natural language.

### IMPORTANT: The AI's name is **Chiko** (NOT Chico).

### Files to Create

1. `src/components/chiko/chiko-query-builder.ts` — Maps questions to module-specific Supabase queries
2. `src/components/chiko/chiko-chat.tsx` — Chat UI with message history and quick actions
3. `src/app/api/chiko/route.ts` — API endpoint (Claude Haiku 4.5, maxDuration=60)
4. `src/app/(dashboard)/dashboard/chiko/page.tsx` — Dashboard page for Chiko
5. `migrations/bil-10-chiko.sql` — `chiko_conversations` table + RLS

### Files to Modify

- `src/config/navigation.ts` — Add "Chiko AI" nav item with sparkle icon
- `src/lib/paddle/billing-actions.ts` — (if needed for AI usage tracking integration)

### Query Builder Categories

```typescript
type ChikoQueryCategory =
  | "revenue"
  | "bookings"
  | "clients"
  | "orders"
  | "chat"
  | "marketing"
  | "general";
```

Each category queries specific tables (ALL scoped by `agency_id`):

- **revenue**: `invoices`, `invoice_items`, `orders`, `order_items`
- **bookings**: `bookings`, `booking_services`
- **clients**: `clients`, `client_sites`
- **orders**: `orders`, `order_items`, `products`
- **chat**: `conversations`, `messages`
- **marketing**: `campaigns`, `campaign_analytics`
- **general**: Summary from all modules

Use Supabase service role client (server-side only) to bypass RLS. Max ~2000 tokens of context per query.

### AI Endpoint Requirements

- Auth check: get user + agency
- Check AI usage limit (counts toward `ai_actions` quota via `usage-tracker.ts`)
- Classify question → category
- Build context via query builder
- Call Claude Haiku 4.5 with system prompt + context + question
- Return: `{ message: string, data?: any }`
- Record AI action usage after call

### System Prompt

```
You are Chiko, the AI business assistant for DRAMAC CMS.
You help agency owners and managers understand their business data.
You have access to real-time data from all modules: CRM, Invoicing, E-Commerce, Booking, Live Chat, Marketing, and Social Media.
Answer questions concisely with specific numbers. Use the Zambian Kwacha (K) for currency.
If data is not available for what they asked, say so honestly.
Never make up numbers — only use the data provided to you.
When comparing periods, state both numbers and the percentage change.
```

### Chat UI Features

- Message history (user/assistant bubbles)
- Quick action buttons: "Revenue Summary", "This Week's Bookings", "Outstanding Invoices", "Top Products", "Client Overview"
- Input field + send button
- Loading state while AI processes
- Conversation persisted to `chiko_conversations` table

### Migration (`bil-10-chiko.sql`)

```sql
CREATE TABLE IF NOT EXISTS chiko_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  messages JSONB NOT NULL DEFAULT '[]',
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chiko_conversations ENABLE ROW LEVEL SECURITY;
-- RLS: users view/create/update own conversations
```

Apply migration via Supabase MCP tool.

### Navigation Integration

Add to main dashboard nav config:

- Label: "Chiko AI"
- Icon: Sparkles (from lucide-react)
- Path: `/dashboard/chiko`
- Available to all authenticated agency members

---

## Rules

1. All prices in cents — $29 = 2900, never floating point for money
2. TypeScript first — minimize `any` types (use only for stale database.types.ts)
3. Auth guards on every server action and page
4. All Chiko queries MUST be scoped by `agency_id` — no cross-agency data leaks
5. Each Chiko AI call counts toward `ai_actions` quota (via `recordUsage('ai_actions', agencyId)`)
6. Use Recharts for charts (already installed)
7. Don't modify the master guide
8. Apply migrations via Supabase MCP (project ID: `nfirsqmyxmmtbignofgb`)
9. After implementation, run `npx tsc --noEmit --skipLibCheck` and verify no new errors
10. Update memory bank (`activeContext.md` + `progress.md`) after completion

## Verification Checklist

After implementing both phases:

- [ ] CancellationFlow wired into CurrentPlanCard Cancel button
- [ ] Admin billing page shows revenue overview with 4 stat cards
- [ ] Revenue chart renders with MRR history
- [ ] Plan distribution chart shows agency counts per plan
- [ ] Trial funnel displays conversion metrics
- [ ] Billing activity feed shows recent events
- [ ] Cancellation reasons aggregated from feedback table
- [ ] Platform costs vs revenue estimate works
- [ ] All 7 admin server actions implemented with super_admin guard
- [ ] Chiko query builder handles all 7 categories
- [ ] Chiko API endpoint authenticates, checks quota, calls Claude
- [ ] Chiko chat UI renders with message history and quick actions
- [ ] chiko_conversations table created with RLS
- [ ] Chiko added to navigation config
- [ ] AI usage tracked per call
- [ ] TSC errors remain at ~197 baseline (no new errors)
- [ ] Both migrations applied via Supabase MCP
