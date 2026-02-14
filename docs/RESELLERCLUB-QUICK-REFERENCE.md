# ResellerClub Integration - Quick Reference

## Architecture Overview

```
User Request (Domain/Email Purchase)
    ↓
Create Pending Purchase + Paddle Transaction
    ↓
Redirect to Paddle Checkout
    ↓
User Completes Payment
    ↓
Paddle Webhook → transaction.completed
    ↓
Provisioning Service → ResellerClub API
    ↓
Create Domain/Email in Platform DB
    ↓
Update Pending Purchase → completed
```

## Pricing Strategy

### Default Behavior (Recommended)
- **Retail Price**: ResellerClub customer pricing (includes RC markups)
- **Wholesale Price**: ResellerClub cost pricing
- **Platform Markup**: Disabled by default
- **Result**: User pays exactly what ResellerClub shows in control panel

### Optional: Additional Platform Markup
Set in `agency_domain_pricing`:
```sql
pricing_source = 'resellerclub_customer'
apply_platform_markup = true
default_markup_type = 'percentage'
default_markup_value = 10  -- 10% additional markup
```

## API Endpoints

### Manual Pricing Refresh
```http
POST /api/admin/pricing/refresh
Authorization: Bearer <user-token>

{
  "syncType": "full",  // "domain", "email", or "full"
  "pricingTypes": ["customer", "cost"]
}
```

### Check Pricing Status
```http
GET /api/admin/pricing/refresh
Authorization: Bearer <user-token>
```

### Scheduled Reconciliation (Cron)
```http
GET /api/cron/resellerclub-sync
Authorization: Bearer <CRON_SECRET>
```

## Database Tables

### Pricing Cache
- `domain_pricing_cache` - TLD pricing by type (customer, cost, reseller)
- `email_pricing_cache` - Business Email pricing by product/months
- `pricing_sync_log` - Audit trail

### Transactions
- `pending_purchases` - Tracks purchases from payment to provisioning
- Extended `domain_orders` with `pending_purchase_id`, `idempotency_key`
- Extended `email_orders` with `pending_purchase_id`, `idempotency_key`

### Sync Tracking
- Added `resellerclub_last_synced_at` to `domains`
- Added `resellerclub_last_synced_at` to `email_orders`

## Service Methods

### Pricing
```typescript
import { pricingCacheService } from '@/lib/resellerclub/pricing-cache';

// Refresh domain pricing
await pricingCacheService.refreshDomainPricing(customerId, ['customer', 'cost']);

// Refresh email pricing
await pricingCacheService.refreshEmailPricing(customerId, ['customer', 'cost']);

// Get cached price with fallback
const price = await pricingCacheService.getCachedDomainPrice(
  '.com',
  customerId,
  'customer',
  24 // max age in hours
);

// Check if cache is stale
const isStale = await pricingCacheService.isCacheStale('domain', 24);
```

### Transactions
```typescript
import { createDomainPurchase, createEmailPurchase } from '@/lib/paddle/transactions';

// Create domain purchase
const purchase = await createDomainPurchase({
  agencyId: 'uuid',
  userId: 'uuid',
  purchaseType: 'domain_register',
  domainName: 'example.com',
  years: 1,
  tld: '.com',
  wholesaleAmount: 9.99,
  retailAmount: 12.99,
  currency: 'USD',
});

// Redirect user to purchase.checkoutUrl
```

### Provisioning
```typescript
import { 
  provisionDomainRegistration,
  provisionDomainRenewal,
  provisionEmailOrder 
} from '@/lib/resellerclub/provisioning';

// Called automatically by webhook
const result = await provisionDomainRegistration(pendingPurchaseId);

if (result.success) {
  console.log('Domain provisioned:', result.resourceId);
} else {
  console.error('Provisioning failed:', result.error);
}
```

### Reconciliation
```typescript
import { reconcileAgency } from '@/lib/resellerclub/reconciliation';

const result = await reconcileAgency(agencyId);

console.log('Domains checked:', result.domainsChecked);
console.log('Domains updated:', result.domainsUpdated);
console.log('Discrepancies:', result.discrepancies);
```

## Webhook Flow

### Paddle Webhook Event: `transaction.completed`

1. **Detection**:
   - Check `event.data.customData.purchase_type`
   - If domain/email purchase → route to `handleDomainEmailPurchaseCompleted`

2. **Idempotency Check**:
   - Get `pending_purchase` by `paddle_transaction_id`
   - If `status === 'completed'` → skip (already processed)

3. **Update Status**:
   - Set `pending_purchase.status = 'paid'`

4. **Provision**:
   - Based on `purchase_type`:
     - `domain_register` → `provisionDomainRegistration()`
     - `domain_renew` → `provisionDomainRenewal()`
     - `email_order` → `provisionEmailOrder()`

5. **Complete**:
   - Set `pending_purchase.status = 'completed'`
   - Store `resellerclub_order_id` and `provisioned_resource_id`

