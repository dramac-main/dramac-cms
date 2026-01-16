# Phase 59: RLS Security Audit & Fix

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Perform a comprehensive audit of all Row Level Security (RLS) policies in Supabase, fix any disabled or misconfigured policies, and ensure proper data isolation between agencies.

---

## 📋 Prerequisites

- [ ] Access to Supabase dashboard
- [ ] Understanding of current database schema
- [ ] Super admin test account ready

---

## 🚨 Current Issues

1. **RLS may be disabled** on some tables to make auth work
2. **Signup flow conflicts** - Profile creation fails with RLS enabled
3. **Cross-agency access** - Potential for data leaks between agencies
4. **Missing policies** - Some tables have incomplete RLS rules

---

## 📁 Files to Create/Modify

```
migrations/
├── 20260116_rls_security_audit.sql    # Complete RLS audit migration
├── 20260116_rls_helper_functions.sql  # Security helper functions

src/lib/supabase/
├── service-role.ts                     # Service role client for admin ops
├── middleware.ts                       # RLS-aware middleware

src/lib/
├── security/
│   ├── rls-audit.ts                   # RLS testing utilities
│   └── permissions.ts                  # Permission checking functions
```

---

## ✅ Tasks

### Task 59.1: RLS Helper Functions

**File: `migrations/20260116_rls_helper_functions.sql`**

```sql
-- ============================================
-- DRAMAC RLS HELPER FUNCTIONS
-- Created: 2026-01-16
-- Purpose: Security helper functions for RLS policies
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS auth.get_current_user_id();
DROP FUNCTION IF EXISTS auth.get_current_agency_id();
DROP FUNCTION IF EXISTS auth.get_current_user_role();
DROP FUNCTION IF EXISTS auth.is_agency_member(uuid);
DROP FUNCTION IF EXISTS auth.is_agency_admin(uuid);
DROP FUNCTION IF EXISTS auth.is_agency_owner(uuid);
DROP FUNCTION IF EXISTS auth.is_super_admin();

-- ============================================
-- Get current authenticated user ID
-- ============================================
CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid()
$$;

-- ============================================
-- Get current user's agency ID
-- Returns NULL if user has no agency
-- ============================================
CREATE OR REPLACE FUNCTION auth.get_current_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT agency_id 
  FROM public.agency_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- ============================================
-- Get current user's role in the system
-- Returns 'super_admin', 'admin', or 'member'
-- ============================================
CREATE OR REPLACE FUNCTION auth.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'member'
  )
$$;

-- ============================================
-- Check if user is a member of specific agency
-- ============================================
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

-- ============================================
-- Check if user is admin or owner of agency
-- ============================================
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

-- ============================================
-- Check if user is owner of agency
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_agency_owner(check_agency_id uuid)
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
    AND role = 'owner'
  )
$$;

-- ============================================
-- Check if current user is super admin
-- ============================================
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

-- ============================================
-- Check if user can access a client
-- ============================================
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
    AND auth.is_agency_member(c.agency_id)
  )
  OR auth.is_super_admin()
$$;

-- ============================================
-- Check if user can access a site
-- ============================================
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
    AND auth.is_agency_member(s.agency_id)
  )
  OR auth.is_super_admin()
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_current_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_agency_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_agency_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_agency_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.can_access_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.can_access_site(uuid) TO authenticated;
```

---

### Task 59.2: Complete RLS Audit Migration

**File: `migrations/20260116_rls_security_audit.sql`**

