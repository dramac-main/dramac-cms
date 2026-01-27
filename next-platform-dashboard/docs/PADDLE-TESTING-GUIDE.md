# Paddle Setup & Testing Guide

## ✅ Step 1: Paddle Dashboard Setup

### 1.1 Create Account & Verify Email
- ✅ Already signed up at https://paddle.com
- Verify your email address
- Complete business information

### 1.2 Configure Default Checkout URL (REQUIRED!)

⚠️ **CRITICAL**: This step is required before checkout will work!

Without this setting, you'll see the error: `transaction_default_checkout_url_not_set`

1. Go to **Checkout** → **Settings** (or **Checkout** → **Checkout Settings**)
2. Find **"Default payment link"** or **"Default checkout URL"**
3. Set it to your application URL:
   - **For Development**: `http://localhost:3000`
   - **For Production**: `https://app.dramacagency.com`
4. Click **Save**

Alternatively, in some Paddle versions:
1. Go to **Settings** → **Checkout** → **Payment Links**
2. Enable **"Default payment link"**
3. Enter your checkout URL

**Why is this needed?** Paddle's checkout iframe needs to know where to redirect users after payment or if there's an error. This URL acts as a fallback.

### 1.3 Get API Keys & Client-Side Tokens

#### Server-Side API Key (for backend)
1. Go to **Developer Tools** → **Authentication**
2. Click the **API keys** tab
3. Click **New API key**
4. Enter a name (e.g., "dramac-cms")
5. Select **All permissions** (or customize as needed)
6. Click **Save**
7. Copy the API key (format: `pdl_live_apikey_xxxxx` or `pdl_test_apikey_xxxxx`)
   - **Sandbox keys**: Start with `pdl_test_apikey_`
   - **Live keys**: Start with `pdl_live_apikey_`
   - Keys are 69 characters long

⚠️ **Important**: Store this securely - you won't be able to see it again!

#### Client-Side Token (for frontend)
1. Go to **Developer Tools** → **Authentication**
2. Click the **Client-side tokens** tab
3. Click **New client-side token**
4. Enter a name and description
5. Click **Save**
6. Copy the client-side token (format: `test_xxxxx` or `live_xxxxx`)
   - **Sandbox tokens**: Start with `test_` (27 chars after prefix)
   - **Live tokens**: Start with `live_` (27 chars after prefix)

### 1.3 Create Products & Prices

#### Starter Plan
1. Go to **Catalog** → **Products** → **New Product**
2. **Product Name**: `Starter Plan`
3. **Description**: `Perfect for small businesses getting started`
4. **Product Type**: `Standard`
5. Click **Save Product**
6. Copy the **Product ID** (format: `pro_xxx`)

7. **Add Price** → **Create Price**:
   - **Price Name**: `Starter Monthly`
   - **Billing Type**: `Recurring`
   - **Billing Interval**: `Monthly`
   - **Price**: `$29.00 USD`
   - **Trial Period**: 14 days (optional)
   - Click **Save Price**
   - Copy the **Price ID** (format: `pri_xxx`)

8. **Add another Price** for Yearly:
   - **Price Name**: `Starter Yearly`
   - **Billing Type**: `Recurring`
   - **Billing Interval**: `Yearly`
   - **Price**: `$290.00 USD` (17% discount)
   - Click **Save Price**
   - Copy the **Price ID**

#### Pro Plan
Repeat the same process:
1. Create **Product**: `Pro Plan`
2. **Add Price** Monthly: `$99.00`
3. **Add Price** Yearly: `$990.00`

### 1.4 Configure Webhooks (Notification Settings)
1. Go to **Developer Tools** → **Notifications**
2. Click **New notification destination**
3. **Destination URL**: `https://your-domain.com/api/webhooks/paddle`
   - For testing locally, use ngrok: `https://abc123.ngrok.io/api/webhooks/paddle`
4. **Description**: `DRAMAC CMS Webhooks`
5. **Active**: Check ✅ to enable
6. **Subscribe to events** - Select all relevant events:
   - ✅ `subscription.activated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.created`
   - ✅ `subscription.past_due`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
   - ✅ `subscription.trialing`
   - ✅ `subscription.updated`
   - ✅ `transaction.billed`
   - ✅ `transaction.canceled`
   - ✅ `transaction.completed`
   - ✅ `transaction.paid`
   - ✅ `transaction.past_due`
   - ✅ `transaction.payment_failed`
   - ✅ `transaction.ready`
   - ✅ `transaction.updated`
   - ✅ `customer.created`
   - ✅ `customer.updated`
