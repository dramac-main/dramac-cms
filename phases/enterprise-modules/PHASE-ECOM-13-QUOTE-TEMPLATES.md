# PHASE-ECOM-13: Quote Templates & Automation

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 6-8 hours
> **Prerequisites**: PHASE-ECOM-12 (Quote Workflow complete)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement quote templates for rapid quote creation, template management UI, and automation features including auto-expiration, scheduled reminders, and quote analytics. This phase enables efficient quote workflows and provides insights into quote performance.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Verify PHASE-ECOM-12 complete (workflow working)
- [ ] Review existing settings patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│              QUOTE TEMPLATES & AUTOMATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Database:                                                       │
│  └── mod_ecommod01_quote_templates    # Template storage        │
│                                                                  │
│  Server Actions:                                                 │
│  └── quote-template-actions.ts        # Template CRUD           │
│                                                                  │
│  Components:                                                     │
│  ├── quote-template-list.tsx          # Template management     │
│  ├── quote-template-dialog.tsx        # Create/edit template    │
│  ├── quote-template-selector.tsx      # Select template         │
│  └── quote-settings-tab.tsx           # Quote settings UI       │
│                                                                  │
│  Automation:                                                     │
│  ├── quote-automation.ts              # Cron job functions      │
│  └── quote-analytics.ts               # Analytics utilities     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `migrations/XXXX_quote_templates.sql` | Create | Templates table |
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add template types |
| `src/modules/ecommerce/actions/quote-template-actions.ts` | Create | Template CRUD |
| `src/modules/ecommerce/lib/quote-automation.ts` | Create | Automation utilities |
| `src/modules/ecommerce/lib/quote-analytics.ts` | Create | Analytics functions |
| `src/modules/ecommerce/components/quotes/quote-template-list.tsx` | Create | Template list |
| `src/modules/ecommerce/components/quotes/quote-template-dialog.tsx` | Create | Template editor |
| `src/modules/ecommerce/components/quotes/quote-template-selector.tsx` | Create | Template picker |
| `src/modules/ecommerce/components/settings/quote-settings-tab.tsx` | Create | Settings UI |
| `src/modules/ecommerce/components/quotes/index.ts` | Modify | Add exports |
| `src/modules/ecommerce/components/ecommerce-settings.tsx` | Modify | Add quote settings |

---

## 📋 Implementation Tasks

### Task 13.1: Create Quote Templates Table Migration

**File**: `migrations/XXXX_quote_templates.sql`
**Action**: Create

```sql
-- ============================================================================
-- QUOTE TEMPLATES TABLE
-- Phase ECOM-13: Quote Templates & Automation
-- ============================================================================

-- Quote templates table
CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Template content
  title_template VARCHAR(255),
  introduction_template TEXT,
  terms_and_conditions TEXT,
  notes_template TEXT,
  
  -- Default pricing
  default_discount_type VARCHAR(20) DEFAULT 'percentage',
  default_discount_value DECIMAL(10, 2) DEFAULT 0,
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  default_validity_days INTEGER DEFAULT 30,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Template items (predefined line items)
  default_items JSONB DEFAULT '[]'::jsonb,
  
  -- Appearance
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  show_company_logo BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote settings table (per-site configuration)
CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Numbering
  quote_number_prefix VARCHAR(20) DEFAULT 'QT-',
  quote_number_padding INTEGER DEFAULT 5,
  next_quote_number INTEGER DEFAULT 1,
  
  -- Defaults
  default_validity_days INTEGER DEFAULT 30,
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  default_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Auto-actions
  auto_expire_enabled BOOLEAN DEFAULT TRUE,
  auto_reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_days_before INTEGER DEFAULT 3,
  max_reminders INTEGER DEFAULT 2,
  
  -- Email settings
  send_acceptance_notification BOOLEAN DEFAULT TRUE,
  send_rejection_notification BOOLEAN DEFAULT TRUE,
  cc_email_on_send VARCHAR(255),
  
  -- Branding
  company_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  
  -- Default content
  default_introduction TEXT,
  default_terms TEXT,
  default_footer TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quote_templates_site ON mod_ecommod01_quote_templates(site_id);
CREATE INDEX idx_quote_templates_active ON mod_ecommod01_quote_templates(site_id, is_active);
CREATE INDEX idx_quote_settings_site ON mod_ecommod01_quote_settings(site_id);

-- Trigger for updated_at
CREATE TRIGGER update_quote_templates_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_quote_settings_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE mod_ecommod01_quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_settings ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Templates viewable by site members"
  ON mod_ecommod01_quote_templates FOR SELECT
  USING (site_id IN (SELECT site_id FROM site_members WHERE user_id = auth.uid()));

CREATE POLICY "Templates manageable by site admins"
  ON mod_ecommod01_quote_templates FOR ALL
  USING (site_id IN (
    SELECT site_id FROM site_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'editor')
  ));

-- Settings policies
CREATE POLICY "Settings viewable by site members"
  ON mod_ecommod01_quote_settings FOR SELECT
  USING (site_id IN (SELECT site_id FROM site_members WHERE user_id = auth.uid()));

CREATE POLICY "Settings manageable by site admins"
  ON mod_ecommod01_quote_settings FOR ALL
  USING (site_id IN (
    SELECT site_id FROM site_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Comments
COMMENT ON TABLE mod_ecommod01_quote_templates IS 'Reusable quote templates for quick quote creation';
COMMENT ON TABLE mod_ecommod01_quote_settings IS 'Per-site quote configuration and defaults';
```

