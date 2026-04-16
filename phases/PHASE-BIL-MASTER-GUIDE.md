# DRAMAC Billing System — Complete Implementation Master Guide

**Document Type**: Master Implementation Guide (AI Agent Reference)  
**Created**: July 2026  
**Platform**: DRAMAC CMS — Enterprise Module Marketplace  
**Production URL**: https://app.dramacagency.com  
**Pricing Strategy**: `/docs/PRICING-STRATEGY-V5.md`

---

## How to Use This Guide

This document is the **single source of truth** for building the DRAMAC Billing System. It is designed to be consumed by AI agents across multiple sessions.

### Workflow Per Session

1. **Read this entire guide** to understand the full vision
2. **Read ALL memory bank files** (`/memory-bank/*.md`) to understand current platform state
3. **Read `/docs/PRICING-STRATEGY-V5.md`** for pricing numbers and cost model
4. **Pick the next unimplemented phase** from the phase list below
5. **Implement that phase completely** — all code, migrations, types, tests
6. **Verify**: Run `npx tsc --noEmit --skipLibCheck` with `NODE_OPTIONS="--max-old-space-size=8192"` — zero errors required
7. **Build**: Run `npx next build` — must succeed
8. **Commit**: `git add -A && git commit -m "feat: Phase BIL-XX — [description]" && git push`
9. **Update memory bank**: Update `activeContext.md` and `progress.md`
10. **Do NOT modify this master guide** — it stays as the north star vision

### Critical Platform Rules (MUST Follow)

- **All prices in CENTS** (integers) — $29.00 = 2900, $149.00 = 14900
- **Supabase returns snake_case** — always use `mapRecord()`/`mapRecords()` from `@/lib/map-db-record`
- **Every server page needs auth guard**: `if (!user) redirect('/login')`
- **AI Zod schemas**: No `.int()`, `.min()`, `.max()` — Claude rejects these
- **Vercel function timeout**: `maxDuration = 60` on all AI API routes
- **Locale**: Zambia-first — `ZMW` currency, `K` symbol, `Africa/Lusaka` timezone, 16% VAT
- **Email sender**: `Dramac <noreply@app.dramacagency.com>` via Resend
- **No `dark:` Tailwind variants** in storefront/public components
- **Use semantic Tailwind**: `bg-card`, `text-foreground`, `bg-primary`
- **`'use client'` components** must NOT contain inline `'use server'` annotations
- **Import server actions** as functions from separate files
- **Toast notifications**: Use `sonner` (not `useToast`)
- **Font inline styles**: Always use `fontFamily: value || undefined` (never empty string)

---

## Table of Contents

### Foundation & Checkout

- **Phase BIL-01**: Pricing Configuration Rework (PLAN_CONFIGS, Paddle products, DB schema)
- **Phase BIL-02**: Pricing Page Redesign (3-tier public page, comparison table)
- **Phase BIL-03**: Subscription Checkout & Trial (Paddle.js checkout, success page, 14-day trial)

### Dashboard & Metering

- **Phase BIL-04**: Billing Settings Dashboard (current plan, usage, invoices)
- **Phase BIL-05**: Usage Metering & Enforcement (email sends tracking, storage tracking, alerts at 80%/100%)

### Lifecycle Management

- **Phase BIL-06**: Plan Upgrades & Downgrades (change plan flow, proration, downgrade warnings)
- **Phase BIL-07**: Payment Methods & Cancellation (update card, cancel with reason, pause/resume)

### Revenue & Intelligence

- **Phase BIL-08**: Overage Billing Engine (calculate, report to Paddle, invoice display)
- **Phase BIL-09**: Super Admin Revenue Dashboard (MRR/ARR, plan distribution, churn, trends)
- **Phase BIL-10**: Chiko AI Business Assistant (module data queries, chat UI, AI endpoint)

---

## Platform Architecture Context

### Multi-Tenant Hierarchy

```
Super Admin (DRAMAC platform operator)
    └── Agency (subscribes to a plan via Paddle)
            ├── Team Members (roles: owner, admin, member)
            │   └── 21+ granular permissions across 5 categories
            ├── Clients (unlimited CRM records)
            │   └── Client Portal Access (per-site, 12 permission columns)
            ├── Sites (LIMITED by plan: 3 / 10 / 30)
            │   ├── Installed Modules (all 7 auto-installed)
            │   ├── Pages, Blog, SEO, Forms, Media
            │   └── Storefront (customer auth, cart, orders)
            └── Subscription (Paddle - monthly or annual)
                ├── Plan type: starter / growth / agency
                ├── Metered usage: AI actions, email sends, automation runs, file storage
                └── Overage billing: soft limits, pay for extra
```

### Where Billing Touches Everything

