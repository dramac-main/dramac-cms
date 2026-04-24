-- =============================================================================
-- Portal Foundation Migration (Session 1 of Client Portal Overhaul)
-- =============================================================================
-- Adds:
--   1. portal_audit_log table + RLS
--   2. is_portal_user_for_client(client_id) helper
--   3. is_portal_user_for_site(site_id) helper
--   4. Portal SELECT policies on sites, mod_ecommod01_orders, mod_chat_conversations
--
-- Safety notes:
--   - Admin client (service role) bypasses RLS, so agency dashboard reads unaffected.
--   - Storefront reads already flow through anon/admin paths that do not rely on
--     these helpers; storefront queries are unaffected.
--   - All new policies are ADDITIVE. No existing policies are dropped or altered.
--   - Helpers are SECURITY DEFINER so they can look up clients/permissions without
--     requiring the caller to have SELECT on clients.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. portal_audit_log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.portal_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Who
  auth_user_id    uuid,                 -- auth.users.id of the actor (may be impersonator)
  client_id       uuid,                 -- clients.id of the target (impersonated subject)
  agency_id       uuid,                 -- clients.agency_id, denormalized for tenant scoping
  is_impersonation boolean NOT NULL DEFAULT false,
  impersonator_email text,              -- captured when is_impersonation = true

  -- What
  action          text NOT NULL,        -- e.g. 'portal.signin', 'portal.site.switch', 'portal.orders.view'
  resource_type   text,                 -- e.g. 'site', 'order', 'conversation'
  resource_id     text,                 -- free text — may be uuid or composite

  -- Where
  site_id         uuid,                 -- optional scope

  -- Result
  result          text NOT NULL DEFAULT 'ok', -- 'ok' | 'denied' | 'error'
  permission_key  text,                 -- permission checked, if any (e.g. 'canManageOrders')

  -- Why / details
  reason          text,                 -- denial reason, error summary
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Request context
  ip_address      text,
  user_agent      text
);

CREATE INDEX IF NOT EXISTS portal_audit_log_client_created_idx
  ON public.portal_audit_log (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_audit_log_agency_created_idx
  ON public.portal_audit_log (agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_audit_log_action_created_idx
  ON public.portal_audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_audit_log_result_idx
  ON public.portal_audit_log (result)
  WHERE result <> 'ok';

ALTER TABLE public.portal_audit_log ENABLE ROW LEVEL SECURITY;

-- Inserts happen exclusively via the service role (audit writer). Block direct inserts
-- from authenticated users.
DROP POLICY IF EXISTS portal_audit_log_no_client_insert ON public.portal_audit_log;
CREATE POLICY portal_audit_log_no_client_insert
  ON public.portal_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Agency owners can read their own tenant's audit rows.
DROP POLICY IF EXISTS portal_audit_log_select_agency ON public.portal_audit_log;
CREATE POLICY portal_audit_log_select_agency
  ON public.portal_audit_log
  FOR SELECT
  TO authenticated
  USING (
    agency_id IS NOT NULL
    AND agency_id IN (
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
  );

COMMENT ON TABLE public.portal_audit_log IS
  'Audit trail for every sensitive portal action. Written fire-and-forget by the portal audit writer. Readable by super admins and agency owners scoped to their tenant.';


-- ---------------------------------------------------------------------------
-- 2. is_portal_user_for_client(client_id uuid) -> boolean
-- ---------------------------------------------------------------------------
-- True when the calling auth.uid() is the portal_user_id for the given client
-- AND that client has has_portal_access = true.
--
-- Intentionally does NOT account for impersonation. Impersonation flows use
-- the admin client in application code; RLS is the final backstop for real
-- portal-user sessions only.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_portal_user_for_client(check_client_id uuid)
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
       AND c.portal_user_id = auth.uid()
       AND c.has_portal_access = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_user_for_client(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_portal_user_for_client(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. is_portal_user_for_site(site_id uuid) -> boolean
-- ---------------------------------------------------------------------------
-- True when the calling auth.uid() is a portal user whose linked client owns
-- the given site. Site ownership is determined by sites.client_id.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_portal_user_for_site(check_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.is_portal_user_for_site(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_portal_user_for_site(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Additive SELECT policies for portal users
-- ---------------------------------------------------------------------------
-- These policies ONLY GRANT access. They do not restrict any existing policy,
-- because Postgres RLS policies are OR-composed for the same role/command.
-- Existing agency-owner and service-role access paths are untouched.
-- ---------------------------------------------------------------------------

-- sites --------------------------------------------------------------------
DROP POLICY IF EXISTS sites_portal_user_select ON public.sites;
CREATE POLICY sites_portal_user_select
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (
    client_id IS NOT NULL
    AND public.is_portal_user_for_client(client_id)
  );

-- mod_ecommod01_orders -----------------------------------------------------
-- Orders belong to sites; a portal user whose client owns the site can read.
DROP POLICY IF EXISTS mod_ecommod01_orders_portal_user_select
  ON public.mod_ecommod01_orders;
CREATE POLICY mod_ecommod01_orders_portal_user_select
  ON public.mod_ecommod01_orders
  FOR SELECT
  TO authenticated
  USING (
    site_id IS NOT NULL
    AND public.is_portal_user_for_site(site_id)
  );

-- mod_chat_conversations ---------------------------------------------------
DROP POLICY IF EXISTS mod_chat_conversations_portal_user_select
  ON public.mod_chat_conversations;
CREATE POLICY mod_chat_conversations_portal_user_select
  ON public.mod_chat_conversations
  FOR SELECT
  TO authenticated
  USING (
    site_id IS NOT NULL
    AND public.is_portal_user_for_site(site_id)
  );

-- NOTE: Internal notes (mod_chat_internal_notes or similar) are DELIBERATELY
-- not granted to portal users here. Agent-only surfaces remain agent-only.
-- Session 2 (Communication) will introduce notes visibility policies only if
-- the portal user is promoted to an agent role under the tenant.

-- =============================================================================
-- End of portal-01-foundation.sql
-- =============================================================================