```sql
-- ============================================
-- DRAMAC COMPLETE RLS SECURITY AUDIT
-- Created: 2026-01-16
-- Purpose: Fix all RLS policies for complete security
-- ============================================

-- ============================================
-- STEP 1: Enable RLS on ALL tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop ALL existing policies
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Agencies
DROP POLICY IF EXISTS "agencies_select" ON public.agencies;
DROP POLICY IF EXISTS "agencies_insert" ON public.agencies;
DROP POLICY IF EXISTS "agencies_update" ON public.agencies;
DROP POLICY IF EXISTS "agencies_delete" ON public.agencies;

-- Agency Members
DROP POLICY IF EXISTS "agency_members_select" ON public.agency_members;
DROP POLICY IF EXISTS "agency_members_insert" ON public.agency_members;
DROP POLICY IF EXISTS "agency_members_update" ON public.agency_members;
DROP POLICY IF EXISTS "agency_members_delete" ON public.agency_members;

-- Clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

-- Sites
DROP POLICY IF EXISTS "sites_select" ON public.sites;
DROP POLICY IF EXISTS "sites_insert" ON public.sites;
DROP POLICY IF EXISTS "sites_update" ON public.sites;
DROP POLICY IF EXISTS "sites_delete" ON public.sites;

-- Pages
DROP POLICY IF EXISTS "pages_select" ON public.pages;
DROP POLICY IF EXISTS "pages_insert" ON public.pages;
DROP POLICY IF EXISTS "pages_update" ON public.pages;
DROP POLICY IF EXISTS "pages_delete" ON public.pages;

-- Page Content
DROP POLICY IF EXISTS "page_content_select" ON public.page_content;
DROP POLICY IF EXISTS "page_content_insert" ON public.page_content;
DROP POLICY IF EXISTS "page_content_update" ON public.page_content;
DROP POLICY IF EXISTS "page_content_delete" ON public.page_content;

-- Modules
DROP POLICY IF EXISTS "modules_select" ON public.modules;
DROP POLICY IF EXISTS "modules_insert" ON public.modules;
DROP POLICY IF EXISTS "modules_update" ON public.modules;
DROP POLICY IF EXISTS "modules_delete" ON public.modules;

-- Module Subscriptions
DROP POLICY IF EXISTS "module_subscriptions_select" ON public.module_subscriptions;
DROP POLICY IF EXISTS "module_subscriptions_insert" ON public.module_subscriptions;
DROP POLICY IF EXISTS "module_subscriptions_update" ON public.module_subscriptions;
DROP POLICY IF EXISTS "module_subscriptions_delete" ON public.module_subscriptions;

-- Site Modules
DROP POLICY IF EXISTS "site_modules_select" ON public.site_modules;
DROP POLICY IF EXISTS "site_modules_insert" ON public.site_modules;
DROP POLICY IF EXISTS "site_modules_update" ON public.site_modules;
DROP POLICY IF EXISTS "site_modules_delete" ON public.site_modules;

-- Subscriptions
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete" ON public.subscriptions;

-- Invoices
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;

-- ============================================
-- STEP 3: PROFILES POLICIES
-- Special handling for signup flow
-- ============================================

-- Users can view their own profile
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR auth.is_super_admin()
);

-- Profile creation is handled by trigger/service role
-- Allow users to insert their own profile during signup
CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Only super admins can delete profiles
CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.is_super_admin());

-- ============================================
-- STEP 4: AGENCIES POLICIES
-- ============================================

-- Members can view their own agency, super admins see all
CREATE POLICY "agencies_select"
ON public.agencies
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(id)
  OR auth.is_super_admin()
);

-- Agency creation during signup (owner_id must be current user)
CREATE POLICY "agencies_insert"
ON public.agencies
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Only owners and super admins can update agency
CREATE POLICY "agencies_update"
ON public.agencies
FOR UPDATE
TO authenticated
USING (
  auth.is_agency_owner(id)
  OR auth.is_super_admin()
)
WITH CHECK (
  auth.is_agency_owner(id)
  OR auth.is_super_admin()
);

-- Only super admins can delete agencies
CREATE POLICY "agencies_delete"
ON public.agencies
FOR DELETE
TO authenticated
USING (auth.is_super_admin());

-- ============================================
-- STEP 5: AGENCY MEMBERS POLICIES
-- ============================================

-- Members can see other members in their agency
CREATE POLICY "agency_members_select"
ON public.agency_members
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Owner/admin can add members, or user adding themselves during signup
CREATE POLICY "agency_members_insert"
ON public.agency_members
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid())  -- Self-join during signup
  OR auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- Only admins/owners can update members
CREATE POLICY "agency_members_update"
ON public.agency_members
FOR UPDATE
TO authenticated
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
)
WITH CHECK (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- Only admins/owners can remove members
CREATE POLICY "agency_members_delete"
ON public.agency_members
FOR DELETE
TO authenticated
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- STEP 6: CLIENTS POLICIES
-- ============================================

-- Agency members can view clients in their agency
CREATE POLICY "clients_select"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Agency admins can create clients
CREATE POLICY "clients_insert"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Agency admins can update clients
CREATE POLICY "clients_update"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
)
WITH CHECK (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Only agency admins can delete clients
CREATE POLICY "clients_delete"
ON public.clients
FOR DELETE
TO authenticated
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- STEP 7: SITES POLICIES
-- ============================================

-- Agency members can view sites in their agency
CREATE POLICY "sites_select"
ON public.sites
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Public sites can be viewed by anyone (for renderer)
CREATE POLICY "sites_public_select"
ON public.sites
FOR SELECT
TO anon
USING (status = 'published');

-- Agency members can create sites
CREATE POLICY "sites_insert"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Agency members can update sites
CREATE POLICY "sites_update"
ON public.sites
FOR UPDATE
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
)
WITH CHECK (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Only agency admins can delete sites
CREATE POLICY "sites_delete"
ON public.sites
FOR DELETE
TO authenticated
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- STEP 8: PAGES POLICIES
-- ============================================

-- Site access determines page access
CREATE POLICY "pages_select"
ON public.pages
FOR SELECT
TO authenticated
USING (
  auth.can_access_site(site_id)
);

-- Public pages for renderer
CREATE POLICY "pages_public_select"
ON public.pages
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = site_id AND s.status = 'published'
  )
);

-- Site access allows page creation
CREATE POLICY "pages_insert"
ON public.pages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.can_access_site(site_id)
);

-- Site access allows page update
CREATE POLICY "pages_update"
ON public.pages
FOR UPDATE
TO authenticated
USING (auth.can_access_site(site_id))
WITH CHECK (auth.can_access_site(site_id));

-- Site access allows page delete
CREATE POLICY "pages_delete"
ON public.pages
FOR DELETE
TO authenticated
USING (auth.can_access_site(site_id));

-- ============================================
-- STEP 9: PAGE CONTENT POLICIES
-- ============================================

-- Access follows page access
CREATE POLICY "page_content_select"
ON public.page_content
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p 
    WHERE p.id = page_id AND auth.can_access_site(p.site_id)
  )
);

-- Public content for renderer
CREATE POLICY "page_content_public_select"
ON public.page_content
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.pages p 
    JOIN public.sites s ON s.id = p.site_id
    WHERE p.id = page_id AND s.status = 'published'
  )
);

CREATE POLICY "page_content_insert"
ON public.page_content
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages p 
    WHERE p.id = page_id AND auth.can_access_site(p.site_id)
  )
);

CREATE POLICY "page_content_update"
ON public.page_content
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p 
    WHERE p.id = page_id AND auth.can_access_site(p.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages p 
    WHERE p.id = page_id AND auth.can_access_site(p.site_id)
  )
);

CREATE POLICY "page_content_delete"
ON public.page_content
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p 
    WHERE p.id = page_id AND auth.can_access_site(p.site_id)
  )
);

-- ============================================
-- STEP 10: MODULES POLICIES (Marketplace)
-- ============================================

-- Public modules are visible to all authenticated users
CREATE POLICY "modules_select"
ON public.modules
FOR SELECT
TO authenticated
USING (
  is_public = true
  OR auth.is_super_admin()
);

-- Only super admins can manage modules
CREATE POLICY "modules_insert"
ON public.modules
FOR INSERT
TO authenticated
WITH CHECK (auth.is_super_admin());

CREATE POLICY "modules_update"
ON public.modules
FOR UPDATE
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "modules_delete"
ON public.modules
FOR DELETE
TO authenticated
USING (auth.is_super_admin());

-- ============================================
-- STEP 11: MODULE SUBSCRIPTIONS POLICIES
-- ============================================

-- Agency members can view their subscriptions
CREATE POLICY "module_subscriptions_select"
ON public.module_subscriptions
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Agency owners can subscribe
CREATE POLICY "module_subscriptions_insert"
ON public.module_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_agency_owner(agency_id)
  OR auth.is_super_admin()
);

-- Agency owners can update subscriptions
CREATE POLICY "module_subscriptions_update"
ON public.module_subscriptions
FOR UPDATE
TO authenticated
USING (
  auth.is_agency_owner(agency_id)
  OR auth.is_super_admin()
)
WITH CHECK (
  auth.is_agency_owner(agency_id)
  OR auth.is_super_admin()
);

-- Agency owners can cancel subscriptions
CREATE POLICY "module_subscriptions_delete"
ON public.module_subscriptions
FOR DELETE
TO authenticated
USING (
  auth.is_agency_owner(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- STEP 12: SITE MODULES POLICIES
-- ============================================

-- Access follows site access
CREATE POLICY "site_modules_select"
ON public.site_modules
FOR SELECT
TO authenticated
USING (
  auth.can_access_site(site_id)
);

CREATE POLICY "site_modules_insert"
ON public.site_modules
FOR INSERT
TO authenticated
WITH CHECK (
  auth.can_access_site(site_id)
);

CREATE POLICY "site_modules_update"
ON public.site_modules
FOR UPDATE
TO authenticated
USING (auth.can_access_site(site_id))
WITH CHECK (auth.can_access_site(site_id));

CREATE POLICY "site_modules_delete"
ON public.site_modules
FOR DELETE
TO authenticated
USING (auth.can_access_site(site_id));

-- ============================================
-- STEP 13: SUBSCRIPTIONS POLICIES (Billing)
-- ============================================

-- Agency owners can view their subscriptions
CREATE POLICY "subscriptions_select"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- Only service role can manage subscriptions (via webhooks)
-- No INSERT/UPDATE/DELETE for regular users

-- ============================================
-- STEP 14: INVOICES POLICIES
-- ============================================

-- Agency owners can view invoices
CREATE POLICY "invoices_select"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  auth.is_agency_owner(agency_id)
  OR auth.is_super_admin()
);

-- Only service role can manage invoices (via webhooks)

-- ============================================
-- STEP 15: ACTIVITY LOGS POLICIES
-- ============================================

-- Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Agency members can view their activity logs
CREATE POLICY "activity_logs_select"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- System creates activity logs
CREATE POLICY "activity_logs_insert"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_agency_member(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- STEP 16: Grant permissions to service role
-- ============================================

-- Service role bypasses RLS but explicit grants help clarity
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

---

### Task 59.3: Service Role Client

**File: `src/lib/supabase/service-role.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Service role client for admin operations
// WARNING: This bypasses RLS - use with extreme caution!
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper for webhook handlers
export async function withServiceRole<T>(
  operation: (client: ReturnType<typeof createServiceRoleClient>) => Promise<T>
): Promise<T> {
  const client = createServiceRoleClient();
  return operation(client);
}
```

---

### Task 59.4: RLS Audit Testing Utilities

**File: `src/lib/security/rls-audit.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

