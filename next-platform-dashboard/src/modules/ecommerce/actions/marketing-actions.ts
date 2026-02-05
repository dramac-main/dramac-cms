/**
 * Marketing Server Actions
 * 
 * Phase ECOM-42A: Marketing Features - Schema & Server Actions
 * 
 * Server actions for flash sales, bundles, gift cards, and loyalty.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FlashSale,
  FlashSaleInput,
  FlashSaleUpdate,
  FlashSaleProduct,
  AddFlashSaleProductInput,
  Bundle,
  BundleInput,
  BundleUpdate,
  BundleItem,
  BundleItemInput,
  GiftCard,
  GiftCardInput,
  GiftCardTransaction,
  GiftCardRedemption,
  LoyaltyConfig,
  LoyaltyConfigInput,
  LoyaltyPoints,
  LoyaltyTransaction,
  EarnPointsInput,
  RedeemPointsInput,
  MarketingStats
} from '../types/marketing-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get supabase client with any type to allow dynamic table names
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getModuleClient(): Promise<any> {
  const supabase = await createClient()
  return supabase
}

// ============================================================================
// FLASH SALES
// ============================================================================

/**
 * Get all flash sales for a site
 */
export async function getFlashSales(
  siteId: string,
  status?: string
): Promise<FlashSale[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select(`
        *,
        products:${TABLE_PREFIX}_flash_sale_products(count)
      `)
      .eq('site_id', siteId)
      .order('starts_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((sale: any) => ({
      ...sale,
      product_count: sale.products?.[0]?.count ?? 0
    }))
  } catch (error) {
    console.error('Error getting flash sales:', error)
    return []
  }
}

/**
 * Get active flash sales (currently running)
 */
export async function getActiveFlashSales(siteId: string): Promise<FlashSale[]> {
  try {
    const supabase = await getModuleClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select(`
        *,
        products:${TABLE_PREFIX}_flash_sale_products(
          *,
          product:${TABLE_PREFIX}_products(id, name, base_price, images)
        )
      `)
      .eq('site_id', siteId)
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('ends_at', { ascending: true })
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting active flash sales:', error)
    return []
  }
}

/**
 * Get a single flash sale by ID
 */
export async function getFlashSale(saleId: string): Promise<FlashSale | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select(`
        *,
        products:${TABLE_PREFIX}_flash_sale_products(
          *,
          product:${TABLE_PREFIX}_products(id, name, base_price, images, sku)
        )
      `)
      .eq('id', saleId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting flash sale:', error)
    return null
  }
}

/**
 * Create a new flash sale
 */
export async function createFlashSale(
  siteId: string,
  input: FlashSaleInput
): Promise<{ success: boolean; sale?: FlashSale; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Determine initial status based on timing
    const now = new Date()
    const startsAt = new Date(input.starts_at)
    const endsAt = new Date(input.ends_at)
    
    let status = 'draft'
    if (startsAt <= now && endsAt > now) {
      status = 'active'
    } else if (startsAt > now) {
      status = 'scheduled'
    } else if (endsAt <= now) {
      status = 'ended'
    }
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .insert({
        site_id: siteId,
        ...input,
        status,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, sale: data }
  } catch (error) {
    console.error('Error creating flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create flash sale' 
    }
  }
}

/**
 * Update a flash sale
 */
export async function updateFlashSale(
  saleId: string,
  updates: FlashSaleUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .update(updates)
      .eq('id', saleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error updating flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update flash sale' 
    }
  }
}

/**
 * Delete a flash sale
 */
export async function deleteFlashSale(
  saleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .delete()
      .eq('id', saleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error deleting flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete flash sale' 
    }
  }
}

/**
 * Add products to a flash sale
 */