---

### Task 13.2: Add Template Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (add to existing file)

**Description**: Add TypeScript types for templates and settings.

```typescript
// ============================================================================
// QUOTE TEMPLATE TYPES
// Phase ECOM-13: Quote Templates & Automation
// ============================================================================

/**
 * Quote Template - Reusable template for creating quotes
 */
export interface QuoteTemplate {
  id: string
  site_id: string
  agency_id: string
  
  // Template info
  name: string
  description: string | null
  is_default: boolean
  is_active: boolean
  
  // Template content
  title_template: string | null
  introduction_template: string | null
  terms_and_conditions: string | null
  notes_template: string | null
  
  // Default pricing
  default_discount_type: 'percentage' | 'fixed'
  default_discount_value: number
  default_tax_rate: number
  default_validity_days: number
  currency: string
  
  // Template items
  default_items: QuoteTemplateItem[]
  
  // Appearance
  primary_color: string
  show_company_logo: boolean
  
  // Metadata
  usage_count: number
  last_used_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Quote Template Item - Default line item in template
 */
export interface QuoteTemplateItem {
  name: string
  description?: string
  sku?: string
  quantity: number
  unit_price: number
  product_id?: string // Optional link to existing product
}

/**
 * Quote Template Input - For creating/updating templates
 */
export interface QuoteTemplateInput {
  site_id: string
  agency_id: string
  name: string
  description?: string
  is_default?: boolean
  is_active?: boolean
  title_template?: string
  introduction_template?: string
  terms_and_conditions?: string
  notes_template?: string
  default_discount_type?: 'percentage' | 'fixed'
  default_discount_value?: number
  default_tax_rate?: number
  default_validity_days?: number
  currency?: string
  default_items?: QuoteTemplateItem[]
  primary_color?: string
  show_company_logo?: boolean
}

/**
 * Quote Settings - Site-level quote configuration
 */
export interface QuoteSettings {
  id: string
  site_id: string
  
  // Numbering
  quote_number_prefix: string
  quote_number_padding: number
  next_quote_number: number
  
  // Defaults
  default_validity_days: number
  default_tax_rate: number
  default_currency: string
  
  // Auto-actions
  auto_expire_enabled: boolean
  auto_reminder_enabled: boolean
  reminder_days_before: number
  max_reminders: number
  
  // Email settings
  send_acceptance_notification: boolean
  send_rejection_notification: boolean
  cc_email_on_send: string | null
  
  // Branding
  company_name: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  logo_url: string | null
  primary_color: string
  
  // Default content
  default_introduction: string | null
  default_terms: string | null
  default_footer: string | null
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Quote Settings Update - For updating settings
 */
export interface QuoteSettingsUpdate {
  quote_number_prefix?: string
  quote_number_padding?: number
  default_validity_days?: number
  default_tax_rate?: number
  default_currency?: string
  auto_expire_enabled?: boolean
  auto_reminder_enabled?: boolean
  reminder_days_before?: number
  max_reminders?: number
  send_acceptance_notification?: boolean
  send_rejection_notification?: boolean
  cc_email_on_send?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  logo_url?: string
  primary_color?: string
  default_introduction?: string
  default_terms?: string
  default_footer?: string
}

/**
 * Quote Analytics Data
 */
export interface QuoteAnalytics {
  // Overview
  total_quotes: number
  total_value: number
  average_value: number
  
  // Status breakdown
  by_status: {
    draft: number
    pending_approval: number
    sent: number
    viewed: number
    accepted: number
    rejected: number
    expired: number
    converted: number
    cancelled: number
  }
  
  // Conversion metrics
  conversion_rate: number // accepted / (sent - draft)
  rejection_rate: number
  expiry_rate: number
  average_time_to_accept: number // in days
  
  // Value metrics
  total_accepted_value: number
  total_pending_value: number
  total_lost_value: number // rejected + expired
  
  // Time-based
  quotes_this_month: number
  quotes_last_month: number
  growth_rate: number
}

/**
 * Quote Performance Summary (for dashboard)
 */
export interface QuotePerformance {
  period: string
  quotes_created: number
  quotes_sent: number
  quotes_accepted: number
  quotes_rejected: number
  quotes_expired: number
  total_value: number
  accepted_value: number
}
```

---

### Task 13.3: Create Quote Template Server Actions

**File**: `src/modules/ecommerce/actions/quote-template-actions.ts`
**Action**: Create

