-- ============================================================================
-- Phase SM-08: Content Pillars & Report Scheduling Tables
-- ============================================================================

-- Content Pillars table
CREATE TABLE IF NOT EXISTS public.social_content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  target_percentage NUMERIC(5,2) DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_content_pillars_site ON public.social_content_pillars(site_id);
CREATE INDEX IF NOT EXISTS idx_social_content_pillars_active ON public.social_content_pillars(site_id, is_active);

-- RLS
ALTER TABLE public.social_content_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their site content pillars"
  ON public.social_content_pillars FOR SELECT
  USING (site_id IN (
    SELECT id FROM public.sites WHERE tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage their site content pillars"
  ON public.social_content_pillars FOR ALL
  USING (site_id IN (
    SELECT id FROM public.sites WHERE tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    )
  ));

-- Updated at trigger
CREATE TRIGGER set_social_content_pillars_updated_at
  BEFORE UPDATE ON public.social_content_pillars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