export async function addProductsToFlashSale(
  saleId: string,
  products: AddFlashSaleProductInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const rows = products.map((p, index) => ({
      flash_sale_id: saleId,
      product_id: p.product_id,
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      quantity_limit: p.quantity_limit,
      sort_order: p.sort_order ?? index
    }))
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sale_products`)
      .upsert(rows, { 
        onConflict: 'flash_sale_id,product_id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error adding products to flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add products' 
    }
  }
}

/**
 * Remove a product from a flash sale
 */
export async function removeProductFromFlashSale(
  saleId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sale_products`)
      .delete()
      .eq('flash_sale_id', saleId)
      .eq('product_id', productId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error removing product from flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove product' 
    }
  }
}

// ============================================================================
// BUNDLES
// ============================================================================

/**
 * Get all bundles for a site
 */
export async function getBundles(
  siteId: string,
  activeOnly: boolean = false
): Promise<Bundle[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .select(`
        *,
        items:${TABLE_PREFIX}_bundle_items(
          *,
          product:${TABLE_PREFIX}_products(id, name, base_price, images)
        )
      `)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting bundles:', error)
    return []
  }
}

/**
 * Get a single bundle by ID
 */
export async function getBundle(bundleId: string): Promise<Bundle | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .select(`
        *,
        items:${TABLE_PREFIX}_bundle_items(
          *,
          product:${TABLE_PREFIX}_products(id, name, base_price, images, sku),
          variant:${TABLE_PREFIX}_product_variants(id, name, price)
        )
      `)
      .eq('id', bundleId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting bundle:', error)
    return null
  }
}

/**
 * Create a new bundle
 */
export async function createBundle(
  siteId: string,
  input: BundleInput
): Promise<{ success: boolean; bundle?: Bundle; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .insert({
        site_id: siteId,
        ...input,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, bundle: data }
  } catch (error) {
    console.error('Error creating bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create bundle' 
    }
  }
}

/**
 * Update a bundle
 */
export async function updateBundle(
  bundleId: string,
  updates: BundleUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .update(updates)
      .eq('id', bundleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error updating bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update bundle' 
    }
  }
}

/**
 * Delete a bundle
 */
export async function deleteBundle(
  bundleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .delete()
      .eq('id', bundleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error deleting bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete bundle' 
    }
  }
}

/**
 * Add items to a bundle
 */
export async function addItemsToBundle(
  bundleId: string,
  items: BundleItemInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const rows = items.map((item, index) => ({
      bundle_id: bundleId,
      product_id: item.product_id,
      quantity: item.quantity ?? 1,
      variant_id: item.variant_id,
      price_override: item.price_override,
      is_optional: item.is_optional ?? false,
      sort_order: item.sort_order ?? index
    }))
    
    // Insert items one by one to handle unique constraint
    for (const row of rows) {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_bundle_items`)
        .upsert(row, {
          onConflict: 'bundle_id,product_id,variant_id'
        })
      
      if (error) throw error
    }
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error adding items to bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add items' 
    }
  }
}

/**
 * Remove an item from a bundle
 */
export async function removeItemFromBundle(
  bundleId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundle_items`)
      .delete()
      .eq('id', itemId)
      .eq('bundle_id', bundleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error removing item from bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove item' 
    }
  }
}

// ============================================================================
// GIFT CARDS
// ============================================================================

/**
 * Get gift cards for a site
 */
export async function getGiftCards(
  siteId: string,
  options?: { 
    type?: string
    active_only?: boolean
    limit?: number
  }
): Promise<GiftCard[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (options?.type) {
      query = query.eq('type', options.type)
    }
    
    if (options?.active_only) {
      query = query.eq('is_active', true)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting gift cards:', error)
    return []
  }
}

/**
 * Get a gift card by code
 */
export async function getGiftCardByCode(
  siteId: string,
  code: string
): Promise<GiftCard | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select(`
        *,
        transactions:${TABLE_PREFIX}_gift_card_transactions(*)
      `)
      .eq('site_id', siteId)
      .eq('code', code.toUpperCase())
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting gift card:', error)
    return null
  }
}

/**
 * Get a gift card by ID
 */
export async function getGiftCard(giftCardId: string): Promise<GiftCard | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select(`
        *,
        transactions:${TABLE_PREFIX}_gift_card_transactions(*)
      `)
      .eq('id', giftCardId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting gift card:', error)
    return null
  }
}

