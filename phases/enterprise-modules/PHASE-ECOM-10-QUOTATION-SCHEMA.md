# PHASE-ECOM-10: Quotation Database Schema & Types

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 4-5 hours
> **Prerequisites**: Wave 1 Complete (ECOM-01 to ECOM-05)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the complete database schema and TypeScript types for the quotation system. This phase establishes the foundation for all quote-related functionality by creating four database tables (quotes, quote_items, quote_activities, quote_templates) and approximately 200 lines of TypeScript type definitions that follow the existing e-commerce module patterns.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code (`src/modules/ecommerce/`)
- [ ] Verify Wave 1 phases (ECOM-01 to ECOM-05) are complete
- [ ] Review existing types in `ecommerce-types.ts` (1216 lines)
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUOTATION SYSTEM SCHEMA                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Quote Templates │    │      Quotes       │                  │
│  │   (Reusable)      │───>│   (Per Customer)  │                  │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                    │                             │
│                          ┌────────┴────────┐                    │
│                          │                  │                    │
│                 ┌────────▼────────┐ ┌──────▼───────┐            │
│                 │   Quote Items   │ │  Activities   │            │
│                 │  (Line Items)   │ │   (Audit)     │            │
│                 └─────────────────┘ └──────────────┘            │
│                                                                  │
│  Status Flow:                                                    │
│  draft → pending_approval → sent → viewed → accepted → converted │
│                                   └──────→ rejected              │
│                                   └──────→ expired               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `migrations/ecom-10-quotation-schema.sql` | Create | Database schema for quotes |
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add ~200 lines of quote types |

---

## 📋 Implementation Tasks

### Task 10.1: Create Database Migration

**File**: `next-platform-dashboard/migrations/ecom-10-quotation-schema.sql`
**Action**: Create

**Description**: Create the complete database schema for the quotation system including all four tables, indexes, triggers, and RLS policies.