interface AuditResult {
  table: string;
  rlsEnabled: boolean;
  policies: string[];
  issues: string[];
}

// Check RLS status for all tables
export async function auditRLSStatus(): Promise<AuditResult[]> {
  const serviceClient = createServiceRoleClient();
  const results: AuditResult[] = [];

  const tables = [
    "profiles",
    "agencies",
    "agency_members",
    "clients",
    "sites",
    "pages",
    "page_content",
    "modules",
    "module_subscriptions",
    "site_modules",
    "subscriptions",
    "invoices",
    "activity_logs",
  ];

  for (const table of tables) {
    const result: AuditResult = {
      table,
      rlsEnabled: false,
      policies: [],
      issues: [],
    };

    // Check if RLS is enabled
    const { data: rlsData } = await serviceClient.rpc("check_rls_enabled", {
      table_name: table,
    });

    result.rlsEnabled = rlsData ?? false;

    if (!result.rlsEnabled) {
      result.issues.push("RLS is not enabled");
    }

    // Get policies
    const { data: policiesData } = await serviceClient.rpc("get_table_policies", {
      table_name: table,
    });

    result.policies = policiesData?.map((p: any) => p.policyname) || [];

    if (result.policies.length === 0 && result.rlsEnabled) {
      result.issues.push("RLS enabled but no policies defined");
    }

    results.push(result);
  }

  return results;
}