```typescript
/**
 * Quote Template Server Actions
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * CRUD operations for quote templates and settings
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  QuoteTemplate, 
  QuoteTemplateInput,
  QuoteSettings,
  QuoteSettingsUpdate
} from '../types/ecommerce-types'

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

/**
 * Get all templates for a site
 */
export async function getQuoteTemplates(
  siteId: string,
  activeOnly: boolean = false
): Promise<QuoteTemplate[]> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('mod_ecommod01_quote_templates')
      .select('*')
      .eq('site_id', siteId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching templates:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getQuoteTemplates:', error)
    return []
  }
}

/**
 * Get single template by ID
 */
export async function getQuoteTemplate(
  siteId: string,
  templateId: string
): Promise<QuoteTemplate | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .select('*')
      .eq('id', templateId)
      .eq('site_id', siteId)
      .single()
    
    if (error) {
      console.error('Error fetching template:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getQuoteTemplate:', error)
    return null
  }
}

/**
 * Get default template for a site
 */
export async function getDefaultTemplate(siteId: string): Promise<QuoteTemplate | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()
    
    if (error) return null
    return data
  } catch (error) {
    return null
  }
}

/**
 * Create new template
 */
export async function createQuoteTemplate(
  input: QuoteTemplateInput,
  userId?: string
): Promise<{ success: boolean; template?: QuoteTemplate; error?: string }> {
  try {
    const supabase = await createClient()
    
    // If setting as default, unset other defaults
    if (input.is_default) {
      await supabase
        .from('mod_ecommod01_quote_templates')
        .update({ is_default: false })
        .eq('site_id', input.site_id)
    }
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .insert({
        ...input,
        created_by: userId
      })
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/sites/${input.site_id}/ecommerce`)
    
    return { success: true, template: data }
  } catch (error) {
    console.error('Error creating template:', error)
    return { success: false, error: 'Failed to create template' }
  }
}

/**
 * Update template
 */
export async function updateQuoteTemplate(
  siteId: string,
  templateId: string,
  updates: Partial<QuoteTemplateInput>
): Promise<{ success: boolean; template?: QuoteTemplate; error?: string }> {
  try {
    const supabase = await createClient()
    
    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
        .from('mod_ecommod01_quote_templates')
        .update({ is_default: false })
        .eq('site_id', siteId)
        .neq('id', templateId)
    }
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('site_id', siteId)
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true, template: data }
  } catch (error) {
    console.error('Error updating template:', error)
    return { success: false, error: 'Failed to update template' }
  }
}

/**
 * Delete template
 */
export async function deleteQuoteTemplate(
  siteId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .delete()
      .eq('id', templateId)
      .eq('site_id', siteId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting template:', error)
    return { success: false, error: 'Failed to delete template' }
  }
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.rpc('increment_template_usage', { template_id: templateId })
    
    // Fallback if RPC not available
    const { data: template } = await supabase
      .from('mod_ecommod01_quote_templates')
      .select('usage_count')
      .eq('id', templateId)
      .single()
    
    if (template) {
      await supabase
        .from('mod_ecommod01_quote_templates')
        .update({ 
          usage_count: (template.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', templateId)
    }
  } catch (error) {
    console.error('Error incrementing template usage:', error)
  }
}

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

/**
 * Get quote settings for a site
 */
export async function getQuoteSettings(siteId: string): Promise<QuoteSettings | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_settings')
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching settings:', error)
    }
    
    return data
  } catch (error) {
    console.error('Error in getQuoteSettings:', error)
    return null
  }
}

/**
 * Create or update quote settings
 */
export async function upsertQuoteSettings(
  siteId: string,
  settings: QuoteSettingsUpdate
): Promise<{ success: boolean; settings?: QuoteSettings; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_settings')
      .upsert({
        site_id: siteId,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'site_id'
      })
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true, settings: data }
  } catch (error) {
    console.error('Error upserting settings:', error)
    return { success: false, error: 'Failed to save settings' }
  }
}

/**
 * Get next quote number and increment
 */
export async function getNextQuoteNumber(siteId: string): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Get settings
    let settings = await getQuoteSettings(siteId)
    
    // Create defaults if not exists
    if (!settings) {
      const result = await upsertQuoteSettings(siteId, {})
      settings = result.settings || null
    }
    
    const prefix = settings?.quote_number_prefix || 'QT-'
    const padding = settings?.quote_number_padding || 5
    const nextNumber = settings?.next_quote_number || 1
    
    // Generate number
    const quoteNumber = `${prefix}${nextNumber.toString().padStart(padding, '0')}`
    
    // Increment for next time
    await supabase
      .from('mod_ecommod01_quote_settings')
      .update({ next_quote_number: nextNumber + 1 })
      .eq('site_id', siteId)
    
    return quoteNumber
  } catch (error) {
    console.error('Error getting next quote number:', error)
    // Fallback
    return `QT-${Date.now()}`
  }
}

// ============================================================================
// DUPLICATE TEMPLATE
// ============================================================================

/**
 * Duplicate a template
 */
export async function duplicateQuoteTemplate(
  siteId: string,
  templateId: string,
  newName?: string
): Promise<{ success: boolean; template?: QuoteTemplate; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('mod_ecommod01_quote_templates')
      .select('*')
      .eq('id', templateId)
      .eq('site_id', siteId)
      .single()
    
    if (fetchError || !original) {
      return { success: false, error: 'Template not found' }
    }
    
    // Create copy
    const { id, created_at, updated_at, usage_count, last_used_at, ...templateData } = original
    
    const { data, error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .insert({
        ...templateData,
        name: newName || `${original.name} (Copy)`,
        is_default: false, // Never copy default status
        usage_count: 0,
        last_used_at: null
      })
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true, template: data }
  } catch (error) {
    console.error('Error duplicating template:', error)
    return { success: false, error: 'Failed to duplicate template' }
  }
}
```

---

### Task 13.4: Create Quote Automation Utilities

**File**: `src/modules/ecommerce/lib/quote-automation.ts`
**Action**: Create

```typescript
/**
 * Quote Automation Utilities
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Functions for automated quote management (cron jobs)
 */