| Billing Component              | What It Controls                                       |
| ------------------------------ | ------------------------------------------------------ |
| **Site creation**              | Enforces `max_sites` per plan (3 / 10 / 30)            |
| **Team member invite**         | Enforces `max_team_members` per plan (2 / 5 / 15)      |
| **AI actions** (all modules)   | Counts toward `ai_actions` quota                       |
| **Marketing campaigns**        | Counts toward `email_sends` quota (the #1 cost driver) |
| **Automation workflow runs**   | Counts toward `automation_runs` quota                  |
| **File uploads** (all modules) | Counts toward `file_storage` quota                     |
| **White-label**                | Only enabled for `agency` plan                         |
| **Chiko AI assistant**         | Uses same `ai_actions` quota pool                      |

---

## Existing Code Inventory

### What EXISTS (Will Be Modified)

| File                                            | Current State                                       | What Changes                                                                                        |
| ----------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/lib/paddle/client.ts`                      | 2 plans (Starter $29, Pro $99), 3 usage types       | **Rewrite** PLAN_CONFIGS for 3 plans ($29/$79/$149), add `email_sends` + `file_storage` usage types |
| `src/lib/paddle/usage-tracker.ts`               | Tracks `automation_runs`, `ai_actions`, `api_calls` | **Add** `email_sends` + `file_storage_bytes` tracking                                               |
| `src/lib/paddle/subscription-service.ts`        | Full CRUD, dual-source pattern                      | **Add** trial management methods, plan validation                                                   |
| `src/lib/paddle/billing-actions.ts`             | 15 server actions with auth                         | **Add** trial actions, email usage actions                                                          |
| `src/lib/paddle/webhook-handlers.ts`            | Handles subscription._, transaction._, customer.\*  | **Add** trial webhook handling                                                                      |
| `src/lib/paddle/dunning-service.ts`             | 4 retries, 14-day grace, pause action               | No changes needed                                                                                   |
| `src/lib/paddle/paddle-client.ts` (client-side) | `openPaddleCheckout()`, `openCheckoutForPlan()`     | **Update** for 3 plans, trial checkout                                                              |
| `src/lib/paddle/enterprise-service.ts`          | Quote system                                        | No changes needed                                                                                   |
| `src/lib/paddle/transactions.ts`                | Domain/email purchases                              | No changes needed                                                                                   |
| `src/app/pricing/page.tsx`                      | 2-plan cards + Enterprise                           | **Redesign** for 3-tier layout                                                                      |
| `src/app/(dashboard)/settings/billing/page.tsx` | Owner-only, 4 components                            | **Enhance** with usage dashboard, plan change                                                       |
| `src/app/(dashboard)/admin/billing/page.tsx`    | MRR/ARR overview                                    | **Enhance** with new metrics                                                                        |
| `src/components/billing/*.tsx`                  | 7 components                                        | **Update** all for 3-plan model                                                                     |
| `src/components/admin/billing-overview.tsx`     | Admin billing cards                                 | **Enhance** for v5 metrics                                                                          |

### What Does NOT Exist (Will Be Created)

| File                                               | Purpose                                               |
| -------------------------------------------------- | ----------------------------------------------------- |
| `src/lib/paddle/trial-service.ts`                  | Trial lifecycle: create, extend, expire, convert      |
| `src/lib/paddle/email-usage.ts`                    | Email sends counting middleware (wraps Resend client) |
| `src/lib/paddle/storage-tracker.ts`                | File storage tracking per agency                      |
| `src/lib/paddle/plan-enforcer.ts`                  | Centralized limit enforcement (sites, team, usage)    |
| `src/components/billing/plan-comparison-table.tsx` | Feature comparison table                              |
| `src/components/billing/usage-alerts.tsx`          | 80%/100% usage alert banners                          |
| `src/components/billing/plan-change-dialog.tsx`    | Upgrade/downgrade confirmation                        |
| `src/components/billing/trial-banner.tsx`          | Trial countdown banner                                |
| `src/components/billing/cancellation-flow.tsx`     | Multi-step cancel with reason                         |
| `src/components/billing/payment-method.tsx`        | Update card via Paddle.js                             |
| `src/components/billing/overage-summary.tsx`       | Overage charges breakdown                             |
| `src/components/chiko/chiko-chat.tsx`              | AI business assistant chat UI                         |
| `src/components/chiko/chiko-query-builder.ts`      | Module data aggregation for AI                        |
| `src/app/api/chiko/route.ts`                       | AI chat API endpoint                                  |
| `src/app/(dashboard)/dashboard/chiko/page.tsx`     | Chiko assistant page                                  |

### Database Tables Needed

| Table                   | Phase  | Purpose                                          |
| ----------------------- | ------ | ------------------------------------------------ |
| `subscription_events`   | BIL-01 | Audit log for all subscription changes           |
| `usage_daily`           | BIL-05 | Aggregated daily usage per agency                |
| `usage_alerts`          | BIL-05 | Tracks which alerts have been sent               |
| `trial_tracking`        | BIL-03 | Trial start, expiry, conversion status           |
| `overage_charges`       | BIL-08 | Calculated overage line items per billing period |
| `cancellation_feedback` | BIL-07 | Cancel reason and feedback                       |
| `chiko_conversations`   | BIL-10 | AI assistant conversation history                |

### Key Environment Variables

**Currently set (sandbox):**

```
PADDLE_API_KEY=pdl_sdbx_apikey_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_PRODUCT_STARTER=pro_01kfwy...
PADDLE_PRODUCT_PRO=pro_01kfwz...
NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY=pri_01kfwz0...
NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY=pri_01kfwz5...
NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY=pri_01kfwzb...
NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY=pri_01kfwzd...
```

**Will need to add:**

```
PADDLE_PRODUCT_GROWTH=<new product>
NEXT_PUBLIC_PADDLE_PRICE_GROWTH_MONTHLY=<new price>
NEXT_PUBLIC_PADDLE_PRICE_GROWTH_YEARLY=<new price>
PADDLE_PRICE_AI_OVERAGE=<new price>
PADDLE_PRICE_EMAIL_OVERAGE=<new price>
PADDLE_PRICE_AUTOMATION_OVERAGE=<new price>
PADDLE_PRICE_STORAGE_OVERAGE=<new price>
NEXT_PUBLIC_PADDLE_SELLER_ID=<seller id>
ANTHROPIC_API_KEY=<for Chiko>  # already exists
```

**⚠️ IMPORTANT**: Current PADDLE_PRODUCT_STARTER price IDs map to $29/$290. For v5, we either:

- (a) Create NEW Paddle products/prices for $29/$79/$149 (recommended — cleaner)
- (b) Update existing products in Paddle dashboard (risky if any test subscriptions exist)

**Recommendation**: Create new products. Rename env vars to include `V5` or deprecate old ones.

---

## Phase Specifications

---

### Phase BIL-01: Pricing Configuration Rework

**Goal**: Rewrite the core pricing constants, create new Paddle products, update to 3-tier model.

#### 1.1 Paddle Dashboard Setup (Manual Step)

Before coding, create these products in Paddle Sandbox dashboard:

| Product            | Monthly Price | Annual Price |
| ------------------ | ------------- | ------------ |
| **DRAMAC Starter** | $29.00/mo     | $290.00/yr   |
| **DRAMAC Growth**  | $79.00/mo     | $790.00/yr   |
| **DRAMAC Agency**  | $149.00/mo    | $1,490.00/yr |

Also create overage prices (quantity-based, metered):

- AI Actions Overage: $0.01 per unit
- Email Sends Overage: $0.002 per unit
- Automation Runs Overage: $0.002 per unit
- File Storage Overage: $0.50 per GB

Record all product/price IDs for `.env.local`.

#### 1.2 Rewrite `src/lib/paddle/client.ts`

**Replace `PlanType`:**

```typescript
export type PlanType = "starter" | "growth" | "agency";
```

**Replace `PLAN_CONFIGS` with v5 pricing:**

```typescript
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter_monthly: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY!,
    productId: process.env.PADDLE_PRODUCT_STARTER!,
    name: "Starter",
    amount: 2900, // $29.00
    interval: "month",
    includedUsage: {
      automationRuns: 2000,
      aiActions: 1000,
      emailSends: 2000,
      fileStorageMb: 5120, // 5 GB
    },
    limits: {
      sites: 5,
      teamMembers: 3,
    },
    features: [
      "All 7 modules included",
      "5 websites",
      "3 team members",
      "1,000 AI actions/mo",
      "2,000 email sends/mo",
      "2,000 automation runs/mo",
      "5 GB file storage",
      "Custom domains",
      "Chiko AI assistant",
      "Community support",
    ],
  },
  starter_yearly: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY!,
    productId: process.env.PADDLE_PRODUCT_STARTER!,
    name: "Starter",
    amount: 29000, // $290.00/yr
    interval: "year",
    includedUsage: {
      automationRuns: 24000,
      aiActions: 12000,
      emailSends: 24000,
      fileStorageMb: 5120,
    },
    limits: { sites: 5, teamMembers: 3 },
    features: [
      /* same as monthly */
    ],
  },
  growth_monthly: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH_MONTHLY!,
    productId: process.env.PADDLE_PRODUCT_GROWTH!,
    name: "Growth",
    amount: 7900, // $79.00
    interval: "month",
    includedUsage: {
      automationRuns: 15000,
      aiActions: 3000,
      emailSends: 10000,
      fileStorageMb: 20480, // 20 GB
    },
    limits: {
      sites: 15,
      teamMembers: 8,
    },
    features: [
      "All 7 modules included",
      "15 websites",
      "8 team members",
      "3,000 AI actions/mo",
      "10,000 email sends/mo",
      "15,000 automation runs/mo",
      "20 GB file storage",
      "Custom domains",
      "Chiko AI assistant",
      "14-day free trial",
      "Priority email support",
    ],
  },
  growth_yearly: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH_YEARLY!,
    productId: process.env.PADDLE_PRODUCT_GROWTH!,
    name: "Growth",
    amount: 79000, // $790.00/yr
    interval: "year",
    includedUsage: {
      automationRuns: 180000,
      aiActions: 36000,
      emailSends: 120000,
      fileStorageMb: 20480,
    },
    limits: { sites: 15, teamMembers: 8 },
    features: [
      /* same as monthly + 14-day trial */
    ],
  },
  agency_monthly: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_MONTHLY!,
    productId: process.env.PADDLE_PRODUCT_AGENCY!,
    name: "Agency",
    amount: 14900, // $149.00
    interval: "month",
    includedUsage: {
      automationRuns: 75000,
      aiActions: 15000,
      emailSends: 40000,
      fileStorageMb: 76800, // 75 GB
    },
    limits: {
      sites: 30,
      teamMembers: 20,
    },
    features: [
      "All 7 modules included",
      "30 websites",
      "20 team members",
      "15,000 AI actions/mo",
      "40,000 email sends/mo",
      "75,000 automation runs/mo",
      "75 GB file storage",
      "Custom domains",
      "Chiko AI assistant",
      "Full white-label",
      "Custom dashboard domain",
      "Priority + chat support",
    ],
  },
  agency_yearly: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_YEARLY!,
    productId: process.env.PADDLE_PRODUCT_AGENCY!,
    name: "Agency",
    amount: 149000, // $1,490.00/yr
    interval: "year",
    includedUsage: {
      automationRuns: 900000,
      aiActions: 180000,
      emailSends: 480000,
      fileStorageMb: 76800,
    },
    limits: { sites: 30, teamMembers: 20 },
    features: [
      /* same as monthly */
    ],
  },
};
```

**Update `PlanConfig` interface:**

```typescript
export interface PlanConfig {
  priceId: string;
  productId: string;
  name: string;
  amount: number; // in cents
  interval: "month" | "year";
  includedUsage: {
    automationRuns: number;
    aiActions: number;
    emailSends: number; // NEW
    fileStorageMb: number; // NEW (in MB)
  };
  limits: {
    sites: number;
    teamMembers: number;
    // modules removed — all 7 included on every plan
  };
  features: string[];
}
```

**Update `OVERAGE_RATES`:**

```typescript
export const OVERAGE_RATES = {
  starter: {
    automationRuns: 0.002, // $2 per 1K
    aiActions: 0.01, // $10 per 1K
    emailSends: 0.002, // $2 per 1K
    fileStorageMb: 0.0005, // $0.50 per GB ($0.0005 per MB)
  },
  growth: {
    automationRuns: 0.002,
    aiActions: 0.01,
    emailSends: 0.002,
    fileStorageMb: 0.0005,
  },
  agency: {
    automationRuns: 0.001, // 50% discount for top tier
    aiActions: 0.008,
    emailSends: 0.0015,
    fileStorageMb: 0.0004,
  },
};
```

**Rename helper functions:**

- `getPlanConfig(planType, billingCycle)` — update to support `'growth'`
- `getPlanTypeFromPriceId(priceId)` — update mapping for new price IDs
- Add: `getPlanLimits(planType)` → returns `{ sites, teamMembers, whiteLabel }`
- Add: `isWhiteLabelEnabled(planType)` → `planType === 'agency'`
- Add: `getTrialEligiblePlans()` → `['growth']`

#### 1.3 Update `agencies` Table

**Migration** (`migrations/bil-01-pricing-v5.sql`):

```sql
-- Add new billing columns to agencies
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS subscription_plan_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_sends_current_period INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_storage_used_bytes BIGINT DEFAULT 0;

