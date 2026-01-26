# Phase EM-59A: Paddle Billing Integration - COMPLETE

**Completed**: January 26, 2026  
**Status**: ✅ Fully Implemented and TypeScript Verified

## Overview

Phase EM-59A implements Paddle Billing as the primary payment provider for DRAMAC CMS, replacing LemonSqueezy to enable Zambia-compatible payouts via Payoneer/Wise.

### Why Paddle?

- **Zambia Support**: Paddle supports payouts to Zambia via Payoneer/Wise
- **LemonSqueezy Limitation**: LemonSqueezy does NOT support Zambia payouts
- **Merchant of Record**: Paddle handles tax compliance globally
- **Usage-Based Billing**: Native support for hybrid subscription + usage pricing

### Payment Flow

```
Customer → Paddle → Payoneer/Wise → Zambia Bank Account
```

## Files Created

### Database Migration
- `migrations/em-59a-paddle-billing.sql` - Complete schema

### Core Library Files
```
src/lib/paddle/
├── client.ts              # Paddle SDK initialization
├── paddle-client.ts       # Frontend Paddle.js integration
├── subscription-service.ts # Subscription lifecycle
├── usage-tracker.ts       # Usage tracking & overages
├── webhook-handlers.ts    # Process Paddle webhooks
├── billing-actions.ts     # Server actions
└── index.ts               # Module exports
```

### API Routes
```
src/app/api/
├── webhooks/paddle/route.ts           # Webhook endpoint
└── billing/paddle/
    ├── route.ts                       # Billing status
    ├── subscription/route.ts          # Subscription management
    ├── usage/route.ts                 # Usage tracking
    └── invoices/route.ts              # Invoice history
```

### Documentation
- `docs/PADDLE-BILLING-SETUP.md` - Comprehensive setup guide

### Environment Configuration
- `.env.example` - Updated with Paddle environment variables

## Database Tables Created

| Table | Purpose |
|-------|---------|
| `paddle_customers` | Customer sync with Paddle |
| `paddle_subscriptions` | Subscription state and limits |
| `paddle_transactions` | Payment history |
| `paddle_products` | Product catalog sync |
| `paddle_webhooks` | Webhook logging and replay |
| `usage_hourly` | Hourly usage aggregation |
| `usage_daily` | Daily usage totals |
| `usage_billing_period` | Period summary for billing |

## Pricing Model

### Plans

| Plan | Monthly | Automation Runs | AI Actions | API Calls |
|------|---------|-----------------|------------|-----------|
| Starter | $29 | 1,000 | 500 | 10,000 |
| Pro | $99 | 5,000 | 2,500 | 50,000 |

### Overage Pricing

| Metric | Price |
|--------|-------|
| Automation Run | $0.01/run |
| AI Action | $0.02/action |
| API Call | $0.001/call |

## Key Features

### 1. Paddle SDK Integration
- Server-side client with environment detection
- Automatic sandbox/production switching
- Customer and subscription management
- Price preview with localization

### 2. Frontend Checkout
- Paddle.js overlay checkout
- Custom checkout configuration
- Checkout event handling
- Post-purchase callbacks

### 3. Subscription Lifecycle
- Create new subscriptions
- Update payment methods
- Pause/resume subscriptions
- Cancel with immediate or end-of-period options
- Plan upgrades/downgrades with proration

### 4. Usage Tracking
- Real-time usage recording
- Hourly and daily aggregation
- Overage detection and alerts
- Usage by site breakdown
- Historical usage reports

### 5. Webhook Processing
- All Paddle event types supported
- Idempotent processing
- Webhook logging for replay
- Automation event emission

### 6. Billing Actions (Server Actions)
```typescript
// Available actions
createCheckoutSession(agencyId, planId)
cancelSubscription(agencyId, immediate?)
pauseSubscription(agencyId)
resumeSubscription(agencyId)
updatePaymentMethod(agencyId)
changePlan(agencyId, newPlanId, prorate?)
getCurrentUsage(agencyId)
getInvoiceHistory(agencyId)
previewPlanChange(agencyId, newPlanId)
```