import { createClient } from '@/lib/supabase/server'
import { addDays, differenceInDays, isAfter, isBefore } from 'date-fns'
import type { Quote, QuoteSettings } from '../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface AutomationResult {
  processed: number
  expired: number
  reminders_sent: number
  errors: string[]
}

export interface QuoteDue {
  quote: Quote
  days_until_expiry: number
  reminder_number: number
}

// ============================================================================
// AUTO-EXPIRATION
// ============================================================================

/**
 * Process expired quotes for a site
 * Should be called by a cron job daily
 */
export async function processExpiredQuotes(siteId: string): Promise<{ expired: number }> {
  try {
    const supabase = await createClient()
    const now = new Date()
    
    // Find quotes that should be expired
    const { data: quotes, error } = await supabase
      .from('mod_ecommod01_quotes')
      .select('id, quote_number')
      .eq('site_id', siteId)
      .in('status', ['sent', 'viewed'])
      .lt('valid_until', now.toISOString())
    
    if (error || !quotes || quotes.length === 0) {
      return { expired: 0 }
    }
    
    // Update each to expired
    for (const quote of quotes) {
      await supabase
        .from('mod_ecommod01_quotes')
        .update({ 
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', quote.id)
      
      // Log activity
      await supabase.from('mod_ecommod01_quote_activity').insert({
        quote_id: quote.id,
        activity_type: 'expired',
        description: 'Quote expired automatically'
      })
    }
    
    return { expired: quotes.length }
  } catch (error) {
    console.error('Error processing expired quotes:', error)
    return { expired: 0 }
  }
}

// ============================================================================
// AUTO-REMINDERS
// ============================================================================

/**
 * Get quotes due for reminders
 */
export async function getQuotesDueForReminder(
  siteId: string,
  daysBefore: number = 3,
  maxReminders: number = 2
): Promise<QuoteDue[]> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const reminderDate = addDays(now, daysBefore)
    
    // Get quotes that:
    // 1. Are sent or viewed
    // 2. Have valid_until within reminder window
    // 3. Haven't exceeded max reminders
    const { data: quotes, error } = await supabase
      .from('mod_ecommod01_quotes')
      .select('*')
      .eq('site_id', siteId)
      .in('status', ['sent', 'viewed'])
      .lt('reminder_count', maxReminders)
      .lte('valid_until', reminderDate.toISOString())
      .gt('valid_until', now.toISOString())
    
    if (error || !quotes) {
      return []
    }
    
    return quotes.map(quote => ({
      quote,
      days_until_expiry: differenceInDays(new Date(quote.valid_until), now),
      reminder_number: (quote.reminder_count || 0) + 1
    }))
  } catch (error) {
    console.error('Error getting quotes due for reminder:', error)
    return []
  }
}

/**
 * Process reminders for a site
 * Should be called by a cron job daily
 */
export async function processQuoteReminders(siteId: string): Promise<{ sent: number }> {
  try {
    const supabase = await createClient()
    
    // Get settings
    const { data: settings } = await supabase
      .from('mod_ecommod01_quote_settings')
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (!settings?.auto_reminder_enabled) {
      return { sent: 0 }
    }
    
    const quotesToRemind = await getQuotesDueForReminder(
      siteId,
      settings.reminder_days_before,
      settings.max_reminders
    )
    
    let sent = 0
    
    for (const { quote, reminder_number } of quotesToRemind) {
      // Update reminder count
      await supabase
        .from('mod_ecommod01_quotes')
        .update({
          reminder_count: reminder_number,
          last_reminder_at: new Date().toISOString()
        })
        .eq('id', quote.id)
      
      // Log activity
      await supabase.from('mod_ecommod01_quote_activity').insert({
        quote_id: quote.id,
        activity_type: 'reminder_sent',
        description: `Automatic reminder #${reminder_number} sent`
      })
      
      // TODO: Actually send reminder email
      // await sendReminderEmail(quote, reminder_number)
      
      sent++
    }
    
    return { sent }
  } catch (error) {
    console.error('Error processing reminders:', error)
    return { sent: 0 }
  }
}

// ============================================================================
// FULL AUTOMATION RUN
// ============================================================================

/**
 * Run all automation tasks for a site
 * Should be called by a daily cron job
 */
export async function runQuoteAutomation(siteId: string): Promise<AutomationResult> {
  const result: AutomationResult = {
    processed: 0,
    expired: 0,
    reminders_sent: 0,
    errors: []
  }
  
  try {
    // Process expirations
    const expireResult = await processExpiredQuotes(siteId)
    result.expired = expireResult.expired
    result.processed += expireResult.expired
  } catch (error) {
    result.errors.push(`Expiration error: ${error}`)
  }
  
  try {
    // Process reminders
    const reminderResult = await processQuoteReminders(siteId)
    result.reminders_sent = reminderResult.sent
    result.processed += reminderResult.sent
  } catch (error) {
    result.errors.push(`Reminder error: ${error}`)
  }
  
  return result
}

