-- =============================================================
-- Phase EM-52: Create Module Studio Sources for Booking & E-Commerce
-- =============================================================
-- Links marketplace modules (modules_v2) to Module Studio (module_source)
-- so they can be edited in the Module Studio interface
-- =============================================================

-- 1. Create module_source entry for BOOKING MODULE
INSERT INTO public.module_source (
  module_id,
  name,
  slug,
  description,
  icon,
  category,
  pricing_tier,
  render_code,
  settings_schema,
  api_routes,
  styles,
  default_settings,
  dependencies,
  status,
  latest_version,
  created_at,
  updated_at
) VALUES (
  'booking',
  'Booking & Scheduling',
  'booking',
  'Complete appointment scheduling and calendar management system',
  '📅',
  'business',
  'pro',
  '// Booking Module Component
import React from "react";

export default function BookingModule({ settings }) {
  return (
    <div className="booking-module">
      <h2>Booking & Scheduling</h2>
      <p>Appointment scheduling system</p>
      <div className="booking-calendar">
        {/* Calendar implementation */}
      </div>
    </div>
  );
}',
  '{
    "type": "object",
    "properties": {
      "timezone": {
        "type": "string",
        "title": "Timezone",
        "default": "America/New_York"
      },
      "bookingAdvanceDays": {
        "type": "number",
        "title": "Booking Advance Days",
        "description": "How many days in advance customers can book",
        "default": 30
      },
      "requireConfirmation": {
        "type": "boolean",
        "title": "Require Confirmation",
        "default": false
      }
    }
  }'::jsonb,
  '[]'::jsonb,
  '',
  '{
    "timezone": "America/New_York",
    "bookingAdvanceDays": 30,
    "requireConfirmation": false
  }'::jsonb,
  ARRAY[]::text[],
  'published',
  '1.0.0',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW()
RETURNING id;

-- 2. Create module_source entry for E-COMMERCE MODULE
INSERT INTO public.module_source (
  module_id,
  name,
  slug,
  description,
  icon,
  category,
  pricing_tier,
  render_code,
  settings_schema,
  api_routes,
  styles,
  default_settings,
  dependencies,
  status,
  latest_version,
  created_at,
  updated_at
) VALUES (
  'ecommerce',
  'E-Commerce Suite',
  'ecommerce',
  'Complete online store with product catalog, cart, and checkout',
  '🛒',
  'business',
  'enterprise',
  '// E-Commerce Module Component
import React from "react";

export default function EcommerceModule({ settings }) {
  return (
    <div className="ecommerce-module">
      <h2>E-Commerce Suite</h2>
      <p>Full-featured online store</p>
      <div className="product-grid">
        {/* Product catalog implementation */}
      </div>
    </div>
  );
}',
  '{
    "type": "object",
    "properties": {
      "currency": {
        "type": "string",
        "title": "Currency",
        "default": "USD"
      },
      "taxRate": {
        "type": "number",
        "title": "Tax Rate (%)",
        "default": 0
      },
      "enableInventory": {
        "type": "boolean",
        "title": "Enable Inventory Tracking",
        "default": true
      }
    }
  }'::jsonb,
  '[]'::jsonb,
  '',
  '{
    "currency": "USD",
    "taxRate": 0,
    "enableInventory": true
  }'::jsonb,
  ARRAY[]::text[],
  'published',
  '1.0.0',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW()
RETURNING id;

-- 3. Link modules_v2 to module_source using studio_module_id
UPDATE public.modules_v2 
SET studio_module_id = (
  SELECT id FROM public.module_source WHERE slug = 'booking' LIMIT 1
)
WHERE slug = 'booking';

UPDATE public.modules_v2 
SET studio_module_id = (
  SELECT id FROM public.module_source WHERE slug = 'ecommerce' LIMIT 1
)
WHERE slug = 'ecommerce';

-- 4. Verify the linkage
SELECT 
  m.slug,
  m.name,
  m.studio_module_id,
  ms.id as source_id,
  ms.status as source_status
FROM public.modules_v2 m
LEFT JOIN public.module_source ms ON m.studio_module_id = ms.id
WHERE m.slug IN ('booking', 'ecommerce')
ORDER BY m.slug;
