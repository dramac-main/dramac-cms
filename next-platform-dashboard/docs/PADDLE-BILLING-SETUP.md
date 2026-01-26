# Phase EM-59A: Paddle Billing Integration

## Overview

DRAMAC CMS uses **Paddle** as the Merchant of Record (MoR) for handling subscription billing. This enables:

- **Zambia-compatible payouts** via Payoneer or Wise
- **Automatic sales tax/VAT handling** (Paddle handles this)
- **Hybrid pricing model** - Subscription + Usage-based billing
- **Metered billing** for API calls, storage, automations, etc.

## Environment Variables

Add these to your `.env.local` file:

```bash
# Paddle API Configuration
# Get these from: https://vendors.paddle.com/authentication

# REQUIRED: Your Paddle API key (Classic or Billing API)
PADDLE_API_KEY=your_paddle_api_key_here

# REQUIRED: Webhook secret for verifying webhook signatures
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here

# OPTIONAL: Override for sandbox testing (default: production)
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# OPTIONAL: Your Paddle Seller ID (for client-side initialization)
NEXT_PUBLIC_PADDLE_SELLER_ID=your_seller_id_here

# OPTIONAL: Client token for client-side SDK (alternative to seller ID)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_client_token_here
```

## Paddle Dashboard Setup

### 1. Create Products and Prices

In your Paddle dashboard, create the following products:

#### Starter Plan ($29/month)
- Product Name: `DRAMAC Starter`
- Price: $29.00 USD/month
- Price ID: Update `PADDLE_IDS.prices.starter_monthly` in `src/lib/paddle/client.ts`

#### Pro Plan ($99/month)
- Product Name: `DRAMAC Pro`
- Price: $99.00 USD/month
- Price ID: Update `PADDLE_IDS.prices.pro_monthly` in `src/lib/paddle/client.ts`

#### Enterprise Plan (Custom pricing)
- Product Name: `DRAMAC Enterprise`
- Contact sales for pricing

#### Usage-Based Add-ons
Create quantity-based products for:
- API Calls (per 1,000)
- Storage (per GB)
- Automation Runs (per 100)
- Email Sends (per 1,000)
- Team Members (per seat)

### 2. Configure Webhooks

1. Go to **Developers** → **Webhooks** in Paddle dashboard
2. Add a new webhook destination:
   - **URL**: `https://your-domain.com/api/webhooks/paddle`
   - **Events to subscribe to**:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.paused`
     - `subscription.resumed`
     - `subscription.activated`
     - `subscription.past_due`
     - `subscription.trialing`
     - `transaction.completed`
     - `transaction.payment_failed`
     - `transaction.refunded`
     - `customer.created`
     - `customer.updated`

3. Copy the webhook secret and add it to your environment variables

### 3. Test in Sandbox Mode

1. Set `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox`
2. Use Paddle's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Database Migration

Run the migration to create Paddle billing tables:

```bash
# Using Supabase CLI
supabase db push migrations/em-59-paddle-billing.sql

# Or via Supabase Dashboard
# Go to SQL Editor and run the contents of the migration file
```

## Plan Configuration

The plan configuration is defined in `src/lib/paddle/client.ts`:

```typescript
export const PLAN_CONFIGS = {
  free: {
    name: 'Free',
    limits: {
      api_calls: 1000,
      storage_mb: 100,
      automation_runs: 50,
      email_sends: 100,
      team_members: 1,
    }
  },
  starter: {
    name: 'Starter',
    price_monthly: 29,
    limits: {
      api_calls: 50000,
      storage_mb: 5000,
      automation_runs: 1000,
      email_sends: 10000,
      team_members: 3,
    }
  },
  pro: {
    name: 'Pro',
    price_monthly: 99,
    limits: {
      api_calls: 500000,
      storage_mb: 50000,
      automation_runs: 10000,
      email_sends: 100000,
      team_members: 10,
    }
  },
  // ...
}
```

## Usage Tracking

Usage is tracked automatically and aggregated hourly/daily. The system checks for:
- **Soft limits**: Warning at 80% usage (triggers automation event)
- **Hard limits**: Overage charges applied beyond plan limits

### Usage Metrics Tracked
| Metric | Unit | Overage Rate |
|--------|------|--------------|
| API Calls | per 1,000 | $0.50 |
| Storage | per GB | $0.10 |
| Automation Runs | per 100 | $1.00 |
| Email Sends | per 1,000 | $2.00 |
| Team Members | per seat | $5.00 |

## API Endpoints

### Checkout
```
POST /api/billing/paddle/checkout
Body: { plan: 'starter' | 'pro' }
```

### Subscription Management
```
GET /api/billing/paddle/subscription
DELETE /api/billing/paddle/subscription (cancel)
PATCH /api/billing/paddle/subscription
Body: { action: 'pause' | 'resume' | 'change_plan', newPlan?: string }
```

### Usage
```
GET /api/billing/paddle/usage
GET /api/billing/paddle/usage?metric=api_calls
```

### Invoices
```
GET /api/billing/paddle/invoices
GET /api/billing/paddle/invoices?limit=10
```

## Client-Side Checkout

```typescript
import { openCheckoutForPlan } from '@/lib/paddle/paddle-client'

