# PHASE-ECOM-02: Product Management Enhancement

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 10-12 hours
> **Prerequisites**: PHASE-ECOM-01 (Dashboard Redesign)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Enhance the product management system with industry-standard features including prominent SKU/ID display, bulk operations, inline editing, advanced filtering, CSV import/export, and a modern data table. This phase transforms basic product management into a professional-grade inventory system matching Shopify/WooCommerce standards.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-01 is complete and tested
- [ ] Review existing products-view.tsx (`src/modules/ecommerce/components/views/products-view.tsx`)
- [ ] Review existing product dialogs
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Products View
├── Toolbar
│   ├── Search Input
│   ├── Filter Dropdowns (Status, Category, Stock, Price)
│   ├── Column Visibility Toggle
│   └── Actions (Import, Export, Bulk Actions)
├── Bulk Actions Bar (when items selected)
│   ├── Selected Count
│   ├── Delete Selected
│   ├── Change Status
│   ├── Assign Category
│   └── Clear Selection
├── Data Table
│   ├── Checkbox Column
│   ├── Image Thumbnail
│   ├── Product Name + SKU (prominently displayed)
│   ├── Status Badge
│   ├── Price (inline editable)
│   ├── Inventory (inline editable)
│   ├── Category
│   └── Actions Menu
├── Pagination
└── Import/Export Dialogs
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/components/tables/product-data-table.tsx` | Create | Main product data table with TanStack Table |
| `src/modules/ecommerce/components/tables/product-columns.tsx` | Create | Column definitions for product table |
| `src/modules/ecommerce/components/tables/index.ts` | Create | Table exports |
| `src/modules/ecommerce/components/filters/product-filters.tsx` | Create | Advanced filtering component |
| `src/modules/ecommerce/components/filters/index.ts` | Create | Filter exports |
| `src/modules/ecommerce/components/bulk/bulk-actions-toolbar.tsx` | Create | Bulk actions component |
| `src/modules/ecommerce/components/bulk/index.ts` | Create | Bulk exports |
| `src/modules/ecommerce/components/dialogs/import-products-dialog.tsx` | Create | CSV import dialog |
| `src/modules/ecommerce/components/dialogs/export-products-dialog.tsx` | Create | Export options dialog |
| `src/modules/ecommerce/components/views/products-view.tsx` | Modify | Integrate new table |
| `src/modules/ecommerce/actions/product-import-export.ts` | Create | Import/export server actions |
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add filter/bulk action types |

---

## 📋 Implementation Tasks

### Task 2.1: Add Product Filter & Bulk Action Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end of file)

**Description**: Add types for product filtering and bulk operations

```typescript
// ============================================================================
// ENHANCED PRODUCT MANAGEMENT TYPES (Phase ECOM-02)
// ============================================================================

export interface ProductTableFilters {
  search: string
  status: ProductStatus | 'all'
  category: string | 'all'
  stockLevel: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  priceMin: number | null
  priceMax: number | null
  dateFrom: string | null
  dateTo: string | null
  featured: boolean | null
}

export interface ProductTableColumn {
  id: string
  label: string
  visible: boolean
  sortable: boolean
}

export type BulkAction = 
  | 'delete'
  | 'set_active'
  | 'set_draft'
  | 'set_archived'
  | 'assign_category'
  | 'adjust_price'
  | 'adjust_stock'

export interface BulkActionResult {
  success: boolean
  affected: number
  errors: string[]
}

export interface ProductImportRow {
  name: string
  sku?: string
  description?: string
  base_price: number
  compare_at_price?: number
  quantity?: number
  category?: string
  status?: ProductStatus
  images?: string
  track_inventory?: boolean
  low_stock_threshold?: number
}

