-- ============================================================================
-- Phase EM-54: Social Media Management Module
-- Comprehensive social media management like Hootsuite + Sprout Social
-- ============================================================================

-- Create schema for social media module
CREATE SCHEMA IF NOT EXISTS mod_social;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Social Accounts (connected platforms)
CREATE TABLE mod_social.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
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

-- ============================================================================
-- CONTENT & PUBLISHING
-- ============================================================================

-- Posts (scheduled and published content)
CREATE TABLE mod_social.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Media attachments
  media JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ id, type: 'image'|'video'|'gif'|'carousel', url, thumbnail_url, alt_text, dimensions }]
  
  -- Link Preview
  link_url TEXT,
  link_preview JSONB,
  -- Format: { title, description, image, domain }
  
  -- Platform-specific content variations
  platform_content JSONB DEFAULT '{}'::jsonb,
  -- Format: { facebook: { content, media }, twitter: { content, thread: [] }, ... }
  
  -- Targeting
  target_accounts UUID[] NOT NULL,
  target_audiences JSONB DEFAULT '[]'::jsonb,
  
  -- Scheduling
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'scheduled', 'publishing', 
    'published', 'partially_published', 'failed', 'deleted', 'archived'
  )),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  
  -- Publishing Results
  publish_results JSONB DEFAULT '{}'::jsonb,
  -- Format: { account_id: { platform_post_id, url, status, error, published_at } }
  
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
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- First Comment (Instagram/Facebook)
  first_comment TEXT,
  first_comment_delay_minutes INTEGER DEFAULT 0
);

-- Post Publishing Log
CREATE TABLE mod_social.publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mod_social.posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id) ON DELETE CASCADE,
  
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

-- Content Queue (Hootsuite-style queue)
CREATE TABLE mod_social.content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id) ON DELETE CASCADE,
  
  -- Queue Settings
  name TEXT NOT NULL DEFAULT 'Default Queue',
  is_active BOOLEAN DEFAULT true,
  posts_per_day INTEGER DEFAULT 3,
  
  -- Time Slots
  time_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ day: 0-6, time: "09:00", timezone: "UTC" }]
  
  -- Queue State
  next_available_slot TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Hashtag Groups
CREATE TABLE mod_social.hashtag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
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

-- ============================================================================
-- CAMPAIGNS & PLANNING
-- ============================================================================

-- Campaigns
CREATE TABLE mod_social.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
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
  -- Format: { impressions: 10000, engagement: 500, clicks: 100, followers: 50 }
  
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
CREATE TABLE mod_social.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
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
  campaign_id UUID REFERENCES mod_social.campaigns(id) ON DELETE SET NULL,
  post_ids UUID[],
  
  -- Notes
  notes JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Pillars (for content strategy)
CREATE TABLE mod_social.content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  
  -- Target mix
  target_percentage INTEGER DEFAULT 25 CHECK (target_percentage >= 0 AND target_percentage <= 100),
  
  -- Keywords & Topics
  keywords TEXT[],
  example_topics TEXT[],
  
  -- Stats
  post_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL(10,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEDIA LIBRARY
-- ============================================================================

-- Media Library
CREATE TABLE mod_social.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
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
  -- Format: { small: url, medium: url, large: url }
  
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
  -- Format: { instagram: { valid: true }, tiktok: { valid: false, error: "Too long" } }
  
  -- AI Analysis
  ai_tags TEXT[],
  ai_description TEXT,
  faces_detected INTEGER,
  dominant_colors TEXT[],
  
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

-- Media Folders
CREATE TABLE mod_social.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  parent_id UUID REFERENCES mod_social.media_folders(id) ON DELETE CASCADE,
  color TEXT,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & INSIGHTS (Sprout Social-style)
-- ============================================================================

-- Daily Analytics Snapshots
CREATE TABLE mod_social.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Audience Growth
  followers_count INTEGER,
  followers_gained INTEGER DEFAULT 0,
  followers_lost INTEGER DEFAULT 0,
  following_count INTEGER,
  
  -- Content Performance
  posts_published INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  -- Engagement
  engagement_total INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Engagement Rate
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Video Metrics
  video_views INTEGER DEFAULT 0,
  video_watch_time_seconds INTEGER DEFAULT 0,
  video_completion_rate DECIMAL(5,2),
  
  -- Stories/Reels (if applicable)
  stories_posted INTEGER DEFAULT 0,
  stories_views INTEGER DEFAULT 0,
  reels_posted INTEGER DEFAULT 0,
  reels_plays INTEGER DEFAULT 0,
  
  -- Profile Activity
  profile_views INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  
  -- Demographics (snapshot)
  audience_demographics JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, date)
);

