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
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/locale-config'
import { notifyNewOrder, notifyOrderShipped, notifyOrderDelivered, notifyOrderCancelled, notifyLowStock } from '@/lib/services/business-notifications'
import type {
  Product, ProductInput, ProductUpdate, ProductFilters,
  Category, CategoryInput, CategoryUpdate,
  ProductVariant, ProductVariantInput, ProductVariantUpdate,
  ProductOption, ProductOptionInput,
  Cart, CartItem,
  Order, OrderFilters,
  Discount, DiscountInput, DiscountUpdate,
  EcommerceSettings, EcommerceSettingsUpdate,
  PaginatedResponse,
  CreateOrderInput
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// Helper to generate slugs
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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

export async function getCategoryBySlug(siteId: string, slug: string): Promise<Category | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
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
  
  const updateData: Record<string, unknown> = { ...input }
  if (input.name && !input.slug) {
    updateData.slug = generateSlug(input.name)
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .update(updateData)
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
): Promise<PaginatedResponse<Product>> {
  const supabase = await getModuleClient()
  
  let query = supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
  
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
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
  // On sale filter - products with compare_at_price set
  if (filters.onSale) {
    query = query.not('compare_at_price', 'is', null)
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
    data: (data || []) as Product[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    limit
  }
}

/**
 * Get featured products for a site
 * Used by Studio components to display featured products
 */
export async function getFeaturedProducts(
  siteId: string,
  limit = 8
): Promise<PaginatedResponse<Product>> {
  const supabase = await getModuleClient()
  
  const { data, count, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .eq('status', 'active')
    .eq('is_featured', true)
    .range(0, limit - 1)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching featured products:', error)
    throw new Error(error.message)
  }
  
  // If no featured products, fall back to all active products
  if (!data || data.length === 0) {
    const { data: fallbackData, count: fallbackCount, error: fallbackError } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .eq('status', 'active')
      .range(0, limit - 1)
      .order('created_at', { ascending: false })
    
    if (fallbackError) {
      console.error('Error fetching fallback products:', fallbackError)
      throw new Error(fallbackError.message)
    }
    
    return {
      data: (fallbackData || []) as Product[],
      total: fallbackCount || 0,
      page: 1,
      totalPages: Math.ceil((fallbackCount || 0) / limit),
      limit
    }
  }
  
  return {
    data: (data || []) as Product[],
    total: count || 0,
    page: 1,
    totalPages: Math.ceil((count || 0) / limit),
    limit
  }
}

export async function getProductsByCategory(
  siteId: string,
  categoryId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Product>> {
  const supabase = await getModuleClient()
  
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
  
  if (error) throw new Error(error.message)
  
  return {
    data: (data || []) as Product[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    limit
  }
}

export async function getProduct(siteId: string, id: string): Promise<Product | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
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
      .order('sort_order', { ascending: true })
  ])
  
  const product = data as Product
  product.variants = (variantsResult.data || []) as ProductVariant[]
  product.options = (optionsResult.data || []) as ProductOption[]
  
  return product
}

export async function getProductBySlug(siteId: string, slug: string): Promise<Product | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  // Fetch variants and options
  const [variantsResult, optionsResult] = await Promise.all([
    supabase
      .from(`${TABLE_PREFIX}_product_variants`)
      .select('*')
      .eq('product_id', data.id),
    supabase
      .from(`${TABLE_PREFIX}_product_options`)
      .select('*')
      .eq('product_id', data.id)
      .order('sort_order', { ascending: true })
  ])
  
  const product = data as Product
  product.variants = (variantsResult.data || []) as ProductVariant[]
  product.options = (optionsResult.data || []) as ProductOption[]
  
  return product
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
  
  const updateData: Record<string, unknown> = { ...input }
  if (input.name && !input.slug) {
    updateData.slug = generateSlug(input.name)
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .update(updateData)
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

export async function duplicateProduct(siteId: string, agencyId: string, id: string): Promise<Product> {
  const original = await getProduct(siteId, id)
  if (!original) throw new Error('Product not found')
  
  const newProduct = await createProduct(siteId, agencyId, {
    ...original,
    name: `${original.name} (Copy)`,
    slug: `${original.slug}-copy-${Date.now()}`,
    status: 'draft',
    sku: original.sku ? `${original.sku}-COPY` : null
  })
  
  // Copy variants
  if (original.variants && original.variants.length > 0) {
    for (const variant of original.variants) {
      await createProductVariant(newProduct.id, {
        product_id: newProduct.id,
        options: variant.options,
        price: variant.price,
        compare_at_price: variant.compare_at_price,
        sku: variant.sku ? `${variant.sku}-COPY` : null,
        barcode: null,
        quantity: 0,
        image_url: variant.image_url,
        is_active: variant.is_active
      })
    }
  }
  
  // Copy options
  if (original.options && original.options.length > 0) {
    for (const option of original.options) {
      await createProductOption(newProduct.id, {
        product_id: newProduct.id,
        name: option.name,
        values: option.values,
        sort_order: option.sort_order
      })
    }
  }
  
  return newProduct
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

export async function getProductVariant(variantId: string): Promise<ProductVariant | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_variants`)
    .select('*')
    .eq('id', variantId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as ProductVariant
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
// PRODUCT OPTIONS
// ============================================================================

export async function getProductOptions(productId: string): Promise<ProductOption[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_options`)
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
  
  if (error) throw new Error(error.message)
  return (data || []) as ProductOption[]
}

export async function createProductOption(productId: string, input: Partial<ProductOptionInput>): Promise<ProductOption> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_options`)
    .insert({
      product_id: productId,
      name: input.name,
      values: input.values || [],
      sort_order: input.sort_order || 0
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as ProductOption
}

export async function updateProductOption(optionId: string, input: Partial<ProductOptionInput>): Promise<ProductOption> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_options`)
    .update(input)
    .eq('id', optionId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as ProductOption
}

