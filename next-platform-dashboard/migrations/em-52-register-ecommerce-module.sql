-- ============================================================================
-- Register E-Commerce Module in modules_v2
-- Phase EM-52: E-Commerce Module
-- 
-- Run this after running em-52-ecommerce-module-schema.sql
-- ============================================================================

-- Insert module registration
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
)
VALUES (
    'ecommerce',
    'E-Commerce Store',
    'Full-featured online store with product catalog, shopping cart, checkout, and payment processing.',
    'Complete e-commerce solution for selling products online. Supports both physical and digital products with variant management, inventory tracking, and multiple payment providers.

## Features
- Product catalog with categories
- Variant management (size, color, etc.)
- Shopping cart with persistence
- Checkout with multiple payment options
- Order management
- Discount codes and coupons
- Inventory tracking
- Sales analytics

## Payment Providers
- Paddle (Global)
- Flutterwave (Africa/Zambia)
- Pesapal (Africa)
- DPO Pay (Zambia)
- Manual payments

## Perfect For
- Online Stores
- Digital Product Sellers
- Service-based Businesses
- Subscription Products
- Local Businesses (Zambia focus)',
    '🛒',
    'ecommerce',
    ARRAY['ecommerce', 'store', 'products', 'shopping', 'cart', 'checkout', 'payments', 'orders'],
    'site',
    'monthly',
    4999, -- $49.99/month wholesale
    49990, -- $499.90/year wholesale
    7999, -- $79.99/month suggested retail
    79990, -- $799.90/year suggested retail
    'active',
    ARRAY[
        'Product catalog',
        'Category management',
        'Variant management',
        'Shopping cart',
        'Checkout flow',
        'Order management',
        'Discount codes',
        'Inventory tracking',
        'Sales analytics',
        'Multiple payment providers',
        'Embeddable storefront',
        'Tax calculation',
        'Shipping zones'
    ],
    ARRAY['site:dashboard:tab', 'dashboard:site:tab'],
    'DRAMAC',
    true,
    true, -- Featured
    true, -- Premium
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
            "enableGuestCheckout": {
                "type": "boolean",
                "title": "Enable Guest Checkout",
                "default": true
            },
            "lowStockThreshold": {
                "type": "number",
                "title": "Low Stock Alert Threshold",
                "default": 5
            }
        }
    }'::jsonb,
    '{
        "currency": "USD",
        "taxRate": 0,
        "enableGuestCheckout": true,
        "lowStockThreshold": 5
    }'::jsonb,
    '{
        "shortId": "ecommod01",
        "name": "E-Commerce Store",
        "version": "1.0.0",
        "description": "Complete e-commerce solution for selling products online",
        "author": {
            "name": "DRAMAC",
            "email": "support@dramac.app",
            "website": "https://dramac.app"
        },
        "category": "ecommerce",
        "tablePrefix": "mod_ecommod01_",
        "tables": [
            "mod_ecommod01_categories",
            "mod_ecommod01_products",
            "mod_ecommod01_product_categories",
            "mod_ecommod01_product_options",
            "mod_ecommod01_product_variants",
            "mod_ecommod01_discounts",
            "mod_ecommod01_carts",
            "mod_ecommod01_cart_items",
            "mod_ecommod01_orders",
            "mod_ecommod01_order_items",
            "mod_ecommod01_settings"
        ],
        "features": [
            "product_catalog",
            "categories",
            "variants",
            "inventory_tracking",
            "shopping_cart",
            "checkout",
            "order_management",
            "discounts",
            "taxes",
            "shipping_zones",
            "payment_paddle",
            "payment_flutterwave",
            "payment_pesapal",
            "payment_dpo"
        ],
        "permissions": [
            "ecommerce.products.read",
            "ecommerce.products.write",
            "ecommerce.products.delete",
            "ecommerce.categories.read",
            "ecommerce.categories.write",
            "ecommerce.orders.read",
            "ecommerce.orders.write",
            "ecommerce.orders.manage",
            "ecommerce.discounts.read",
            "ecommerce.discounts.write",
            "ecommerce.settings.read",
            "ecommerce.settings.write",
            "ecommerce.analytics.read",
            "ecommerce.inventory.read",
            "ecommerce.inventory.write"
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    long_description = EXCLUDED.long_description,
    manifest = EXCLUDED.manifest,
    features = EXCLUDED.features,
    updated_at = now();

-- Verify registration
SELECT 
    id,
    slug,
    name,
    status,
    category,
    wholesale_price_monthly
FROM modules_v2 
WHERE slug = 'ecommerce';
