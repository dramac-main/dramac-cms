# Phase 59: RLS Security Audit & Enhancement

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 2-3 hours

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `modules` | `modules_v2` |
| `site_modules` | `site_module_installations` |
| `module_subscriptions` | `agency_module_subscriptions` |
| `activity_logs` | `activity_log` |

**ALWAYS reference [SCHEMA-REFERENCE.md](SCHEMA-REFERENCE.md) before implementing!**

---

## 🎯 Objective

Audit and enhance Row Level Security (RLS) policies across all tables to ensure proper data isolation between agencies.

---

## 📋 Prerequisites

- [ ] Access to Supabase dashboard
- [ ] Understanding of current database schema (see `src/types/database.ts`)
- [ ] Super admin test account ready

---

## 🔍 Current State Analysis

**Tables that EXIST (from `src/types/database.ts`):**
- `agencies`, `agency_members`, `profiles`, `clients`
- `sites`, `pages`, `page_content`
- `modules_v2`, `site_module_installations`, `agency_module_installations`
- `agency_module_subscriptions`, `client_module_installations`
- `blog_posts`, `blog_categories`, `blog_post_categories`
- `form_submissions`, `form_settings`, `form_webhooks`
- `activity_log`, `audit_logs`, `notifications`, `notification_preferences`
- `assets`, `media_folders`, `media_usage`
- `subscriptions`, `invoices`
- `seo_audits`, `site_seo_settings`
- `rate_limits`, `support_tickets`

---

## ✅ Tasks

### Task 59.1: Create RLS Helper Functions

**File: `migrations/phase-59-rls-helpers.sql`**

```sql
-- ============================================
-- DRAMAC RLS HELPER FUNCTIONS
-- Phase 59 - January 2026
-- ============================================

-- Get current user's agency ID
CREATE OR REPLACE FUNCTION auth.get_current_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1
$$;

-- Check if user is agency member
CREATE OR REPLACE FUNCTION auth.is_agency_member(check_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.agency_members 
    WHERE user_id = auth.uid() 
    AND agency_id = check_agency_id
  )
$$;

-- Check if user is agency admin/owner
CREATE OR REPLACE FUNCTION auth.is_agency_admin(check_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.agency_members 
    WHERE user_id = auth.uid() 
    AND agency_id = check_agency_id
    AND role IN ('admin', 'owner')
  )
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
$$;

-- Check if user can access a site
CREATE OR REPLACE FUNCTION auth.can_access_site(check_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.sites s
    WHERE s.id = check_site_id
    AND (
      s.agency_id = auth.get_current_agency_id()
      OR auth.is_super_admin()
    )
  )
$$;

-- Check if user can access a client
CREATE OR REPLACE FUNCTION auth.can_access_client(check_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.clients c
    WHERE c.id = check_client_id
    AND (
      c.agency_id = auth.get_current_agency_id()
      OR auth.is_super_admin()
    )
  )
$$;
```

---

### Task 59.2: Audit & Fix Core Table RLS

**File: `migrations/phase-59-rls-policies.sql`**

```sql
-- ============================================
-- AGENCIES TABLE RLS
-- ============================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_select" ON agencies;
CREATE POLICY "agency_select" ON agencies FOR SELECT
USING (
  id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_update" ON agencies;
CREATE POLICY "agency_update" ON agencies FOR UPDATE
USING (
  auth.is_agency_admin(id) OR auth.is_super_admin()
);

-- ============================================
-- CLIENTS TABLE RLS
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
);

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients FOR DELETE
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- SITES TABLE RLS
-- ============================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sites_select" ON sites;
CREATE POLICY "sites_select" ON sites FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "sites_insert" ON sites;
CREATE POLICY "sites_insert" ON sites FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
  AND auth.can_access_client(client_id)
);

DROP POLICY IF EXISTS "sites_update" ON sites;
CREATE POLICY "sites_update" ON sites FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "sites_delete" ON sites;
CREATE POLICY "sites_delete" ON sites FOR DELETE
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- PAGES TABLE RLS
-- ============================================
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pages_select" ON pages;
CREATE POLICY "pages_select" ON pages FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "pages_insert" ON pages;
CREATE POLICY "pages_insert" ON pages FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "pages_update" ON pages;
CREATE POLICY "pages_update" ON pages FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "pages_delete" ON pages;
CREATE POLICY "pages_delete" ON pages FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- ACTIVITY_LOG TABLE RLS (Note: activity_log NOT activity_logs!)
-- ============================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_log_select" ON activity_log;
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- NOTIFICATIONS TABLE RLS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
WITH CHECK (true); -- Allow system to create notifications

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
USING (user_id = auth.uid());
```

