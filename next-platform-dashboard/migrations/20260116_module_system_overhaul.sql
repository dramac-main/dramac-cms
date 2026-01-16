-- =============================================================
-- Phase 76A: Module System Architecture Overhaul
-- Created: 2026-01-16
-- 
-- This migration creates the new module system with:
-- - Multi-level installation (platform, agency, client, site)
-- - Agency markup pricing
-- - Module sandboxing support
-- - LemonSqueezy billing integration
-- =============================================================

-- =============================================================
-- MODULES TABLE (Master definition - Super Admin controlled)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.modules_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  icon TEXT DEFAULT '📦',
  banner_image TEXT,
  
  -- Classification
  category TEXT NOT NULL, -- analytics, forms, crm, productivity, etc.
  tags TEXT[] DEFAULT '{}',
  
  -- CRITICAL: Installation Level
  install_level TEXT NOT NULL DEFAULT 'site' CHECK (install_level IN ('platform', 'agency', 'client', 'site')),
  
  -- Versioning
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  min_platform_version TEXT,
  
  -- Pricing (Wholesale - what agencies pay platform)
  pricing_type TEXT NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free', 'one_time', 'monthly', 'yearly')),
  wholesale_price_monthly INTEGER DEFAULT 0, -- In cents
  wholesale_price_yearly INTEGER DEFAULT 0,
  wholesale_price_one_time INTEGER DEFAULT 0,
  suggested_retail_monthly INTEGER, -- Suggested markup price (guidance for agencies)
  suggested_retail_yearly INTEGER,
  
  -- LemonSqueezy Integration (Primary billing provider)
  lemon_product_id TEXT,                    -- LemonSqueezy product ID
  lemon_variant_monthly_id TEXT,            -- Monthly subscription variant
  lemon_variant_yearly_id TEXT,             -- Yearly subscription variant
  lemon_variant_one_time_id TEXT,           -- One-time purchase variant
  
  -- Stripe Integration (Legacy/backup)
  stripe_product_id TEXT,
  stripe_price_monthly_id TEXT,
  stripe_price_yearly_id TEXT,
  
  -- Capabilities & Permissions
  required_permissions TEXT[] DEFAULT '{}', -- What the module needs access to
  provided_hooks TEXT[] DEFAULT '{}', -- Where it can inject content
  
  -- Module Package (the actual code/content)
  package_url TEXT, -- CDN URL to module bundle
  package_hash TEXT, -- Integrity check
  manifest JSONB DEFAULT '{}', -- Module manifest (entry points, etc.)
  
  -- Settings Schema
  settings_schema JSONB DEFAULT '{}', -- JSON schema for configuration
  default_settings JSONB DEFAULT '{}',
  
  -- Metadata
  author_name TEXT DEFAULT 'DRAMAC',
  author_verified BOOLEAN DEFAULT TRUE,
  screenshots TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  changelog JSONB DEFAULT '[]',
  documentation_url TEXT,
  support_url TEXT,
  
  -- Stats
  install_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'deprecated', 'disabled')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- =============================================================
-- AGENCY MODULE SUBSCRIPTIONS (Agency subscribes at wholesale)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.agency_module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  
  -- Subscription Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  
  -- LemonSqueezy Integration (Primary)
  lemon_subscription_id TEXT,               -- LemonSqueezy subscription ID
  lemon_order_id TEXT,                      -- For one-time purchases
  lemon_customer_id TEXT,                   -- LemonSqueezy customer
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Stripe Integration (Legacy/backup)
  stripe_subscription_id TEXT,
  stripe_subscription_item_id TEXT,
  
  -- Agency Markup Pricing (what agency charges clients)
  markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed', 'custom', 'passthrough')),
  markup_percentage INTEGER DEFAULT 100, -- e.g., 100 = 100% markup (2x wholesale)
  markup_fixed_amount INTEGER DEFAULT 0, -- Fixed amount in cents to add
  custom_price_monthly INTEGER, -- Override price entirely
  custom_price_yearly INTEGER,
  retail_price_monthly_cached INTEGER, -- Cached calculated retail price
  retail_price_yearly_cached INTEGER,
  
  -- Usage Limits
  max_installations INTEGER, -- NULL = unlimited
  current_installations INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, module_id)
);