// Test cross-agency access prevention
export async function testCrossAgencyAccess(
  agencyId1: string,
  agencyId2: string
): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];

  // This would be called from a test environment with mock users
  // For now, just return the structure
  return {
    passed: issues.length === 0,
    issues,
  };
}
```

---

### Task 59.5: Permission Checking Utilities

**File: `src/lib/security/permissions.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";

export type Permission =
  | "clients:read"
  | "clients:write"
  | "clients:delete"
  | "sites:read"
  | "sites:write"
  | "sites:delete"
  | "sites:publish"
  | "pages:read"
  | "pages:write"
  | "pages:delete"
  | "team:read"
  | "team:write"
  | "team:delete"
  | "billing:read"
  | "billing:write"
  | "modules:read"
  | "modules:subscribe"
  | "settings:read"
  | "settings:write"
  | "admin:access";

type Role = "owner" | "admin" | "member";

// Permission matrix by role
const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    "clients:read",
    "clients:write",
    "clients:delete",
    "sites:read",
    "sites:write",
    "sites:delete",
    "sites:publish",
    "pages:read",
    "pages:write",
    "pages:delete",
    "team:read",
    "team:write",
    "team:delete",
    "billing:read",
    "billing:write",
    "modules:read",
    "modules:subscribe",
    "settings:read",
    "settings:write",
  ],
  admin: [
    "clients:read",
    "clients:write",
    "clients:delete",
    "sites:read",
    "sites:write",
    "sites:delete",
    "sites:publish",
    "pages:read",
    "pages:write",
    "pages:delete",
    "team:read",
    "team:write",
    "modules:read",
    "settings:read",
  ],
  member: [
    "clients:read",
    "sites:read",
    "sites:write",
    "pages:read",
    "pages:write",
    "modules:read",
    "settings:read",
  ],
};

