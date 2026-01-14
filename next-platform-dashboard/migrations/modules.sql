-- Modules table - available add-ons
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module subscriptions - which agencies have which modules
CREATE TABLE public.module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

-- Site modules - which modules are enabled for which sites
CREATE TABLE public.site_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, module_id)
);

-- Module usage tracking
CREATE TABLE public.module_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_subscription_id UUID NOT NULL REFERENCES public.module_subscriptions(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_usage ENABLE ROW LEVEL SECURITY;

-- Modules are viewable by all authenticated users
CREATE POLICY "Modules are viewable by authenticated users"
  ON public.modules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Agency members can view their subscriptions
CREATE POLICY "View own module subscriptions"
  ON public.module_subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can manage subscriptions
CREATE POLICY "Admins manage module subscriptions"
  ON public.module_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = module_subscriptions.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Site modules visible to site team
CREATE POLICY "View site modules"
  ON public.site_modules FOR SELECT
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

-- Admins can manage site modules
CREATE POLICY "Admins manage site modules"
  ON public.site_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = site_modules.site_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX idx_module_subscriptions_agency ON public.module_subscriptions(agency_id);
CREATE INDEX idx_module_subscriptions_module ON public.module_subscriptions(module_id);
CREATE INDEX idx_site_modules_site ON public.site_modules(site_id);
CREATE INDEX idx_site_modules_module ON public.site_modules(module_id);
CREATE INDEX idx_modules_category ON public.modules(category);
CREATE INDEX idx_modules_featured ON public.modules(is_featured) WHERE is_featured = true;

-- Triggers for updated_at
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_subscriptions_updated_at
  BEFORE UPDATE ON public.module_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
