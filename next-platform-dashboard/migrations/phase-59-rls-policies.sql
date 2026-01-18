-- ============================================
-- DRAMAC RLS POLICIES
-- Phase 59 - January 2026
-- ============================================
-- 
-- IMPORTANT: Run phase-59-rls-helpers.sql FIRST to create helper functions
--
-- This migration enables Row Level Security and creates policies
-- for all tables to ensure proper data isolation between agencies.
-- ============================================

-- ============================================
-- PROFILES TABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
USING (
  id = auth.uid()
  OR auth.is_super_admin()
);

-- ============================================
-- AGENCIES TABLE RLS
-- ============================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_select" ON agencies;
CREATE POLICY "agency_select" ON agencies FOR SELECT
USING (
  id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
  OR id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_insert" ON agencies;
CREATE POLICY "agency_insert" ON agencies FOR INSERT
WITH CHECK (owner_id = auth.uid() OR auth.is_super_admin());

DROP POLICY IF EXISTS "agency_update" ON agencies;
CREATE POLICY "agency_update" ON agencies FOR UPDATE
USING (
  auth.is_agency_admin(id) OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_delete" ON agencies;
CREATE POLICY "agency_delete" ON agencies FOR DELETE
USING (
  owner_id = auth.uid() OR auth.is_super_admin()
);

-- ============================================
-- AGENCY_MEMBERS TABLE RLS
-- ============================================
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_members_select" ON agency_members;
CREATE POLICY "agency_members_select" ON agency_members FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR user_id = auth.uid()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_members_insert" ON agency_members;
CREATE POLICY "agency_members_insert" ON agency_members FOR INSERT
WITH CHECK (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_members_update" ON agency_members;
CREATE POLICY "agency_members_update" ON agency_members FOR UPDATE
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_members_delete" ON agency_members;
CREATE POLICY "agency_members_delete" ON agency_members FOR DELETE
USING (
  auth.is_agency_admin(agency_id)
  OR auth.is_super_admin()
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
-- PAGE_CONTENT TABLE RLS
-- ============================================
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_content_select" ON page_content;
CREATE POLICY "page_content_select" ON page_content FOR SELECT
USING (auth.can_access_page(page_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "page_content_insert" ON page_content;
CREATE POLICY "page_content_insert" ON page_content FOR INSERT
WITH CHECK (auth.can_access_page(page_id));

DROP POLICY IF EXISTS "page_content_update" ON page_content;
CREATE POLICY "page_content_update" ON page_content FOR UPDATE
USING (auth.can_access_page(page_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "page_content_delete" ON page_content;
CREATE POLICY "page_content_delete" ON page_content FOR DELETE
USING (auth.can_access_page(page_id) OR auth.is_super_admin());

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
-- AUDIT_LOGS TABLE RLS
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
WITH CHECK (true); -- Allow system to create audit logs

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

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- NOTIFICATION_PREFERENCES TABLE RLS
-- ============================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_select" ON notification_preferences;
CREATE POLICY "notification_preferences_select" ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_insert" ON notification_preferences;
CREATE POLICY "notification_preferences_insert" ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_update" ON notification_preferences;
CREATE POLICY "notification_preferences_update" ON notification_preferences FOR UPDATE
USING (user_id = auth.uid());

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

DROP POLICY IF EXISTS "modules_v2_insert" ON modules_v2;
CREATE POLICY "modules_v2_insert" ON modules_v2 FOR INSERT
WITH CHECK (auth.is_super_admin());

DROP POLICY IF EXISTS "modules_v2_update" ON modules_v2;
CREATE POLICY "modules_v2_update" ON modules_v2 FOR UPDATE
USING (
  created_by = auth.uid()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "modules_v2_delete" ON modules_v2;
CREATE POLICY "modules_v2_delete" ON modules_v2 FOR DELETE
USING (auth.is_super_admin());

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
-- AGENCY_MODULE_INSTALLATIONS TABLE RLS
-- ============================================
ALTER TABLE agency_module_installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_module_installations_select" ON agency_module_installations;
CREATE POLICY "agency_module_installations_select" ON agency_module_installations FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_module_installations_insert" ON agency_module_installations;
CREATE POLICY "agency_module_installations_insert" ON agency_module_installations FOR INSERT
WITH CHECK (
  auth.can_manage_modules(agency_id)
);

DROP POLICY IF EXISTS "agency_module_installations_update" ON agency_module_installations;
CREATE POLICY "agency_module_installations_update" ON agency_module_installations FOR UPDATE
USING (
  auth.can_manage_modules(agency_id)
);

DROP POLICY IF EXISTS "agency_module_installations_delete" ON agency_module_installations;
CREATE POLICY "agency_module_installations_delete" ON agency_module_installations FOR DELETE
USING (
  auth.can_manage_modules(agency_id)
);

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

DROP POLICY IF EXISTS "agency_module_subscriptions_insert" ON agency_module_subscriptions;
CREATE POLICY "agency_module_subscriptions_insert" ON agency_module_subscriptions FOR INSERT
WITH CHECK (
  auth.can_manage_modules(agency_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "agency_module_subscriptions_update" ON agency_module_subscriptions;
CREATE POLICY "agency_module_subscriptions_update" ON agency_module_subscriptions FOR UPDATE
USING (
  auth.can_manage_modules(agency_id)
  OR auth.is_super_admin()
);

-- ============================================
-- CLIENT_MODULE_INSTALLATIONS TABLE RLS
-- ============================================
ALTER TABLE client_module_installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_module_installations_select" ON client_module_installations;
CREATE POLICY "client_module_installations_select" ON client_module_installations FOR SELECT
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "client_module_installations_insert" ON client_module_installations;
CREATE POLICY "client_module_installations_insert" ON client_module_installations FOR INSERT
WITH CHECK (auth.can_access_client(client_id));

DROP POLICY IF EXISTS "client_module_installations_update" ON client_module_installations;
CREATE POLICY "client_module_installations_update" ON client_module_installations FOR UPDATE
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "client_module_installations_delete" ON client_module_installations;
CREATE POLICY "client_module_installations_delete" ON client_module_installations FOR DELETE
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

-- ============================================
-- BLOG_POSTS TABLE RLS
-- ============================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_posts_select" ON blog_posts;
CREATE POLICY "blog_posts_select" ON blog_posts FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "blog_posts_insert" ON blog_posts;
CREATE POLICY "blog_posts_insert" ON blog_posts FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "blog_posts_update" ON blog_posts;
CREATE POLICY "blog_posts_update" ON blog_posts FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "blog_posts_delete" ON blog_posts;
CREATE POLICY "blog_posts_delete" ON blog_posts FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- BLOG_CATEGORIES TABLE RLS
-- ============================================
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_categories_select" ON blog_categories;
CREATE POLICY "blog_categories_select" ON blog_categories FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "blog_categories_insert" ON blog_categories;
CREATE POLICY "blog_categories_insert" ON blog_categories FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "blog_categories_update" ON blog_categories;
CREATE POLICY "blog_categories_update" ON blog_categories FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "blog_categories_delete" ON blog_categories;
CREATE POLICY "blog_categories_delete" ON blog_categories FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- BLOG_POST_CATEGORIES TABLE RLS
-- ============================================
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_post_categories_select" ON blog_post_categories;
CREATE POLICY "blog_post_categories_select" ON blog_post_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    WHERE bp.id = blog_post_categories.post_id
    AND auth.can_access_site(bp.site_id)
  )
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "blog_post_categories_insert" ON blog_post_categories;
CREATE POLICY "blog_post_categories_insert" ON blog_post_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    WHERE bp.id = blog_post_categories.post_id
    AND auth.can_access_site(bp.site_id)
  )
);

DROP POLICY IF EXISTS "blog_post_categories_delete" ON blog_post_categories;
CREATE POLICY "blog_post_categories_delete" ON blog_post_categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    WHERE bp.id = blog_post_categories.post_id
    AND auth.can_access_site(bp.site_id)
  )
  OR auth.is_super_admin()
);

-- ============================================
-- FORM_SUBMISSIONS TABLE RLS
-- ============================================
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "form_submissions_select" ON form_submissions;
CREATE POLICY "form_submissions_select" ON form_submissions FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "form_submissions_insert" ON form_submissions;
CREATE POLICY "form_submissions_insert" ON form_submissions FOR INSERT
WITH CHECK (true); -- Allow public form submissions

DROP POLICY IF EXISTS "form_submissions_update" ON form_submissions;
CREATE POLICY "form_submissions_update" ON form_submissions FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "form_submissions_delete" ON form_submissions;
CREATE POLICY "form_submissions_delete" ON form_submissions FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- FORM_SETTINGS TABLE RLS
-- ============================================
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "form_settings_select" ON form_settings;
CREATE POLICY "form_settings_select" ON form_settings FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "form_settings_insert" ON form_settings;
CREATE POLICY "form_settings_insert" ON form_settings FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "form_settings_update" ON form_settings;
CREATE POLICY "form_settings_update" ON form_settings FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "form_settings_delete" ON form_settings;
CREATE POLICY "form_settings_delete" ON form_settings FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- FORM_WEBHOOKS TABLE RLS
-- ============================================
ALTER TABLE form_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "form_webhooks_select" ON form_webhooks;
CREATE POLICY "form_webhooks_select" ON form_webhooks FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "form_webhooks_insert" ON form_webhooks;
CREATE POLICY "form_webhooks_insert" ON form_webhooks FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "form_webhooks_update" ON form_webhooks;
CREATE POLICY "form_webhooks_update" ON form_webhooks FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "form_webhooks_delete" ON form_webhooks;
CREATE POLICY "form_webhooks_delete" ON form_webhooks FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- ASSETS TABLE RLS
-- ============================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_select" ON assets;
CREATE POLICY "assets_select" ON assets FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "assets_insert" ON assets;
CREATE POLICY "assets_insert" ON assets FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
);

DROP POLICY IF EXISTS "assets_update" ON assets;
CREATE POLICY "assets_update" ON assets FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "assets_delete" ON assets;
CREATE POLICY "assets_delete" ON assets FOR DELETE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

-- ============================================
-- MEDIA_FOLDERS TABLE RLS
-- ============================================
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_folders_select" ON media_folders;
CREATE POLICY "media_folders_select" ON media_folders FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "media_folders_insert" ON media_folders;
CREATE POLICY "media_folders_insert" ON media_folders FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
);

DROP POLICY IF EXISTS "media_folders_update" ON media_folders;
CREATE POLICY "media_folders_update" ON media_folders FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "media_folders_delete" ON media_folders;
CREATE POLICY "media_folders_delete" ON media_folders FOR DELETE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

-- ============================================
-- MEDIA_USAGE TABLE RLS
-- ============================================
ALTER TABLE media_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_usage_select" ON media_usage;
CREATE POLICY "media_usage_select" ON media_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = media_usage.asset_id
    AND a.agency_id = auth.get_current_agency_id()
  )
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "media_usage_insert" ON media_usage;
CREATE POLICY "media_usage_insert" ON media_usage FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = media_usage.asset_id
    AND a.agency_id = auth.get_current_agency_id()
  )
);

DROP POLICY IF EXISTS "media_usage_delete" ON media_usage;
CREATE POLICY "media_usage_delete" ON media_usage FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = media_usage.asset_id
    AND a.agency_id = auth.get_current_agency_id()
  )
  OR auth.is_super_admin()
);

