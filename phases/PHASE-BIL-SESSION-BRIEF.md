# DRAMAC Billing System — Session Brief

**Companion to**: `phases/PHASE-BIL-MASTER-GUIDE.md`  
**Pricing Reference**: `docs/PRICING-STRATEGY-V5.md`  
**Created**: July 2026

---

## Session Plan

| Session | Phases          | Focus                                          | Estimated Scope                                               |
| ------- | --------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| **S1**  | BIL-01 + BIL-02 | Pricing config rewrite + pricing page redesign | Core foundation — new plans, DB schema, public pricing page   |
| **S2**  | BIL-03 + BIL-04 | Checkout, trials + billing dashboard           | Paddle.js checkout, trial service, billing settings page      |
| **S3**  | BIL-05 + BIL-06 | Usage metering + plan changes                  | Email/storage tracking, plan enforcer, upgrade/downgrade      |
| **S4**  | BIL-07 + BIL-08 | Payment/cancellation + overage billing         | Cancel flow, payment methods, overage calculation + reporting |
| **S5**  | BIL-09          | Super admin revenue dashboard                  | Admin analytics, MRR/ARR, plan distribution, churn, costs     |
| **S6**  | BIL-10          | Chiko AI business assistant                    | Query builder, AI endpoint, chat UI, conversation history     |

---

## Universal Session Prompt

Paste this at the start of each session, replacing the `[placeholders]`:

```
I'm continuing work on the DRAMAC Billing System.

STEP 1 — READ CONTEXT:
Read ALL memory bank files:
- /memory-bank/projectbrief.md
- /memory-bank/productContext.md
- /memory-bank/systemPatterns.md
- /memory-bank/techContext.md
- /memory-bank/activeContext.md
- /memory-bank/progress.md

Then read:
- /phases/PHASE-BIL-MASTER-GUIDE.md (complete billing implementation guide)
- /docs/PRICING-STRATEGY-V5.md (pricing numbers and cost model)

STEP 2 — VERIFY PREREQUISITES:
Check what has been completed in previous sessions. Run:
  npx tsc --noEmit --skipLibCheck
to confirm the codebase compiles.

STEP 3 — IMPLEMENT:
Implement [PHASE_NUMBERS] from the master guide:
- [PHASE_NAME_1]
- [PHASE_NAME_2]

Follow the master guide specifications exactly. All prices in cents. Use mapRecord() for Supabase data. All server pages need auth guards.

STEP 4 — VERIFY:
After implementation:
  NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --skipLibCheck
  npx next build
Both must succeed with zero errors.

STEP 5 — UPDATE:
Update memory bank files:
- activeContext.md — what was implemented, decisions made
- progress.md — mark phases complete, note what's next
```

---

## Session-Specific Prompts

### Session 1 — Foundation (BIL-01 + BIL-02)

```
Implement BIL-01 and BIL-02 from the billing master guide.

BIL-01 — Pricing Configuration Rework:
- MANUAL PREREQUISITE: Before coding, I need to create new products/prices in Paddle Sandbox dashboard. Tell me exactly what to create (product names, prices, billing intervals) and I'll give you the IDs.
- Rewrite src/lib/paddle/client.ts: Change PlanType to 'starter' | 'growth' | 'agency', new PLAN_CONFIGS for $29/$79/$149, add email_sends + file_storage to PlanConfig, update OVERAGE_RATES, update all helper functions.
- Create migration bil-01-pricing-v5.sql: Add billing columns to agencies table + subscription_events table.
- Update .env.local with new Paddle IDs.

BIL-02 — Pricing Page Redesign:
- Redesign src/app/pricing/page.tsx for 3-tier layout with Growth as "Most Popular".
- Create src/components/billing/plan-comparison-table.tsx.
- Update pricing-card.tsx and billing-cycle-toggle.tsx.
- Add FAQ section and enterprise CTA.

IMPORTANT: $29 = 2900 cents. All 7 modules on every plan. White-label only on Agency. 14-day trial only for Growth. Zambia locale — use ZMW + K symbol where displaying to end users.
```

### Session 2 — Checkout & Dashboard (BIL-03 + BIL-04)

```
Implement BIL-03 and BIL-04 from the billing master guide.

BIL-03 — Subscription Checkout & Trial:
- Create src/lib/paddle/trial-service.ts (start, expire, convert, extend).
- Create migration bil-03-trials.sql (trial_tracking table).
- Update paddle-client.ts (client-side) for 3-plan checkout + trial checkout.
- Create success page at /settings/billing/success.
- Create trial-banner.tsx component.
- Update webhook handlers for trial events.

BIL-04 — Billing Settings Dashboard:
- Redesign /settings/billing page layout.
- Update usage-dashboard.tsx for 4 metrics (add email + storage).
- Create usage-alerts.tsx component (80%/100% thresholds).
- Update current-plan-card.tsx.

PREREQUISITE: BIL-01 must be complete (3-tier PLAN_CONFIGS exist).
```

### Session 3 — Metering & Plan Changes (BIL-05 + BIL-06)