-- Post Analytics
CREATE TABLE mod_social.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mod_social.posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id) ON DELETE CASCADE,
  platform_post_id TEXT,
  
  -- Core Metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  -- Engagement
  engagement_total INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Engagement Rate
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Video Specific
  video_views INTEGER DEFAULT 0,
  video_3s_views INTEGER DEFAULT 0,
  avg_watch_time_seconds DECIMAL(10,2),
  video_completion_rate DECIMAL(5,2),
  
  -- Link Specific
  link_clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  
  -- Audience
  new_followers_from_post INTEGER DEFAULT 0,
  
  -- Timing
  best_performing_hour INTEGER,
  
  -- Sentiment (from comments)
  sentiment_positive INTEGER DEFAULT 0,
  sentiment_neutral INTEGER DEFAULT 0,
  sentiment_negative INTEGER DEFAULT 0,
  
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, account_id)
);

-- Competitor Tracking
CREATE TABLE mod_social.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Competitor Info
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_handle TEXT NOT NULL,
  platform_id TEXT,
  avatar_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  
  -- Stats (cached)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  posting_frequency DECIMAL(5,2) DEFAULT 0,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, platform, platform_handle)
);

-- Competitor Analytics
CREATE TABLE mod_social.competitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES mod_social.competitors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  followers_count INTEGER,
  followers_change INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement INTEGER DEFAULT 0,
  
  -- Top Posts
  top_posts JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(competitor_id, date)
);

-- ============================================================================
-- SOCIAL LISTENING & INBOX
-- ============================================================================

-- Social Inbox (comments, messages, mentions)
CREATE TABLE mod_social.inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id) ON DELETE CASCADE,
  
  -- Type
  item_type TEXT NOT NULL CHECK (item_type IN (
    'comment', 'message', 'mention', 'review', 'dm', 'story_mention', 'story_reply'
  )),
  
  -- Platform IDs
  platform_item_id TEXT NOT NULL,
  platform_parent_id TEXT,
  related_post_id UUID REFERENCES mod_social.posts(id) ON DELETE SET NULL,
  
  -- Content
  content TEXT,
  media_url TEXT,
  
  -- Author
  author_id TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  author_followers INTEGER,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'read', 'replied', 'archived', 'spam', 'flagged'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Assignment
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- Response
  response_text TEXT,
  response_at TIMESTAMPTZ,
  response_by UUID,
  response_time_seconds INTEGER,
  
  -- Sentiment
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2),
  
  -- Tags
  tags TEXT[],
  
  -- Timestamps
  platform_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, platform_item_id)
);

-- Saved Replies / Response Templates
CREATE TABLE mod_social.saved_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  
  -- Shortcuts
  shortcut TEXT,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Permissions
  is_shared BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BRAND MENTIONS & LISTENING
-- ============================================================================

-- Brand Mentions (social listening)
CREATE TABLE mod_social.brand_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Platform Info
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  post_url TEXT,
  
  -- Content
  content TEXT,
  
  -- Author
  author_handle TEXT,
  author_name TEXT,
  author_followers INTEGER,
  
  -- Matched Keywords
  matched_keywords TEXT[],
  
  -- Sentiment
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2),
  
  -- Metrics
  engagement INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'reviewed', 'engaged', 'archived', 'irrelevant'
  )),
  
  -- Timestamps
  mentioned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listening Keywords
CREATE TABLE mod_social.listening_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  keyword TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'brand' CHECK (keyword_type IN (
    'brand', 'product', 'competitor', 'industry', 'hashtag'
  )),
  
  is_active BOOLEAN DEFAULT true,
  mentions_count INTEGER DEFAULT 0,
  last_mention_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OPTIMAL POSTING TIMES (AI-learned)
-- ============================================================================

CREATE TABLE mod_social.optimal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id) ON DELETE CASCADE,
  
  -- Time slot
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- Scores
  engagement_score INTEGER DEFAULT 50 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  reach_score INTEGER DEFAULT 50 CHECK (reach_score >= 0 AND reach_score <= 100),
  combined_score INTEGER DEFAULT 50 CHECK (combined_score >= 0 AND combined_score <= 100),
  
  -- Sample data
  sample_size INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, day_of_week, hour)
);

-- ============================================================================
-- TEAM & PERMISSIONS
-- ============================================================================