-- ============================================
-- SUBSCRIPTIONS TABLE RLS
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT
WITH CHECK (
  auth.is_super_admin()
);

DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE
USING (
  auth.is_super_admin()
);

-- ============================================
-- INVOICES TABLE RLS
-- ============================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices FOR INSERT
WITH CHECK (auth.is_super_admin());

-- ============================================
-- SEO_AUDITS TABLE RLS
-- ============================================
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seo_audits_select" ON seo_audits;
CREATE POLICY "seo_audits_select" ON seo_audits FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "seo_audits_insert" ON seo_audits;
CREATE POLICY "seo_audits_insert" ON seo_audits FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "seo_audits_update" ON seo_audits;
CREATE POLICY "seo_audits_update" ON seo_audits FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "seo_audits_delete" ON seo_audits;
CREATE POLICY "seo_audits_delete" ON seo_audits FOR DELETE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- SITE_SEO_SETTINGS TABLE RLS
-- ============================================
ALTER TABLE site_seo_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_seo_settings_select" ON site_seo_settings;
CREATE POLICY "site_seo_settings_select" ON site_seo_settings FOR SELECT
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

DROP POLICY IF EXISTS "site_seo_settings_insert" ON site_seo_settings;
CREATE POLICY "site_seo_settings_insert" ON site_seo_settings FOR INSERT
WITH CHECK (auth.can_access_site(site_id));