-- Subscription events audit table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'paused', 'resumed', 'trial_started', 'trial_expired', 'trial_converted', 'payment_failed', 'payment_recovered'
  from_plan TEXT,
  to_plan TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscription_events_agency
  ON subscription_events(agency_id, created_at DESC);

-- RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members view own events" ON subscription_events
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Service role full access" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');
```

#### 1.4 Update Helper Functions

Update all helper functions in `client.ts` to handle 3 plans instead of 2. Update `getPlanTypeFromPriceId()` mapping. Ensure `calculateOverageCost()` includes `emailSends` and `fileStorageMb`.

#### 1.5 Update `.env.local`

Add placeholders for the new Growth tier price IDs and overage price IDs. Update `.env.example` to match.

**Files Modified**: `src/lib/paddle/client.ts`, `.env.local`, `.env.example`
**Files Created**: `migrations/bil-01-pricing-v5.sql`
**Verification**: `npx tsc --noEmit --skipLibCheck` — zero errors

---

### Phase BIL-02: Pricing Page Redesign

**Goal**: Redesign the public pricing page for 3 tiers with full feature comparison.

#### 2.1 Create Plan Comparison Component

**File**: `src/components/billing/plan-comparison-table.tsx`

Full-width comparison table with ALL features. Rows grouped by category:

- **Scale** (sites, clients, team members)
- **Modules** (all 7 — checkmarks for all plans)
- **Metered Resources** (AI, email, automation, storage — numbers differ)
- **AI Features** (Chiko, AI designer — checkmarks for all)
- **Support** (Community / Priority Email / Priority + Chat)
- **Branding** (DRAMAC branded / white-label)

Sticky header with plan names + prices. Monthly/yearly toggle. Mobile: swipeable cards instead of table.

#### 2.2 Redesign `src/app/pricing/page.tsx`

Replace current 2-plan layout with:

```
┌──────────────────────────────────────────────────────────────────┐
│  Hero: "Simple, Transparent Pricing"                             │
│  Subtitle: "All 7 modules included on every plan"               │
│  [Monthly / Yearly toggle — "Save 2 months"]                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ STARTER  │  │ ⭐ GROWTH │  │ AGENCY   │                       │
│  │ $29/mo   │  │ $79/mo   │  │ $149/mo  │                       │
│  │          │  │ Free     │  │          │                       │
│  │ 5 sites  │  │ trial    │  │ 30 sites │                       │
│  │ 3 team   │  │          │  │ 20 team  │                       │
│  │          │  │ 15 sites │  │ White-   │                       │
│  │ [Start]  │  │ 8 team   │  │ label    │                       │
│  │          │  │          │  │          │                       │
│  │          │  │ [Trial]  │  │ [Start]  │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Full Feature Comparison Table                                   │
├──────────────────────────────────────────────────────────────────┤
│  Overage Pricing Section                                         │
├──────────────────────────────────────────────────────────────────┤
│  FAQ Accordion                                                   │
│  - "What happens when I exceed limits?"                         │
│  - "Can I switch plans anytime?"                                │
│  - "How does the free trial work?"                              │
│  - "What payment methods do you accept?"                        │
│  - "Is there a contract or commitment?"                         │
├──────────────────────────────────────────────────────────────────┤
│  Enterprise CTA: "Need more? Contact us for custom pricing"     │
└──────────────────────────────────────────────────────────────────┘
```

#### 2.3 Update `src/components/billing/pricing-card.tsx`

Update `PricingPlan` type for v5 fields. Add trial badge for Growth plan. Add "Most Popular" badge for Growth. White-label badge for Agency.

#### 2.4 Update `src/components/billing/billing-cycle-toggle.tsx`

Add "Save 2 months" label next to annual toggle. Show calculated savings per plan.

**Files Modified**: `src/app/pricing/page.tsx`, `src/components/billing/pricing-card.tsx`, `src/components/billing/billing-cycle-toggle.tsx`
**Files Created**: `src/components/billing/plan-comparison-table.tsx`

---

### Phase BIL-03: Subscription Checkout & Trial

**Goal**: Implement the checkout flow with Paddle.js and 14-day trial for Growth plan.

#### 3.1 Create Trial Service

**File**: `src/lib/paddle/trial-service.ts`

```typescript
export class TrialService {
  // Start a trial (Growth plan only)
  async startTrial(agencyId: string, email: string): Promise<TrialInfo>;

