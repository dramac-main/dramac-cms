# Domain & Email Services Setup Guide

**Last Updated**: February 1, 2026  
**For**: Phase DM-07 & DM-08 - Business Email Integration

This guide walks you through setting up ResellerClub and Cloudflare accounts for DRAMAC's domain and email reseller functionality.

---

## 🎯 Overview

You need two services:
1. **ResellerClub** - Domain registration & Business Email (Titan)
2. **Cloudflare** - DNS management & CDN

---

## 📝 Part 1: ResellerClub Setup

### What is ResellerClub?

ResellerClub is a domain registrar and web services platform that allows you to resell:
- Domain registrations (.com, .net, .org, etc.)
- Business Email (Titan Mail)
- SSL certificates
- Web hosting

### Do They Review What You've Built?

**No, ResellerClub does NOT review your application/website.** Here's what they actually check:

✅ **What they verify:**
- Valid business information
- Payment method (credit card or deposit)
- Basic contact details
- Compliance with their terms of service

❌ **What they DON'T check:**
- Your website's functionality
- Your code or implementation
- Whether you have a platform built yet
- Your customer base

You can sign up **before** or **after** building your platform. Most resellers sign up first to get API access for testing.

### Step-by-Step: ResellerClub Account Setup

#### Step 1: Choose Account Type

ResellerClub offers two account types:

| Type | Best For | Initial Cost | Domain Pricing |
|------|----------|--------------|----------------|
| **Reseller** | Small agencies, startups | $0 - $99 | Pay per transaction |
| **Super Reseller** | Larger agencies | $1000+ deposit | Volume discounts |

**Recommendation for DRAMAC**: Start with **Reseller** account.

#### Step 2: Sign Up

1. Go to: **https://www.resellerclub.com/**
2. Click **"Become a Reseller"** or **"Sign Up"**
3. Fill out the form:
   ```
   Business Name: [Your Agency Name]
   Country: Zambia
   Email: [Your business email]
   Phone: [Your business phone]
   ```

#### Step 3: Verify Your Account

After signing up:
1. Check your email for verification link
2. Click to verify your email
3. Complete identity verification (if required):
   - Upload business registration (if registered)
   - Or personal ID (if sole proprietor)

#### Step 4: Add Payment Method

Two options:

**Option A: Credit/Debit Card**
- Add card in your ResellerClub dashboard
- Pay-as-you-go for each transaction
- No upfront deposit required

**Option B: Wallet Deposit**
- Add funds to your account balance
- Get better per-transaction pricing
- Minimum: Usually $100-500

**For Testing**: Use **Sandbox Mode** (free, see Step 7)

#### Step 5: Get API Credentials

1. Log into ResellerClub dashboard
2. Go to **Settings** → **API**
3. Generate/view your API credentials:
   ```
   Reseller ID: 123456
   API Key: xxxxxxxxxxxxxxxxxxxxx
   ```

4. **Save these securely** - you'll need them for your `.env` file

#### Step 6: Configure Pricing

1. Go to **Settings** → **Pricing**
2. Set your markup for:
   - Domain registrations (e.g., 30% markup)
   - Business Email (e.g., 50% markup)
   - Renewals

**Example Pricing Strategy**:
```
.com domains:
- Wholesale: $8.99/year
- Your markup: 40%
- Retail: $12.59/year
- Your profit: $3.60/domain/year

Business Email:
- Wholesale: $1.50/mailbox/month
- Your markup: 50%
- Retail: $2.25/mailbox/month
- Your profit: $0.75/mailbox/month
```

#### Step 7: Enable Sandbox/Test Mode

**IMPORTANT**: ResellerClub offers a **free test environment**!

1. Go to: **https://test.resellerclub.com/**
2. Sign up for test account (separate from live account)
3. Get test API credentials
4. Use these for development

**Test Environment Features**:
- ✅ Free domain registrations (test domains)
- ✅ Free email accounts (test only)
- ✅ All API endpoints work identically
- ✅ No real charges
- ❌ Domains don't actually resolve on internet
- ❌ Can't transfer test domains to live

