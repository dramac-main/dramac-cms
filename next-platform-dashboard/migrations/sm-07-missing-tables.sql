-- ============================================================================
-- PHASE SM-07: Missing Social Media Tables
-- Competitors, Brand Mentions, Listening Keywords, Reports
-- ============================================================================

-- Competitors tracking
CREATE TABLE IF NOT EXISTS public.social_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_handle TEXT NOT NULL,
  platform_id TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  
  -- Cached stats
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  posting_frequency DECIMAL(5,2) DEFAULT 0,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor analytics snapshots (daily)
CREATE TABLE IF NOT EXISTS public.social_competitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.social_competitors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  followers_count INTEGER DEFAULT 0,
  followers_change INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  
  top_post_url TEXT,
  top_post_engagement INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(competitor_id, date)
);

-- Brand mentions
CREATE TABLE IF NOT EXISTS public.social_brand_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  post_url TEXT,
  
  content TEXT,
  author_handle TEXT,
  author_name TEXT,
  author_followers INTEGER,
  author_avatar TEXT,
  
  matched_keywords TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2),
  
  engagement INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'engaged', 'archived', 'irrelevant')),
  
  mentioned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, platform_post_id)
);

-- Listening keywords
CREATE TABLE IF NOT EXISTS public.social_listening_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  keyword TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'brand' CHECK (keyword_type IN (
    'brand', 'product', 'competitor', 'industry', 'hashtag'
  )),
  is_active BOOLEAN DEFAULT true,
  
  mentions_count INTEGER DEFAULT 0,
  last_mention_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (saved configurations)
CREATE TABLE IF NOT EXISTS public.social_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'performance', 'engagement', 'audience', 'competitor', 'campaign', 'team', 'custom'
  )),
  
  metrics TEXT[],
  filters JSONB DEFAULT '{}'::jsonb,
  date_range_type TEXT DEFAULT '30d',
  account_ids UUID[],
  
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER,
  schedule_time TIME,
  schedule_recipients TEXT[],
  
  last_generated_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_competitors_site ON public.social_competitors(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_competitor_analytics ON public.social_competitor_analytics(competitor_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_social_brand_mentions_site ON public.social_brand_mentions(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_listening_keywords_site ON public.social_listening_keywords(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_reports_site ON public.social_reports(site_id);

-- RLS
ALTER TABLE public.social_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_competitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_listening_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other social tables)
CREATE POLICY social_competitors_policy ON public.social_competitors
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_competitor_analytics_policy ON public.social_competitor_analytics
  FOR ALL USING (
    competitor_id IN (
      SELECT sc.id FROM social_competitors sc
      JOIN sites s ON sc.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_brand_mentions_policy ON public.social_brand_mentions
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_listening_keywords_policy ON public.social_listening_keywords
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_reports_policy ON public.social_reports
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER social_competitors_updated_at
  BEFORE UPDATE ON public.social_competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER social_reports_updated_at
  BEFORE UPDATE ON public.social_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