  // Check if agency is eligible for trial (never had one)
  async isTrialEligible(agencyId: string): Promise<boolean>;

  // Get current trial status
  async getTrialStatus(agencyId: string): Promise<TrialStatus | null>;

  // Expire trial (called by cron or webhook)
  async expireTrial(agencyId: string): Promise<void>;

  // Convert trial to paid (called after successful checkout)
  async convertTrial(agencyId: string, subscriptionId: string): Promise<void>;

  // Get days remaining
  async getTrialDaysRemaining(agencyId: string): Promise<number>;

  // Extend trial (admin only)
  async extendTrial(agencyId: string, additionalDays: number): Promise<void>;
}

interface TrialInfo {
  agencyId: string;
  planType: "growth";
  startsAt: string;
  expiresAt: string; // 14 days from start
  status: "active" | "expired" | "converted";
}

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  expiresAt: string;
  planType: "growth";
}
```

#### 3.2 Trial Database Table

**Migration** (`migrations/bil-03-trials.sql`):

```sql
CREATE TABLE IF NOT EXISTS trial_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'growth',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  converted_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'converted'
  conversion_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE trial_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members view own trial" ON trial_tracking
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Service role full access" ON trial_tracking
  FOR ALL USING (auth.role() = 'service_role');
```

#### 3.3 Update Checkout Flow

Update `src/lib/paddle/paddle-client.ts` (client-side):

- Add `openTrialCheckout(agencyId)` — opens Paddle checkout with trial_period_days: 14
- Update `openCheckoutForPlan()` to support `'growth'` plan type
- Add trial badge in checkout overlay

#### 3.4 Create Checkout Success Page

**File**: `src/app/(dashboard)/settings/billing/success/page.tsx`

After checkout:

1. Show success animation (confetti or check icon)
2. Display plan details + what they unlocked
3. For trial: "Your 14-day free trial has started! You won't be charged until [date]."
4. CTA: "Go to Dashboard" button

#### 3.5 Create Trial Banner Component

**File**: `src/components/billing/trial-banner.tsx`

Show at top of dashboard when trial is active:

- "Growth Trial — 12 days remaining" + "Upgrade Now" button
- Changes color at 3 days: yellow warning
- Changes to red at 1 day: "Trial expires tomorrow!"
- Shows in dashboard layout when `is_trial = true`

#### 3.6 Update Webhook Handlers

Update `src/lib/paddle/webhook-handlers.ts`:

- Handle `subscription.trialing` event → set trial status
- Handle trial → active transition (payment successful after trial)
- Log trial conversion in `subscription_events`

**Files Modified**: `src/lib/paddle/paddle-client.ts`, `src/lib/paddle/webhook-handlers.ts`, `src/lib/paddle/billing-actions.ts`
**Files Created**: `src/lib/paddle/trial-service.ts`, `src/components/billing/trial-banner.tsx`, `src/app/(dashboard)/settings/billing/success/page.tsx`, `migrations/bil-03-trials.sql`

---

### Phase BIL-04: Billing Settings Dashboard

**Goal**: Build the full billing settings page with current plan, usage overview, and invoice history.

#### 4.1 Redesign `/settings/billing` Page

Current page exists but needs major enhancement. New layout:

```
┌─────────────────────────────────────────────────────────────┐
│  [Trial Banner — if applicable]                              │
├─────────────────────────────────────────────────────────────┤
│  Current Plan Card                                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Growth Plan — $79/mo          [Change Plan] [Cancel]    │ │
│  │ Next billing: Aug 15, 2026    Status: Active ●          │ │
│  │ Payment method: •••• 4242     [Update]                  │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Usage This Period (Jul 1 — Jul 31)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ AI       │ │ Emails   │ │ Auto     │ │ Storage  │      │
│  │ ████░░░░ │ │ ██████░░ │ │ █████░░░ │ │ ██░░░░░░ │      │
│  │ 850/2000 │ │ 3200/5K  │ │ 4800/10K │ │ 3.2/10GB │      │
│  │ 42.5%    │ │ 64%      │ │ 48%      │ │ 32%      │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  [⚠️ Email usage at 64% — you've used 3,200 of 5,000]      │
├─────────────────────────────────────────────────────────────┤
│  Resources                                                   │
│  Sites: 6/10  |  Team Members: 3/5                          │
├─────────────────────────────────────────────────────────────┤
│  Invoice History                                             │
│  ┌──────┬──────────┬────────┬────────┐                      │
│  │ Date │ Amount   │ Status │ Action │                      │
│  │ Jul 1│ $49.00   │ Paid ✓ │ [PDF]  │                      │
│  │ Jun 1│ $49.00   │ Paid ✓ │ [PDF]  │                      │
│  │ May 1│ $53.20   │ Paid ✓ │ [PDF]  │  ← includes overage │
│  └──────┴──────────┴────────┴────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2 Update `src/components/billing/usage-dashboard.tsx`

Currently tracks 3 metrics. Expand to 4:

- AI Actions (existing)
- Email Sends (NEW)
- Automation Runs (existing)
- File Storage (NEW)

Each shows: progress bar, current/included, percentage, color coding (green < 60%, yellow 60-80%, orange 80-95%, red > 95%).

#### 4.3 Create Usage Alerts Component

**File**: `src/components/billing/usage-alerts.tsx`

Inline alert banners that show when usage crosses thresholds:

- **80%**: Yellow info bar — "You've used 80% of your email sends this period"
- **95%**: Orange warning — "Almost at your limit. Overages will apply at $2/1K emails"
- **100%**: Red alert — "You've exceeded your email sends limit. Overages are being tracked"

#### 4.4 Update Current Plan Card

Update `src/components/billing/current-plan-card.tsx`:

- Show plan name, price, billing cycle
- Next billing date
- Cancel at period end notice (if scheduled)
- "Change Plan" button → links to plan change dialog
- "Cancel" button → links to cancellation flow

**Files Modified**: `src/app/(dashboard)/settings/billing/page.tsx`, `src/components/billing/usage-dashboard.tsx`, `src/components/billing/current-plan-card.tsx`, `src/components/billing/paddle-invoice-history.tsx`
**Files Created**: `src/components/billing/usage-alerts.tsx`

---

### Phase BIL-05: Usage Metering & Enforcement

**Goal**: Track email sends and file storage, enforce site/team limits, alert at thresholds.

#### 5.1 Email Usage Tracking

**File**: `src/lib/paddle/email-usage.ts`

Middleware that wraps the Resend email sending to count sends per agency:

```typescript
export async function trackEmailSend(
  agencyId: string,
  count: number = 1,
): Promise<void> {
  // Increment email_sends in usage_hourly bucket
  // Same pattern as usage-tracker.ts recordUsage()
}

export async function getEmailUsage(
  agencyId: string,
): Promise<{ used: number; included: number; overage: number }> {
  // Query current period email send count
}

export async function checkEmailLimit(
  agencyId: string,
  requestedCount: number,
): Promise<{ allowed: boolean; remaining: number }> {
  // Soft limit — always allowed, but tracks overage
}
```

#### 5.2 Integration Points for Email Counting

Every email send in the platform must call `trackEmailSend()`. Key locations:

| File                             | Send Type       | Integration                                      |
| -------------------------------- | --------------- | ------------------------------------------------ |
| `src/lib/email/resend-client.ts` | All emails      | Wrap `sendEmail()` with tracking (central point) |
| Marketing campaign sender        | Bulk campaigns  | Already calls resend-client — tracking cascades  |
| Automation email action          | Workflow emails | Already calls resend-client                      |
| Booking confirmations            | Transactional   | Already calls resend-client                      |
| E-commerce order emails          | Transactional   | Already calls resend-client                      |
| Invoice emails                   | Transactional   | Already calls resend-client                      |

**Best approach**: Add tracking inside the central `resend-client.ts` `sendEmail()` function. This way ALL emails are counted regardless of which module sends them. Requires passing `agencyId` to `sendEmail()` (add as parameter or derive from context).

#### 5.3 File Storage Tracking

**File**: `src/lib/paddle/storage-tracker.ts`

```typescript
export async function trackFileUpload(
  agencyId: string,
  fileSizeBytes: number,
): Promise<void>;
export async function trackFileDelete(
  agencyId: string,
  fileSizeBytes: number,
): Promise<void>;
export async function getStorageUsage(
  agencyId: string,
): Promise<{ usedBytes: number; includedBytes: number; overageBytes: number }>;
export async function checkStorageLimit(
  agencyId: string,
  fileSizeBytes: number,
): Promise<{ allowed: boolean; remainingBytes: number }>;
```

Integration: wrap Supabase Storage `.upload()` calls. Check `file_storage_used_bytes` on agencies table.

#### 5.4 Plan Limit Enforcer

**File**: `src/lib/paddle/plan-enforcer.ts`

Centralized function for all limit checks:

```typescript
export async function enforceSiteLimit(
  agencyId: string,
): Promise<{ allowed: boolean; current: number; max: number }>;
export async function enforceTeamMemberLimit(
  agencyId: string,
): Promise<{ allowed: boolean; current: number; max: number }>;
export async function enforceWhiteLabel(agencyId: string): Promise<boolean>;
export async function getAgencyLimits(agencyId: string): Promise<PlanLimits>;
```

These functions should be called in:

- `createSite()` server action — check site limit before creating
- `inviteTeamMember()` server action — check team limit before inviting
- White-label rendering logic — only show agency branding if `enforceWhiteLabel()` returns true

#### 5.5 Update Usage Tracker

Update `src/lib/paddle/usage-tracker.ts`:

- Add `'email_sends'` and `'file_storage_bytes'` to `UsageType`
- Update `UsageReport` interface to include email and storage metrics
- Update `getCurrentUsage()` to query email + storage data
- Update `reportUsageToPaddle()` to include email + storage overages

#### 5.6 Usage Alerts Table + Service

**Migration** (`migrations/bil-05-usage-alerts.sql`):

```sql
CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  metric TEXT NOT NULL, -- 'ai_actions', 'email_sends', 'automation_runs', 'file_storage'
  threshold INTEGER NOT NULL, -- 80 or 100
  period_start TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  UNIQUE(agency_id, metric, threshold, period_start)
);
```

Send alerts via:

- In-app notification (Toast + notification bell)
- Email to agency owner (Resend — NOT counted toward their quota)

**Files Modified**: `src/lib/paddle/usage-tracker.ts`, `src/lib/email/resend-client.ts`
**Files Created**: `src/lib/paddle/email-usage.ts`, `src/lib/paddle/storage-tracker.ts`, `src/lib/paddle/plan-enforcer.ts`, `migrations/bil-05-usage-alerts.sql`

---

### Phase BIL-06: Plan Upgrades & Downgrades

**Goal**: Let agencies change their plan (up or down) with proper proration handling.

#### 6.1 Plan Change Dialog

**File**: `src/components/billing/plan-change-dialog.tsx`

Dialog that shows when "Change Plan" is clicked:

**Upgrade flow:**

1. Show all 3 plans with current plan highlighted
2. When selecting a higher plan: show what they gain (more sites, team, usage)
3. Show prorated price for remainder of current period
4. "Upgrade Now" button → calls Paddle API to change subscription
5. Success toast: "Upgraded to Growth! Changes are effective immediately."

**Downgrade flow:**

1. Show lower plan with warning about what they'll lose
2. Check: do they exceed the lower plan's limits? (e.g., have 8 sites, downgrading to Starter with max 3)
3. If exceeding: show blocker — "You have 8 active sites. Starter allows 3. Please archive 5 sites before downgrading."
4. If not exceeding: "Downgrade to Starter" → takes effect at end of billing period
5. Confirmation: "Your plan will change to Starter on [date]. You'll keep Growth features until then."

#### 6.2 Downgrade Validation

```typescript
export async function validateDowngrade(
  agencyId: string,
  targetPlan: PlanType,
): Promise<{
  allowed: boolean;
  blockers: Array<{
    resource: string;
    current: number;
    limit: number;
    message: string;
  }>;
}>;
```

Check: sites count, team member count, file storage. Usage quotas don't block downgrades (they just have lower limits next period).

#### 6.3 Update Subscription Service

Add to `src/lib/paddle/subscription-service.ts`:

- Improve `changePlan()` with validation + proration logic
- Add `previewPlanChange(agencyId, newPlan)` → returns price preview without executing
- Ensure webhook handler processes `subscription.updated` with plan changes correctly

#### 6.4 Update Webhook Handler

When `subscription.updated` fires with a different price → detect upgrade vs downgrade → log to `subscription_events` → send confirmation email → update `agencies.subscription_plan` column.

**Files Modified**: `src/lib/paddle/subscription-service.ts`, `src/lib/paddle/webhook-handlers.ts`, `src/lib/paddle/billing-actions.ts`
**Files Created**: `src/components/billing/plan-change-dialog.tsx`

---

### Phase BIL-07: Payment Methods & Cancellation

**Goal**: Let agencies update payment methods and cancel with structured feedback.

#### 7.1 Payment Method Component

**File**: `src/components/billing/payment-method.tsx`

Uses Paddle.js `Paddle.Checkout.open()` with `transactionId` to open the update payment method overlay. Shows:

- Current card: •••• 4242, Exp 08/28
- "Update Payment Method" button

#### 7.2 Cancellation Flow

**File**: `src/components/billing/cancellation-flow.tsx`

Multi-step dialog:

**Step 1 — Save offer** (optional):

- "Before you go..." — offer downgrade to cheaper plan if on Growth/Agency
- "Stay on [current plan]" / "Continue canceling"

**Step 2 — Reason selection:**

- Too expensive
- Not using it enough
- Missing features I need
- Found a better alternative
- Temporary — I'll be back
- Other (free text)

**Step 3 — Confirmation:**

- "Your subscription will remain active until [end of period]"
- "You'll lose access to: [features list]"
- "Cancel Subscription" (red button) / "Keep Subscription"

**Step 4 — Post-cancel:**

- "Sorry to see you go. Your access continues until [date]."
- Optional: "Tell us more about what we could improve" (textarea)

#### 7.3 Cancellation Feedback Table

**Migration** (`migrations/bil-07-cancellation.sql`):

```sql
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  plan_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  monthly_spend_cents INTEGER,
  months_subscribed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7.4 Pause/Resume

Update existing pause/resume in subscription service. Add UI for:

- "Pause Subscription" option in cancel flow (try before cancel)
- Banner when paused: "Your subscription is paused. [Resume] to access all features."
- Resume button re-activates via Paddle API

**Files Modified**: `src/lib/paddle/subscription-service.ts`, `src/lib/paddle/billing-actions.ts`
**Files Created**: `src/components/billing/payment-method.tsx`, `src/components/billing/cancellation-flow.tsx`, `migrations/bil-07-cancellation.sql`

---

### Phase BIL-08: Overage Billing Engine

**Goal**: Calculate overages, report to Paddle metering API, and display overage charges.

#### 8.1 Overage Calculator

Enhance `src/lib/paddle/usage-tracker.ts` with:

```typescript
export async function calculateOverages(agencyId: string): Promise<{
  aiActions: { overage: number; cost: number };
  emailSends: { overage: number; cost: number };
  automationRuns: { overage: number; cost: number };
  fileStorage: { overageMb: number; cost: number };
  totalCostCents: number;
}>;
```

#### 8.2 Overage Reporting to Paddle

Paddle supports usage-based billing via their Metering API. At end of billing period:

1. Calculate total overages for the period
2. Report to Paddle via `paddle.transactionItems.create()` or usage reporting endpoint
3. Paddle adds overage line items to next invoice automatically

**Cron approach**: Daily at midnight, calculate and cache overages. At period end, commit the final number to Paddle.

#### 8.3 Overage Display Component

**File**: `src/components/billing/overage-summary.tsx`

Shows on billing settings page when overages exist:

```
Current Overage Charges (this period)
┌───────────────────────────────────────┐
│ AI Actions:    200 extra × $0.01  $2.00
│ Email Sends:   800 extra × $0.002 $1.60
│ Storage:       2GB extra × $0.50  $1.00
│ ─────────────────────────────────────
│ Estimated overage total:          $4.60
│ (Added to your next invoice)
└───────────────────────────────────────┘
```

#### 8.4 Overage Charges Table

**Migration** (`migrations/bil-08-overages.sql`):

```sql
CREATE TABLE IF NOT EXISTS overage_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  ai_actions_overage INTEGER DEFAULT 0,
  ai_actions_cost_cents INTEGER DEFAULT 0,
  email_sends_overage INTEGER DEFAULT 0,
  email_sends_cost_cents INTEGER DEFAULT 0,
  automation_runs_overage INTEGER DEFAULT 0,
  automation_runs_cost_cents INTEGER DEFAULT 0,
  file_storage_overage_mb INTEGER DEFAULT 0,
  file_storage_cost_cents INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  reported_to_paddle BOOLEAN DEFAULT FALSE,
  paddle_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, period_start)
);
```

**Files Modified**: `src/lib/paddle/usage-tracker.ts`, `src/app/(dashboard)/settings/billing/page.tsx`
**Files Created**: `src/components/billing/overage-summary.tsx`, `migrations/bil-08-overages.sql`

---

### Phase BIL-09: Super Admin Revenue Dashboard

**Goal**: Build comprehensive revenue analytics for the platform operator.

#### 9.1 Enhance Admin Billing Pages

Update `src/app/(dashboard)/admin/billing/page.tsx` and revenue sub-page.

#### 9.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Revenue Overview                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ MRR      │ │ ARR      │ │ Agencies │ │ Churn    │      │
│  │ $4,380   │ │ $52,560  │ │ 100      │ │ 2.1%    │      │
│  │ ↑12%     │ │ ↑12%     │ │ ↑8       │ │ ↓0.3%   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Revenue Chart (last 12 months)                              │
│  [Line chart: MRR growth + churn + net revenue]              │
├─────────────────────────────────────────────────────────────┤
│  Plan Distribution                                           │
│  Starter: 50 (50%) | Growth: 30 (30%) | Agency: 20 (20%)   │
│  [Pie or bar chart]                                          │
├─────────────────────────────────────────────────────────────┤
│  Billing Activity Feed                                       │
│  • Agency "Zambia Web Co" upgraded to Growth — $79/mo        │
│  • Agency "Lusaka Digital" payment failed — retry in 3d      │
│  • Agency "Copperbelt Media" trial started (Growth)          │
│  • Agency "Safari Tech" canceled — reason: "Too expensive"   │
├─────────────────────────────────────────────────────────────┤
│  Trial Funnel                                                │
│  Started: 24 | Active: 8 | Converted: 12 | Expired: 4       │
│  Conversion rate: 75%                                        │
├─────────────────────────────────────────────────────────────┤
│  Platform Costs vs Revenue                                   │
│  Revenue: $4,380 | Paddle: $288 | Variable: $231 |          │
│  Fixed: $170 | Net: $3,691 (84.3%)                          │
├─────────────────────────────────────────────────────────────┤
│  Cancellation Reasons (last 30 days)                         │
│  Too expensive: 3 | Not using: 2 | Better alt: 1            │
└─────────────────────────────────────────────────────────────┘
```