```sql
-- ============================================================================
-- PHASE-ECOM-10: Quotation System Database Schema
-- ============================================================================
-- This migration creates all tables required for the quotation system:
-- 1. mod_ecommod01_quotes - Main quotes table
-- 2. mod_ecommod01_quote_items - Quote line items
-- 3. mod_ecommod01_quote_activities - Activity/audit log
-- 4. mod_ecommod01_quote_templates - Reusable templates
-- ============================================================================

-- ============================================================================
-- 1. QUOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Quote identification
  quote_number TEXT NOT NULL,
  reference_number TEXT, -- Optional customer/external reference
  
  -- Customer info (can reference existing customer or store info for new)
  customer_id UUID REFERENCES mod_ecommod01_customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  
  -- Addresses (JSONB for flexibility)
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Being created/edited
    'pending_approval', -- Awaiting internal approval
    'sent',            -- Sent to customer
    'viewed',          -- Customer viewed the quote
    'accepted',        -- Customer accepted
    'rejected',        -- Customer rejected
    'expired',         -- Past valid_until date
    'converted',       -- Converted to order
    'cancelled'        -- Cancelled by staff
  )),
  
  -- Financial amounts (stored in smallest currency unit - cents)
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Content fields
  title TEXT,
  introduction TEXT,
  terms_and_conditions TEXT,
  notes_to_customer TEXT,
  internal_notes TEXT,
  
  -- Tracking timestamps
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  responded_at TIMESTAMPTZ,
  response_notes TEXT,
  
  -- Conversion tracking
  converted_to_order_id UUID REFERENCES mod_ecommod01_orders(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  
  -- Access token for customer portal (public link)
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Metadata and audit
  template_id UUID,
  created_by UUID,
  last_modified_by UUID,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(site_id, quote_number),
  UNIQUE(access_token)
);

-- Indexes for quotes table
CREATE INDEX IF NOT EXISTS idx_quotes_site_id ON mod_ecommod01_quotes(site_id);
CREATE INDEX IF NOT EXISTS idx_quotes_agency_id ON mod_ecommod01_quotes(agency_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON mod_ecommod01_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON mod_ecommod01_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON mod_ecommod01_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON mod_ecommod01_quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_access_token ON mod_ecommod01_quotes(access_token);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON mod_ecommod01_quotes(site_id, quote_number);

-- ============================================================================
-- 2. QUOTE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  -- Product reference (optional - allows custom line items without product)
  product_id UUID REFERENCES mod_ecommod01_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Item details (snapshot at time of quote creation)
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  image_url TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  tax_rate DECIMAL(5,2) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  line_total DECIMAL(12,2) NOT NULL,
  
  -- Product options (for variants)
  options JSONB DEFAULT '{}',
  
  -- Sorting
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON mod_ecommod01_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON mod_ecommod01_quote_items(product_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_sort_order ON mod_ecommod01_quote_items(quote_id, sort_order);

-- ============================================================================
-- 3. QUOTE ACTIVITIES TABLE (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',          -- Quote created
    'updated',          -- Quote details updated
    'sent',             -- Quote sent to customer
    'viewed',           -- Customer viewed quote
    'accepted',         -- Customer accepted quote
    'rejected',         -- Customer rejected quote
    'expired',          -- Quote expired
    'converted',        -- Converted to order
    'cancelled',        -- Quote cancelled
    'note_added',       -- Internal note added
    'reminder_sent',    -- Reminder email sent
    'item_added',       -- Line item added
    'item_removed',     -- Line item removed
    'item_updated',     -- Line item updated
    'status_changed',   -- Status changed
    'resent',           -- Quote resent to customer
    'duplicated'        -- Quote duplicated
  )),
  
  -- Activity details
  description TEXT NOT NULL,
  
  -- Tracking info
  performed_by UUID,
  performed_by_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Additional context
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote activities
CREATE INDEX IF NOT EXISTS idx_quote_activities_quote_id ON mod_ecommod01_quote_activities(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_activities_type ON mod_ecommod01_quote_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_quote_activities_created_at ON mod_ecommod01_quote_activities(created_at DESC);

-- ============================================================================
-- 4. QUOTE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Template identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- Default content
  default_title TEXT,
  default_introduction TEXT,
  default_terms TEXT,
  default_notes TEXT,
  default_validity_days INTEGER DEFAULT 30 CHECK (default_validity_days > 0),
  
  -- Pre-filled items (JSONB array of item templates)
  items JSONB DEFAULT '[]',
  
  -- Default discount (optional)
  default_discount_type TEXT CHECK (default_discount_type IN ('percentage', 'fixed')),
  default_discount_value DECIMAL(10,2) DEFAULT 0,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote templates
CREATE INDEX IF NOT EXISTS idx_quote_templates_site_id ON mod_ecommod01_quote_templates(site_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_agency_id ON mod_ecommod01_quote_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_active ON mod_ecommod01_quote_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_default ON mod_ecommod01_quote_templates(site_id, is_default);

-- ============================================================================
-- 5. QUOTE SETTINGS TABLE (Site-specific settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE UNIQUE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Quote numbering
  quote_number_prefix TEXT DEFAULT 'QUO-',
  quote_number_counter INTEGER DEFAULT 1000,
  quote_number_format TEXT DEFAULT '{prefix}{counter}', -- e.g., QUO-1001
  
  -- Default settings
  default_validity_days INTEGER DEFAULT 30,
  default_terms TEXT,
  default_currency TEXT DEFAULT 'USD',
  
  -- Automation settings
  auto_expire_enabled BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_days_before_expiry INTEGER DEFAULT 3,
  
  -- Email settings
  send_copy_to_admin BOOLEAN DEFAULT true,
  admin_notification_email TEXT,
  
  -- PDF branding
  pdf_logo_url TEXT,
  pdf_header_color TEXT DEFAULT '#1f2937',
  pdf_show_bank_details BOOLEAN DEFAULT false,
  pdf_bank_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quotes table
DROP TRIGGER IF EXISTS trigger_quotes_updated_at ON mod_ecommod01_quotes;
CREATE TRIGGER trigger_quotes_updated_at
  BEFORE UPDATE ON mod_ecommod01_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- Trigger for quote items table
DROP TRIGGER IF EXISTS trigger_quote_items_updated_at ON mod_ecommod01_quote_items;
CREATE TRIGGER trigger_quote_items_updated_at
  BEFORE UPDATE ON mod_ecommod01_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- Trigger for quote templates table
DROP TRIGGER IF EXISTS trigger_quote_templates_updated_at ON mod_ecommod01_quote_templates;
CREATE TRIGGER trigger_quote_templates_updated_at
  BEFORE UPDATE ON mod_ecommod01_quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- Trigger for quote settings table
DROP TRIGGER IF EXISTS trigger_quote_settings_updated_at ON mod_ecommod01_quote_settings;
CREATE TRIGGER trigger_quote_settings_updated_at
  BEFORE UPDATE ON mod_ecommod01_quote_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE mod_ecommod01_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_settings ENABLE ROW LEVEL SECURITY;

-- Quotes policies
DROP POLICY IF EXISTS quotes_site_isolation ON mod_ecommod01_quotes;
CREATE POLICY quotes_site_isolation ON mod_ecommod01_quotes
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Public access for customer portal (by access_token - handled in app code)
DROP POLICY IF EXISTS quotes_public_view ON mod_ecommod01_quotes;
CREATE POLICY quotes_public_view ON mod_ecommod01_quotes
  FOR SELECT USING (true);

-- Quote items policies
DROP POLICY IF EXISTS quote_items_site_isolation ON mod_ecommod01_quote_items;
CREATE POLICY quote_items_site_isolation ON mod_ecommod01_quote_items
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM mod_ecommod01_quotes WHERE site_id IN (
        SELECT id FROM sites WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Quote activities policies
DROP POLICY IF EXISTS quote_activities_site_isolation ON mod_ecommod01_quote_activities;
CREATE POLICY quote_activities_site_isolation ON mod_ecommod01_quote_activities
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM mod_ecommod01_quotes WHERE site_id IN (
        SELECT id FROM sites WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Quote templates policies
DROP POLICY IF EXISTS quote_templates_site_isolation ON mod_ecommod01_quote_templates;
CREATE POLICY quote_templates_site_isolation ON mod_ecommod01_quote_templates
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Quote settings policies
DROP POLICY IF EXISTS quote_settings_site_isolation ON mod_ecommod01_quote_settings;
CREATE POLICY quote_settings_site_isolation ON mod_ecommod01_quote_settings
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_quotes IS 'E-commerce quotations/proposals sent to customers';
COMMENT ON TABLE mod_ecommod01_quote_items IS 'Line items within a quote';
COMMENT ON TABLE mod_ecommod01_quote_activities IS 'Activity log for quote auditing';
COMMENT ON TABLE mod_ecommod01_quote_templates IS 'Reusable quote templates';
COMMENT ON TABLE mod_ecommod01_quote_settings IS 'Site-specific quote settings';

COMMENT ON COLUMN mod_ecommod01_quotes.access_token IS 'Unique token for customer portal access';
COMMENT ON COLUMN mod_ecommod01_quotes.status IS 'Quote workflow status';
COMMENT ON COLUMN mod_ecommod01_quote_items.line_total IS 'Calculated: (quantity * unit_price) - discount + tax';
```

