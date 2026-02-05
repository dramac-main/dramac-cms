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
  QuoteSiteSettings,
  QuoteSiteSettingsUpdate
} from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

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
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
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
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
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
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
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
): Promise<ActionResult<QuoteTemplate>> {
  try {
    const supabase = await getModuleClient()
    
    // If setting as default, unset other defaults
    if (input.is_default) {
      await supabase
        .from(`${TABLE_PREFIX}_quote_templates`)
        .update({ is_default: false })
        .eq('site_id', input.site_id)
    }
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
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
    
    return { success: true, data }
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
): Promise<ActionResult<QuoteTemplate>> {
  try {
    const supabase = await getModuleClient()
    
    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
        .from(`${TABLE_PREFIX}_quote_templates`)
        .update({ is_default: false })
        .eq('site_id', siteId)
        .neq('id', templateId)
    }
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
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
    
    return { success: true, data }
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
): Promise<ActionResult> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
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
    const supabase = await getModuleClient()
    
    // Get current count
    const { data: template } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
      .select('usage_count')
      .eq('id', templateId)
      .single()
    
    if (template) {
      await supabase
        .from(`${TABLE_PREFIX}_quote_templates`)
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

/**
 * Duplicate a template
 */
export async function duplicateQuoteTemplate(
  siteId: string,
  templateId: string,
  newName?: string
): Promise<ActionResult<QuoteTemplate>> {
  try {
    const supabase = await getModuleClient()
    
    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
      .select('*')
      .eq('id', templateId)
      .eq('site_id', siteId)
      .single()
    
    if (fetchError || !original) {
      return { success: false, error: 'Template not found' }
    }
    
    // Create copy without id and metadata
    const { 
      id, 
      created_at, 
      updated_at, 
      usage_count, 
      last_used_at, 
      ...templateData 
    } = original
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_templates`)
      .insert({
        ...templateData,
        name: newName || `${original.name} (Copy)`,
        is_default: false,
        usage_count: 0,
        last_used_at: null
      })
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/sites/${siteId}/ecommerce`)
    
    return { success: true, data }
  } catch (error) {
    console.error('Error duplicating template:', error)
    return { success: false, error: 'Failed to duplicate template' }
  }
}

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

/**
 * Get quote settings for a site
 */
export async function getQuoteSiteSettings(siteId: string): Promise<QuoteSiteSettings | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error)
    }
    
    return data
  } catch (error) {
    console.error('Error in getQuoteSiteSettings:', error)
    return null
  }
}

/**
 * Create or update quote settings
 */
export async function upsertQuoteSiteSettings(
  siteId: string,
  agencyId: string,
  settings: QuoteSiteSettingsUpdate
): Promise<ActionResult<QuoteSiteSettings>> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .upsert({
        site_id: siteId,
        agency_id: agencyId,
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
    
    return { success: true, data }
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
    const supabase = await getModuleClient()
    
    // Get settings
    let settings = await getQuoteSiteSettings(siteId)
    
    // Create defaults if not exists
    if (!settings) {
      // Get agency_id from site
      const { data: site } = await supabase
        .from('sites')
        .select('agency_id')
        .eq('id', siteId)
        .single()
      
      const agencyId = site?.agency_id || siteId
      const result = await upsertQuoteSiteSettings(siteId, agencyId, {})
      settings = result.data || null
    }
    
    const prefix = settings?.quote_number_prefix || 'QT-'
    const padding = settings?.quote_number_padding || 5
    const nextNumber = settings?.next_quote_number || 1
    
    // Generate number
    const quoteNumber = `${prefix}${nextNumber.toString().padStart(padding, '0')}`
    
    // Increment for next time
    await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .update({ next_quote_number: nextNumber + 1 })
      .eq('site_id', siteId)
    
    return quoteNumber
  } catch (error) {
    console.error('Error getting next quote number:', error)
    return `QT-${Date.now()}`
  }
}
