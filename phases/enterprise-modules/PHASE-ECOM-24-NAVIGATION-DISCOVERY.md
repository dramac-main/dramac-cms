# PHASE-ECOM-24: Navigation & Discovery Components

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-20 (Core Hooks)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create navigation and product discovery components for the Studio editor including category navigation, search bars, filters, breadcrumbs, and sorting. These components enable customers to find products efficiently.

---

## 📋 Pre-Implementation Checklist

- [ ] PHASE-ECOM-20 hooks are implemented
- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing search hook patterns
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Navigation & Discovery Components
├── CategoryNavBlock          → Category tree navigation (Studio)
├── SearchBarBlock            → Product search with suggestions (Studio)
├── FilterSidebarBlock        → Faceted filtering (Studio)
├── BreadcrumbBlock           → Navigation breadcrumbs (Studio)
├── ProductSortBlock          → Sort dropdown (Studio)
├── ActiveFilters             → Display active filters
├── FilterOption              → Individual filter option
└── CategoryCard              → Category display card

Discovery Flow
[Search] → [Categories] → [Filters] → [Sort] → [Products]
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `studio/blocks/ecommerce/category-nav-block.tsx` | Create | Category navigation |
| `studio/blocks/ecommerce/search-bar-block.tsx` | Create | Search with autocomplete |
| `studio/blocks/ecommerce/filter-sidebar-block.tsx` | Create | Faceted filters |
| `studio/blocks/ecommerce/breadcrumb-block.tsx` | Create | Navigation trail |
| `studio/blocks/ecommerce/product-sort-block.tsx` | Create | Sort dropdown |
| `studio/components/ecommerce/ActiveFilters.tsx` | Create | Active filter tags |
| `studio/components/ecommerce/FilterOption.tsx` | Create | Filter checkboxes |
| `studio/components/ecommerce/CategoryCard.tsx` | Create | Category display |
| `modules/ecommerce/hooks/useProductFilters.ts` | Create | Filter state hook |
| `studio/blocks/ecommerce/index.ts` | Modify | Export navigation blocks |

---

## 📋 Implementation Tasks

### Task 24.1: Create useProductFilters Hook

**File**: `src/modules/ecommerce/hooks/useProductFilters.ts`
**Action**: Create

**Description**: Hook for managing filter state and URL sync

