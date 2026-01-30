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
  short_id,
  description,
  category,
  module_type,
  icon,
  price_monthly,
  price_yearly,
  is_active,
  is_published,
  features,
  requirements,
  documentation_url,
  support_url,
  version
) VALUES (
  'CRM',
  'crm',
  'crmmod01',
  'Complete Customer Relationship Management solution with contact management, company tracking, deal pipelines, activity logging, and comprehensive reporting.',
  'sales',
  'enterprise',
  'users',
  0,  -- Free during beta
  0,
  true,
  true,
  jsonb_build_array(
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
  ),
  jsonb_build_object(
    'minPlatformVersion', '1.0.0',
    'dependencies', jsonb_build_array()
  ),
  'https://docs.dramac.dev/modules/crm',
  'https://support.dramac.dev',
  '1.0.0'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  is_published = true,
  version = EXCLUDED.version,
  updated_at = now();

-- Log the registration
DO $$
DECLARE
  module_id UUID;
BEGIN
  SELECT id INTO module_id FROM modules_v2 WHERE slug = 'crm';
  RAISE NOTICE 'CRM module registered with ID: %', module_id;
END $$;
