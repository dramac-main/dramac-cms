/**
 * Store Template Application Server Actions
 * 
 * Phase ECOM-62: Pre-built Store Templates
 * 
 * Server actions to apply a store template to a site.
 * Creates categories, sample products, and applies settings.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createCategory, createProduct } from './ecommerce-actions'
import { updateSettings } from './settings-actions'
import { getStoreTemplate, STORE_TEMPLATES } from '../lib/store-templates'
import type { StoreTemplate } from '../types/store-template-types'

// ============================================================================
// TYPES
// ============================================================================

export interface ApplyTemplateResult {
  success: boolean
  templateId: string
  categoriesCreated: number
  productsCreated: number
  settingsApplied: boolean
  errors: string[]
}

// ============================================================================
// APPLY STORE TEMPLATE
// ============================================================================

/**
 * Apply a complete store template to a site
 * Creates categories, sample products, and applies settings
 */
export async function applyStoreTemplate(
  siteId: string,
  templateId: string
): Promise<ApplyTemplateResult> {
  const result: ApplyTemplateResult = {
    success: false,
    templateId,
    categoriesCreated: 0,
    productsCreated: 0,
    settingsApplied: false,
    errors: [],
  }

  // Validate template
  const template = getStoreTemplate(templateId)
  if (!template) {
    result.errors.push(`Template "${templateId}" not found`)
    return result
  }

  // Get the site's agency_id
  const supabase = await createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()

  const agencyId = site?.agency_id
  if (!agencyId) {
    result.errors.push('Could not find agency_id for site')
    return result
  }

  // 1. Create categories
  const categoryMap = await createTemplateCategories(siteId, agencyId, template, result)

  // 2. Create sample products linked to categories
  await createTemplateProducts(siteId, agencyId, template, categoryMap, result)

  // 3. Apply settings
  await applyTemplateSettings(siteId, agencyId, template, result)

  // Mark template as applied in site metadata
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: siteData } = await db
      .from('sites')
      .select('settings')
      .eq('id', siteId)
      .single()

    const currentSettings = siteData?.settings || {}
    await db
      .from('sites')
      .update({
        settings: {
          ...currentSettings,
          ecommerce_template_applied: templateId,
          ecommerce_template_applied_at: new Date().toISOString(),
        },
      })
      .eq('id', siteId)
  } catch (err) {
    console.error('[StoreTemplate] Failed to mark template as applied:', err)
    // Non-critical - don't add to errors
  }

  result.success = result.errors.length === 0
  console.log(
    `[StoreTemplate] Applied "${template.name}" to site ${siteId}: ` +
    `${result.categoriesCreated} categories, ${result.productsCreated} products, ` +
    `settings=${result.settingsApplied}, errors=${result.errors.length}`
  )

  return result
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Create categories from template definition
 * Returns a map of template slug -> created category ID
 */
async function createTemplateCategories(
  siteId: string,
  agencyId: string,
  template: StoreTemplate,
  result: ApplyTemplateResult
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>()

  for (const catDef of template.categories) {
    try {
      const category = await createCategory(siteId, agencyId, {
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        sort_order: catDef.sort_order,
        is_active: true,
      })
      categoryMap.set(catDef.slug, category.id)
      result.categoriesCreated++
      console.log(`[StoreTemplate] Created category: ${catDef.name}`)

      // Handle nested subcategories if present
      if (catDef.children?.length) {
        for (const child of catDef.children) {
          try {
            const childCat = await createCategory(siteId, agencyId, {
              name: child.name,
              slug: child.slug,
              description: child.description,
              sort_order: child.sort_order,
              parent_id: category.id,
              is_active: true,
            })
            categoryMap.set(child.slug, childCat.id)
            result.categoriesCreated++
          } catch (childErr) {
            console.error(`[StoreTemplate] Failed to create subcategory ${child.name}:`, childErr)
            result.errors.push(`Failed to create subcategory: ${child.name}`)
          }
        }
      }
    } catch (err) {
      console.error(`[StoreTemplate] Failed to create category ${catDef.name}:`, err)
      result.errors.push(`Failed to create category: ${catDef.name}`)
    }
  }

  return categoryMap
}

/**
 * Create sample products from template definition
 */
