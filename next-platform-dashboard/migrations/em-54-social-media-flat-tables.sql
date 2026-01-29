-- ============================================================================
-- Phase EM-54: Social Media Management Module - FLAT TABLES
-- Creates tables in public schema for PostgREST compatibility
-- ============================================================================
-- IMPORTANT: PostgREST doesn't support schema-qualified table names via the 
-- JavaScript client. All module tables must be in the public schema with 
-- prefixed names (e.g., social_accounts instead of mod_social.accounts).
-- ============================================================================

-- ============================================================================
-- DROP SCHEMA TABLES IF THEY EXIST (migration cleanup)
-- ============================================================================
DROP SCHEMA IF EXISTS mod_social CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Social Accounts (connected platforms)
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN (
    'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 
    'youtube', 'pinterest', 'threads', 'bluesky', 'mastodon'
  )),
  platform_account_id TEXT NOT NULL,
  account_type TEXT DEFAULT 'profile' CHECK (account_type IN (
    'profile', 'page', 'business', 'creator', 'group'
  )),
  
  -- Account Info
  account_name TEXT NOT NULL,
  account_handle TEXT,
  account_avatar TEXT,
  account_url TEXT,
  account_bio TEXT,
  
  -- OAuth Credentials
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  
  -- Status & Health
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'expired', 'disconnected', 'error', 'rate_limited', 'pending'
  )),
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  
  -- Stats (cached from platform)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  auto_reply_enabled BOOLEAN DEFAULT false,
  monitoring_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, platform, platform_account_id)
);

-- Posts (scheduled and published content)
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Media attachments
  media JSONB DEFAULT '[]'::jsonb,
  
  -- Link Preview
  link_url TEXT,
  link_preview JSONB,
  
  -- Platform-specific content variations
  platform_content JSONB DEFAULT '{}'::jsonb,
  
  -- Targeting
  target_accounts UUID[] NOT NULL DEFAULT '{}',
  target_audiences JSONB DEFAULT '[]'::jsonb,
  
  -- Scheduling
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'publishing', 
    'published', 'partially_published', 'failed', 'deleted', 'archived'
  )),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  
  -- Publishing Results
  publish_results JSONB DEFAULT '{}'::jsonb,
  
  -- Queue Management
  queue_position INTEGER,
  optimal_time_suggested TIMESTAMPTZ,
  
  -- Approval Workflow
  requires_approval BOOLEAN DEFAULT false,
  approval_workflow_id UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Organization
  labels TEXT[],
  campaign_id UUID,
  content_pillar TEXT,
  
  -- AI Features
  ai_generated BOOLEAN DEFAULT false,
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  sentiment_score DECIMAL(3,2),
  
  -- Engagement (aggregated)
  total_impressions INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  
  -- First Comment (Instagram/Facebook)
  first_comment TEXT,
  first_comment_delay_minutes INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Publishing Log
CREATE TABLE IF NOT EXISTS public.social_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  
  -- Result
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'partial')),
  platform_post_id TEXT,
  platform_url TEXT,
  error_message TEXT,
  error_code TEXT,
  
  -- Timing
  scheduled_for TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Retries
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Period
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Goals & KPIs
  goals JSONB DEFAULT '{}'::jsonb,
  
  -- Budget
  budget DECIMAL(12,2),
  budget_spent DECIMAL(12,2) DEFAULT 0,
  
  -- Tracking
  hashtags TEXT[],
  utm_source TEXT DEFAULT 'social',
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Performance (aggregated)
  total_posts INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'active', 'paused', 'completed', 'archived'
  )),
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Calendar Events
CREATE TABLE IF NOT EXISTS public.social_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Event Details
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Timing
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  all_day BOOLEAN DEFAULT true,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  
  -- Type
  event_type TEXT DEFAULT 'custom' CHECK (event_type IN (
    'custom', 'holiday', 'awareness_day', 'campaign', 'launch', 
    'milestone', 'content_theme', 'meeting'
  )),
  
  -- Links
  campaign_id UUID REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  post_ids UUID[],
  
  -- Notes
  notes JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Analytics Snapshots
CREATE TABLE IF NOT EXISTS public.social_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Growth
  followers_count INTEGER,
  followers_change INTEGER DEFAULT 0,
  following_count INTEGER,
  
  -- Engagement
  posts_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Video
  video_views INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  
  -- Profile
  profile_views INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  
  -- Story
  story_views INTEGER DEFAULT 0,
  story_replies INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, date)
);

-- Post Analytics
CREATE TABLE IF NOT EXISTS public.social_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Video
  video_views INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  video_completion_rate DECIMAL(5,2),
  
  -- Engagement Rate
  engagement_rate DECIMAL(5,2),
  
  -- Demographics
  demographics JSONB DEFAULT '{}'::jsonb,
  
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, account_id)
);

-- Optimal Posting Times
CREATE TABLE IF NOT EXISTS public.social_optimal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  
  -- Time slot
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- Scores (0-100)
  engagement_score INTEGER DEFAULT 50,
  reach_score INTEGER DEFAULT 50,
  combined_score INTEGER DEFAULT 50,
  
  -- Based on
  sample_size INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, day_of_week, hour)
);

