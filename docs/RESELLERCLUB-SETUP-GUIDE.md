# ResellerClub Setup Guide
## Simple Step-by-Step Instructions

This guide will help you complete the ResellerClub integration setup. Most of the code is already implemented - you just need to complete a few configuration steps.

---

## ✅ What's Already Done (No Action Needed)

- ✅ All code implemented and deployed
- ✅ Database migrations created (DM-11 and DM-12)
- ✅ Payment integration with Paddle Transactions
- ✅ Webhook provisioning handlers
- ✅ Pricing cache system
- ✅ Daily reconciliation cron job
- ✅ Admin UI for manual pricing refresh
- ✅ Frontend checkout redirect flow

---

## ⚠️ If Vercel build fails with "ProxyAgent is not a constructor"

This happens when Vercel sees **`HTTPS_PROXY`** or **`HTTP_PROXY`** in the build environment.

**Fix:** In Vercel → Project → Settings → Environment Variables:

1. **Remove** any `HTTPS_PROXY` and `HTTP_PROXY` variables.
2. **Add** (for static IP proxy):
   - Name: **`RESELLERCLUB_PROXY_URL`**  
   - Value: your Fixie (or other) proxy URL  
   - Or, if you use the Fixie integration: the integration sets **`FIXIE_URL`** – keep that and remove only `HTTPS_PROXY`/`HTTP_PROXY`.

Redeploy. The app uses `RESELLERCLUB_PROXY_URL` or `FIXIE_URL` only at **runtime**, so the build no longer tries to use a proxy and will succeed.

---

## 🔧 Setup Steps (Manual Actions Required)

### Step 1: Run Database Migrations (If Not Already Done)

**You mentioned these are already complete!** ✅ Skip to Step 2.

If you need to re-run them:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Open and run these migration files in order:
   - `next-platform-dashboard/migrations/dm-11-pricing-cache-schema.sql`
   - `next-platform-dashboard/migrations/dm-12-paddle-transactions-schema.sql`

---

### Step 2: Whitelist Your Server IP in ResellerClub

**This is the MOST IMPORTANT step!** Without this, all API calls will fail with 403 errors.

#### Option A: For Local/Development Testing

1. **Find your current IP:**
   - Open PowerShell or Command Prompt
   - Run: `curl ifconfig.me` or visit https://whatismyip.com
   
2. **Log into ResellerClub:**
   - Go to: https://manage.resellerclub.com/
   - Or for test: https://freeaccount.myorderbox.com/

3. **Add your IP:**
   - Click **Settings** (top menu)
   - Click **API** from the dropdown
   - Find section: **Whitelist your IP Addresses**
   - Enter your IP address
   - Click **Save**

4. **Test it works:**
   - Go to your admin panel: `/admin/pricing`
   - Click **"Full Sync"** button
   - You should see pricing data load successfully

#### Option B: For Production (Vercel)

⚠️ **PROBLEM**: Vercel uses dynamic IPs that change frequently. You have several options:

---

**FREE / LOW-COST OPTIONS:**

**1. Fixie (real free tier – recommended)**

- **Sign up:** https://usefixie.com/ or Vercel integration: https://vercel.com/integrations/fixie
- **Free “Tricycle” plan:** 500 requests/month, 100 MB – enough for light use (pricing sync + a few domain/email ops)
- **Steps:**
  1. Create account at Fixie, create an HTTP/HTTPS proxy
  2. They give you a proxy URL and a static IP to whitelist
  3. In Vercel: add **one** of these (do **not** set `HTTPS_PROXY`/`HTTP_PROXY` – they break the build):
     - **`RESELLERCLUB_PROXY_URL`** = your Fixie proxy URL, or
     - **`FIXIE_URL`** = same URL (if you used the Fixie–Vercel integration)
  4. In ResellerClub: Settings → API → Whitelist → add Fixie’s static IP
- **If you need more:** Commuter plan is $5/month (2,500 requests, 500 MB)
- **Docs:** https://usefixie.com/documentation/vercel

**2. Free cloud VM with static IP (no proxy service)**

- **Oracle Cloud Free Tier** (or similar) often includes a VM + static public IP for $0
- Create a small Linux VM, assign a reserved/public IP, install a simple HTTP proxy (e.g. Squid or a small Node/Go proxy)
- In Vercel set **`RESELLERCLUB_PROXY_URL`** to your VM proxy (e.g. `http://ip:port`). Do not set `HTTPS_PROXY` – it breaks the build.
- In ResellerClub whitelist that VM’s IP
- More setup, but $0 and no request limits; good if you’re okay with basic server admin

**3. Noble IP**

- Free tier (75 MB) exists but **outbound proxy creation may not be available on the free plan** – only paid plans (Starter $29/mo) explicitly include “1 Outbound Proxy”. If you have a paid plan, use it the same way (proxy URL → Vercel env → whitelist IP)

---

**PAID OPTIONS (if free tier isn’t enough):**

**QuotaGuard Static IP (~$10/month):**

1. Sign up: https://www.quotaguard.com/
2. Get proxy URL (e.g. `http://user:pass@proxy.quotaguard.com:port`)
3. In Vercel: add **`RESELLERCLUB_PROXY_URL`** with that URL (do not set `HTTPS_PROXY`/`HTTP_PROXY` – they break the build)
4. In ResellerClub: whitelist QuotaGuard’s static IP

**Vercel Pro/Enterprise (native static IPs):**

- Vercel’s own Static IPs (Pro/Enterprise) – no third‑party proxy needed
- See: https://vercel.com/docs/connectivity/static-ips

---

**Last resort – Contact ResellerClub:**

- Email: support@resellerclub.com
- Ask if they can whitelist Vercel’s IP range (they may say no)

---

### Step 3: Initial Pricing Refresh

