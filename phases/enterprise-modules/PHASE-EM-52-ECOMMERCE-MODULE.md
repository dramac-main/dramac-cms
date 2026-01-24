# Phase EM-52: E-Commerce Module

> **Priority**: 🔴 HIGH
> **Estimated Time**: 20-25 hours
> **Prerequisites**: EM-01, EM-05, EM-40
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a **complete e-commerce module** for online stores:
1. Product catalog with variants
2. Shopping cart system
3. Checkout flow with payment integration
4. Order management
5. Inventory tracking
6. Embeddable storefront widget

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     E-COMMERCE MODULE                             │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│   CATALOG    │    CART      │   ORDERS     │    PAYMENTS         │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Products     │ Cart Items   │ Order List   │ Paddle (Global)     │
│ Categories   │ Guest Carts  │ Order Detail │ Flutterwave (ZM)    │
│ Variants     │ User Carts   │ Fulfillment  │ Pesapal (Africa)    │
│ Pricing      │ Discounts    │ Refunds      │ DPO Pay (Backup)    │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

### Module Structure (Following CRM/Booking Pattern)

```
src/modules/ecommerce/
├── index.ts              # Main exports
├── manifest.ts           # Module manifest
├── actions/
│   └── ecommerce-actions.ts  # Server actions (NOT classes)
├── components/
│   ├── index.ts
│   ├── products/
│   ├── cart/
│   ├── orders/
│   └── settings/
├── context/
│   └── ecommerce-context.tsx  # Provider pattern
└── types/
    └── ecommerce-types.ts
```

### Key Conventions (IMPORTANT!)

- **Short ID**: `ecommod01` (8 characters, matching CRM/Booking pattern)
- **Table Prefix**: `mod_ecommod01_` (NOT `mod_ecom_`)
- **Architecture**: Server Actions with `'use server'` directive (NOT classes)
- **Imports**: `createClient` from `@/lib/supabase/server` (NOT `@supabase/supabase-js`)
- **File Location**: `src/modules/ecommerce/` (NOT `src/lib/modules/ecommerce/`)

---

## 📋 Implementation Tasks

### Task 1: Database Schema (3 hours)

```sql
-- migrations/em-52-ecommerce-schema.sql

-- ==========================================
-- E-COMMERCE MODULE DATABASE SCHEMA
-- Uses mod_ecommod01_ prefix per EM-05 conventions
-- Short ID: ecommod01 (8 chars to match CRM/Booking pattern)
-- ==========================================

-- Product Categories
CREATE TABLE mod_ecommod01_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES mod_ecommod01_categories(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  seo_title TEXT,
  seo_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Products
CREATE TABLE mod_ecommod01_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- Original price for sale display
  cost_price DECIMAL(10,2),       -- For profit calculation
  
  -- Tax
  tax_class TEXT DEFAULT 'standard',
  is_taxable BOOLEAN DEFAULT true,
  
  -- Inventory
  sku TEXT,
  barcode TEXT,
  track_inventory BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Physical
  weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'kg',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  
  -- Media (JSON array of image URLs)
  images JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Product to Category mapping
CREATE TABLE mod_ecommod01_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES mod_ecommod01_categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(product_id, category_id)
);

-- Product Options (Size, Color, etc.)
CREATE TABLE mod_ecommod01_product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,           -- "Size", "Color"
  values JSONB NOT NULL,        -- ["S", "M", "L", "XL"]
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(product_id, name)
);

-- Product Variants (specific combinations)
CREATE TABLE mod_ecommod01_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  
  -- Variant options (e.g., {"size": "L", "color": "Red"})
  options JSONB NOT NULL DEFAULT '{}',
  
  -- Override pricing
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  
  -- Inventory
  sku TEXT,
  barcode TEXT,
  quantity INTEGER DEFAULT 0,
  
  -- Image specific to this variant
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Codes
CREATE TABLE mod_ecommod01_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,
  description TEXT,
  
  -- Discount type
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value DECIMAL(10,2) NOT NULL,
  
  -- Conditions
  minimum_order_amount DECIMAL(10,2),
  minimum_quantity INTEGER,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'categories')),
  applies_to_ids UUID[],
  
  -- Limits
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  once_per_customer BOOLEAN DEFAULT false,
  
  -- Validity
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, code)
);

-- Shopping Carts
CREATE TABLE mod_ecommod01_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Can be guest or logged in user
  user_id UUID REFERENCES users(id),
  session_id TEXT, -- For guest carts
  
  -- Applied discount
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Currency
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Cart Items
CREATE TABLE mod_ecommod01_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES mod_ecommod01_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  
  -- Custom options (if any)
  custom_options JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cart_id, product_id, variant_id)
);

-- Orders
CREATE TABLE mod_ecommod01_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Order number (human readable)
  order_number TEXT NOT NULL,
  
  -- Customer
  customer_id UUID REFERENCES users(id),
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Addresses (stored as JSON for immutability)
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'partially_refunded', 'refunded', 'failed'
  )),
  payment_method TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('paddle', 'flutterwave', 'pesapal', 'dpo', 'manual')),
  payment_transaction_id TEXT, -- Provider-specific transaction ID
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partial', 'fulfilled'
  )),
  
  -- Shipping
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, order_number)
);

-- Order Items
CREATE TABLE mod_ecommod01_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES mod_ecommod01_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot of product at time of order
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_options JSONB DEFAULT '{}',
  image_url TEXT,
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Fulfillment
  fulfilled_quantity INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Settings
CREATE TABLE mod_ecommod01_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Store info
  store_name TEXT,
  store_email TEXT,
  store_phone TEXT,
  store_address JSONB,
  
  -- Currency & Tax
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_included_in_price BOOLEAN DEFAULT false,
  
  -- Shipping
  shipping_zones JSONB DEFAULT '[]',
  free_shipping_threshold DECIMAL(10,2),
  
  -- Checkout
  enable_guest_checkout BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT false,
  
  -- Payment providers (encrypted)
  paddle_config JSONB,      -- For global customers (SaaS billing system)
  flutterwave_config JSONB, -- Primary African e-commerce (Zambia + 30+ countries)
  pesapal_config JSONB,     -- Secondary African markets (cards + mobile money)
  dpo_config JSONB,         -- Zambian local backup (optional)
  
  -- Notifications
  order_notification_email TEXT,
  send_order_confirmation BOOLEAN DEFAULT true,
  
  -- Inventory
  continue_selling_when_out_of_stock BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id)
);

-- Indexes for performance
CREATE INDEX idx_products_site ON mod_ecommod01_products(site_id);
CREATE INDEX idx_products_status ON mod_ecommod01_products(site_id, status);
CREATE INDEX idx_products_featured ON mod_ecommod01_products(site_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_orders_site ON mod_ecommod01_orders(site_id);
CREATE INDEX idx_orders_status ON mod_ecommod01_orders(site_id, status);
CREATE INDEX idx_orders_customer ON mod_ecommod01_orders(customer_id);
CREATE INDEX idx_carts_session ON mod_ecommod01_carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_user ON mod_ecommod01_carts(user_id) WHERE user_id IS NOT NULL;

-- RLS Policies
ALTER TABLE mod_ecommod01_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_isolation" ON mod_ecommod01_categories
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecommod01_products
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecommod01_orders
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecommod01_carts
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecommod01_settings
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);

-- Order number sequence function
CREATE OR REPLACE FUNCTION mod_ecommod01_generate_order_number(p_site_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_prefix TEXT;
BEGIN
  -- Get current count for site
  SELECT COUNT(*) + 1 INTO v_count
  FROM mod_ecommod01_orders
  WHERE site_id = p_site_id;
  
  -- Generate order number: ORD-20240115-00001
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
```

