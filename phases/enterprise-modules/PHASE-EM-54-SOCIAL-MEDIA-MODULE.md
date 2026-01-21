# Phase EM-54: Social Media Management Module

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 20-25 hours
> **Prerequisites**: EM-01, EM-11, EM-12
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **social media management module** (similar to Hootsuite/Buffer):
1. Multi-platform social account management
2. Post scheduling and publishing
3. Content calendar
4. Analytics and reporting
5. Team collaboration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SOCIAL MEDIA MODULE                               │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   ACCOUNTS     │   CONTENT       │      ANALYTICS                   │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ OAuth Connect  │ Post Composer   │ Engagement Metrics               │
│ Multi-platform │ Media Library   │ Growth Tracking                  │
│ Profile Sync   │ Schedule Queue  │ Best Time Analysis               │
│ Permissions    │ Content Calendar│ Report Generation                │
└────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1 hour)

```sql
-- migrations/em-54-social-media-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Social Accounts (connected platforms)
CREATE TABLE mod_social.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN (
    'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'
  )),
  platform_account_id TEXT NOT NULL,
  account_type TEXT DEFAULT 'profile' CHECK (account_type IN (
    'profile', 'page', 'business', 'creator'
  )),
  
  -- Account Info
  account_name TEXT NOT NULL,
  account_handle TEXT,
  account_avatar TEXT,
  account_url TEXT,
  
  -- OAuth
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'expired', 'disconnected', 'error'
  )),
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  
  -- Stats (cached)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, platform, platform_account_id)
);

-- Posts
CREATE TABLE mod_social.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Media
  media JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ type: 'image'|'video', url: '', thumbnail_url: '', alt_text: '' }]
  
  -- Link Preview
  link_url TEXT,
  link_preview JSONB,
  
  -- Platform-specific content
  platform_content JSONB DEFAULT '{}'::jsonb,
  -- Format: { facebook: { content: '', ... }, twitter: { content: '', ... } }
  
  -- Scheduling
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'publishing', 'published', 'failed', 'deleted'
  )),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Target accounts
  target_accounts UUID[] NOT NULL,
  
  -- Publishing results
  publish_results JSONB DEFAULT '{}'::jsonb,
  -- Format: { account_id: { platform_post_id: '', url: '', error: '' } }
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Labels/Tags
  labels TEXT[],
  campaign_id UUID,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Publishing Log
CREATE TABLE mod_social.publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mod_social.posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id),
  
  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  platform_post_id TEXT,
  platform_url TEXT,
  error_message TEXT,
  error_code TEXT,
  
  -- Timing
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- Content Calendar
CREATE TABLE mod_social.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Event
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Timing
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN DEFAULT true,
  
  -- Type
  event_type TEXT DEFAULT 'custom' CHECK (event_type IN (
    'custom', 'holiday', 'campaign', 'launch', 'milestone'
  )),
  
  -- Links
  campaign_id UUID,
  post_ids UUID[],
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE mod_social.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Period
  start_date DATE,
  end_date DATE,
  
  -- Goals
  goals JSONB DEFAULT '{}'::jsonb,
  -- Format: { impressions: 10000, engagement: 500, clicks: 100 }
  
  -- Tracking
  hashtags TEXT[],
  utm_campaign TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'paused', 'completed', 'archived'
  )),
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Library
CREATE TABLE mod_social.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- URLs
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL,
  
  -- Organization
  folder_path TEXT DEFAULT '/',
  tags TEXT[],
  alt_text TEXT,
  
  -- Usage tracking
  used_in_posts UUID[],
  
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Snapshots (daily)
CREATE TABLE mod_social.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id),
  date DATE NOT NULL,
  
  -- Growth
  followers_count INTEGER,
  followers_change INTEGER,
  following_count INTEGER,
  
  -- Engagement
  posts_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Video-specific
  video_views INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  
  -- Profile
  profile_views INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, date)
);

-- Post Analytics
CREATE TABLE mod_social.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mod_social.posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id),
  
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
  
  -- Engagement rate
  engagement_rate DECIMAL(5,2),
  
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, account_id)
);

-- Hashtag Tracking
CREATE TABLE mod_social.hashtag_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL,
  
  -- Stats
  post_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL(10,2) DEFAULT 0,
  
  -- Tracking
  is_monitoring BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, hashtag, platform)
);

-- Best Time Slots (AI-learned)
CREATE TABLE mod_social.best_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES mod_social.accounts(id),
  
  -- Time slot
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- Score (0-100)
  engagement_score INTEGER DEFAULT 50,
  
  -- Based on
  sample_size INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, day_of_week, hour)
);

-- Team Permissions
CREATE TABLE mod_social.team_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Permissions
  can_manage_accounts BOOLEAN DEFAULT false,
  can_create_posts BOOLEAN DEFAULT true,
  can_publish_posts BOOLEAN DEFAULT false,
  can_approve_posts BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT true,
  can_manage_campaigns BOOLEAN DEFAULT false,
  
  -- Account-specific
  allowed_accounts UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, user_id)
);

-- Indexes
CREATE INDEX idx_social_accounts_site ON mod_social.accounts(site_id, status);
CREATE INDEX idx_social_accounts_platform ON mod_social.accounts(platform, status);
CREATE INDEX idx_social_posts_site ON mod_social.posts(site_id, status);
CREATE INDEX idx_social_posts_scheduled ON mod_social.posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_campaign ON mod_social.posts(campaign_id);
CREATE INDEX idx_analytics_daily_account ON mod_social.analytics_daily(account_id, date DESC);
CREATE INDEX idx_post_analytics_post ON mod_social.post_analytics(post_id);

-- Enable RLS
ALTER TABLE mod_social.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_social.analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant isolation)
CREATE POLICY tenant_isolation ON mod_social.accounts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON mod_social.posts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON mod_social.campaigns
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Platform Integration Service (3 hours)

```typescript
// src/modules/social-media/services/platform-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_handle: string;
  account_avatar: string;
  status: string;
  followers_count: number;
}

