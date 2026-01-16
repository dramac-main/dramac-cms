# Supabase Database Backup & Restore Guide

## 📁 Files Created

| File | Purpose |
|------|---------|
| `supabase-full-export.sql` | **EXPORT** - Run to get full database state |
| `supabase-restore-schema.sql` | **RESTORE STEP 1** - Creates empty database structure |
| `supabase-restore-data-template.sql` | **RESTORE STEP 2** - Template to insert your data |

---

## 🔄 HOW TO BACKUP (Export Current State)

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Export Script
1. Copy the ENTIRE contents of `supabase-full-export.sql`
2. Paste into SQL Editor
3. Click **Run** (or press F5)
4. Wait for all queries to complete (may take 30-60 seconds)

### Step 3: Save Your Backup
The query will return multiple result sets. You need to save:

1. **Schema DDL** - Table definitions
2. **RLS Policies** - Security policies
3. **Functions** - Database functions
4. **Triggers** - Auto-update triggers
5. **Storage Buckets** - Bucket configurations
6. **ALL DATA** - JSON for each of the 22 tables

**IMPORTANT:** Copy the JSON results for each table and save them in a file like `backup-2025-01-XX.json`

```json
{
  "exported_at": "2025-01-XX",
  "agencies_data": [...],
  "profiles_data": [...],
  "clients_data": [...],
  // ... etc
}
```

---

## 🔁 HOW TO RESTORE (Revert to Saved State)

### Step 1: Run Schema Restore
1. Open SQL Editor in Supabase
2. Copy contents of `supabase-restore-schema.sql`
3. **Run** - This will:
   - DROP all existing tables
   - CREATE all tables fresh
   - CREATE all indexes
   - CREATE all functions
   - SET UP storage buckets

### Step 2: Insert Your Data
1. Open `supabase-restore-data-template.sql`
2. For each table section:
   - Uncomment the INSERT statement
   - Replace `'[]'::jsonb` with your saved JSON data
3. Run the complete script

### Example:
```sql
-- Original:
INSERT INTO public.agencies 
SELECT * FROM jsonb_populate_recordset(NULL::public.agencies, 
  '[]'::jsonb  -- <-- Replace [] with your agencies_data from export
);

-- With your data:
INSERT INTO public.agencies 
SELECT * FROM jsonb_populate_recordset(NULL::public.agencies, 
  '[{"id":"uuid-here","name":"My Agency","slug":"my-agency",...}]'::jsonb
);
```

---

## ⚠️ IMPORTANT NOTES

### What IS Backed Up:
- ✅ All 22 database tables with all data
- ✅ Table schemas (columns, types, constraints)
- ✅ Foreign key relationships
- ✅ Indexes
- ✅ Functions (cleanup_rate_limits, get_backup_count, etc.)
- ✅ Triggers (updated_at auto-update)
- ✅ Storage bucket configurations

### What is NOT Backed Up:
- ❌ **Auth.users** - Supabase manages this separately
- ❌ **Uploaded files** - Only metadata in `assets` table, not actual files
- ❌ **Edge Functions** - Deployed separately
- ❌ **RLS Policies** - Must be recreated from migrations

### Auth Users Note:
The export script captures `auth.users` metadata (id, email, created_at), but you CANNOT restore auth.users directly. Users would need to:
1. Re-register, OR
2. Use Supabase's built-in auth management tools

---

## 📊 Tables Covered (22 Total)

| Category | Tables |
|----------|--------|
| **Core** | agencies, profiles, agency_members |
| **Clients/Sites** | clients, sites, pages, page_content |
| **Assets** | assets, templates |
| **Modules** | modules, module_subscriptions, site_modules, agency_modules, module_usage |
| **Billing (Stripe)** | billing_customers, billing_subscriptions, billing_invoices, billing_usage |
| **Billing (LemonSqueezy)** | subscriptions, invoices |
| **System** | backups, notifications, activity_log, notification_preferences, rate_limits |

---

## 🔐 RLS Policies

The schema restore enables RLS on all tables but does NOT create specific policies. To restore full RLS:

1. Run your migration files in order:
   - `migrations/storage-buckets.sql`
   - `migrations/modules.sql`
   - `migrations/notifications.sql`
   - etc.

Or create them via Supabase Dashboard > Authentication > Policies.

---

## 📅 Recommended Backup Schedule

| When | Action |
|------|--------|
| Before any phase | Run full export |
| After major changes | Run full export |
| Weekly | Automated backup (configure in Supabase) |
| Before deleting anything | Run full export |

---

## 🆘 Troubleshooting

### "Foreign key violation" error
→ Make sure you're inserting data in the correct order (agencies first, then profiles, then clients, etc.)

### "Duplicate key" error
→ The restore-schema script should DROP all tables first. Make sure you ran that script successfully.

### "User not found" error for profiles
→ Profiles reference auth.users. The user must exist in auth.users before you can insert their profile.

### JSON parsing errors
→ Make sure your JSON is valid. Use an online JSON validator if needed.

---

## 💡 Quick Commands

```sql
-- Check if backup worked (row counts)
SELECT 'agencies' as t, COUNT(*) FROM agencies UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles UNION ALL
SELECT 'clients', COUNT(*) FROM clients UNION ALL
SELECT 'sites', COUNT(*) FROM sites UNION ALL
SELECT 'pages', COUNT(*) FROM pages;

-- See your most recent agencies
SELECT id, name, created_at FROM agencies ORDER BY created_at DESC LIMIT 5;

-- See your most recent sites
SELECT id, name, subdomain, published FROM sites ORDER BY created_at DESC LIMIT 5;
```