// ============================================================================
// SCHEDULED FOLLOW-UPS
// ============================================================================

/**
 * Get quotes that need follow-up
 * - Sent but not viewed after X days
 * - Viewed but no response after X days
 */
export async function getQuotesNeedingFollowUp(
  siteId: string,
  daysWithoutView: number = 3,
  daysWithoutResponse: number = 7
): Promise<{ notViewed: Quote[]; noResponse: Quote[] }> {
  try {
    const supabase = await createClient()
    const now = new Date()
    
    // Quotes sent but not viewed
    const viewCutoff = addDays(now, -daysWithoutView)
    const { data: notViewed } = await supabase
      .from('mod_ecommod01_quotes')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'sent')
      .lt('sent_at', viewCutoff.toISOString())
    
    // Quotes viewed but no response
    const responseCutoff = addDays(now, -daysWithoutResponse)
    const { data: noResponse } = await supabase
      .from('mod_ecommod01_quotes')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'viewed')
      .lt('first_viewed_at', responseCutoff.toISOString())
    
    return {
      notViewed: notViewed || [],
      noResponse: noResponse || []
    }
  } catch (error) {
    console.error('Error getting quotes needing follow-up:', error)
    return { notViewed: [], noResponse: [] }
  }
}
```

---

### Task 13.5: Create Quote Analytics Utilities

**File**: `src/modules/ecommerce/lib/quote-analytics.ts`
**Action**: Create

```typescript
/**
 * Quote Analytics Utilities
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Analytics and reporting functions for quotes
 */

import { createClient } from '@/lib/supabase/server'
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  differenceInDays,
  parseISO 
} from 'date-fns'
import type { 
  QuoteAnalytics, 
  QuotePerformance,
  QuoteStatus 
} from '../types/ecommerce-types'

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get comprehensive quote analytics for a site
 */
export async function getQuoteAnalytics(siteId: string): Promise<QuoteAnalytics> {
  try {
    const supabase = await createClient()
    
    // Get all quotes
    const { data: quotes, error } = await supabase
      .from('mod_ecommod01_quotes')
      .select('id, status, total, created_at, sent_at, accepted_at')
      .eq('site_id', siteId)
    
    if (error || !quotes) {
      return getEmptyAnalytics()
    }
    
    // Calculate metrics
    const total = quotes.length
    const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0)
    const avgValue = total > 0 ? totalValue / total : 0
    
    // Status counts
    const statusCounts: Record<QuoteStatus, number> = {
      draft: 0,
      pending_approval: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      cancelled: 0
    }
    
    for (const quote of quotes) {
      statusCounts[quote.status as QuoteStatus]++
    }
    
    // Conversion metrics
    const sentQuotes = quotes.filter(q => 
      !['draft', 'pending_approval', 'cancelled'].includes(q.status)
    )
    const sentCount = sentQuotes.length
    const acceptedCount = statusCounts.accepted + statusCounts.converted
    const rejectedCount = statusCounts.rejected
    const expiredCount = statusCounts.expired
    
    const conversionRate = sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0
    const rejectionRate = sentCount > 0 ? (rejectedCount / sentCount) * 100 : 0
    const expiryRate = sentCount > 0 ? (expiredCount / sentCount) * 100 : 0
    
    // Time to accept (for accepted quotes)
    const acceptedQuotes = quotes.filter(q => 
      q.status === 'accepted' || q.status === 'converted'
    )
    let avgTimeToAccept = 0
    if (acceptedQuotes.length > 0) {
      const totalDays = acceptedQuotes.reduce((sum, q) => {
        if (q.sent_at && q.accepted_at) {
          return sum + differenceInDays(parseISO(q.accepted_at), parseISO(q.sent_at))
        }
        return sum
      }, 0)
      avgTimeToAccept = totalDays / acceptedQuotes.length
    }
    
    // Value metrics
    const acceptedValue = quotes
      .filter(q => q.status === 'accepted' || q.status === 'converted')
      .reduce((sum, q) => sum + (q.total || 0), 0)
    
    const pendingValue = quotes
      .filter(q => ['sent', 'viewed'].includes(q.status))
      .reduce((sum, q) => sum + (q.total || 0), 0)
    
    const lostValue = quotes
      .filter(q => ['rejected', 'expired', 'cancelled'].includes(q.status))
      .reduce((sum, q) => sum + (q.total || 0), 0)
    
    // Time-based metrics
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    
    const quotesThisMonth = quotes.filter(q => 
      parseISO(q.created_at) >= thisMonthStart
    ).length
    
    const quotesLastMonth = quotes.filter(q => {
      const created = parseISO(q.created_at)
      return created >= lastMonthStart && created <= lastMonthEnd
    }).length
    
    const growthRate = quotesLastMonth > 0 
      ? ((quotesThisMonth - quotesLastMonth) / quotesLastMonth) * 100 
      : 0
    
    return {
      total_quotes: total,
      total_value: totalValue,
      average_value: avgValue,
      by_status: statusCounts,
      conversion_rate: conversionRate,
      rejection_rate: rejectionRate,
      expiry_rate: expiryRate,
      average_time_to_accept: avgTimeToAccept,
      total_accepted_value: acceptedValue,
      total_pending_value: pendingValue,
      total_lost_value: lostValue,
      quotes_this_month: quotesThisMonth,
      quotes_last_month: quotesLastMonth,
      growth_rate: growthRate
    }
  } catch (error) {
    console.error('Error getting quote analytics:', error)
    return getEmptyAnalytics()
  }
}

