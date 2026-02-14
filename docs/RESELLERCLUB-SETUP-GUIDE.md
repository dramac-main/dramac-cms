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

⚠️ **PROBLEM**: Vercel uses dynamic IPs that change frequently. You have 3 options:

**RECOMMENDED - Use QuotaGuard Proxy:**

1. **Sign up for QuotaGuard:**
   - Go to: https://www.quotaguard.com/
   - Sign up for their Static IP plan (starts ~$10/month)
   - Get your proxy URL (format: `http://user:pass@proxy.quotaguard.com:port`)

2. **Add to Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `HTTPS_PROXY` = `your-quotaguard-url`
   - Add: `HTTP_PROXY` = `your-quotaguard-url`
   - Redeploy your site

3. **Whitelist QuotaGuard's IP in ResellerClub:**
   - QuotaGuard will give you a static IP
   - Add that IP to ResellerClub (Settings → API → Whitelist)

**Alternative Option - Deploy API to a Server with Static IP:**
- Use AWS EC2, DigitalOcean, or Azure VM
- Get a static IP
- Deploy only the API routes there
- Whitelist that IP

**Last Resort - Contact ResellerClub:**
- Email: support@resellerclub.com
- Ask if they can whitelist Vercel's IP range
- (They may say no - worth trying)

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
HTTPS_PROXY=http://user:pass@proxy-service.com:port
HTTP_PROXY=http://user:pass@proxy-service.com:port
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