export interface ProductImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export interface ProductExportOptions {
  format: 'csv' | 'xlsx'
  includeFields: string[]
  filters?: ProductTableFilters
  includeVariants: boolean
  includeImages: boolean
}
```

---

### Task 2.2: Create Import/Export Server Actions

**File**: `src/modules/ecommerce/actions/product-import-export.ts`
**Action**: Create

**Description**: Server actions for importing and exporting products

```typescript
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
      } else if (f.stockLevel === 'low_stock') {
        // Low stock requires client-side filtering due to column comparison
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
  const rows = (products || []).map(product => {
    return fields.map(field => {
      let value = product[field]
      
      // Handle special fields
      if (field === 'base_price' || field === 'compare_at_price' || field === 'cost_price') {
        value = value ? (value / 100).toFixed(2) : ''
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
    ...rows.map(row => row.join(','))
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

        // This would require a junction table for many-to-many
        // For now, we'll add to product metadata
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

        // Get current products
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

          // Ensure price is not negative
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

        // Get current products
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
export async function duplicateProduct(
  siteId: string,
  productId: string
): Promise<Product> {
  const supabase = await getModuleClient()

  // Fetch original product
  const { data: original, error: fetchError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('*')
    .eq('id', productId)
    .eq('site_id', siteId)
    .single()

  if (fetchError || !original) {
    throw new Error('Product not found')
  }

  // Create copy with modified name and slug
  const timestamp = Date.now()
  const newName = `${original.name} (Copy)`
  const newSlug = `${original.slug}-copy-${timestamp}`
  const newSku = original.sku ? `${original.sku}-COPY` : null

  const { data: newProduct, error: insertError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .insert({
      ...original,
      id: undefined, // Let database generate new ID
      name: newName,
      slug: newSlug,
      sku: newSku,
      status: 'draft', // Always start as draft
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

  // Validate allowed fields for inline edit
  const allowedFields = ['base_price', 'quantity', 'status', 'name', 'sku']
  if (!allowedFields.includes(field)) {
    return { success: false, error: 'Field not allowed for inline edit' }
  }

  // Handle price conversion (dollars to cents)
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
```

---

### Task 2.3: Create Product Filters Component

**File**: `src/modules/ecommerce/components/filters/product-filters.tsx`
**Action**: Create

**Description**: Advanced filtering component for products

```typescript
/**
 * Product Filters Component
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Advanced filtering for the product table
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import type { ProductTableFilters, ProductStatus, Category } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ProductFiltersProps {
  filters: ProductTableFilters
  onFiltersChange: (filters: ProductTableFilters) => void
  categories: Category[]
}

// ============================================================================
// DEFAULT FILTERS
// ============================================================================

export const defaultProductFilters: ProductTableFilters = {
  search: '',
  status: 'all',
  category: 'all',
  stockLevel: 'all',
  priceMin: null,
  priceMax: null,
  dateFrom: null,
  dateTo: null,
  featured: null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductFilters({
  filters,
  onFiltersChange,
  categories
}: ProductFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  // Count active filters (excluding search)
  const activeFilterCount = [
    filters.status !== 'all',
    filters.category !== 'all',
    filters.stockLevel !== 'all',
    filters.priceMin !== null,
    filters.priceMax !== null,
    filters.dateFrom !== null,
    filters.dateTo !== null,
    filters.featured !== null
  ].filter(Boolean).length

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleQuickFilter = (key: keyof ProductTableFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleApplyAdvanced = () => {
    onFiltersChange(localFilters)
    setIsAdvancedOpen(false)
  }

  const handleResetFilters = () => {
    onFiltersChange(defaultProductFilters)
    setLocalFilters(defaultProductFilters)
    setIsAdvancedOpen(false)
  }

  const handleClearFilter = (key: keyof ProductTableFilters) => {
    const resetValue = key === 'status' || key === 'category' || key === 'stockLevel' 
      ? 'all' 
      : null
    onFiltersChange({ ...filters, [key]: resetValue })
  }

  return (
    <div className="space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => handleQuickFilter('status', value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Stock Level Filter */}
          <Select
            value={filters.stockLevel}
            onValueChange={(value) => handleQuickFilter('stockLevel', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              value={filters.category}
              onValueChange={(value) => handleQuickFilter('category', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Advanced Filters Button */}
          <Sheet open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="default">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Fine-tune your product search with advanced options
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={localFilters.priceMin ?? ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        priceMin: e.target.value ? Number(e.target.value) : null
                      })}
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={localFilters.priceMax ?? ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        priceMax: e.target.value ? Number(e.target.value) : null
                      })}
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Created Date</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={localFilters.dateFrom ?? ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        dateFrom: e.target.value || null
                      })}
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={localFilters.dateTo ?? ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        dateTo: e.target.value || null
                      })}
                    />
                  </div>
                </div>

                {/* Featured */}
                <div className="space-y-2">
                  <Label>Featured</Label>
                  <Select
                    value={localFilters.featured === null ? 'all' : localFilters.featured ? 'yes' : 'no'}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      featured: value === 'all' ? null : value === 'yes'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="yes">Featured Only</SelectItem>
                      <SelectItem value="no">Not Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset All
                </Button>
                <Button onClick={handleApplyAdvanced}>
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Status: {filters.status}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleClearFilter('status')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Category: {categories.find(c => c.id === filters.category)?.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleClearFilter('category')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.stockLevel !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Stock: {filters.stockLevel.replace('_', ' ')}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleClearFilter('stockLevel')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.priceMin !== null || filters.priceMax !== null) && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Price: {filters.priceMin ?? 0} - {filters.priceMax ?? '∞'}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  onFiltersChange({ ...filters, priceMin: null, priceMax: null })
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {activeFilterCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleResetFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

### Task 2.4: Create Filters Export

**File**: `src/modules/ecommerce/components/filters/index.ts`
**Action**: Create

**Description**: Export filter components

```typescript
/**
 * E-Commerce Filters
 * 
 * Phase ECOM-02: Product Management Enhancement
 */

export { ProductFilters, defaultProductFilters } from './product-filters'
```

---

### Task 2.5: Create Bulk Actions Toolbar

**File**: `src/modules/ecommerce/components/bulk/bulk-actions-toolbar.tsx`
**Action**: Create

**Description**: Toolbar for bulk product actions

```typescript
/**
 * Bulk Actions Toolbar
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Toolbar for performing bulk operations on selected products
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Trash2, 
  MoreHorizontal, 
  CheckCircle, 
  FileEdit, 
  Archive,
  X,
  Tag,
  DollarSign,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BulkAction, Category } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onExecute: (action: BulkAction, params?: Record<string, unknown>) => Promise<void>
  isExecuting: boolean
  categories: Category[]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onExecute,
  isExecuting,
  categories
}: BulkActionsToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPriceAdjust, setShowPriceAdjust] = useState(false)
  const [showStockAdjust, setShowStockAdjust] = useState(false)
  
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0)
  const [priceAdjustType, setPriceAdjustType] = useState<'fixed' | 'percentage'>('percentage')
  const [stockAdjustment, setStockAdjustment] = useState<number>(0)

  if (selectedCount === 0) return null

  const handleDelete = async () => {
    await onExecute('delete')
    setShowDeleteConfirm(false)
  }

  const handlePriceAdjust = async () => {
    await onExecute('adjust_price', {
      adjustment: priceAdjustment,
      type: priceAdjustType
    })
    setShowPriceAdjust(false)
    setPriceAdjustment(0)
  }

  const handleStockAdjust = async () => {
    await onExecute('adjust_stock', { adjustment: stockAdjustment })
    setShowStockAdjust(false)
    setStockAdjustment(0)
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 border rounded-lg">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExecute('set_active')}
            disabled={isExecuting}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Set Active
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExecute('set_draft')}
            disabled={isExecuting}
          >
            <FileEdit className="h-4 w-4 mr-1" />
            Set Draft
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExecute('set_archived')}
            disabled={isExecuting}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExecuting}>
              <MoreHorizontal className="h-4 w-4 mr-1" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {/* Assign Category */}
            {categories.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tag className="h-4 w-4 mr-2" />
                  Assign Category
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => onExecute('assign_category', { categoryId: category.id })}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            <DropdownMenuItem onClick={() => setShowPriceAdjust(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Adjust Prices
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowStockAdjust(true)}>
              <Package className="h-4 w-4 mr-2" />
              Adjust Stock
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected 
              products and all their variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Adjustment Dialog */}
      <Dialog open={showPriceAdjust} onOpenChange={setShowPriceAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Prices</DialogTitle>
            <DialogDescription>
              Adjust prices for {selectedCount} selected products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              value={priceAdjustType}
              onValueChange={(v) => setPriceAdjustType(v as 'fixed' | 'percentage')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Percentage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed Amount</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label>
                {priceAdjustType === 'percentage' ? 'Percentage Change' : 'Amount Change'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                  placeholder={priceAdjustType === 'percentage' ? '10' : '5.00'}
                />
                <span className="text-muted-foreground">
                  {priceAdjustType === 'percentage' ? '%' : '$'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use negative values to decrease prices
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceAdjust(false)}>
              Cancel
            </Button>
            <Button onClick={handlePriceAdjust} disabled={isExecuting}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockAdjust} onOpenChange={setShowStockAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Adjust inventory for {selectedCount} selected products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity Adjustment</Label>
              <Input
                type="number"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(Number(e.target.value))}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Use negative values to decrease stock
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockAdjust(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjust} disabled={isExecuting}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

### Task 2.6: Create Bulk Actions Export

**File**: `src/modules/ecommerce/components/bulk/index.ts`
**Action**: Create

**Description**: Export bulk action components

```typescript
/**
 * E-Commerce Bulk Actions
 * 
 * Phase ECOM-02: Product Management Enhancement
 */

export { BulkActionsToolbar } from './bulk-actions-toolbar'
```

---

### Task 2.7: Create Product Table Columns

**File**: `src/modules/ecommerce/components/tables/product-columns.tsx`
**Action**: Create

**Description**: Column definitions for the product data table

```typescript
/**
 * Product Table Columns
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Column definitions for TanStack Table
 */
'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Archive, 
  Trash2,
  ImageOff,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product, ProductStatus } from '../../types/ecommerce-types'

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  draft: { 
    label: 'Draft', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  archived: { 
    label: 'Archived', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  }
}

// ============================================================================
// INLINE EDIT CELL
// ============================================================================

interface InlineEditCellProps {
  value: string | number
  onSave: (value: string | number) => Promise<void>
  type?: 'text' | 'number' | 'currency'
  currency?: string
}

function InlineEditCell({ value, onSave, type = 'text', currency = 'USD' }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const [isSaving, setIsSaving] = useState(false)

  const displayValue = type === 'currency' 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value) / 100)
    : value

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newValue = type === 'number' || type === 'currency' 
        ? Number(editValue) 
        : editValue
      await onSave(newValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(String(value))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type={type === 'text' ? 'text' : 'number'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-24 text-sm"
          autoFocus
          disabled={isSaving}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <span 
      className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {displayValue}
    </span>
  )
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

interface CreateColumnsProps {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDuplicate: (productId: string) => void
  onArchive: (product: Product) => void
  onDelete: (productId: string) => void
  onInlineEdit: (productId: string, field: string, value: unknown) => Promise<void>
  currency?: string
}

export function createProductColumns({
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onInlineEdit,
  currency = 'USD'
}: CreateColumnsProps): ColumnDef<Product>[] {
  return [
    // Checkbox column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40
    },

    // Image column
    {
      id: 'image',
      header: '',
      cell: ({ row }) => {
        const product = row.original
        const imageUrl = product.images?.[0]
        
        return (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 60
    },

    // Product Name & SKU
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span 
              className="font-medium hover:text-primary cursor-pointer"
              onClick={() => onView(product)}
            >
              {product.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {product.sku && (
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                  SKU: {product.sku}
                </span>
              )}
              <span className="opacity-60">ID: {product.id.slice(0, 8)}...</span>
            </div>
          </div>
        )
      },
      size: 280
    },

    // Status
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const config = statusConfig[status]
        return (
          <Badge className={cn('text-xs', config.className)}>
            {config.label}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value === 'all' || row.getValue(id) === value
      },
      size: 100
    },

    // Price (inline editable)
    {
      accessorKey: 'base_price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <InlineEditCell
            value={product.base_price}
            type="currency"
            currency={currency}
            onSave={async (value) => {
              await onInlineEdit(product.id, 'base_price', value)
            }}
          />
        )
      },
      size: 120
    },

    // Inventory (inline editable)
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Inventory
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        const isLowStock = product.track_inventory && 
          product.quantity <= product.low_stock_threshold
        const isOutOfStock = product.quantity === 0

        if (!product.track_inventory) {
          return <span className="text-muted-foreground text-sm">Not tracked</span>
        }

        return (
          <div className="flex items-center gap-2">
            <InlineEditCell
              value={product.quantity}
              type="number"
              onSave={async (value) => {
                await onInlineEdit(product.id, 'quantity', value)
              }}
            />
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Out
              </Badge>
            )}
            {!isOutOfStock && isLowStock && (
              <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Low
              </Badge>
            )}
          </div>
        )
      },
      size: 140
    },

    // Category
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const product = row.original
        // Check metadata for primary category
        const categoryName = (product.metadata as Record<string, unknown>)?.primary_category_name as string
        return categoryName || <span className="text-muted-foreground">—</span>
      },
      size: 120
    },

    // Actions
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {product.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onArchive(product)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(product.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50
    }
  ]
}
```

---

### Task 2.8: Create Product Data Table

**File**: `src/modules/ecommerce/components/tables/product-data-table.tsx`
**Action**: Create

**Description**: Main product data table component with TanStack Table

```typescript
/**
 * Product Data Table
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Full-featured data table for products using TanStack Table
 */
