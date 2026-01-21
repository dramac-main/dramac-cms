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
│ Products     │ Cart Items   │ Order List   │ Stripe Integration  │
│ Categories   │ Guest Carts  │ Order Detail │ PayPal Integration  │
│ Variants     │ User Carts   │ Fulfillment  │ Invoice Generation  │
│ Pricing      │ Discounts    │ Refunds      │ Tax Calculation     │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (3 hours)

```sql
-- migrations/em-52-ecommerce-schema.sql

-- ==========================================
-- E-COMMERCE MODULE DATABASE SCHEMA
-- Uses mod_ecom_ prefix per EM-05 conventions
-- ==========================================

-- Product Categories
CREATE TABLE mod_ecom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES mod_ecom_categories(id) ON DELETE SET NULL,
  
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
CREATE TABLE mod_ecom_products (
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
CREATE TABLE mod_ecom_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecom_products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES mod_ecom_categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(product_id, category_id)
);

-- Product Options (Size, Color, etc.)
CREATE TABLE mod_ecom_product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecom_products(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,           -- "Size", "Color"
  values JSONB NOT NULL,        -- ["S", "M", "L", "XL"]
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(product_id, name)
);

-- Product Variants (specific combinations)
CREATE TABLE mod_ecom_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecom_products(id) ON DELETE CASCADE,
  
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
CREATE TABLE mod_ecom_discounts (
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
CREATE TABLE mod_ecom_carts (
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
CREATE TABLE mod_ecom_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES mod_ecom_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecom_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES mod_ecom_product_variants(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  
  -- Custom options (if any)
  custom_options JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cart_id, product_id, variant_id)
);

-- Orders
CREATE TABLE mod_ecom_orders (
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
  payment_intent_id TEXT, -- Stripe payment intent
  
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
CREATE TABLE mod_ecom_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecom_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES mod_ecom_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES mod_ecom_product_variants(id) ON DELETE SET NULL,
  
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
CREATE TABLE mod_ecom_settings (
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
  stripe_config JSONB,
  paypal_config JSONB,
  
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
CREATE INDEX idx_products_site ON mod_ecom_products(site_id);
CREATE INDEX idx_products_status ON mod_ecom_products(site_id, status);
CREATE INDEX idx_products_featured ON mod_ecom_products(site_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_orders_site ON mod_ecom_orders(site_id);
CREATE INDEX idx_orders_status ON mod_ecom_orders(site_id, status);
CREATE INDEX idx_orders_customer ON mod_ecom_orders(customer_id);
CREATE INDEX idx_carts_session ON mod_ecom_carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_user ON mod_ecom_carts(user_id) WHERE user_id IS NOT NULL;

-- RLS Policies
ALTER TABLE mod_ecom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecom_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecom_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecom_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_isolation" ON mod_ecom_categories
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecom_products
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecom_orders
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecom_carts
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON mod_ecom_settings
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);

-- Order number sequence function
CREATE OR REPLACE FUNCTION mod_ecom_generate_order_number(p_site_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_prefix TEXT;
BEGIN
  -- Get current count for site
  SELECT COUNT(*) + 1 INTO v_count
  FROM mod_ecom_orders
  WHERE site_id = p_site_id;
  
  -- Generate order number: ORD-20240115-00001
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
```

---

### Task 2: Product Service (3 hours)

