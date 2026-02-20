-- ============================================================================
-- DRAMAC CMS - COMPLETE DATABASE RESTORE SCRIPT
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. FIRST: Run this script to DROP everything and recreate clean
-- 2. THEN: Insert your saved data (from the export)
--
-- WARNING: THIS WILL DELETE ALL EXISTING DATA!
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP ALL EXISTING TABLES (in correct order due to FK constraints)
-- ============================================================================

-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.rate_limits CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.backups CASCADE;
DROP TABLE IF EXISTS public.billing_usage CASCADE;
DROP TABLE IF EXISTS public.billing_invoices CASCADE;
DROP TABLE IF EXISTS public.billing_subscriptions CASCADE;
DROP TABLE IF EXISTS public.billing_customers CASCADE;
DROP TABLE IF EXISTS public.module_usage CASCADE;
DROP TABLE IF EXISTS public.agency_modules CASCADE;
DROP TABLE IF EXISTS public.site_modules CASCADE;
DROP TABLE IF EXISTS public.module_subscriptions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.page_content CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.agency_members CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_rate_limits() CASCADE;
DROP FUNCTION IF EXISTS get_backup_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_backup_total_size(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- SECTION 2: CREATE HELPER FUNCTION FOR UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 3: CREATE ALL TABLES
-- ============================================================================

-- AGENCIES TABLE
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_email TEXT,
  white_label_enabled BOOLEAN DEFAULT false,
  custom_branding JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  job_title TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENCY_MEMBERS TABLE
CREATE TABLE public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{}'::jsonb,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(agency_id, user_id)
);

-- CLIENTS TABLE
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  seat_activated_at TIMESTAMPTZ DEFAULT NOW(),
  seat_paused_at TIMESTAMPTZ,
  stripe_subscription_item_id TEXT,
  has_portal_access BOOLEAN DEFAULT false,
  portal_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITES TABLE
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  seo_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAGES TABLE
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_homepage BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  seo_image TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- PAGE_CONTENT TABLE
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  content JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSETS TABLE
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  folder TEXT DEFAULT '',
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATES TABLE
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULES TABLE
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  icon TEXT NOT NULL DEFAULT 'Package',
  category TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  screenshots JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  version TEXT DEFAULT '1.0.0',
  stripe_product_id TEXT,
  stripe_price_monthly TEXT,
  stripe_price_yearly TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE_SUBSCRIPTIONS TABLE
CREATE TABLE public.module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

-- SITE_MODULES TABLE
CREATE TABLE public.site_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, module_id)
);

-- AGENCY_MODULES TABLE
CREATE TABLE public.agency_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

-- MODULE_USAGE TABLE
CREATE TABLE public.module_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_subscription_id UUID NOT NULL REFERENCES public.module_subscriptions(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING_CUSTOMERS TABLE
CREATE TABLE public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING_SUBSCRIPTIONS TABLE
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  quantity INTEGER DEFAULT 1,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING_INVOICES TABLE
CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL,
  amount_due INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING_USAGE TABLE
CREATE TABLE public.billing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  stripe_subscription_item_id TEXT,
  quantity INTEGER DEFAULT 1,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  idempotency_key TEXT
);

-- BACKUPS TABLE
CREATE TABLE public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'automatic')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS TABLE (LemonSqueezy)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,
  plan_id TEXT DEFAULT 'free',
  lemonsqueezy_subscription_id TEXT,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_variant_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES TABLE (LemonSqueezy)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  lemonsqueezy_order_id TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'paid',
  invoice_url TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY_LOG TABLE
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATION_PREFERENCES TABLE
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_marketing BOOLEAN DEFAULT false,
  email_security BOOLEAN DEFAULT true,
  email_updates BOOLEAN DEFAULT true,
  email_team BOOLEAN DEFAULT true,
  email_billing BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  digest_frequency TEXT DEFAULT 'realtime',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RATE_LIMITS TABLE
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: CREATE ALL INDEXES
-- ============================================================================

-- Agencies
CREATE INDEX idx_agencies_owner ON public.agencies(owner_id);
CREATE INDEX idx_agencies_slug ON public.agencies(slug);