export interface PlatformConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token'
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token'
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    scopes: ['r_liteprofile', 'w_member_social', 'r_organization_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
  },
  instagram: {
    clientId: process.env.INSTAGRAM_APP_ID!,
    clientSecret: process.env.INSTAGRAM_APP_SECRET!,
    scopes: ['instagram_basic', 'instagram_content_publish'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token'
  }
};

export class PlatformService {
  /**
   * Get OAuth URL for platform connection
   */
  getOAuthUrl(
    platform: string,
    siteId: string,
    redirectUrl: string
  ): string {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) throw new Error(`Unsupported platform: ${platform}`);

    const state = Buffer.from(JSON.stringify({ siteId, platform })).toString('base64');
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUrl,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    platform: string,
    code: string,
    siteId: string,
    tenantId: string,
    userId: string,
    redirectUrl: string
  ): Promise<SocialAccount> {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) throw new Error(`Unsupported platform: ${platform}`);

    // Exchange code for token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUrl,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    // Get account info based on platform
    const accountInfo = await this.fetchAccountInfo(platform, tokenData.access_token);

    // Save account
    const { data, error } = await supabase
      .from('mod_social.accounts')
      .upsert({
        site_id: siteId,
        tenant_id: tenantId,
        platform,
        platform_account_id: accountInfo.id,
        account_type: accountInfo.type,
        account_name: accountInfo.name,
        account_handle: accountInfo.handle,
        account_avatar: accountInfo.avatar,
        account_url: accountInfo.url,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: config.scopes,
        status: 'active',
        followers_count: accountInfo.followers,
        created_by: userId
      }, { onConflict: 'site_id,platform,platform_account_id' })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Fetch account info from platform
   */
  private async fetchAccountInfo(
    platform: string,
    accessToken: string
  ): Promise<{
    id: string;
    type: string;
    name: string;
    handle: string;
    avatar: string;
    url: string;
    followers: number;
  }> {
    switch (platform) {
      case 'facebook': {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
        );
        const data = await response.json();
        return {
          id: data.id,
          type: 'profile',
          name: data.name,
          handle: '',
          avatar: data.picture?.data?.url || '',
          url: `https://facebook.com/${data.id}`,
          followers: 0
        };
      }

      case 'twitter': {
        const response = await fetch(
          'https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const { data } = await response.json();
        return {
          id: data.id,
          type: 'profile',
          name: data.name,
          handle: `@${data.username}`,
          avatar: data.profile_image_url,
          url: `https://twitter.com/${data.username}`,
          followers: data.public_metrics?.followers_count || 0
        };
      }

      case 'linkedin': {
        const response = await fetch(
          'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture)',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await response.json();
        return {
          id: data.id,
          type: 'profile',
          name: `${data.localizedFirstName} ${data.localizedLastName}`,
          handle: '',
          avatar: data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || '',
          url: `https://linkedin.com/in/${data.id}`,
          followers: 0
        };
      }

      case 'instagram': {
        const response = await fetch(
          `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
        );
        const data = await response.json();
        return {
          id: data.id,
          type: data.account_type,
          name: data.username,
          handle: `@${data.username}`,
          avatar: '',
          url: `https://instagram.com/${data.username}`,
          followers: 0
        };
      }

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Refresh expired tokens
   */
  async refreshToken(accountId: string): Promise<void> {
    const { data: account } = await supabase
      .from('mod_social.accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account || !account.refresh_token) {
      throw new Error('Cannot refresh token');
    }

    const config = PLATFORM_CONFIGS[account.platform];
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const tokenData = await response.json();

    if (tokenData.error) {
      await supabase
        .from('mod_social.accounts')
        .update({ 
          status: 'expired',
          last_error: tokenData.error_description || tokenData.error
        })
        .eq('id', accountId);
      throw new Error(tokenData.error);
    }

    await supabase
      .from('mod_social.accounts')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || account.refresh_token,
        token_expires_at: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        status: 'active',
        last_error: null
      })
      .eq('id', accountId);
  }

  /**
   * Disconnect account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await supabase
      .from('mod_social.accounts')
      .update({ 
        status: 'disconnected',
        access_token: null,
        refresh_token: null
      })
      .eq('id', accountId);
  }
}
```

---

### Task 3: Post Publishing Service (3 hours)

```typescript
// src/modules/social-media/services/publishing-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Post {
  id: string;
  content: string;
  media: Array<{ type: string; url: string; alt_text?: string }>;
  scheduled_at: string | null;
  target_accounts: string[];
  status: string;
}

export interface PublishResult {
  accountId: string;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}

export class PublishingService {
  /**
   * Create a post
   */
  async createPost(
    siteId: string,
    tenantId: string,
    userId: string,
    post: {
      content: string;
      media?: Array<{ type: string; url: string; alt_text?: string }>;
      platformContent?: Record<string, { content: string }>;
      targetAccounts: string[];
      scheduledAt?: string;
      campaignId?: string;
      labels?: string[];
      requiresApproval?: boolean;
    }
  ): Promise<Post> {
    const { data, error } = await supabase
      .from('mod_social.posts')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        content: post.content,
        media: post.media || [],
        platform_content: post.platformContent || {},
        target_accounts: post.targetAccounts,
        scheduled_at: post.scheduledAt,
        campaign_id: post.campaignId,
        labels: post.labels || [],
        requires_approval: post.requiresApproval || false,
        status: post.scheduledAt ? 'scheduled' : 'draft',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    updates: Partial<Post>
  ): Promise<Post> {
    const { data, error } = await supabase
      .from('mod_social.posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Publish a post immediately
   */
  async publishNow(postId: string): Promise<PublishResult[]> {
    const { data: post } = await supabase
      .from('mod_social.posts')
      .select(`
        *,
        accounts:mod_social.accounts!inner(*)
      `)
      .eq('id', postId)
      .single();

    if (!post) throw new Error('Post not found');

    // Update status to publishing
    await supabase
      .from('mod_social.posts')
      .update({ status: 'publishing' })
      .eq('id', postId);

    const results: PublishResult[] = [];
    const publishResults: Record<string, unknown> = {};

    // Publish to each target account
    for (const accountId of post.target_accounts) {
      const account = post.accounts.find((a: { id: string }) => a.id === accountId);
      if (!account) continue;

      try {
        const result = await this.publishToAccount(post, account);
        results.push({
          accountId,
          success: true,
          platformPostId: result.id,
          platformUrl: result.url
        });
        publishResults[accountId] = {
          platform_post_id: result.id,
          url: result.url
        };

        // Log success
        await supabase.from('mod_social.publish_log').insert({
          post_id: postId,
          account_id: accountId,
          status: 'success',
          platform_post_id: result.id,
          platform_url: result.url
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          accountId,
          success: false,
          error: errorMessage
        });
        publishResults[accountId] = { error: errorMessage };

        // Log failure
        await supabase.from('mod_social.publish_log').insert({
          post_id: postId,
          account_id: accountId,
          status: 'failed',
          error_message: errorMessage
        });
      }
    }

    // Update post status
    const allSucceeded = results.every(r => r.success);
    const someSucceeded = results.some(r => r.success);

    await supabase
      .from('mod_social.posts')
      .update({
        status: allSucceeded ? 'published' : someSucceeded ? 'published' : 'failed',
        publish_results: publishResults,
        published_at: new Date().toISOString()
      })
      .eq('id', postId);

    return results;
  }

  /**
   * Publish to a specific account
   */
  private async publishToAccount(
    post: Post & { accounts: Array<{ id: string; platform: string; access_token: string }> },
    account: { id: string; platform: string; access_token: string }
  ): Promise<{ id: string; url: string }> {
    // Get platform-specific content or use default
    const content = (post as { platform_content?: Record<string, { content: string }> }).platform_content?.[account.platform]?.content || post.content;

    switch (account.platform) {
      case 'facebook':
        return this.publishToFacebook(account, content, post.media);
      
      case 'twitter':
        return this.publishToTwitter(account, content, post.media);
      
      case 'linkedin':
        return this.publishToLinkedIn(account, content, post.media);
      
      case 'instagram':
        return this.publishToInstagram(account, content, post.media);
      
      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }
  }

  /**
   * Publish to Facebook
   */
  private async publishToFacebook(
    account: { access_token: string },
    content: string,
    media: Post['media']
  ): Promise<{ id: string; url: string }> {
    if (media.length > 0) {
      // Upload media first
      const mediaIds: string[] = [];
      for (const m of media) {
        const uploadRes = await fetch(
          `https://graph.facebook.com/v18.0/me/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: m.url,
              published: false,
              access_token: account.access_token
            })
          }
        );
        const uploadData = await uploadRes.json();
        if (uploadData.id) mediaIds.push(uploadData.id);
      }

      // Create post with media
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            attached_media: mediaIds.map(id => ({ media_fbid: id })),
            access_token: account.access_token
          })
        }
      );
      const data = await response.json();
      return {
        id: data.id,
        url: `https://facebook.com/${data.id}`
      };
    } else {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            access_token: account.access_token
          })
        }
      );
      const data = await response.json();
      return {
        id: data.id,
        url: `https://facebook.com/${data.id}`
      };
    }
  }

  /**
   * Publish to Twitter
   */
  private async publishToTwitter(
    account: { access_token: string },
    content: string,
    media: Post['media']
  ): Promise<{ id: string; url: string }> {
    let mediaIds: string[] = [];

    // Upload media first if present
    if (media.length > 0) {
      for (const m of media) {
        // Twitter requires media to be uploaded first
        const uploadRes = await fetch(
          'https://upload.twitter.com/1.1/media/upload.json',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ media_data: m.url })
          }
        );
        const uploadData = await uploadRes.json();
        if (uploadData.media_id_string) {
          mediaIds.push(uploadData.media_id_string);
        }
      }
    }

    const response = await fetch(
      'https://api.twitter.com/2/tweets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: content,
          ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
        })
      }
    );
    
    const data = await response.json();
    return {
      id: data.data.id,
      url: `https://twitter.com/i/status/${data.data.id}`
    };
  }

  /**
   * Publish to LinkedIn
   */
  private async publishToLinkedIn(
    account: { access_token: string },
    content: string,
    media: Post['media']
  ): Promise<{ id: string; url: string }> {
    // Get user URN
    const meRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${account.access_token}` }
    });
    const meData = await meRes.json();
    const authorUrn = `urn:li:person:${meData.id}`;

    const postBody: Record<string, unknown> = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: media.length > 0 ? 'IMAGE' : 'NONE',
          ...(media.length > 0 && {
            media: media.map(m => ({
              status: 'READY',
              originalUrl: m.url,
              description: { text: m.alt_text || '' }
            }))
          })
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    };

    const response = await fetch(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postBody)
      }
    );

    const data = await response.json();
    const postId = data.id.split(':').pop();
    return {
      id: data.id,
      url: `https://linkedin.com/feed/update/${postId}`
    };
  }

  /**
   * Publish to Instagram
   */
  private async publishToInstagram(
    account: { access_token: string; platform_account_id?: string },
    content: string,
    media: Post['media']
  ): Promise<{ id: string; url: string }> {
    if (media.length === 0) {
      throw new Error('Instagram requires at least one image or video');
    }

    const igAccountId = account.platform_account_id;

    // Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: media[0].url,
          caption: content,
          access_token: account.access_token
        })
      }
    );
    
    const containerData = await containerRes.json();
    const containerId = containerData.id;

    // Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: account.access_token
        })
      }
    );

    const publishData = await publishRes.json();
    return {
      id: publishData.id,
      url: `https://instagram.com/p/${publishData.id}`
    };
  }

  /**
   * Process scheduled posts
   */
  async processScheduledPosts(): Promise<void> {
    const now = new Date().toISOString();

    // Get posts that are due
    const { data: posts } = await supabase
      .from('mod_social.posts')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .limit(50);

    for (const post of posts || []) {
      try {
        await this.publishNow(post.id);
      } catch (error) {
        console.error(`Failed to publish post ${post.id}:`, error);
      }
    }
  }

  /**
   * Get best times to post
   */
  async getBestTimes(accountId: string): Promise<Array<{
    dayOfWeek: number;
    hour: number;
    score: number;
  }>> {
    const { data } = await supabase
      .from('mod_social.best_times')
      .select('day_of_week, hour, engagement_score')
      .eq('account_id', accountId)
      .order('engagement_score', { ascending: false })
      .limit(10);

    return (data || []).map(t => ({
      dayOfWeek: t.day_of_week,
      hour: t.hour,
      score: t.engagement_score
    }));
  }
}
```

---

### Task 4: Content Calendar UI (2 hours)

```tsx
// src/modules/social-media/components/ContentCalendar.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  MoreHorizontal
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui';