**Use test credentials during development**:
```env
RESELLERCLUB_SANDBOX=true
RESELLERCLUB_API_URL=https://test.httpapi.com/api
RESELLERCLUB_RESELLER_ID=your_test_id
RESELLERCLUB_API_KEY=your_test_key
```

#### Step 8: Enable Business Email (Titan)

Business Email is automatically available in your ResellerClub account. No separate signup needed!

1. In ResellerClub dashboard, verify **Business Email** is listed
2. Check pricing in **Products** → **Email**
3. Note: All email operations use ResellerClub API (`/api/eelite/` endpoints)

#### Step 9: Set Up Brand Settings (Optional)

For white-labeling:
1. Go to **Settings** → **Branding**
2. Upload your logo
3. Customize email templates
4. Set custom domain for control panel (e.g., `domains.youragency.com`)

### ResellerClub Resources

- **API Documentation**: https://manage.resellerclub.com/kb/answer/744
- **Business Email API**: https://manage.resellerclub.com/kb/answer/2155
- **Support**: support@resellerclub.com
- **Phone**: Check website for regional numbers

---

## 🌐 Part 2: Cloudflare Setup

### Dedicated vs Personal Account?

**Recommendation: Use a DEDICATED ACCOUNT** for these reasons:

✅ **Dedicated Account Advantages**:
- Separate billing for business expenses
- Cleaner audit trail
- Multiple team members can have access
- Professional separation of concerns
- Easier to hand off if needed
- Better for accounting/tax purposes

❌ **Personal Account Risks**:
- Mixing personal and business DNS
- Potential billing confusion
- Harder to track business costs
- Risk of accidentally modifying personal sites

**Exception**: If you're just testing/learning, personal account is fine temporarily.

### Step-by-Step: Cloudflare Setup

#### Step 1: Create Account

1. Go to: **https://dash.cloudflare.com/sign-up**
2. Sign up with:
   ```
   Email: [Business email - different from personal]
   Password: [Strong password]
   ```

#### Step 2: Choose Plan

For DRAMAC platform:

| Plan | Cost | Features | Recommended? |
|------|------|----------|--------------|
| **Free** | $0/month | Basic DNS, SSL | ✅ Good for testing |
| **Pro** | $20/month/domain | Advanced caching, Image optimization | ✅ Good for production |
| **Business** | $200/month/domain | Priority support, Advanced DDoS | Only if high traffic |

**Start with FREE plan**, upgrade to Pro when you have paying customers.

#### Step 3: Get API Token

1. Go to: **Profile** → **API Tokens**
2. Click **"Create Token"**
3. Use template: **"Edit zone DNS"**
4. Configure permissions:
   ```
   Zone - DNS - Edit
   Zone - Zone - Read
   ```
5. Optionally restrict to specific zones (or leave as "All zones")
6. Click **"Continue to summary"** → **"Create Token"**
7. **Copy the token immediately** (shown only once)

#### Step 4: Get Account ID

1. In Cloudflare dashboard, click on any domain (or add a test domain)
2. Scroll down in the sidebar
3. Find **"Account ID"** in the API section
4. Copy this ID

#### Step 5: Configure Environment Variables

Add to your `.env.local`:

```env
# Cloudflare API
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

#### Step 6: Test API Access

You can test your Cloudflare credentials:

```bash
# In your terminal
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

Should return a list of your zones (or empty array if no domains yet).

#### Step 7: Set Up Nameservers (Optional)

If you want DRAMAC to manage DNS for domains:

1. Note Cloudflare's nameservers (shown when adding a domain):
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

2. When customers purchase domains through DRAMAC:
   - Automatically configure them to use Cloudflare nameservers
   - Create DNS zone in Cloudflare
   - Add records via API

### Cloudflare Resources

- **API Docs**: https://developers.cloudflare.com/api/
- **DNS API**: https://developers.cloudflare.com/dns/
- **Support**: https://community.cloudflare.com/

---

## 🔧 Part 3: Configure DRAMAC

### Step 1: Create `.env.local` File

In `next-platform-dashboard/.env.local`:

```env
# ============================================================================
# RESELLERCLUB API - Domain & Email Services
# ============================================================================

# For Testing (Sandbox)
RESELLERCLUB_SANDBOX=true
RESELLERCLUB_API_URL=https://test.httpapi.com/api
RESELLERCLUB_RESELLER_ID=your_test_reseller_id
RESELLERCLUB_API_KEY=your_test_api_key

# For Production (Uncomment when ready)
# RESELLERCLUB_SANDBOX=false
# RESELLERCLUB_API_URL=https://httpapi.com/api
# RESELLERCLUB_RESELLER_ID=your_live_reseller_id
# RESELLERCLUB_API_KEY=your_live_api_key

# ============================================================================
# CLOUDFLARE API - DNS Management
# ============================================================================

CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id

# ============================================================================
# PLATFORM CONFIGURATION
# ============================================================================

PLATFORM_NAMESERVERS=ns1.cloudflare.com,ns2.cloudflare.com
PLATFORM_DOMAIN=dramac.app
DEFAULT_CNAME_TARGET=cname.dramac.app
```

### Step 2: Update Supabase

Run this SQL in Supabase SQL Editor to add your ResellerClub customer ID:

```sql
-- Get your agency_id first
SELECT id, name FROM agencies WHERE owner_id = auth.uid();

-- Update with your ResellerClub customer ID
-- (Found in ResellerClub dashboard under Profile)
UPDATE agencies 
SET resellerclub_customer_id = 'YOUR_RC_CUSTOMER_ID_HERE'
WHERE id = 'YOUR_AGENCY_ID_HERE';
```

### Step 3: Test the Integration

1. Start your development server:
   ```bash
   cd next-platform-dashboard
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/dashboard/email`

3. Try purchasing email for a test domain:
   - Click "Purchase Email"
   - Enter a test domain name
   - Select number of accounts
   - Submit

4. Check:
   - ✅ Email order created in Supabase
   - ✅ No real charges (sandbox mode)
   - ✅ Can create email accounts
   - ✅ DNS configuration options show

---

## 💰 Pricing & Cost Breakdown

### Initial Costs

| Service | Setup Cost | Ongoing Cost |
|---------|------------|--------------|
| **ResellerClub** | $0 (Reseller) | Pay per transaction |
| **Cloudflare** | $0 (Free plan) | $0/month or $20/domain/month (Pro) |
| **Development** | $0 | $0 (use sandbox) |

### Per-Transaction Costs (Example)

**Domain Registration (.com)**:
- Wholesale cost: ~$8.99/year
- Your retail price: $12.59/year (40% markup)
- Your profit: $3.60/year per domain

**Business Email**:
- Wholesale cost: ~$1.50/mailbox/month
- Your retail price: $2.25/mailbox/month (50% markup)
- Your profit: $0.75/mailbox/month

**Example Revenue** (10 clients):
```
10 clients × 1 domain × $3.60/year = $36/year
10 clients × 5 mailboxes × $0.75/month × 12 = $450/year
Total: $486/year from just 10 clients
```

---

## ✅ Testing Checklist

After setup, verify:

- [ ] ResellerClub sandbox account created
- [ ] ResellerClub test API credentials working
- [ ] Cloudflare account created
- [ ] Cloudflare API token generated
- [ ] Environment variables configured
- [ ] Agency customer ID updated in Supabase
- [ ] Can access `/dashboard/email` page
- [ ] Can create test email order
- [ ] No TypeScript errors
- [ ] No console errors

---

## 🚨 Important Notes