```typescript
// src/lib/modules/ecommerce/services/product-service.ts

import { createClient } from '@supabase/supabase-js';
import { setTenantContext } from '@/lib/modules/multi-tenant/tenant-context';

export interface Product {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  tax_class: string;
  is_taxable: boolean;
  sku: string | null;
  barcode: string | null;
  track_inventory: boolean;
  quantity: number;
  low_stock_threshold: number;
  weight: number | null;
  weight_unit: string;
  status: 'draft' | 'active' | 'archived';
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  images: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Related data
  categories?: Category[];
  variants?: ProductVariant[];
  options?: ProductOption[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  options: Record<string, string>;
  price: number | null;
  compare_at_price: number | null;
  sku: string | null;
  quantity: number;
  image_url: string | null;
  is_active: boolean;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  sort_order: number;
}

export interface ProductFilters {
  category?: string;
  status?: string;
  search?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ProductService {
  private siteId: string;
  private agencyId: string;

  constructor(siteId: string, agencyId: string) {
    this.siteId = siteId;
    this.agencyId = agencyId;
  }

  /**
   * Get all products with filters
   */
  async getProducts(filters: ProductFilters = {}, page = 1, limit = 20): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    let query = supabase
      .from('mod_ecom_products')
      .select('*, mod_ecom_product_categories!inner(category_id)', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.featured) {
      query = query.eq('is_featured', true);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.minPrice) {
      query = query.gte('base_price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('base_price', filters.maxPrice);
    }
    if (filters.inStock) {
      query = query.gt('quantity', 0);
    }
    if (filters.category) {
      query = query.eq('mod_ecom_product_categories.category_id', filters.category);
    }

    // Pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      products: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  /**
   * Get single product with all details
   */
  async getProduct(id: string): Promise<Product | null> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_products')
      .select(`
        *,
        mod_ecom_product_categories(
          category:mod_ecom_categories(*)
        ),
        mod_ecom_product_variants(*),
        mod_ecom_product_options(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Transform the data
    if (data) {
      return {
        ...data,
        categories: data.mod_ecom_product_categories?.map((pc: any) => pc.category) || [],
        variants: data.mod_ecom_product_variants || [],
        options: data.mod_ecom_product_options || []
      };
    }

    return null;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_products')
      .select(`
        *,
        mod_ecom_product_categories(
          category:mod_ecom_categories(*)
        ),
        mod_ecom_product_variants(*),
        mod_ecom_product_options(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new product
   */
  async createProduct(input: Partial<Product>): Promise<Product> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    // Generate slug if not provided
    const slug = input.slug || this.generateSlug(input.name!);

    const { data, error } = await supabase
      .from('mod_ecom_products')
      .insert({
        ...input,
        site_id: this.siteId,
        agency_id: this.agencyId,
        slug,
        images: input.images || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { error } = await supabase
      .from('mod_ecom_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Update inventory
   */
  async updateInventory(productId: string, variantId: string | null, adjustment: number): Promise<void> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    if (variantId) {
      // Update variant inventory
      await supabase.rpc('mod_ecom_adjust_variant_inventory', {
        p_variant_id: variantId,
        p_adjustment: adjustment
      });
    } else {
      // Update product inventory
      await supabase.rpc('mod_ecom_adjust_product_inventory', {
        p_product_id: productId,
        p_adjustment: adjustment
      });
    }
  }

  /**
   * Add product variant
   */
  async addVariant(productId: string, variant: Partial<ProductVariant>): Promise<ProductVariant> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_product_variants')
      .insert({
        ...variant,
        product_id: productId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update product variant
   */
  async updateVariant(variantId: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_product_variants')
      .update(updates)
      .eq('id', variantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<Category[]> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create category
   */
  async createCategory(input: Partial<Category>): Promise<Category> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const slug = input.slug || this.generateSlug(input.name!);

    const { data, error } = await supabase
      .from('mod_ecom_categories')
      .insert({
        ...input,
        site_id: this.siteId,
        agency_id: this.agencyId,
        slug
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Assign product to categories
   */
  async setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    // Delete existing assignments
    await supabase
      .from('mod_ecom_product_categories')
      .delete()
      .eq('product_id', productId);

    // Insert new assignments
    if (categoryIds.length > 0) {
      const { error } = await supabase
        .from('mod_ecom_product_categories')
        .insert(
          categoryIds.map((catId, index) => ({
            product_id: productId,
            category_id: catId,
            sort_order: index
          }))
        );

      if (error) throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<Product[]> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_products')
      .select('*')
      .eq('track_inventory', true)
      .filter('quantity', 'lte', supabase.rpc('mod_ecom_get_low_stock_threshold'));

    if (error) throw error;
    return data || [];
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
```

---

### Task 3: Cart Service (2 hours)

```typescript
// src/lib/modules/ecommerce/services/cart-service.ts

import { createClient } from '@supabase/supabase-js';
import { setTenantContext } from '@/lib/modules/multi-tenant/tenant-context';

export interface Cart {
  id: string;
  site_id: string;
  user_id: string | null;
  session_id: string | null;
  discount_code: string | null;
  discount_amount: number;
  currency: string;
  status: 'active' | 'abandoned' | 'converted';
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  custom_options: Record<string, any>;
  
  // Populated fields
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    status: string;
    quantity: number;
  };
  variant?: {
    id: string;
    options: Record<string, string>;
    quantity: number;
    image_url: string | null;
  };
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class CartService {
  private siteId: string;

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  /**
   * Get or create cart for user/session
   */
  async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
    let cart = await this.findCart(userId, sessionId);
    
    if (!cart) {
      cart = await this.createCart(userId, sessionId);
    }
    
    return cart;
  }

  /**
   * Find existing cart
   */
  async findCart(userId?: string, sessionId?: string): Promise<Cart | null> {
    let query = supabase
      .from('mod_ecom_carts')
      .select(`
        *,
        items:mod_ecom_cart_items(
          *,
          product:mod_ecom_products(id, name, slug, images, status, quantity),
          variant:mod_ecom_product_variants(id, options, quantity, image_url)
        )
      `)
      .eq('site_id', this.siteId)
      .eq('status', 'active');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return null;
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    
    return data;
  }

  /**
   * Create new cart
   */
  async createCart(userId?: string, sessionId?: string): Promise<Cart> {
    const { data, error } = await supabase
      .from('mod_ecom_carts')
      .insert({
        site_id: this.siteId,
        user_id: userId || null,
        session_id: sessionId || null
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, items: [] };
  }

  /**
   * Add item to cart
   */
  async addItem(
    cartId: string,
    productId: string,
    variantId: string | null,
    quantity: number
  ): Promise<CartItem> {
    // Get product price
    const { data: product, error: prodError } = await supabase
      .from('mod_ecom_products')
      .select('base_price, quantity, status, track_inventory')
      .eq('id', productId)
      .single();

    if (prodError) throw prodError;
    if (product.status !== 'active') {
      throw new Error('Product is not available');
    }

    let unitPrice = product.base_price;

    // Check variant price if applicable
    if (variantId) {
      const { data: variant, error: varError } = await supabase
        .from('mod_ecom_product_variants')
        .select('price, quantity, is_active')
        .eq('id', variantId)
        .single();

      if (varError) throw varError;
      if (!variant.is_active) {
        throw new Error('Variant is not available');
      }

      // Use variant price if set
      if (variant.price) {
        unitPrice = variant.price;
      }

      // Check inventory
      if (product.track_inventory && variant.quantity < quantity) {
        throw new Error('Insufficient stock');
      }
    } else if (product.track_inventory && product.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already exists in cart
    const { data: existing, error: existError } = await supabase
      .from('mod_ecom_cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .single();

    if (existError && existError.code !== 'PGRST116') throw existError;

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('mod_ecom_cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('mod_ecom_cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          variant_id: variantId,
          quantity,
          unit_price: unitPrice
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem | null> {
    if (quantity <= 0) {
      await this.removeItem(itemId);
      return null;
    }

    const { data, error } = await supabase
      .from('mod_ecom_cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('mod_ecom_cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  /**
   * Clear cart
   */
  async clearCart(cartId: string): Promise<void> {
    const { error } = await supabase
      .from('mod_ecom_cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;
  }

  /**
   * Apply discount code
   */
  async applyDiscount(cartId: string, code: string): Promise<{ success: boolean; message: string; amount?: number }> {
    // Get cart for subtotal
    const cart = await this.getCart(cartId);
    if (!cart) {
      return { success: false, message: 'Cart not found' };
    }

    const subtotal = this.calculateSubtotal(cart.items);

    // Find discount
    const { data: discount, error } = await supabase
      .from('mod_ecom_discounts')
      .select('*')
      .eq('site_id', this.siteId)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return { success: false, message: 'Invalid discount code' };
    }

    // Check validity
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return { success: false, message: 'Discount code is not yet active' };
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return { success: false, message: 'Discount code has expired' };
    }

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return { success: false, message: 'Discount code usage limit reached' };
    }

    // Check minimum order
    if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
      return { 
        success: false, 
        message: `Minimum order of $${discount.minimum_order_amount.toFixed(2)} required` 
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === 'fixed_amount') {
      discountAmount = Math.min(discount.value, subtotal);
    }

    // Apply to cart
    await supabase
      .from('mod_ecom_carts')
      .update({
        discount_code: code.toUpperCase(),
        discount_amount: discountAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);

    return { 
      success: true, 
      message: 'Discount applied', 
      amount: discountAmount 
    };
  }

  /**
   * Remove discount
   */
  async removeDiscount(cartId: string): Promise<void> {
    await supabase
      .from('mod_ecom_carts')
      .update({
        discount_code: null,
        discount_amount: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);
  }

  /**
   * Get cart with items
   */
  async getCart(cartId: string): Promise<Cart | null> {
    const { data, error } = await supabase
      .from('mod_ecom_carts')
      .select(`
        *,
        items:mod_ecom_cart_items(
          *,
          product:mod_ecom_products(id, name, slug, images, status, quantity),
          variant:mod_ecom_product_variants(id, options, quantity, image_url)
        )
      `)
      .eq('id', cartId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Calculate cart totals
   */
  async calculateTotals(cartId: string, shippingAmount = 0): Promise<CartTotals> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      return { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 };
    }

    // Get settings for tax
    const { data: settings } = await supabase
      .from('mod_ecom_settings')
      .select('tax_rate, tax_included_in_price, free_shipping_threshold')
      .eq('site_id', this.siteId)
      .single();

    const taxRate = settings?.tax_rate || 0;
    const freeShippingThreshold = settings?.free_shipping_threshold;

    const subtotal = this.calculateSubtotal(cart.items);
    const discount = cart.discount_amount;
    
    // Check free shipping
    let shipping = shippingAmount;
    if (freeShippingThreshold && subtotal >= freeShippingThreshold) {
      shipping = 0;
    }

    // Calculate tax on discounted amount
    const taxableAmount = subtotal - discount;
    const tax = (taxableAmount * taxRate) / 100;

    const total = taxableAmount + shipping + tax;
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, discount, shipping, tax, total, itemCount };
  }

  private calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }

  /**
   * Merge guest cart into user cart
   */
  async mergeCart(sessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.findCart(undefined, sessionId);
    let userCart = await this.findCart(userId);

    if (!guestCart) {
      // No guest cart, just return user cart or create new
      return userCart || await this.createCart(userId);
    }

    if (!userCart) {
      // Transfer guest cart to user
      await supabase
        .from('mod_ecom_carts')
        .update({ user_id: userId, session_id: null })
        .eq('id', guestCart.id);

      return { ...guestCart, user_id: userId, session_id: null };
    }

    // Merge items from guest to user cart
    for (const item of guestCart.items) {
      await this.addItem(userCart.id, item.product_id, item.variant_id, item.quantity);
    }

    // Delete guest cart
    await supabase
      .from('mod_ecom_carts')
      .delete()
      .eq('id', guestCart.id);

    // Return updated user cart
    return await this.getCart(userCart.id) as Cart;
  }
}
```

---

### Task 4: Order Service (3 hours)

```typescript
// src/lib/modules/ecommerce/services/order-service.ts

import { createClient } from '@supabase/supabase-js';
import { setTenantContext } from '@/lib/modules/multi-tenant/tenant-context';
import { CartService } from './cart-service';
import Stripe from 'stripe';

export interface Order {
  id: string;
  site_id: string;
  order_number: string;
  customer_id: string | null;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Address;
  billing_address: Address;
  subtotal: number;
  discount_amount: number;
  discount_code: string | null;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_intent_id: string | null;
  fulfillment_status: FulfillmentStatus;
  shipping_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_options: Record<string, string>;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  fulfilled_quantity: number;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface CreateOrderInput {
  cartId: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod?: string;
  shippingAmount?: number;
  customerNotes?: string;
  customerId?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class OrderService {
  private siteId: string;
  private agencyId: string;
  private stripe: Stripe | null = null;

  constructor(siteId: string, agencyId: string) {
    this.siteId = siteId;
    this.agencyId = agencyId;
  }

  /**
   * Initialize Stripe
   */
  private async initStripe(): Promise<Stripe> {
    if (this.stripe) return this.stripe;

    const { data: settings } = await supabase
      .from('mod_ecom_settings')
      .select('stripe_config')
      .eq('site_id', this.siteId)
      .single();

    if (!settings?.stripe_config?.secret_key) {
      throw new Error('Stripe is not configured');
    }

    this.stripe = new Stripe(settings.stripe_config.secret_key, {
      apiVersion: '2024-11-20.acacia'
    });

    return this.stripe;
  }

  /**
   * Create order from cart
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const cartService = new CartService(this.siteId);
    const cart = await cartService.getCart(input.cartId);
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals
    const totals = await cartService.calculateTotals(input.cartId, input.shippingAmount);

    // Generate order number
    const { data: orderNumber } = await supabase.rpc('mod_ecom_generate_order_number', {
      p_site_id: this.siteId
    });

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('mod_ecom_orders')
      .insert({
        site_id: this.siteId,
        agency_id: this.agencyId,
        order_number: orderNumber,
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        shipping_address: input.shippingAddress,
        billing_address: input.billingAddress,
        subtotal: totals.subtotal,
        discount_amount: totals.discount,
        discount_code: cart.discount_code,
        shipping_amount: totals.shipping,
        tax_amount: totals.tax,
        total: totals.total,
        currency: cart.currency,
        shipping_method: input.shippingMethod,
        customer_notes: input.customerNotes
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cart.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product?.name || 'Unknown Product',
      product_sku: item.variant?.id ? null : item.product_id, // Would need actual SKU
      variant_options: item.variant?.options || {},
      image_url: item.variant?.image_url || item.product?.images?.[0],
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('mod_ecom_order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update discount usage count
    if (cart.discount_code) {
      await supabase.rpc('mod_ecom_increment_discount_usage', {
        p_code: cart.discount_code,
        p_site_id: this.siteId
      });
    }

    // Mark cart as converted
    await supabase
      .from('mod_ecom_carts')
      .update({ status: 'converted' })
      .eq('id', input.cartId);

    return this.getOrder(order.id) as Promise<Order>;
  }

  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const stripe = await this.initStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: order.currency.toLowerCase(),
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        site_id: this.siteId
      }
    });

    // Store payment intent ID
    await supabase
      .from('mod_ecom_orders')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', orderId);

    return { clientSecret: paymentIntent.client_secret! };
  }

  /**
   * Confirm payment (called by webhook)
   */
  async confirmPayment(paymentIntentId: string): Promise<void> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data: order, error } = await supabase
      .from('mod_ecom_orders')
      .select('id, items:mod_ecom_order_items(*)')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error || !order) {
      throw new Error('Order not found for payment intent');
    }

    // Update order status
    await supabase
      .from('mod_ecom_orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'stripe',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Reduce inventory
    for (const item of order.items) {
      if (item.variant_id) {
        await supabase.rpc('mod_ecom_reduce_variant_inventory', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity
        });
      } else if (item.product_id) {
        await supabase.rpc('mod_ecom_reduce_product_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });
      }
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_orders')
      .select(`
        *,
        items:mod_ecom_order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get order by number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_orders')
      .select(`
        *,
        items:mod_ecom_order_items(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get orders with filters
   */
  async getOrders(filters: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    customerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  } = {}, page = 1, limit = 20): Promise<{ orders: Order[]; total: number }> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    let query = supabase
      .from('mod_ecom_orders')
      .select('*, items:mod_ecom_order_items(*)', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
    if (filters.fulfillmentStatus) query = query.eq('fulfillment_status', filters.fulfillmentStatus);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString());
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo.toISOString());
    if (filters.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    return { orders: data || [], total: count || 0 };
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add tracking info
   */
  async addTracking(orderId: string, trackingNumber: string, trackingUrl?: string): Promise<Order> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    const { data, error } = await supabase
      .from('mod_ecom_orders')
      .update({
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        status: 'shipped',
        fulfillment_status: 'fulfilled',
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Process refund
   */
  async refund(orderId: string, amount?: number, reason?: string): Promise<void> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');
    if (!order.payment_intent_id) throw new Error('No payment to refund');

    const stripe = await this.initStripe();
    const refundAmount = amount || order.total;

    await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: Math.round(refundAmount * 100),
      reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer'
    });

    // Update order status
    const isFullRefund = refundAmount >= order.total;
    await supabase
      .from('mod_ecom_orders')
      .update({
        status: isFullRefund ? 'refunded' : 'processing',
        payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
  }

  /**
   * Cancel order
   */
  async cancel(orderId: string, reason?: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    // If paid, process refund first
    if (order.payment_status === 'paid') {
      await this.refund(orderId, undefined, reason);
    }

    // Restore inventory
    for (const item of order.items) {
      if (item.variant_id) {
        await supabase.rpc('mod_ecom_restore_variant_inventory', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity
        });
      } else if (item.product_id) {
        await supabase.rpc('mod_ecom_restore_product_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });
      }
    }

    const { data, error } = await supabase
      .from('mod_ecom_orders')
      .update({
        status: 'cancelled',
        internal_notes: reason ? `Cancelled: ${reason}` : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get order statistics
   */
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  }> {
    await setTenantContext(supabase, this.agencyId, this.siteId);

    let query = supabase
      .from('mod_ecom_orders')
      .select('total, status');

    if (dateFrom) query = query.gte('created_at', dateFrom.toISOString());
    if (dateTo) query = query.lte('created_at', dateTo.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const orders = data || [];
    const paidOrders = orders.filter(o => 
      ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)
    );

    const totalOrders = orders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    const ordersByStatus: Record<string, number> = {};
    orders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    return { totalOrders, totalRevenue, averageOrderValue, ordersByStatus };
  }
}
```

---

### Task 5: Storefront Widget (3 hours)

```tsx
// src/lib/modules/ecommerce/widgets/StorefrontWidget.tsx

'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { CartService, Cart, CartItem, CartTotals } from '../services/cart-service';
import { ProductService, Product, Category } from '../services/product-service';

// ============= Cart Context =============

interface CartContextValue {
  cart: Cart | null;
  totals: CartTotals | null;
  loading: boolean;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>;
  clearCart: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within StorefrontProvider');
  return context;
}

// ============= Provider =============

interface StorefrontProviderProps {
  siteId: string;
  apiBaseUrl?: string;
  children: React.ReactNode;
}

export function StorefrontProvider({ 
  siteId, 
  apiBaseUrl = '/api/modules/ecommerce',
  children 
}: StorefrontProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Get or generate session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('ecom_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('ecom_session_id', sessionId);
    }
    return sessionId;
  };

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`${apiBaseUrl}/cart?session_id=${sessionId}`);
      const data = await response.json();
      setCart(data.cart);
      setTotals(data.totals);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string, variantId?: string, quantity = 1) {
    const sessionId = getSessionId();
    
    const response = await fetch(`${apiBaseUrl}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity, sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to cart');
    }

    await loadCart();
    setIsOpen(true); // Open cart drawer
  }

  async function updateQuantity(itemId: string, quantity: number) {
    await fetch(`${apiBaseUrl}/cart/item/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });
    await loadCart();
  }

  async function removeItem(itemId: string) {
    await fetch(`${apiBaseUrl}/cart/item/${itemId}`, {
      method: 'DELETE'
    });
    await loadCart();
  }

  async function applyDiscount(code: string) {
    const response = await fetch(`${apiBaseUrl}/cart/discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartId: cart?.id })
    });
    
    const result = await response.json();
    if (result.success) {
      await loadCart();
    }
    return result;
  }

  async function clearCart() {
    if (!cart) return;
    await fetch(`${apiBaseUrl}/cart/${cart.id}`, { method: 'DELETE' });
    await loadCart();
  }

  return (
    <CartContext.Provider value={{
      cart,
      totals,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      applyDiscount,
      clearCart,
      isOpen,
      setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

// ============= Product Grid =============

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  onProductClick?: (product: Product) => void;
}

export function ProductGrid({ 
  products, 
  columns = 3,
  onProductClick 
}: ProductGridProps) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${colClass[columns]} gap-4 md:gap-6`}>
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onClick={() => onProductClick?.(product)}
        />
      ))}
    </div>
  );
}

// ============= Product Card =============

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.base_price / product.compare_at_price!) * 100)
    : 0;

  return (
    <div 
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>

        {/* Quick add button */}
        {!product.options?.length && (
          <button
            onClick={handleAddToCart}
            disabled={adding || product.quantity <= 0}
            className="absolute bottom-2 right-2 bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-400"
          >
            {adding ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <span>+</span>
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold">
            ${product.base_price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              ${product.compare_at_price?.toFixed(2)}
            </span>
          )}
        </div>
        {product.quantity <= 0 && (
          <span className="text-xs text-red-500">Out of stock</span>
        )}
      </div>
    </div>
  );
}

// ============= Cart Drawer =============

export function CartDrawer() {
  const { cart, totals, isOpen, setIsOpen, removeItem, updateQuantity } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            Your Cart ({totals?.itemCount || 0})
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {!cart?.items?.length ? (
            <p className="text-center text-gray-500 py-8">
              Your cart is empty
            </p>
          ) : (
            <ul className="space-y-4">
              {cart.items.map(item => (
                <CartItemRow 
                  key={item.id} 
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart?.items?.length > 0 && totals && (
          <div className="border-t p-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>
            
            <a
              href="/checkout"
              className="block w-full bg-black text-white text-center py-3 rounded-lg font-medium hover:bg-gray-800"
            >
              Checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}

// ============= Cart Item Row =============

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  const imageUrl = item.variant?.image_url || item.product?.images?.[0];
  const variantLabel = item.variant?.options 
    ? Object.values(item.variant.options).join(' / ')
    : null;

  return (
    <li className="flex gap-4">
      {/* Image */}
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            ?
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">
          {item.product?.name || 'Product'}
        </h4>
        {variantLabel && (
          <p className="text-xs text-gray-500">{variantLabel}</p>
        )}
        <p className="text-sm font-bold mt-1">
          ${(item.unit_price * item.quantity).toFixed(2)}
        </p>
        
        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="w-6 h-6 border rounded text-sm hover:bg-gray-100"
          >
            −
          </button>
          <span className="text-sm w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-6 h-6 border rounded text-sm hover:bg-gray-100"
          >
            +
          </button>
          <button
            onClick={onRemove}
            className="ml-2 text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

// ============= Cart Icon Button =============

export function CartIconButton() {
  const { totals, setIsOpen } = useCart();
  
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="relative p-2 hover:bg-gray-100 rounded"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="w-6 h-6"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      {(totals?.itemCount || 0) > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {totals?.itemCount}
        </span>
      )}
    </button>
  );
}

// ============= Checkout Form =============

interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => Promise<void>;
}

interface CheckoutData {
  email: string;
  phone?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  sameAsBilling: boolean;
  billingAddress?: CheckoutData['shippingAddress'];
  notes?: string;
}

export function CheckoutForm({ onSubmit }: CheckoutFormProps) {
  const { cart, totals } = useCart();
  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data: CheckoutData = {
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      shippingAddress: {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address1: formData.get('address1') as string,
        address2: formData.get('address2') as string || undefined,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        postalCode: formData.get('postalCode') as string,
        country: formData.get('country') as string,
      },
      sameAsBilling,
      notes: formData.get('notes') as string || undefined,
    };
    
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div className="space-y-4">
        <h3 className="font-bold">Contact Information</h3>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full p-3 border rounded"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone (optional)"
          className="w-full p-3 border rounded"
        />
      </div>
      
      {/* Shipping Address */}
      <div className="space-y-4">
        <h3 className="font-bold">Shipping Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            name="firstName"
            required
            placeholder="First name"
            className="p-3 border rounded"
          />
          <input
            name="lastName"
            required
            placeholder="Last name"
            className="p-3 border rounded"
          />
        </div>
        <input
          name="address1"
          required
          placeholder="Address"
          className="w-full p-3 border rounded"
        />
        <input
          name="address2"
          placeholder="Apartment, suite, etc. (optional)"
          className="w-full p-3 border rounded"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            name="city"
            required
            placeholder="City"
            className="p-3 border rounded"
          />
          <input
            name="state"
            required
            placeholder="State"
            className="p-3 border rounded"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            name="postalCode"
            required
            placeholder="Postal code"
            className="p-3 border rounded"
          />
          <select
            name="country"
            required
            className="p-3 border rounded"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>
      
      {/* Billing same as shipping */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={sameAsBilling}
          onChange={e => setSameAsBilling(e.target.checked)}
        />
        Billing address same as shipping
      </label>
      
      {/* Notes */}
      <div>
        <label className="block font-medium mb-2">Order Notes (optional)</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Any special instructions..."
          className="w-full p-3 border rounded"
        />
      </div>
      
      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : `Pay $${totals?.total.toFixed(2)}`}
      </button>
    </form>
  );
}
```

---

### Task 6: API Routes (2 hours)

```typescript
// src/app/api/modules/ecommerce/route.ts

import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/modules/ecommerce/services/product-service';
import { getTenantFromRequest } from '@/lib/modules/multi-tenant/tenant-middleware';

export async function GET(request: Request) {
  const { siteId, agencyId } = await getTenantFromRequest(request);
  const url = new URL(request.url);
  
  const productService = new ProductService(siteId, agencyId);
  
  const filters = {
    category: url.searchParams.get('category') || undefined,
    status: url.searchParams.get('status') || undefined,
    search: url.searchParams.get('search') || undefined,
    featured: url.searchParams.get('featured') === 'true',
    inStock: url.searchParams.get('in_stock') === 'true',
    minPrice: url.searchParams.get('min_price') ? Number(url.searchParams.get('min_price')) : undefined,
    maxPrice: url.searchParams.get('max_price') ? Number(url.searchParams.get('max_price')) : undefined,
  };
  
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 20;
  
  const result = await productService.getProducts(filters, page, limit);
  
  return NextResponse.json(result);
}
```

```typescript
// src/app/api/modules/ecommerce/cart/route.ts

import { NextResponse } from 'next/server';
import { CartService } from '@/lib/modules/ecommerce/services/cart-service';
import { getTenantFromRequest } from '@/lib/modules/multi-tenant/tenant-middleware';

export async function GET(request: Request) {
  const { siteId } = await getTenantFromRequest(request);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  
  const cartService = new CartService(siteId);
  const cart = await cartService.getOrCreateCart(undefined, sessionId || undefined);
  const totals = await cartService.calculateTotals(cart.id);
  
  return NextResponse.json({ cart, totals });
}
```

```typescript
// src/app/api/modules/ecommerce/cart/add/route.ts

import { NextResponse } from 'next/server';
import { CartService } from '@/lib/modules/ecommerce/services/cart-service';
import { getTenantFromRequest } from '@/lib/modules/multi-tenant/tenant-middleware';

export async function POST(request: Request) {
  const { siteId } = await getTenantFromRequest(request);
  const { productId, variantId, quantity, sessionId } = await request.json();
  
  const cartService = new CartService(siteId);
  const cart = await cartService.getOrCreateCart(undefined, sessionId);
  
  try {
    const item = await cartService.addItem(cart.id, productId, variantId, quantity);
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
```

```typescript
// src/app/api/modules/ecommerce/checkout/route.ts

import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/modules/ecommerce/services/order-service';
import { getTenantFromRequest } from '@/lib/modules/multi-tenant/tenant-middleware';

export async function POST(request: Request) {
  const { siteId, agencyId } = await getTenantFromRequest(request);
  const body = await request.json();
  
  const orderService = new OrderService(siteId, agencyId);
  
  try {
    // Create order
    const order = await orderService.createOrder({
      cartId: body.cartId,
      customerEmail: body.email,
      customerPhone: body.phone,
      shippingAddress: body.shippingAddress,
      billingAddress: body.sameAsBilling ? body.shippingAddress : body.billingAddress,
      shippingMethod: body.shippingMethod,
      shippingAmount: body.shippingAmount,
      customerNotes: body.notes
    });
    
    // Create payment intent
    const { clientSecret } = await orderService.createPaymentIntent(order.id);
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      clientSecret
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
```

```typescript
// src/app/api/modules/ecommerce/webhooks/stripe/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { OrderService } from '@/lib/modules/ecommerce/services/order-service';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { site_id: siteId } = paymentIntent.metadata;
      
      // Get agency_id from site
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: site } = await supabase
        .from('sites')
        .select('agency_id')
        .eq('id', siteId)
        .single();
      
      if (site) {
        const orderService = new OrderService(siteId, site.agency_id);
        await orderService.confirmPayment(paymentIntent.id);
      }
      break;
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Handle failed payment - update order status
      console.error('Payment failed:', paymentIntent.id);
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}
```

---

## ✅ Verification Checklist

- [ ] Products can be created with variants
- [ ] Categories work correctly
- [ ] Cart persists across sessions
- [ ] Discount codes apply correctly
- [ ] Checkout creates order
- [ ] Stripe payment works
- [ ] Inventory decreases on purchase
- [ ] Orders can be managed
- [ ] Refunds process correctly
- [ ] Widget embeds on sites

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05 (naming), EM-40 (multi-tenant)
- **Required by**: External websites, revenue features
- **External**: Stripe API