/**
 * Get empty analytics object
 */
function getEmptyAnalytics(): QuoteAnalytics {
  return {
    total_quotes: 0,
    total_value: 0,
    average_value: 0,
    by_status: {
      draft: 0,
      pending_approval: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      cancelled: 0
    },
    conversion_rate: 0,
    rejection_rate: 0,
    expiry_rate: 0,
    average_time_to_accept: 0,
    total_accepted_value: 0,
    total_pending_value: 0,
    total_lost_value: 0,
    quotes_this_month: 0,
    quotes_last_month: 0,
    growth_rate: 0
  }
}

// ============================================================================
// PERFORMANCE REPORTS
// ============================================================================

/**
 * Get quote performance for the last N months
 */
export async function getQuotePerformance(
  siteId: string,
  months: number = 6
): Promise<QuotePerformance[]> {
  try {
    const supabase = await createClient()
    
    const { data: quotes, error } = await supabase
      .from('mod_ecommod01_quotes')
      .select('status, total, created_at, sent_at, accepted_at')
      .eq('site_id', siteId)
      .gte('created_at', subMonths(new Date(), months).toISOString())
    
    if (error || !quotes) {
      return []
    }
    
    // Group by month
    const monthlyData: Map<string, QuotePerformance> = new Map()
    
    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i)
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthlyData.set(period, {
        period,
        quotes_created: 0,
        quotes_sent: 0,
        quotes_accepted: 0,
        quotes_rejected: 0,
        quotes_expired: 0,
        total_value: 0,
        accepted_value: 0
      })
    }
    
    // Populate data
    for (const quote of quotes) {
      const created = parseISO(quote.created_at)
      const period = `${created.getFullYear()}-${(created.getMonth() + 1).toString().padStart(2, '0')}`
      
      const monthData = monthlyData.get(period)
      if (monthData) {
        monthData.quotes_created++
        monthData.total_value += quote.total || 0
        
        if (['sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'].includes(quote.status)) {
          monthData.quotes_sent++
        }
        
        if (quote.status === 'accepted' || quote.status === 'converted') {
          monthData.quotes_accepted++
          monthData.accepted_value += quote.total || 0
        }
        
        if (quote.status === 'rejected') {
          monthData.quotes_rejected++
        }
        
        if (quote.status === 'expired') {
          monthData.quotes_expired++
        }
      }
    }
    
    // Convert to array and sort by period
    return Array.from(monthlyData.values()).sort((a, b) => a.period.localeCompare(b.period))
  } catch (error) {
    console.error('Error getting quote performance:', error)
    return []
  }
}

// ============================================================================
// TOP PERFORMERS
// ============================================================================

/**
 * Get top templates by usage
 */
