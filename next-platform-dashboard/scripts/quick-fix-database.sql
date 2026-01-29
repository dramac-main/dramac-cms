-- ============================================================================
-- DRAMAC CMS - Quick Database Setup & Verification
-- Run this in Supabase SQL Editor
-- ============================================================================
-- Note: Supabase only shows output from the LAST query
-- So we create everything first, then show diagnostics at the end
-- ============================================================================

-- 1. Fix AI agents column name if needed (silently)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'type'
  ) THEN
    ALTER TABLE ai_agents RENAME COLUMN type TO agent_type;
    RAISE NOTICE 'Renamed ai_agents.type to agent_type';
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE SOCIAL MEDIA TABLES (if they don't exist)
-- ============================================================================

-- Create minimal social media tables in public schema
-- Full schema at: migrations/em-54-social-media.sql

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  platform TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  account_type TEXT DEFAULT 'profile',
  account_name TEXT NOT NULL,
  account_handle TEXT,
  account_avatar TEXT,
  account_url TEXT,
  
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  
  status TEXT DEFAULT 'active',
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, platform, platform_account_id)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  content TEXT NOT NULL,
  content_html TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  
  link_url TEXT,
  link_preview JSONB,
  platform_content JSONB DEFAULT '{}'::jsonb,
  
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  target_accounts UUID[] NOT NULL,
  publish_results JSONB DEFAULT '{}'::jsonb,
  
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  labels TEXT[],
  campaign_id UUID,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  followers_count INTEGER DEFAULT 0,
  followers_change INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  posts_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date)
);

CREATE TABLE IF NOT EXISTS social_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_accounts(id),
  
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  engagement_rate DECIMAL(5,2),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, account_id)
);

CREATE TABLE IF NOT EXISTS social_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES social_accounts(id),
  
  item_type TEXT NOT NULL,
  platform_item_id TEXT NOT NULL,
  
  content TEXT,
  author_name TEXT,
  author_avatar TEXT,
  
  status TEXT DEFAULT 'new',
  replied_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, platform_item_id)
);

CREATE TABLE IF NOT EXISTS social_saved_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pending',
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_accounts(id),
  
  status TEXT NOT NULL,
  platform_post_id TEXT,
  platform_url TEXT,
  error_message TEXT,
  error_code TEXT,
  
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS social_optimal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES social_accounts(id),
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  engagement_score INTEGER DEFAULT 50,
  sample_size INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, day_of_week, hour)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_site ON social_accounts(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_site ON social_posts(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_analytics_daily_account ON social_analytics_daily(account_id, date DESC);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_inbox_items ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust for your multi-tenant setup)
-- Note: You'll need to customize these based on your auth setup

-- Example policy for social_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'social_accounts' AND policyname = 'Users can view accounts for their sites'
  ) THEN
    CREATE POLICY "Users can view accounts for their sites"
      ON social_accounts FOR SELECT
      USING (
        site_id IN (
          SELECT id FROM sites WHERE id = social_accounts.site_id
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 3. COMPREHENSIVE DIAGNOSTIC OUTPUT (Single result with all info!)
-- ============================================================================

SELECT 
  '✅ Database Setup Complete!' as "Status",
  (SELECT COUNT(*)::text FROM pg_tables WHERE tablename LIKE 'social_%') as "Social Tables Created",
  (SELECT string_agg(tablename, ', ' ORDER BY tablename) 
   FROM pg_tables WHERE tablename LIKE 'social_%') as "Table Names",
  (SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'ai_agents' 
     AND column_name IN ('type', 'agent_type')
   LIMIT 1) as "AI Agents Column",
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE tablename LIKE 'social_%') >= 9 
     AND (SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'ai_agents' AND column_name = 'agent_type') = 'agent_type'
    THEN '🎉 All Good! Run: pnpm dev'
    ELSE '⚠️ Check results above'
  END as "Next Step";