/**
 * Create a new gift card
 */
export async function createGiftCard(
  siteId: string,
  input: GiftCardInput
): Promise<{ success: boolean; gift_card?: GiftCard; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Generate unique code using database function
    const { data: codeResult } = await supabase
      .rpc('generate_gift_card_code')
    
    const code = codeResult || `GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .insert({
        site_id: siteId,
        code,
        current_balance: input.initial_balance,
        ...input,
        purchased_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Record initial purchase transaction
    await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .insert({
        gift_card_id: data.id,
        type: 'purchase',
        amount: input.initial_balance,
        balance_after: input.initial_balance,
        performed_by: user?.id
      })
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, gift_card: data }
  } catch (error) {
    console.error('Error creating gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create gift card' 
    }
  }
}

/**
 * Redeem a gift card for an order
 */
export async function redeemGiftCard(
  siteId: string,
  redemption: GiftCardRedemption
): Promise<{ success: boolean; amount_applied?: number; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get current gift card
    const { data: card } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('*')
      .eq('id', redemption.gift_card_id)
      .eq('site_id', siteId)
      .single()
    
    if (!card) {
      return { success: false, error: 'Gift card not found' }
    }
    
    if (!card.is_active) {
      return { success: false, error: 'Gift card is not active' }
    }
    
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return { success: false, error: 'Gift card has expired' }
    }
    
    if (card.current_balance < redemption.amount) {
      return { success: false, error: 'Insufficient balance' }
    }
    
    // Deduct balance
    const newBalance = card.current_balance - redemption.amount
    
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .update({ 
        current_balance: newBalance,
        current_uses: card.current_uses + 1
      })
      .eq('id', redemption.gift_card_id)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .insert({
        gift_card_id: redemption.gift_card_id,
        type: 'redemption',
        amount: -redemption.amount,
        balance_after: newBalance,
        order_id: redemption.order_id,
        performed_by: user?.id
      })
    
    return { success: true, amount_applied: redemption.amount }
  } catch (error) {
    console.error('Error redeeming gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to redeem gift card' 
    }
  }
}

/**
 * Refund to a gift card
 */
export async function refundToGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get current balance
    const { data: card } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('current_balance')
      .eq('id', giftCardId)
      .single()
    
    if (!card) {
      return { success: false, error: 'Gift card not found' }
    }
    
    const newBalance = card.current_balance + amount
    
    // Update balance
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .update({ current_balance: newBalance })
      .eq('id', giftCardId)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .insert({
        gift_card_id: giftCardId,
        type: 'refund',
        amount,
        balance_after: newBalance,
        order_id: orderId,
        notes,
        performed_by: user?.id
      })
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error refunding to gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refund' 
    }
  }
}

/**
 * Get gift card transaction history
 */
export async function getGiftCardTransactions(
  giftCardId: string
): Promise<GiftCardTransaction[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .select('*')
      .eq('gift_card_id', giftCardId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting gift card transactions:', error)
    return []
  }
}

/**
 * Deactivate a gift card
 */
export async function deactivateGiftCard(
  giftCardId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .update({ is_active: false })
      .eq('id', giftCardId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error deactivating gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deactivate gift card' 
    }
  }
}

// ============================================================================
// LOYALTY PROGRAM
// ============================================================================

/**
 * Get loyalty program config for a site
 */
export async function getLoyaltyConfig(
  siteId: string
): Promise<LoyaltyConfig | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_config`)
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return data
  } catch (error) {
    console.error('Error getting loyalty config:', error)
    return null
  }
}

/**
 * Configure loyalty program
 */