interface Post {
  id: string;
  content: string;
  scheduled_at: string;
  status: string;
  target_accounts: string[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  color: string;
  event_type: string;
}

interface ContentCalendarProps {
  posts: Post[];
  events: CalendarEvent[];
  accounts: Array<{ id: string; platform: string; account_name: string }>;
  onCreatePost: () => void;
  onEditPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ContentCalendar({
  posts,
  events,
  accounts,
  onCreatePost,
  onEditPost,
  onDeletePost
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add days from previous month
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentDate]);

  const getPostsForDay = (date: Date): Post[] => {
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter(p => {
      if (!p.scheduled_at) return false;
      return p.scheduled_at.split('T')[0] === dateStr;
    });
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const start = e.start_date;
      const end = e.end_date || e.start_date;
      return dateStr >= start && dateStr <= end;
    });
  };

  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      facebook: '📘',
      twitter: '🐦',
      instagram: '📸',
      linkedin: '💼',
      tiktok: '🎵',
      youtube: '▶️'
    };
    return icons[platform] || '📱';
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onCreatePost}>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Day headers */}
          {DAYS.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, i) => {
            const dayPosts = getPostsForDay(date);
            const dayEvents = getEventsForDay(date);
            
            return (
              <div
                key={i}
                className={`min-h-32 p-1 border-b border-r ${
                  !isCurrentMonth(date) ? 'bg-muted/30' : ''
                }`}
              >
                {/* Date number */}
                <div className={`text-right p-1 ${
                  isToday(date) 
                    ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center ml-auto'
                    : !isCurrentMonth(date) ? 'text-muted-foreground' : ''
                }`}>
                  {date.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs px-1.5 py-0.5 rounded truncate"
                      style={{ backgroundColor: event.color, color: 'white' }}
                    >
                      {event.title}
                    </div>
                  ))}

                  {/* Posts */}
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className="group text-xs p-1 bg-muted rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => onEditPost(post.id)}
                    >
                      <div className="flex items-center gap-1">
                        {post.target_accounts.slice(0, 2).map(accId => {
                          const acc = accounts.find(a => a.id === accId);
                          return acc ? (
                            <span key={accId} className="text-xs">
                              {getPlatformIcon(acc.platform)}
                            </span>
                          ) : null;
                        })}
                        <span className="truncate flex-1">{post.content.slice(0, 30)}...</span>
                      </div>
                    </div>
                  ))}

                  {/* More indicator */}
                  {(dayPosts.length > 3 || dayEvents.length > 2) && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayPosts.length - 3 + Math.max(0, dayEvents.length - 2)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 5: Post Composer UI (2 hours)

```tsx
// src/modules/social-media/components/PostComposer.tsx

'use client';

import { useState, useRef } from 'react';
import {
  Image,
  Video,
  Smile,
  Calendar,
  Send,
  X,
  Clock,
  Hash,
  AtSign,
  Link2
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Textarea,
  Checkbox,
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar as CalendarUI,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';
import EmojiPicker from 'emoji-picker-react';

interface Account {
  id: string;
  platform: string;
  account_name: string;
  account_avatar: string;
  status: string;
}

interface PostComposerProps {
  accounts: Account[];
  onSubmit: (post: {
    content: string;
    media: Array<{ type: string; url: string }>;
    targetAccounts: string[];
    scheduledAt?: string;
    platformContent?: Record<string, { content: string }>;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    content: string;
    media: Array<{ type: string; url: string }>;
    targetAccounts: string[];
    scheduledAt?: string;
  };
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200
};

const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    facebook: '📘',
    twitter: '🐦',
    instagram: '📸',
    linkedin: '💼',
    tiktok: '🎵'
  };
  return icons[platform] || '📱';
};

export function PostComposer({
  accounts,
  onSubmit,
  onCancel,
  initialData
}: PostComposerProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [media, setMedia] = useState<Array<{ type: string; url: string }>>(
    initialData?.media || []
  );
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    initialData?.targetAccounts || []
  );
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt) : undefined
  );
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [platformContent, setPlatformContent] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('compose');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Upload to your storage service
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const { url } = await response.json();
      
      setMedia(prev => [...prev, {
        type: file.type.startsWith('video') ? 'video' : 'image',
        url
      }]);
    }
  };

  const handleEmojiSelect = (emoji: { emoji: string }) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji.emoji + content.slice(end);
      setContent(newContent);
    } else {
      setContent(prev => prev + emoji.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!content.trim() || selectedAccounts.length === 0) return;

    setIsSubmitting(true);

    try {
      let scheduled: string | undefined;
      if (!publishNow && scheduledAt) {
        const [hours, minutes] = scheduleTime.split(':');
        const dateTime = new Date(scheduledAt);
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        scheduled = dateTime.toISOString();
      }

      await onSubmit({
        content,
        media,
        targetAccounts: selectedAccounts,
        scheduledAt: scheduled,
        platformContent: Object.entries(platformContent).reduce(
          (acc, [platform, text]) => ({
            ...acc,
            [platform]: { content: text || content }
          }),
          {}
        )
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCount = (platform: string): { count: number; limit: number; over: boolean } => {
    const text = platformContent[platform] || content;
    const limit = PLATFORM_LIMITS[platform] || 5000;
    return {
      count: text.length,
      limit,
      over: text.length > limit
    };
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* Account Selection */}
        <div className="mb-4">
          <Label className="mb-2 block">Post to:</Label>
          <div className="flex flex-wrap gap-2">
            {accounts.filter(a => a.status === 'active').map(account => (
              <button
                key={account.id}
                onClick={() => handleAccountToggle(account.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  selectedAccounts.includes(account.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                <span className="text-sm">{account.account_name}</span>
                {selectedAccounts.includes(account.id) && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            {selectedAccounts.length > 1 && (
              <TabsTrigger value="customize">Customize Per Platform</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="compose">
            {/* Content Editor */}
            <div className="relative mb-4">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-32 resize-none pr-10"
              />
              
              {/* Emoji Picker */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <EmojiPicker onEmojiClick={handleEmojiSelect} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Character Counts */}
            {selectedAccounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedAccounts.map(accId => {
                  const account = accounts.find(a => a.id === accId);
                  if (!account) return null;
                  const chars = getCharacterCount(account.platform);
                  return (
                    <Badge
                      key={accId}
                      variant={chars.over ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {getPlatformIcon(account.platform)} {chars.count}/{chars.limit}
                    </Badge>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="customize">
            <div className="space-y-4">
              {selectedAccounts.map(accId => {
                const account = accounts.find(a => a.id === accId);
                if (!account) return null;
                const chars = getCharacterCount(account.platform);
                return (
                  <div key={accId}>
                    <Label className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                      {account.account_name}
                      <Badge variant={chars.over ? 'destructive' : 'secondary'} className="ml-auto">
                        {chars.count}/{chars.limit}
                      </Badge>
                    </Label>
                    <Textarea
                      value={platformContent[account.platform] || content}
                      onChange={(e) => setPlatformContent(prev => ({
                        ...prev,
                        [account.platform]: e.target.value
                      }))}
                      placeholder={`Customize for ${account.platform}...`}
                      className="min-h-24"
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Media Preview */}
        {media.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {media.map((m, i) => (
              <div key={i} className="relative group">
                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={m.url}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={() => setMedia(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-4 w-4 mr-1" />
            Photo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Video className="h-4 w-4 mr-1" />
            Video
          </Button>
          <Button variant="ghost" size="sm">
            <Hash className="h-4 w-4 mr-1" />
            Hashtag
          </Button>
          <Button variant="ghost" size="sm">
            <Link2 className="h-4 w-4 mr-1" />
            Link
          </Button>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-4 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {scheduledAt ? scheduledAt.toLocaleDateString() : 'Schedule'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarUI
                mode="single"
                selected={scheduledAt}
                onSelect={setScheduledAt}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          {scheduledAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-32"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScheduledAt(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {scheduledAt ? (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || selectedAccounts.length === 0 || !content.trim()}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Post
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || selectedAccounts.length === 0 || !content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Verification Checklist

- [ ] OAuth connects all platforms
- [ ] Posts create and schedule
- [ ] Media uploads correctly
- [ ] Calendar displays properly
- [ ] Publishing works per platform
- [ ] Analytics sync daily
- [ ] Token refresh works
- [ ] Character limits validate
- [ ] Team permissions apply
- [ ] Best times calculate

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-12
- **Required by**: Client social management
- **External**: Facebook, Twitter, LinkedIn, Instagram APIs