async function createTemplateProducts(
  siteId: string,
  agencyId: string,
  template: StoreTemplate,
  categoryMap: Map<string, string>,
  result: ApplyTemplateResult
): Promise<void> {
  for (const prodDef of template.sampleProducts) {
    try {
      // Resolve category ID from slug
      const categoryId = categoryMap.get(prodDef.category_slug) || null

      await createProduct(siteId, agencyId, {
        name: prodDef.name,
        slug: prodDef.slug,
        description: prodDef.description,
        short_description: prodDef.short_description,
        base_price: prodDef.base_price,
        compare_at_price: prodDef.compare_at_price || null,
        cost_price: null,
        tax_class: prodDef.tax_class,
        is_taxable: true,
        sku: prodDef.sku,
        barcode: null,
        track_inventory: template.settings.track_inventory,
        quantity: template.settings.track_inventory ? 50 : 0,
        low_stock_threshold: template.settings.low_stock_threshold,
        weight: null,
        weight_unit: template.settings.weight_unit,
        status: prodDef.status,
        is_featured: prodDef.is_featured,
        seo_title: null,
        seo_description: null,
        images: prodDef.images,
        metadata: {
          created_via: 'store-template',
          template_id: template.id,
          category_id: categoryId,
        },
        created_by: null,
      })

      // Link product to category if we have one
      if (categoryId) {
        try {
          const supabase = await createClient()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabase as any
          
          // Get the product we just created by slug
          const { data: product } = await db
            .from('mod_ecommod01_products')
            .select('id')
            .eq('site_id', siteId)
            .eq('slug', prodDef.slug)
            .single()

          if (product?.id) {
            // Check if product_categories junction table exists
            await db
              .from('mod_ecommod01_product_categories')
              .insert({
                product_id: product.id,
                category_id: categoryId,
              })
          }
        } catch {
          // Junction table might not exist, or product might already be linked
          // Store category_id in metadata as fallback
          console.log(`[StoreTemplate] Could not link product ${prodDef.name} to category - stored in metadata`)
        }
      }

      result.productsCreated++
      console.log(`[StoreTemplate] Created product: ${prodDef.name}`)
    } catch (err) {
      console.error(`[StoreTemplate] Failed to create product ${prodDef.name}:`, err)
      result.errors.push(`Failed to create product: ${prodDef.name}`)
    }
  }
}

/**
 * Apply template settings to the site's e-commerce configuration
 */
async function applyTemplateSettings(
  siteId: string,
  agencyId: string,
  template: StoreTemplate,
  result: ApplyTemplateResult
): Promise<void> {
  try {
    // Currency settings
    await updateSettings(siteId, agencyId, 'currency', {
      default_currency: template.settings.currency,
    })

    // Tax settings
    await updateSettings(siteId, agencyId, 'tax', {
      tax_enabled: template.settings.tax_rate > 0,
      default_tax_rate: template.settings.tax_rate,
      prices_include_tax: template.settings.tax_inclusive,
    })

    // Checkout settings
    await updateSettings(siteId, agencyId, 'checkout', {
      guest_checkout_enabled: template.settings.enable_guest_checkout,
    })

    // Inventory settings
    await updateSettings(siteId, agencyId, 'inventory', {
      track_inventory: template.settings.track_inventory,
      low_stock_threshold: template.settings.low_stock_threshold,
    })

    result.settingsApplied = true
    console.log('[StoreTemplate] Settings applied successfully')
  } catch (err) {
    console.error('[StoreTemplate] Failed to apply settings:', err)
    result.errors.push('Failed to apply template settings')
  }
}

// ============================================================================
// TEMPLATE LISTING (Client-safe)
// ============================================================================

/**
 * Get all available store templates
 * (Templates are static data, no DB query needed)
 */
export async function getAvailableTemplates() {
  return STORE_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    industry: t.industry,
    tags: t.tags,
    color: t.color,
    features: t.features,
    categoryCount: t.categories.length,
    productCount: t.sampleProducts.length,
  }))
}

/**
 * Check if a site already has a template applied
 */
export async function getSiteTemplateStatus(siteId: string): Promise<{
  hasTemplate: boolean
  templateId: string | null
  appliedAt: string | null
}> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: site } = await db
      .from('sites')
      .select('settings')
      .eq('id', siteId)
      .single()

    const settings = site?.settings || {}
    return {
      hasTemplate: !!settings.ecommerce_template_applied,
      templateId: settings.ecommerce_template_applied || null,
      appliedAt: settings.ecommerce_template_applied_at || null,
    }
  } catch {
    return { hasTemplate: false, templateId: null, appliedAt: null }
  }
}