export async function configureLoyalty(
  siteId: string,
  input: LoyaltyConfigInput
): Promise<{ success: boolean; config?: LoyaltyConfig; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_config`)
      .upsert({
        site_id: siteId,
        ...input
      }, {
        onConflict: 'site_id'
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, config: data }
  } catch (error) {
    console.error('Error configuring loyalty:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure loyalty' 
    }
  }
}

/**
 * Get customer loyalty points
 */
export async function getCustomerLoyaltyPoints(
  siteId: string,
  customerId: string
): Promise<LoyaltyPoints | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select(`
        *,
        customer:${TABLE_PREFIX}_customers(id, first_name, last_name, email)
      `)
      .eq('site_id', siteId)
      .eq('customer_id', customerId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return data
  } catch (error) {
    console.error('Error getting customer loyalty points:', error)
    return null
  }
}

/**
 * Get all loyalty members for a site
 */
export async function getLoyaltyMembers(
  siteId: string,
  options?: {
    limit?: number
    offset?: number
    tier?: string
  }
): Promise<{ members: LoyaltyPoints[]; total: number }> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select(`
        *,
        customer:${TABLE_PREFIX}_customers(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('site_id', siteId)
      .order('lifetime_points', { ascending: false })
    
    if (options?.tier) {
      query = query.eq('current_tier', options.tier)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return { members: data ?? [], total: count ?? 0 }
  } catch (error) {
    console.error('Error getting loyalty members:', error)
    return { members: [], total: 0 }
  }
}

/**
 * Earn loyalty points
 */
export async function earnPoints(
  siteId: string,
  input: EarnPointsInput
): Promise<{ success: boolean; new_balance?: number; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get or create loyalty points record
    let { data: pointsRecord } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', input.customer_id)
      .single()
    
    if (!pointsRecord) {
      // Create new record
      const { data: newRecord, error: createError } = await supabase
        .from(`${TABLE_PREFIX}_loyalty_points`)
        .insert({
          site_id: siteId,
          customer_id: input.customer_id,
          points_balance: 0,
          lifetime_points: 0,
          redeemed_points: 0
        })
        .select()
        .single()
      
      if (createError) throw createError
      pointsRecord = newRecord
    }
    
    const newBalance = pointsRecord.points_balance + input.points
    const newLifetime = pointsRecord.lifetime_points + input.points
    
    // Update balance
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .update({
        points_balance: newBalance,
        lifetime_points: newLifetime,
        last_earned_at: new Date().toISOString()
      })
      .eq('id', pointsRecord.id)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_loyalty_transactions`)
      .insert({
        site_id: siteId,
        customer_id: input.customer_id,
        type: input.type,
        points: input.points,
        balance_after: newBalance,
        order_id: input.order_id,
        description: input.description
      })
    
    return { success: true, new_balance: newBalance }
  } catch (error) {
    console.error('Error earning points:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to earn points' 
    }
  }
}

/**
 * Redeem loyalty points
 */
export async function redeemPoints(
  siteId: string,
  input: RedeemPointsInput
): Promise<{ success: boolean; new_balance?: number; discount_value?: number; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get config for point value
    const config = await getLoyaltyConfig(siteId)
    
    if (!config?.is_enabled) {
      return { success: false, error: 'Loyalty program is not enabled' }
    }
    
    // Get current balance
    const { data: pointsRecord } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', input.customer_id)
      .single()
    
    if (!pointsRecord) {
      return { success: false, error: 'No loyalty points found' }
    }
    
    if (pointsRecord.points_balance < input.points) {
      return { success: false, error: 'Insufficient points' }
    }
    
    if (input.points < config.minimum_redemption) {
      return { success: false, error: `Minimum redemption is ${config.minimum_redemption} points` }
    }
    
    const newBalance = pointsRecord.points_balance - input.points
    const newRedeemed = pointsRecord.redeemed_points + input.points
    const discountValue = input.points * config.points_value_cents
    
    // Update balance
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .update({
        points_balance: newBalance,
        redeemed_points: newRedeemed,
        last_redeemed_at: new Date().toISOString()
      })
      .eq('id', pointsRecord.id)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_loyalty_transactions`)
      .insert({
        site_id: siteId,
        customer_id: input.customer_id,
        type: 'redeem_order',
        points: -input.points,
        balance_after: newBalance,
        order_id: input.order_id
      })
    
    return { success: true, new_balance: newBalance, discount_value: discountValue }
  } catch (error) {
    console.error('Error redeeming points:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to redeem points' 
    }
  }
}