```typescript
/**
 * useProductFilters - Filter state management hook
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Manages filter state with URL synchronization.
 */
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// ============================================================================
// TYPES
// ============================================================================

export interface PriceRange {
  min: number | null
  max: number | null
}

export interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: PriceRange
  inStock: boolean | null
  onSale: boolean | null
  rating: number | null
  attributes: Record<string, string[]>
  tags: string[]
}

export interface SortOption {
  value: string
  label: string
  field: string
  direction: 'asc' | 'desc'
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Featured', field: 'sort_order', direction: 'asc' },
  { value: 'newest', label: 'Newest', field: 'created_at', direction: 'desc' },
  { value: 'price-asc', label: 'Price: Low to High', field: 'price', direction: 'asc' },
  { value: 'price-desc', label: 'Price: High to Low', field: 'price', direction: 'desc' },
  { value: 'name-asc', label: 'Name: A to Z', field: 'name', direction: 'asc' },
  { value: 'name-desc', label: 'Name: Z to A', field: 'name', direction: 'desc' },
  { value: 'rating', label: 'Highest Rated', field: 'average_rating', direction: 'desc' },
  { value: 'best-selling', label: 'Best Selling', field: 'total_sales', direction: 'desc' }
]

export interface FilterResult {
  // State
  filters: FilterState
  sort: string
  searchQuery: string
  
  // Filter counts
  activeFilterCount: number
  
  // Actions
  setCategory: (categoryId: string, selected: boolean) => void
  setCategories: (categoryIds: string[]) => void
  setBrand: (brand: string, selected: boolean) => void
  setBrands: (brands: string[]) => void
  setPriceRange: (range: PriceRange) => void
  setInStock: (inStock: boolean | null) => void
  setOnSale: (onSale: boolean | null) => void
  setRating: (rating: number | null) => void
  setAttribute: (name: string, value: string, selected: boolean) => void
  setTag: (tag: string, selected: boolean) => void
  setSort: (sort: string) => void
  setSearchQuery: (query: string) => void
  
  // Bulk actions
  clearFilters: () => void
  clearFilter: (filterType: keyof FilterState) => void
  applyFilters: () => void
  
  // URL sync
  getFilterParams: () => URLSearchParams
  isFilterActive: (filterType: keyof FilterState, value?: string) => boolean
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  brands: [],
  priceRange: { min: null, max: null },
  inStock: null,
  onSale: null,
  rating: null,
  attributes: {},
  tags: []
}

// ============================================================================
// HOOK
// ============================================================================

export function useProductFilters(syncToUrl = true): FilterResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize from URL
  const initialFilters = useMemo(() => {
    if (!searchParams) return DEFAULT_FILTERS

    return {
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
      brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
      priceRange: {
        min: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
        max: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
      },
      inStock: searchParams.get('inStock') === 'true' ? true : 
               searchParams.get('inStock') === 'false' ? false : null,
      onSale: searchParams.get('onSale') === 'true' ? true : null,
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
      attributes: parseAttributes(searchParams.get('attrs')),
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || []
    }
  }, [searchParams])

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [sort, setSort] = useState(searchParams?.get('sort') || 'featured')
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    count += filters.categories.length
    count += filters.brands.length
    count += filters.tags.length
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++
    if (filters.inStock !== null) count++
    if (filters.onSale !== null) count++
    if (filters.rating !== null) count++
    count += Object.values(filters.attributes).flat().length
    return count
  }, [filters])

  // Filter setters
  const setCategory = useCallback((categoryId: string, selected: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: selected
        ? [...prev.categories, categoryId]
        : prev.categories.filter(c => c !== categoryId)
    }))
  }, [])

  const setCategories = useCallback((categoryIds: string[]) => {
    setFilters(prev => ({ ...prev, categories: categoryIds }))
  }, [])

  const setBrand = useCallback((brand: string, selected: boolean) => {
    setFilters(prev => ({
      ...prev,
      brands: selected
        ? [...prev.brands, brand]
        : prev.brands.filter(b => b !== brand)
    }))
  }, [])

  const setBrands = useCallback((brands: string[]) => {
    setFilters(prev => ({ ...prev, brands }))
  }, [])

  const setPriceRange = useCallback((range: PriceRange) => {
    setFilters(prev => ({ ...prev, priceRange: range }))
  }, [])

  const setInStock = useCallback((inStock: boolean | null) => {
    setFilters(prev => ({ ...prev, inStock }))
  }, [])

  const setOnSale = useCallback((onSale: boolean | null) => {
    setFilters(prev => ({ ...prev, onSale }))
  }, [])

  const setRating = useCallback((rating: number | null) => {
    setFilters(prev => ({ ...prev, rating }))
  }, [])

  const setAttribute = useCallback((name: string, value: string, selected: boolean) => {
    setFilters(prev => {
      const current = prev.attributes[name] || []
      return {
        ...prev,
        attributes: {
          ...prev.attributes,
          [name]: selected
            ? [...current, value]
            : current.filter(v => v !== value)
        }
      }
    })
  }, [])

  const setTag = useCallback((tag: string, selected: boolean) => {
    setFilters(prev => ({
      ...prev,
      tags: selected
        ? [...prev.tags, tag]
        : prev.tags.filter(t => t !== tag)
    }))
  }, [])

  // Clear functions
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
  }, [])

  const clearFilter = useCallback((filterType: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: DEFAULT_FILTERS[filterType]
    }))
  }, [])

  // Build URL params
  const getFilterParams = useCallback(() => {
    const params = new URLSearchParams()
    
    if (filters.categories.length) params.set('categories', filters.categories.join(','))
    if (filters.brands.length) params.set('brands', filters.brands.join(','))
    if (filters.priceRange.min !== null) params.set('minPrice', String(filters.priceRange.min))
    if (filters.priceRange.max !== null) params.set('maxPrice', String(filters.priceRange.max))
    if (filters.inStock !== null) params.set('inStock', String(filters.inStock))
    if (filters.onSale) params.set('onSale', 'true')
    if (filters.rating !== null) params.set('rating', String(filters.rating))
    if (filters.tags.length) params.set('tags', filters.tags.join(','))
    if (Object.keys(filters.attributes).length) {
      params.set('attrs', stringifyAttributes(filters.attributes))
    }
    if (sort !== 'featured') params.set('sort', sort)
    if (searchQuery) params.set('q', searchQuery)
    
    return params
  }, [filters, sort, searchQuery])

  // Apply filters (update URL)
  const applyFilters = useCallback(() => {
    if (!syncToUrl) return
    
    const params = getFilterParams()
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.push(newUrl, { scroll: false })
  }, [syncToUrl, getFilterParams, pathname, router])

  // Check if filter is active
  const isFilterActive = useCallback((filterType: keyof FilterState, value?: string): boolean => {
    const filterValue = filters[filterType]
    
    if (value !== undefined) {
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value)
      }
      return filterValue === value
    }
    
    if (Array.isArray(filterValue)) return filterValue.length > 0
    if (filterType === 'priceRange') {
      return filters.priceRange.min !== null || filters.priceRange.max !== null
    }
    return filterValue !== null
  }, [filters])

  return {
    filters,
    sort,
    searchQuery,
    activeFilterCount,
    setCategory,
    setCategories,
    setBrand,
    setBrands,
    setPriceRange,
    setInStock,
    setOnSale,
    setRating,
    setAttribute,
    setTag,
    setSort,
    setSearchQuery,
    clearFilters,
    clearFilter,
    applyFilters,
    getFilterParams,
    isFilterActive
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function parseAttributes(str: string | null): Record<string, string[]> {
  if (!str) return {}
  try {
    return JSON.parse(decodeURIComponent(str))
  } catch {
    return {}
  }
}

function stringifyAttributes(attrs: Record<string, string[]>): string {
  return encodeURIComponent(JSON.stringify(attrs))
}
```

---

### Task 24.2: Create Category Card Component

**File**: `src/studio/components/ecommerce/CategoryCard.tsx`
**Action**: Create

**Description**: Category display card component

```typescript
/**
 * CategoryCard - Category display component
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Displays category with image and product count.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronRight, Folder } from 'lucide-react'
import type { Category } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CategoryCardProps {
  category: Category
  variant?: 'card' | 'row' | 'chip'
  showImage?: boolean
  showCount?: boolean
  showArrow?: boolean
  href?: string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoryCard({
  category,
  variant = 'card',
  showImage = true,
  showCount = true,
  showArrow = false,
  href,
  className
}: CategoryCardProps) {
  const linkHref = href || `/shop/category/${category.slug}`

  // Chip variant
  if (variant === 'chip') {
    return (
      <Link
        href={linkHref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2',
          'bg-background hover:bg-accent transition-colors',
          className
        )}
      >
        <span className="text-sm font-medium">{category.name}</span>
        {showCount && category.product_count !== undefined && (
          <span className="text-xs text-muted-foreground">
            ({category.product_count})
          </span>
        )}
      </Link>
    )
  }

  // Row variant
  if (variant === 'row') {
    return (
      <Link
        href={linkHref}
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg',
          'hover:bg-accent transition-colors group',
          className
        )}
      >
        {showImage && (
          <div className="relative h-12 w-12 shrink-0 rounded-lg bg-muted overflow-hidden">
            {category.image_url ? (
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Folder className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{category.name}</p>
          {category.description && (
            <p className="text-sm text-muted-foreground truncate">
              {category.description}
            </p>
          )}
        </div>
        {showCount && category.product_count !== undefined && (
          <span className="text-sm text-muted-foreground">
            {category.product_count} products
          </span>
        )}
        {showArrow && (
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        )}
      </Link>
    )
  }

  // Default card variant
  return (
    <Link
      href={linkHref}
      className={cn(
        'group block rounded-xl border overflow-hidden',
        'bg-background hover:border-primary/50 transition-colors',
        className
      )}
    >
      {showImage && (
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Folder className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        {showCount && category.product_count !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            {category.product_count} products
          </p>
        )}
      </div>
    </Link>
  )
}
```