---

### Task 2: Types Definition (1 hour)

> **IMPORTANT**: Types go in `src/modules/ecommerce/types/ecommerce-types.ts`

```typescript
// src/modules/ecommerce/types/ecommerce-types.ts

/**
 * E-Commerce Module TypeScript Types
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * These types define the data structures for all E-Commerce entities
 * Following CRM/Booking module pattern exactly
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type ProductStatus = 'draft' | 'active' | 'archived'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed'
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled'
export type CartStatus = 'active' | 'abandoned' | 'converted'
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping'

// ============================================================================
// CATEGORIES
// ============================================================================

export interface Category {
  id: string
  site_id: string
  agency_id: string
  parent_id: string | null
  
  name: string
  slug: string
  description: string | null
  image_url: string | null
  
  sort_order: number
  is_active: boolean
  
  seo_title: string | null
  seo_description: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  children?: Category[]
  products?: Product[]
}

export type CategoryInput = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'children' | 'products'>
export type CategoryUpdate = Partial<CategoryInput>

// ============================================================================
// PRODUCTS
// ============================================================================

export interface Product {
  id: string
  site_id: string
  agency_id: string
  
  // Basic Info
  name: string
  slug: string
  description: string | null
  short_description: string | null
  
  // Pricing
  base_price: number
  compare_at_price: number | null
  cost_price: number | null
  
  // Tax
  tax_class: string
  is_taxable: boolean
  
  // Inventory
  sku: string | null
  barcode: string | null
  track_inventory: boolean
  quantity: number
  low_stock_threshold: number
  
  // Physical
  weight: number | null
  weight_unit: string
  
  // Status
  status: ProductStatus
  is_featured: boolean
  
  // SEO
  seo_title: string | null
  seo_description: string | null
  
  // Media
  images: string[]
  
  // Metadata
  metadata: Record<string, unknown>
  
  // Audit
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  categories?: Category[]
  variants?: ProductVariant[]
  options?: ProductOption[]
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'categories' | 'variants' | 'options'>
export type ProductUpdate = Partial<ProductInput>

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

export interface ProductVariant {
  id: string
  product_id: string
  
  options: Record<string, string>
  
  price: number | null
  compare_at_price: number | null
  
  sku: string | null
  barcode: string | null
  quantity: number
  
  image_url: string | null
  
  is_active: boolean
  
  created_at: string
}

export type ProductVariantInput = Omit<ProductVariant, 'id' | 'created_at'>
export type ProductVariantUpdate = Partial<ProductVariantInput>

// ============================================================================
// PRODUCT OPTIONS
// ============================================================================

export interface ProductOption {
  id: string
  product_id: string
  
  name: string
  values: string[]
  sort_order: number
}

// ============================================================================
// CART
// ============================================================================

export interface Cart {
  id: string
  site_id: string
  user_id: string | null
  session_id: string | null
  
  discount_code: string | null
  discount_amount: number
  currency: string
  status: CartStatus
  
  created_at: string
  updated_at: string
  expires_at: string
  
  // Relations
  items: CartItem[]
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  
  quantity: number
  unit_price: number
  custom_options: Record<string, unknown>
  
  created_at: string
  
  // Populated fields
  product?: Product
  variant?: ProductVariant
}

// ============================================================================
// ORDERS
// ============================================================================

export interface Order {
  id: string
  site_id: string
  agency_id: string
  
  order_number: string
  
  // Customer
  customer_id: string | null
  customer_email: string
  customer_phone: string | null
  
  // Addresses
  shipping_address: Address
  billing_address: Address
  
  // Amounts
  subtotal: number
  discount_amount: number
  discount_code: string | null
  shipping_amount: number
  tax_amount: number
  total: number
  currency: string
  
  // Status
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string | null
  payment_intent_id: string | null
  
  // Fulfillment
  fulfillment_status: FulfillmentStatus
  shipping_method: string | null
  tracking_number: string | null
  tracking_url: string | null
  shipped_at: string | null
  delivered_at: string | null
  
  // Notes
  customer_notes: string | null
  internal_notes: string | null
  
  // Metadata
  metadata: Record<string, unknown>
  
  created_at: string
  updated_at: string
  
  // Relations
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  
  product_name: string
  product_sku: string | null
  variant_options: Record<string, string>
  image_url: string | null
  
  quantity: number
  unit_price: number
  total_price: number
  
  fulfilled_quantity: number
  
  created_at: string
}

export interface Address {
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

// ============================================================================
// DISCOUNTS
// ============================================================================

export interface Discount {
  id: string
  site_id: string
  agency_id: string
  
  code: string
  description: string | null
  
  type: DiscountType
  value: number
  
  minimum_order_amount: number | null
  minimum_quantity: number | null
  applies_to: 'all' | 'products' | 'categories'
  applies_to_ids: string[]
  
  usage_limit: number | null
  usage_count: number
  once_per_customer: boolean
  
  starts_at: string
  ends_at: string | null
  is_active: boolean
  
  created_at: string
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface EcommerceSettings {
  id: string
  site_id: string
  agency_id: string
  
  store_name: string | null
  store_email: string | null
  store_phone: string | null
  store_address: Address | null
  
  currency: string
  tax_rate: number
  tax_included_in_price: boolean
  
  shipping_zones: ShippingZone[]
  free_shipping_threshold: number | null
  
  enable_guest_checkout: boolean
  require_phone: boolean
  
  paddle_config: PaddleConfig | null        // Global SaaS/subscription payments
  flutterwave_config: FlutterwaveConfig | null // Primary African e-commerce (Zambia)
  pesapal_config: PesapalConfig | null      // Secondary African option
  dpo_config: DpoConfig | null              // Zambian local backup
  
  order_notification_email: string | null
  send_order_confirmation: boolean
  
  continue_selling_when_out_of_stock: boolean
  
  created_at: string
  updated_at: string
}

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  rates: ShippingRate[]
}

export interface ShippingRate {
  id: string
  name: string
  price: number
  min_order_amount?: number
  max_order_amount?: number
}

export interface PaddleConfig {
  vendor_id: string
  api_key: string  // stored server-side only
  public_key: string
  webhook_secret?: string
  environment: 'sandbox' | 'production'
}

export interface FlutterwaveConfig {
  public_key: string
  secret_key: string  // stored server-side only
  encryption_key: string  // stored server-side only
  webhook_secret_hash: string  // stored server-side only
  environment: 'test' | 'live'
}

export interface PesapalConfig {
  consumer_key: string
  consumer_secret: string  // stored server-side only
  callback_url: string
  environment: 'demo' | 'live'
}

export interface DpoConfig {
  company_token: string
  service_type: string
  callback_url: string
  environment: 'test' | 'live'
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export interface ProductFilters {
  category?: string
  status?: ProductStatus
  search?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

export interface OrderFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  fulfillment_status?: FulfillmentStatus
  search?: string
  date_from?: string
  date_to?: string
  customer_id?: string
}
```

---

### Task 3: Server Actions (4 hours)

> **CRITICAL**: Use server actions pattern, NOT class-based services!
> File location: `src/modules/ecommerce/actions/ecommerce-actions.ts`