-- =============================================================
-- AGENCY LEVEL MODULE INSTALLATIONS (For agency tools)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.agency_module_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.agency_module_subscriptions(id) ON DELETE SET NULL,
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  
  -- Audit
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES public.profiles(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, module_id)
);

-- =============================================================
-- CLIENT LEVEL MODULE INSTALLATIONS (Client apps - no site needed!)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.client_module_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  agency_subscription_id UUID REFERENCES public.agency_module_subscriptions(id) ON DELETE SET NULL,
  
  -- Billing (client pays agency's marked-up price)
  billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('active', 'canceled', 'past_due', 'trial')),
  stripe_subscription_id TEXT, -- Client's subscription to agency
  lemon_subscription_id TEXT, -- LemonSqueezy subscription
  price_paid INTEGER, -- What client actually pays (wholesale + markup) in cents
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  
  -- Audit
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES public.profiles(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, module_id)
);

-- =============================================================
-- SITE LEVEL MODULE INSTALLATIONS (Website enhancements)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.site_module_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  client_installation_id UUID REFERENCES public.client_module_installations(id) ON DELETE SET NULL,
  agency_subscription_id UUID REFERENCES public.agency_module_subscriptions(id) ON DELETE SET NULL,
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration (site-specific overrides)
  settings JSONB DEFAULT '{}',
  
  -- Audit
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES public.profiles(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, module_id)
);

-- =============================================================
-- MODULE REQUESTS (Agencies request custom modules)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.module_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Request Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT, -- Why they need it
  target_audience TEXT, -- Who would use it
  
  -- Classification
  suggested_install_level TEXT DEFAULT 'client' CHECK (suggested_install_level IN ('agency', 'client', 'site')),
  suggested_category TEXT,
  
  -- Priority & Budget
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  budget_range TEXT, -- 'free', '$1-50', '$50-200', '$200+'
  willing_to_fund BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  
  -- If built, link to module
  resulting_module_id UUID REFERENCES public.modules_v2(id),
  
  -- Voting (other agencies can upvote)
  upvotes INTEGER DEFAULT 0,
  
  -- Audit
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================================
-- MODULE REQUEST VOTES (Track who voted for what)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.module_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.module_requests(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(request_id, agency_id)
);

-- =============================================================
-- MODULE REVIEWS & RATINGS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.module_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Verification
  is_verified_purchase BOOLEAN DEFAULT FALSE, -- Did they actually subscribe?
  
  -- Moderation
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden')),
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, agency_id)
);

-- =============================================================
-- MODULE USAGE TRACKING
-- =============================================================
CREATE TABLE IF NOT EXISTS public.module_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  
  -- Context (where was it used)
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  
  -- Event
  event_type TEXT NOT NULL CHECK (event_type IN ('load', 'action', 'error', 'api_call')),
  event_name TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Performance
  load_time_ms INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- MODULE ERROR LOGS (For debugging sandboxed modules)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.module_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules_v2(id) ON DELETE CASCADE,
  
  -- Context
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  
  -- Browser/environment info
  user_agent TEXT,
  url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_modules_v2_status ON public.modules_v2(status);
