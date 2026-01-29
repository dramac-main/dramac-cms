-- ============================================================================
-- Phase EM-54: Social Media Module - Complete Migration Script
-- ============================================================================
-- Run this script in Supabase SQL Editor to:
-- 1. Drop old mod_social schema (if exists)
-- 2. Create flat social_* tables in public schema
-- 3. Register module in marketplace
-- ============================================================================

-- ============================================================================
-- STEP 1: Clean up old schema and existing tables
-- ============================================================================
DROP SCHEMA IF EXISTS mod_social CASCADE;

-- Drop existing flat tables if they exist (from previous migrations)
DROP TABLE IF EXISTS public.social_media_library CASCADE;
DROP TABLE IF EXISTS public.social_hashtag_groups CASCADE;
DROP TABLE IF EXISTS public.social_approval_requests CASCADE;
DROP TABLE IF EXISTS public.social_saved_replies CASCADE;
DROP TABLE IF EXISTS public.social_inbox_items CASCADE;
DROP TABLE IF EXISTS public.social_optimal_times CASCADE;
DROP TABLE IF EXISTS public.social_post_analytics CASCADE;
DROP TABLE IF EXISTS public.social_analytics_daily CASCADE;
DROP TABLE IF EXISTS public.social_calendar_events CASCADE;
DROP TABLE IF EXISTS public.social_campaigns CASCADE;
DROP TABLE IF EXISTS public.social_publish_log CASCADE;
DROP TABLE IF EXISTS public.social_posts CASCADE;
DROP TABLE IF EXISTS public.social_accounts CASCADE;

-- ============================================================================
-- STEP 2: Create flat tables (from em-54-social-media-flat-tables.sql)
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
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  health_check_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(site_id, platform, platform_account_id)
);

-- Social Posts (scheduled/published content)
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  media JSONB DEFAULT '[]'::jsonb, -- Array of { type, url, thumbnail, alt, width, height }
  link_url TEXT,
  link_preview JSONB, -- { title, description, image, domain }
  
  -- Platform-specific content
  platform_content JSONB DEFAULT '{}'::jsonb, -- { facebook: {...}, instagram: {...} }
  
  -- Targeting
  target_accounts UUID[] NOT NULL, -- Array of social_accounts.id
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  published_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'publishing', 'published', 
    'failed', 'pending_approval', 'approved', 'rejected'
  )),
  
  -- Organization
  labels TEXT[],
  campaign_id UUID,
  content_pillar TEXT,
  
  -- Approval Workflow
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  approval_notes TEXT,
  
  -- Publishing
  first_comment TEXT,
  first_comment_delay_minutes INTEGER DEFAULT 0,
  
  -- Metadata
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Publish Log (per-platform publishing history)
CREATE TABLE IF NOT EXISTS public.social_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  platform_url TEXT,
  
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'publishing', 'published', 'failed', 'deleted'
  )),
  
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Campaigns
CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Goals & Tracking
  goal_type TEXT CHECK (goal_type IN (
    'awareness', 'engagement', 'traffic', 'leads', 'sales', 'custom'
  )),
  goal_metric TEXT, -- 'impressions', 'clicks', 'conversions', etc.
  goal_target NUMERIC,
  
  -- Budget
  budget_amount NUMERIC,
  budget_currency TEXT DEFAULT 'USD',
  
  -- Hashtags & Content
  hashtags TEXT[],
  hashtag_performance JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'paused', 'completed', 'archived'
  )),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Calendar Events
CREATE TABLE IF NOT EXISTS public.social_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'event' CHECK (event_type IN (
    'event', 'holiday', 'awareness_day', 'deadline', 'reminder', 'custom'
  )),
  
  date DATE NOT NULL,
  all_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  
  color TEXT,
  icon TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Analytics Daily (daily snapshots per account)
CREATE TABLE IF NOT EXISTS public.social_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  date DATE NOT NULL,
  
  -- Audience
  followers_count INTEGER DEFAULT 0,
  followers_change INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  
  -- Reach & Impressions
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  
  -- Traffic
  link_clicks INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  
  -- Rates
  engagement_rate NUMERIC(5,2),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id, date)
);

-- Social Post Analytics (per-post performance)
CREATE TABLE IF NOT EXISTS public.social_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  reactions JSONB DEFAULT '{}'::jsonb,
  
  -- Reach
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  -- Traffic
  link_clicks INTEGER DEFAULT 0,
  
  -- Video (if applicable)
  video_views INTEGER DEFAULT 0,
  video_watch_time_seconds INTEGER DEFAULT 0,
  video_completion_rate NUMERIC(5,2),
  
  -- Rates
  engagement_rate NUMERIC(5,2),
  click_through_rate NUMERIC(5,2),
  
  -- Timing
  best_performing_time TIMESTAMPTZ,
  
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(post_id, account_id)
);