```
Implement BIL-05 and BIL-06 from the billing master guide.

BIL-05 — Usage Metering & Enforcement:
- Create src/lib/paddle/email-usage.ts — wrap resend-client.ts sendEmail() to count sends per agency.
- Create src/lib/paddle/storage-tracker.ts — track file uploads/deletes.
- Create src/lib/paddle/plan-enforcer.ts — centralized limit checks (sites, team, white-label).
- Update usage-tracker.ts — add email_sends + file_storage_bytes to UsageType.
- Create migration bil-05-usage-alerts.sql (usage_alerts table).
- CRITICAL: The central resend-client.ts sendEmail() must accept agencyId and call trackEmailSend(). This is the BEST integration point — all modules send email through this.

BIL-06 — Plan Upgrades & Downgrades:
- Create src/components/billing/plan-change-dialog.tsx.
- Add validateDowngrade() function — block if exceeding lower plan limits.
- Improve changePlan() in subscription-service.ts.
- Update webhook handlers for plan change events.

PREREQUISITE: BIL-01 through BIL-04 complete.
```

### Session 4 — Payment & Overages (BIL-07 + BIL-08)

```
Implement BIL-07 and BIL-08 from the billing master guide.

BIL-07 — Payment Methods & Cancellation:
- Create src/components/billing/payment-method.tsx (Paddle.js update card).
- Create src/components/billing/cancellation-flow.tsx (4-step: save offer → reason → confirm → done).
- Create migration bil-07-cancellation.sql (cancellation_feedback table).
- Add pause/resume UI (banner when paused).

BIL-08 — Overage Billing Engine:
- Add calculateOverages() to usage-tracker.ts.
- Create src/components/billing/overage-summary.tsx.
- Create migration bil-08-overages.sql (overage_charges table).
- Implement Paddle metering API reporting.

PREREQUISITE: BIL-05 (usage metering) must be complete.
```

### Session 5 — Admin Dashboard (BIL-09)

```
Implement BIL-09 from the billing master guide.

BIL-09 — Super Admin Revenue Dashboard:
- Enhance /admin/billing with full revenue overview (MRR, ARR, agencies, churn).
- Add revenue chart (last 12 months), plan distribution, trial funnel.
- Add billing activity feed, cancellation reasons breakdown.
- Add platform costs vs revenue comparison.
- Add admin-only server actions: getRevenueOverview, getMrrHistory, getPlanDistribution, getTrialFunnel, getChurnAnalysis, getCancellationReasons.

PREREQUISITE: All prior phases complete (BIL-01 through BIL-08).
```

### Session 6 — Chiko AI Assistant (BIL-10)

```
Implement BIL-10 from the billing master guide.

BIL-10 — Chiko AI Business Assistant:
- Create src/components/chiko/chiko-query-builder.ts — maps questions to module queries (revenue, bookings, clients, orders, chat, marketing).
- Create src/app/api/chiko/route.ts — API endpoint with Claude Haiku 4.5, maxDuration=60.
- Create src/components/chiko/chiko-chat.tsx — chat UI with quick action buttons.
- Create /dashboard/chiko page.
- Create migration bil-10-chiko.sql (chiko_conversations table).
- Add Chiko to navigation config.
- All queries scoped by agency_id. Each AI call counts toward ai_actions quota. The AI's name is Chiko (NOT Chico).
- System prompt: Zambian locale, K currency, honest about missing data, never fabricates numbers.

PREREQUISITE: BIL-05 (usage tracking for ai_actions) must be complete.
```

---

## Rules

1. **Read the master guide first** — every session starts by reading PHASE-BIL-MASTER-GUIDE.md
2. **Follow phase order** — BIL-01 must come before BIL-02, etc.
3. **All prices in cents** — $29 = 2900, never use floating point for money
4. **TypeScript first** — zero `any` types unless absolutely unavoidable
5. **Auth guards everywhere** — every server page, every server action
6. **Test thoroughly** — TypeScript check + build must both pass
7. **Update memory bank** — after every session, update activeContext.md + progress.md
8. **Don't modify the master guide** — it's the north star. Only update memory bank.
9. **Paddle IDs are manual** — you cannot create Paddle products via code. Ask the user.
10. **White-label = Agency only** — `isWhiteLabelEnabled()` returns `planType === 'agency'`

---

## If Session Runs Long

If you're running out of context, paste this:

```
We're running low on context. Let's wrap up cleanly:
1. Finish the current file you're editing
2. Run tsc check and next build to verify
3. Commit what's done: git add -A && git commit -m "feat: Phase BIL-XX — [partial]"
4. Update memory bank with what was completed vs what's remaining
5. Tell me exactly what's left so I can continue in a new session
```

---

## Continuation Session

If a session ended mid-phase, paste this:

```
I'm continuing from a previous billing session that was interrupted.

1. Read ALL memory bank files (especially activeContext.md and progress.md)
2. Read /phases/PHASE-BIL-MASTER-GUIDE.md
3. Check progress.md for what was completed vs what's remaining
4. Run npx tsc --noEmit --skipLibCheck to see current state
5. Continue from where we left off — don't redo completed work
```

---

## Dependency Graph

```
BIL-01 (Config) ─────┬──→ BIL-02 (Pricing Page)
                      │
                      ├──→ BIL-03 (Checkout/Trial) ──→ BIL-04 (Dashboard)
                      │
                      └──→ BIL-05 (Metering) ──┬──→ BIL-06 (Plan Changes)
                                                │
                                                ├──→ BIL-08 (Overages)
                                                │
                                                └──→ BIL-10 (Chiko AI)

BIL-07 (Payment/Cancel) ← depends on BIL-03
BIL-09 (Admin Dashboard) ← depends on BIL-01 through BIL-08
```

All phases depend on BIL-01. Sessions are ordered to respect these dependencies.