6. Click **Save destination**
7. Click on your notification destination to view details
8. Copy the **Secret key** (format: `pdl_ntfset_xxxxx`)
   - This is used to verify webhook signatures
   - Store it in `PADDLE_WEBHOOK_SECRET` environment variable

---

## ✅ Step 2: Configure Environment Variables

Add to your `.env.local`:

```bash
# ============================================================================
# Paddle Billing API Configuration (Server-Side)
# ============================================================================
# Server-side API key - KEEP THIS SECRET!
# Get from: Paddle Dashboard → Developer Tools → Authentication → API keys tab
# Format: pdl_test_apikey_xxxxx (sandbox) or pdl_live_apikey_xxxxx (production)
PADDLE_API_KEY=pdl_test_apikey_01kfveqj5xxxxxxxxxxxxxxxxxxxxx

# Webhook secret for verifying webhook signatures
# Get from: Paddle Dashboard → Developer Tools → Notifications → Your webhook → Secret key
# Format: pdl_ntfset_xxxxx
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# Paddle Client-Side Configuration (Frontend - Safe to Expose)
# ============================================================================
# Client-side token for Paddle.js - safe to expose in frontend
# Get from: Paddle Dashboard → Developer Tools → Authentication → Client-side tokens tab
# Format: test_xxxxx (sandbox) or live_xxxxx (production)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_4s7gd50ap72ms92nnsa20ma61lt

# Environment: "sandbox" for testing, "production" for live
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# ============================================================================
# Product/Price IDs (Public - Used in pricing page)
# ============================================================================
# Get these from: Paddle Dashboard → Catalog → Products
# Format: pro_xxxxx (products), pri_xxxxx (prices)
# NOTE: Price IDs need NEXT_PUBLIC_ prefix for the client-side pricing page
PADDLE_PRODUCT_STARTER=pro_01hs123xxxxxxxxx
PADDLE_PRODUCT_PRO=pro_01hs456xxxxxxxxx
NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY=pri_01hs789xxxxxxxxx
NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY=pri_01hs012xxxxxxxxx
NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY=pri_01hs345xxxxxxxxx
NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY=pri_01hs678xxxxxxxxx
```

**⚠️ Critical Notes**:

