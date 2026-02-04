# Deployment Checklist: Domain Module

## ⚠️ Production Database Migration Required

Your domain module is working locally but not on production because the database tables don't exist in production.

## Step 1: Apply Migration to Production

### Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/_/sql
2. Open `next-platform-dashboard/migrations/dm-02-domain-schema.sql`
3. Copy ALL content (entire file)
4. Paste into Supabase SQL Editor
5. Click **RUN** button
6. Verify success message

### Via Supabase CLI

```bash
cd next-platform-dashboard

# Link to your production project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to production
npx supabase db push
```

## Step 2: Verify Migration

Run this query in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'domains',
  'domain_dns_records',
  'domain_email_accounts',
  'domain_orders',
  'domain_transfers',
  'domain_pricing',
  'cloudflare_zones',
  'email_subscriptions'
);
```

You should see 8 tables listed.

## Step 3: Configure Environment Variables

Make sure these are set in Vercel:

### Required for Domain Module

```env
# ResellerClub API (for domain registration)
RESELLERCLUB_API_KEY=your_api_key
RESELLERCLUB_USER_ID=your_reseller_id
RESELLERCLUB_SANDBOX=false

# Cloudflare API (for DNS management)
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### Check in Vercel Dashboard

1. Go to https://vercel.com/dramac-main/dramac-cms
2. Settings → Environment Variables
3. Add missing variables
4. Redeploy after adding

## Step 4: Test Production

After migration:

1. Visit https://your-domain.vercel.app/dashboard/domains
2. You should see:
   - Empty state (if no domains yet)
   - OR your existing domains (if data migrated)
3. Try searching for a domain
4. Check browser console for errors

## Common Issues

### "Table 'domains' does not exist"
- ❌ Migration not applied
- ✅ Run Step 1 above

### "No data showing but local works"
- ❌ Local and production are different databases
- ✅ Data is NOT automatically synced
- ✅ You need to add domains in production OR backup/restore

### "API errors in production"
- ❌ Environment variables missing
- ✅ Check Vercel environment variables (Step 3)

## Data Migration (Optional)

If you want to copy your local domain to production:

### Option 1: Re-create in Production
Just register the domain again through the production UI

### Option 2: Backup & Restore
```bash
# Export from local
npx supabase db dump --data-only -t domains > domains_backup.sql

# Import to production (via Supabase dashboard SQL editor)
# Then paste contents of domains_backup.sql
```

## Verification Checklist

- [ ] Migration applied to production Supabase
- [ ] Tables verified in production database
- [ ] Environment variables configured in Vercel
- [ ] Production site redeployed
- [ ] /dashboard/domains loads without errors
- [ ] Domain search works
- [ ] No console errors

## Need Help?

If you're still seeing issues:
1. Check Vercel deployment logs: https://vercel.com/dramac-main/dramac-cms/deployments
2. Check Supabase logs: https://supabase.com/dashboard/project/_/logs
3. Check browser console for JavaScript errors