/**
 * Get loyalty transaction history for a customer
 */
export async function getCustomerLoyaltyHistory(
  siteId: string,
  customerId: string,
  limit: number = 50
): Promise<LoyaltyTransaction[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_transactions`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting loyalty history:', error)
    return []
  }
}

/**
 * Adjust loyalty points (admin manual adjustment)
 */
export async function adjustLoyaltyPoints(
  siteId: string,
  customerId: string,
  points: number,
  description: string
): Promise<{ success: boolean; new_balance?: number; error?: string }> {
  try {
    const type = points > 0 ? 'earn_adjustment' : 'redeem_adjustment'
    
    return await earnPoints(siteId, {
      customer_id: customerId,
      type: type as EarnPointsInput['type'],
      points: Math.abs(points) * (points > 0 ? 1 : -1),
      description
    })
  } catch (error) {
    console.error('Error adjusting points:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to adjust points' 
    }
  }
}

// ============================================================================
// MARKETING STATS
// ============================================================================

/**
 * Get marketing stats overview
 */
export async function getMarketingStats(siteId: string): Promise<MarketingStats> {
  try {
    const supabase = await getModuleClient()
    
    // Get flash sales stats
    const { data: flashSales } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select('id, status, current_uses')
      .eq('site_id', siteId)
    
    // Get bundles stats
    const { data: bundles } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .select('id, is_active')
      .eq('site_id', siteId)
    
    // Get gift cards stats
    const { data: giftCards } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('id, is_active, initial_balance, current_balance')
      .eq('site_id', siteId)
    
    // Get loyalty stats
    const loyaltyConfig = await getLoyaltyConfig(siteId)
    const { data: loyaltyPoints } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select('lifetime_points, redeemed_points')
      .eq('site_id', siteId)
    
    return {
      flash_sales: {
        total: flashSales?.length ?? 0,
        active: flashSales?.filter((s: { status: string }) => s.status === 'active').length ?? 0,
        total_redemptions: flashSales?.reduce((sum: number, s: { current_uses?: number }) => sum + (s.current_uses ?? 0), 0) ?? 0
      },
      bundles: {
        total: bundles?.length ?? 0,
        active: bundles?.filter((b: { is_active: boolean }) => b.is_active).length ?? 0,
        total_sold: 0 // Would need order data to calculate
      },
      gift_cards: {
        total_issued: giftCards?.length ?? 0,
        active_cards: giftCards?.filter((c: { is_active: boolean; current_balance: number }) => c.is_active && c.current_balance > 0).length ?? 0,
        total_value: giftCards?.reduce((sum: number, c: { initial_balance?: number }) => sum + (c.initial_balance ?? 0), 0) ?? 0,
        outstanding_balance: giftCards?.reduce((sum: number, c: { current_balance?: number }) => sum + (c.current_balance ?? 0), 0) ?? 0
      },
      loyalty: {
        is_enabled: loyaltyConfig?.is_enabled ?? false,
        total_members: loyaltyPoints?.length ?? 0,
        total_points_issued: loyaltyPoints?.reduce((sum: number, p: { lifetime_points?: number }) => sum + (p.lifetime_points ?? 0), 0) ?? 0,
        total_points_redeemed: loyaltyPoints?.reduce((sum: number, p: { redeemed_points?: number }) => sum + (p.redeemed_points ?? 0), 0) ?? 0
      }
    }
  } catch (error) {
    console.error('Error getting marketing stats:', error)
    return {
      flash_sales: { total: 0, active: 0, total_redemptions: 0 },
      bundles: { total: 0, active: 0, total_sold: 0 },
      gift_cards: { total_issued: 0, active_cards: 0, total_value: 0, outstanding_balance: 0 },
      loyalty: { is_enabled: false, total_members: 0, total_points_issued: 0, total_points_redeemed: 0 }
    }
  }
}
