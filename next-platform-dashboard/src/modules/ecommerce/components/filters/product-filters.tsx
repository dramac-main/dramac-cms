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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import type { ProductTableFilters, Category } from '../../types/ecommerce-types'

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