#### 9.3 Revenue Queries

Add server actions to `src/lib/paddle/billing-actions.ts`:

```typescript
// Admin-only actions (super_admin role check)
export async function getRevenueOverview(): Promise<RevenueOverview>;
export async function getMrrHistory(months: number): Promise<MrrDataPoint[]>;
export async function getPlanDistribution(): Promise<PlanDistribution>;
export async function getTrialFunnel(): Promise<TrialFunnel>;
export async function getChurnAnalysis(days: number): Promise<ChurnData>;
export async function getCancellationReasons(
  days: number,
): Promise<CancellationReason[]>;
export async function getPlatformCostEstimate(): Promise<CostEstimate>;
```

#### 9.4 Admin Components

Update existing `src/components/admin/billing-overview.tsx` + `billing-activity.tsx` with v5 metrics.

**Files Modified**: `src/app/(dashboard)/admin/billing/page.tsx`, `src/app/(dashboard)/admin/billing/revenue/page.tsx`, `src/components/admin/billing-overview.tsx`, `src/components/admin/billing-activity.tsx`, `src/lib/paddle/billing-actions.ts`

---

### Phase BIL-10: Chiko AI Business Assistant

**Goal**: Build the AI business intelligence assistant that queries all module data.

#### 10.1 Architecture

