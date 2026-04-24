-- Applied via Supabase MCP on production (project nfirsqmyxmmtbignofgb) during
-- Session 9 Part B.
--
-- Problem
-- -------
-- The client portal delivered empty data on CRM, Live Chat, Marketing,
-- Automation and other module pages even though the data exists and the
-- portal auth layer granted the user access via verifyPortalModuleAccess.
-- These agency-shared pages call module server actions that use the SSR
-- Supabase client (createClient) whose queries are subject to RLS. The RLS
-- SELECT policies on mod_* tables gate reads through can_access_site(site_id),
-- which only admitted agency members (via get_current_agency_id) or super
-- admins. Portal auth users have no profiles row, so they were rejected by
-- every SELECT policy and saw empty pages.
--
-- Fix
-- ---
-- Add a third branch to can_access_site() that admits a portal user whose
-- client owns the site. Write policies (UPDATE, DELETE) remain gated by
-- agency_members membership, so portal users can only read (and, through the
-- existing permissive INSERT policies, insert) — matching the permission
-- model the portal UI already enforces.

CREATE OR REPLACE FUNCTION public.is_portal_user_for_site(check_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sites s
    JOIN public.clients c ON c.id = s.client_id
    WHERE s.id = check_site_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_site(check_site_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.sites s
    WHERE s.id = check_site_id
      AND (
        s.agency_id = public.get_current_agency_id()
        OR public.is_super_admin()
        OR public.is_portal_user_for_site(check_site_id)
      )
  );
END;
$$;

COMMENT ON FUNCTION public.is_portal_user_for_site(uuid) IS
  'Returns true when auth.uid() is a portal user linked to the client that owns the given site.';
