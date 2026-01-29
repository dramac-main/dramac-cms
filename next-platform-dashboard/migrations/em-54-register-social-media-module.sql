-- =============================================================
-- Phase EM-54: Register Social Media Module in modules_v2
-- =============================================================
-- This inserts the social media module into the database so it can be
-- subscribed to by agencies and installed on sites.
-- =============================================================

-- Insert social media module into modules_v2
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

## Supported Platforms
- Facebook (Pages, Groups, Profiles)
- Instagram (Business, Creator)
- Twitter/X
- LinkedIn (Profiles, Company Pages)
- TikTok (Business)
- YouTube (Channels)
- Pinterest
- Threads
- Bluesky
- Mastodon

## Perfect For
- Social Media Managers
- Marketing Agencies
- Content Creators
- Brand Management
- Community Engagement
- Influencer Marketing',
  '📱',
  'marketing',
  ARRAY['social-media', 'marketing', 'publishing', 'scheduling', 'analytics', 'engagement', 'inbox', 'campaigns', 'hootsuite', 'buffer', 'sprout-social'],
  'site', -- Site-level installation
  'monthly',
  4999, -- $49.99/month wholesale (what agencies pay)
  49990, -- $499.90/year wholesale
  7999, -- $79.99/month suggested retail
  79990, -- $799.90/year suggested retail
  'active',
  ARRAY[
    '10 social platforms supported',
    'Multi-platform publishing',
    'Content calendar',
    'Post scheduling',
    'Unified inbox',
    'Analytics dashboard',
    'Campaign management',
    'Team collaboration',
    'Approval workflows',
    'AI content ideas',
    'Optimal posting times',
    'Saved replies',
    'Bulk scheduling',
    'Media library',
    'First comment support',
    'Link preview',
    'Hashtag groups',
    'Performance reports'
  ],
  ARRAY['site:dashboard:tab', 'dashboard:site:tab', 'site:social'],
  'DRAMAC',
  true,
  true, -- Featured
  true, -- Premium
  '{
    "type": "object",
    "properties": {
      "defaultTimezone": {
        "type": "string",
        "default": "UTC",
        "title": "Default Timezone"
      },
      "requireApproval": {
        "type": "boolean",
        "default": false,
        "title": "Require Approval for Posts"
      },
      "autoScheduleEnabled": {
        "type": "boolean",
        "default": true,
        "title": "Enable Auto-Schedule"
      },
      "maxPostsPerDay": {
        "type": "integer",
        "default": 10,
        "title": "Max Posts Per Day",
        "minimum": 1,
        "maximum": 50
      }
    }
  }'::jsonb,
  '{
    "defaultTimezone": "UTC",
    "requireApproval": false,
    "autoScheduleEnabled": true,
    "maxPostsPerDay": 10
  }'::jsonb,
  '{
    "id": "social-media",
    "shortId": "social01",
    "version": "1.0.0",
    "name": "Social Media Management",
    "permissions": [
      "social:accounts:read",
      "social:accounts:write",
      "social:posts:read",
      "social:posts:write",
      "social:posts:publish",
      "social:analytics:read",
      "social:inbox:read",
      "social:inbox:write",
      "social:campaigns:read",
      "social:campaigns:write"
    ],
    "events": [
      "social.post.scheduled",
      "social.post.published",
      "social.post.failed",
      "social.account.connected",
      "social.account.disconnected",
      "social.inbox.new_item",
      "social.campaign.started",
      "social.campaign.completed"
    ],
    "actions": [
      "social.create_post",
      "social.schedule_post",
      "social.publish_post",
      "social.reply_to_message",
      "social.refresh_analytics"
    ],
    "apiRoutes": [
      "/api/sites/:siteId/social/accounts",
      "/api/sites/:siteId/social/posts",
      "/api/sites/:siteId/social/analytics",
      "/api/sites/:siteId/social/inbox",
      "/api/sites/:siteId/social/campaigns"
    ],
    "navigation": [
      {
        "label": "Social Dashboard",
        "path": "/dashboard/sites/:siteId/social",
        "icon": "Share2"
      },
      {
        "label": "Content Calendar",
        "path": "/dashboard/sites/:siteId/social/calendar",
        "icon": "Calendar"
      },
      {
        "label": "Compose Post",
        "path": "/dashboard/sites/:siteId/social/compose",
        "icon": "Edit"
      },
      {
        "label": "Social Inbox",
        "path": "/dashboard/sites/:siteId/social/inbox",
        "icon": "Inbox"
      }
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  features = EXCLUDED.features,
  wholesale_price_monthly = EXCLUDED.wholesale_price_monthly,
  wholesale_price_yearly = EXCLUDED.wholesale_price_yearly,
  suggested_retail_monthly = EXCLUDED.suggested_retail_monthly,
  suggested_retail_yearly = EXCLUDED.suggested_retail_yearly,
  settings_schema = EXCLUDED.settings_schema,
  default_settings = EXCLUDED.default_settings,
  manifest = EXCLUDED.manifest,
  updated_at = NOW();

-- Also add to a featured collection if not exists
INSERT INTO public.module_collections (
  slug,
  name,
  description,
  icon,
  is_featured,
  display_order
)
VALUES (
  'marketing-essentials',
  'Marketing Essentials',
  'Essential tools for digital marketing and growth',
  '📈',
  true,
  2
)
ON CONFLICT (slug) DO NOTHING;

-- Link social media module to marketing collection
INSERT INTO public.module_collection_items (
  collection_id,
  module_id,
  display_order
)
SELECT 
  mc.id,
  mv.id,
  1
FROM public.module_collections mc
CROSS JOIN public.modules_v2 mv
WHERE mc.slug = 'marketing-essentials'
  AND mv.slug = 'social-media'
ON CONFLICT DO NOTHING;

-- =============================================================
-- COMPLETED
-- =============================================================