```
User asks question → API route → Query Builder (generates SQL per module) →
Execute queries → Build context (2K tokens) → Claude Haiku 4.5 →
Natural language response + optional chart data → Display in chat UI
```

#### 10.2 Query Builder

**File**: `src/components/chiko/chiko-query-builder.ts`

Maps natural language intents to module-specific Supabase queries:

```typescript
export type ChikoQueryCategory =
  | "revenue" // Invoicing + E-Commerce totals
  | "bookings" // Booking module stats
  | "clients" // CRM module stats
  | "orders" // E-Commerce order stats
  | "chat" // Live Chat stats
  | "marketing" // Marketing campaign stats
  | "general"; // Cross-module overview

export async function buildQueryContext(
  agencyId: string,
  question: string,
  category: ChikoQueryCategory,
): Promise<string> {
  // Returns structured text context (max ~2000 tokens)
  // that Claude can use to answer the question
}
```

Each category queries specific tables:

- **revenue**: `invoices`, `invoice_items`, `orders`, `order_items` → sums, averages, top clients
- **bookings**: `bookings`, `booking_services` → counts, upcoming, revenue
- **clients**: `clients`, `client_sites` → new, churned, total, recent activity
- **orders**: `orders`, `order_items`, `products` → volume, top products, AOV
- **chat**: `conversations`, `messages` → volume, response time, satisfaction
- **marketing**: `campaigns`, `campaign_analytics` → open rates, click rates, sends
- **general**: Queries all of the above, returns summary from each

