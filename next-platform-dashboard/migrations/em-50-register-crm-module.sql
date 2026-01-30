-- ============================================================================
-- PHASE EM-50: CRM Module - COMPLETE SETUP
-- ============================================================================
-- 
-- UNDERSTANDING THE MODULE SYSTEM:
-- ================================
-- 1. modules_v2         = Module catalog (like App Store listing)
-- 2. agency_module_subscriptions = Agency's purchased/subscribed modules
-- 3. site_module_installations   = Modules enabled for specific sites
--
-- NORMAL USER FLOW:
-- 1. Browse /marketplace → See CRM
-- 2. Click "Subscribe" → Creates agency_module_subscriptions record
-- 3. Go to Site > Modules tab → See CRM
-- 4. Toggle ON → Creates site_module_installations record
-- 5. CRM tab appears!
--
-- THIS SQL bypasses the UI and sets everything up directly.
-- ============================================================================

-- ============================================
-- STEP 1: Ensure CRM Module is in Catalog
-- ============================================
INSERT INTO modules_v2 (
  slug,
  name,
  description,
  category,
  install_level,
  pricing_type,
  wholesale_price_monthly,
  wholesale_price_yearly,
  current_version,
  status,
  is_featured
) VALUES (
  'crm',
  'CRM',
  'Customer Relationship Management - Contacts, Companies, Deals, Pipelines',
  'business',
  'site',
  'free',
  0,
  0,
  '1.0.0',
  'active',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  status = 'active',
  install_level = 'site',
  updated_at = NOW();

-- Get the CRM module ID
SELECT 'CRM MODULE ID' as step, id, slug, status FROM modules_v2 WHERE slug = 'crm';

-- ============================================
-- STEP 2: Subscribe ALL Agencies to CRM
-- (Normally done via POST /api/modules/subscribe)
-- ============================================
INSERT INTO agency_module_subscriptions (agency_id, module_id, status, billing_cycle)
SELECT 
  a.id,
  (SELECT id FROM modules_v2 WHERE slug = 'crm'),
  'active',
  'one_time'
FROM agencies a
WHERE NOT EXISTS (
  SELECT 1 
  FROM agency_module_subscriptions ams
  WHERE ams.agency_id = a.id 
    AND ams.module_id = (SELECT id FROM modules_v2 WHERE slug = 'crm')
);

-- Verify subscriptions
SELECT 
  'AGENCY SUBSCRIPTIONS' as step,
  a.name as agency_name,
  ams.status,
  ams.created_at
FROM agency_module_subscriptions ams
JOIN agencies a ON a.id = ams.agency_id
JOIN modules_v2 m ON m.id = ams.module_id
WHERE m.slug = 'crm';

-- ============================================
-- STEP 3: Enable CRM on ALL Sites
-- (Normally done via toggle in Site > Modules tab)
-- ============================================
INSERT INTO site_module_installations (
  site_id, 
  module_id, 
  agency_subscription_id, 
  is_enabled
)
SELECT 
  s.id,
  m.id,
  ams.id,
  true
FROM sites s
JOIN clients c ON c.id = s.client_id
JOIN agencies a ON a.id = c.agency_id
JOIN modules_v2 m ON m.slug = 'crm'
JOIN agency_module_subscriptions ams ON ams.agency_id = a.id AND ams.module_id = m.id
WHERE NOT EXISTS (
  SELECT 1 
  FROM site_module_installations smi
  WHERE smi.site_id = s.id 
    AND smi.module_id = m.id
);

-- ============================================
-- STEP 4: FINAL VERIFICATION
-- ============================================
SELECT 
  '✅ SETUP COMPLETE' as status,
  COUNT(*) as sites_with_crm_enabled
FROM site_module_installations smi
JOIN modules_v2 m ON m.id = smi.module_id
WHERE m.slug = 'crm' AND smi.is_enabled = true;

-- Show per-site details
SELECT 
  s.name as site_name,
  s.id as site_id,
  a.name as agency_name,
  CASE WHEN smi.is_enabled THEN '✅ CRM Enabled' ELSE '❌ CRM Disabled' END as status,
  '/dashboard/sites/' || s.id || '/crm-module' as crm_url
FROM sites s
JOIN clients c ON c.id = s.client_id
JOIN agencies a ON a.id = c.agency_id
JOIN modules_v2 m ON m.slug = 'crm'
LEFT JOIN site_module_installations smi ON smi.site_id = s.id AND smi.module_id = m.id
ORDER BY s.name;