---

### Task 24.3: Create Category Nav Block

**File**: `src/studio/blocks/ecommerce/category-nav-block.tsx`
**Action**: Create

**Description**: Category navigation menu block

```typescript
/**
 * CategoryNavBlock - Category navigation menu
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Displays category tree for navigation.
 */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { useStorefrontCategories } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { CategoryCard } from '@/studio/components/ecommerce/CategoryCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'
import type { Category } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryNavBlockProps extends StudioBlockProps {
  // Display
  variant?: ResponsiveValue<'tree' | 'grid' | 'list' | 'cards'>
  columns?: ResponsiveValue<2 | 3 | 4 | 6>
  
  // Content
  title?: string
  showTitle?: boolean
  showProductCount?: boolean
  showImages?: boolean
  showSubcategories?: boolean
  maxDepth?: number
  
  // Behavior
  expandable?: boolean
  defaultExpanded?: boolean
  parentCategory?: string // Filter to children of this category
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// Build category tree
function buildTree(categories: Category[], parentId: string | null = null): Category[] {
  return categories
    .filter(cat => cat.parent_id === parentId)
    .map(cat => ({
      ...cat,
      children: buildTree(categories, cat.id)
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

// ============================================================================
// TREE ITEM COMPONENT
// ============================================================================

interface TreeItemProps {
  category: Category & { children?: Category[] }
  depth: number
  maxDepth: number
  showCount: boolean
  expandable: boolean
  defaultExpanded: boolean
}

function TreeItem({ 
  category, 
  depth, 
  maxDepth, 
  showCount, 
  expandable,
  defaultExpanded 
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const hasChildren = category.children && category.children.length > 0
  const canExpand = expandable && hasChildren && depth < maxDepth

  return (
    <div>
      <Link
        href={`/shop/category/${category.slug}`}
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg',
          'hover:bg-accent transition-colors group',
          depth > 0 && 'ml-4'
        )}
        onClick={(e) => {
          if (canExpand) {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
      >
        {canExpand ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : hasChildren ? (
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        
        <span className="flex-1 font-medium group-hover:text-primary transition-colors">
          {category.name}
        </span>
        
        {showCount && category.product_count !== undefined && (
          <span className="text-sm text-muted-foreground">
            {category.product_count}
          </span>
        )}
      </Link>

      {canExpand && isExpanded && category.children && (
        <div className="mt-1">
          {category.children.map(child => (
            <TreeItem
              key={child.id}
              category={child as Category & { children?: Category[] }}
              depth={depth + 1}
              maxDepth={maxDepth}
              showCount={showCount}
              expandable={expandable}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CategoryNavBlock({
  variant = 'tree',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  title = 'Categories',
  showTitle = true,
  showProductCount = true,
  showImages = true,
  showSubcategories = true,
  maxDepth = 3,
  expandable = true,
  defaultExpanded = false,
  parentCategory,
  className,
  __studioMeta
}: CategoryNavBlockProps) {
  const { siteId } = useStorefront()
  const { categories, isLoading } = useStorefrontCategories(siteId)
  
  const variantValue = getResponsiveValue(variant, 'tree')
  const columnsValue = getResponsiveValue(columns, 4)

  // Filter and build tree
  const displayCategories = React.useMemo(() => {
    let filtered = categories
    
    if (parentCategory) {
      const parent = categories.find(c => c.id === parentCategory || c.slug === parentCategory)
      if (parent) {
        filtered = categories.filter(c => c.parent_id === parent.id)
      }
    } else if (!showSubcategories) {
      filtered = categories.filter(c => !c.parent_id)
    }

    if (variantValue === 'tree') {
      return buildTree(filtered, parentCategory || null)
    }
    
    return filtered
  }, [categories, parentCategory, showSubcategories, variantValue])

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && <Skeleton className="h-6 w-32 mb-4" />}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Grid columns class
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  }[columnsValue]

  return (
    <div className={className}>
      {showTitle && title && (
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
      )}

      {/* Tree variant */}
      {variantValue === 'tree' && (
        <nav className="space-y-1">
          {displayCategories.map((category) => (
            <TreeItem
              key={category.id}
              category={category as Category & { children?: Category[] }}
              depth={0}
              maxDepth={maxDepth}
              showCount={showProductCount}
              expandable={expandable}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </nav>
      )}

      {/* Grid variant */}
      {variantValue === 'grid' && (
        <div className={cn('grid gap-4', gridClass)}>
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="card"
              showImage={showImages}
              showCount={showProductCount}
            />
          ))}
        </div>
      )}

      {/* List variant */}
      {variantValue === 'list' && (
        <div className="space-y-2">
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="row"
              showImage={showImages}
              showCount={showProductCount}
              showArrow
            />
          ))}
        </div>
      )}

      {/* Cards (chips) variant */}
      {variantValue === 'cards' && (
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="chip"
              showCount={showProductCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const categoryNavBlockConfig = {
  type: 'category-nav',
  label: 'Category Navigation',
  category: 'e-commerce',
  icon: 'FolderTree',
  defaultProps: {
    variant: 'tree',
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    title: 'Categories',
    showTitle: true,
    showProductCount: true,
    showImages: true,
    showSubcategories: true,
    maxDepth: 3,
    expandable: true,
    defaultExpanded: false
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Categories'
    },
    {
      name: 'showTitle',
      label: 'Show Title',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'variant',
      label: 'Display Style',
      type: 'select',
      options: [
        { value: 'tree', label: 'Tree Menu' },
        { value: 'grid', label: 'Grid Cards' },
        { value: 'list', label: 'List' },
        { value: 'cards', label: 'Chips/Tags' }
      ],
      responsive: true
    },
    {
      name: 'columns',
      label: 'Grid Columns',
      type: 'select',
      options: [
        { value: 2, label: '2 Columns' },
        { value: 3, label: '3 Columns' },
        { value: 4, label: '4 Columns' },
        { value: 6, label: '6 Columns' }
      ],
      responsive: true,
      showWhen: { variant: 'grid' }
    },
    {
      name: 'showProductCount',
      label: 'Show Product Count',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showImages',
      label: 'Show Category Images',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'expandable',
      label: 'Expandable Tree',
      type: 'toggle',
      defaultValue: true,
      showWhen: { variant: 'tree' }
    }
  ],
  ai: {
    suggestable: true,
    description: 'Category navigation menu for e-commerce',
    contextHints: ['categories', 'navigation', 'menu', 'browse']
  }
}
```