Once your IP is whitelisted, fetch the initial pricing data:

1. **Go to Admin Panel:**
   - Navigate to: `/admin/pricing`
   
2. **Click "Full Sync" button**

3. **Wait for completion:**
   - You should see: "Sync Completed"
   - Shows: X domains updated, Y email packages updated
   
4. **If it fails:**
   - Error shows "403" → IP not whitelisted correctly (go back to Step 2)
   - Error shows "timeout" → Check your ResellerClub credentials in `.env.local`
   - Other errors → Check the error message and contact support if needed

---

### Step 4: Test Domain Registration End-to-End

Now test the full payment flow:

1. **Go to Domain Search:**
   - Navigate to: `/dashboard/domains/search`
   
2. **Search for a test domain:**
   - Enter a domain name you don't mind registering
   - Click search
   
3. **Add to cart and checkout:**
   - Click "Add to Cart"
   - Proceed to checkout
   - Fill in contact information
   - Click "Register Domain"

4. **You should be redirected to Paddle:**
   - Complete the payment form
   - Click "Complete Payment"
   
5. **After payment:**
   - You'll be redirected back to `/dashboard/domains/success`
   - Page will show "Provisioning..." 
   - Wait for it to change to "Success!"
   - Domain should appear in your domains list

**If something goes wrong:**
- Check `/admin/pricing` to ensure pricing loaded
- Check Supabase logs for webhook errors
- Check `paddle_pending_purchases` table in Supabase

---

### Step 5: Set Up Email Notifications (Optional)

If you want to receive notifications when provisioning fails:

1. Update `ADMIN_EMAIL` in your `.env.local`:
   ```
   ADMIN_EMAIL=your-email@example.com
   ```

2. Errors will be logged in:
   - Supabase `paddle_pending_purchases` table (check `error_message` column)
   - Vercel logs (if deployed)

---

## 📊 Monitoring & Maintenance

### Check Pricing Cache Status

Visit `/admin/pricing` anytime to:
- See when pricing was last synced
- Manually refresh if you changed prices in ResellerClub
- View sync statistics

### Monitor Cron Jobs

Your Vercel dashboard will show cron executions:
1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter for `/api/cron/resellerclub-sync`
4. Should run daily at 02:00 UTC

### Check Failed Purchases

If provisioning fails (rare), check Supabase:

```sql
-- See failed purchases
SELECT * FROM paddle_pending_purchases 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- See provisioning attempts
SELECT * FROM paddle_pending_purchases 
WHERE provisioning_attempts > 0
ORDER BY updated_at DESC;
```

---

## 🆘 Troubleshooting

### Issue: "403 Forbidden" errors

**Cause:** Your IP is not whitelisted in ResellerClub

**Solution:**
1. Find your current IP: `curl ifconfig.me`
2. Go to ResellerClub → Settings → API
3. Add your IP to whitelist
4. Wait 5 minutes for changes to propagate
5. Try again

---

### Issue: Pricing shows $0.00 or "N/A"

**Cause:** Pricing cache is empty

**Solution:**
1. Go to `/admin/pricing`
2. Click "Full Sync"
3. Wait for completion
4. Check domain search again

---

### Issue: Domain registered but payment not captured

**Cause:** Old code path still being used (shouldn't happen with new code)

**Solution:**
- Check that you're using the latest deployment
- Check Vercel logs for errors
- Verify webhook is receiving `transaction.completed` events

---

### Issue: Customer paid but domain not provisioned

**Cause:** Webhook failed or provision API error

**Solution:**
1. Check Supabase `paddle_pending_purchases` table
2. Find the purchase by `transaction_id`
3. Check `error_message` column
4. If ResellerClub API error, may need to provision manually
5. Check ResellerClub control panel to see if domain was registered

---

## 🎯 Quick Reference

### Important URLs

- **ResellerClub Control Panel:** https://manage.resellerclub.com/
- **Admin Pricing Page:** `/admin/pricing`
- **Domain Search:** `/dashboard/domains/search`
- **Purchase Success:** `/dashboard/domains/success`

### Key Environment Variables

```bash
# Required (you should already have these)
RESELLERCLUB_RESELLER_ID=your_reseller_id
RESELLERCLUB_API_KEY=your_api_key

# For Paddle Transactions
NEXT_PUBLIC_PADDLE_TOKEN=your_paddle_token
PADDLE_WEBHOOK_SECRET=your_webhook_secret

# Optional: For static IP proxy (production)
# Use RESELLERCLUB_PROXY_URL (or FIXIE_URL if using Fixie integration).
# Do NOT set HTTPS_PROXY/HTTP_PROXY in Vercel - they break the build.
RESELLERCLUB_PROXY_URL=http://user:pass@proxy-service.com:port
```

### Key Database Tables

- `domain_pricing_cache` - Cached domain TLD pricing
- `email_pricing_cache` - Cached email package pricing
- `paddle_pending_purchases` - Tracks purchases from payment to completion
- `pricing_sync_log` - History of pricing refresh operations

---

## ✨ You're Done!

Once you complete Steps 1-4, your ResellerClub integration is fully operational:

✅ Customers can search and register domains  
✅ Payments captured via Paddle before provisioning  
✅ Domains automatically registered after payment  
✅ Pricing syncs daily from ResellerClub  
✅ You can manually refresh pricing anytime  
✅ Reconciliation keeps data in sync  

**Need help?** Check the other documentation:
- `docs/RESELLERCLUB-IMPLEMENTATION-SUMMARY.md` - Technical details
- `docs/RESELLERCLUB-QUICK-REFERENCE.md` - API reference
- `docs/RESELLERCLUB-UI-CHANGES.md` - Frontend details
- `docs/RESELLERCLUB-IP-WHITELIST.md` - IP whitelisting deep dive
