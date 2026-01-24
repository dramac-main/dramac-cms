-- ============================================================================
-- Subscribe Agency/Site to E-Commerce Module
-- Phase EM-52: E-Commerce Module
-- 
-- Use this to enable e-commerce for a specific agency or site
-- Replace the placeholder values with actual IDs
-- ============================================================================

-- Variables (replace these with your actual values)
-- @agency_id: Your agency UUID
-- @site_id: Your site UUID (optional - for site-level subscription)

-- ============================================================================
-- OPTION 1: Subscribe at Agency Level (applies to all sites)
-- ============================================================================

-- First, get the module ID
-- SELECT id FROM modules_v2 WHERE short_id = 'ecommod01';

-- Then subscribe the agency
INSERT INTO module_subscriptions (
    id,
    agency_id,
    module_id,
    status,
    tier,
    settings,
    started_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'YOUR_AGENCY_ID_HERE'::uuid,  -- Replace with actual agency ID
    m.id,
    'active',
    'standard',
    '{
        "features_enabled": [
            "product_catalog",
            "categories",
            "variants",
            "inventory_tracking",
            "shopping_cart",
            "checkout",
            "order_management",
            "discounts",
            "payment_paddle",
            "payment_flutterwave"
        ],
        "limits": {
            "products": 1000,
            "orders_per_month": 5000,
            "variants_per_product": 50
        }
    }'::jsonb,
    now(),
    now(),
    now()
FROM modules_v2 m
WHERE m.short_id = 'ecommod01'
ON CONFLICT (agency_id, module_id) DO UPDATE SET
    status = 'active',
    settings = EXCLUDED.settings,
    updated_at = now();

-- ============================================================================
-- OPTION 2: Initialize E-Commerce Settings for a Site
-- ============================================================================

-- After subscription, initialize e-commerce settings for a specific site
INSERT INTO mod_ecommod01_settings (
    id,
    site_id,
    store_name,
    currency,
    tax_rate,
    enable_inventory_tracking,
    low_stock_threshold,
    enable_guest_checkout,
    enable_coupons,
    -- Payment providers (configure as needed)
    paddle_config,
    flutterwave_config,
    pesapal_config,
    dpo_config,
    -- Other settings
    metadata,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'YOUR_SITE_ID_HERE'::uuid,  -- Replace with actual site ID
    'My Store',
    'USD',  -- Or 'ZMW' for Zambian Kwacha
    0,  -- Tax rate percentage (e.g., 16 for 16%)
    true,
    5,  -- Low stock alert threshold
    true,
    true,
    -- Paddle (Global payments)
    '{
        "enabled": false,
        "vendor_id": null,
        "api_key": null,
        "environment": "sandbox"
    }'::jsonb,
    -- Flutterwave (Africa/Zambia - Primary)
    '{
        "enabled": false,
        "public_key": null,
        "secret_key": null,
        "encryption_key": null,
        "environment": "sandbox"
    }'::jsonb,
    -- Pesapal (Africa)
    '{
        "enabled": false,
        "consumer_key": null,
        "consumer_secret": null,
        "environment": "sandbox"
    }'::jsonb,
    -- DPO Pay (Zambia backup)
    '{
        "enabled": false,
        "company_token": null,
        "service_type": null,
        "environment": "sandbox"
    }'::jsonb,
    '{}'::jsonb,
    now(),
    now()
)
ON CONFLICT (site_id) DO UPDATE SET
    updated_at = now();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check module is registered
SELECT 
    short_id, 
    name, 
    version, 
    status 
FROM modules_v2 
WHERE short_id = 'ecommod01';

-- Check subscription (replace agency_id)
-- SELECT 
--     ms.id,
--     ms.status,
--     ms.tier,
--     m.name as module_name
-- FROM module_subscriptions ms
-- JOIN modules_v2 m ON m.id = ms.module_id
-- WHERE ms.agency_id = 'YOUR_AGENCY_ID_HERE'
-- AND m.short_id = 'ecommod01';

-- Check site settings (replace site_id)
-- SELECT 
--     store_name,
--     currency,
--     enable_inventory_tracking,
--     flutterwave_config->>'enabled' as flutterwave_enabled
-- FROM mod_ecommod01_settings
-- WHERE site_id = 'YOUR_SITE_ID_HERE';