export async function getTopTemplates(
  siteId: string,
  limit: number = 5
): Promise<{ id: string; name: string; usage_count: number; conversion_rate: number }[]> {
  try {
    const supabase = await createClient()
    
    const { data: templates, error } = await supabase
      .from('mod_ecommod01_quote_templates')
      .select('id, name, usage_count')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(limit)
    
    if (error || !templates) {
      return []
    }
    
    // TODO: Calculate conversion rate per template
    // Would require tracking which template was used for each quote
    
    return templates.map(t => ({
      id: t.id,
      name: t.name,
      usage_count: t.usage_count,
      conversion_rate: 0 // Placeholder
    }))
  } catch (error) {
    console.error('Error getting top templates:', error)
    return []
  }
}
```

---

### Task 13.6: Create Quote Template List Component

**File**: `src/modules/ecommerce/components/quotes/quote-template-list.tsx`
**Action**: Create

```tsx
/**
 * Quote Template List Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * List and manage quote templates
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Star,
  StarOff,
  FileText,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  getQuoteTemplates, 
  deleteQuoteTemplate,
  duplicateQuoteTemplate,
  updateQuoteTemplate
} from '../../actions/quote-template-actions'
import { QuoteTemplateDialog } from './quote-template-dialog'
import type { QuoteTemplate } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTemplateListProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTemplateList({ siteId, agencyId }: QuoteTemplateListProps) {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null)
  
  // Load templates
  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await getQuoteTemplates(siteId)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadTemplates()
  }, [siteId])
  
  // Handlers
  const handleCreate = () => {
    setEditingTemplate(null)
    setShowDialog(true)
  }
  
  const handleEdit = (template: QuoteTemplate) => {
    setEditingTemplate(template)
    setShowDialog(true)
  }
  
  const handleDuplicate = async (template: QuoteTemplate) => {
    const result = await duplicateQuoteTemplate(siteId, template.id)
    if (result.success) {
      toast.success('Template duplicated')
      loadTemplates()
    } else {
      toast.error(result.error || 'Failed to duplicate')
    }
  }
  
  const handleDelete = async (template: QuoteTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return
    
    const result = await deleteQuoteTemplate(siteId, template.id)
    if (result.success) {
      toast.success('Template deleted')
      loadTemplates()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }
  
  const handleToggleDefault = async (template: QuoteTemplate) => {
    const result = await updateQuoteTemplate(siteId, template.id, {
      is_default: !template.is_default
    })
    if (result.success) {
      toast.success(template.is_default ? 'Default removed' : 'Set as default')
      loadTemplates()
    } else {
      toast.error(result.error || 'Failed to update')
    }
  }
  
  const handleSaved = () => {
    setShowDialog(false)
    setEditingTemplate(null)
    loadTemplates()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quote Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create reusable templates for faster quote creation
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>
      
      {/* Template Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">No templates yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first template to speed up quote creation
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card 
              key={template.id}
              className={cn(
                'relative',
                !template.is_active && 'opacity-60'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleDefault(template)}>
                        {template.is_default ? (
                          <>
                            <StarOff className="h-4 w-4 mr-2" />
                            Remove Default
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(template)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Currency</span>
                    <span>{template.currency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Default Items</span>
                    <span>{template.default_items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Validity</span>
                    <span>{template.default_validity_days} days</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Used</span>
                    <span>{template.usage_count} times</span>
                  </div>
                </div>
                
                {!template.is_active && (
                  <Badge variant="outline" className="mt-3">
                    Inactive
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Template Dialog */}
      <QuoteTemplateDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        template={editingTemplate}
        siteId={siteId}
        agencyId={agencyId}
        onSaved={handleSaved}
      />
    </div>
  )
}
```

---

### Task 13.7: Create Quote Template Dialog

**File**: `src/modules/ecommerce/components/quotes/quote-template-dialog.tsx`
**Action**: Create

```tsx
/**
 * Quote Template Dialog Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Create/edit quote templates
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, FileText, Settings, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { 
  createQuoteTemplate, 
  updateQuoteTemplate 
} from '../../actions/quote-template-actions'
import type { QuoteTemplate, QuoteTemplateInput } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: QuoteTemplate | null
  siteId: string
  agencyId: string
  onSaved?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTemplateDialog({
  open,
  onOpenChange,
  template,
  siteId,
  agencyId,
  onSaved
}: QuoteTemplateDialogProps) {
  const isEdit = !!template
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isActive, setIsActive] = useState(true)
  
  const [titleTemplate, setTitleTemplate] = useState('')
  const [introductionTemplate, setIntroductionTemplate] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [notesTemplate, setNotesTemplate] = useState('')
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [validityDays, setValidityDays] = useState(30)
  const [currency, setCurrency] = useState('USD')
  
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [showLogo, setShowLogo] = useState(true)
  
  // Load template data
  useEffect(() => {
    if (open && template) {
      setName(template.name)
      setDescription(template.description || '')
      setIsDefault(template.is_default)
      setIsActive(template.is_active)
      setTitleTemplate(template.title_template || '')
      setIntroductionTemplate(template.introduction_template || '')
      setTermsAndConditions(template.terms_and_conditions || '')
      setNotesTemplate(template.notes_template || '')
      setDiscountType(template.default_discount_type)
      setDiscountValue(template.default_discount_value)
      setTaxRate(template.default_tax_rate)
      setValidityDays(template.default_validity_days)
      setCurrency(template.currency)
      setPrimaryColor(template.primary_color)
      setShowLogo(template.show_company_logo)
    } else if (open) {
      // Reset form for new template
      setName('')
      setDescription('')
      setIsDefault(false)
      setIsActive(true)
      setTitleTemplate('')
      setIntroductionTemplate('')
      setTermsAndConditions('')
      setNotesTemplate('')
      setDiscountType('percentage')
      setDiscountValue(0)
      setTaxRate(0)
      setValidityDays(30)
      setCurrency('USD')
      setPrimaryColor('#2563eb')
      setShowLogo(true)
    }
  }, [open, template])
  
  // Save handler
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }
    
    setIsSaving(true)
    try {
      const input: QuoteTemplateInput = {
        site_id: siteId,
        agency_id: agencyId,
        name: name.trim(),
        description: description.trim() || undefined,
        is_default: isDefault,
        is_active: isActive,
        title_template: titleTemplate.trim() || undefined,
        introduction_template: introductionTemplate.trim() || undefined,
        terms_and_conditions: termsAndConditions.trim() || undefined,
        notes_template: notesTemplate.trim() || undefined,
        default_discount_type: discountType,
        default_discount_value: discountValue,
        default_tax_rate: taxRate,
        default_validity_days: validityDays,
        currency,
        primary_color: primaryColor,
        show_company_logo: showLogo
      }
      
      let result
      if (isEdit && template) {
        result = await updateQuoteTemplate(siteId, template.id, input)
      } else {
        result = await createQuoteTemplate(input)
      }
      
      if (result.success) {
        toast.success(isEdit ? 'Template updated' : 'Template created')
        onSaved?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Quote"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when to use this template..."
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Template</Label>
                <p className="text-sm text-muted-foreground">
                  Use this template by default for new quotes
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this template available for use
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </TabsContent>
          
          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="titleTemplate">Default Quote Title</Label>
              <Input
                id="titleTemplate"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                placeholder="e.g., Service Proposal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="introductionTemplate">Introduction</Label>
              <Textarea
                id="introductionTemplate"
                value={introductionTemplate}
                onChange={(e) => setIntroductionTemplate(e.target.value)}
                placeholder="Default introduction text..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Default terms and conditions..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notesTemplate">Notes Template</Label>
              <Textarea
                id="notesTemplate"
                value={notesTemplate}
                onChange={(e) => setNotesTemplate(e.target.value)}
                placeholder="Default notes to customer..."
                rows={2}
              />
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Validity (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select 
                  value={discountType} 
                  onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  min="0"
                  step={discountType === 'percentage' ? '1' : '0.01'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Company Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Display logo on quote PDFs
                </p>
              </div>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEdit ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 13.8: Create Template Selector Component

**File**: `src/modules/ecommerce/components/quotes/quote-template-selector.tsx`
**Action**: Create

```tsx
/**
 * Quote Template Selector Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Dropdown to select a template when creating quotes
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Star, Loader2 } from 'lucide-react'
import { getQuoteTemplates } from '../../actions/quote-template-actions'
import type { QuoteTemplate } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTemplateSelectorProps {
  siteId: string
  value?: string
  onSelect: (template: QuoteTemplate | null) => void
  disabled?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTemplateSelector({
  siteId,
  value,
  onSelect,
  disabled = false
}: QuoteTemplateSelectorProps) {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true)
      try {
        const data = await getQuoteTemplates(siteId, true)
        setTemplates(data)
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTemplates()
  }, [siteId])
  
  const handleChange = (templateId: string) => {
    if (templateId === 'none') {
      onSelect(null)
    } else {
      const template = templates.find(t => t.id === templateId)
      onSelect(template || null)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    )
  }
  
  if (templates.length === 0) {
    return null
  }

  return (
    <Select value={value || 'none'} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <SelectValue placeholder="Select a template (optional)" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No template</span>
        </SelectItem>
        {templates.map(template => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              <span>{template.name}</span>
              {template.is_default && (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

### Task 13.9: Update Quote Components Index

**File**: `src/modules/ecommerce/components/quotes/index.ts`
**Action**: Modify

```typescript
/**
 * Quote Components Index
 * 
 * Phase ECOM-11B, ECOM-12, ECOM-13: Quote Components
 */