'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Columns,
  Download,
  Upload
} from 'lucide-react'
import { createProductColumns } from './product-columns'
import { ProductFilters, defaultProductFilters } from '../filters/product-filters'
import { BulkActionsToolbar } from '../bulk/bulk-actions-toolbar'
import type { Product, Category, ProductTableFilters, BulkAction } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ProductDataTableProps {
  products: Product[]
  categories: Category[]
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDuplicate: (productId: string) => Promise<void>
  onArchive: (product: Product) => Promise<void>
  onDelete: (productId: string) => Promise<void>
  onInlineEdit: (productId: string, field: string, value: unknown) => Promise<void>
  onBulkAction: (action: BulkAction, productIds: string[], params?: Record<string, unknown>) => Promise<void>
  onExport: () => void
  onImport: () => void
  currency?: string
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductDataTable({
  products,
  categories,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onInlineEdit,
  onBulkAction,
  onExport,
  onImport,
  currency = 'USD',
  isLoading = false
}: ProductDataTableProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [filters, setFilters] = useState<ProductTableFilters>(defaultProductFilters)
  const [isBulkExecuting, setIsBulkExecuting] = useState(false)

  // Create columns
  const columns = useMemo(() => createProductColumns({
    onView,
    onEdit,
    onDuplicate,
    onArchive,
    onDelete,
    onInlineEdit,
    currency
  }), [onView, onEdit, onDuplicate, onArchive, onDelete, onInlineEdit, currency])

  // Filter products based on advanced filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase()
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku?.toLowerCase().includes(query) &&
          !product.description?.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all' && product.status !== filters.status) {
        return false
      }

      // Stock level filter
      if (filters.stockLevel !== 'all') {
        if (filters.stockLevel === 'out_of_stock' && product.quantity !== 0) return false
        if (filters.stockLevel === 'low_stock' && 
          !(product.track_inventory && product.quantity > 0 && product.quantity <= product.low_stock_threshold)) {
          return false
        }
        if (filters.stockLevel === 'in_stock' && 
          (product.quantity === 0 || (product.track_inventory && product.quantity <= product.low_stock_threshold))) {
          return false
        }
      }

      // Price filter
      if (filters.priceMin !== null && product.base_price < filters.priceMin * 100) return false
      if (filters.priceMax !== null && product.base_price > filters.priceMax * 100) return false

      // Date filter
      if (filters.dateFrom !== null) {
        const productDate = new Date(product.created_at)
        const fromDate = new Date(filters.dateFrom)
        if (productDate < fromDate) return false
      }
      if (filters.dateTo !== null) {
        const productDate = new Date(product.created_at)
        const toDate = new Date(filters.dateTo)
        if (productDate > toDate) return false
      }

      // Featured filter
      if (filters.featured !== null && product.is_featured !== filters.featured) return false

      return true
    })
  }, [products, filters])

  // Create table
  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    initialState: {
      pagination: { pageSize: 20 }
    }
  })

  // Get selected product IDs
  const selectedProductIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(key => {
        const row = table.getRowModel().rows.find((_, i) => String(i) === key)
        return row?.original.id
      })
      .filter(Boolean) as string[]
  }, [rowSelection, table])

  // Handle bulk action
  const handleBulkAction = async (action: BulkAction, params?: Record<string, unknown>) => {
    setIsBulkExecuting(true)
    try {
      await onBulkAction(action, selectedProductIds, params)
      setRowSelection({}) // Clear selection after action
    } finally {
      setIsBulkExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredProducts.length} of {products.length} products
        </div>

        <div className="flex items-center gap-2">
          {/* Import/Export */}
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const labels: Record<string, string> = {
                    name: 'Product',
                    status: 'Status',
                    base_price: 'Price',
                    quantity: 'Inventory',
                    category: 'Category'
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {labels[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActionsToolbar
        selectedCount={selectedProductIds.length}
        onClearSelection={() => setRowSelection({})}
        onExecute={handleBulkAction}
        isExecuting={isBulkExecuting}
        categories={categories}
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 2.9: Create Tables Export

**File**: `src/modules/ecommerce/components/tables/index.ts`
**Action**: Create

**Description**: Export table components

```typescript
/**
 * E-Commerce Tables
 * 
 * Phase ECOM-02: Product Management Enhancement
 */

export { ProductDataTable } from './product-data-table'
export { createProductColumns } from './product-columns'
```

---

### Task 2.10: Create Import Products Dialog

**File**: `src/modules/ecommerce/components/dialogs/import-products-dialog.tsx`
**Action**: Create

**Description**: Dialog for importing products from CSV

```typescript
/**
 * Import Products Dialog
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * CSV import with preview and validation
 */
'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { importProducts } from '../../actions/product-import-export'
import type { ProductImportRow, ProductImportResult } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ImportProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  agencyId: string
  onSuccess: () => void
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

// ============================================================================
// COMPONENT
// ============================================================================

export function ImportProductsDialog({
  open,
  onOpenChange,
  siteId,
  agencyId,
  onSuccess
}: ImportProductsDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ProductImportRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null)

  // Parse CSV
  const parseCSV = useCallback((content: string): { rows: ProductImportRow[]; errors: string[] } => {
    const lines = content.split('\n').filter(line => line.trim())
    const errors: string[] = []
    const rows: ProductImportRow[] = []

    if (lines.length < 2) {
      errors.push('File must have a header row and at least one data row')
      return { rows, errors }
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    
    // Required fields
    if (!headers.includes('name')) {
      errors.push('Missing required column: name')
    }
    if (!headers.includes('base_price') && !headers.includes('price')) {
      errors.push('Missing required column: base_price or price')
    }

    if (errors.length > 0) {
      return { rows, errors }
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate and transform row
      const importRow: ProductImportRow = {
        name: row.name as string || '',
        sku: row.sku as string || undefined,
        description: row.description as string || undefined,
        base_price: parseFloat(row.base_price as string || row.price as string || '0'),
        compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price as string) : undefined,
        quantity: row.quantity ? parseInt(row.quantity as string) : undefined,
        category: row.category as string || undefined,
        status: (row.status as string)?.toLowerCase() as 'active' | 'draft' | 'archived' || 'draft',
        images: row.images as string || undefined,
        track_inventory: row.track_inventory === 'true' || row.track_inventory === 'yes',
        low_stock_threshold: row.low_stock_threshold ? parseInt(row.low_stock_threshold as string) : undefined
      }

      rows.push(importRow)
    }

    return { rows, errors }
  }, [])

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (!csvFile) return

    setFile(csvFile)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { rows, errors } = parseCSV(content)
      
      setPreviewData(rows)
      setParseErrors(errors)
      
      if (errors.length === 0 && rows.length > 0) {
        setStep('preview')
      }
    }
    reader.readAsText(csvFile)
  }, [parseCSV])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  })

  // Import handler
  const handleImport = async () => {
    setStep('importing')
    setImportProgress(0)

    try {
      // Simulate progress (actual import happens server-side)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await importProducts(siteId, agencyId, previewData)
      
      clearInterval(progressInterval)
      setImportProgress(100)
      setImportResult(result)
      setStep('complete')

      if (result.success) {
        onSuccess()
      }
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        skipped: previewData.length,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }]
      })
      setStep('complete')
    }
  }

  // Reset dialog
  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setPreviewData([])
    setParseErrors([])
    setImportProgress(0)
    setImportResult(null)
  }

  // Download template
  const downloadTemplate = () => {
    const template = 'name,sku,description,base_price,compare_at_price,quantity,category,status,images,track_inventory,low_stock_threshold\n"Example Product","SKU-001","Product description",29.99,39.99,100,"Category Name","draft","https://example.com/image.jpg",true,5'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) handleReset()
      onOpenChange(value)
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop a CSV file'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>

            {parseErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                  <XCircle className="h-4 w-4" />
                  Errors in file
                </div>
                <ul className="text-sm text-destructive space-y-1">
                  {parseErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <p className="text-sm text-muted-foreground">
                Required columns: name, base_price
              </p>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{file?.name}</span>
                <Badge variant="secondary">{previewData.length} products</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Change file
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 100).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.sku || '—'}</TableCell>
                      <TableCell>${row.base_price.toFixed(2)}</TableCell>
                      <TableCell>{row.quantity ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.status || 'draft'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.length > 100 && (
                <p className="text-center py-4 text-sm text-muted-foreground">
                  Showing first 100 of {previewData.length} products
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="py-12 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-lg font-medium">Importing products...</p>
            <Progress value={importProgress} className="w-64 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {Math.round(importProgress)}% complete
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && importResult && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              {importResult.success ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-medium text-green-600">Import Complete!</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-xl font-medium text-yellow-600">Import Completed with Issues</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <ScrollArea className="h-40 border rounded-lg p-4">
                <div className="space-y-2">
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-muted-foreground">Row {error.row}:</span>{' '}
                      <span className="text-destructive">{error.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import {previewData.length} Products
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 2.11: Update Products View

**File**: `src/modules/ecommerce/components/views/products-view.tsx`
**Action**: Modify (Major rewrite)

**Description**: Integrate the new data table and all product management features

```typescript
/**
 * Products View Component
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * Enhanced product management with data table, bulk actions, import/export
 */
'use client'

import { useState, useCallback } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { ProductDataTable } from '../tables/product-data-table'
import { EditProductDialog } from '../dialogs/edit-product-dialog'
import { ViewProductDialog } from '../dialogs/view-product-dialog'
import { ImportProductsDialog } from '../dialogs/import-products-dialog'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import type { Product, BulkAction } from '../../types/ecommerce-types'
import { 
  executeBulkAction, 
  duplicateProduct,
  updateProductField,
  exportProducts 
} from '../../actions/product-import-export'

// ============================================================================
// TYPES
// ============================================================================

interface ProductsViewProps {
  onCreateProduct?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductsView({ onCreateProduct }: ProductsViewProps) {
  const { 
    products, 
    categories, 
    isLoading, 
    refresh,
    removeProduct, 
    editProduct,
    siteId,
    agencyId
  } = useEcommerce()

  // Dialog states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Handlers
  const handleView = useCallback((product: Product) => {
    setViewingProduct(product)
    setShowViewDialog(true)
  }, [])

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product)
    setShowEditDialog(true)
  }, [])

  const handleDuplicate = useCallback(async (productId: string) => {
    try {
      const duplicated = await duplicateProduct(siteId, productId)
      toast.success(`Product duplicated: ${duplicated.name}`)
      refresh()
    } catch (error) {
      console.error('Error duplicating product:', error)
      toast.error('Failed to duplicate product')
    }
  }, [siteId, refresh])

  const handleArchive = useCallback(async (product: Product) => {
    try {
      await editProduct(product.id, { status: 'archived' })
      toast.success('Product archived')
    } catch (error) {
      console.error('Error archiving product:', error)
      toast.error('Failed to archive product')
    }
  }, [editProduct])

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await removeProduct(productId)
      toast.success('Product deleted')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }, [removeProduct])

  const handleInlineEdit = useCallback(async (
    productId: string, 
    field: string, 
    value: unknown
  ) => {
    try {
      const result = await updateProductField(siteId, productId, field, value)
      if (result.success) {
        toast.success('Updated successfully')
        refresh()
      } else {
        toast.error(result.error || 'Failed to update')
      }
    } catch (error) {
      console.error('Error updating field:', error)
      toast.error('Failed to update')
    }
  }, [siteId, refresh])

  const handleBulkAction = useCallback(async (
    action: BulkAction,
    productIds: string[],
    params?: Record<string, unknown>
  ) => {
    try {
      const result = await executeBulkAction(siteId, productIds, action, params)
      
      if (result.success) {
        toast.success(`${result.affected} products updated`)
        refresh()
      } else {
        toast.error(result.errors.join(', '))
      }
    } catch (error) {
      console.error('Error executing bulk action:', error)
      toast.error('Bulk action failed')
    }
  }, [siteId, refresh])

  const handleExport = useCallback(async () => {
    try {
      const { data, filename } = await exportProducts(siteId, {
        format: 'csv',
        includeFields: ['name', 'sku', 'description', 'base_price', 'compare_at_price', 'quantity', 'status'],
        includeVariants: false,
        includeImages: true
      })

      // Download file
      const blob = new Blob([data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Products exported successfully')
    } catch (error) {
      console.error('Error exporting products:', error)
      toast.error('Failed to export products')
    }
  }, [siteId])

  const handleImport = useCallback(() => {
    setShowImportDialog(true)
  }, [])

  const handleImportSuccess = useCallback(() => {
    toast.success('Products imported successfully')
    refresh()
  }, [refresh])

  // Empty state
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">No products yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Get started by adding your first product
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline" onClick={handleImport}>
            Import from CSV
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={onCreateProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Data Table */}
      <ProductDataTable
        products={products}
        categories={categories}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onInlineEdit={handleInlineEdit}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onImport={handleImport}
        isLoading={isLoading}
      />

      {/* Dialogs */}
      {editingProduct && (
        <EditProductDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          product={editingProduct}
        />
      )}

      {viewingProduct && (
        <ViewProductDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          product={viewingProduct}
        />
      )}

      <ImportProductsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        siteId={siteId}
        agencyId={agencyId}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
```

---

## 🗄️ Database Migrations

No database migrations required for Phase ECOM-02. This phase uses existing product tables.

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Product table renders with all columns
- [ ] Product SKU/ID prominently displayed
- [ ] Status badges show correct colors
- [ ] Inline editing works for price and quantity
- [ ] Bulk selection with checkbox works
- [ ] Bulk actions execute correctly (delete, status change, archive)
- [ ] Advanced filters work (status, stock level, price range)
- [ ] Filter pills show and can be cleared
- [ ] Column visibility toggle works
- [ ] Pagination works correctly
- [ ] CSV import with preview works
- [ ] CSV export downloads file
- [ ] Product duplication creates copy
- [ ] Search filters products correctly
- [ ] Mobile responsive layout works

---

## 🔄 Rollback Plan

If issues occur:
1. Restore original `products-view.tsx` from git
2. Remove new directories: `components/tables/`, `components/filters/`, `components/bulk/`
3. Remove `actions/product-import-export.ts`
4. Revert type additions in `types/ecommerce-types.ts`
5. Run `npx tsc --noEmit` to verify clean state

```bash
git checkout -- src/modules/ecommerce/components/views/products-view.tsx
rm -rf src/modules/ecommerce/components/tables/
rm -rf src/modules/ecommerce/components/filters/
rm -rf src/modules/ecommerce/components/bulk/
rm src/modules/ecommerce/components/dialogs/import-products-dialog.tsx
rm src/modules/ecommerce/actions/product-import-export.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add "✅ PHASE-ECOM-02: Product Management Enhancement Complete"
- `progress.md`: Update e-commerce section with product management status

---

## ✨ Success Criteria

- [ ] Product table displays SKU/ID prominently
- [ ] Status badges are visually clear and color-coded
- [ ] Inline editing works for price and inventory
- [ ] Bulk actions toolbar appears when items selected
- [ ] All bulk actions execute successfully
- [ ] Advanced filters reduce product list correctly
- [ ] CSV import with preview and validation works
- [ ] CSV export generates valid file
- [ ] Product duplication creates draft copy
- [ ] Pagination handles large product lists
- [ ] Column visibility persists during session
- [ ] TypeScript compiles with zero errors
