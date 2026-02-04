/**
 * Product Import/Export Actions
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Server actions for CSV import/export of products
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Product,
  ProductImportRow, 
  ProductImportResult,
  ProductExportOptions,
  ProductTableFilters,
  BulkAction,
  BulkActionResult
} from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// IMPORT PRODUCTS
// ============================================================================

/**
 * Validate and import products from CSV data
 */
export async function importProducts(
  siteId: string,
  agencyId: string,
  rows: ProductImportRow[]
): Promise<ProductImportResult> {
  const supabase = await getModuleClient()
  
  const result: ProductImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: []
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // Account for header row + 1-based indexing

    try {
      // Validate required fields
      if (!row.name || row.name.trim() === '') {
        result.errors.push({ row: rowNumber, message: 'Name is required' })
        result.skipped++
        continue
      }

      if (row.base_price === undefined || row.base_price < 0) {
        result.errors.push({ row: rowNumber, message: 'Valid price is required' })
        result.skipped++
        continue
      }

      // Generate slug
      const slug = row.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check for duplicate SKU
      if (row.sku) {
        const { data: existing } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .select('id')
          .eq('site_id', siteId)
          .eq('sku', row.sku)
          .single()

        if (existing) {
          result.errors.push({ row: rowNumber, message: `SKU "${row.sku}" already exists` })
          result.skipped++
          continue
        }
      }

      // Parse images (comma-separated URLs)
      const images = row.images 
        ? row.images.split(',').map(url => url.trim()).filter(Boolean)
        : []

      // Insert product
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_products`)
        .insert({
          site_id: siteId,
          agency_id: agencyId,
          name: row.name.trim(),
          slug,
          description: row.description?.trim() || null,
          base_price: Math.round(row.base_price * 100), // Convert to cents
          compare_at_price: row.compare_at_price 
            ? Math.round(row.compare_at_price * 100) 
            : null,
          sku: row.sku?.trim() || null,
          quantity: row.quantity ?? 0,
          track_inventory: row.track_inventory ?? true,
          low_stock_threshold: row.low_stock_threshold ?? 5,
          status: row.status || 'draft',
          images,
          is_taxable: true,
          tax_class: 'standard',
          weight_unit: 'kg',
          metadata: {}
        })

      if (error) {
        result.errors.push({ row: rowNumber, message: error.message })
        result.skipped++
      } else {
        result.imported++
      }
    } catch (err) {
      result.errors.push({ 
        row: rowNumber, 
        message: err instanceof Error ? err.message : 'Unknown error' 
      })
      result.skipped++
    }
  }

  result.success = result.errors.length === 0

  return result
}

// ============================================================================
// EXPORT PRODUCTS
// ============================================================================

/**
 * Export products to CSV format
 */
export async function exportProducts(
  siteId: string,
  options: ProductExportOptions
): Promise<{ data: string; filename: string }> {
  const supabase = await getModuleClient()

  // Build query with filters
  let query = supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  // Apply filters if provided
  if (options.filters) {
    const f = options.filters
    
    if (f.status && f.status !== 'all') {
      query = query.eq('status', f.status)
    }
    
    if (f.stockLevel && f.stockLevel !== 'all') {
      if (f.stockLevel === 'out_of_stock') {
        query = query.eq('quantity', 0)
      }
    }

    if (f.priceMin !== null) {
      query = query.gte('base_price', f.priceMin * 100)
    }
    
    if (f.priceMax !== null) {
      query = query.lte('base_price', f.priceMax * 100)
    }
  }

  const { data: products, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Build CSV content
  const fields = options.includeFields.length > 0 
    ? options.includeFields 
    : ['name', 'sku', 'description', 'base_price', 'compare_at_price', 'quantity', 'status']

  // Create header row
  const headers = fields.map(field => {
    const fieldLabels: Record<string, string> = {
      name: 'Name',
      sku: 'SKU',
      description: 'Description',
      short_description: 'Short Description',
      base_price: 'Price',
      compare_at_price: 'Compare At Price',
      cost_price: 'Cost Price',
      quantity: 'Quantity',
      status: 'Status',
      is_featured: 'Featured',
      track_inventory: 'Track Inventory',
      low_stock_threshold: 'Low Stock Threshold',
      weight: 'Weight',
      images: 'Images',
      created_at: 'Created At'
    }
    return fieldLabels[field] || field
  })

  // Create data rows
  const rows = (products || []).map((product: Record<string, unknown>) => {
    return fields.map(field => {
      let value = product[field]
      
      // Handle special fields
      if (field === 'base_price' || field === 'compare_at_price' || field === 'cost_price') {
        value = value ? (Number(value) / 100).toFixed(2) : ''
      } else if (field === 'images' && options.includeImages) {
        value = Array.isArray(value) ? value.join(', ') : ''
      } else if (field === 'images') {
        value = ''
      } else if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No'
      } else if (value === null || value === undefined) {
        value = ''
      }

      // Escape CSV values
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  })

  // Combine into CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row: string[]) => row.join(','))
  ].join('\n')

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `products-export-${timestamp}.csv`

  return { data: csvContent, filename }
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

/**
 * Execute bulk action on selected products
 */
export async function executeBulkAction(
  siteId: string,
  productIds: string[],
  action: BulkAction,
  params?: Record<string, unknown>
): Promise<BulkActionResult> {
  const supabase = await getModuleClient()
  
  const result: BulkActionResult = {
    success: true,
    affected: 0,
    errors: []
  }

  if (productIds.length === 0) {
    result.success = false
    result.errors.push('No products selected')
    return result
  }

  try {
    switch (action) {
      case 'delete': {
        const { error } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .delete()
          .eq('site_id', siteId)
          .in('id', productIds)

        if (error) throw error
        result.affected = productIds.length
        break
      }

      case 'set_active':
      case 'set_draft':
      case 'set_archived': {
        const status = action.replace('set_', '') as 'active' | 'draft' | 'archived'
        const { error } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .update({ status })
          .eq('site_id', siteId)
          .in('id', productIds)

        if (error) throw error
        result.affected = productIds.length
        break
      }

      case 'assign_category': {
        const categoryId = params?.categoryId as string
        if (!categoryId) {
          throw new Error('Category ID is required')
        }

        for (const productId of productIds) {
          const { error } = await supabase
            .from(`${TABLE_PREFIX}_products`)
            .update({ 
              metadata: { primary_category_id: categoryId }
            })
            .eq('id', productId)
            .eq('site_id', siteId)

          if (error) {
            result.errors.push(`Failed to update product ${productId}: ${error.message}`)
          } else {
            result.affected++
          }
        }
        break
      }

      case 'adjust_price': {
        const adjustment = params?.adjustment as number
        const adjustmentType = params?.type as 'fixed' | 'percentage'
        
        if (adjustment === undefined) {
          throw new Error('Price adjustment value is required')
        }

        const { data: products } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .select('id, base_price')
          .eq('site_id', siteId)
          .in('id', productIds)

        for (const product of products || []) {
          let newPrice = product.base_price
          
          if (adjustmentType === 'percentage') {
            newPrice = Math.round(product.base_price * (1 + adjustment / 100))
          } else {
            newPrice = product.base_price + Math.round(adjustment * 100)
          }

          newPrice = Math.max(0, newPrice)

          const { error } = await supabase
            .from(`${TABLE_PREFIX}_products`)
            .update({ base_price: newPrice })
            .eq('id', product.id)
            .eq('site_id', siteId)

          if (error) {
            result.errors.push(`Failed to update product ${product.id}: ${error.message}`)
          } else {
            result.affected++
          }
        }
        break
      }

      case 'adjust_stock': {
        const adjustment = params?.adjustment as number
        
        if (adjustment === undefined) {
          throw new Error('Stock adjustment value is required')
        }

        const { data: products } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .select('id, quantity')
          .eq('site_id', siteId)
          .in('id', productIds)

        for (const product of products || []) {
          const newQuantity = Math.max(0, product.quantity + adjustment)

          const { error } = await supabase
            .from(`${TABLE_PREFIX}_products`)
            .update({ quantity: newQuantity })
            .eq('id', product.id)
            .eq('site_id', siteId)

          if (error) {
            result.errors.push(`Failed to update product ${product.id}: ${error.message}`)
          } else {
            result.affected++
          }
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (err) {
    result.success = false
    result.errors.push(err instanceof Error ? err.message : 'Unknown error')
  }

  return result
}

/**
 * Duplicate a product
 */
export async function duplicateProductAction(
  siteId: string,
  productId: string
): Promise<Product> {
  const supabase = await getModuleClient()

  const { data: original, error: fetchError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('id', productId)
    .eq('site_id', siteId)
    .single()

  if (fetchError || !original) {
    throw new Error('Product not found')
  }

  const timestamp = Date.now()
  const newName = `${original.name} (Copy)`
  const newSlug = `${original.slug}-copy-${timestamp}`
  const newSku = original.sku ? `${original.sku}-COPY` : null

  const { data: newProduct, error: insertError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .insert({
      ...original,
      id: undefined,
      name: newName,
      slug: newSlug,
      sku: newSku,
      status: 'draft',
      created_at: undefined,
      updated_at: undefined
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return newProduct
}

/**
 * Update product inline (single field)
 */
export async function updateProductField(
  siteId: string,
  productId: string,
  field: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()

  const allowedFields = ['base_price', 'quantity', 'status', 'name', 'sku']
  if (!allowedFields.includes(field)) {
    return { success: false, error: 'Field not allowed for inline edit' }
  }

  let processedValue = value
  if (field === 'base_price' && typeof value === 'number') {
    processedValue = Math.round(value * 100)
  }

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .update({ [field]: processedValue })
    .eq('id', productId)
    .eq('site_id', siteId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