-- Team Permissions
CREATE TABLE mod_social.team_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Role-based Permissions
  role TEXT DEFAULT 'viewer' CHECK (role IN (
    'admin', 'manager', 'publisher', 'creator', 'viewer'
  )),
  
  -- Granular Permissions
  can_manage_accounts BOOLEAN DEFAULT false,
  can_connect_accounts BOOLEAN DEFAULT false,
  can_create_posts BOOLEAN DEFAULT true,
  can_edit_all_posts BOOLEAN DEFAULT false,
  can_schedule_posts BOOLEAN DEFAULT true,
  can_publish_posts BOOLEAN DEFAULT false,
  can_approve_posts BOOLEAN DEFAULT false,
  can_delete_posts BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT true,
  can_export_data BOOLEAN DEFAULT false,
  can_manage_inbox BOOLEAN DEFAULT true,
  can_respond_inbox BOOLEAN DEFAULT true,
  can_manage_campaigns BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,
  can_use_ai_features BOOLEAN DEFAULT true,
  
  -- Account Restrictions
  allowed_accounts UUID[],
  restricted_accounts UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, user_id)
);

-- Approval Workflows
CREATE TABLE mod_social.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Trigger Conditions
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  -- Format: { platforms: [], contains_keywords: [], campaign_ids: [], always: true }
  
  -- Approval Steps
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ order: 1, approvers: [user_id], type: 'any'|'all', timeout_hours: 24 }]
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Requests
CREATE TABLE mod_social.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES mod_social.approval_workflows(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES mod_social.posts(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'expired', 'cancelled'
  )),
  current_step INTEGER DEFAULT 1,
  
  -- Decision
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  -- Timing
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REPORTS
-- ============================================================================

-- Custom Reports
CREATE TABLE mod_social.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Report Config
  report_type TEXT DEFAULT 'performance' CHECK (report_type IN (
    'performance', 'engagement', 'audience', 'competitor', 'campaign', 'team', 'custom'
  )),
  
  -- Metrics & Filters
  metrics TEXT[] NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  date_range_type TEXT DEFAULT 'last_30_days',
  
  -- Accounts
  account_ids UUID[],
  
  -- Schedule
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER,
  schedule_time TIME,
  schedule_recipients TEXT[],
  
  -- Last Run
  last_generated_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI CONTENT GENERATION
-- ============================================================================

-- AI Content Ideas
CREATE TABLE mod_social.ai_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Idea
  title TEXT NOT NULL,
  content TEXT,
  platforms TEXT[],
  
  -- Generation Context
  prompt TEXT,
  content_pillar TEXT,
  campaign_id UUID,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'saved', 'used', 'rejected'
  )),
  
  -- Scheduling
  suggested_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Captions
CREATE TABLE mod_social.ai_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  -- Context
  prompt TEXT,
  media_url TEXT,
  platform TEXT,
  
  -- Generated Options
  captions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ content, hashtags, emoji_level, tone }]
  
  -- Selected
  selected_index INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Accounts
CREATE INDEX idx_social_accounts_site ON mod_social.accounts(site_id, status);
CREATE INDEX idx_social_accounts_platform ON mod_social.accounts(platform, status);
CREATE INDEX idx_social_accounts_tenant ON mod_social.accounts(tenant_id);