## Idempotency Keys

### Format
```
{agency_id}:{purchase_type}:{domain_name}:{timestamp}
```

### Example
```
550e8400-e29b-41d4-a716-446655440000:domain_register:example.com:1708012800000
```

### Usage
- Prevents duplicate purchases if user refreshes/retries
- Stored in `pending_purchases.idempotency_key`
- Also stored in `domain_orders.idempotency_key` after provisioning

## Status Flow

### Pending Purchase States
1. `pending_payment` - Awaiting Paddle payment
2. `paid` - Paddle payment successful, about to provision
3. `provisioning` - Currently calling ResellerClub API
4. `completed` - Successfully provisioned
5. `failed` - Provisioning failed (retry possible)
6. `cancelled` - Purchase cancelled

## Error Handling

### ResellerClub API Errors

**403 Forbidden**:
```typescript
// Error: IP not whitelisted
// Solution: Add to ResellerClub Dashboard → Settings → API → Whitelist
```

**Customer Not Found**:
```typescript
// Ensure agency has resellerclub_customer_id
// Created via ensureResellerClubCustomer() on first use
```

### Paddle Errors

**Transaction Creation Failed**:
```typescript
// Check Paddle API key is valid
// Verify Paddle product exists
```

**Webhook Not Received**:
```typescript
// Check webhook endpoint is accessible
// Verify PADDLE_WEBHOOK_SECRET is set
// Check Paddle dashboard for webhook logs
```

### Provisioning Errors

**Domain Already Registered**:
```typescript
// Check domain availability before purchase
// Handle via error_message in pending_purchase
```

**Email Order Creation Failed**:
```typescript
// Verify ResellerClub customer has sufficient balance
// Check domain is active for email setup
```

## Monitoring

### Key Metrics to Track

1. **Pricing Cache Health**:
   - Query `pricing_sync_log` for failures
   - Alert if cache older than 48 hours

2. **Pending Purchase Success Rate**:
   - Count `status = 'completed'` vs `status = 'failed'`
   - Alert if failure rate > 5%

3. **Reconciliation Discrepancies**:
   - Count rows in reconciliation results with discrepancies
   - Alert if > 10 discrepancies per agency

4. **Webhook Processing Time**:
   - Log time from `transaction.completed` to provisioning completion
   - Alert if > 30 seconds

### Queries for Monitoring

```sql
-- Check pricing cache freshness
SELECT 
  pricing_type,
  COUNT(*) as entries,
  MIN(last_refreshed_at) as oldest,
  MAX(last_refreshed_at) as newest
FROM domain_pricing_cache
GROUP BY pricing_type;

-- Pending purchases stuck in provisioning
SELECT *
FROM pending_purchases
WHERE status = 'provisioning'
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- Failed purchases in last 24 hours
SELECT 
  purchase_type,
  COUNT(*) as failures,
  error_message
FROM pending_purchases
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY purchase_type, error_message;

-- Domains needing reconciliation (> 7 days since last sync)
SELECT COUNT(*)
FROM domains
WHERE registered_via_api = true
  AND (
    resellerclub_last_synced_at IS NULL
    OR resellerclub_last_synced_at < NOW() - INTERVAL '7 days'
  );
```

## Production Checklist

### Pre-Deployment
- [ ] Run migrations (DM-11, DM-12)
- [ ] Set up static egress IP or proxy
- [ ] Configure ResellerClub IP whitelist
- [ ] Test Paddle webhook endpoint is publicly accessible
- [ ] Verify environment variables are set

### Post-Deployment
- [ ] Run initial pricing refresh: `POST /api/admin/pricing/refresh`
- [ ] Register test domain and complete payment
- [ ] Verify webhook received and domain provisioned
- [ ] Check pricing cache populated
- [ ] Verify cron job running (check logs next day)
- [ ] Monitor pending_purchases for stuck entries

### Week 1
- [ ] Review pricing cache refresh logs
- [ ] Check reconciliation results
- [ ] Analyze failed purchases
- [ ] Verify all domains syncing correctly
- [ ] Customer feedback on pricing accuracy

## Rollback Plan

If issues arise:

1. **Stop New Purchases**:
   - Set `RESELLERCLUB_ALLOW_PURCHASES=false` in config

2. **Revert to Old Flow** (if needed):
   - Keep old `registerDomain()` backup
   - Manually provision stuck purchases

3. **Data Integrity**:
   - All existing data remains intact
   - Pending purchases can be completed manually
   - No domain data loss

## Support Contacts

- **ResellerClub Support**: support@resellerclub.com
- **Paddle Support**: Via Paddle dashboard
- **Internal**: Check `pending_purchases` and `pricing_sync_log` for errors

---

**Quick Start**: Run `POST /api/admin/pricing/refresh` after deployment to populate cache, then test a domain registration.