```typescript
// src/modules/ecommerce/actions/ecommerce-actions.ts

/**
 * E-Commerce Module Server Actions
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Server-side actions for CRUD operations on E-Commerce entities
 * Uses schema isolation per EM-05 naming conventions
 * 
 * FOLLOWS CRM/BOOKING PATTERN EXACTLY
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Product, ProductInput, ProductUpdate,
  Category, CategoryInput, CategoryUpdate,
  ProductVariant, ProductVariantInput, ProductVariantUpdate,
  Cart, CartItem,
  Order, OrderItem,
  Discount,
  EcommerceSettings,
  ProductFilters, OrderFilters
} from '../types/ecommerce-types'

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

// E-Commerce Module ID - 8 characters to match CRM/Booking pattern
const ECOMMERCE_SHORT_ID = 'ecommod01'
const TABLE_PREFIX = `mod_${ECOMMERCE_SHORT_ID}`

// Helper to get untyped Supabase client for dynamic module tables
async function getModuleClient() {
  const supabase = await createClient()
  // Use 'as any' to bypass TypeScript's strict table type checking
  // Module tables are dynamically created and not in the generated types
  return supabase as any
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(siteId: string): Promise<Category[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error(error.message)
  }
  
  return (data || []) as Category[]
}

export async function getCategory(siteId: string, id: string): Promise<Category | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Category
}

export async function createCategory(siteId: string, agencyId: string, input: Partial<CategoryInput>): Promise<Category> {
  const supabase = await getModuleClient()
  
  const slug = input.slug || generateSlug(input.name!)
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .insert({
      site_id: siteId,
      agency_id: agencyId,
      name: input.name,
      slug,
      description: input.description || null,
      image_url: input.image_url || null,
      parent_id: input.parent_id || null,
      sort_order: input.sort_order || 0,
      is_active: input.is_active ?? true,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Category
}

export async function updateCategory(siteId: string, id: string, input: CategoryUpdate): Promise<Category> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Category
}

export async function deleteCategory(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getProducts(
  siteId: string, 
  filters: ProductFilters = {},
  page = 1,
  limit = 20
): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
  
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.featured) {
    query = query.eq('is_featured', true)
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('base_price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('base_price', filters.maxPrice)
  }
  if (filters.inStock) {
    query = query.gt('quantity', 0)
  }
  
  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1).order('created_at', { ascending: false })
  
  const { data, count, error } = await query
  
  if (error) {
    console.error('Error fetching products:', error)
    throw new Error(error.message)
  }
  
  return {
    products: (data || []) as Product[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getProduct(siteId: string, id: string): Promise<Product | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select(`
      *,
      variants:${TABLE_PREFIX}_product_variants(*),
      options:${TABLE_PREFIX}_product_options(*)
    `)
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Product
}

export async function getProductBySlug(siteId: string, slug: string): Promise<Product | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select(`
      *,
      variants:${TABLE_PREFIX}_product_variants(*),
      options:${TABLE_PREFIX}_product_options(*)
    `)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Product
}

export async function createProduct(siteId: string, agencyId: string, input: Partial<ProductInput>): Promise<Product> {
  const supabase = await getModuleClient()
  
  const slug = input.slug || generateSlug(input.name!)
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .insert({
      site_id: siteId,
      agency_id: agencyId,
      name: input.name,
      slug,
      description: input.description || null,
      short_description: input.short_description || null,
      base_price: input.base_price || 0,
      compare_at_price: input.compare_at_price || null,
      cost_price: input.cost_price || null,
      tax_class: input.tax_class || 'standard',
      is_taxable: input.is_taxable ?? true,
      sku: input.sku || null,
      barcode: input.barcode || null,
      track_inventory: input.track_inventory ?? true,
      quantity: input.quantity || 0,
      low_stock_threshold: input.low_stock_threshold || 5,
      weight: input.weight || null,
      weight_unit: input.weight_unit || 'kg',
      status: input.status || 'draft',
      is_featured: input.is_featured || false,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
      images: input.images || [],
      metadata: input.metadata || {},
      created_by: input.created_by || null
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Product
}

export async function updateProduct(siteId: string, id: string, input: ProductUpdate): Promise<Product> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Product
}

export async function deleteProduct(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_variants`)
    .select('*')
    .eq('product_id', productId)
  
  if (error) throw new Error(error.message)
  return (data || []) as ProductVariant[]
}

export async function createProductVariant(productId: string, input: Partial<ProductVariantInput>): Promise<ProductVariant> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_variants`)
    .insert({
      product_id: productId,
      options: input.options || {},
      price: input.price || null,
      compare_at_price: input.compare_at_price || null,
      sku: input.sku || null,
      barcode: input.barcode || null,
      quantity: input.quantity || 0,
      image_url: input.image_url || null,
      is_active: input.is_active ?? true
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as ProductVariant
}

export async function updateProductVariant(variantId: string, input: ProductVariantUpdate): Promise<ProductVariant> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_variants`)
    .update(input)
    .eq('id', variantId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as ProductVariant
}

export async function deleteProductVariant(variantId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_product_variants`)
    .delete()
    .eq('id', variantId)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// PRODUCT CATEGORIES ASSIGNMENT
// ============================================================================

export async function setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
  const supabase = await getModuleClient()
  
  // Delete existing assignments
  await supabase
    .from(`${TABLE_PREFIX}_product_categories`)
    .delete()
    .eq('product_id', productId)
  
  // Insert new assignments
  if (categoryIds.length > 0) {
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_product_categories`)
      .insert(
        categoryIds.map((catId, index) => ({
          product_id: productId,
          category_id: catId,
          sort_order: index
        }))
      )
    
    if (error) throw new Error(error.message)
  }
}

// ============================================================================
// CART
// ============================================================================

export async function getOrCreateCart(siteId: string, userId?: string, sessionId?: string): Promise<Cart> {
  let cart = await findCart(siteId, userId, sessionId)
  
  if (!cart) {
    cart = await createCart(siteId, userId, sessionId)
  }
  
  return cart
}

export async function findCart(siteId: string, userId?: string, sessionId?: string): Promise<Cart | null> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_carts`)
    .select(`
      *,
      items:${TABLE_PREFIX}_cart_items(
        *,
        product:${TABLE_PREFIX}_products(id, name, slug, images, status, quantity),
        variant:${TABLE_PREFIX}_product_variants(id, options, quantity, image_url)
      )
    `)
    .eq('site_id', siteId)
    .eq('status', 'active')
  
  if (userId) {
    query = query.eq('user_id', userId)
  } else if (sessionId) {
    query = query.eq('session_id', sessionId)
  } else {
    return null
  }
  
  const { data, error } = await query.single()
  
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data as Cart | null
}

export async function createCart(siteId: string, userId?: string, sessionId?: string): Promise<Cart> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .insert({
      site_id: siteId,
      user_id: userId || null,
      session_id: sessionId || null
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { ...data, items: [] } as Cart
}

export async function addCartItem(
  cartId: string,
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<CartItem> {
  const supabase = await getModuleClient()
  
  // Get product price
  const { data: product, error: prodError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('base_price, quantity, status, track_inventory')
    .eq('id', productId)
    .single()
  
  if (prodError) throw new Error(prodError.message)
  if (product.status !== 'active') {
    throw new Error('Product is not available')
  }
  
  let unitPrice = product.base_price
  
  // Check variant price if applicable
  if (variantId) {
    const { data: variant, error: varError } = await supabase
      .from(`${TABLE_PREFIX}_product_variants`)
      .select('price, quantity, is_active')
      .eq('id', variantId)
      .single()
    
    if (varError) throw new Error(varError.message)
    if (!variant.is_active) {
      throw new Error('Variant is not available')
    }
    
    if (variant.price) {
      unitPrice = variant.price
    }
    
    if (product.track_inventory && variant.quantity < quantity) {
      throw new Error('Insufficient stock')
    }
  } else if (product.track_inventory && product.quantity < quantity) {
    throw new Error('Insufficient stock')
  }
  
  // Check if item already exists - use upsert pattern
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .single()
  
  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_cart_items`)
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as CartItem
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_cart_items`)
      .insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId,
        quantity,
        unit_price: unitPrice
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as CartItem
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem | null> {
  const supabase = await getModuleClient()
  
  if (quantity <= 0) {
    await removeCartItem(itemId)
    return null
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as CartItem
}

export async function removeCartItem(itemId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .delete()
    .eq('id', itemId)
  
  if (error) throw new Error(error.message)
}

export async function clearCart(cartId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .delete()
    .eq('cart_id', cartId)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// ORDERS
// ============================================================================

export async function getOrders(
  siteId: string,
  filters: OrderFilters = {},
  page = 1,
  limit = 20
): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status)
  }
  if (filters.fulfillment_status) {
    query = query.eq('fulfillment_status', filters.fulfillment_status)
  }
  if (filters.search) {
    query = query.or(`order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
  }
  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }
  
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1).order('created_at', { ascending: false })
  
  const { data, count, error } = await query
  
  if (error) throw new Error(error.message)
  
  return {
    orders: (data || []) as Order[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getOrder(siteId: string, id: string): Promise<Order | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select(`
      *,
      items:${TABLE_PREFIX}_order_items(*)
    `)
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Order
}

export async function getOrderByNumber(siteId: string, orderNumber: string): Promise<Order | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select(`
      *,
      items:${TABLE_PREFIX}_order_items(*)
    `)
    .eq('site_id', siteId)
    .eq('order_number', orderNumber)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Order
}