### Security
- **Never commit** `.env.local` to git (it's in `.gitignore`)
- **Never share** API keys publicly
- **Use sandbox** for all testing
- **Rotate keys** if exposed

### Sandbox Limitations
- Test domains don't resolve on real internet
- Test emails don't actually send
- Data may be reset periodically
- Perfect for development, not for demos to clients

### Going Live Checklist
- [ ] Switch to live ResellerClub account
- [ ] Add payment method/deposit
- [ ] Update environment variables
- [ ] Set `RESELLERCLUB_SANDBOX=false`
- [ ] Test one transaction manually
- [ ] Monitor first few orders closely

---

## 🆘 Troubleshooting

### "Not authenticated" errors
- Check your API credentials are correct
- Verify `agency_id` is set in Supabase
- Ensure `resellerclub_customer_id` is populated

### "Agency not configured for domain services"
- Run the Supabase SQL update command
- Verify the customer ID is correct
- Check you're using the right agency

### DNS configuration fails
- Verify Cloudflare API token has DNS edit permissions
- Check domain has Cloudflare zone created
- Ensure zone ID is correct

### Email order creation fails
- Verify ResellerClub sandbox mode is enabled
- Check API credentials are correct
- Review console for specific error messages

---

## 📞 Support Contacts

### ResellerClub
- **Support Email**: support@resellerclub.com
- **Documentation**: https://manage.resellerclub.com/kb
- **Status Page**: https://status.resellerclub.com

### Cloudflare
- **Community Forum**: https://community.cloudflare.com
- **Documentation**: https://developers.cloudflare.com
- **Status Page**: https://www.cloudflarestatus.com

### DRAMAC (Your Platform)
- Check `/memory-bank/` for architecture decisions
- Review `/docs/` for implementation guides
- Check GitHub issues for known problems

---

## 🎯 Next Steps

After completing this setup:

1. **Test the integration thoroughly** using sandbox
2. **Configure pricing** in ResellerClub dashboard
3. **Set up domain pricing** in DRAMAC platform
4. **Create test email accounts** to verify flow
5. **Document your setup** for your team
6. **Plan go-live strategy** with real customers

---

---

## 💱 Currency & Pricing Strategy

### Can You Price in ZMW (Zambian Kwacha)?

**Short Answer**: Display prices in ZMW, but process through USD/EUR with Paddle.

**Why?**

1. **Paddle Does NOT Support ZMW**
   - Paddle supports 30+ currencies, but ZMW is not one of them
   - Supported currencies include: USD, EUR, GBP, AUD, CAD, CHF, DKK, HKD, INR, JPY, KRW, MXN, NOK, NZD, PLN, SEK, SGD, THB, TRY, ZAR, and more
   - **ZMW is missing** from this list

2. **ResellerClub Operates in USD Only**
   - All domain and email wholesale costs are in USD
   - You pay ResellerClub in USD
   - You cannot select ZMW as currency in ResellerClub

3. **Currency Conversion Fees**
   - Converting ZMW → USD → Customer Payment adds complexity
   - Multiple conversion steps = more fees

### Recommended Strategy for DRAMAC

**Option 1: USD Pricing (Simplest)** ✅ Recommended

```
Display:  $12.99/month
Process:  $12.99 USD via Paddle
Costs:    $8.99 USD to ResellerClub
Profit:   $4.00 USD
```

**Advantages:**
- ✅ No currency conversion
- ✅ Paddle supports USD
- ✅ ResellerClub costs in USD
- ✅ Simple accounting
- ✅ Customers can pay with Zambian cards in USD

**Disadvantages:**
- ❌ May feel less local to Zambian customers

**Option 2: Display ZMW, Process USD** (More Complex)

```
Display:  K325/month (ZMW)
Process:  $12.99 USD via Paddle (at ~K25/$1)
Costs:    $8.99 USD to ResellerClub
Profit:   $4.00 USD = ~K100
```

**How it works:**
1. Show prices in ZMW on your website: "K325/month"
2. Add disclaimer: "Charged in USD (approximately $13)"
3. Paddle processes in USD
4. Customer's bank converts to ZMW at their rate

**Advantages:**
- ✅ Feels local (prices in Kwacha)
- ✅ Customers understand costs better
- ✅ Still simple backend (USD only)

**Disadvantages:**
- ❌ Exchange rate fluctuations mean displayed ZMW price changes
- ❌ Customer may see different final ZMW amount
- ❌ Requires daily exchange rate updates
- ❌ Customer confusion if amounts don't match exactly

**Option 3: EUR/GBP Alternative** (Not Recommended)

Some platforms use EUR instead of USD for African markets, but:
- ❌ Still requires conversion
- ❌ No advantage for Zambian customers
- ❌ ResellerClub costs still in USD
- ❌ More complexity

### Implementation Recommendation

**For DRAMAC: Use Option 1 (USD) Initially**

Here's why:

1. **Simplicity**
   - Your wholesale costs are in USD
   - Paddle processes in USD
   - No exchange rate risk
   - Clean accounting

2. **Zambian customers CAN pay in USD**
   - Most Zambian banks support USD transactions
   - Credit/debit cards work internationally
   - Mobile money (when integrated) can handle USD

3. **Professional perception**
   - USD is standard for SaaS platforms
   - Builds trust as international platform
   - Easier for enterprise customers

4. **Scale globally**
   - No changes needed when expanding beyond Zambia
   - Same pricing for all countries (or country-specific USD prices)

### Currency Configuration

**ResellerClub Settings:**
```
Currency: USD (only option)
Pricing: Set in USD
Deposits: USD
```

**Paddle Settings:**
```env
# In your Paddle dashboard and code
Default Currency: USD
Price: $29, $99, etc.
Automatic conversion: Disabled (keep USD only)
```

**DRAMAC Display:**
```typescript
// In your code
const plans = [
  {
    name: "Starter",
    price: 29,
    currency: "USD",
    display: "$29",
    // Optional: Add ZMW equivalent for reference
    zmwEquivalent: "~K725" // Update daily
  }
]
```

### Handling Exchange Rates (If Showing ZMW)

If you want to display ZMW equivalents:

1. **Use an exchange rate API**:
   ```typescript
   // Free APIs:
   // - exchangerate-api.com
   // - frankfurter.app
   
   async function getZmwRate() {
     const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
     const data = await res.json()
     return data.rates.ZMW
   }
   ```

2. **Update daily/hourly**:
   - Cache the rate
   - Update in background
   - Show approximate values

3. **Add disclaimer**:
   ```tsx
   <p className="text-sm text-muted-foreground">
     Prices shown in ZMW are approximate. 
     You will be charged in USD based on current exchange rates.
   </p>
   ```

### Example Pricing Display

**Single Currency (USD Only)**:
```tsx
<div className="text-3xl font-bold">$29</div>
<div className="text-sm text-muted-foreground">per month</div>
```

**Dual Display (USD + ZMW Reference)**:
```tsx
<div className="text-3xl font-bold">$29</div>
<div className="text-sm text-muted-foreground">
  ~K{(29 * zmwRate).toFixed(0)} per month
</div>
<div className="text-xs text-muted-foreground">
  Charged in USD. ZMW amount may vary.
</div>
```

### Payment Methods for Zambian Customers

Since you're processing in USD, ensure you offer:

1. **Credit/Debit Cards** (via Paddle)
   - Visa, Mastercard work globally
   - Zambian banks support USD transactions

2. **PayPal** (if available via Paddle)
   - Good for businesses
   - Handles currency conversion

3. **Bank Transfer** (for large enterprise deals)
   - Direct USD wire transfers
   - No Paddle fees

4. **Future: Mobile Money Integration**
   - MTN Mobile Money, Airtel Money
   - Would need custom integration
   - Could handle ZMW directly

### Tax Considerations

**VAT in Zambia**: 16%

Since Paddle is Merchant of Record:
- ✅ Paddle handles tax calculation
- ✅ Paddle remits taxes
- ✅ You don't need to register for VAT
- ✅ Paddle provides tax invoices

**Your configuration**:
- Tell Paddle you're selling to Zambian customers
- Paddle automatically adds 16% VAT
- Customer sees: $29 + VAT = $33.64 total

### Summary: What to Select

| Service | Currency Setting | Why |
|---------|------------------|-----|
| **ResellerClub** | USD (only option) | Wholesale costs in USD |
| **Paddle** | USD | Simplest, no conversion |
| **DRAMAC Display** | USD (with optional ZMW reference) | Clear, no confusion |
| **Your Payouts** | USD | Match your costs |

### Migration Path (Future)

If you want to add full ZMW support later:

1. Wait for Paddle to add ZMW (unlikely soon)
2. Or integrate a Zambian payment processor (e.g., Paystack, Flutterwave)
3. Use dual payment processing:
   - Paddle for international (USD)
   - Local processor for Zambian customers (ZMW)

But for MVP and initial launch: **Stick with USD** ✅

---

**Questions?** Review this guide first, then check the Phase docs in `/phases/domain-reseller/`