-- Social Optimal Times (best posting times per account/platform)
CREATE TABLE IF NOT EXISTS public.social_optimal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  
  score NUMERIC(5,2) NOT NULL DEFAULT 0, -- 0-100
  avg_engagement_rate NUMERIC(5,2),
  sample_size INTEGER DEFAULT 0,
  
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id, day_of_week, hour)
);

-- Social Inbox Items (unified inbox for all engagement)
CREATE TABLE IF NOT EXISTS public.social_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  
  platform TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'comment', 'mention', 'dm', 'review', 'reply'
  )),
  
  -- Source
  platform_item_id TEXT NOT NULL,
  parent_id TEXT, -- For replies
  post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  
  -- Content
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_handle TEXT,
  author_avatar TEXT,
  author_profile_url TEXT,
  
  -- Media
  media JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'unread' CHECK (status IN (
    'unread', 'read', 'replied', 'archived', 'spam', 'important'
  )),
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  
  -- Response
  replied_at TIMESTAMPTZ,
  replied_by UUID,
  reply_content TEXT,
  
  -- Assignment
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- Timing
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id, platform_item_id)
);

-- Social Saved Replies (canned responses for quick replies)
CREATE TABLE IF NOT EXISTS public.social_saved_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT, -- Quick access code like "welcome" or "thanks"
  
  category TEXT,
  tags TEXT[],
  
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Approval Requests (for approval workflow)
CREATE TABLE IF NOT EXISTS public.social_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  
  approvers UUID[], -- Array of user IDs who can approve
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  
  notes TEXT,
  decision_by UUID,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Hashtag Groups (saved hashtag sets)
