/**
 * Quote Server Actions
 * 
 * Phase ECOM-11A: Quote Server Actions & Core Logic
 * 
 * Server actions for managing quotes, items, and calculations
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Quote,
  QuoteItem,
  QuoteInput,
  QuoteUpdate,
  QuoteItemInput,
  QuoteItemUpdate,
  QuoteDetailData,
  QuoteSummary,
  QuoteStatus,
  QuoteActivityType,
  QuoteTableFilters,
  QuoteBulkAction,
  BulkActionResult,
  QuoteSettings
} from '../types/ecommerce-types'
import { formatQuoteNumber, calculateQuoteTotals, calculateItemLineTotal } from '../lib/quote-utils'

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
// QUOTE NUMBER GENERATION
// ============================================================================

/**
 * Generate unique quote number for a site
 */
export async function generateQuoteNumber(siteId: string): Promise<string> {
  const supabase = await getModuleClient()
  
  // Get or create quote settings
  let { data: settings } = await supabase
    .from(`${TABLE_PREFIX}_quote_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()
  
  // If no settings exist, create default
  if (!settings) {
    const { data: site } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', siteId)
      .single()
    
    if (!site) throw new Error('Site not found')
    
    const { data: newSettings, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .insert({
        site_id: siteId,
        agency_id: site.agency_id,
        quote_number_prefix: 'QUO-',
        quote_number_counter: 1000,
        quote_number_format: '{prefix}{counter}'
      })
      .select()
      .single()
    
    if (error) throw error
    settings = newSettings
  }
  
  // Generate quote number
  const quoteNumber = formatQuoteNumber(
    settings.quote_number_format,
    settings.quote_number_prefix,
    settings.quote_number_counter
  )
  
  // Increment counter
  await supabase
    .from(`${TABLE_PREFIX}_quote_settings`)
    .update({ quote_number_counter: settings.quote_number_counter + 1 })
    .eq('id', settings.id)
  
  return quoteNumber
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log quote activity
 */
export async function logQuoteActivity(
  quoteId: string,
  activityType: QuoteActivityType,
  description: string,
  options?: {
    performedBy?: string
    performedByName?: string
    ipAddress?: string
    userAgent?: string
    oldValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const supabase = await getModuleClient()
  
  await supabase
    .from(`${TABLE_PREFIX}_quote_activities`)
    .insert({
      quote_id: quoteId,
      activity_type: activityType,
      description,
      performed_by: options?.performedBy,
      performed_by_name: options?.performedByName,
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
      old_value: options?.oldValue,
      new_value: options?.newValue,
      metadata: options?.metadata || {}
    })
}

// ============================================================================
// QUOTE CRUD
// ============================================================================

/**
 * Create a new quote
 */
export async function createQuote(
  input: QuoteInput,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Generate quote number
    const quoteNumber = await generateQuoteNumber(input.site_id)
    
    // Calculate validity date
    const validFrom = input.valid_from || new Date().toISOString()
    let validUntil = input.valid_until
    
    if (!validUntil) {
      // Get default validity from settings
      const { data: settings } = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .select('default_validity_days')
        .eq('site_id', input.site_id)
        .single()
      
      const validityDays = settings?.default_validity_days || 30
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + validityDays)
      expiryDate.setHours(23, 59, 59, 999)
      validUntil = expiryDate.toISOString()
    }
    
    // Create quote
    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .insert({
        site_id: input.site_id,
        agency_id: input.agency_id,
        quote_number: quoteNumber,
        reference_number: input.reference_number,
        customer_id: input.customer_id,
        customer_email: input.customer_email,
        customer_name: input.customer_name,
        customer_company: input.customer_company,
        customer_phone: input.customer_phone,
        billing_address: input.billing_address,
        shipping_address: input.shipping_address,
        status: 'draft',
        subtotal: 0,
        discount_type: input.discount_type,
        discount_value: input.discount_value || 0,
        discount_amount: 0,
        tax_rate: input.tax_rate || 0,
        tax_amount: 0,
        shipping_amount: input.shipping_amount || 0,
        total: 0,
        currency: input.currency || 'USD',
        valid_from: validFrom,
        valid_until: validUntil,
        title: input.title,
        introduction: input.introduction,
        terms_and_conditions: input.terms_and_conditions,
        notes_to_customer: input.notes_to_customer,
        internal_notes: input.internal_notes,
        template_id: input.template_id,
        created_by: userId,
        last_modified_by: userId,
        metadata: input.metadata || {}
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Log activity
    await logQuoteActivity(
      quote.id,
      'created',
      `Quote ${quoteNumber} created`,
      {
        performedBy: userId,
        performedByName: userName
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, quote }
  } catch (error) {
    console.error('Error creating quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create quote' 
    }
  }
}

/**
 * Get a single quote with all details
 */
export async function getQuote(
  siteId: string,
  quoteId: string
): Promise<QuoteDetailData | null> {
  const supabase = await getModuleClient()
  
  // Get quote
  const { data: quote, error: quoteError } = await supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('*')
    .eq('id', quoteId)
    .eq('site_id', siteId)
    .single()
  
  if (quoteError || !quote) return null
  
  // Get items
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_quote_items`)
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })
  
  // Get activities
  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_quote_activities`)
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false })
  
  // Get customer if linked
  let customer = null
  if (quote.customer_id) {
    const { data: customerData } = await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .select('*')
      .eq('id', quote.customer_id)
      .single()
    
    customer = customerData
  }
  
  return {
    ...quote,
    items: items || [],
    activities: activities || [],
    customer
  }
}

/**
 * Get quote by access token (for customer portal)
 */
export async function getQuoteByToken(
  token: string
): Promise<QuoteDetailData | null> {
  const supabase = await getModuleClient()
  
  // Get quote by token
  const { data: quote, error: quoteError } = await supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('*')
    .eq('access_token', token)
    .single()
  
  if (quoteError || !quote) return null
  
  // Get items
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_quote_items`)
    .select('*')
    .eq('quote_id', quote.id)
    .order('sort_order', { ascending: true })
  
  // Get activities (limited for customer view)
  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_quote_activities`)
    .select('*')
    .eq('quote_id', quote.id)
    .in('activity_type', ['created', 'sent', 'viewed', 'accepted', 'rejected', 'expired'])
    .order('created_at', { ascending: false })
    .limit(10)
  
  return {
    ...quote,
    items: items || [],
    activities: activities || [],
    customer: null
  }
}

/**
 * Get quotes list with filters
 */
export async function getQuotes(
  siteId: string,
  filters?: Partial<QuoteTableFilters>,
  page: number = 1,
  pageSize: number = 20
): Promise<{ quotes: QuoteSummary[]; total: number }> {
  const supabase = await getModuleClient()
  
  // Build query
  let query = supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('*, items:mod_ecommod01_quote_items(count)', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `quote_number.ilike.${searchTerm},customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},customer_company.ilike.${searchTerm}`
    )
  }
  
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }
  
  if (filters?.expiresFrom) {
    query = query.gte('valid_until', filters.expiresFrom)
  }
  
  if (filters?.expiresTo) {
    query = query.lte('valid_until', filters.expiresTo)
  }
  
  if (filters?.minTotal !== null && filters?.minTotal !== undefined) {
    query = query.gte('total', filters.minTotal)
  }
  
  if (filters?.maxTotal !== null && filters?.maxTotal !== undefined) {
    query = query.lte('total', filters.maxTotal)
  }
  
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }
  
  // Check for expired quotes filter
  if (filters?.hasExpired === true) {
    query = query.lt('valid_until', new Date().toISOString())
  } else if (filters?.hasExpired === false) {
    query = query.or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
  }
  
  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching quotes:', error)
    return { quotes: [], total: 0 }
  }
  
  // Transform to QuoteSummary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quotes: QuoteSummary[] = (data || []).map((q: any) => ({
    id: q.id,
    quote_number: q.quote_number,
    customer_name: q.customer_name,
    customer_company: q.customer_company,
    customer_email: q.customer_email,
    status: q.status,
    total: q.total,
    currency: q.currency,
    valid_until: q.valid_until,
    items_count: q.items?.[0]?.count || 0,
    created_at: q.created_at,
    updated_at: q.updated_at
  }))
  
  return { quotes, total: count || 0 }
}

/**
 * Update a quote
 */
export async function updateQuote(
  siteId: string,
  quoteId: string,
  updates: QuoteUpdate,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get current quote for comparison
    const { data: currentQuote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!currentQuote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Update quote
    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        ...updates,
        last_modified_by: userId
      })
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .select()
      .single()
    
    if (error) throw error
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'updated',
      `Quote ${quote.quote_number} updated`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: currentQuote,
        newValue: quote
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, quote }
  } catch (error) {
    console.error('Error updating quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update quote' 
    }
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  siteId: string,
  quoteId: string,
  status: QuoteStatus,
  userId?: string,
  userName?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get current quote
    const { data: currentQuote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('status, quote_number')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!currentQuote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Build update object with status-specific timestamps
    const updateData: Record<string, unknown> = {
      status,
      last_modified_by: userId
    }
    
    // Add status-specific timestamps
    const now = new Date().toISOString()
    if (status === 'sent') {
      updateData.sent_at = now
    } else if (status === 'viewed') {
      updateData.viewed_at = now
      // Only set first_viewed_at if not already set
      const { data: existingQuote } = await supabase
        .from(`${TABLE_PREFIX}_quotes`)
        .select('first_viewed_at, view_count')
        .eq('id', quoteId)
        .single()
      
      if (!existingQuote?.first_viewed_at) {
        updateData.first_viewed_at = now
      }
      updateData.view_count = (existingQuote?.view_count || 0) + 1
    } else if (status === 'accepted' || status === 'rejected') {
      updateData.responded_at = now
      if (notes) {
        updateData.response_notes = notes
      }
    } else if (status === 'converted') {
      updateData.converted_at = now
    }
    
    // Update quote
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update(updateData)
      .eq('id', quoteId)
      .eq('site_id', siteId)
    
    if (error) throw error
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'status_changed',
      `Status changed from ${currentQuote.status} to ${status}`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: { status: currentQuote.status },
        newValue: { status }
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating quote status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update status' 
    }
  }
}

/**
 * Delete a quote
 */
export async function deleteQuote(
  siteId: string,
  quoteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .delete()
      .eq('id', quoteId)
      .eq('site_id', siteId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete quote' 
    }
  }
}

/**
 * Duplicate a quote
 */
export async function duplicateQuote(
  siteId: string,
  quoteId: string,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get original quote with items
    const original = await getQuote(siteId, quoteId)
    if (!original) {
      return { success: false, error: 'Original quote not found' }
    }
    
    // Generate new quote number
    const quoteNumber = await generateQuoteNumber(siteId)
    
    // Calculate new validity
    const { data: settings } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('default_validity_days')
      .eq('site_id', siteId)
      .single()
    
    const validityDays = settings?.default_validity_days || 30
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validityDays)
    validUntil.setHours(23, 59, 59, 999)
    
    // Create new quote
    const { data: newQuote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .insert({
        site_id: original.site_id,
        agency_id: original.agency_id,
        quote_number: quoteNumber,
        reference_number: null,
        customer_id: original.customer_id,
        customer_email: original.customer_email,
        customer_name: original.customer_name,
        customer_company: original.customer_company,
        customer_phone: original.customer_phone,
        billing_address: original.billing_address,
        shipping_address: original.shipping_address,
        status: 'draft',
        subtotal: original.subtotal,
        discount_type: original.discount_type,
        discount_value: original.discount_value,
        discount_amount: original.discount_amount,
        tax_rate: original.tax_rate,
        tax_amount: original.tax_amount,
        shipping_amount: original.shipping_amount,
        total: original.total,
        currency: original.currency,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        title: original.title,
        introduction: original.introduction,
        terms_and_conditions: original.terms_and_conditions,
        notes_to_customer: original.notes_to_customer,
        internal_notes: `Duplicated from ${original.quote_number}`,
        template_id: original.template_id,
        created_by: userId,
        last_modified_by: userId,
        metadata: { ...original.metadata, duplicated_from: original.id }
      })
      .select()
      .single()
    
    if (quoteError) throw quoteError
    
    // Copy items
    if (original.items && original.items.length > 0) {
      const newItems = original.items.map((item, index) => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        tax_rate: item.tax_rate,
        line_total: item.line_total,
        options: item.options,
        sort_order: index
      }))
      
      await supabase
        .from(`${TABLE_PREFIX}_quote_items`)
        .insert(newItems)
    }
    
    // Log activity on original
    await logQuoteActivity(
      quoteId,
      'duplicated',
      `Quote duplicated as ${quoteNumber}`,
      {
        performedBy: userId,
        performedByName: userName,
        metadata: { new_quote_id: newQuote.id }
      }
    )
    
    // Log activity on new
    await logQuoteActivity(
      newQuote.id,
      'created',
      `Quote ${quoteNumber} created (duplicated from ${original.quote_number})`,
      {
        performedBy: userId,
        performedByName: userName,
        metadata: { duplicated_from: quoteId }
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, quote: newQuote }
  } catch (error) {
    console.error('Error duplicating quote:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate quote' 
    }
  }
}

// ============================================================================
// QUOTE ITEMS
// ============================================================================

/**
 * Add item to quote
 */
export async function addQuoteItem(
  siteId: string,
  input: QuoteItemInput,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; item?: QuoteItem; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id, quote_number')
      .eq('id', input.quote_id)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Calculate line total
    const lineTotal = calculateItemLineTotal(
      input.quantity,
      input.unit_price,
      input.discount_percent || 0,
      input.tax_rate || 0
    )
    
    // Get max sort order
    const { data: maxOrderResult } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('sort_order')
      .eq('quote_id', input.quote_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    
    const sortOrder = input.sort_order ?? ((maxOrderResult?.sort_order || 0) + 1)
    
    // Insert item
    const { data: item, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .insert({
        quote_id: input.quote_id,
        product_id: input.product_id,
        variant_id: input.variant_id,
        name: input.name,
        sku: input.sku,
        description: input.description,
        image_url: input.image_url,
        quantity: input.quantity,
        unit_price: input.unit_price,
        discount_percent: input.discount_percent || 0,
        tax_rate: input.tax_rate || 0,
        line_total: lineTotal,
        options: input.options || {},
        sort_order: sortOrder
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate quote totals
    await recalculateQuoteTotals(siteId, input.quote_id)
    
    // Log activity
    await logQuoteActivity(
      input.quote_id,
      'item_added',
      `Added item: ${input.name}`,
      {
        performedBy: userId,
        performedByName: userName,
        newValue: { item_id: item.id, name: input.name, quantity: input.quantity }
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, item }
  } catch (error) {
    console.error('Error adding quote item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add item' 
    }
  }
}

/**
 * Update a quote item
 */
export async function updateQuoteItem(
  siteId: string,
  quoteId: string,
  itemId: string,
  updates: QuoteItemUpdate,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; item?: QuoteItem; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Get current item
    const { data: currentItem } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('*')
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .single()
    
    if (!currentItem) {
      return { success: false, error: 'Item not found' }
    }
    
    // Calculate new line total if quantity or price changed
    const quantity = updates.quantity ?? currentItem.quantity
    const unitPrice = updates.unit_price ?? currentItem.unit_price
    const discountPercent = updates.discount_percent ?? currentItem.discount_percent
    const taxRate = updates.tax_rate ?? currentItem.tax_rate
    
    const lineTotal = calculateItemLineTotal(quantity, unitPrice, discountPercent, taxRate)
    
    // Update item
    const { data: item, error } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .update({
        ...updates,
        line_total: lineTotal
      })
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate quote totals
    await recalculateQuoteTotals(siteId, quoteId)
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'item_updated',
      `Updated item: ${item.name}`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: currentItem,
        newValue: item
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true, item }
  } catch (error) {
    console.error('Error updating quote item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update item' 
    }
  }
}

/**
 * Remove item from quote
 */
export async function removeQuoteItem(
  siteId: string,
  quoteId: string,
  itemId: string,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Get item for logging
    const { data: item } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('*')
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .single()
    
    if (!item) {
      return { success: false, error: 'Item not found' }
    }
    
    // Delete item
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .delete()
      .eq('id', itemId)
      .eq('quote_id', quoteId)
    
    if (error) throw error
    
    // Recalculate quote totals
    await recalculateQuoteTotals(siteId, quoteId)
    
    // Log activity
    await logQuoteActivity(
      quoteId,
      'item_removed',
      `Removed item: ${item.name}`,
      {
        performedBy: userId,
        performedByName: userName,
        oldValue: item
      }
    )
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error removing quote item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove item' 
    }
  }
}

/**
 * Reorder quote items
 */
export async function reorderQuoteItems(
  siteId: string,
  quoteId: string,
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Verify quote exists and belongs to site
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('id')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Update sort order for each item
    const updates = itemIds.map((id, index) => ({
      id,
      sort_order: index
    }))
    
    for (const update of updates) {
      await supabase
        .from(`${TABLE_PREFIX}_quote_items`)
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('quote_id', quoteId)
    }
    
    revalidatePath('/ecommerce')
    
    return { success: true }
  } catch (error) {
    console.error('Error reordering quote items:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder items' 
    }
  }
}

// ============================================================================
// QUOTE TOTALS
// ============================================================================

/**
 * Recalculate and update quote totals
 */
export async function recalculateQuoteTotals(
  siteId: string,
  quoteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Get quote
    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select('*')
      .eq('id', quoteId)
      .eq('site_id', siteId)
      .single()
    
    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }
    
    // Get all items
    const { data: items } = await supabase
      .from(`${TABLE_PREFIX}_quote_items`)
      .select('*')
      .eq('quote_id', quoteId)
    
    // Calculate totals
    const totals = calculateQuoteTotals(
      items || [],
      { type: quote.discount_type, value: quote.discount_value },
      quote.shipping_amount,
      quote.tax_rate
    )
    
    // Update quote
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        subtotal: totals.subtotal,
        discount_amount: totals.quoteDiscountAmount,
        tax_amount: totals.taxAmount,
        total: totals.total
      })
      .eq('id', quoteId)
      .eq('site_id', siteId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error recalculating quote totals:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to recalculate totals' 
    }
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Execute bulk action on quotes
 */
export async function executeQuoteBulkAction(
  siteId: string,
  action: QuoteBulkAction,
  userId?: string,
  userName?: string
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  
  const results: BulkActionResult = {
    success: true,
    affected: 0,
    errors: []
  }
  
  for (const quoteId of action.quoteIds) {
    try {
      switch (action.action) {
        case 'delete':
          const deleteResult = await deleteQuote(siteId, quoteId)
          if (!deleteResult.success) {
            results.errors.push(deleteResult.error || 'Delete failed')
          } else {
            results.affected++
          }
          break
          
        case 'mark_expired':
          const { error: expireError } = await supabase
            .from(`${TABLE_PREFIX}_quotes`)
            .update({ status: 'expired' })
            .eq('id', quoteId)
            .eq('site_id', siteId)
          
          if (expireError) {
            results.errors.push(expireError.message)
          } else {
            await logQuoteActivity(quoteId, 'expired', 'Quote marked as expired (bulk action)', {
              performedBy: userId,
              performedByName: userName
            })
            results.affected++
          }
          break
          
        case 'duplicate':
          const dupResult = await duplicateQuote(siteId, quoteId, userId, userName)
          if (!dupResult.success) {
            results.errors.push(dupResult.error || 'Duplicate failed')
          } else {
            results.affected++
          }
          break
          
        default:
          results.errors.push(`Unknown action: ${action.action}`)
      }
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  results.success = results.errors.length === 0
  
  revalidatePath('/ecommerce')
  
  return results
}

// ============================================================================
// QUOTE SETTINGS
// ============================================================================

/**
 * Get quote settings for a site
 */
export async function getQuoteSettings(
  siteId: string
): Promise<QuoteSettings | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_quote_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quote settings:', error)
  }
  
  return data
}

/**
 * Update quote settings
 */
export async function updateQuoteSettings(
  siteId: string,
  agencyId: string,
  updates: Partial<QuoteSettings>
): Promise<{ success: boolean; settings?: QuoteSettings; error?: string }> {
  const supabase = await getModuleClient()
  
  try {
    // Check if settings exist
    const { data: existing } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('id')
      .eq('site_id', siteId)
      .single()
    
    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .update(updates)
        .eq('site_id', siteId)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .insert({
          site_id: siteId,
          agency_id: agencyId,
          ...updates
        })
        .select()
        .single()
    }
    
    if (result.error) throw result.error
    
    revalidatePath('/ecommerce')
    
    return { success: true, settings: result.data }
  } catch (error) {
    console.error('Error updating quote settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update settings' 
    }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get quote statistics for dashboard
 */
export async function getQuoteStats(siteId: string): Promise<{
  total: number
  draft: number
  pending: number
  sent: number
  viewed: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  totalValue: number
  acceptedValue: number
  conversionRate: number
}> {
  const supabase = await getModuleClient()
  
  const { data: quotes } = await supabase
    .from(`${TABLE_PREFIX}_quotes`)
    .select('status, total')
    .eq('site_id', siteId)
  
  if (!quotes || quotes.length === 0) {
    return {
      total: 0,
      draft: 0,
      pending: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      totalValue: 0,
      acceptedValue: 0,
      conversionRate: 0
    }
  }
  
  const stats = {
    total: quotes.length,
    draft: 0,
    pending: 0,
    sent: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    totalValue: 0,
    acceptedValue: 0,
    conversionRate: 0
  }
  
  for (const quote of quotes) {
    stats.totalValue += Number(quote.total) || 0
    
    switch (quote.status) {
      case 'draft': stats.draft++; break
      case 'pending_approval': stats.pending++; break
      case 'sent': stats.sent++; break
      case 'viewed': stats.viewed++; break
      case 'accepted': 
        stats.accepted++
        stats.acceptedValue += Number(quote.total) || 0
        break
      case 'rejected': stats.rejected++; break
      case 'expired': stats.expired++; break
      case 'converted': 
        stats.converted++
        stats.acceptedValue += Number(quote.total) || 0
        break
    }
  }
  
  // Calculate conversion rate (accepted + converted) / (sent + viewed + accepted + rejected + expired + converted)
  const responded = stats.sent + stats.viewed + stats.accepted + stats.rejected + stats.expired + stats.converted
  stats.conversionRate = responded > 0 
    ? Math.round(((stats.accepted + stats.converted) / responded) * 100) 
    : 0
  
  return stats
}