DROP POLICY IF EXISTS "site_seo_settings_update" ON site_seo_settings;
CREATE POLICY "site_seo_settings_update" ON site_seo_settings FOR UPDATE
USING (auth.can_access_site(site_id) OR auth.is_super_admin());

-- ============================================
-- TEMPLATES TABLE RLS
-- ============================================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_select" ON templates;
CREATE POLICY "templates_select" ON templates FOR SELECT
USING (
  is_public = true
  OR agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "templates_insert" ON templates;
CREATE POLICY "templates_insert" ON templates FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "templates_update" ON templates;
CREATE POLICY "templates_update" ON templates FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "templates_delete" ON templates;
CREATE POLICY "templates_delete" ON templates FOR DELETE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

-- ============================================
-- SUPPORT_TICKETS TABLE RLS
-- ============================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select" ON support_tickets;
CREATE POLICY "support_tickets_select" ON support_tickets FOR SELECT
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "support_tickets_insert" ON support_tickets;
CREATE POLICY "support_tickets_insert" ON support_tickets FOR INSERT
WITH CHECK (auth.can_access_client(client_id));

DROP POLICY IF EXISTS "support_tickets_update" ON support_tickets;
CREATE POLICY "support_tickets_update" ON support_tickets FOR UPDATE
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

-- ============================================
-- TICKET_MESSAGES TABLE RLS
-- ============================================
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_messages_select" ON ticket_messages;
CREATE POLICY "ticket_messages_select" ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets st
    WHERE st.id = ticket_messages.ticket_id
    AND auth.can_access_client(st.client_id)
  )
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "ticket_messages_insert" ON ticket_messages;
CREATE POLICY "ticket_messages_insert" ON ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets st
    WHERE st.id = ticket_messages.ticket_id
    AND auth.can_access_client(st.client_id)
  )
  OR auth.is_super_admin()
);