1. **API Key vs Client-Side Token**:
   - **API Key** (`PADDLE_API_KEY`): Used for server-side API calls. MUST be kept secret! Never expose in frontend.
   - **Client-Side Token** (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`): Used for Paddle.js in frontend. Safe to expose.

2. **Environments**:
   - **Sandbox**: Use `test_` tokens and `pdl_test_apikey_` keys for testing (no real money)
   - **Production**: Use `live_` tokens and `pdl_live_apikey_` keys for real transactions

3. **Key Formats**:
   - API keys: 69 characters, format `pdl_(test|live)_apikey_xxxxx`
   - Client tokens: 32 characters, format `(test|live)_xxxxx` (27 chars after prefix)
   - Webhook secrets: Format `pdl_ntfset_xxxxx`

4. **Seller ID is NOT used** in Paddle Billing v2 - ignore any references to it in old guides

---

## ✅ Step 3: Seed Products in Database

**Ready to paste!** Copy this SQL and run it in your Supabase SQL Editor:

```sql
-- Update paddle_products table with your actual Paddle IDs
-- Run this in: Supabase Dashboard → SQL Editor → New Query

UPDATE paddle_products SET 
  paddle_product_id = 'pro_01kfwyaqwrp9pxwajj5vr9dy6t',
  paddle_price_id = 'pri_01kfwz0ks7s8znh9p5qkrw4bxh'
WHERE slug = 'starter_monthly';

UPDATE paddle_products SET 
  paddle_product_id = 'pro_01kfwyaqwrp9pxwajj5vr9dy6t',
  paddle_price_id = 'pri_01kfwz0ks7s8znh9p5qkrw4bx'
WHERE slug = 'starter_yearly';

UPDATE paddle_products SET 
  paddle_product_id = 'pro_01kfwz8ncq86csytrvkw3x6acc',
  paddle_price_id = 'pri_01kfwzb0h1nys35f2dw8r7m2ct'
WHERE slug = 'pro_monthly';

UPDATE paddle_products SET 
  paddle_product_id = 'pro_01kfwz8ncq86csytrvkw3x6acc',
  paddle_price_id = 'pri_01kfwzd8pt0gs5a2ex3ffvat0z'
WHERE slug = 'pro_yearly';

-- Verify the updates
SELECT slug, paddle_product_id, paddle_price_id 
FROM paddle_products 
ORDER BY slug;
```

**Note**: I've used your actual IDs from `.env.local`:
- Starter Product: `pro_01kfwyaqwrp9pxwajj5vr9dy6t`
- Pro Product: `pro_01kfwz8ncq86csytrvkw3x6acc`
- Monthly/Yearly prices linked to respective products

---

## ✅ Step 4: Testing Locally with ngrok

### 4.1 Install ngrok
```bash
# Windows (via Chocolatey)
choco install ngrok

# Or download from https://ngrok.com/download
```

### 4.2 Start ngrok tunnel
```bash
ngrok http 3000
```

Copy the `https://` URL (e.g., `https://abc123.ngrok.io`)

### 4.3 Update Paddle Webhook URL
Go to Paddle Dashboard → Notifications → Edit your webhook
- **URL**: `https://abc123.ngrok.io/api/webhooks/paddle`

---

## ✅ Step 5: Test Checkout Flow

### 5.1 Create Test Agency
1. Sign up/login to your dashboard
2. Create a test agency

### 5.2 Test Pricing Page (EM-59B)
Navigate to `/pricing` to see the public pricing page:
- View Starter and Pro plan cards
- Toggle between monthly/yearly billing (see savings)
- Click "Get Started" to trigger checkout

### 5.3 Trigger Checkout
You can trigger checkout in multiple ways:

**Option 1: Use the Pricing Page** (Recommended)
```typescript
// The pricing page at /pricing already has checkout integrated
// Just click "Get Started" on any plan
```

**Option 2: Custom Component**
```typescript
// Example: Checkout Button Component
import { openPaddleCheckout } from '@/lib/paddle/paddle-client';

export function SubscribeButton({ priceId }: { priceId: string }) {
  const handleSubscribe = async () => {
    try {
      await openPaddleCheckout({
        priceId,
        agencyId: 'your-agency-id',
        email: 'user@example.com',
      });
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <button onClick={handleSubscribe}>
      Subscribe Now
    </button>
  );
}
```

### 5.4 Use Paddle Test Cards

Paddle provides test card numbers:

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| **Success** | `4242 4242 4242 4242` | Any 3 digits | Any future date |
| **Decline** | `4000 0000 0000 0002` | Any 3 digits | Any future date |
| **3D Secure** | `4000 0027 6000 3184` | Any 3 digits | Any future date |

### 5.5 Verify Webhook Processing
1. Complete checkout with test card
2. Check your ngrok terminal - you should see incoming webhooks
3. Check your server logs:
```bash
pnpm dev
# Look for: [Paddle Webhook] Processing event: subscription.created
```

4. Verify database:
```sql
SELECT * FROM paddle_webhooks ORDER BY created_at DESC LIMIT 10;
SELECT * FROM paddle_subscriptions WHERE agency_id = 'your-agency-id';
SELECT * FROM paddle_customers WHERE agency_id = 'your-agency-id';
```

---

## ✅ Step 6: Test Usage Tracking

### 6.1 Record Test Usage
```typescript
import { UsageTracker } from '@/lib/paddle/usage-tracker';

const tracker = new UsageTracker();

// Record automation run
await tracker.recordUsage(
  'agency-id',
  'site-id',
  'automation_runs',
  1
);

// Record AI action
await tracker.recordUsage(
  'agency-id',
  'site-id',
  'ai_actions',
  1
);
```

### 6.2 Check Usage
```sql
-- View hourly usage
SELECT * FROM usage_hourly 
WHERE agency_id = 'your-agency-id' 
ORDER BY hour_timestamp DESC;

-- View current period usage
SELECT * FROM get_current_period_usage('your-agency-id');
```

---

## ✅ Step 7: Test Subscription Management UI (EM-59B)

### 7.1 View Subscription Card
After subscribing, navigate to your billing settings to see the subscription management card:
- View current plan and billing cycle
- See next billing date
- View included usage limits

### 7.2 Pause Subscription
**Via UI**: Click "Pause Subscription" button in subscription card

**Via API**:
```typescript
const response = await fetch('/api/billing/paddle/subscription/pause', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

### 7.3 Resume Subscription
**Via UI**: Click "Resume Subscription" button when paused

**Via API**:
```typescript
const response = await fetch('/api/billing/paddle/subscription/resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

### 7.4 Cancel Subscription
**Via UI**: Click "Cancel Subscription" button (modal confirms immediate vs. end of period)

**Via API**:
```typescript
const response = await fetch('/api/billing/paddle/subscription/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ immediately: false }) // or true
});
```

### 7.5 Reactivate Subscription
**Via API**:
```typescript
const response = await fetch('/api/billing/paddle/subscription/reactivate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

### 7.6 Update Payment Method
**Via API**:
```typescript
const response = await fetch('/api/billing/paddle/subscription/update-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const { url } = await response.json();
// Open the Paddle payment update URL
window.location.href = url;
```

---

## ✅ Step 8: Test Usage Dashboard (EM-59B)

### 8.1 View Usage Metrics
Navigate to your billing settings to see the usage dashboard:
- View automation runs used vs. included
- View AI actions used vs. included
- View API calls used vs. included
- See progress bars with percentage
- Check overage projections

### 8.2 Trigger Usage Alerts
Usage tracking automatically sends alerts:
- **80% threshold**: Warning notification
- **100% threshold**: Limit reached notification
- Overages are calculated and billed automatically

---

## ✅ Step 9: Test Invoice History (EM-59B)

### 9.1 View Invoices
In billing settings, see the invoice history component:
- List of all paid invoices
- Transaction amounts and dates
- Payment status badges
- Download/view invoice links

### 9.2 Download Invoice
Click the download button to get a PDF invoice (via Paddle)

---

## ✅ Step 10: Test Dunning & Recovery (EM-59B)

### 10.1 Simulate Failed Payment
1. Use decline test card: `4000 0000 0000 0002`
2. Complete checkout
3. Payment will fail

### 10.2 Verify Dunning Process
Check that the system:
1. Updates subscription to `past_due` status
2. Sends first failure email
3. Creates notification for user
4. Logs event to activity_log

### 10.3 Simulate Retry Failures
Manually trigger more failures to test escalation:
- 1st failure: "Action Required: Payment Failed"
- 2nd failure: "Reminder: Please Update Your Payment Method"
- 3rd failure: "URGENT: Your account will be suspended"
- 4th+ failure: Account suspended (paused/canceled based on config)

### 10.4 Test Recovery
1. Update payment method with valid card
2. Paddle retries payment
3. System sends "Payment Successful" email
4. Subscription reactivated
5. Dunning counters reset

---

## ✅ Step 11: Test Enterprise Quotes (EM-59B)

### 11.1 Create Enterprise Quote
```typescript
import { enterpriseService } from '@/lib/paddle/enterprise-service';

const quote = await enterpriseService.createQuote({
  contactName: 'John Doe',
  contactEmail: 'john@bigcorp.com',
  companyName: 'Big Corp Inc',
  requirements: {
    estimatedUsers: 100,
    estimatedSites: 50,
    estimatedMonthlyUsage: {
      automationRuns: 500000,
      aiActions: 250000,
      apiCalls: 5000000,
    },
    features: ['Custom integrations', 'Dedicated support'],
    additionalNotes: 'Need onboarding assistance',
  },
});
```

### 11.2 View Quote Calculation
The system automatically calculates:
- Base price based on users and sites
- Usage multiplier for high volumes
- Volume discounts (10%, 15%, 20%)
- Included usage limits
- Monthly and annual pricing

### 11.3 Send Quote to Customer
```typescript
await enterpriseService.sendQuote(quote.id);
// Customer receives email with quote details and acceptance link
```

### 11.4 Accept Quote
```typescript
const { priceId } = await enterpriseService.acceptQuote(quote.id);
// System creates custom product and price in Paddle
// Returns priceId for checkout
```

---

## ✅ Step 12: Test Admin Billing Dashboard (EM-59B)

### 12.1 Access Admin Dashboard
1. Login as super admin
2. Navigate to `/admin/billing`

### 12.2 View Metrics
The dashboard shows:
- **MRR** (Monthly Recurring Revenue)
- **ARR** (Annual Recurring Revenue)
- **Active Subscriptions** count
- **Churn Rate** percentage
- **Plan Distribution** (Starter vs Pro)
- **Top Agencies** by revenue
- **Recent Transactions**

### 12.3 Verify API
```typescript
const response = await fetch('/api/admin/billing/overview');
const data = await response.json();
// Returns: mrr, arr, activeSubscriptions, churnRate, planCounts, topAgencies
```

---

## 📝 Editing Products/Prices

### Can You Edit Anytime?

**YES**, but with caveats:

1. **Product Names/Descriptions**: ✅ Edit freely
2. **Prices**: ⚠️ Can't edit existing prices
   - Instead, **create new price** with new amount
   - **Archive old price** (existing subscriptions keep old price)
3. **Product Features**: ✅ Edit freely (metadata only)
4. **Billing Intervals**: ❌ Can't change (monthly → yearly)
   - Create separate products/prices instead

### Best Practice for Testing:
1. Use **sandbox** environment for all tests
2. Create test products with prefix: `[TEST] Starter Plan`
3. Test with $0.50 or $1.00 prices (Paddle allows test amounts)
4. Archive test products before going live

---

## 🧪 Complete Testing Checklist

### Setup & Configuration
- [ ] Environment variables configured
- [ ] ngrok tunnel running
- [ ] Paddle webhook configured with ngrok URL
- [ ] Products created in Paddle dashboard
- [ ] Prices created (monthly + yearly)
- [ ] Webhook secret copied
- [ ] Database products table updated with Paddle IDs

### Core Billing (EM-59A)
- [ ] Test checkout with card `4242 4242 4242 4242`
- [ ] Verify webhook logs in terminal
- [ ] Check `paddle_subscriptions` table
- [ ] Check `paddle_webhooks` table
- [ ] Check `paddle_customers` table
- [ ] Test usage recording
- [ ] View usage in database
- [ ] Verify usage hourly aggregation

### UI Components (EM-59B)
- [ ] View `/pricing` page
- [ ] Test billing cycle toggle (monthly/yearly)
- [ ] Click "Get Started" to trigger checkout
- [ ] View subscription card after subscribing
- [ ] Check usage dashboard displays correctly
- [ ] View invoice history component
- [ ] Download invoice PDF

### Subscription Management (EM-59B)
- [ ] Test pause via UI button
- [ ] Test pause via API route
- [ ] Test resume via UI button
- [ ] Test resume via API route
- [ ] Test cancel (end of period)
- [ ] Test cancel (immediately)
- [ ] Test reactivate API
- [ ] Test update payment method API

### Dunning & Recovery (EM-59B)
- [ ] Simulate failed payment with decline card
- [ ] Verify subscription marked `past_due`
- [ ] Receive first failure email
- [ ] Check notification created
- [ ] Verify activity log entry
- [ ] Test payment recovery with valid card
- [ ] Verify dunning counters reset

### Enterprise Features (EM-59B)
- [ ] Create enterprise quote
- [ ] Verify pricing calculation
- [ ] Send quote email
- [ ] Accept quote
- [ ] Verify custom Paddle product created

### Admin Dashboard (EM-59B)
- [ ] Access `/admin/billing` as super admin
- [ ] View MRR/ARR metrics
- [ ] Check active subscriptions count
- [ ] View churn rate
- [ ] See plan distribution
- [ ] View top agencies
- [ ] Test admin billing API

---

## 🚨 Common Issues

### Webhook Not Receiving Events
1. Check ngrok is running: `ngrok http 3000`
2. Verify webhook URL in Paddle dashboard matches ngrok
3. Check webhook secret matches `.env.local`
4. Look for errors in server logs

### Checkout Not Opening
1. Verify `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` is set
2. Check browser console for errors
3. Ensure Price ID is correct
4. Verify Paddle.js is loaded (check Network tab)

### Type Errors
1. Regenerate types: `npx supabase gen types typescript --project-id YOUR_ID > src/types/database.types.ts`
2. Copy to main file: `Copy-Item src/types/database.types.ts src/types/database.ts -Force`
3. Restart TypeScript server in VSCode

---

## 📚 Next Steps

1. ✅ Complete local testing
2. ✅ Update to production keys when ready
3. ✅ Configure production webhook URL (your actual domain)
4. ✅ Test in production with small amount
5. ✅ Monitor webhook logs and database
6. ✅ Set up monitoring/alerts for failed webhooks

---

**Ready to test!** Start with Step 4 (ngrok) and work through the checklist.