## Automation Events Integration

22 billing events added to the automation engine:

### Subscription Events
- `subscription.created`
- `subscription.activated`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.paused`
- `subscription.resumed`
- `subscription.past_due`
- `subscription.trial_started`
- `subscription.trial_ended`
- `subscription.plan_changed`

### Payment Events
- `payment.completed`
- `payment.failed`
- `payment.refunded`
- `payment.disputed`

### Invoice Events
- `invoice.created`
- `invoice.paid`
- `invoice.overdue`

### Usage Events
- `usage.threshold_reached` (80% of limits)
- `usage.limit_exceeded` (100% of limits)
- `usage.overage_incurred`

### Customer Events
- `customer.created`
- `customer.updated`

## Environment Variables

```bash
# Paddle API
PADDLE_API_KEY=                        # Server-side API key
PADDLE_WEBHOOK_SECRET=                 # Webhook signature validation

# Paddle Client
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox # sandbox or production
NEXT_PUBLIC_PADDLE_SELLER_ID=          # Your seller ID
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=       # Frontend client token

# Optional Product/Price IDs
PADDLE_PRODUCT_STARTER=
PADDLE_PRODUCT_PRO=
PADDLE_PRICE_STARTER_MONTHLY=
PADDLE_PRICE_STARTER_YEARLY=
PADDLE_PRICE_PRO_MONTHLY=
PADDLE_PRICE_PRO_YEARLY=
```

## Setup Instructions

1. **Create Paddle Account**: Sign up at paddle.com
2. **Configure Products**: Create Starter and Pro products
3. **Set Prices**: Configure monthly/yearly prices
4. **Generate API Keys**: Create server and client tokens
5. **Configure Webhooks**: Point to `/api/webhooks/paddle`
6. **Run Migration**: Apply `em-59a-paddle-billing.sql`
7. **Set Environment Variables**: Add all Paddle variables
8. **Test in Sandbox**: Verify checkout flow

See `docs/PADDLE-BILLING-SETUP.md` for detailed instructions.

## TypeScript Type Handling

Due to Supabase types not including the new Paddle tables until migration is run:

1. **paddleTable() Helper**: Used for accessing tables not in types
   ```typescript
   function paddleTable(supabase: any, table: string) {
     return (supabase as any).from(table);
   }
   ```

2. **RPC Casts**: RPC functions cast to `any` for new functions
3. **Update Types**: After running migration, regenerate types with:
   ```bash
   pnpm supabase gen types typescript --local > src/types/database.types.ts
   ```

## Testing

### Manual Testing
1. Set `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox`
2. Use Paddle sandbox credit cards
3. Test checkout flow
4. Verify webhook processing
5. Check usage tracking

### Webhook Testing
```bash
# Use Paddle CLI to simulate webhooks
paddle webhooks simulate subscription.created
```

## Integration with Existing System

- **Replaces**: LemonSqueezy (marked deprecated in .env.example)
- **Integrates with**: 
  - EM-57 Automation Engine (22 new events)
  - Multi-tenant system (agency-scoped subscriptions)
  - Usage tracking (API calls, automation runs, AI actions)

## Next Steps

1. **Run Migration**: Deploy `em-59a-paddle-billing.sql` to production
2. **Regenerate Types**: Update Supabase types after migration
3. **Configure Paddle**: Set up products and prices in dashboard
4. **Test End-to-End**: Complete checkout and webhook flow
5. **Migrate Users**: Move existing LemonSqueezy customers (if any)

## Files Modified

- `src/modules/automation/lib/event-types.ts` - Added 22 billing events
- `.env.example` - Added Paddle environment variables

## Verification

```bash
# TypeScript check passes
pnpm tsc --noEmit

# Build succeeds
pnpm build
```

✅ All TypeScript errors resolved  
✅ Build completes successfully  
✅ No runtime imports broken