-- Profiles
CREATE INDEX idx_profiles_agency ON public.profiles(agency_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_onboarding_completed ON public.profiles(onboarding_completed) WHERE onboarding_completed = false;

-- Agency Members
CREATE INDEX idx_agency_members_agency ON public.agency_members(agency_id);
CREATE INDEX idx_agency_members_user ON public.agency_members(user_id);

-- Clients
CREATE INDEX idx_clients_agency ON public.clients(agency_id);
CREATE INDEX idx_clients_status ON public.clients(status);

-- Sites
CREATE INDEX idx_sites_client ON public.sites(client_id);
CREATE INDEX idx_sites_agency ON public.sites(agency_id);
CREATE INDEX idx_sites_subdomain ON public.sites(subdomain);
CREATE INDEX idx_sites_published ON public.sites(published);

-- Pages
CREATE INDEX idx_pages_site ON public.pages(site_id);
CREATE INDEX idx_pages_slug ON public.pages(site_id, slug);

-- Page Content
CREATE INDEX idx_page_content_page ON public.page_content(page_id);

-- Assets
CREATE INDEX idx_assets_site ON public.assets(site_id);
CREATE INDEX idx_assets_agency ON public.assets(agency_id);

-- Templates
CREATE INDEX idx_templates_agency ON public.templates(agency_id);
CREATE INDEX idx_templates_category ON public.templates(category);

-- Modules
CREATE INDEX idx_modules_slug ON public.modules(slug);
CREATE INDEX idx_modules_category ON public.modules(category);
CREATE INDEX idx_modules_featured ON public.modules(is_featured) WHERE is_featured = true;

-- Module Subscriptions
CREATE INDEX idx_module_subscriptions_agency ON public.module_subscriptions(agency_id);
CREATE INDEX idx_module_subscriptions_module ON public.module_subscriptions(module_id);

-- Site Modules
CREATE INDEX idx_site_modules_site ON public.site_modules(site_id);
CREATE INDEX idx_site_modules_module ON public.site_modules(module_id);

-- Module Usage
CREATE INDEX idx_module_usage_subscription ON public.module_usage(module_subscription_id);

-- Billing
CREATE INDEX idx_billing_subscriptions_agency ON public.billing_subscriptions(agency_id);
CREATE INDEX idx_billing_invoices_agency ON public.billing_invoices(agency_id);

-- Backups
CREATE INDEX idx_backups_site ON public.backups(site_id);
CREATE INDEX idx_backups_created ON public.backups(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Activity Log
CREATE INDEX idx_activity_log_agency ON public.activity_log(agency_id, created_at DESC);
CREATE INDEX idx_activity_log_user ON public.activity_log(user_id, created_at DESC);

-- Rate Limits
CREATE INDEX idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, created_at DESC);
CREATE INDEX idx_rate_limits_created_at ON public.rate_limits(created_at);

-- ============================================================================
-- SECTION 5: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: CREATE UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_subscriptions_updated_at BEFORE UPDATE ON public.module_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_customers_updated_at BEFORE UPDATE ON public.billing_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON public.billing_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Rate limit cleanup function
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Backup count function
CREATE OR REPLACE FUNCTION get_backup_count(p_site_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO backup_count
  FROM public.backups
  WHERE site_id = p_site_id;
  
  RETURN COALESCE(backup_count, 0);
END;
$$;

-- Backup total size function
CREATE OR REPLACE FUNCTION get_backup_total_size(p_site_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size BIGINT;
BEGIN
  SELECT COALESCE(SUM(size_bytes), 0)
  INTO total_size
  FROM public.backups
  WHERE site_id = p_site_id;
  
  RETURN total_size;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION get_backup_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_backup_total_size(UUID) TO authenticated;

-- ============================================================================
-- SECTION 8: CREATE STORAGE BUCKETS
-- ============================================================================

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Branding bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Backups bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 52428800, ARRAY['application/json']::text[])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800;

-- Assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assets', 'assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- E-Commerce bucket (product images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ecommerce', 'ecommerce', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- ============================================================================
-- RESTORE COMPLETE - NOW INSERT YOUR DATA BELOW
-- ============================================================================

-- After running this script, insert your data in this order:
-- 1. agencies
-- 2. profiles
-- 3. agency_members
-- 4. clients
-- 5. sites
-- 6. pages
-- 7. page_content
-- 8. assets
-- 9. templates
-- 10. modules
-- 11. module_subscriptions
-- 12. site_modules
-- 13. agency_modules
-- 14. module_usage
-- 15. billing_customers
-- 16. billing_subscriptions
-- 17. billing_invoices
-- 18. billing_usage
-- 19. backups
-- 20. subscriptions
-- 21. invoices
-- 22. notifications
-- 23. activity_log
-- 24. notification_preferences
-- 25. rate_limits

SELECT 'Database schema restored successfully at ' || NOW() AS status;