---

### Task 10.2: Add Quote Types to ecommerce-types.ts

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Append to end of file)

**Description**: Add all TypeScript type definitions for the quotation system following the existing patterns in the file.

```typescript
// ============================================================================
// QUOTATION SYSTEM TYPES (Phase ECOM-10)
// ============================================================================

/**
 * Quote status union type
 * Represents all possible states in the quote workflow
 */
export type QuoteStatus = 
  | 'draft'           // Being created or edited
  | 'pending_approval' // Awaiting internal approval
  | 'sent'            // Sent to customer
  | 'viewed'          // Customer has viewed
  | 'accepted'        // Customer accepted
  | 'rejected'        // Customer rejected
  | 'expired'         // Past validity date
  | 'converted'       // Converted to order
  | 'cancelled'       // Cancelled by staff

/**
 * Quote activity types for audit logging
 */
export type QuoteActivityType =
  | 'created'
  | 'updated'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'cancelled'
  | 'note_added'
  | 'reminder_sent'
  | 'item_added'
  | 'item_removed'
  | 'item_updated'
  | 'status_changed'
  | 'resent'
  | 'duplicated'

/**
 * Quote discount type
 */
export type QuoteDiscountType = 'percentage' | 'fixed'

/**
 * Main Quote interface
 */
export interface Quote {
  id: string
  site_id: string
  agency_id: string
  
  // Identification
  quote_number: string
  reference_number?: string | null
  
  // Customer
  customer_id?: string | null
  customer_email: string
  customer_name: string
  customer_company?: string | null
  customer_phone?: string | null
  
  // Addresses
  billing_address?: Address | null
  shipping_address?: Address | null
  
  // Status
  status: QuoteStatus
  
  // Amounts
  subtotal: number
  discount_type?: QuoteDiscountType | null
  discount_value: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  shipping_amount: number
  total: number
  currency: string
  
  // Validity
  valid_from: string
  valid_until?: string | null
  
  // Content
  title?: string | null
  introduction?: string | null
  terms_and_conditions?: string | null
  notes_to_customer?: string | null
  internal_notes?: string | null
  
  // Tracking
  sent_at?: string | null
  viewed_at?: string | null
  first_viewed_at?: string | null
  view_count: number
  responded_at?: string | null
  response_notes?: string | null
  
  // Conversion
  converted_to_order_id?: string | null
  converted_at?: string | null
  
  // Access
  access_token: string
  
  // Metadata
  template_id?: string | null
  created_by?: string | null
  last_modified_by?: string | null
  metadata: Record<string, unknown>
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  items?: QuoteItem[]
  activities?: QuoteActivity[]
  customer?: Customer | null
}

/**
 * Quote line item interface
 */
export interface QuoteItem {
  id: string
  quote_id: string
  
  // Product reference
  product_id?: string | null
  variant_id?: string | null
  
  // Item details (snapshot)
  name: string
  sku?: string | null
  description?: string | null
  image_url?: string | null
  
  // Pricing
  quantity: number
  unit_price: number
  discount_percent: number
  tax_rate: number
  line_total: number
  
  // Options
  options: Record<string, string>
  
  // Sorting
  sort_order: number
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  product?: Product | null
  variant?: ProductVariant | null
}

/**
 * Quote activity/audit log interface
 */
export interface QuoteActivity {
  id: string
  quote_id: string
  
  activity_type: QuoteActivityType
  description: string
  
  // Tracking
  performed_by?: string | null
  performed_by_name?: string | null
  ip_address?: string | null
  user_agent?: string | null
  
  // Change tracking
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  metadata: Record<string, unknown>
  
  created_at: string
}

/**
 * Quote template interface
 */
export interface QuoteTemplate {
  id: string
  site_id: string
  agency_id: string
  
  // Identification
  name: string
  description?: string | null
  
  // Default content
  default_title?: string | null
  default_introduction?: string | null
  default_terms?: string | null
  default_notes?: string | null
  default_validity_days: number
  
  // Pre-filled items
  items: QuoteTemplateItem[]
  
  // Default discount
  default_discount_type?: QuoteDiscountType | null
  default_discount_value: number
  
  // Settings
  is_default: boolean
  is_active: boolean
  
  // Usage
  use_count: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Template item structure (stored in JSONB)
 */
export interface QuoteTemplateItem {
  product_id?: string | null
  variant_id?: string | null
  name: string
  sku?: string | null
  description?: string | null
  quantity: number
  unit_price: number
  discount_percent?: number
}

/**
 * Quote settings interface (site-specific)
 */
export interface QuoteSettings {
  id: string
  site_id: string
  agency_id: string
  
  // Numbering
  quote_number_prefix: string
  quote_number_counter: number
  quote_number_format: string
  
  // Defaults
  default_validity_days: number
  default_terms?: string | null
  default_currency: string
  
  // Automation
  auto_expire_enabled: boolean
  reminder_enabled: boolean
  reminder_days_before_expiry: number
  
  // Email
  send_copy_to_admin: boolean
  admin_notification_email?: string | null
  
  // PDF branding
  pdf_logo_url?: string | null
  pdf_header_color: string
  pdf_show_bank_details: boolean
  pdf_bank_details?: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ============================================================================
// QUOTE INPUT/UPDATE TYPES
// ============================================================================

/**
 * Input type for creating a quote
 */
export interface QuoteInput {
  site_id: string
  agency_id: string
  
  // Optional reference
  reference_number?: string
  
  // Customer
  customer_id?: string
  customer_email: string
  customer_name: string
  customer_company?: string
  customer_phone?: string
  
  // Addresses
  billing_address?: Address
  shipping_address?: Address
  
  // Amounts (auto-calculated but can be overridden)
  discount_type?: QuoteDiscountType
  discount_value?: number
  tax_rate?: number
  shipping_amount?: number
  currency?: string
  
  // Validity
  valid_from?: string
  valid_until?: string
  
  // Content
  title?: string
  introduction?: string
  terms_and_conditions?: string
  notes_to_customer?: string
  internal_notes?: string
  
  // Template reference
  template_id?: string
  
  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * Input type for updating a quote
 */
export type QuoteUpdate = Partial<Omit<QuoteInput, 'site_id' | 'agency_id'>>

/**
 * Input type for creating a quote item
 */
export interface QuoteItemInput {
  quote_id: string
  
  // Product reference (optional)
  product_id?: string
  variant_id?: string
  
  // Item details
  name: string
  sku?: string
  description?: string
  image_url?: string
  
  // Pricing
  quantity: number
  unit_price: number
  discount_percent?: number
  tax_rate?: number
  
  // Options
  options?: Record<string, string>
  
  // Sorting
  sort_order?: number
}

/**
 * Input type for updating a quote item
 */
export type QuoteItemUpdate = Partial<Omit<QuoteItemInput, 'quote_id'>>

/**
 * Input type for creating a template
 */
export interface QuoteTemplateInput {
  site_id: string
  agency_id: string
  
  name: string
  description?: string
  
  default_title?: string
  default_introduction?: string
  default_terms?: string
  default_notes?: string
  default_validity_days?: number
  
  items?: QuoteTemplateItem[]
  
  default_discount_type?: QuoteDiscountType
  default_discount_value?: number
  
  is_default?: boolean
  is_active?: boolean
}

/**
 * Input type for updating a template
 */
export type QuoteTemplateUpdate = Partial<Omit<QuoteTemplateInput, 'site_id' | 'agency_id'>>

/**
 * Input type for quote settings
 */
export type QuoteSettingsInput = Omit<QuoteSettings, 'id' | 'created_at' | 'updated_at'>
export type QuoteSettingsUpdate = Partial<Omit<QuoteSettingsInput, 'site_id' | 'agency_id'>>

// ============================================================================
// QUOTE FILTER & LIST TYPES
// ============================================================================

/**
 * Quote table filter interface
 */
export interface QuoteTableFilters {
  search: string
  status: QuoteStatus | 'all'
  dateFrom: string | null
  dateTo: string | null
  expiresFrom: string | null
  expiresTo: string | null
  minTotal: number | null
  maxTotal: number | null
  customerId: string | null
  hasExpired: boolean | null
}

/**
 * Quote with extended data (for detail view)
 */
export interface QuoteDetailData extends Quote {
  items: QuoteItem[]
  activities: QuoteActivity[]
  customer: Customer | null
}

/**
 * Quote summary for list view
 */
export interface QuoteSummary {
  id: string
  quote_number: string
  customer_name: string
  customer_company?: string | null
  customer_email: string
  status: QuoteStatus
  total: number
  currency: string
  valid_until?: string | null
  items_count: number
  created_at: string
  updated_at: string
}

/**
 * Quote stats for dashboard
 */
export interface QuoteStats {
  total: number
  draft: number
  pending: number
  sent: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  totalValue: number
  acceptedValue: number
  conversionRate: number
  averageValue: number
}

// ============================================================================
// QUOTE BULK ACTION TYPES
// ============================================================================

/**
 * Available bulk actions for quotes
 */
export type QuoteBulkActionType = 
  | 'send'
  | 'mark_expired'
  | 'delete'
  | 'export'
  | 'duplicate'

/**
 * Bulk action input
 */
export interface QuoteBulkAction {
  action: QuoteBulkActionType
  quoteIds: string[]
  params?: Record<string, unknown>
}

// ============================================================================
// QUOTE WORKFLOW TYPES
// ============================================================================

/**
 * Valid status transitions
 */
export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['pending_approval', 'sent', 'cancelled'],
  pending_approval: ['sent', 'draft', 'cancelled'],
  sent: ['viewed', 'accepted', 'rejected', 'expired', 'cancelled'],
  viewed: ['accepted', 'rejected', 'expired'],
  accepted: ['converted', 'cancelled'],
  rejected: [], // Final state (can duplicate)
  expired: [], // Final state (can duplicate)
  converted: [], // Final state
  cancelled: ['draft'] // Can reopen as draft
}

/**
 * Quote status config for UI display
 */
export interface QuoteStatusConfig {
  label: string
  color: string
  bgColor: string
  description: string
  allowedTransitions: QuoteStatus[]
}

/**
 * Send quote input
 */
export interface SendQuoteInput {
  quoteId: string
  recipientEmail: string
  subject: string
  message: string
  includePdf: boolean
  ccEmails?: string[]
}

/**
 * Quote response from customer
 */
export interface QuoteResponse {
  quoteId: string
  action: 'accept' | 'reject'
  notes?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Quote to order conversion input
 */
export interface QuoteToOrderInput {
  quoteId: string
  paymentStatus?: PaymentStatus
  additionalNotes?: string
  sendOrderConfirmation?: boolean
}

/**
 * Quote email template variables
 */
export interface QuoteEmailVariables {
  quote_number: string
  customer_name: string
  customer_email: string
  company_name?: string
  quote_total: string
  currency: string
  valid_until: string
  items_count: number
  quote_url: string
  store_name: string
  store_email: string
  store_phone?: string
}

// ============================================================================
// QUOTE PDF TYPES
// ============================================================================

/**
 * PDF generation options
 */
export interface QuotePdfOptions {
  includeImages: boolean
  includeTerms: boolean
  showDiscounts: boolean
  showTaxBreakdown: boolean
  paperSize: 'a4' | 'letter'
  orientation: 'portrait' | 'landscape'
}

/**
 * PDF data structure
 */
export interface QuotePdfData {
  quote: Quote
  items: QuoteItem[]
  store: {
    name: string
    email: string
    phone?: string
    address?: string
    logo?: string
    website?: string
  }
  settings: QuoteSettings
}
```