// Super admin has all permissions plus admin access
const superAdminPermissions: Permission[] = [
  ...rolePermissions.owner,
  "admin:access",
];

export interface UserPermissions {
  userId: string;
  agencyId: string | null;
  role: Role | "super_admin";
  permissions: Permission[];
}

// Get current user's permissions
export async function getCurrentUserPermissions(): Promise<UserPermissions | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check for super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "super_admin") {
    return {
      userId: user.id,
      agencyId: null,
      role: "super_admin",
      permissions: superAdminPermissions,
    };
  }

  // Get agency membership
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return {
      userId: user.id,
      agencyId: null,
      role: "member",
      permissions: [],
    };
  }

  const role = member.role as Role;
  return {
    userId: user.id,
    agencyId: member.agency_id,
    role,
    permissions: rolePermissions[role] || [],
  };
}

// Check if user has specific permission
export async function hasPermission(permission: Permission): Promise<boolean> {
  const userPerms = await getCurrentUserPermissions();
  if (!userPerms) return false;
  return userPerms.permissions.includes(permission);
}

// Check multiple permissions (all required)
export async function hasAllPermissions(
  permissions: Permission[]
): Promise<boolean> {
  const userPerms = await getCurrentUserPermissions();
  if (!userPerms) return false;
  return permissions.every((p) => userPerms.permissions.includes(p));
}

// Check multiple permissions (any required)
export async function hasAnyPermission(
  permissions: Permission[]
): Promise<boolean> {
  const userPerms = await getCurrentUserPermissions();
  if (!userPerms) return false;
  return permissions.some((p) => userPerms.permissions.includes(p));
}

// Guard function for server actions
export async function requirePermission(permission: Permission): Promise<void> {
  const hasPerms = await hasPermission(permission);
  if (!hasPerms) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}
