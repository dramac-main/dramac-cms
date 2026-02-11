-- ============================================================================
-- LIVE CHAT MODULE — Register in Marketplace
-- Run in Supabase SQL Editor AFTER lc-01-chat-schema.sql
--
-- This registers the Live Chat module as FREE in the marketplace catalog.
-- Users can then discover and install it themselves via the marketplace UI.
-- ============================================================================

-- Register the module in modules_v2 (FREE pricing)
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

-- Verify registration
SELECT
  slug,
  name,
  pricing_type,
  status,
  is_featured,
  category
FROM modules_v2
WHERE slug = 'live-chat';