-- Social Inbox
CREATE TABLE IF NOT EXISTS public.social_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  
  -- Item Type
  item_type TEXT NOT NULL CHECK (item_type IN (
    'comment', 'reply', 'mention', 'dm', 'review', 'story_mention',
    'story_reply', 'tag', 'share'
  )),
  
  -- Platform Reference
  platform_item_id TEXT NOT NULL,
  platform_parent_id TEXT,
  platform_post_id TEXT,
  
  -- Author
  author_id TEXT,
  author_name TEXT NOT NULL,
  author_handle TEXT,
  author_avatar TEXT,
  author_profile_url TEXT,
  author_followers INTEGER,
  author_verified BOOLEAN DEFAULT false,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  
  -- Sentiment
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score DECIMAL(3,2),
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'read', 'replied', 'archived', 'spam', 'flagged'
  )),
  is_priority BOOLEAN DEFAULT false,
  requires_response BOOLEAN DEFAULT true,
  
  -- Response
  response_id TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID,
  response_time_seconds INTEGER,
  
  -- Assignment
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- Tags & Labels
  tags TEXT[],
  internal_notes TEXT,
  
  -- Timestamps
  platform_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, platform_item_id)
);

-- Saved Replies
CREATE TABLE IF NOT EXISTS public.social_saved_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- Reply Content
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  
  -- Targeting
  platforms TEXT[],
  item_types TEXT[],
  sentiment TEXT[],
  
  -- AI
  ai_generated BOOLEAN DEFAULT false,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Requests
CREATE TABLE IF NOT EXISTS public.social_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- Request Details
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Approval
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Notification
  notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hashtag Groups
CREATE TABLE IF NOT EXISTS public.social_hashtag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  category TEXT,
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL(10,2) DEFAULT 0,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Library
CREATE TABLE IF NOT EXISTS public.social_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- File Info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'gif', 'audio')),
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- URLs
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  optimized_urls JSONB DEFAULT '{}'::jsonb,
  
  -- Dimensions
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL(10,2),
  aspect_ratio TEXT,
  
  -- Organization
  folder_id UUID,
  tags TEXT[],
  alt_text TEXT,
  caption TEXT,
  
  -- Platform Readiness
  platform_status JSONB DEFAULT '{}'::jsonb,
  
  -- AI Analysis
  ai_tags TEXT[],
  ai_description TEXT,
  
  -- Usage
  used_in_posts UUID[],
  usage_count INTEGER DEFAULT 0,
  
  -- Source
  source TEXT DEFAULT 'upload' CHECK (source IN (
    'upload', 'canva', 'stock', 'ai_generated', 'import'
  )),
  source_url TEXT,
  
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_social_accounts_site ON public.social_accounts(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON public.social_accounts(platform, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_site ON public.social_posts(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON public.social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign ON public.social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_daily_account ON public.social_analytics_daily(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_social_post_analytics_post ON public.social_post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_social_inbox_site ON public.social_inbox_items(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_inbox_account ON public.social_inbox_items(account_id, status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_publish_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_optimal_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_saved_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_hashtag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_library ENABLE ROW LEVEL SECURITY;

-- Site-based RLS policies (users can access data for sites in their agency)
CREATE POLICY social_accounts_policy ON public.social_accounts
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_posts_policy ON public.social_posts
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_publish_log_policy ON public.social_publish_log
  FOR ALL USING (
    post_id IN (
      SELECT sp.id FROM social_posts sp
      JOIN sites s ON sp.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_campaigns_policy ON public.social_campaigns
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_calendar_events_policy ON public.social_calendar_events
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_analytics_daily_policy ON public.social_analytics_daily
  FOR ALL USING (
    account_id IN (
      SELECT sa.id FROM social_accounts sa
      JOIN sites s ON sa.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_post_analytics_policy ON public.social_post_analytics
  FOR ALL USING (
    post_id IN (
      SELECT sp.id FROM social_posts sp
      JOIN sites s ON sp.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_optimal_times_policy ON public.social_optimal_times
  FOR ALL USING (
    account_id IN (
      SELECT sa.id FROM social_accounts sa
      JOIN sites s ON sa.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_inbox_items_policy ON public.social_inbox_items
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_saved_replies_policy ON public.social_saved_replies
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_approval_requests_policy ON public.social_approval_requests
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_hashtag_groups_policy ON public.social_hashtag_groups
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_media_library_policy ON public.social_media_library
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.social_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_campaigns_updated_at
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_calendar_events_updated_at
  BEFORE UPDATE ON public.social_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_inbox_items_updated_at
  BEFORE UPDATE ON public.social_inbox_items
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_saved_replies_updated_at
  BEFORE UPDATE ON public.social_saved_replies
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_hashtag_groups_updated_at
  BEFORE UPDATE ON public.social_hashtag_groups
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_media_library_updated_at
  BEFORE UPDATE ON public.social_media_library
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

-- ============================================================================
-- COMPLETED
-- ============================================================================
-- Tables created: 13
-- Indexes created: 9
-- RLS policies created: 13
-- Triggers created: 8
-- ============================================================================