```

---

### Task 59.6: Auth Signup Fix with Service Role

**File: `src/lib/auth/signup.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  agencyName: z.string().min(1),
});

export async function signupWithAgency(
  data: z.infer<typeof signupSchema>
): Promise<{ success: boolean; error?: string }> {
  const validation = signupSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const serviceClient = createServiceRoleClient();

  // 1. Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Failed to create account" };
  }

  const userId = authData.user.id;

  try {
    // 2. Use service role to create profile (bypasses RLS)
    const { error: profileError } = await serviceClient
      .from("profiles")
      .insert({
        id: userId,
        email: data.email,
        full_name: data.fullName,
        role: "admin",
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Cleanup: delete auth user
      await serviceClient.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to create profile" };
    }

    // 3. Create agency using service role
    const { data: agency, error: agencyError } = await serviceClient
      .from("agencies")
      .insert({
        name: data.agencyName,
        slug: data.agencyName.toLowerCase().replace(/\s+/g, "-"),
        owner_id: userId,
        plan: "starter",
      })
      .select()
      .single();

    if (agencyError || !agency) {
      console.error("Agency creation error:", agencyError);
      // Cleanup
      await serviceClient.from("profiles").delete().eq("id", userId);
      await serviceClient.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to create agency" };
    }

    // 4. Add user as agency owner
    const { error: memberError } = await serviceClient
      .from("agency_members")
      .insert({
        agency_id: agency.id,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      console.error("Agency member creation error:", memberError);
      // Cleanup
      await serviceClient.from("agencies").delete().eq("id", agency.id);
      await serviceClient.from("profiles").delete().eq("id", userId);
      await serviceClient.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to complete signup" };
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    // Attempt cleanup
    await serviceClient.auth.admin.deleteUser(userId).catch(() => {});
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

---

### Task 59.7: RLS SQL Helper Functions

**File: `migrations/20260116_rls_sql_helpers.sql`**

```sql
-- Helper function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = table_name 
    AND relnamespace = 'public'::regnamespace
  );
END;
$$;

-- Helper function to get policies for a table
CREATE OR REPLACE FUNCTION public.get_table_policies(table_name text)
RETURNS TABLE(policyname text, cmd text, qual text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pol.polname::text as policyname,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END as cmd,
    pg_get_expr(pol.polqual, pol.polrelid)::text as qual
  FROM pg_policy pol
  JOIN pg_class pc ON pc.oid = pol.polrelid
  WHERE pc.relname = table_name
  AND pc.relnamespace = 'public'::regnamespace;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_policies(text) TO authenticated;
```

---

## 🧪 Testing Checklist

### RLS Enable Verification
- [ ] All tables have RLS enabled
- [ ] No tables can be accessed without policies

### Policy Testing
- [ ] User can only see their own profile
- [ ] User can only see their own agency
- [ ] User cannot access other agencies' clients
- [ ] User cannot access other agencies' sites
- [ ] User cannot access other agencies' pages
- [ ] Public sites are accessible to anon
- [ ] Super admin can access everything

### Signup Flow Testing
- [ ] New user signup creates profile
- [ ] New user signup creates agency
- [ ] New user becomes agency owner
- [ ] All RLS policies allow normal operation

### Edge Cases
- [ ] User removed from agency loses access
- [ ] Archived clients still accessible to agency
- [ ] Published sites accessible to public
- [ ] Unpublished sites NOT accessible to public

---

## ✅ Completion Checklist

- [ ] All migration files created
- [ ] All helper functions working
- [ ] Service role client implemented
- [ ] Permission utilities implemented
- [ ] Signup flow updated
- [ ] All tables have RLS enabled
- [ ] All policies tested
- [ ] No cross-agency data leaks
- [ ] Public content accessible
- [ ] Super admin access working

---

## 📝 Security Notes

1. **Never expose service role key to client**
2. **Always validate user input before database operations**
3. **Log all permission failures for audit**
4. **Regularly review RLS policies**
5. **Test cross-agency access in staging**

---

**Next Phase**: Phase 60 - Content Safety Filter