// ECOM-11B: Core components
export { QuoteStatusBadge, getStatusBadgeProps } from './quote-status-badge'
export { QuoteTimeline } from './quote-timeline'
export { ProductSelector } from './product-selector'
export type { ProductSelection } from './product-selector'
export { QuoteItemsEditor } from './quote-items-editor'
export { QuoteTable } from './quote-table'
export { QuoteBuilderDialog } from './quote-builder-dialog'
export { QuoteDetailDialog } from './quote-detail-dialog'

// ECOM-12: Workflow components
export { SendQuoteDialog } from './send-quote-dialog'
export { ConvertToOrderDialog } from './convert-to-order-dialog'

// ECOM-13: Template components
export { QuoteTemplateList } from './quote-template-list'
export { QuoteTemplateDialog } from './quote-template-dialog'
export { QuoteTemplateSelector } from './quote-template-selector'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Migration runs successfully
- [ ] Templates CRUD operations work
- [ ] Template list loads and displays
- [ ] Create template dialog saves correctly
- [ ] Edit template loads existing data
- [ ] Duplicate template creates copy
- [ ] Delete template removes it
- [ ] Set/unset default works
- [ ] Template selector shows in quote builder
- [ ] Selecting template populates quote fields
- [ ] Settings save and load correctly
- [ ] Analytics calculate correct values
- [ ] Automation functions work (test manually)

---

## 🔄 Rollback Plan

If issues occur:

1. **Rollback migration:**
```sql
DROP TABLE IF EXISTS mod_ecommod01_quote_templates;
DROP TABLE IF EXISTS mod_ecommod01_quote_settings;
```

2. **Remove files:**
```bash
rm src/modules/ecommerce/actions/quote-template-actions.ts
rm src/modules/ecommerce/lib/quote-automation.ts
rm src/modules/ecommerce/lib/quote-analytics.ts
rm src/modules/ecommerce/components/quotes/quote-template-*.tsx
```

3. **Revert type changes:**
```bash
git checkout src/modules/ecommerce/types/ecommerce-types.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:

**activeContext.md:**
```markdown
### Phase ECOM-13 Complete (Date)
- ✅ Quote templates database schema
- ✅ Template CRUD server actions
- ✅ Template management UI
- ✅ Template selector in quote builder
- ✅ Quote settings management
- ✅ Automation utilities (expiration, reminders)
- ✅ Analytics functions
```

**progress.md:**
```markdown
| ECOM-13 | Quote Templates & Automation | ✅ Complete |

## WAVE 2 COMPLETE
All quotation system phases implemented:
- ECOM-10: Schema & Types ✅
- ECOM-11A: Server Actions ✅
- ECOM-11B: UI Components ✅
- ECOM-12: Workflow & Portal ✅
- ECOM-13: Templates & Automation ✅
```

---

## ✨ Success Criteria

- [ ] Templates can be created, edited, deleted
- [ ] Default template auto-selected for new quotes
- [ ] Template populates quote fields correctly
- [ ] Quote settings persist per site
- [ ] Automation functions ready for cron jobs
- [ ] Analytics provide accurate metrics
- [ ] All components follow existing patterns
- [ ] No TypeScript errors
- [ ] Mobile responsive UI
- [ ] WAVE 2 Quotation System fully functional
