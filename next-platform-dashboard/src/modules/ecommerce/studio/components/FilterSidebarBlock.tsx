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
import { ChevronDown, ChevronUp, Star } from 'lucide-react'
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
import { ActiveFilters } from './ActiveFilters'
import type { Category } from '@/modules/ecommerce/types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface FilterSidebarBlockProps {
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
  
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object' && 'desktop' in value) {
    return (value as { mobile?: T; tablet?: T; desktop?: T }).desktop ?? 
           (value as { mobile?: T; tablet?: T; desktop?: T }).tablet ?? 
           (value as { mobile?: T; tablet?: T; desktop?: T }).mobile ?? 
           defaultValue
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
  className
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
    categories.map((c: Category) => [c.id, c.name])
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
              {categories.filter((c: Category) => !c.parent_id).map(category => (
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
