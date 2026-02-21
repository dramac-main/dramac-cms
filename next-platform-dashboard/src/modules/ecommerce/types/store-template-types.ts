/**
 * Store Template Types
 * 
 * Phase ECOM-62: Pre-built Store Templates
 * 
 * Defines the data structures for complete store template presets.
 * A store template packages up categories, sample products, settings,
 * and style recommendations into a single selectable preset.
 */

export interface StoreTemplate {
  id: string
  name: string
  description: string
  icon: string
  preview_image?: string
  
  // Industry / use case
  industry: string
  tags: string[]
  
  // Template data
  categories: StoreTemplateCategory[]
  sampleProducts: StoreTemplateProduct[]
  settings: StoreTemplateSettings
  
  // Display metadata
  color: string // accent color for the template card
  features: string[]
}

export interface StoreTemplateCategory {
  name: string
  slug: string
  description: string
  image_url?: string
  sort_order: number
  children?: StoreTemplateCategory[]
}

export interface StoreTemplateProduct {
  name: string
  slug: string
  description: string
  short_description: string
  base_price: number
  compare_at_price?: number
  category_slug: string // maps to category by slug
  images: string[]
  sku: string
  tax_class: string
  is_featured: boolean
  status: 'active' | 'draft'
}

export interface StoreTemplateSettings {
  currency: string
  tax_rate: number
  tax_inclusive: boolean
  weight_unit: string
  enable_guest_checkout: boolean
  track_inventory: boolean
  low_stock_threshold: number
  enable_reviews: boolean
}