CREATE TABLE IF NOT EXISTS public.social_hashtag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  description TEXT,
  
  category TEXT,
  
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Media Library (centralized media assets)
CREATE TABLE IF NOT EXISTS public.social_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- File Info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'gif')),
  file_size INTEGER,
  mime_type TEXT,
  
  -- URLs
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Dimensions
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- For video
  
  -- Organization
  alt_text TEXT,
  caption TEXT,
  tags TEXT[],
  folder TEXT,
  
  -- Usage
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_social_accounts_site ON public.social_accounts(site_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_site_status ON public.social_posts(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON public.social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_publish_log_post ON public.social_publish_log(post_id);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_site ON public.social_campaigns(site_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_daily_account_date ON public.social_analytics_daily(account_id, date);
CREATE INDEX IF NOT EXISTS idx_social_inbox_site_status ON public.social_inbox_items(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_inbox_assigned ON public.social_inbox_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_media_library_site ON public.social_media_library(site_id);

-- ============================================================================
-- ROW LEVEL SECURITY
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

-- RLS Policies (tenant isolation via site → client → agency join)
CREATE POLICY "Users can manage social_accounts for their sites"
  ON public.social_accounts FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_posts for their sites"
  ON public.social_posts FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_publish_log for their sites"
  ON public.social_publish_log FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_campaigns for their sites"
  ON public.social_campaigns FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_calendar_events for their sites"
  ON public.social_calendar_events FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_analytics_daily for their sites"
  ON public.social_analytics_daily FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_post_analytics for their sites"
  ON public.social_post_analytics FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_optimal_times for their sites"
  ON public.social_optimal_times FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_inbox_items for their sites"
  ON public.social_inbox_items FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_saved_replies for their sites"
  ON public.social_saved_replies FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_approval_requests for their sites"
  ON public.social_approval_requests FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_hashtag_groups for their sites"
  ON public.social_hashtag_groups FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage social_media_library for their sites"
  ON public.social_media_library FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      LEFT JOIN public.clients c ON s.client_id = c.id
      WHERE s.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
         OR c.agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_campaigns_updated_at
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_calendar_events_updated_at
  BEFORE UPDATE ON public.social_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_saved_replies_updated_at
  BEFORE UPDATE ON public.social_saved_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_approval_requests_updated_at
  BEFORE UPDATE ON public.social_approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_hashtag_groups_updated_at
  BEFORE UPDATE ON public.social_hashtag_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_social_media_library_updated_at
  BEFORE UPDATE ON public.social_media_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STEP 3: Register module in marketplace
-- ============================================================================

INSERT INTO public.modules_v2 (
  slug,
  name,
  description,
  long_description,
  icon,
  category,
  tags,
  install_level,
  pricing_type,
  wholesale_price_monthly,
  wholesale_price_yearly,
  suggested_retail_monthly,
  suggested_retail_yearly,
  status,
  features,
  provided_hooks,
  author_name,
  author_verified,
  is_featured,
  is_premium,
  settings_schema,
  default_settings,
  manifest
) VALUES (
  'social-media',
  'Social Media Management',
  'Comprehensive social media management with multi-platform publishing, scheduling, and analytics',
  'Powerful social media management platform like Hootsuite and Sprout Social combined. Manage all your social accounts from one dashboard, schedule posts, track analytics, and engage with your audience.

## Features
- **Multi-Platform Support**: Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, Pinterest, Threads, Bluesky, Mastodon
- **Content Calendar**: Visual calendar with drag-and-drop scheduling
- **Post Composer**: Rich editor with platform-specific customization
- **Unified Inbox**: Manage comments, DMs, and mentions from all platforms
- **Analytics Dashboard**: Track engagement, reach, and growth metrics
- **Campaign Management**: Organize posts into campaigns with goals and budgets
- **AI Content Ideas**: Get AI-powered content suggestions
- **Team Collaboration**: Approval workflows and team permissions
- **Optimal Timing**: AI-suggested best times to post
- **Saved Replies**: Quick response templates for engagement

Perfect for agencies managing multiple client social media accounts or brands managing their own presence across multiple platforms.',
  '📱',
  'marketing',
  ARRAY['social-media', 'scheduling', 'analytics', 'engagement', 'content'],
  'site',
  'monthly',
  4999,
  47999,
  7999,
  76799,
  'active',
  ARRAY[
    'Multi-platform publishing (10 platforms)',
    'Visual content calendar',
    'Post scheduling with optimal timing',
    'Unified social inbox',
    'Analytics & reporting',
    'Campaign management',
    'Approval workflows',
    'Team collaboration',
    'AI content suggestions',
    'Saved reply templates',
    'Hashtag management',
    'Media library',
    'Brand monitoring',
    'Competitor tracking',
    'Custom reports',
    'Bulk actions',
    'Mobile responsive',
    'Real-time notifications'
  ],
  ARRAY[
    'social.post.scheduled',
    'social.post.published',
    'social.post.failed',
    'social.mention.received',
    'social.comment.received',
    'social.dm.received'
  ],
  'DRAMAC',
  true,
  true,
  true,
  '{
    "type": "object",
    "properties": {
      "autoApprove": {
        "type": "boolean",
        "title": "Auto-approve posts",
        "description": "Skip approval workflow for scheduled posts",
        "default": false
      },
      "defaultTimezone": {
        "type": "string",
        "title": "Default timezone",
        "description": "Timezone for scheduling posts",
        "default": "UTC",
        "enum": ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo"]
      },
      "enableAISuggestions": {
        "type": "boolean",
        "title": "Enable AI suggestions",
        "description": "Show AI-powered content ideas and optimal posting times",
        "default": true
      },
      "inboxAutoAssign": {
        "type": "boolean",
        "title": "Auto-assign inbox items",
        "description": "Automatically assign inbox items to team members",
        "default": false
      },
      "notifyOnMentions": {
        "type": "boolean",
        "title": "Notify on brand mentions",
        "description": "Send notifications when your brand is mentioned",
        "default": true
      }
    }
  }'::jsonb,
  '{
    "autoApprove": false,
    "defaultTimezone": "UTC",
    "enableAISuggestions": true,
    "inboxAutoAssign": false,
    "notifyOnMentions": true
  }'::jsonb,
  '{
    "version": "1.0.0",
    "routes": [
      {
        "path": "/social",
        "component": "SocialDashboard"
      },
      {
        "path": "/social/calendar",
        "component": "ContentCalendar"
      },
      {
        "path": "/social/compose",
        "component": "PostComposer"
      },
      {
        "path": "/social/inbox",
        "component": "SocialInbox"
      }
    ],
    "permissions": [
      "social.accounts.manage",
      "social.posts.create",
      "social.posts.approve",
      "social.analytics.view",
      "social.inbox.manage"
    ]
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  features = EXCLUDED.features,
  status = EXCLUDED.status,
  wholesale_price_monthly = EXCLUDED.wholesale_price_monthly,
  suggested_retail_monthly = EXCLUDED.suggested_retail_monthly;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Migration complete. You can now:
-- 1. Subscribe to the module: Browse marketplace → Social Media → Subscribe
-- 2. Enable on a site: Site > Modules tab > Social Media > Toggle ON
-- 3. Access: /dashboard/sites/{siteId}/social
-- ============================================================================