export async function updateOrderStatus(siteId: string, orderId: string, status: Order['status']): Promise<Order> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Order
}

export async function updateOrderFulfillment(
  siteId: string,
  orderId: string,
  fulfillmentStatus: Order['fulfillment_status'],
  trackingNumber?: string,
  trackingUrl?: string
): Promise<Order> {
  const supabase = await getModuleClient()
  
  const updates: Record<string, unknown> = {
    fulfillment_status: fulfillmentStatus,
    updated_at: new Date().toISOString()
  }
  
  if (trackingNumber) updates.tracking_number = trackingNumber
  if (trackingUrl) updates.tracking_url = trackingUrl
  if (fulfillmentStatus === 'fulfilled') {
    updates.shipped_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Order
}

// ============================================================================
// DISCOUNTS
// ============================================================================

export async function getDiscounts(siteId: string): Promise<Discount[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as Discount[]
}

export async function validateDiscountCode(
  siteId: string,
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discount?: Discount; error?: string }> {
  const supabase = await getModuleClient()
  
  const { data: discount, error } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .select('*')
    .eq('site_id', siteId)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
  
  if (error || !discount) {
    return { valid: false, error: 'Invalid discount code' }
  }
  
  const now = new Date()
  if (discount.starts_at && new Date(discount.starts_at) > now) {
    return { valid: false, error: 'Discount code is not yet active' }
  }
  if (discount.ends_at && new Date(discount.ends_at) < now) {
    return { valid: false, error: 'Discount code has expired' }
  }
  if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
    return { valid: false, error: 'Discount code usage limit reached' }
  }
  if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
    return { valid: false, error: `Minimum order of $${discount.minimum_order_amount.toFixed(2)} required` }
  }
  
  return { valid: true, discount: discount as Discount }
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function getEcommerceSettings(siteId: string): Promise<EcommerceSettings | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as EcommerceSettings
}