---

## 🗄️ Database Migrations

See Task 10.1 above for the complete migration file.

**To Apply Migration:**
1. Copy the SQL content to `next-platform-dashboard/migrations/ecom-10-quotation-schema.sql`
2. Run migration via Supabase Dashboard SQL Editor or CLI:
```bash
# Using Supabase CLI
supabase db push

# Or via dashboard: Copy/paste SQL into SQL Editor and run
```

---

## 🔧 Type Definitions

See Task 10.2 above for complete type definitions to append to `ecommerce-types.ts`.

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors: `npx eslint src/modules/ecommerce/types/`
- [ ] Migration applies without errors in Supabase
- [ ] All 5 tables created: quotes, quote_items, quote_activities, quote_templates, quote_settings
- [ ] Indexes created successfully
- [ ] RLS policies active
- [ ] Triggers working (test updated_at auto-update)
- [ ] Types exported correctly from ecommerce-types.ts

**Manual Database Verification:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'mod_ecommod01_quote%';

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'mod_ecommod01_quote%';

-- Test insert (then delete)
INSERT INTO mod_ecommod01_quotes (
  site_id, agency_id, quote_number, customer_email, customer_name
) VALUES (
  'test-site-id', 'test-agency-id', 'TEST-001', 'test@example.com', 'Test Customer'
);