export async function deleteProductOption(optionId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_product_options`)
    .delete()
    .eq('id', optionId)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// PRODUCT CATEGORIES ASSIGNMENT
// ============================================================================

export async function getProductCategories(productId: string): Promise<Category[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_product_categories`)
    .select(`
      category_id,
      category:${TABLE_PREFIX}_categories(*)
    `)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
  
  if (error) throw new Error(error.message)
  return (data || []).map((item: { category: Category }) => item.category) as Category[]
}

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

export async function addProductToCategory(productId: string, categoryId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_product_categories`)
    .insert({
      product_id: productId,
      category_id: categoryId
    })
  
  if (error && error.code !== '23505') { // Ignore duplicate key error
    throw new Error(error.message)
  }
}

export async function removeProductFromCategory(productId: string, categoryId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_product_categories`)
    .delete()
    .eq('product_id', productId)
    .eq('category_id', categoryId)
  
  if (error) throw new Error(error.message)
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
        product:${TABLE_PREFIX}_products(id, name, slug, images, status, quantity, base_price, sku),
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
  
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data as Cart | null
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .select(`
      *,
      items:${TABLE_PREFIX}_cart_items(
        *,
        product:${TABLE_PREFIX}_products(id, name, slug, images, status, quantity, base_price, sku),
        variant:${TABLE_PREFIX}_product_variants(id, options, quantity, image_url, price)
      )
    `)
    .eq('id', cartId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Cart
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
  
  // Get product price and validate
  const { data: product, error: prodError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('base_price, quantity, status, track_inventory')
    .eq('id', productId)
    .single()
  
  if (prodError) throw new Error(prodError.message)
  if (!product) throw new Error('Product not found')
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
    if (!variant) throw new Error('Variant not found')
    if (!variant.is_active) {
      throw new Error('Variant is not available')
    }
    
    if (variant.price) {
      unitPrice = variant.price
    }
    
    if (product.track_inventory && variant.quantity < quantity) {
      throw new Error('Insufficient stock for this variant')
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
    .is('variant_id', variantId)
    .single()
  
  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_cart_items`)
      .update({ 
        quantity: existing.quantity + quantity,
        unit_price: unitPrice
      })
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

export async function applyDiscountToCart(cartId: string, code: string, subtotal: number): Promise<{ success: boolean; discountAmount: number; error?: string }> {
  const supabase = await getModuleClient()
  
  // Get cart to find site_id
  const { data: cart } = await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .select('site_id')
    .eq('id', cartId)
    .single()
  
  if (!cart) {
    return { success: false, discountAmount: 0, error: 'Cart not found' }
  }
  
  const result = await validateDiscountCode(cart.site_id, code, subtotal)
  
  if (!result.valid || !result.discount) {
    return { success: false, discountAmount: 0, error: result.error }
  }
  
  // Calculate discount amount
  let discountAmount = 0
  if (result.discount.type === 'percentage') {
    discountAmount = (subtotal * result.discount.value) / 100
  } else if (result.discount.type === 'fixed_amount') {
    discountAmount = Math.min(result.discount.value, subtotal)
  }
  
  // Update cart with discount
  await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .update({
      discount_code: code.toUpperCase(),
      discount_amount: discountAmount
    })
    .eq('id', cartId)
  
  return { success: true, discountAmount }
}

export async function removeDiscountFromCart(cartId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  await supabase
    .from(`${TABLE_PREFIX}_carts`)
    .update({
      discount_code: null,
      discount_amount: 0
    })
    .eq('id', cartId)
}

export async function mergeGuestCartToUser(guestSessionId: string, userId: string, siteId: string): Promise<Cart> {
  const supabase = await getModuleClient()
  
  // Find guest cart
  const guestCart = await findCart(siteId, undefined, guestSessionId)
  
  // Find or create user cart
  let userCart = await findCart(siteId, userId)
  if (!userCart) {
    userCart = await createCart(siteId, userId)
  }
  
  // If guest cart exists, merge items
  if (guestCart && guestCart.items.length > 0) {
    for (const item of guestCart.items) {
      try {
        await addCartItem(userCart.id, item.product_id, item.variant_id, item.quantity)
      } catch (e) {
        // Ignore errors (e.g., out of stock)
        console.warn('Could not merge cart item:', e)
      }
    }
    
    // Delete guest cart
    await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .delete()
      .eq('id', guestCart.id)
  }
  
  // Return updated user cart
  return (await findCart(siteId, userId)) || userCart
}

// ============================================================================
// ORDERS
// ============================================================================

export async function createOrderFromCart(input: CreateOrderInput): Promise<Order> {
  const supabase = await getModuleClient()
  
  // Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  
  // Get the site's agency_id from the site
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
      customer_name: input.customer_name || null,
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
    console.error('Error creating order:', orderError)
    throw new Error(orderError.message)
  }
  
  // If we have a cart_id, copy items to order_items
  if (input.cart_id) {
    const cart = await getCart(input.cart_id)
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
        console.error('Error creating order items:', itemsError)
        // Don't throw, order was created
      }
      
      // Update cart status to converted
      await supabase
        .from(`${TABLE_PREFIX}_carts`)
        .update({ status: 'converted' })
        .eq('id', input.cart_id)

      // Build order items for notification
      const notificationItems = cart.items.map((item: CartItem) => ({
        name: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }))

      // Send notifications to business owner + customer (async, non-blocking)
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
      }).catch(err => console.error('[Ecommerce] Notification error:', err))
    }
  } else {
    // No cart - still send notification with available data
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
    }).catch(err => console.error('[Ecommerce] Notification error:', err))
  }
  
  return order as Order
}

export async function getOrders(
  siteId: string,
  filters: OrderFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Order>> {
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
    data: (data || []) as Order[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    limit
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

export async function getCustomerOrders(siteId: string, customerId: string): Promise<Order[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('*')
    .eq('site_id', siteId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return (data || []) as Order[]
}

export async function updateOrderStatus(siteId: string, orderId: string, status: Order['status']): Promise<Order> {
  const supabase = await getModuleClient()
  
  // Validate status transition
  const { data: currentOrder, error: fetchError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('status')
    .eq('site_id', siteId)
    .eq('id', orderId)
    .single()
  
  if (fetchError || !currentOrder) throw new Error(fetchError?.message || 'Order not found')
  
  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending:    ['processing', 'confirmed', 'cancelled'],
    confirmed:  ['processing', 'shipped', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped:    ['delivered', 'cancelled'],
    delivered:  ['refunded'],
    cancelled:  ['pending'], // allow re-opening
    refunded:   [],
  }
  
  const allowed = VALID_TRANSITIONS[currentOrder.status as string] || []
  if (!allowed.includes(status)) {
    throw new Error(`Cannot transition order from '${currentOrder.status}' to '${status}'`)
  }
  
  const updates: Record<string, unknown> = { status }
  
  // Auto-set timestamps
  if (status === 'shipped') updates.shipped_at = new Date().toISOString()
  if (status === 'delivered') updates.delivered_at = new Date().toISOString()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  const order = data as Order

  // Send cancellation notification when order is cancelled
  if (status === 'cancelled' && order.customer_email) {
    notifyOrderCancelled(
      siteId,
      order.order_number,
      order.customer_email,
      order.customer_name || 'Customer',
      formatCurrency(order.total, order.currency || DEFAULT_CURRENCY),
    ).catch(err => console.error('[Ecommerce] Cancellation notification error:', err))
  }
  
  // Send shipping notification when order is shipped
  if (status === 'shipped' && order.customer_email) {
    notifyOrderShipped(
      siteId,
      order.order_number,
      order.customer_email,
      order.customer_name || 'Customer',
      order.tracking_number || undefined,
      order.tracking_url || undefined,
    ).catch(err => console.error('[Ecommerce] Shipping notification error:', err))
  }

  return order
}

export async function updateOrderPaymentStatus(
  siteId: string,
  orderId: string,
  paymentStatus: Order['payment_status'],
  transactionId?: string
): Promise<Order> {
  const supabase = await getModuleClient()
  
  const updates: Record<string, unknown> = { payment_status: paymentStatus }
  if (transactionId) updates.payment_transaction_id = transactionId
  
  // Auto-update order status based on payment
  if (paymentStatus === 'paid') {
    updates.status = 'confirmed'
  }
  // Note: payment 'failed' does NOT auto-cancel — the customer may retry.
  // Only explicit admin action or webhook exhaustion should cancel.
  
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

export async function updateOrderFulfillment(
  siteId: string,
  orderId: string,
  fulfillmentStatus: Order['fulfillment_status'],
  trackingNumber?: string,
  trackingUrl?: string
): Promise<Order> {
  const supabase = await getModuleClient()
  
  const updates: Record<string, unknown> = {
    fulfillment_status: fulfillmentStatus
  }
  
  if (trackingNumber) updates.tracking_number = trackingNumber
  if (trackingUrl) updates.tracking_url = trackingUrl
  if (fulfillmentStatus === 'fulfilled') {
    updates.shipped_at = new Date().toISOString()
    updates.status = 'shipped'
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update(updates)
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  const order = data as Order
  
  // Send shipping notification to customer when order is fulfilled
  if (fulfillmentStatus === 'fulfilled' && order.customer_email) {
    notifyOrderShipped(
      siteId,
      order.order_number,
      order.customer_email,
      order.customer_name,
      trackingNumber,
      trackingUrl,
    ).catch(err => console.error('[Ecommerce] Shipping notification error:', err))
  }
  
  return order
}

export async function markOrderDelivered(siteId: string, orderId: string): Promise<Order> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  const order = data as Order

  // Send delivery notification to customer + owner
  if (order.customer_email) {
    notifyOrderDelivered(
      siteId,
      order.order_number,
      order.customer_email,
      order.customer_name || 'Customer',
    ).catch(err => console.error('[Ecommerce] Delivery notification error:', err))
  }

  return order
}

export async function updateOrder(
  siteId: string,
  orderId: string,
  updates: Partial<Order>
): Promise<Order> {
  const supabase = await getModuleClient()
  
  // Only allow certain fields to be updated
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

export async function addOrderNote(siteId: string, orderId: string, note: string, isInternal: boolean = true): Promise<Order> {
  const supabase = await getModuleClient()
  
  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('internal_notes, customer_notes')
    .eq('site_id', siteId)
    .eq('id', orderId)
    .single()
  
  const field = isInternal ? 'internal_notes' : 'customer_notes'
  const existingNotes = order?.[field] || ''
  const timestamp = new Date().toISOString()
  const newNote = `[${timestamp}] ${note}`
  const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update({ [field]: updatedNotes })
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

export async function getDiscount(siteId: string, id: string): Promise<Discount | null> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  
  return data as Discount
}

export async function createDiscount(siteId: string, agencyId: string, input: Partial<DiscountInput>): Promise<Discount> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .insert({
      site_id: siteId,
      agency_id: agencyId,
      code: input.code?.toUpperCase(),
      description: input.description || null,
      type: input.type || 'percentage',
      value: input.value || 0,
      minimum_order_amount: input.minimum_order_amount || null,
      minimum_quantity: input.minimum_quantity || null,
      applies_to: input.applies_to || 'all',
      applies_to_ids: input.applies_to_ids || [],
      usage_limit: input.usage_limit || null,
      once_per_customer: input.once_per_customer || false,
      starts_at: input.starts_at || new Date().toISOString(),
      ends_at: input.ends_at || null,
      is_active: input.is_active ?? true
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Discount
}

export async function updateDiscount(siteId: string, id: string, input: DiscountUpdate): Promise<Discount> {
  const supabase = await getModuleClient()
  
  const updateData = { ...input }
  if (input.code) {
    updateData.code = input.code.toUpperCase()
  }
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data as Discount
}

export async function deleteDiscount(siteId: string, id: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { error } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

export async function validateDiscountCode(
  siteId: string,
  code: string,
  subtotal: number,
  customerId?: string
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
    return { valid: false, error: `Minimum order of ${formatCurrency(discount.minimum_order_amount / 100)} required` }
  }
  
  // Check once per customer
  if (discount.once_per_customer && customerId) {
    const { count } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('id', { count: 'exact' })
      .eq('site_id', siteId)
      .eq('customer_id', customerId)
      .eq('discount_code', code.toUpperCase())
    
    if (count && count > 0) {
      return { valid: false, error: 'You have already used this discount code' }
    }
  }
  
  return { valid: true, discount: discount as Discount }
}

export async function incrementDiscountUsage(siteId: string, discountId: string): Promise<void> {
  const supabase = await getModuleClient()
  
  const { data: discount } = await supabase
    .from(`${TABLE_PREFIX}_discounts`)
    .select('usage_count')
    .eq('id', discountId)
    .single()
  
  if (discount) {
    await supabase
      .from(`${TABLE_PREFIX}_discounts`)
      .update({ usage_count: (discount.usage_count || 0) + 1 })
      .eq('id', discountId)
  }
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
  input: EcommerceSettingsUpdate
): Promise<EcommerceSettings> {
  const supabase = await getModuleClient()
  
  // Upsert settings
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .upsert({
      site_id: siteId,
      agency_id: agencyId,
      ...input
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
  adjustment: number,
  reason?: string
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

export async function setInventory(
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<void> {
  const supabase = await getModuleClient()
  
  if (variantId) {
    await supabase
      .from(`${TABLE_PREFIX}_product_variants`)
      .update({ quantity: Math.max(0, quantity) })
      .eq('id', variantId)
  } else {
    await supabase
      .from(`${TABLE_PREFIX}_products`)
      .update({ quantity: Math.max(0, quantity) })
      .eq('id', productId)
  }
}

export async function getLowStockProducts(siteId: string): Promise<Product[]> {
  const supabase = await getModuleClient()
  
  // Using raw SQL for the comparison
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .eq('track_inventory', true)
    .eq('status', 'active')
  
  if (error) throw new Error(error.message)
  
  // Filter in JS since we can't compare columns in PostgREST
  const lowStock = (data || []).filter((p: Product) => p.quantity <= p.low_stock_threshold)
  return lowStock as Product[]
}

export async function getOutOfStockProducts(siteId: string): Promise<Product[]> {
  const supabase = await getModuleClient()
  
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .eq('track_inventory', true)
    .eq('status', 'active')
    .lte('quantity', 0)
  
  if (error) throw new Error(error.message)
  return (data || []) as Product[]
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function getSalesAnalytics(
  siteId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
}> {
  const supabase = await getModuleClient()
  
  const { data: orders, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('total, status, payment_status')
    .eq('site_id', siteId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  
  if (error) throw new Error(error.message)
  
  const paidOrders = (orders || []).filter((o: { payment_status: string }) => o.payment_status === 'paid')
  const totalRevenue = paidOrders.reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0)
  const totalOrders = paidOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  const ordersByStatus: Record<string, number> = {}
  for (const order of (orders || []) as Array<{ status: string }>) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1
  }
  
  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    ordersByStatus
  }
}

export async function getTopProducts(
  siteId: string,
  startDate: string,
  endDate: string,
  limit = 10
): Promise<Array<{ productId: string; productName: string; quantitySold: number; revenue: number }>> {
  const supabase = await getModuleClient()
  
  // Get all order items from paid orders in date range
  const { data: orders } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id')
    .eq('site_id', siteId)
    .eq('payment_status', 'paid')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  
  if (!orders || orders.length === 0) return []
  
  const orderIds = orders.map((o: { id: string }) => o.id)
  
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_order_items`)
    .select('product_id, product_name, quantity, total_price')
    .in('order_id', orderIds)
  
  // Aggregate by product
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
  
  for (const item of items || []) {
    const existing = productMap.get(item.product_id) || { name: item.product_name, quantity: 0, revenue: 0 }
    productMap.set(item.product_id, {
      name: item.product_name,
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + Number(item.total_price)
    })
  }
  
  // Convert to array and sort
  const topProducts = Array.from(productMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantitySold: data.quantity,
      revenue: data.revenue
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
  
  return topProducts
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
    // Create default settings - ZAMBIAN DEFAULTS
    await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .insert({
        site_id: siteId,
        agency_id: agencyId,
        currency: DEFAULT_CURRENCY,    // Platform default (ZMW)
        tax_rate: 16,                  // Zambia standard VAT rate
        tax_included_in_price: true,   // Prices shown inclusive
        enable_guest_checkout: true,
        require_phone: true,           // Phone important for delivery in Zambia
        send_order_confirmation: true,
        continue_selling_when_out_of_stock: false,
        shipping_zones: []
      })
  }
}

// ============================================================================
// CHECKOUT HELPERS
// ============================================================================

export async function generateOrderNumber(siteId: string): Promise<string> {
  const supabase = await getModuleClient()
  
  // Try to use the database function first
  const { data: orderNumber, error } = await supabase.rpc('mod_ecommod01_generate_order_number', {
    p_site_id: siteId
  })
  
  if (!error && orderNumber) {
    return orderNumber
  }
  
  // Fallback: Generate in JS
  const { count } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id', { count: 'exact' })
    .eq('site_id', siteId)
  
  const orderCount = (count || 0) + 1
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `ORD-${date}-${String(orderCount).padStart(5, '0')}`
}

export async function calculateCartTotals(
  cartId: string,
  shippingAmount = 0,
  taxRate = 0
): Promise<{
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}> {
  const cart = await getCart(cartId)
  if (!cart) {
    return { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 }
  }
  
  const subtotal = cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const discount = cart.discount_amount || 0
  const taxableAmount = subtotal - discount
  const tax = (taxableAmount * taxRate) / 100
  const total = taxableAmount + tax + shippingAmount
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  
  return {
    subtotal,
    discount,
    tax,
    shipping: shippingAmount,
    total,
    itemCount
  }
}
