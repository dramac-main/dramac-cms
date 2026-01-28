-- ============================================
-- DRAMAC RLS HELPER FUNCTIONS
-- Phase 59 - January 2026
-- ============================================
-- 
-- These functions provide reusable security checks for RLS policies.
-- All functions are SECURITY DEFINER to run with elevated privileges.
-- Note: Must be in public schema (auth schema is restricted in Supabase).
-- ============================================

-- ============================================
-- HELPER FUNCTION: Get current user's agency ID
-- Returns the agency_id from the current user's profile
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_current_agency_id() IS 
  'Returns the agency_id of the currently authenticated user from their profile.';

-- ============================================
-- HELPER FUNCTION: Check if user is agency member
-- Returns true if user belongs to specified agency
-- ============================================
CREATE OR REPLACE FUNCTION public.is_agency_member(check_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.agency_members 
    WHERE user_id = auth.uid() 
    AND agency_id = check_agency_id
  )
$$;

COMMENT ON FUNCTION public.is_agency_member(uuid) IS 
  'Checks if current user is a member of the specified agency.';

-- ============================================
-- HELPER FUNCTION: Check if user is agency admin/owner
-- Returns true if user has admin or owner role in specified agency
-- ============================================
CREATE OR REPLACE FUNCTION public.is_agency_admin(check_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.agency_members 
    WHERE user_id = auth.uid() 
    AND agency_id = check_agency_id
    AND role IN ('admin', 'owner')
  )
$$;

COMMENT ON FUNCTION public.is_agency_admin(uuid) IS 
  'Checks if current user is an admin or owner of the specified agency.';

-- ============================================
-- HELPER FUNCTION: Check if user is super admin
-- Returns true if user has super_admin role in profiles
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 
  'Checks if current user has super_admin role.';

-- ============================================
-- HELPER FUNCTION: Check if user can access a site
-- Returns true if site belongs to user's agency or user is super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.can_access_site(check_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.sites s
    WHERE s.id = check_site_id
    AND (
      s.agency_id = public.get_current_agency_id()
      OR public.is_super_admin()
    )
  )
$$;

COMMENT ON FUNCTION public.can_access_site(uuid) IS 
  'Checks if current user can access the specified site.';

-- ============================================
-- HELPER FUNCTION: Check if user can access a client
-- Returns true if client belongs to user's agency or user is super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.can_access_client(check_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.clients c
    WHERE c.id = check_client_id
    AND (
      c.agency_id = public.get_current_agency_id()
      OR public.is_super_admin()
    )
  )
$$;

COMMENT ON FUNCTION public.can_access_client(uuid) IS 
  'Checks if current user can access the specified client.';

-- ============================================
-- HELPER FUNCTION: Check if user can access a page
-- Returns true if page's site belongs to user's agency
-- ============================================
CREATE OR REPLACE FUNCTION public.can_access_page(check_page_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.pages p
    INNER JOIN public.sites s ON p.site_id = s.id
    WHERE p.id = check_page_id
    AND (
      s.agency_id = public.get_current_agency_id()
      OR public.is_super_admin()
    )
  )
$$;

COMMENT ON FUNCTION public.can_access_page(uuid) IS 
  'Checks if current user can access the specified page.';

-- ============================================
-- HELPER FUNCTION: Check if user can manage modules
-- Returns true if user is agency admin or super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.can_manage_modules(check_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_agency_admin(check_agency_id)
    OR public.is_super_admin()
  )
$$;

COMMENT ON FUNCTION public.can_manage_modules(uuid) IS 
  'Checks if current user can manage modules for the specified agency.';

-- ============================================
-- HELPER FUNCTION: Get user's role in an agency
-- Returns the role (owner, admin, member, viewer) or NULL
-- ============================================
CREATE OR REPLACE FUNCTION public.get_agency_role(check_agency_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.agency_members
  WHERE user_id = auth.uid()
  AND agency_id = check_agency_id
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_agency_role(uuid) IS 
  'Returns the current users role in the specified agency.';

-- ============================================
-- Grant execute permissions on helper functions
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_current_agency_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_agency_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_agency_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_site(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_page(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_modules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_role(uuid) TO authenticated;

-- ============================================
-- Verification queries (run manually to test)
-- ============================================
-- SELECT public.get_current_agency_id();
-- SELECT public.is_super_admin();
-- SELECT public.is_agency_member('agency-uuid-here');