// Open Paddle checkout overlay
await openCheckoutForPlan('pro', {
  agencyId: 'agency-uuid',
  userId: 'user-uuid',
  email: 'customer@example.com'
})
```

## Automation Events

The billing system emits events for automation workflows:

| Event | Description |
|-------|-------------|
| `billing.subscription.created` | New subscription created |
| `billing.subscription.activated` | Subscription became active |
| `billing.subscription.cancelled` | Subscription cancelled |
| `billing.subscription.paused` | Subscription paused |
| `billing.subscription.resumed` | Subscription resumed |
| `billing.subscription.past_due` | Payment overdue |
| `billing.subscription.plan_changed` | Plan upgraded/downgraded |
| `billing.payment.completed` | Payment successful |
| `billing.payment.failed` | Payment failed |
| `billing.payment.refunded` | Payment refunded |
| `billing.usage.threshold_reached` | Usage at 80% of limit |
| `billing.usage.limit_exceeded` | Usage exceeded limit |
| `billing.usage.overage_incurred` | Overage charges applied |

## Server Actions (for Server Components)

```typescript
import {
  getAgencySubscriptionPaddle,
  getBillingOverviewPaddle,
  cancelSubscriptionPaddle,
  changeSubscriptionPlanPaddle,
  getAgencyUsagePaddle,
} from '@/lib/paddle'

// In a Server Component
const subscription = await getAgencySubscriptionPaddle(agencyId)
const overview = await getBillingOverviewPaddle(agencyId)
const usage = await getAgencyUsagePaddle(agencyId)
```

## Troubleshooting

### Webhook Signature Verification Failed
- Ensure `PADDLE_WEBHOOK_SECRET` is correctly set
- Verify the webhook URL is accessible publicly
- Check Paddle dashboard for failed webhook deliveries

### Checkout Not Opening
- Verify `NEXT_PUBLIC_PADDLE_SELLER_ID` is set
- Check browser console for Paddle.js errors
- Ensure products and prices exist in Paddle dashboard

### Usage Not Updating
- Check that usage aggregation cron jobs are running
- Verify `increment_usage()` function is being called
- Check Supabase function logs for errors

## Files Created

| File | Purpose |
|------|---------|
| `migrations/em-59-paddle-billing.sql` | Database schema |
| `src/lib/paddle/client.ts` | Paddle SDK initialization |
| `src/lib/paddle/subscription-service.ts` | Subscription management |
| `src/lib/paddle/usage-tracker.ts` | Usage tracking & billing |
| `src/lib/paddle/webhook-handlers.ts` | Webhook event processing |
| `src/lib/paddle/paddle-client.ts` | Frontend Paddle.js client |
| `src/lib/paddle/billing-actions.ts` | Server actions |
| `src/lib/paddle/index.ts` | Module exports |
| `src/app/api/webhooks/paddle/route.ts` | Webhook endpoint |
| `src/app/api/billing/paddle/*/route.ts` | Billing API endpoints |

## Next Steps

1. **Configure Paddle Products**: Create products and prices in Paddle dashboard
2. **Update Price IDs**: Set correct `PADDLE_IDS` in `src/lib/paddle/client.ts`
3. **Set Environment Variables**: Add all Paddle credentials
4. **Run Migration**: Deploy database schema changes
5. **Configure Webhooks**: Set up webhook endpoint in Paddle
6. **Test in Sandbox**: Verify checkout and subscription flows
7. **Go Live**: Switch to production environment
