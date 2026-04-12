-- =============================================================
-- Phase EM-58: Register Marketing Module in modules_v2
-- =============================================================
-- This inserts/updates the marketing module in the database so it can be
-- subscribed to by agencies and installed on sites.
--
-- Marketing is a CORE module (auto-installed on every new site via
-- CORE_MODULE_SLUGS in sites.ts). It's free for all agencies.
-- =============================================================

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
  'marketing',
  'Marketing Suite',
  'Email campaigns, sequences, funnels, and subscriber management for your site.',
  'Run professional email marketing campaigns, build automated sequences, and track funnels — all from your dashboard.

## Features
- Email campaign builder with drag-and-drop templates
- Mailing lists and subscriber management
- Drip sequences with conditional logic
- Funnel tracking and conversion analytics
- Audience segmentation and tagging
- SMS & WhatsApp campaigns via Twilio & Meta
- AI-powered content generation and audience targeting
- Social media post scheduling and content calendar
- Landing page builder with opt-in forms
- Blog marketing enhancement with CTA blocks and SEO scoring
- UTM tracking and attribution
- Integration with CRM contacts and automation workflows

## Perfect For
- Email Newsletter Campaigns
- Lead Nurturing Sequences
- Subscriber Growth Funnels
- Social Media Scheduling
- Multi-Channel Outreach (Email + SMS + WhatsApp)
- Landing Pages with Opt-In Forms',
  '📧',
  'marketing',
  ARRAY['marketing', 'email', 'campaigns', 'sequences', 'funnels', 'subscribers', 'newsletters', 'sms', 'whatsapp', 'social-media', 'landing-pages'],
  'site',  -- Site-level installation
  'free',  -- Free for all agencies (core module)
  0, 0, 0, 0,
  'active',
  ARRAY[
    'Email campaigns',
    'Template library',
    'Mailing lists',
    'Subscriber management',
    'Drip sequences',
    'Funnel tracking',
    'Audience segmentation',
    'SMS campaigns (Twilio)',
    'WhatsApp campaigns (Meta)',
    'AI content generation',
    'AI audience targeting',
    'Social media scheduling',
    'Content calendar',
    'Landing page builder',
    'Opt-in form builder',
    'Blog CTA blocks',
    'SEO scoring',
    'UTM attribution',
    'Engagement scoring',
    'Bounce & complaint handling',
    'CRM integration',
    'Campaign analytics'
  ],
  ARRAY['site:dashboard:tab', 'dashboard:site:tab'],
  'DRAMAC',
  true,
  true,   -- Featured in marketplace
  false,  -- Not premium (free core module)
  '{
    "type": "object",
    "properties": {
      "sendingQuotaDaily": {
        "type": "number",
        "title": "Daily Sending Quota",
        "description": "Maximum emails per day",
        "default": 1000
      },
      "sendingQuotaMonthly": {
        "type": "number",
        "title": "Monthly Sending Quota",
        "description": "Maximum emails per month",
        "default": 25000
      },
      "doubleOptInEnabled": {
        "type": "boolean",
        "title": "Double Opt-In",
        "description": "Require email confirmation for new subscribers",
        "default": false
      },
      "autoCleanBounces": {
        "type": "boolean",
        "title": "Auto-Clean Bounces",
        "description": "Automatically remove hard-bounced addresses",
        "default": true
      },
      "autoCleanComplaints": {
        "type": "boolean",
        "title": "Auto-Clean Complaints",
        "description": "Automatically unsubscribe addresses that mark as spam",
        "default": true
      },
      "gdprEnabled": {
        "type": "boolean",
        "title": "GDPR Mode",
        "description": "Enable GDPR compliance features",
        "default": false
      },
      "timezone": {
        "type": "string",
        "title": "Timezone",
        "description": "Default timezone for scheduled sends",
        "default": "Africa/Lusaka"
      }
    }
  }',
  '{
    "sendingQuotaDaily": 1000,
    "sendingQuotaMonthly": 25000,
    "doubleOptInEnabled": false,
    "autoCleanBounces": true,
    "autoCleanComplaints": true,
    "gdprEnabled": false,
    "timezone": "Africa/Lusaka"
  }',
  '{
    "id": "marketing",
    "name": "Marketing Suite",
    "version": "1.0.0",
    "description": "Email campaigns, sequences, funnels, and subscriber management",
    "author": "DRAMAC",
    "category": "marketing",
    "icon": "📧",
    "routes": [
      { "path": "/dashboard/[siteId]/marketing", "name": "Hub" },
      { "path": "/dashboard/[siteId]/marketing/campaigns", "name": "Campaigns" },
      { "path": "/dashboard/[siteId]/marketing/subscribers", "name": "Subscribers" },
      { "path": "/dashboard/[siteId]/marketing/sequences", "name": "Sequences" },
      { "path": "/dashboard/[siteId]/marketing/forms", "name": "Forms" },
      { "path": "/dashboard/[siteId]/marketing/landing-pages", "name": "Landing Pages" },
      { "path": "/dashboard/[siteId]/marketing/social", "name": "Social Media" },
      { "path": "/dashboard/[siteId]/marketing/calendar", "name": "Calendar" },
      { "path": "/dashboard/[siteId]/marketing/templates", "name": "Templates" }
    ],
    "hooks": ["site:dashboard:tab", "dashboard:site:tab"],
    "dependencies": [],
    "settings_schema": {
      "sendingQuotaDaily": { "type": "number", "default": 1000 },
      "sendingQuotaMonthly": { "type": "number", "default": 25000 },
      "doubleOptInEnabled": { "type": "boolean", "default": false },
      "autoCleanBounces": { "type": "boolean", "default": true }
    }
  }'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  install_level = EXCLUDED.install_level,
  pricing_type = EXCLUDED.pricing_type,
  wholesale_price_monthly = EXCLUDED.wholesale_price_monthly,
  wholesale_price_yearly = EXCLUDED.wholesale_price_yearly,
  suggested_retail_monthly = EXCLUDED.suggested_retail_monthly,
  suggested_retail_yearly = EXCLUDED.suggested_retail_yearly,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  provided_hooks = EXCLUDED.provided_hooks,
  is_featured = EXCLUDED.is_featured,
  is_premium = EXCLUDED.is_premium,
  settings_schema = EXCLUDED.settings_schema,
  default_settings = EXCLUDED.default_settings,
  manifest = EXCLUDED.manifest,
  updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Marketing module registered in modules_v2 marketplace';
  RAISE NOTICE 'Marketing is a CORE module — auto-installed on every new site';
  RAISE NOTICE 'Module dashboard available at /dashboard/[siteId]/marketing';
END $$;