All queries MUST be scoped by `agency_id`. Use the Supabase service role client to bypass RLS (server-side only).

#### 10.3 AI Chat API Endpoint

**File**: `src/app/api/chiko/route.ts`

```typescript
export const maxDuration = 60;

export async function POST(req: Request) {
  // 1. Auth check — get user + agency
  // 2. Check AI usage limit (counts toward ai_actions quota)
  // 3. Classify question category
  // 4. Build context via query builder
  // 5. Call Claude Haiku 4.5 with system prompt + context + user question
  // 6. Return response (text + optional structured data for charts)
  // 7. Record AI action usage
}
```

**System prompt for Claude:**

```
You are Chiko, the AI business assistant for DRAMAC CMS.
You help agency owners and managers understand their business data.
You have access to real-time data from all modules: CRM, Invoicing, E-Commerce, Booking, Live Chat, Marketing, and Social Media.
Answer questions concisely with specific numbers. Use the Zambian Kwacha (K) for currency.
If data is not available for what they asked, say so honestly.
Never make up numbers — only use the data provided to you.
When comparing periods, state both numbers and the percentage change.
```

#### 10.4 Chat UI

**File**: `src/components/chiko/chiko-chat.tsx`

Slide-out panel or dedicated page at `/dashboard/chiko`:

```
┌─────────────────────────────────────────┐
│  🤖 Chiko — Business Assistant           │
│  ─────────────────────────────────────── │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 🤖 Hello! I'm Chiko, your AI       │  │
│  │ business assistant. Ask me about    │  │
│  │ your revenue, bookings, clients,    │  │
│  │ orders, or anything else!           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Quick actions:                          │
│  [Revenue Summary] [This Week's         │
│   Bookings] [Outstanding Invoices]      │
│  [Top Products] [Client Overview]       │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 👤 What's my revenue this month?    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 🤖 Your total revenue for July is   │  │
│  │ K12,500:                            │  │
│  │ • Invoicing: K8,000 (64%)           │  │
│  │   - Paid: K6,500 | Outstanding:     │  │
│  │     K1,500                          │  │
│  │ • E-Commerce: K4,500 (36%)          │  │
│  │   - 23 orders, AOV: K195.65         │  │
│  │                                      │  │
│  │ This is 15% higher than June        │  │
│  │ (K10,870). Nice growth! 📈          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌──────────────────────────┐ [Send]     │
│  │ Type a question...       │            │
│  └──────────────────────────┘            │
└─────────────────────────────────────────┘
```

#### 10.5 Conversation History Table

**Migration** (`migrations/bil-10-chiko.sql`):