export async function updateEcommerceSettings(
  siteId: string,
  agencyId: string,
  input: Partial<EcommerceSettings>
): Promise<EcommerceSettings> {
  const supabase = await getModuleClient()
  
  // Upsert settings
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .upsert({
      site_id: siteId,
      agency_id: agencyId,
      ...input,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'site_id'
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as EcommerceSettings
}

// ============================================================================
// INVENTORY
// ============================================================================

export async function adjustInventory(
  productId: string,
  variantId: string | null,
  adjustment: number
): Promise<void> {
  const supabase = await getModuleClient()
  
  if (variantId) {
    const { data: variant } = await supabase
      .from(`${TABLE_PREFIX}_product_variants`)
      .select('quantity')
      .eq('id', variantId)
      .single()
    
    if (variant) {
      await supabase
        .from(`${TABLE_PREFIX}_product_variants`)
        .update({ quantity: Math.max(0, variant.quantity + adjustment) })
        .eq('id', variantId)
    }
  } else {
    const { data: product } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('quantity')
      .eq('id', productId)
      .single()
    
    if (product) {
      await supabase
        .from(`${TABLE_PREFIX}_products`)
        .update({ quantity: Math.max(0, product.quantity + adjustment) })
        .eq('id', productId)
    }
  }
}

export async function getLowStockProducts(siteId: string): Promise<Product[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .eq('track_inventory', true)
    .eq('status', 'active')
    .filter('quantity', 'lte', 'low_stock_threshold')
  
  if (error) throw new Error(error.message)
  return (data || []) as Product[]
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeEcommerceForSite(siteId: string, agencyId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  // Check if settings exist
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .select('id')
    .eq('site_id', siteId)
    .single()
  
  if (!existing) {
    // Create default settings
    await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .insert({
        site_id: siteId,
        agency_id: agencyId,
        currency: 'USD',
        tax_rate: 0,
        tax_included_in_price: false,
        enable_guest_checkout: true,
        require_phone: false,
        send_order_confirmation: true,
        continue_selling_when_out_of_stock: false
      })
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
```

---

### Task 4: Module Manifest (30 min)

> **REQUIRED**: Every module needs a manifest.ts following CRM/Booking pattern

```typescript
// src/modules/ecommerce/manifest.ts

/**
 * E-Commerce Module Manifest
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Defines module metadata, features, navigation and API endpoints
 */

import type { ModuleManifest } from '../_types'

export const EcommerceModuleManifest: ModuleManifest = {
  id: 'ecommerce',
  shortId: 'ecommod01',  // 8 characters - CRITICAL!
  name: 'E-Commerce',
  description: 'Complete e-commerce solution with products, cart, checkout, and order management',
  version: '1.0.0',
  author: 'DRAMAC CMS',
  
  // Database schema prefix
  schema: {
    prefix: 'mod_ecommod01',
    tables: [
      'categories',
      'products',
      'product_categories',
      'product_options',
      'product_variants',
      'discounts',
      'carts',
      'cart_items',
      'orders',
      'order_items',
      'settings'
    ]
  },
  
  // Module features
  features: {
    catalog: {
      name: 'Product Catalog',
      description: 'Manage products, categories, variants, and inventory',
      enabled: true
    },
    cart: {
      name: 'Shopping Cart',
      description: 'Guest and user carts with discount codes',
      enabled: true
    },
    checkout: {
      name: 'Checkout',
      description: 'Secure checkout with payment integration',
      enabled: true
    },
    orders: {
      name: 'Order Management',
      description: 'Track orders, fulfillment, and refunds',
      enabled: true
    },
    analytics: {
      name: 'Sales Analytics',
      description: 'Sales reports and revenue tracking',
      enabled: true
    }
  },
  
  // Navigation structure
  navigation: {
    main: [
      {
        id: 'ecommerce-dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        href: '/ecommerce'
      },
      {
        id: 'ecommerce-products',
        label: 'Products',
        icon: 'Package',
        href: '/ecommerce/products'
      },
      {
        id: 'ecommerce-categories',
        label: 'Categories',
        icon: 'FolderTree',
        href: '/ecommerce/categories'
      },
      {
        id: 'ecommerce-orders',
        label: 'Orders',
        icon: 'ShoppingBag',
        href: '/ecommerce/orders'
      },
      {
        id: 'ecommerce-discounts',
        label: 'Discounts',
        icon: 'Percent',
        href: '/ecommerce/discounts'
      },
      {
        id: 'ecommerce-settings',
        label: 'Settings',
        icon: 'Settings',
        href: '/ecommerce/settings'
      }
    ]
  },
  
  // API endpoints
  api: {
    prefix: '/api/modules/ecommerce',
    endpoints: [
      // Products
      { method: 'GET', path: '/products', handler: 'getProducts' },
      { method: 'GET', path: '/products/:id', handler: 'getProduct' },
      { method: 'GET', path: '/products/slug/:slug', handler: 'getProductBySlug' },
      { method: 'POST', path: '/products', handler: 'createProduct' },
      { method: 'PUT', path: '/products/:id', handler: 'updateProduct' },
      { method: 'DELETE', path: '/products/:id', handler: 'deleteProduct' },
      
      // Categories
      { method: 'GET', path: '/categories', handler: 'getCategories' },
      { method: 'POST', path: '/categories', handler: 'createCategory' },
      
      // Cart
      { method: 'GET', path: '/cart', handler: 'getCart' },
      { method: 'POST', path: '/cart/items', handler: 'addCartItem' },
      { method: 'PUT', path: '/cart/items/:id', handler: 'updateCartItem' },
      { method: 'DELETE', path: '/cart/items/:id', handler: 'removeCartItem' },
      
      // Orders
      { method: 'GET', path: '/orders', handler: 'getOrders' },
      { method: 'GET', path: '/orders/:id', handler: 'getOrder' },
      { method: 'POST', path: '/checkout', handler: 'createOrder' },
      
      // Storefront Widget
      { method: 'GET', path: '/storefront/products', handler: 'getStorefrontProducts' },
      { method: 'GET', path: '/storefront/config', handler: 'getStorefrontConfig' }
    ]
  },
  
  // Embed/Widget support
  embed: {
    enabled: true,
    widgets: [
      {
        id: 'storefront',
        name: 'Storefront Widget',
        description: 'Embeddable product catalog and cart',
        defaultConfig: {
          showCart: true,
          productsPerPage: 12,
          theme: 'light'
        }
      },
      {
        id: 'product',
        name: 'Product Widget',
        description: 'Single product display with buy button',
        defaultConfig: {
          showVariants: true,
          showQuantity: true
        }
      }
    ]
  },
  
  // Dependencies
  dependencies: [],
  
  // Settings schema
  settings: {
    currency: { type: 'string', default: 'USD' },
    taxRate: { type: 'number', default: 0 },
    enableGuestCheckout: { type: 'boolean', default: true }
  }
}
```

---

### Task 5: Context Provider (2 hours)

> **REQUIRED**: Following CRM/Booking pattern exactly

```typescript
// src/modules/ecommerce/context/ecommerce-context.tsx

/**
 * E-Commerce Module Context Provider
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Provides E-Commerce state management and actions to all child components
 */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  getProducts, getCategories, getOrders, getDiscounts, getEcommerceSettings,
  createProduct, updateProduct, deleteProduct,
  createCategory, updateCategory, deleteCategory,
  updateOrderStatus, updateOrderFulfillment,
  initializeEcommerceForSite
} from '../actions/ecommerce-actions'
import type {
  Product, ProductInput, ProductUpdate, ProductFilters,
  Category, CategoryInput, CategoryUpdate,
  Order, OrderFilters,
  Discount,
  EcommerceSettings
} from '../types/ecommerce-types'

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface EcommerceContextType {
  // Data
  products: Product[]
  categories: Category[]
  orders: Order[]
  discounts: Discount[]
  settings: EcommerceSettings | null
  
  // Pagination
  productsPagination: { total: number; page: number; totalPages: number }
  ordersPagination: { total: number; page: number; totalPages: number }
  
  // State
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Product actions
  addProduct: (data: Partial<ProductInput>) => Promise<Product>
  editProduct: (id: string, data: ProductUpdate) => Promise<Product>
  removeProduct: (id: string) => Promise<void>
  
  // Category actions
  addCategory: (data: Partial<CategoryInput>) => Promise<Category>
  editCategory: (id: string, data: CategoryUpdate) => Promise<Category>
  removeCategory: (id: string) => Promise<void>
  
  // Order actions
  changeOrderStatus: (orderId: string, status: Order['status']) => Promise<Order>
  changeOrderFulfillment: (orderId: string, status: Order['fulfillment_status'], tracking?: string) => Promise<Order>
  
  // Filters
  productFilters: ProductFilters
  setProductFilters: (filters: ProductFilters) => void
  orderFilters: OrderFilters
  setOrderFilters: (filters: OrderFilters) => void
  
  // Pagination
  setProductsPage: (page: number) => void
  setOrdersPage: (page: number) => void
  
  // Refresh
  refresh: () => Promise<void>
  refreshProducts: () => Promise<void>
  refreshOrders: () => Promise<void>
  refreshCategories: () => Promise<void>
  
  // Site info
  siteId: string
  agencyId: string
}

// ============================================================================
// CONTEXT
// ============================================================================

const EcommerceContext = createContext<EcommerceContextType | null>(null)

export function useEcommerce() {
  const context = useContext(EcommerceContext)
  if (!context) {
    throw new Error('useEcommerce must be used within an EcommerceProvider')
  }
  return context
}

// Convenience hooks
export function useProducts() {
  const { products, productsPagination, productFilters, setProductFilters, setProductsPage, refreshProducts, addProduct, editProduct, removeProduct, isLoading } = useEcommerce()
  return { products, pagination: productsPagination, filters: productFilters, setFilters: setProductFilters, setPage: setProductsPage, refresh: refreshProducts, add: addProduct, edit: editProduct, remove: removeProduct, isLoading }
}

export function useOrders() {
  const { orders, ordersPagination, orderFilters, setOrderFilters, setOrdersPage, refreshOrders, changeOrderStatus, changeOrderFulfillment, isLoading } = useEcommerce()
  return { orders, pagination: ordersPagination, filters: orderFilters, setFilters: setOrderFilters, setPage: setOrdersPage, refresh: refreshOrders, changeStatus: changeOrderStatus, changeFulfillment: changeOrderFulfillment, isLoading }
}

export function useCategories() {
  const { categories, refreshCategories, addCategory, editCategory, removeCategory, isLoading } = useEcommerce()
  return { categories, refresh: refreshCategories, add: addCategory, edit: editCategory, remove: removeCategory, isLoading }
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface EcommerceProviderProps {
  children: ReactNode
  siteId: string
  agencyId: string
}

// ============================================================================
// PROVIDER
// ============================================================================

export function EcommerceProvider({ children, siteId, agencyId }: EcommerceProviderProps) {
  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [settings, setSettings] = useState<EcommerceSettings | null>(null)
  
  // Pagination
  const [productsPagination, setProductsPagination] = useState({ total: 0, page: 1, totalPages: 0 })
  const [ordersPagination, setOrdersPagination] = useState({ total: 0, page: 1, totalPages: 0 })
  
  // Filters
  const [productFilters, setProductFilters] = useState<ProductFilters>({})
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({})
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const refreshProducts = useCallback(async () => {
    try {
      const result = await getProducts(siteId, productFilters, productsPagination.page)
      setProducts(result.products)
      setProductsPagination({ total: result.total, page: result.page, totalPages: result.totalPages })
    } catch (err: unknown) {
      console.error('Error fetching products:', err)
    }
  }, [siteId, productFilters, productsPagination.page])

  const refreshCategories = useCallback(async () => {
    try {
      const data = await getCategories(siteId)
      setCategories(data)
    } catch (err: unknown) {
      console.error('Error fetching categories:', err)
    }
  }, [siteId])

  const refreshOrders = useCallback(async () => {
    try {
      const result = await getOrders(siteId, orderFilters, ordersPagination.page)
      setOrders(result.orders)
      setOrdersPagination({ total: result.total, page: result.page, totalPages: result.totalPages })
    } catch (err: unknown) {
      console.error('Error fetching orders:', err)
    }
  }, [siteId, orderFilters, ordersPagination.page])

  const refreshDiscounts = useCallback(async () => {
    try {
      const data = await getDiscounts(siteId)
      setDiscounts(data)
    } catch (err: unknown) {
      console.error('Error fetching discounts:', err)
    }
  }, [siteId])

  const refreshSettings = useCallback(async () => {
    try {
      const data = await getEcommerceSettings(siteId)
      setSettings(data)
    } catch (err: unknown) {
      console.error('Error fetching settings:', err)
    }
  }, [siteId])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        refreshProducts(),
        refreshCategories(),
        refreshOrders(),
        refreshDiscounts(),
        refreshSettings()
      ])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [refreshProducts, refreshCategories, refreshOrders, refreshDiscounts, refreshSettings])

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const init = async () => {
      try {
        await initializeEcommerceForSite(siteId, agencyId)
        await refresh()
        setIsInitialized(true)
      } catch (err: unknown) {
        console.error('Error initializing e-commerce:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize')
      }
    }
    
    init()
  }, [siteId, agencyId, refresh])

  // ============================================================================
  // PRODUCT ACTIONS
  // ============================================================================

  const addProduct = useCallback(async (data: Partial<ProductInput>): Promise<Product> => {
    const product = await createProduct(siteId, agencyId, data)
    await refreshProducts()
    return product
  }, [siteId, agencyId, refreshProducts])

  const editProduct = useCallback(async (id: string, data: ProductUpdate): Promise<Product> => {
    const product = await updateProduct(siteId, id, data)
    await refreshProducts()
    return product
  }, [siteId, refreshProducts])

  const removeProduct = useCallback(async (id: string): Promise<void> => {
    await deleteProduct(siteId, id)
    await refreshProducts()
  }, [siteId, refreshProducts])

  // ============================================================================
  // CATEGORY ACTIONS
  // ============================================================================

  const addCategory = useCallback(async (data: Partial<CategoryInput>): Promise<Category> => {
    const category = await createCategory(siteId, agencyId, data)
    await refreshCategories()
    return category
  }, [siteId, agencyId, refreshCategories])

  const editCategory = useCallback(async (id: string, data: CategoryUpdate): Promise<Category> => {
    const category = await updateCategory(siteId, id, data)
    await refreshCategories()
    return category
  }, [siteId, refreshCategories])

  const removeCategory = useCallback(async (id: string): Promise<void> => {
    await deleteCategory(siteId, id)
    await refreshCategories()
  }, [siteId, refreshCategories])

  // ============================================================================
  // ORDER ACTIONS
  // ============================================================================

  const changeOrderStatus = useCallback(async (orderId: string, status: Order['status']): Promise<Order> => {
    const order = await updateOrderStatus(siteId, orderId, status)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  const changeOrderFulfillment = useCallback(async (
    orderId: string,
    status: Order['fulfillment_status'],
    tracking?: string
  ): Promise<Order> => {
    const order = await updateOrderFulfillment(siteId, orderId, status, tracking)
    await refreshOrders()
    return order
  }, [siteId, refreshOrders])

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const setProductsPage = useCallback((page: number) => {
    setProductsPagination(prev => ({ ...prev, page }))
  }, [])

  const setOrdersPage = useCallback((page: number) => {
    setOrdersPagination(prev => ({ ...prev, page }))
  }, [])

  // Refetch when filters or page change
  useEffect(() => {
    if (isInitialized) {
      refreshProducts()
    }
  }, [productFilters, productsPagination.page, isInitialized, refreshProducts])

  useEffect(() => {
    if (isInitialized) {
      refreshOrders()
    }
  }, [orderFilters, ordersPagination.page, isInitialized, refreshOrders])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: EcommerceContextType = {
    products,
    categories,
    orders,
    discounts,
    settings,
    productsPagination,
    ordersPagination,
    isLoading,
    error,
    isInitialized,
    addProduct,
    editProduct,
    removeProduct,
    addCategory,
    editCategory,
    removeCategory,
    changeOrderStatus,
    changeOrderFulfillment,
    productFilters,
    setProductFilters,
    orderFilters,
    setOrderFilters,
    setProductsPage,
    setOrdersPage,
    refresh,
    refreshProducts,
    refreshOrders,
    refreshCategories,
    siteId,
    agencyId
  }

  return (
    <EcommerceContext.Provider value={value}>
      {children}
    </EcommerceContext.Provider>
  )
}
```

---

### Task 6: Module Index (15 min)

> **REQUIRED**: Main entry point following CRM/Booking pattern

```typescript
// src/modules/ecommerce/index.ts

/**
 * E-Commerce Module - Main Index
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Full-featured e-commerce module with product catalog,
 * shopping cart, checkout, and order management.
 */

// Types
export * from './types/ecommerce-types'

// Server Actions
export {
  // Categories
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Products
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  
  // Variants
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  
  // Category assignments
  setProductCategories,
  
  // Cart
  getOrCreateCart,
  findCart,
  createCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  
  // Orders
  getOrders,
  getOrder,
  getOrderByNumber,
  updateOrderStatus,
  updateOrderFulfillment,
  
  // Discounts
  getDiscounts,
  validateDiscountCode,
  
  // Settings
  getEcommerceSettings,
  updateEcommerceSettings,
  
  // Inventory
  adjustInventory,
  getLowStockProducts,
  
  // Initialization
  initializeEcommerceForSite
} from './actions/ecommerce-actions'

// Context
export { 
  EcommerceProvider, 
  useEcommerce, 
  useProducts, 
  useOrders, 
  useCategories 
} from './context/ecommerce-context'

// Components (to be implemented)
// export * from './components'

// Module Manifest
export { EcommerceModuleManifest } from './manifest'
```

---

### Task 7: Storefront Widget (3 hours)

> **NOTE**: The Storefront Widget provides embeddable e-commerce functionality.
> Uses server actions imported from `ecommerce-actions.ts`, NOT class-based services.
> File location: `src/modules/ecommerce/widgets/`

```tsx
// src/modules/ecommerce/widgets/StorefrontWidget.tsx

/**
 * Embeddable Storefront Widget
 * 
 * This widget can be embedded on external sites to provide:
 * - Product catalog browsing
 * - Shopping cart functionality  
 * - Checkout flow
 * 
 * IMPORTANT: Uses server actions pattern (NOT class-based services)
 */
'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import {
  getProducts,
  getCategories,
  getOrCreateCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  validateDiscountCode
} from '../actions/ecommerce-actions'
import type { Product, Category, Cart, CartItem, ProductFilters } from '../types/ecommerce-types'

// ============================================================================
// CART CONTEXT (for widget)
// ============================================================================

interface CartContextValue {
  cart: Cart | null
  isLoading: boolean
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>
  totals: CartTotals | null
}

interface CartTotals {
  subtotal: number
  discount: number
  tax: number
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// ============================================================================
// CART PROVIDER
// ============================================================================

interface CartProviderProps {
  children: ReactNode
  siteId: string
  sessionId?: string
  userId?: string
  taxRate?: number
}

export function CartProvider({ 
  children, 
  siteId, 
  sessionId, 
  userId,
  taxRate = 0 
}: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize cart
  useEffect(() => {
    const initCart = async () => {
      try {
        const c = await getOrCreateCart(siteId, userId, sessionId)
        setCart(c)
      } catch (err) {
        console.error('Failed to initialize cart:', err)
      } finally {
        setIsLoading(false)
      }
    }
    initCart()
  }, [siteId, userId, sessionId])

  const addItem = async (productId: string, variantId: string | null, quantity: number) => {
    if (!cart) return
    setIsLoading(true)
    try {
      await addCartItem(cart.id, productId, variantId, quantity)
      const updated = await getOrCreateCart(siteId, userId, sessionId)
      setCart(updated)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true)
    try {
      await updateCartItemQuantity(itemId, quantity)
      const updated = await getOrCreateCart(siteId, userId, sessionId)
      setCart(updated)
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    setIsLoading(true)
    try {
      await removeCartItem(itemId)
      const updated = await getOrCreateCart(siteId, userId, sessionId)
      setCart(updated)
    } finally {
      setIsLoading(false)
    }
  }

  const applyDiscountCode = async (code: string) => {
    if (!cart) return { success: false, message: 'No cart' }
    const subtotal = calculateSubtotal(cart.items)
    const result = await validateDiscountCode(siteId, code, subtotal)
    if (result.valid) {
      const updated = await getOrCreateCart(siteId, userId, sessionId)
      setCart(updated)
      return { success: true, message: 'Discount applied' }
    }
    return { success: false, message: result.error || 'Invalid code' }
  }

  const totals = cart ? calculateTotals(cart, taxRate) : null

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      applyDiscount: applyDiscountCode,
      totals
    }}>
      {children}
    </CartContext.Provider>
  )
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
}