-- ============================================
-- CLIENT_NOTIFICATIONS TABLE RLS
-- ============================================
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_notifications_select" ON client_notifications;
CREATE POLICY "client_notifications_select" ON client_notifications FOR SELECT
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "client_notifications_insert" ON client_notifications;
CREATE POLICY "client_notifications_insert" ON client_notifications FOR INSERT
WITH CHECK (true); -- Allow system to create

DROP POLICY IF EXISTS "client_notifications_update" ON client_notifications;
CREATE POLICY "client_notifications_update" ON client_notifications FOR UPDATE
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

-- ============================================
-- CLIENT_SITE_PERMISSIONS TABLE RLS
-- ============================================
ALTER TABLE client_site_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_site_permissions_select" ON client_site_permissions;
CREATE POLICY "client_site_permissions_select" ON client_site_permissions FOR SELECT
USING (
  auth.can_access_client(client_id)
  OR auth.can_access_site(site_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "client_site_permissions_insert" ON client_site_permissions;
CREATE POLICY "client_site_permissions_insert" ON client_site_permissions FOR INSERT
WITH CHECK (
  auth.can_access_client(client_id)
  AND auth.can_access_site(site_id)
);

DROP POLICY IF EXISTS "client_site_permissions_update" ON client_site_permissions;
CREATE POLICY "client_site_permissions_update" ON client_site_permissions FOR UPDATE
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "client_site_permissions_delete" ON client_site_permissions;
CREATE POLICY "client_site_permissions_delete" ON client_site_permissions FOR DELETE
USING (
  auth.can_access_client(client_id)
  OR auth.is_super_admin()
);

-- ============================================
-- RATE_LIMITS TABLE RLS
-- ============================================
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_select" ON rate_limits;
CREATE POLICY "rate_limits_select" ON rate_limits FOR SELECT
USING (user_id = auth.uid() OR auth.is_super_admin());

DROP POLICY IF EXISTS "rate_limits_insert" ON rate_limits;
CREATE POLICY "rate_limits_insert" ON rate_limits FOR INSERT
WITH CHECK (true); -- Allow system to track rate limits

DROP POLICY IF EXISTS "rate_limits_delete" ON rate_limits;
CREATE POLICY "rate_limits_delete" ON rate_limits FOR DELETE
USING (auth.is_super_admin());

-- ============================================
-- MODULE_SOURCE TABLE RLS
-- ============================================
ALTER TABLE module_source ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_source_select" ON module_source;
CREATE POLICY "module_source_select" ON module_source FOR SELECT
USING (
  status = 'published'
  OR created_by = auth.uid()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_source_insert" ON module_source;
CREATE POLICY "module_source_insert" ON module_source FOR INSERT
WITH CHECK (auth.is_super_admin());

DROP POLICY IF EXISTS "module_source_update" ON module_source;
CREATE POLICY "module_source_update" ON module_source FOR UPDATE
USING (
  created_by = auth.uid()
  OR auth.is_super_admin()
);

-- ============================================
-- MODULE_VERSIONS TABLE RLS
-- ============================================
ALTER TABLE module_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_versions_select" ON module_versions;
CREATE POLICY "module_versions_select" ON module_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM module_source ms
    WHERE ms.id = module_versions.module_source_id
    AND (ms.status = 'published' OR ms.created_by = auth.uid())
  )
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_versions_insert" ON module_versions;
CREATE POLICY "module_versions_insert" ON module_versions FOR INSERT
WITH CHECK (auth.is_super_admin());

-- ============================================
-- MODULE_ANALYTICS TABLE RLS
-- ============================================
ALTER TABLE module_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_analytics_select" ON module_analytics;
CREATE POLICY "module_analytics_select" ON module_analytics FOR SELECT
USING (auth.is_super_admin());

DROP POLICY IF EXISTS "module_analytics_insert" ON module_analytics;
CREATE POLICY "module_analytics_insert" ON module_analytics FOR INSERT
WITH CHECK (true); -- Allow system

DROP POLICY IF EXISTS "module_analytics_update" ON module_analytics;
CREATE POLICY "module_analytics_update" ON module_analytics FOR UPDATE
USING (auth.is_super_admin());

-- ============================================
-- MODULE_DEPLOYMENTS TABLE RLS
-- ============================================
ALTER TABLE module_deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_deployments_select" ON module_deployments;
CREATE POLICY "module_deployments_select" ON module_deployments FOR SELECT
USING (
  deployed_by = auth.uid()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_deployments_insert" ON module_deployments;
CREATE POLICY "module_deployments_insert" ON module_deployments FOR INSERT
WITH CHECK (auth.is_super_admin());

-- ============================================
-- MODULE_ERROR_LOGS TABLE RLS
-- ============================================
ALTER TABLE module_error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_error_logs_select" ON module_error_logs;
CREATE POLICY "module_error_logs_select" ON module_error_logs FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_error_logs_insert" ON module_error_logs;
CREATE POLICY "module_error_logs_insert" ON module_error_logs FOR INSERT
WITH CHECK (true); -- Allow system to log errors

-- ============================================
-- MODULE_USAGE_EVENTS TABLE RLS
-- ============================================
ALTER TABLE module_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_usage_events_select" ON module_usage_events;
CREATE POLICY "module_usage_events_select" ON module_usage_events FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_usage_events_insert" ON module_usage_events;
CREATE POLICY "module_usage_events_insert" ON module_usage_events FOR INSERT
WITH CHECK (true); -- Allow system to track usage

-- ============================================
-- MODULE_REQUESTS TABLE RLS
-- ============================================
ALTER TABLE module_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_requests_select" ON module_requests;
CREATE POLICY "module_requests_select" ON module_requests FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR status = 'approved'
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_requests_insert" ON module_requests;
CREATE POLICY "module_requests_insert" ON module_requests FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
);

DROP POLICY IF EXISTS "module_requests_update" ON module_requests;
CREATE POLICY "module_requests_update" ON module_requests FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

-- ============================================
-- MODULE_REQUEST_VOTES TABLE RLS
-- ============================================
ALTER TABLE module_request_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_request_votes_select" ON module_request_votes;
CREATE POLICY "module_request_votes_select" ON module_request_votes FOR SELECT
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_request_votes_insert" ON module_request_votes;
CREATE POLICY "module_request_votes_insert" ON module_request_votes FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
);

DROP POLICY IF EXISTS "module_request_votes_delete" ON module_request_votes;
CREATE POLICY "module_request_votes_delete" ON module_request_votes FOR DELETE
USING (
  agency_id = auth.get_current_agency_id()
);

-- ============================================
-- MODULE_REVIEWS TABLE RLS
-- ============================================
ALTER TABLE module_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_reviews_select" ON module_reviews;
CREATE POLICY "module_reviews_select" ON module_reviews FOR SELECT
USING (
  status = 'approved'
  OR agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_reviews_insert" ON module_reviews;
CREATE POLICY "module_reviews_insert" ON module_reviews FOR INSERT
WITH CHECK (
  agency_id = auth.get_current_agency_id()
);

DROP POLICY IF EXISTS "module_reviews_update" ON module_reviews;
CREATE POLICY "module_reviews_update" ON module_reviews FOR UPDATE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

DROP POLICY IF EXISTS "module_reviews_delete" ON module_reviews;
CREATE POLICY "module_reviews_delete" ON module_reviews FOR DELETE
USING (
  agency_id = auth.get_current_agency_id()
  OR auth.is_super_admin()
);

-- ============================================
-- Final Grant for Service Role
-- ============================================
-- Service role bypasses RLS by default, but ensure proper grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