CREATE INDEX IF NOT EXISTS idx_modules_v2_install_level ON public.modules_v2(install_level);
CREATE INDEX IF NOT EXISTS idx_modules_v2_category ON public.modules_v2(category);
CREATE INDEX IF NOT EXISTS idx_modules_v2_featured ON public.modules_v2(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_modules_v2_slug ON public.modules_v2(slug);

CREATE INDEX IF NOT EXISTS idx_agency_module_subs_agency ON public.agency_module_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_module_subs_module ON public.agency_module_subscriptions(module_id);
CREATE INDEX IF NOT EXISTS idx_agency_module_subs_status ON public.agency_module_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_agency_module_inst_agency ON public.agency_module_installations(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_module_inst_module ON public.agency_module_installations(module_id);

CREATE INDEX IF NOT EXISTS idx_client_module_inst_client ON public.client_module_installations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_module_inst_module ON public.client_module_installations(module_id);

CREATE INDEX IF NOT EXISTS idx_site_module_inst_site ON public.site_module_installations(site_id);
CREATE INDEX IF NOT EXISTS idx_site_module_inst_module ON public.site_module_installations(module_id);

CREATE INDEX IF NOT EXISTS idx_module_requests_agency ON public.module_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_module_requests_status ON public.module_requests(status);

CREATE INDEX IF NOT EXISTS idx_module_reviews_module ON public.module_reviews(module_id);
CREATE INDEX IF NOT EXISTS idx_module_reviews_rating ON public.module_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_module_usage_events_module ON public.module_usage_events(module_id);
CREATE INDEX IF NOT EXISTS idx_module_usage_events_created ON public.module_usage_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_module_error_logs_module ON public.module_error_logs(module_id);
CREATE INDEX IF NOT EXISTS idx_module_error_logs_created ON public.module_error_logs(created_at DESC);

-- =============================================================
-- PRICING CALCULATION FUNCTIONS
-- =============================================================

-- Function to calculate retail price based on markup strategy
CREATE OR REPLACE FUNCTION calculate_retail_price(
  wholesale_cents INTEGER,
  p_markup_type TEXT,
  p_markup_percentage INTEGER,
  p_markup_fixed_amount INTEGER,
  p_custom_price INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- Custom price overrides everything
  IF p_markup_type = 'custom' AND p_custom_price IS NOT NULL THEN
    RETURN p_custom_price;
  END IF;
  
  -- Passthrough = no markup
  IF p_markup_type = 'passthrough' THEN
    RETURN wholesale_cents;
  END IF;
  
  -- Fixed = wholesale + fixed amount
  IF p_markup_type = 'fixed' THEN
    RETURN wholesale_cents + COALESCE(p_markup_fixed_amount, 0);
  END IF;
  
  -- Percentage (default) = wholesale + (wholesale * percentage / 100)
  -- Default 100% markup = 2x wholesale
  RETURN wholesale_cents + (wholesale_cents * COALESCE(p_markup_percentage, 100) / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to auto-update cached retail prices when markup changes
CREATE OR REPLACE FUNCTION update_agency_module_retail_prices()
RETURNS TRIGGER AS $$
DECLARE
  v_wholesale_monthly INTEGER;
  v_wholesale_yearly INTEGER;
BEGIN
  -- Get wholesale prices from modules table
  SELECT wholesale_price_monthly, wholesale_price_yearly 
  INTO v_wholesale_monthly, v_wholesale_yearly
  FROM public.modules_v2
  WHERE id = NEW.module_id;
  
  -- Calculate and cache retail prices
  NEW.retail_price_monthly_cached := calculate_retail_price(
    COALESCE(v_wholesale_monthly, 0),
    NEW.markup_type,
    NEW.markup_percentage,
    NEW.markup_fixed_amount,
    NEW.custom_price_monthly
  );
  
  NEW.retail_price_yearly_cached := calculate_retail_price(
    COALESCE(v_wholesale_yearly, 0),
    NEW.markup_type,
    NEW.markup_percentage,
    NEW.markup_fixed_amount,
    NEW.custom_price_yearly
  );
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_retail_prices ON public.agency_module_subscriptions;
CREATE TRIGGER trg_update_retail_prices
BEFORE INSERT OR UPDATE ON public.agency_module_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_agency_module_retail_prices();

-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

-- Function to increment module installations count
CREATE OR REPLACE FUNCTION increment_module_installations(sub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.agency_module_subscriptions
  SET current_installations = current_installations + 1,
      updated_at = NOW()
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement module installations count
CREATE OR REPLACE FUNCTION decrement_module_installations(sub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.agency_module_subscriptions
  SET current_installations = GREATEST(0, current_installations - 1),
      updated_at = NOW()
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update module install count
CREATE OR REPLACE FUNCTION update_module_install_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.modules_v2
    SET install_count = install_count + 1
    WHERE id = NEW.module_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.modules_v2
    SET install_count = GREATEST(0, install_count - 1)
    WHERE id = OLD.module_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for install count
DROP TRIGGER IF EXISTS trg_agency_install_count ON public.agency_module_installations;
CREATE TRIGGER trg_agency_install_count
AFTER INSERT OR DELETE ON public.agency_module_installations
FOR EACH ROW EXECUTE FUNCTION update_module_install_count();

DROP TRIGGER IF EXISTS trg_client_install_count ON public.client_module_installations;
CREATE TRIGGER trg_client_install_count
AFTER INSERT OR DELETE ON public.client_module_installations
FOR EACH ROW EXECUTE FUNCTION update_module_install_count();

DROP TRIGGER IF EXISTS trg_site_install_count ON public.site_module_installations;
CREATE TRIGGER trg_site_install_count
AFTER INSERT OR DELETE ON public.site_module_installations
FOR EACH ROW EXECUTE FUNCTION update_module_install_count();

-- Function to update module rating average
CREATE OR REPLACE FUNCTION update_module_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.modules_v2
    SET 
      rating_average = (
        SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
        FROM public.module_reviews
        WHERE module_id = NEW.module_id AND status = 'published'
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM public.module_reviews
        WHERE module_id = NEW.module_id AND status = 'published'
      )
    WHERE id = NEW.module_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.modules_v2
    SET 
      rating_average = (
        SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
        FROM public.module_reviews
        WHERE module_id = OLD.module_id AND status = 'published'
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM public.module_reviews
        WHERE module_id = OLD.module_id AND status = 'published'
      )
    WHERE id = OLD.module_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_module_rating ON public.module_reviews;
CREATE TRIGGER trg_module_rating
AFTER INSERT OR UPDATE OR DELETE ON public.module_reviews
FOR EACH ROW EXECUTE FUNCTION update_module_rating();

-- Function to update request upvotes
CREATE OR REPLACE FUNCTION update_request_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.module_requests
    SET upvotes = upvotes + 1
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.module_requests
    SET upvotes = GREATEST(0, upvotes - 1)
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_request_upvotes ON public.module_request_votes;
CREATE TRIGGER trg_request_upvotes
AFTER INSERT OR DELETE ON public.module_request_votes
FOR EACH ROW EXECUTE FUNCTION update_request_upvotes();

-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================

-- Enable RLS on all new tables
ALTER TABLE public.modules_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_module_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_module_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_module_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_error_logs ENABLE ROW LEVEL SECURITY;

-- Modules are viewable by all authenticated users (active only)
CREATE POLICY "modules_v2_select_active"
  ON public.modules_v2 FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Super admins can manage all modules
CREATE POLICY "modules_v2_all_super_admin"
  ON public.modules_v2 FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Agency members can view their subscriptions
CREATE POLICY "agency_module_subs_select"
  ON public.agency_module_subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Agency admins can manage subscriptions
CREATE POLICY "agency_module_subs_manage"
  ON public.agency_module_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = agency_module_subscriptions.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Agency installations - view
CREATE POLICY "agency_module_inst_select"
  ON public.agency_module_installations FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Agency installations - manage
CREATE POLICY "agency_module_inst_manage"
  ON public.agency_module_installations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = agency_module_installations.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Client installations - view (agency members can see their clients' installations)
CREATE POLICY "client_module_inst_select"
  ON public.client_module_installations FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Client installations - manage
CREATE POLICY "client_module_inst_manage"
  ON public.client_module_installations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.agency_members am ON am.agency_id = c.agency_id
      WHERE c.id = client_module_installations.client_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- Site installations - view
CREATE POLICY "site_module_inst_select"
  ON public.site_module_installations FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Site installations - manage
CREATE POLICY "site_module_inst_manage"
  ON public.site_module_installations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = site_module_installations.site_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- Module requests - view own agency's requests
CREATE POLICY "module_requests_select"
  ON public.module_requests FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
    OR
    -- Also show approved/completed requests to all (for voting)
    status IN ('approved', 'in_progress', 'completed')
  );

-- Module requests - create
CREATE POLICY "module_requests_insert"
  ON public.module_requests FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Module requests - update own
CREATE POLICY "module_requests_update"
  ON public.module_requests FOR UPDATE
  USING (
    submitted_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Module request votes
CREATE POLICY "module_request_votes_all"
  ON public.module_request_votes FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Module reviews - view all published
CREATE POLICY "module_reviews_select"
  ON public.module_reviews FOR SELECT
  USING (status = 'published' OR agency_id IN (
    SELECT agency_id FROM public.agency_members 
    WHERE user_id = auth.uid()
  ));

-- Module reviews - create own
CREATE POLICY "module_reviews_insert"
  ON public.module_reviews FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Module reviews - update own
CREATE POLICY "module_reviews_update"
  ON public.module_reviews FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Usage events - insert for own context
CREATE POLICY "module_usage_events_insert"
  ON public.module_usage_events FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
    OR agency_id IS NULL
  );

-- Usage events - select own
CREATE POLICY "module_usage_events_select"
  ON public.module_usage_events FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Error logs - insert for own context
CREATE POLICY "module_error_logs_insert"
  ON public.module_error_logs FOR INSERT
  WITH CHECK (true); -- Allow all inserts for error logging

-- Error logs - select own or super admin
CREATE POLICY "module_error_logs_select"
  ON public.module_error_logs FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- =============================================================
-- UPDATE TRIGGERS FOR UPDATED_AT
-- =============================================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_modules_v2_updated_at ON public.modules_v2;
CREATE TRIGGER update_modules_v2_updated_at
BEFORE UPDATE ON public.modules_v2
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_requests_updated_at ON public.module_requests;
CREATE TRIGGER update_module_requests_updated_at
BEFORE UPDATE ON public.module_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_reviews_updated_at ON public.module_reviews;
CREATE TRIGGER update_module_reviews_updated_at
BEFORE UPDATE ON public.module_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- SEED DATA - Sample Modules
-- =============================================================

-- Insert sample modules for testing
INSERT INTO public.modules_v2 (
  slug, name, description, category, install_level, pricing_type,
  wholesale_price_monthly, suggested_retail_monthly, status, features, provided_hooks
) VALUES 
(
  'google-analytics',
  'Google Analytics',
  'Track website traffic and user behavior with Google Analytics integration',
  'analytics',
  'site',
  'free',
  0,
  0,
  'active',
  ARRAY['Page view tracking', 'Event tracking', 'Goal conversions', 'Real-time analytics'],
  ARRAY['site:head']
),
(
  'contact-forms',
  'Contact Forms',
  'Create beautiful contact forms with email notifications and spam protection',
  'forms',
  'site',
  'monthly',
  500,
  1500,
  'active',
  ARRAY['Drag-and-drop form builder', 'Email notifications', 'Spam protection', 'Form analytics'],
  ARRAY['site:body:end', 'dashboard:site:tab']
),
(
  'seo-optimizer',
  'SEO Optimizer',
  'Improve your search engine rankings with AI-powered SEO recommendations',
  'seo',
  'site',
  'monthly',
  1000,
  2500,
  'active',
  ARRAY['Meta tag optimization', 'Keyword suggestions', 'SEO audit', 'Sitemap generation'],
  ARRAY['site:head', 'dashboard:site:tab']
),
(
  'agency-crm',
  'Agency CRM',
  'Manage your client relationships, projects, and communications in one place',
  'crm',
  'agency',
  'monthly',
  2000,
  0,
  'active',
  ARRAY['Contact management', 'Project tracking', 'Email integration', 'Pipeline view'],
  ARRAY['agency:sidebar', 'agency:home:widget']
),
(
  'client-portal-pro',
  'Client Portal Pro',
  'Enhanced client portal with file sharing, invoicing, and messaging',
  'communication',
  'client',
  'monthly',
  1500,
  3500,
  'active',
  ARRAY['File sharing', 'Invoice viewing', 'Direct messaging', 'Project updates'],
  ARRAY['portal:sidebar', 'portal:home:widget']
),
(
  'live-chat',
  'Live Chat',
  'Real-time chat widget for visitor engagement and customer support',
  'communication',
  'site',
  'monthly',
  800,
  2000,
  'active',
  ARRAY['Real-time messaging', 'Visitor tracking', 'Chat history', 'Mobile app'],
  ARRAY['site:body:end', 'dashboard:site:tab']
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- GRANT PERMISSIONS
-- =============================================================

-- Grant access to authenticated users
GRANT SELECT ON public.modules_v2 TO authenticated;
GRANT ALL ON public.agency_module_subscriptions TO authenticated;
GRANT ALL ON public.agency_module_installations TO authenticated;
GRANT ALL ON public.client_module_installations TO authenticated;
GRANT ALL ON public.site_module_installations TO authenticated;
GRANT ALL ON public.module_requests TO authenticated;
GRANT ALL ON public.module_request_votes TO authenticated;
GRANT ALL ON public.module_reviews TO authenticated;
GRANT ALL ON public.module_usage_events TO authenticated;
GRANT ALL ON public.module_error_logs TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION calculate_retail_price TO authenticated;
GRANT EXECUTE ON FUNCTION increment_module_installations TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_module_installations TO authenticated;