-- Verify updated_at trigger
UPDATE mod_ecommod01_quotes SET title = 'Test' WHERE quote_number = 'TEST-001';
SELECT updated_at FROM mod_ecommod01_quotes WHERE quote_number = 'TEST-001';

-- Cleanup
DELETE FROM mod_ecommod01_quotes WHERE quote_number = 'TEST-001';
```

---

## 🔄 Rollback Plan

If issues occur:

1. **Rollback Database:**
```sql
-- Drop tables in reverse order (respects foreign keys)
DROP TABLE IF EXISTS mod_ecommod01_quote_settings CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_quote_activities CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_quote_items CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_quote_templates CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_quotes CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_quote_updated_at() CASCADE;
```

2. **Rollback Types:**
   - Remove all lines added after the comment `// QUOTATION SYSTEM TYPES (Phase ECOM-10)`
   - Restore from git: `git checkout src/modules/ecommerce/types/ecommerce-types.ts`

3. **Verify Clean State:**
```bash
npx tsc --noEmit
```

---

## 📝 Memory Bank Updates

After completion, update these files:

**activeContext.md:**
```markdown
### Phase ECOM-10 Complete (Date)
- ✅ Created quotation database schema (5 tables)
- ✅ Added ~200 lines of TypeScript types
- ✅ Migration applied successfully
- ✅ RLS policies configured
```

**progress.md:**
```markdown
| ECOM-10 | Quotation Database Schema & Types | ✅ Complete |
```

---

## ✨ Success Criteria

- [ ] All 5 database tables created and accessible
- [ ] All TypeScript types compile without errors
- [ ] Types follow existing patterns (Address, Status configs, etc.)
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] RLS policies properly isolate data by site/agency
- [ ] Triggers automatically update `updated_at` timestamps
- [ ] Foreign key relationships properly established
- [ ] All indexes created for query optimization
- [ ] No `any` types used in type definitions
- [ ] Types are properly exported for use in other files