```sql
CREATE TABLE IF NOT EXISTS chiko_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  messages JSONB NOT NULL DEFAULT '[]',
  -- Each message: { role: 'user' | 'assistant', content: string, timestamp: string }
  title TEXT, -- Auto-generated from first question
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE chiko_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON chiko_conversations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own conversations" ON chiko_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own conversations" ON chiko_conversations
  FOR UPDATE USING (user_id = auth.uid());
```

#### 10.6 Dashboard Integration

Add Chiko to the main dashboard navigation:

- Nav item: "Chiko AI" with sparkle icon
- Also accessible as a floating button (toggle)
- Quick suggest buttons based on installed modules

**Files Created**: `src/components/chiko/chiko-chat.tsx`, `src/components/chiko/chiko-query-builder.ts`, `src/app/api/chiko/route.ts`, `src/app/(dashboard)/dashboard/chiko/page.tsx`, `migrations/bil-10-chiko.sql`
**Files Modified**: `src/config/navigation.ts`, `src/lib/paddle/billing-actions.ts`

---

## Cross-Phase Integration Reference

### Files Modified Across Multiple Phases

| File                                            | Phases                         | Changes                                   |
| ----------------------------------------------- | ------------------------------ | ----------------------------------------- |
| `src/lib/paddle/client.ts`                      | BIL-01                         | Complete rewrite of PLAN_CONFIGS          |
| `src/lib/paddle/usage-tracker.ts`               | BIL-05, BIL-08                 | Add email/storage tracking + overage calc |
| `src/lib/paddle/subscription-service.ts`        | BIL-03, BIL-06, BIL-07         | Trial methods + plan change + cancel      |
| `src/lib/paddle/billing-actions.ts`             | BIL-03, BIL-06, BIL-07, BIL-09 | Trial actions, plan change, admin queries |
| `src/lib/paddle/webhook-handlers.ts`            | BIL-03, BIL-06                 | Trial handling + plan change events       |
| `src/app/(dashboard)/settings/billing/page.tsx` | BIL-04, BIL-08                 | Full layout + overage display             |
| `src/config/navigation.ts`                      | BIL-10                         | Add Chiko nav item                        |

### Environment Variable Additions

| Variable                                  | Phase  | Purpose                        |
| ----------------------------------------- | ------ | ------------------------------ |
| `PADDLE_PRODUCT_GROWTH`                   | BIL-01 | New Growth tier product        |
| `PADDLE_PRODUCT_AGENCY`                   | BIL-01 | Renamed from Pro to Agency     |
| `NEXT_PUBLIC_PADDLE_PRICE_GROWTH_MONTHLY` | BIL-01 | Growth $79/mo price            |
| `NEXT_PUBLIC_PADDLE_PRICE_GROWTH_YEARLY`  | BIL-01 | Growth $790/yr price           |
| `NEXT_PUBLIC_PADDLE_PRICE_AGENCY_MONTHLY` | BIL-01 | Agency $149/mo price           |
| `NEXT_PUBLIC_PADDLE_PRICE_AGENCY_YEARLY`  | BIL-01 | Agency $1,490/yr price         |
| `PADDLE_PRICE_AI_OVERAGE`                 | BIL-08 | AI overage meter price         |
| `PADDLE_PRICE_EMAIL_OVERAGE`              | BIL-08 | Email overage meter price      |
| `PADDLE_PRICE_AUTOMATION_OVERAGE`         | BIL-08 | Automation overage meter price |
| `PADDLE_PRICE_STORAGE_OVERAGE`            | BIL-08 | Storage overage meter price    |
| `NEXT_PUBLIC_PADDLE_SELLER_ID`            | BIL-01 | For client-side Paddle.js      |

### Database Migrations (In Order)

| Migration                 | Phase  | Tables/Columns                                       |
| ------------------------- | ------ | ---------------------------------------------------- |
| `bil-01-pricing-v5.sql`   | BIL-01 | `agencies` new columns + `subscription_events` table |
| `bil-03-trials.sql`       | BIL-03 | `trial_tracking` table                               |
| `bil-05-usage-alerts.sql` | BIL-05 | `usage_alerts` table                                 |
| `bil-07-cancellation.sql` | BIL-07 | `cancellation_feedback` table                        |
| `bil-08-overages.sql`     | BIL-08 | `overage_charges` table                              |
| `bil-10-chiko.sql`        | BIL-10 | `chiko_conversations` table                          |

---

## Testing Requirements

### Per-Phase Verification

Every phase MUST pass:

1. `npx tsc --noEmit --skipLibCheck` — zero TypeScript errors
2. `npx next build` — successful production build
3. Manual verification of key UI flows

### Integration Test Scenarios

| Scenario                                                                                            | Phases Involved           |
| --------------------------------------------------------------------------------------------------- | ------------------------- |
| New agency signup → select Growth → trial starts → 14 days → converts to paid                       | BIL-01, BIL-02, BIL-03    |
| Agency reaches 80% email usage → alert shown → exceeds 100% → overage tracked                       | BIL-05, BIL-08            |
| Agency on Starter → clicks "Upgrade" → selects Growth → Paddle checkout → plan changes              | BIL-02, BIL-06            |
| Agency on Agency → tries downgrade to Starter with 15 sites → blocked → archives sites → downgrades | BIL-06                    |
| Agency cancels → retention offer → selects reason → cancels at period end → resubscribes later      | BIL-07                    |
| Payment fails → dunning emails → payment recovers after retry 2                                     | BIL-07 (existing dunning) |
| Super admin views MRR → sees plan distribution → reviews churn → reads cancel reasons               | BIL-09                    |
| Agency owner asks Chiko "What's my revenue?" → gets cross-module answer                             | BIL-10                    |

---

## Appendix: Current Paddle Sandbox Products

These exist in the Paddle sandbox and may need to be recreated for v5:

| Entity                 | Current Value              | Status                                         |
| ---------------------- | -------------------------- | ---------------------------------------------- |
| Product: Starter       | `pro_01kfwy...` ($29)      | **Replace** with $29 product (new)             |
| Product: Pro           | `pro_01kfwz...` ($99)      | **Rename to Agency** — create new $149 product |
| Price: Starter Monthly | `pri_01kfwz0...` ($29/mo)  | **Keep** $29/mo (same price)                   |
| Price: Starter Yearly  | `pri_01kfwz5...` ($290/yr) | **Keep** $290/yr (same price)                  |
| Price: Pro Monthly     | `pri_01kfwzb...` ($99/mo)  | **Replace** with $149/mo Agency                |
| Price: Pro Yearly      | `pri_01kfwzd...` ($990/yr) | **Replace** with $1,490/yr Agency              |
| Price: Growth Monthly  | —                          | **Create** $79/mo                              |
| Price: Growth Yearly   | —                          | **Create** $790/yr                             |
| Overage prices         | Not configured             | **Create** all 4                               |
