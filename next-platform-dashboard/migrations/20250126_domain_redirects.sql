-- Phase DM-01: Domain Redirects Table
-- Stores 301/302 redirects when domains change.
-- Used by middleware to redirect old domain traffic.

CREATE TABLE IF NOT EXISTS public.domain_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  from_domain TEXT NOT NULL,
  to_domain TEXT NOT NULL,
  redirect_type TEXT DEFAULT '301' CHECK (redirect_type IN ('301', '302')),
  preserve_path BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_domain)
);

-- Index for fast middleware lookups
CREATE INDEX IF NOT EXISTS idx_domain_redirects_from
  ON public.domain_redirects(from_domain)
  WHERE active = true;

-- RLS policies
ALTER TABLE public.domain_redirects ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (middleware, cascade service)
CREATE POLICY "Service role full access on domain_redirects"
  ON public.domain_redirects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view redirects for their sites
CREATE POLICY "Users can view own domain redirects"
  ON public.domain_redirects
  FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );
