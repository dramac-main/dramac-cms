/**
 * PUBLIC E-Commerce Module Server Actions
 * 
 * These server actions use the ADMIN client (service role) to bypass RLS.
 * They are used by public-facing storefront components on published sites
 * where visitors are NOT authenticated.
 * 
 * SECURITY: These only perform READ operations + cart/order creation.
 * They are scoped to a specific siteId and only return public-safe data.
 * 
 * The authenticated actions in ecommerce-actions.ts remain for dashboard use.
 */
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/locale-config'
import { notifyNewOrder } from '@/lib/services/business-notifications'
import type {
  Product, ProductFilters,
  Category,
  ProductVariant, ProductOption,
  Cart, CartItem,
  Order, CreateOrderInput,
  EcommerceSettings,
  PaginatedResponse,
} from '../types/ecommerce-types'

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

const ECOMMERCE_SHORT_ID = 'ecommod01'
const TABLE_PREFIX = `mod_${ECOMMERCE_SHORT_ID}`

/** Admin client for public-facing reads — bypasses RLS */
function getPublicClient() {
  return createAdminClient() as any
}

// ============================================================================
// CATEGORIES (public reads)
// ============================================================================

export async function getPublicCategories(siteId: string): Promise<Category[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_categories`)
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[Ecom Public] getPublicCategories error:', error)
      return []
    }
    return (data || []) as Category[]
  } catch (err) {
    console.error('[Ecom Public] getPublicCategories unexpected error:', err)
    return []
  }
}

// ============================================================================
// PRODUCTS (public reads)
// ============================================================================

export async function getPublicProducts(
  siteId: string,
  filters: ProductFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Product>> {
  try {
    const supabase = getPublicClient()

    let query = supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .eq('status', 'active') // Public only sees active products

    if (filters.featured !== undefined) {
      query = query.eq('is_featured', filters.featured)
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('base_price', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('base_price', filters.maxPrice)
    }
    if (filters.inStock) {
      query = query.or('track_inventory.eq.false,quantity.gt.0')
    }
    if (filters.onSale) {
      query = query.not('compare_at_price', 'is', null)
    }

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1).order('created_at', { ascending: false })

    const { data, count, error } = await query

    if (error) {
      console.error('[Ecom Public] getPublicProducts error:', error)
      return { data: [], total: 0, page, totalPages: 0, limit }
    }

    return {
      data: (data || []) as Product[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      limit,
    }
  } catch (err) {
    console.error('[Ecom Public] getPublicProducts unexpected error:', err)
    return { data: [], total: 0, page, totalPages: 0, limit }
  }
}

export async function getPublicProductsByCategory(
  siteId: string,
  categoryId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Product>> {
  try {
    const supabase = getPublicClient()

    // Get product IDs in category
    const { data: productCategories } = await supabase
      .from(`${TABLE_PREFIX}_product_categories`)
      .select('product_id')
      .eq('category_id', categoryId)

    const productIds = productCategories?.map((pc: { product_id: string }) => pc.product_id) || []
    if (productIds.length === 0) {
      return { data: [], total: 0, page, totalPages: 0, limit }
    }

    const from = (page - 1) * limit
    const { data, count, error } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .eq('status', 'active')
      .in('id', productIds)
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Ecom Public] getPublicProductsByCategory error:', error)
      return { data: [], total: 0, page, totalPages: 0, limit }
    }

    return {
      data: (data || []) as Product[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      limit,
    }
  } catch (err) {
    console.error('[Ecom Public] getPublicProductsByCategory unexpected error:', err)
    return { data: [], total: 0, page, totalPages: 0, limit }
  }
}

export async function getPublicProduct(siteId: string, id: string): Promise<Product | null> {
  try {
    const supabase = getPublicClient()

    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('*')
      .eq('site_id', siteId)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[Ecom Public] getPublicProduct error:', error)
      return null
    }

    // Fetch variants and options
    const [variantsResult, optionsResult] = await Promise.all([
      supabase
        .from(`${TABLE_PREFIX}_product_variants`)
        .select('*')
        .eq('product_id', id),
      supabase
        .from(`${TABLE_PREFIX}_product_options`)
        .select('*')
        .eq('product_id', id)
        .order('sort_order', { ascending: true }),
    ])

    const product = data as Product
    product.variants = (variantsResult.data || []) as ProductVariant[]
    product.options = (optionsResult.data || []) as ProductOption[]

    return product
  } catch (err) {
    console.error('[Ecom Public] getPublicProduct unexpected error:', err)
    return null
  }
}

export async function getPublicProductBySlug(siteId: string, slug: string): Promise<Product | null> {
  try {
    const supabase = getPublicClient()

    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('*')
      .eq('site_id', siteId)
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[Ecom Public] getPublicProductBySlug error:', error)
      return null
    }

    const [variantsResult, optionsResult] = await Promise.all([
      supabase
        .from(`${TABLE_PREFIX}_product_variants`)
        .select('*')
        .eq('product_id', data.id),
      supabase
        .from(`${TABLE_PREFIX}_product_options`)
        .select('*')
        .eq('product_id', data.id)
        .order('sort_order', { ascending: true }),
    ])

    const product = data as Product
    product.variants = (variantsResult.data || []) as ProductVariant[]
    product.options = (optionsResult.data || []) as ProductOption[]

    return product
  } catch (err) {
    console.error('[Ecom Public] getPublicProductBySlug unexpected error:', err)
    return null
  }
}

export async function getPublicProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_product_variants`)
      .select('*')
      .eq('product_id', productId)

    if (error) {
      console.error('[Ecom Public] getPublicProductVariants error:', error)
      return []
    }
    return (data || []) as ProductVariant[]
  } catch (err) {
    console.error('[Ecom Public] getPublicProductVariants unexpected error:', err)
    return []
  }
}

export async function getPublicProductOptions(productId: string): Promise<ProductOption[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_product_options`)
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[Ecom Public] getPublicProductOptions error:', error)
      return []
    }
    return (data || []) as ProductOption[]
  } catch (err) {
    console.error('[Ecom Public] getPublicProductOptions unexpected error:', err)
    return []
  }
}

// ============================================================================
// CART (public — anonymous visitors can have carts via sessionId)
// ============================================================================

async function findPublicCart(siteId: string, userId?: string, sessionId?: string): Promise<Cart | null> {
  try {
    const supabase = getPublicClient()

    let query = supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select(`
        *,
        items:${TABLE_PREFIX}_cart_items(
          *,
          product:${TABLE_PREFIX}_products(id, name, slug, images, status, quantity, base_price),
          variant:${TABLE_PREFIX}_product_variants(id, options, quantity, image_url, price)
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
    if (error && error.code !== 'PGRST116') {
      console.error('[Ecom Public] findPublicCart error:', error)
      return null
    }
    return (data as Cart) || null
  } catch (err) {
    console.error('[Ecom Public] findPublicCart unexpected error:', err)
    return null
  }
}

export async function getPublicOrCreateCart(siteId: string, userId?: string, sessionId?: string): Promise<Cart> {
  const existing = await findPublicCart(siteId, userId, sessionId)
  if (existing) return existing

  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .insert({
        site_id: siteId,
        user_id: userId || null,
        session_id: sessionId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Ecom Public] createCart error:', error)
      throw new Error('Failed to create cart')
    }
    return { ...data, items: [] } as Cart
  } catch (err) {
    console.error('[Ecom Public] getPublicOrCreateCart unexpected error:', err)
    throw err
  }
}

export async function getPublicCart(cartId: string): Promise<Cart | null> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select(`
        *,
        items:${TABLE_PREFIX}_cart_items(
          *,
          product:${TABLE_PREFIX}_products(id, name, slug, images, status, quantity, base_price),
          variant:${TABLE_PREFIX}_product_variants(id, options, quantity, image_url, price)
        )
      `)
      .eq('id', cartId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[Ecom Public] getPublicCart error:', error)
      return null
    }
    return data as Cart
  } catch (err) {
    console.error('[Ecom Public] getPublicCart unexpected error:', err)
    return null
  }
}

export async function addPublicCartItem(
  cartId: string,
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<CartItem> {
  const supabase = getPublicClient()

  // Get product price and validate
  const { data: product, error: prodError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('base_price, quantity, status, track_inventory')
    .eq('id', productId)
    .single()

  if (prodError || !product) throw new Error('Product not found')
  if (product.status !== 'active') throw new Error('Product is not available')

  let unitPrice = product.base_price

  if (variantId) {
    const { data: variant, error: varError } = await supabase
      .from(`${TABLE_PREFIX}_product_variants`)
      .select('price, quantity, is_active')
      .eq('id', variantId)
      .single()

    if (varError || !variant) throw new Error('Variant not found')
    if (!variant.is_active) throw new Error('Variant is not available')
    if (variant.price) unitPrice = variant.price
    if (product.track_inventory && variant.quantity < quantity) throw new Error('Insufficient stock for this variant')
  } else if (product.track_inventory && product.quantity < quantity) {
    throw new Error('Insufficient stock')
  }

  // Check if item already exists — upsert pattern
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .is('variant_id', variantId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_cart_items`)
      .update({ quantity: existing.quantity + quantity, unit_price: unitPrice })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as CartItem
  } else {
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_cart_items`)
      .insert({ cart_id: cartId, product_id: productId, variant_id: variantId, quantity, unit_price: unitPrice })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as CartItem
  }
}

export async function updatePublicCartItemQuantity(itemId: string, quantity: number): Promise<CartItem | null> {
  const supabase = getPublicClient()

  if (quantity <= 0) {
    await removePublicCartItem(itemId)
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

export async function removePublicCartItem(itemId: string): Promise<void> {
  const supabase = getPublicClient()
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .delete()
    .eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function clearPublicCart(cartId: string): Promise<void> {
  const supabase = getPublicClient()
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_cart_items`)
    .delete()
    .eq('cart_id', cartId)
  if (error) throw new Error(error.message)
}

export async function applyPublicDiscountToCart(
  cartId: string,
  code: string,
  subtotal: number
): Promise<{ success: boolean; discountAmount: number; error?: string }> {
  try {
    const supabase = getPublicClient()

    // Get cart to find site_id
    const { data: cart } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select('site_id')
      .eq('id', cartId)
      .single()

    if (!cart) return { success: false, discountAmount: 0, error: 'Cart not found' }

    // Validate discount code
    const { data: discount, error: discErr } = await supabase
      .from(`${TABLE_PREFIX}_discounts`)
      .select('*')
      .eq('site_id', cart.site_id)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (discErr || !discount) {
      return { success: false, discountAmount: 0, error: 'Invalid discount code' }
    }

    // Check date validity
    const now = new Date()
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return { success: false, discountAmount: 0, error: 'Discount not yet active' }
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return { success: false, discountAmount: 0, error: 'Discount has expired' }
    }

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return { success: false, discountAmount: 0, error: 'Discount usage limit reached' }
    }

    // Check minimum order amount
    if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
      return { success: false, discountAmount: 0, error: `Minimum order of ${formatCurrency(discount.minimum_order_amount)} required` }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100
    } else if (discount.type === 'fixed_amount') {
      discountAmount = Math.min(discount.value, subtotal)
    }

    // Update cart with discount
    await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .update({ discount_code: code.toUpperCase(), discount_amount: discountAmount })
      .eq('id', cartId)

    return { success: true, discountAmount }
  } catch (err) {
    console.error('[Ecom Public] applyPublicDiscountToCart error:', err)
    return { success: false, discountAmount: 0, error: 'Failed to apply discount' }
  }
}

export async function removePublicDiscountFromCart(cartId: string): Promise<void> {
  const supabase = getPublicClient()
  await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .update({ discount_code: null, discount_amount: 0 })
    .eq('id', cartId)
}

// ============================================================================
// SETTINGS (public reads — needed by checkout + webhooks)
// ============================================================================

export async function getPublicEcommerceSettings(siteId: string): Promise<EcommerceSettings | null> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select('*')
      .eq('site_id', siteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[Ecom Public] getPublicEcommerceSettings error:', error)
      return null
    }
    return data as EcommerceSettings
  } catch (err) {
    console.error('[Ecom Public] getPublicEcommerceSettings unexpected error:', err)
    return null
  }
}

// ============================================================================
// ORDERS (public writes — checkout + payment webhooks)
// ============================================================================

/**
 * Create an order from a cart (public / subdomain context).
 * Uses admin client to bypass RLS for anonymous visitors.
 */
export async function createPublicOrderFromCart(input: CreateOrderInput): Promise<Order> {
  const supabase = getPublicClient()

  // Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // Get the site's agency_id
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', input.site_id)
    .single()

  const agencyId = site?.agency_id

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .insert({
      site_id: input.site_id,
      agency_id: agencyId,
      order_number: orderNumber,
      customer_id: input.user_id || null,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone || null,
      shipping_address: input.shipping_address,
      billing_address: input.billing_address,
      subtotal: input.subtotal,
      discount_amount: input.discount || 0,
      discount_code: input.discount_code || null,
      shipping_amount: input.shipping || 0,
      tax_amount: input.tax || 0,
      total: input.total,
      currency: input.currency,
      status: input.status || 'pending',
      payment_status: input.payment_status || 'pending',
      payment_provider: input.payment_provider,
      fulfillment_status: 'unfulfilled',
      customer_notes: input.notes || null,
      metadata: input.metadata || {}
    })
    .select()
    .single()

  if (orderError) {
    console.error('[Ecom Public] Error creating order:', orderError)
    throw new Error(orderError.message)
  }

  // Copy cart items to order_items
  if (input.cart_id) {
    const cart = await getPublicCart(input.cart_id)
    if (cart && cart.items.length > 0) {
      const orderItems = cart.items.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: item.product?.name || 'Unknown Product',
        product_sku: item.product?.sku || null,
        variant_options: item.variant?.options || {},
        image_url: item.product?.images?.[0] || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        fulfilled_quantity: 0
      }))

      const { error: itemsError } = await supabase
        .from(`${TABLE_PREFIX}_order_items`)
        .insert(orderItems)

      if (itemsError) {
        console.error('[Ecom Public] Error creating order items:', itemsError)
      }

      // Mark cart as converted
      await supabase
        .from(`${TABLE_PREFIX}_carts`)
        .update({ status: 'converted' })
        .eq('id', input.cart_id)

      // Send notifications (async, non-blocking)
      const notificationItems = cart.items.map((item: CartItem) => ({
        name: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }))

      notifyNewOrder({
        siteId: input.site_id,
        orderId: order.id,
        orderNumber,
        customerName: input.customer_name || `${input.shipping_address?.first_name || ''} ${input.shipping_address?.last_name || ''}`.trim() || input.customer_email?.split('@')[0] || 'Customer',
        customerEmail: input.customer_email,
        customerPhone: input.customer_phone || undefined,
        items: notificationItems,
        subtotal: input.subtotal,
        shipping: input.shipping || 0,
        tax: input.tax || 0,
        total: input.total,
        currency: input.currency,
        paymentStatus: input.payment_status || 'pending',
        shippingAddress: input.shipping_address
          ? `${input.shipping_address.address_line_1 || ''}${input.shipping_address.address_line_2 ? ', ' + input.shipping_address.address_line_2 : ''}, ${input.shipping_address.city || ''} ${input.shipping_address.state || ''} ${input.shipping_address.postal_code || ''}, ${input.shipping_address.country || ''}`
          : undefined,
      }).catch(err => console.error('[Ecom Public] Notification error:', err))
    }
  } else {
    // No cart — still fire notification
    notifyNewOrder({
      siteId: input.site_id,
      orderId: order.id,
      orderNumber,
      customerName: input.customer_name || `${input.shipping_address?.first_name || ''} ${input.shipping_address?.last_name || ''}`.trim() || input.customer_email?.split('@')[0] || 'Customer',
      customerEmail: input.customer_email,
      customerPhone: input.customer_phone || undefined,
      items: [],
      subtotal: input.subtotal,
      shipping: input.shipping || 0,
      tax: input.tax || 0,
      total: input.total,
      currency: input.currency,
      paymentStatus: input.payment_status || 'pending',
    }).catch(err => console.error('[Ecom Public] Notification error:', err))
  }

  return order as Order
}

/**
 * Update order status (public / webhook context).
 */
export async function updatePublicOrderStatus(
  siteId: string,
  orderId: string,
  status: Order['status']
): Promise<Order> {
  const supabase = getPublicClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update({ status })
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Order
}

/**
 * Update order payment status (public / webhook context).
 */
export async function updatePublicOrderPaymentStatus(
  siteId: string,
  orderId: string,
  paymentStatus: Order['payment_status'],
  transactionId?: string
): Promise<Order> {
  const supabase = getPublicClient()

  const updates: Record<string, unknown> = { payment_status: paymentStatus }
  if (transactionId) updates.payment_transaction_id = transactionId

  // Auto-update order status based on payment
  if (paymentStatus === 'paid') {
    updates.status = 'confirmed'
  } else if (paymentStatus === 'failed') {
    updates.status = 'cancelled'
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

/**
 * Generic partial order update (public / webhook context).
 */
export async function updatePublicOrder(
  siteId: string,
  orderId: string,
  updates: Partial<Order>
): Promise<Order> {
  const supabase = getPublicClient()

  // Only allow certain fields
  const allowedUpdates: Record<string, unknown> = {}
  if (updates.status) allowedUpdates.status = updates.status
  if (updates.payment_status) allowedUpdates.payment_status = updates.payment_status
  if (updates.fulfillment_status) allowedUpdates.fulfillment_status = updates.fulfillment_status
  if (updates.tracking_number !== undefined) allowedUpdates.tracking_number = updates.tracking_number
  if (updates.tracking_url !== undefined) allowedUpdates.tracking_url = updates.tracking_url
  if (updates.internal_notes !== undefined) allowedUpdates.internal_notes = updates.internal_notes
  if (updates.shipped_at !== undefined) allowedUpdates.shipped_at = updates.shipped_at
  if (updates.delivered_at !== undefined) allowedUpdates.delivered_at = updates.delivered_at

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update(allowedUpdates)
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Order
}