---

### Task 24.4: Create Search Bar Block

**File**: `src/studio/blocks/ecommerce/search-bar-block.tsx`
**Action**: Create

**Description**: Product search with autocomplete suggestions

```typescript
/**
 * SearchBarBlock - Product search with autocomplete
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Search input with product suggestions dropdown.
 */
'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, X, Loader2, TrendingUp, History, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStorefrontSearch, useRecentlyViewed } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface SearchBarBlockProps extends StudioBlockProps {
  // Display
  variant?: ResponsiveValue<'default' | 'expanded' | 'minimal'>
  placeholder?: string
  
  // Behavior
  showSuggestions?: boolean
  showRecentSearches?: boolean
  showTrendingSearches?: boolean
  minSearchLength?: number
  debounceMs?: number
  
  // Results
  maxSuggestions?: number
  searchUrl?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchBarBlock({
  variant = 'default',
  placeholder = 'Search products...',
  showSuggestions = true,
  showRecentSearches = true,
  showTrendingSearches = true,
  minSearchLength = 2,
  debounceMs = 300,
  maxSuggestions = 6,
  searchUrl = '/shop/search',
  className,
  __studioMeta
}: SearchBarBlockProps) {
  const router = useRouter()
  const { siteId, formatPrice } = useStorefront()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  const { results, isLoading: isSearching, search, clearResults } = useStorefrontSearch(siteId)
  const { items: recentItems } = useRecentlyViewed()

  const variantValue = getResponsiveValue(variant, 'default')
  const showDropdown = isFocused && (query.length >= minSearchLength || showRecentSearches)

  // Debounced search
  useEffect(() => {
    if (query.length < minSearchLength) {
      clearResults()
      return
    }

    const timeout = setTimeout(() => {
      search(query)
    }, debounceMs)

    return () => clearTimeout(timeout)
  }, [query, minSearchLength, debounceMs, search, clearResults])

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`${searchUrl}?q=${encodeURIComponent(query.trim())}`)
      setIsFocused(false)
    }
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    clearResults()
    inputRef.current?.focus()
  }

  // Handle item click
  const handleProductClick = () => {
    setIsFocused(false)
    setQuery('')
  }

  // Trending searches (mock - could come from analytics)
  const trendingSearches = ['Electronics', 'Clothing', 'Home & Garden', 'Sports']

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className={cn(
          'relative flex items-center',
          variantValue === 'expanded' && 'bg-muted rounded-lg p-1'
        )}>
          <Search className={cn(
            'absolute left-3 h-4 w-4 text-muted-foreground',
            variantValue === 'expanded' && 'left-4'
          )} />
          
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className={cn(
              'pl-10 pr-10',
              variantValue === 'expanded' && 'h-12 text-base pl-11 bg-background',
              variantValue === 'minimal' && 'border-none shadow-none bg-transparent'
            )}
          />

          {/* Clear / Loading */}
          <div className="absolute right-3 flex items-center gap-2">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {query && !isSearching && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className={cn(
          'absolute z-50 top-full mt-2 w-full',
          'bg-popover border rounded-lg shadow-lg',
          'max-h-[70vh] overflow-y-auto'
        )}>
          {/* Search Results */}
          {showSuggestions && results.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                Products
              </div>
              {results.slice(0, maxSuggestions).map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/product/${product.slug}`}
                  onClick={handleProductClick}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="relative h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
                    {product.primary_image ? (
                      <Image
                        src={product.primary_image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-sm text-primary font-semibold">
                      {formatPrice(product.sale_price || product.price)}
                    </p>
                  </div>
                </Link>
              ))}
              
              {results.length > maxSuggestions && (
                <Link
                  href={`${searchUrl}?q=${encodeURIComponent(query)}`}
                  onClick={handleProductClick}
                  className="block p-2 text-center text-sm text-primary hover:underline"
                >
                  View all {results.length} results
                </Link>
              )}
            </div>
          )}

          {/* No Results */}
          {query.length >= minSearchLength && !isSearching && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <p>No products found for "{query}"</p>
            </div>
          )}

          {/* Trending Searches */}
          {showTrendingSearches && !query && (
            <div className="p-2 border-b">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Trending
              </div>
              <div className="flex flex-wrap gap-2 p-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term)
                      search(term)
                    }}
                    className="px-3 py-1 text-sm rounded-full bg-muted hover:bg-accent transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Items */}
          {showRecentSearches && !query && recentItems.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <History className="h-3 w-3" />
                Recently Viewed
              </div>
              {recentItems.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/product/${product.slug}`}
                  onClick={handleProductClick}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="relative h-8 w-8 shrink-0 rounded bg-muted overflow-hidden">
                    {product.primary_image ? (
                      <Image
                        src={product.primary_image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : null}
                  </div>
                  <span className="text-sm truncate">{product.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const searchBarBlockConfig = {
  type: 'search-bar',
  label: 'Search Bar',
  category: 'e-commerce',
  icon: 'Search',
  defaultProps: {
    variant: 'default',
    placeholder: 'Search products...',
    showSuggestions: true,
    showRecentSearches: true,
    showTrendingSearches: true,
    minSearchLength: 2,
    maxSuggestions: 6,
    searchUrl: '/shop/search'
  },
  fields: [
    {
      name: 'placeholder',
      label: 'Placeholder Text',
      type: 'text',
      defaultValue: 'Search products...'
    },
    {
      name: 'variant',
      label: 'Style',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'expanded', label: 'Expanded' },
        { value: 'minimal', label: 'Minimal' }
      ],
      responsive: true
    },
    {
      name: 'showSuggestions',
      label: 'Show Product Suggestions',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showRecentSearches',
      label: 'Show Recent Items',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showTrendingSearches',
      label: 'Show Trending',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'maxSuggestions',
      label: 'Max Suggestions',
      type: 'number',
      defaultValue: 6
    },
    {
      name: 'searchUrl',
      label: 'Search Results URL',
      type: 'text',
      defaultValue: '/shop/search'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Product search bar with autocomplete',
    contextHints: ['search', 'find', 'lookup', 'autocomplete']
  }
}
```

---

### Task 24.5: Create Active Filters Component

**File**: `src/studio/components/ecommerce/ActiveFilters.tsx`
**Action**: Create

**Description**: Display and manage active filter tags

```typescript
/**
 * ActiveFilters - Display active filter tags
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Shows active filters with remove capability.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FilterState, PriceRange } from '@/modules/ecommerce/hooks/useProductFilters'

// ============================================================================
// TYPES
// ============================================================================

interface ActiveFiltersProps {
  filters: FilterState
  onRemoveCategory: (id: string) => void
  onRemoveBrand: (brand: string) => void
  onRemovePriceRange: () => void
  onRemoveInStock: () => void
  onRemoveOnSale: () => void
  onRemoveRating: () => void
  onRemoveAttribute: (name: string, value: string) => void
  onRemoveTag: (tag: string) => void
  onClearAll: () => void
  categoryLabels?: Record<string, string>
  formatPrice?: (price: number) => string
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActiveFilters({
  filters,
  onRemoveCategory,
  onRemoveBrand,
  onRemovePriceRange,
  onRemoveInStock,
  onRemoveOnSale,
  onRemoveRating,
  onRemoveAttribute,
  onRemoveTag,
  onClearAll,
  categoryLabels = {},
  formatPrice = (p) => `$${p}`,
  className
}: ActiveFiltersProps) {
  const hasFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange.min !== null ||
    filters.priceRange.max !== null ||
    filters.inStock !== null ||
    filters.onSale !== null ||
    filters.rating !== null ||
    Object.values(filters.attributes).flat().length > 0 ||
    filters.tags.length > 0

  if (!hasFilters) return null

  const formatPriceRange = (range: PriceRange) => {
    if (range.min !== null && range.max !== null) {
      return `${formatPrice(range.min)} - ${formatPrice(range.max)}`
    }
    if (range.min !== null) {
      return `From ${formatPrice(range.min)}`
    }
    if (range.max !== null) {
      return `Up to ${formatPrice(range.max)}`
    }
    return ''
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {/* Categories */}
      {filters.categories.map(catId => (
        <Badge key={catId} variant="secondary" className="gap-1">
          {categoryLabels[catId] || catId}
          <button onClick={() => onRemoveCategory(catId)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Brands */}
      {filters.brands.map(brand => (
        <Badge key={brand} variant="secondary" className="gap-1">
          {brand}
          <button onClick={() => onRemoveBrand(brand)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Price Range */}
      {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
        <Badge variant="secondary" className="gap-1">
          {formatPriceRange(filters.priceRange)}
          <button onClick={onRemovePriceRange}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* In Stock */}
      {filters.inStock !== null && (
        <Badge variant="secondary" className="gap-1">
          {filters.inStock ? 'In Stock' : 'Out of Stock'}
          <button onClick={onRemoveInStock}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* On Sale */}
      {filters.onSale && (
        <Badge variant="secondary" className="gap-1">
          On Sale
          <button onClick={onRemoveOnSale}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Rating */}
      {filters.rating !== null && (
        <Badge variant="secondary" className="gap-1">
          {filters.rating}+ Stars
          <button onClick={onRemoveRating}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Attributes */}
      {Object.entries(filters.attributes).map(([name, values]) =>
        values.map(value => (
          <Badge key={`${name}-${value}`} variant="secondary" className="gap-1">
            {name}: {value}
            <button onClick={() => onRemoveAttribute(name, value)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))
      )}

      {/* Tags */}
      {filters.tags.map(tag => (
        <Badge key={tag} variant="secondary" className="gap-1">
          #{tag}
          <button onClick={() => onRemoveTag(tag)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Clear All */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-destructive hover:text-destructive"
      >
        Clear all
      </Button>
    </div>
  )
}
```

---

### Task 24.6: Create Filter Sidebar Block

**File**: `src/studio/blocks/ecommerce/filter-sidebar-block.tsx`
**Action**: Create

**Description**: Faceted filter sidebar for products

```typescript
/**
 * FilterSidebarBlock - Product filter sidebar
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Faceted filtering for product listings.
 */
'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useStorefrontCategories } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { useProductFilters, type FilterResult } from '@/modules/ecommerce/hooks/useProductFilters'
import { ActiveFilters } from '@/studio/components/ecommerce/ActiveFilters'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface FilterSidebarBlockProps extends StudioBlockProps {
  // Display
  variant?: ResponsiveValue<'sidebar' | 'drawer' | 'horizontal'>
  collapsible?: boolean
  defaultExpanded?: boolean
  
  // Filters to show
  showCategories?: boolean
  showBrands?: boolean
  showPriceRange?: boolean
  showAvailability?: boolean
  showRating?: boolean
  showOnSale?: boolean
  
  // Price
  minPrice?: number
  maxPrice?: number
  priceStep?: number
  
  // Brands (if not loading dynamically)
  brands?: string[]
  
  // Callbacks
  onFilterChange?: (filters: FilterResult['filters']) => void
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// FILTER SECTION COMPONENT
// ============================================================================

interface FilterSectionProps {
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}

function FilterSection({ title, collapsible = true, defaultOpen = true, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <div className="py-4">
        <h3 className="font-medium mb-3">{title}</h3>
        {children}
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4">
        <h3 className="font-medium">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FilterSidebarBlock({
  variant = 'sidebar',
  collapsible = true,
  defaultExpanded = true,
  showCategories = true,
  showBrands = true,
  showPriceRange = true,
  showAvailability = true,
  showRating = true,
  showOnSale = true,
  minPrice = 0,
  maxPrice = 10000,
  priceStep = 100,
  brands: propBrands,
  onFilterChange,
  className,
  __studioMeta
}: FilterSidebarBlockProps) {
  const { siteId, formatPrice } = useStorefront()
  const { categories } = useStorefrontCategories(siteId)
  const filterResult = useProductFilters()
  const { filters } = filterResult

  const variantValue = getResponsiveValue(variant, 'sidebar')

  // Sample brands (would come from API in production)
  const brands = propBrands || ['Apple', 'Samsung', 'Sony', 'LG', 'Nike', 'Adidas']

  // Handle price range change
  const handlePriceRangeChange = (values: number[]) => {
    filterResult.setPriceRange({
      min: values[0] || null,
      max: values[1] || null
    })
  }

  // Category labels for active filters
  const categoryLabels = Object.fromEntries(
    categories.map(c => [c.id, c.name])
  )

  // Horizontal layout
  if (variantValue === 'horizontal') {
    return (
      <div className={cn('flex flex-wrap items-center gap-4 py-4', className)}>
        {/* Categories dropdown would go here */}
        {/* Simplified for horizontal layout */}
        <ActiveFilters
          filters={filters}
          categoryLabels={categoryLabels}
          formatPrice={formatPrice}
          onRemoveCategory={(id) => filterResult.setCategory(id, false)}
          onRemoveBrand={(b) => filterResult.setBrand(b, false)}
          onRemovePriceRange={() => filterResult.setPriceRange({ min: null, max: null })}
          onRemoveInStock={() => filterResult.setInStock(null)}
          onRemoveOnSale={() => filterResult.setOnSale(null)}
          onRemoveRating={() => filterResult.setRating(null)}
          onRemoveAttribute={(n, v) => filterResult.setAttribute(n, v, false)}
          onRemoveTag={(t) => filterResult.setTag(t, false)}
          onClearAll={filterResult.clearFilters}
        />
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        {filterResult.activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={filterResult.clearFilters}
            className="text-destructive"
          >
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Categories */}
      {showCategories && categories.length > 0 && (
        <>
          <FilterSection title="Categories" collapsible={collapsible} defaultOpen={defaultExpanded}>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.filter(c => !c.parent_id).map(category => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) => 
                      filterResult.setCategory(category.id, !!checked)
                    }
                  />
                  <Label 
                    htmlFor={`cat-${category.id}`} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {category.name}
                  </Label>
                  {category.product_count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({category.product_count})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Price Range */}
      {showPriceRange && (
        <>
          <FilterSection title="Price" collapsible={collapsible} defaultOpen={defaultExpanded}>
            <div className="space-y-4">
              <Slider
                value={[
                  filters.priceRange.min ?? minPrice,
                  filters.priceRange.max ?? maxPrice
                ]}
                min={minPrice}
                max={maxPrice}
                step={priceStep}
                onValueChange={handlePriceRangeChange}
                className="my-6"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min ?? ''}
                  onChange={(e) => filterResult.setPriceRange({
                    ...filters.priceRange,
                    min: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-24"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max ?? ''}
                  onChange={(e) => filterResult.setPriceRange({
                    ...filters.priceRange,
                    max: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-24"
                />
              </div>
            </div>
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Brands */}
      {showBrands && brands.length > 0 && (
        <>
          <FilterSection title="Brand" collapsible={collapsible} defaultOpen={defaultExpanded}>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map(brand => (
                <div key={brand} className="flex items-center gap-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={filters.brands.includes(brand)}
                    onCheckedChange={(checked) => 
                      filterResult.setBrand(brand, !!checked)
                    }
                  />
                  <Label 
                    htmlFor={`brand-${brand}`} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Availability */}
      {showAvailability && (
        <>
          <FilterSection title="Availability" collapsible={collapsible} defaultOpen={defaultExpanded}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="in-stock"
                  checked={filters.inStock === true}
                  onCheckedChange={(checked) => 
                    filterResult.setInStock(checked ? true : null)
                  }
                />
                <Label htmlFor="in-stock" className="cursor-pointer text-sm">
                  In Stock
                </Label>
              </div>
            </div>
          </FilterSection>
          <Separator />
        </>
      )}

      {/* On Sale */}
      {showOnSale && (
        <>
          <FilterSection title="Deals" collapsible={collapsible} defaultOpen={defaultExpanded}>
            <div className="flex items-center gap-2">
              <Checkbox
                id="on-sale"
                checked={filters.onSale === true}
                onCheckedChange={(checked) => 
                  filterResult.setOnSale(checked ? true : null)
                }
              />
              <Label htmlFor="on-sale" className="cursor-pointer text-sm">
                On Sale
              </Label>
            </div>
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Rating */}
      {showRating && (
        <FilterSection title="Rating" collapsible={collapsible} defaultOpen={defaultExpanded}>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.rating === rating}
                  onCheckedChange={(checked) => 
                    filterResult.setRating(checked ? rating : null)
                  }
                />
                <Label 
                  htmlFor={`rating-${rating}`} 
                  className="flex items-center gap-1 cursor-pointer"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                  <span className="text-sm ml-1">& Up</span>
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Apply Button (for drawer variant) */}
      {variantValue === 'drawer' && (
        <div className="pt-4">
          <Button onClick={filterResult.applyFilters} className="w-full">
            Apply Filters
            {filterResult.activeFilterCount > 0 && (
              <span className="ml-2">({filterResult.activeFilterCount})</span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const filterSidebarBlockConfig = {
  type: 'filter-sidebar',
  label: 'Filter Sidebar',
  category: 'e-commerce',
  icon: 'SlidersHorizontal',
  defaultProps: {
    variant: 'sidebar',
    collapsible: true,
    defaultExpanded: true,
    showCategories: true,
    showBrands: true,
    showPriceRange: true,
    showAvailability: true,
    showRating: true,
    showOnSale: true,
    minPrice: 0,
    maxPrice: 10000,
    priceStep: 100
  },
  fields: [
    {
      name: 'variant',
      label: 'Layout',
      type: 'select',
      options: [
        { value: 'sidebar', label: 'Sidebar' },
        { value: 'drawer', label: 'Drawer' },
        { value: 'horizontal', label: 'Horizontal' }
      ],
      responsive: true
    },
    {
      name: 'collapsible',
      label: 'Collapsible Sections',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showCategories',
      label: 'Show Categories',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showBrands',
      label: 'Show Brands',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showPriceRange',
      label: 'Show Price Range',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showAvailability',
      label: 'Show Availability',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showRating',
      label: 'Show Rating Filter',
      type: 'toggle',
      defaultValue: true
    }
  ],
  ai: {
    suggestable: true,
    description: 'Product filter sidebar with faceted search',
    contextHints: ['filters', 'refine', 'narrow down', 'faceted']
  }
}
```

---

### Task 24.7: Create Breadcrumb Block

**File**: `src/studio/blocks/ecommerce/breadcrumb-block.tsx`
**Action**: Create

**Description**: Navigation breadcrumbs for e-commerce

```typescript
/**
 * BreadcrumbBlock - Navigation breadcrumbs
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Displays navigation trail for current page.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronRight, Home } from 'lucide-react'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbBlockProps extends StudioBlockProps {
  // Items
  items?: BreadcrumbItem[]
  autoGenerate?: boolean
  
  // Display
  showHome?: boolean
  homeLabel?: string
  homeHref?: string
  separator?: 'chevron' | 'slash' | 'arrow'
  variant?: ResponsiveValue<'default' | 'compact'>
  
  // Current page
  currentLabel?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// Generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    
    // Format label (capitalize, replace dashes)
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    breadcrumbs.push({ label, href: path })
  }

  // Remove href from last item (current page)
  if (breadcrumbs.length > 0) {
    delete breadcrumbs[breadcrumbs.length - 1].href
  }

  return breadcrumbs
}

// ============================================================================
// SEPARATOR COMPONENTS
// ============================================================================

const separators = {
  chevron: <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />,
  slash: <span className="text-muted-foreground mx-2">/</span>,
  arrow: <span className="text-muted-foreground mx-2">→</span>
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BreadcrumbBlock({
  items: propItems,
  autoGenerate = true,
  showHome = true,
  homeLabel = 'Home',
  homeHref = '/',
  separator = 'chevron',
  variant = 'default',
  currentLabel,
  className,
  __studioMeta
}: BreadcrumbBlockProps) {
  const pathname = usePathname()
  const variantValue = getResponsiveValue(variant, 'default')

  // Get breadcrumb items
  const items = React.useMemo(() => {
    if (propItems && propItems.length > 0) {
      return propItems
    }

    if (autoGenerate && pathname) {
      const generated = generateBreadcrumbs(pathname)
      
      // Override current page label if provided
      if (currentLabel && generated.length > 0) {
        generated[generated.length - 1].label = currentLabel
      }

      return generated
    }

    return []
  }, [propItems, autoGenerate, pathname, currentLabel])

  // Build full breadcrumb list with home
  const fullItems = React.useMemo(() => {
    if (showHome) {
      return [{ label: homeLabel, href: homeHref }, ...items]
    }
    return items
  }, [showHome, homeLabel, homeHref, items])

  if (fullItems.length === 0) return null

  const SeparatorElement = separators[separator]

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn(
        'flex items-center flex-wrap',
        variantValue === 'compact' && 'text-sm'
      )}>
        {fullItems.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === fullItems.length - 1
          const isHome = isFirst && showHome

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {!isFirst && SeparatorElement}

              {/* Item */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 hover:text-primary transition-colors',
                    'text-muted-foreground hover:underline'
                  )}
                >
                  {isHome && <Home className="h-4 w-4" />}
                  <span className={cn(isHome && variantValue === 'compact' && 'sr-only')}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className={cn(
                  'flex items-center gap-1',
                  isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                  {isHome && <Home className="h-4 w-4" />}
                  <span className={cn(isHome && variantValue === 'compact' && 'sr-only')}>
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const breadcrumbBlockConfig = {
  type: 'breadcrumb',
  label: 'Breadcrumbs',
  category: 'navigation',
  icon: 'ChevronRight',
  defaultProps: {
    autoGenerate: true,
    showHome: true,
    homeLabel: 'Home',
    homeHref: '/',
    separator: 'chevron',
    variant: 'default'
  },
  fields: [
    {
      name: 'autoGenerate',
      label: 'Auto Generate from URL',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'showHome',
      label: 'Show Home Link',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'homeLabel',
      label: 'Home Label',
      type: 'text',
      defaultValue: 'Home'
    },
    {
      name: 'separator',
      label: 'Separator Style',
      type: 'select',
      options: [
        { value: 'chevron', label: 'Chevron (>)' },
        { value: 'slash', label: 'Slash (/)' },
        { value: 'arrow', label: 'Arrow (→)' }
      ]
    },
    {
      name: 'variant',
      label: 'Size',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'compact', label: 'Compact' }
      ],
      responsive: true
    },
    {
      name: 'currentLabel',
      label: 'Current Page Label',
      type: 'text',
      description: 'Override auto-generated current page name'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Navigation breadcrumb trail',
    contextHints: ['breadcrumbs', 'navigation', 'path', 'trail']
  }
}
```

---

### Task 24.8: Create Product Sort Block

**File**: `src/studio/blocks/ecommerce/product-sort-block.tsx`
**Action**: Create

**Description**: Product sort dropdown

```typescript
/**
 * ProductSortBlock - Product sorting dropdown
 * 
 * Phase ECOM-24: Navigation & Discovery
 * 
 * Dropdown for sorting product listings.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpDown, Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS, type SortOption } from '@/modules/ecommerce/hooks/useProductFilters'
import type { ResponsiveValue } from '@/types/studio'
import type { StudioBlockProps } from '@/types/studio'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductSortBlockProps extends StudioBlockProps {
  // State
  value?: string
  onChange?: (value: string) => void
  
  // Display
  variant?: ResponsiveValue<'select' | 'dropdown' | 'buttons'>
  showLabel?: boolean
  label?: string
  
  // Options
  options?: SortOption[]
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return value.desktop ?? value.tablet ?? value.mobile ?? defaultValue
  }
  return value as T
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductSortBlock({
  value = 'featured',
  onChange,
  variant = 'select',
  showLabel = true,
  label = 'Sort by',
  options = SORT_OPTIONS,
  className,
  __studioMeta
}: ProductSortBlockProps) {
  const variantValue = getResponsiveValue(variant, 'select')
  const selectedOption = options.find(o => o.value === value) || options[0]

  const handleChange = (newValue: string) => {
    onChange?.(newValue)
  }

  // Buttons variant
  if (variantValue === 'buttons') {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground">{label}:</span>
        )}
        {options.map(option => (
          <Button
            key={option.value}
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    )
  }

  // Dropdown variant
  if (variantValue === 'dropdown') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground">{label}:</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {selectedOption.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {options.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleChange(option.value)}
                className="flex items-center justify-between"
              >
                {option.label}
                {value === option.value && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Default select variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{label}:</span>
      )}
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ============================================================================
// STUDIO REGISTRATION
// ============================================================================

export const productSortBlockConfig = {
  type: 'product-sort',
  label: 'Product Sort',
  category: 'e-commerce',
  icon: 'ArrowUpDown',
  defaultProps: {
    value: 'featured',
    variant: 'select',
    showLabel: true,
    label: 'Sort by'
  },
  fields: [
    {
      name: 'variant',
      label: 'Style',
      type: 'select',
      options: [
        { value: 'select', label: 'Select Dropdown' },
        { value: 'dropdown', label: 'Button Dropdown' },
        { value: 'buttons', label: 'Button Group' }
      ],
      responsive: true
    },
    {
      name: 'showLabel',
      label: 'Show Label',
      type: 'toggle',
      defaultValue: true
    },
    {
      name: 'label',
      label: 'Label Text',
      type: 'text',
      defaultValue: 'Sort by'
    }
  ],
  ai: {
    suggestable: true,
    description: 'Product sorting dropdown',
    contextHints: ['sort', 'order', 'arrange', 'sorting']
  }
}
```

---

### Task 24.9: Update Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

Add filter hook export:

```typescript
export { useProductFilters, SORT_OPTIONS } from './useProductFilters'
export type { FilterState, PriceRange, SortOption, FilterResult } from './useProductFilters'
```

---

### Task 24.10: Update E-Commerce Blocks Index

**File**: `src/studio/blocks/ecommerce/index.ts`
**Action**: Modify

Add navigation block exports:

```typescript
// Navigation & Discovery Blocks (Phase ECOM-24)
export { CategoryNavBlock, categoryNavBlockConfig } from './category-nav-block'
export { SearchBarBlock, searchBarBlockConfig } from './search-bar-block'
export { FilterSidebarBlock, filterSidebarBlockConfig } from './filter-sidebar-block'
export { BreadcrumbBlock, breadcrumbBlockConfig } from './breadcrumb-block'
export { ProductSortBlock, productSortBlockConfig } from './product-sort-block'

// Navigation Utility Components
export { CategoryCard } from '@/studio/components/ecommerce/CategoryCard'
export { ActiveFilters } from '@/studio/components/ecommerce/ActiveFilters'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] `useProductFilters` hook manages filter state
- [ ] `CategoryNavBlock` displays categories (all variants)
- [ ] `SearchBarBlock` shows suggestions
- [ ] `FilterSidebarBlock` filters work
- [ ] `BreadcrumbBlock` generates from URL
- [ ] `ProductSortBlock` changes sort order
- [ ] URL sync works when filters change
- [ ] All components integrate with data hooks

---

## 🔄 Rollback Plan

If issues occur:
1. Remove filter hook: `rm src/modules/ecommerce/hooks/useProductFilters.ts`
2. Remove navigation blocks from `studio/blocks/ecommerce/`
3. Remove navigation components from `studio/components/ecommerce/`
4. Revert index.ts changes
5. Run `npx tsc --noEmit` to verify

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add "✅ PHASE-ECOM-24: Navigation & Discovery Complete"
- `progress.md`: Update e-commerce section with Wave 3 progress

---

## ✨ Success Criteria

- [ ] Category navigation displays tree correctly
- [ ] Search autocomplete shows products
- [ ] Filters update product listings
- [ ] Breadcrumbs show navigation trail
- [ ] Sort changes product order
- [ ] Filter state syncs to URL
- [ ] All 5 navigation blocks work
- [ ] TypeScript compiles with zero errors