-- Posts
CREATE INDEX idx_social_posts_site ON mod_social.posts(site_id, status);
CREATE INDEX idx_social_posts_scheduled ON mod_social.posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_campaign ON mod_social.posts(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_social_posts_created ON mod_social.posts(created_at DESC);
CREATE INDEX idx_social_posts_published ON mod_social.posts(published_at DESC) WHERE status = 'published';

-- Analytics
CREATE INDEX idx_analytics_daily_account ON mod_social.analytics_daily(account_id, date DESC);
CREATE INDEX idx_post_analytics_post ON mod_social.post_analytics(post_id);
CREATE INDEX idx_post_analytics_synced ON mod_social.post_analytics(last_synced_at);

-- Inbox
CREATE INDEX idx_inbox_account ON mod_social.inbox_items(account_id, status, created_at DESC);
CREATE INDEX idx_inbox_assigned ON mod_social.inbox_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_inbox_priority ON mod_social.inbox_items(priority, created_at DESC) WHERE status = 'new';

-- Campaigns
CREATE INDEX idx_campaigns_site ON mod_social.campaigns(site_id, status);
CREATE INDEX idx_campaigns_dates ON mod_social.campaigns(start_date, end_date);

-- Calendar
CREATE INDEX idx_calendar_site ON mod_social.calendar_events(site_id, start_date);

-- Brand Mentions
CREATE INDEX idx_mentions_site ON mod_social.brand_mentions(site_id, mentioned_at DESC);
CREATE INDEX idx_mentions_sentiment ON mod_social.brand_mentions(site_id, sentiment);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mod_social.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.publish_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.hashtag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.competitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.saved_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.listening_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.optimal_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.team_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.ai_content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.ai_captions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (tenant isolation)
-- ============================================================================

CREATE POLICY tenant_isolation ON mod_social.accounts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON mod_social.posts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON mod_social.campaigns
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON mod_social.calendar_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON mod_social.media_library
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON mod_social.inbox_items
  FOR ALL USING (site_id IN (
    SELECT id FROM sites WHERE agency_id = current_setting('app.tenant_id', true)::uuid
  ));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION mod_social.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON mod_social.accounts
  FOR EACH ROW EXECUTE FUNCTION mod_social.update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON mod_social.posts
  FOR EACH ROW EXECUTE FUNCTION mod_social.update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON mod_social.campaigns
  FOR EACH ROW EXECUTE FUNCTION mod_social.update_updated_at();

CREATE TRIGGER update_inbox_updated_at
  BEFORE UPDATE ON mod_social.inbox_items
  FOR EACH ROW EXECUTE FUNCTION mod_social.update_updated_at();

-- Calculate optimal posting times
CREATE OR REPLACE FUNCTION mod_social.calculate_optimal_times(p_account_id UUID)
RETURNS VOID AS $$
DECLARE
  v_day INTEGER;
  v_hour INTEGER;
  v_score INTEGER;
  v_sample INTEGER;
BEGIN
  FOR v_day IN 0..6 LOOP
    FOR v_hour IN 0..23 LOOP
      SELECT 
        COALESCE(AVG(
          CASE 
            WHEN pa.engagement_rate > 0 THEN LEAST(pa.engagement_rate * 20, 100)::INTEGER
            ELSE 50
          END
        ), 50)::INTEGER,
        COUNT(*)::INTEGER
      INTO v_score, v_sample
      FROM mod_social.post_analytics pa
      JOIN mod_social.posts p ON pa.post_id = p.id
      WHERE pa.account_id = p_account_id
        AND EXTRACT(DOW FROM p.published_at) = v_day
        AND EXTRACT(HOUR FROM p.published_at) = v_hour
        AND p.published_at > NOW() - INTERVAL '90 days';
      
      INSERT INTO mod_social.optimal_times (account_id, day_of_week, hour, engagement_score, combined_score, sample_size)
      VALUES (p_account_id, v_day, v_hour, v_score, v_score, v_sample)
      ON CONFLICT (account_id, day_of_week, hour)
      DO UPDATE SET 
        engagement_score = EXCLUDED.engagement_score,
        combined_score = EXCLUDED.combined_score,
        sample_size = EXCLUDED.sample_size,
        updated_at = NOW();
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Get next available queue slot
CREATE OR REPLACE FUNCTION mod_social.get_next_queue_slot(p_queue_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_queue RECORD;
  v_slot JSONB;
  v_next_slot TIMESTAMPTZ;
  v_current_day INTEGER;
  v_current_time TIME;
  v_slot_day INTEGER;
  v_slot_time TIME;
  v_days_ahead INTEGER;
BEGIN
  SELECT * INTO v_queue FROM mod_social.content_queue WHERE id = p_queue_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  v_current_day := EXTRACT(DOW FROM NOW());
  v_current_time := NOW()::TIME;
  
  -- Find next available slot
  FOR v_slot IN SELECT * FROM jsonb_array_elements(v_queue.time_slots) LOOP
    v_slot_day := (v_slot->>'day')::INTEGER;
    v_slot_time := (v_slot->>'time')::TIME;
    
    -- Calculate days until this slot
    IF v_slot_day > v_current_day OR (v_slot_day = v_current_day AND v_slot_time > v_current_time) THEN
      v_days_ahead := v_slot_day - v_current_day;
    ELSE
      v_days_ahead := 7 - v_current_day + v_slot_day;
    END IF;
    
    v_next_slot := DATE_TRUNC('day', NOW()) + v_days_ahead * INTERVAL '1 day' + v_slot_time;
    
    -- Return first available slot
    RETURN v_next_slot;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Insert default content pillars template
-- (Will be customized per site on module activation)