function calculateTotals(cart: Cart, taxRate: number): CartTotals {
  const subtotal = calculateSubtotal(cart.items)
  const discount = cart.discount_amount || 0
  const taxableAmount = subtotal - discount
  const tax = (taxableAmount * taxRate) / 100
  const total = taxableAmount + tax

  return {
    subtotal,
    discount,
    tax,
    total,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }
}

// ============================================================================
// STOREFRONT WIDGET
// ============================================================================

interface StorefrontWidgetProps {
  siteId: string
  sessionId?: string
  userId?: string
  config?: {
    showCart?: boolean
    productsPerPage?: number
    theme?: 'light' | 'dark'
    primaryColor?: string
  }
}

export function StorefrontWidget({ 
  siteId, 
  sessionId, 
  userId,
  config = {}
}: StorefrontWidgetProps) {
  const {
    showCart = true,
    productsPerPage = 12,
    theme = 'light',
    primaryColor = '#000000'
  } = config

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getProducts(siteId, { 
            status: 'active',
            category: selectedCategory || undefined,
            search: searchQuery || undefined
          }, 1, productsPerPage),
          getCategories(siteId)
        ])
        setProducts(productsResult.products)
        setCategories(categoriesResult.filter(c => c.is_active))
      } catch (err) {
        console.error('Failed to fetch storefront data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [siteId, selectedCategory, searchQuery, productsPerPage])

  const isDark = theme === 'dark'

  return (
    <CartProvider siteId={siteId} sessionId={sessionId} userId={userId}>
      <div className={`storefront-widget ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header with search and cart */}
        <header className="flex items-center justify-between p-4 border-b">
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
          {showCart && <CartButton primaryColor={primaryColor} />}
        </header>

        {/* Categories */}
        <nav className="flex gap-2 p-4 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              !selectedCategory 
                ? `text-white` 
                : isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}
            style={!selectedCategory ? { backgroundColor: primaryColor } : {}}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === cat.id 
                  ? 'text-white' 
                  : isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: primaryColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                primaryColor={primaryColor}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        {/* Cart Drawer */}
        {showCart && <CartDrawer primaryColor={primaryColor} isDark={isDark} />}
      </div>
    </CartProvider>
  )
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function ProductCard({ 
  product, 
  primaryColor, 
  isDark 
}: { 
  product: Product
  primaryColor: string
  isDark: boolean 
}) {
  const { addItem, isLoading } = useCart()
  const [adding, setAdding] = useState(false)

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await addItem(product.id, null, 1)
    } finally {
      setAdding(false)
    }
  }

  const displayPrice = product.compare_at_price && product.compare_at_price > product.base_price
    ? (
      <>
        <span className="text-red-500 font-bold">${product.base_price.toFixed(2)}</span>
        <span className="line-through text-gray-400 ml-2">${product.compare_at_price.toFixed(2)}</span>
      </>
    )
    : <span className="font-bold">${product.base_price.toFixed(2)}</span>

  return (
    <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
      <div className="aspect-square bg-gray-100 relative">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        {product.is_featured && (
          <span 
            className="absolute top-2 left-2 px-2 py-1 text-xs text-white rounded"
            style={{ backgroundColor: primaryColor }}
          >
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold truncate">{product.name}</h3>
        <p className="text-sm mt-1">{displayPrice}</p>
        <button
          onClick={handleAddToCart}
          disabled={adding || isLoading || product.status !== 'active'}
          className="w-full mt-3 py-2 rounded text-white disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

function CartButton({ primaryColor }: { primaryColor: string }) {
  const { totals } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <button 
      onClick={() => setIsOpen(!isOpen)}
      className="relative p-2"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {totals && totals.itemCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 w-5 h-5 text-xs text-white rounded-full flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          {totals.itemCount}
        </span>
      )}
    </button>
  )
}

function CartDrawer({ primaryColor, isDark }: { primaryColor: string; isDark: boolean }) {
  const { cart, totals, updateQuantity, removeItem, isLoading } = useCart()

  if (!cart || cart.items.length === 0) {
    return null
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-80 shadow-xl p-4 overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>
      
      <div className="space-y-4">
        {cart.items.map(item => (
          <div key={item.id} className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded" />
            <div className="flex-1">
              <p className="font-medium">{item.product?.name || 'Product'}</p>
              <p className="text-sm text-gray-500">${item.unit_price.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={isLoading}
                  className="w-6 h-6 border rounded"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isLoading}
                  className="w-6 h-6 border rounded"
                >
                  +
                </button>
                <button 
                  onClick={() => removeItem(item.id)}
                  disabled={isLoading}
                  className="ml-auto text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totals && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between mb-2 text-green-500">
              <span>Discount</span>
              <span>-${totals.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
          <button
            className="w-full mt-4 py-3 rounded text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### Task 8: API Routes (2 hours)

> **NOTE**: API routes use server actions, NOT class-based services.
> File location: `src/app/api/modules/ecommerce/`

```typescript
// src/app/api/modules/ecommerce/products/route.ts

import { NextResponse } from 'next/server'
import { getProducts, getProduct } from '@/modules/ecommerce/actions/ecommerce-actions'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const siteId = request.headers.get('x-site-id')
  
  if (!siteId) {
    return NextResponse.json({ error: 'Site ID required' }, { status: 400 })
  }

  const productId = url.searchParams.get('id')
  
  if (productId) {
    const product = await getProduct(siteId, productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
  }

  const filters = {
    category: url.searchParams.get('category') || undefined,
    status: (url.searchParams.get('status') as any) || 'active',
    search: url.searchParams.get('search') || undefined,
    featured: url.searchParams.get('featured') === 'true',
    minPrice: url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined,
    maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
    inStock: url.searchParams.get('inStock') === 'true'
  }

  const page = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 20

  const result = await getProducts(siteId, filters, page, limit)
  return NextResponse.json(result)
}
```

```typescript
// src/app/api/modules/ecommerce/cart/route.ts

import { NextResponse } from 'next/server'
import { 
  getOrCreateCart, 
  addCartItem, 
  updateCartItemQuantity,
  removeCartItem 
} from '@/modules/ecommerce/actions/ecommerce-actions'

export async function GET(request: Request) {
  const siteId = request.headers.get('x-site-id')
  const userId = request.headers.get('x-user-id')
  const sessionId = request.headers.get('x-session-id')

  if (!siteId) {
    return NextResponse.json({ error: 'Site ID required' }, { status: 400 })
  }

  const cart = await getOrCreateCart(siteId, userId || undefined, sessionId || undefined)
  return NextResponse.json(cart)
}

export async function POST(request: Request) {
  const siteId = request.headers.get('x-site-id')
  const userId = request.headers.get('x-user-id')
  const sessionId = request.headers.get('x-session-id')
  
  if (!siteId) {
    return NextResponse.json({ error: 'Site ID required' }, { status: 400 })
  }

  const body = await request.json()
  const { productId, variantId, quantity } = body

  // Get or create cart first
  const cart = await getOrCreateCart(siteId, userId || undefined, sessionId || undefined)
  
  // Add item
  const item = await addCartItem(cart.id, productId, variantId, quantity)
  
  return NextResponse.json(item)
}
```

```typescript
// src/app/api/modules/ecommerce/checkout/route.ts

import { NextResponse } from 'next/server'
import { 
  findCart,
  getEcommerceSettings
} from '@/modules/ecommerce/actions/ecommerce-actions'
import { createClient } from '@/lib/supabase/server'

const ECOMMERCE_SHORT_ID = 'ecommod01'
const TABLE_PREFIX = `mod_${ECOMMERCE_SHORT_ID}`

export async function POST(request: Request) {
  const siteId = request.headers.get('x-site-id')
  const agencyId = request.headers.get('x-agency-id')
  const userId = request.headers.get('x-user-id')
  const sessionId = request.headers.get('x-session-id')
  
  if (!siteId || !agencyId) {
    return NextResponse.json({ error: 'Site and Agency ID required' }, { status: 400 })
  }

  const body = await request.json()
  const {
    email,
    phone,
    shippingAddress,
    billingAddress,
    shippingMethod,
    shippingAmount = 0,
    notes
  } = body

  // Get cart
  const cart = await findCart(siteId, userId || undefined, sessionId || undefined)
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Get settings for tax
  const settings = await getEcommerceSettings(siteId)
  const taxRate = settings?.tax_rate || 0

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const discount = cart.discount_amount || 0
  const taxableAmount = subtotal - discount
  const taxAmount = (taxableAmount * taxRate) / 100
  const total = taxableAmount + taxAmount + shippingAmount

  // Generate order number
  const supabase = await createClient() as any
  const { data: orderNumberData } = await supabase.rpc(`${TABLE_PREFIX}_generate_order_number`, {
    p_site_id: siteId
  })
  const orderNumber = orderNumberData || `ORD-${Date.now()}`

  // Create order
  const { data: order, error: orderError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .insert({
      site_id: siteId,
      agency_id: agencyId,
      order_number: orderNumber,
      customer_id: userId || null,
      customer_email: email,
      customer_phone: phone || null,
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      subtotal,
      discount_amount: discount,
      discount_code: cart.discount_code,
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      total,
      currency: settings?.currency || 'USD',
      shipping_method: shippingMethod || null,
      customer_notes: notes || null
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Create order items
  const orderItems = cart.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product?.name || 'Unknown',
    product_sku: item.product_id,
    variant_options: item.variant?.options || {},
    image_url: item.variant?.image_url || item.product?.images?.[0] || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity
  }))

  await supabase
    .from(`${TABLE_PREFIX}_order_items`)
    .insert(orderItems)

  // Mark cart as converted
  await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .update({ status: 'converted' })
    .eq('id', cart.id)

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber,
    clientSecret: paymentIntent.client_secret
  })
}
```

```typescript
// src/app/api/modules/ecommerce/webhooks/payment/route.ts

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ECOMMERCE_SHORT_ID = 'ecommod01'
const TABLE_PREFIX = `mod_${ECOMMERCE_SHORT_ID}`

/**
 * Generic payment webhook handler
 * 
 * This handles webhooks from various payment providers:
 * - Paddle (for global SaaS/subscriptions)
 * - Flutterwave (primary African e-commerce - Zambia + 30+ countries)
 * - Pesapal (secondary African option with cards + mobile money)
 * - DPO Pay (Zambian local backup)
 * 
 * Each provider will have its own signature verification and event handling
 */
export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const provider = headersList.get('x-payment-provider') || 'unknown'

  const supabase = await createClient() as any

  try {
    // Parse webhook based on provider
    let event
    let orderId
    let transactionId
    let status

    switch (provider) {
      case 'paddle':
        // Paddle webhook verification and parsing
        // event = await verifyPaddleWebhook(body, headersList)
        // Handle Paddle events (transaction.completed, subscription.created, etc.)
        break

      case 'flutterwave':
        // Flutterwave webhook verification and parsing
        // const secretHash = headersList.get('verif-hash')
        // Verify secretHash matches FLUTTERWAVE_WEBHOOK_SECRET_HASH
        // event = JSON.parse(body)
        // Handle Flutterwave events (charge.completed, transfer.completed, etc.)
        // Supports cards, mobile money (MTN/Airtel/Zamtel), bank transfers, USSD
        break

      case 'pesapal':
        // Pesapal IPN (Instant Payment Notification) handling
        // event = await verifyPesapalIPN(body, headersList)
        // Handle Pesapal payment status updates
        break

      case 'dpo':
        // DPO Pay callback handling
        // event = await verifyDpoCallback(body, headersList)
        // Handle DPO payment notifications
        break

      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
    }

    // Common payment processing logic
    if (status === 'completed' || status === 'paid') {
      // Update order status
      await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_provider: provider,
          payment_transaction_id: transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      // Get order items to decrease inventory
      const { data: order } = await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .select(`items:${TABLE_PREFIX}_order_items(product_id, variant_id, quantity)`)
        .eq('id', orderId)
        .single()

      if (order?.items) {
        for (const item of order.items) {
          if (item.variant_id) {
            const { data: variant } = await supabase
              .from(`${TABLE_PREFIX}_product_variants`)
              .select('quantity')
              .eq('id', item.variant_id)
              .single()
            
            if (variant) {
              await supabase
                .from(`${TABLE_PREFIX}_product_variants`)
                .update({ quantity: Math.max(0, variant.quantity - item.quantity) })
                .eq('id', item.variant_id)
            }
          } else if (item.product_id) {
            const { data: product } = await supabase
              .from(`${TABLE_PREFIX}_products`)
              .select('quantity')
              .eq('id', item.product_id)
              .single()
            
            if (product) {
              await supabase
                .from(`${TABLE_PREFIX}_products`)
                .update({ quantity: Math.max(0, product.quantity - item.quantity) })
                .eq('id', item.product_id)
            }
          }
        }
      }
    } else if (status === 'failed') {
      await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }
}
```

---


## ✅ Verification Checklist

- [ ] Products can be created with variants
- [ ] Categories work correctly
- [ ] Cart persists across sessions
- [ ] Discount codes apply correctly
- [ ] Checkout creates order
- [ ] Payment integration works (Paddle/Flutterwave/Pesapal/DPO)
- [ ] Mobile money payments work (MTN/Airtel/Zamtel via Flutterwave)
- [ ] Inventory decreases on purchase
- [ ] Orders can be managed
- [ ] Refunds process correctly
- [ ] Widget embeds on sites

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05 (naming), EM-40 (multi-tenant)
- **Required by**: External websites, revenue features
- **External APIs**: 
  - **Paddle** (Global SaaS payments - already in platform via EM-59A)
  - **Flutterwave** (Primary African e-commerce - Zambia + 30+ countries)
    - Cards (Visa/Mastercard), Mobile Money (MTN/Airtel/Zamtel), Bank Transfers, USSD
    - Native ZMW support, best African developer experience
  - **Pesapal** (Secondary African option - cards + mobile money)
  - **DPO Pay** (Zambian local backup - optional)