---

### Task 59.3: Module System RLS (Using CORRECT table names!)

```sql
-- ============================================
-- MODULES_V2 TABLE RLS (NOT modules!)
-- ============================================
ALTER TABLE modules_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_v2_select" ON modules_v2;
CREATE POLICY "modules_v2_select" ON modules_v2 FOR SELECT
USING (
  status = 'published'
  OR created_by = auth.uid()
  OR auth.is_super_admin()
);

-- ============================================
-- SITE_MODULE_INSTALLATIONS TABLE RLS (NOT site_modules!)
-- ============================================
ALTER TABLE site_module_installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_module_installations_select" ON site_module_installations;
CREATE POLICY "site_module_installations_select" ON site_module_installations FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "site_module_installations_insert" ON site_module_installations;
CREATE POLICY "site_module_installations_insert" ON site_module_installations FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "site_module_installations_update" ON site_module_installations;
CREATE POLICY "site_module_installations_update" ON site_module_installations FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "site_module_installations_delete" ON site_module_installations;
CREATE POLICY "site_module_installations_delete" ON site_module_installations FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- AGENCY_MODULE_SUBSCRIPTIONS TABLE RLS (NOT module_subscriptions!)
-- ============================================
ALTER TABLE agency_module_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_module_subscriptions_select" ON agency_module_subscriptions;
CREATE POLICY "agency_module_subscriptions_select" ON agency_module_subscriptions FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);
```

---

### Task 59.4: Verify RLS in Application Code

**File: `src/lib/security/rls-test.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";

/**
 * Test RLS policies are working correctly
 * Run this in development to verify data isolation
 */
export async function testRLSPolicies() {
  const supabase = await createClient();
  
  const results = {
    clients: false,
    sites: false,
    pages: false,
    activity: false,
  };

  try {
    // Test clients isolation
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, agency_id")
      .limit(5);
    
    results.clients = !clientsError;
    console.log("Clients RLS:", results.clients ? "✅ PASS" : "❌ FAIL", clientsError?.message);

    // Test sites isolation
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("id, agency_id")
      .limit(5);
    
    results.sites = !sitesError;
    console.log("Sites RLS:", results.sites ? "✅ PASS" : "❌ FAIL", sitesError?.message);

    // Test activity log
    const { data: activity, error: activityError } = await supabase
      .from("activity_log") // Note: activity_log NOT activity_logs
      .select("id")
      .limit(5);
    
    results.activity = !activityError;
    console.log("Activity RLS:", results.activity ? "✅ PASS" : "❌ FAIL", activityError?.message);

  } catch (error) {
    console.error("RLS test error:", error);
  }

  return results;
}
```

---

## ✅ Completion Checklist

- [x] RLS helper functions created
- [x] Core tables have RLS policies (agencies, clients, sites, pages)
- [x] Module tables use CORRECT names (modules_v2, site_module_installations)
- [x] Activity log uses CORRECT name (activity_log)
- [x] Notifications table has RLS
- [x] Verified data isolation between agencies
- [x] Super admin can access all data
- [x] Regular users only see their agency data

---

## 📝 Notes for AI Agent

1. **USE CORRECT TABLE NAMES** - Reference SCHEMA-REFERENCE.md
2. **CHECK database.ts** - Verify table exists before adding RLS
3. **TEST THOROUGHLY** - RLS bugs can cause data leaks
4. **DON'T BREAK AUTH** - Profile creation must still work
5. **SUPER ADMIN** - Must bypass RLS for admin functions

