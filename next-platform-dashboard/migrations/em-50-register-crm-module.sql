-- ============================================================================
-- PHASE EM-50: Register CRM Module in modules_v2
-- ============================================================================
-- This migration registers the CRM module in the modules_v2 master registry
-- so it can be subscribed by agencies and installed on sites.
-- ============================================================================

-- Insert CRM module into modules_v2
INSERT INTO public.modules_v2 (
  name,
  slug,
  description,
  category,
  icon,
  pricing_type,
  wholesale_price_monthly,
  wholesale_price_yearly,
  suggested_retail_monthly,
  suggested_retail_yearly,
  current_version,
  features,
  documentation_url,
  support_url,
  status
) VALUES (
  'CRM',
  'crm',
  'Complete Customer Relationship Management solution with contact management, company tracking, deal pipelines, activity logging, and comprehensive reporting.',
  'sales',
  'users',
  'free',  -- Free during beta
  0,
  0,
  0,
  0,
  '1.0.0',
  ARRAY[
    'Contact Management',
    'Company Directory',
    'Deal Pipeline',
    'Activity Tracking',
    'Custom Fields',
    'Tags & Segmentation',
    'Pipeline Reports',
    'Email Integration',
    'Task Management',
    'Notes & History'
  ],
  'https://docs.dramac.dev/modules/crm',
  'https://support.dramac.dev',
  'published'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'published',
  current_version = EXCLUDED.current_version,
  updated_at = now();

-- Log the registration
DO $$
DECLARE
  module_id UUID;
BEGIN
  SELECT id INTO module_id FROM modules_v2 WHERE slug = 'crm';
  RAISE NOTICE 'CRM module registered with ID: %', module_id;
END $$;
