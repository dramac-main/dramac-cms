-- Portal Live Chat RLS Fix
-- ==========================
--
-- Problem
-- -------
-- The Live Chat conversations list in the client portal was empty even though
-- the dashboard count widget correctly reported that conversations exist. The
-- divergence was caused by `getConversations()` in
-- `src/modules/live-chat/actions/conversation-actions.ts` issuing an
-- authenticated SSR query with an `mod_chat_visitors!inner(...)` join. The
-- `site_isolation` RLS policies on every `mod_chat_*` table (defined in
-- `lc-01-chat-schema.sql`) use an inline `agency_members` sub-select that
-- only admits agency members:
--
--     site_id IN (
--       SELECT s.id FROM sites s
--       JOIN agency_members am ON am.agency_id = s.agency_id
--       WHERE am.user_id = auth.uid()
--     )
--
-- Session 9 Part B fixed `can_access_site()` to admit portal users via
-- `is_portal_user_for_site()`, but these chat policies do not call that
-- helper, so portal users are still rejected. The inner join on
-- `mod_chat_visitors` then silently returns zero rows.
--
-- Fix
-- ---
-- Add parallel SELECT-only RLS policies named `<table>_portal_select` that
-- admit portal users via `is_portal_user_for_site(site_id)`. The existing
-- `site_isolation` (FOR ALL) policies remain in place and continue to gate
-- INSERT/UPDATE/DELETE to agency members, matching the portal permission
-- model (portal users have read access to the shared operational data of
-- sites they own).
--
-- Apply via Supabase MCP:
--   mcp_supabase_apply_migration({
--     name: 'portal_live_chat_rls',
--     query: <contents of this file>
--   })

-- ---------------------------------------------------------------------------
-- Portal SELECT admission for every mod_chat_* table.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "chat_departments_portal_select" ON public.mod_chat_departments;
CREATE POLICY "chat_departments_portal_select" ON public.mod_chat_departments
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_agents_portal_select" ON public.mod_chat_agents;
CREATE POLICY "chat_agents_portal_select" ON public.mod_chat_agents
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_widget_settings_portal_select" ON public.mod_chat_widget_settings;
CREATE POLICY "chat_widget_settings_portal_select" ON public.mod_chat_widget_settings
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_visitors_portal_select" ON public.mod_chat_visitors;
CREATE POLICY "chat_visitors_portal_select" ON public.mod_chat_visitors
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_conversations_portal_select" ON public.mod_chat_conversations;
CREATE POLICY "chat_conversations_portal_select" ON public.mod_chat_conversations
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_messages_portal_select" ON public.mod_chat_messages;
CREATE POLICY "chat_messages_portal_select" ON public.mod_chat_messages
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_canned_responses_portal_select" ON public.mod_chat_canned_responses;
CREATE POLICY "chat_canned_responses_portal_select" ON public.mod_chat_canned_responses
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_knowledge_base_portal_select" ON public.mod_chat_knowledge_base;
CREATE POLICY "chat_knowledge_base_portal_select" ON public.mod_chat_knowledge_base
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

DROP POLICY IF EXISTS "chat_analytics_portal_select" ON public.mod_chat_analytics;
CREATE POLICY "chat_analytics_portal_select" ON public.mod_chat_analytics
  FOR SELECT
  USING (public.is_portal_user_for_site(site_id));

-- ---------------------------------------------------------------------------
-- Verification queries (run manually as the portal user's JWT to confirm).
-- ---------------------------------------------------------------------------
--
-- SET LOCAL "request.jwt.claims" = '{"sub":"4be3ebeb-c1a5-4c7e-9210-3f0ba2733852","role":"authenticated"}';
-- SELECT count(*) FROM mod_chat_conversations
--   WHERE site_id = 'b019cce4-35ff-4283-a032-6d87f56b9302';
-- -- Expect: 3
--
-- SELECT count(*) FROM mod_chat_visitors
--   WHERE site_id = 'b019cce4-35ff-4283-a032-6d87f56b9302';
-- -- Expect: 3 (or however many unique visitors)
