-- ============================================================================
-- LIVE CHAT MODULE — Seed into modules_v2 + Enable for Testing
-- Run in Supabase SQL Editor AFTER lc-01-chat-schema.sql
--
-- This registers the Live Chat module as FREE in the marketplace,
-- creates an agency subscription, and installs it on all agency sites.
-- ============================================================================

-- Step 1: Seed the module into modules_v2 (FREE pricing for development/testing)
INSERT INTO modules_v2 (
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
  current_version,
  status,
  is_featured,
  is_premium,
  author_name,
  author_verified,
  features,
  provided_hooks
) VALUES (
  'live-chat',
  'Live Chat',
  'Real-time customer messaging with WhatsApp, AI auto-responder, smart routing, and agent dashboard.',
  E'## Live Chat & Omnichannel Messaging\n\nIndustry-standard live chat rivaling Intercom, Zendesk, Tidio, and Crisp.\n\n### Key Features\n- 🗨️ Real-time embeddable chat widget\n- 📱 WhatsApp Business Cloud API integration\n- 🤖 AI-powered auto-responder & smart routing\n- 👥 Multi-agent dashboard with department routing\n- 📊 Comprehensive analytics & reporting\n- 💬 Canned responses & knowledge base\n- ⭐ Post-chat satisfaction ratings\n- 📎 File uploads & media sharing\n- ⏰ Business hours & offline forms\n- 🎨 Fully customizable widget appearance',
  '💬',
  'communication',
  ARRAY['chat', 'messaging', 'whatsapp', 'support', 'customer-service', 'live-chat', 'omnichannel'],
  'site',
  'free',    -- FREE for development/testing. Change to 'monthly' for production with pricing.
  0,         -- wholesale_price_monthly (0 = free)
  0,         -- wholesale_price_yearly (0 = free)
  0,         -- suggested_retail_monthly
  0,         -- suggested_retail_yearly
  '1.0.0',
  'active',
  TRUE,
  FALSE,     -- Not premium (free for now)
  'DRAMAC CMS',
  TRUE,
  ARRAY[
    'Real-time embeddable chat widget',
    'WhatsApp Business Cloud API',
    'AI-powered smart routing',
    'Multi-agent dashboard',
    'Department-based routing',
    'Canned responses library',
    'Knowledge base',
    'Post-chat satisfaction ratings',
    'File uploads & media sharing',
    'Business hours & offline forms',
    'Customizable widget appearance',
    'Comprehensive analytics'
  ],
  ARRAY[
    'site:dashboard:tab',
    'site:settings:section',
    'site:embed:widget'
  ]
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  pricing_type = EXCLUDED.pricing_type,
  wholesale_price_monthly = EXCLUDED.wholesale_price_monthly,
  wholesale_price_yearly = EXCLUDED.wholesale_price_yearly,
  suggested_retail_monthly = EXCLUDED.suggested_retail_monthly,
  suggested_retail_yearly = EXCLUDED.suggested_retail_yearly,
  current_version = EXCLUDED.current_version,
  status = EXCLUDED.status,
  is_featured = EXCLUDED.is_featured,
  is_premium = EXCLUDED.is_premium,
  features = EXCLUDED.features,
  provided_hooks = EXCLUDED.provided_hooks,
  updated_at = now();

-- Step 2: Auto-subscribe ALL agencies to the live-chat module (free)
-- This creates an active subscription for every agency
INSERT INTO agency_module_subscriptions (
  id,
  agency_id,
  module_id,
  status,
  billing_cycle,
  current_period_start,
  current_period_end
)
SELECT
  gen_random_uuid(),
  a.id,
  m.id,
  'active',
  'monthly',
  now(),
  now() + INTERVAL '100 years'    -- Never expires (free module)
FROM agencies a
CROSS JOIN modules_v2 m
WHERE m.slug = 'live-chat'
ON CONFLICT (agency_id, module_id) DO UPDATE SET
  status = 'active',
  current_period_end = now() + INTERVAL '100 years',
  updated_at = now();

-- Step 3: Auto-install on ALL sites for every agency
-- This enables the module on every existing site
INSERT INTO site_module_installations (
  id,
  site_id,
  module_id,
  is_enabled,
  installed_at,
  enabled_at,
  agency_subscription_id
)
SELECT
  gen_random_uuid(),
  s.id,
  m.id,
  TRUE,
  now(),
  now(),
  ams.id
FROM sites s
JOIN clients c ON s.client_id = c.id
JOIN agency_module_subscriptions ams ON ams.agency_id = c.agency_id
JOIN modules_v2 m ON m.id = ams.module_id AND m.slug = 'live-chat'
ON CONFLICT (site_id, module_id) DO UPDATE SET
  is_enabled = TRUE,
  enabled_at = now();

-- Verify
SELECT
  'Module registered' AS step,
  m.slug,
  m.name,
  m.pricing_type,
  m.status
FROM modules_v2 m WHERE m.slug = 'live-chat'

UNION ALL

SELECT
  'Agency subscriptions' AS step,
  m.slug,
  a.status,
  CAST(COUNT(*) AS TEXT),
  ''
FROM agency_module_subscriptions a
JOIN modules_v2 m ON m.id = a.module_id AND m.slug = 'live-chat'
GROUP BY m.slug, a.status

UNION ALL

SELECT
  'Site installations' AS step,
  m.slug,
  CAST(smi.is_enabled AS TEXT),
  CAST(COUNT(*) AS TEXT),
  ''
FROM site_module_installations smi
JOIN modules_v2 m ON m.id = smi.module_id AND m.slug = 'live-chat'
GROUP BY m.slug, smi.is_enabled;
