"use client"

/**
 * E-Commerce Filter Bar Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Search, filter, and sort controls with active filter badges
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3X3,
  List,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { ProductStatus, OrderStatus } from "../../types/ecommerce-types"

// =============================================================================
// TYPES
// =============================================================================

export interface EcommerceFilterBarProps {
  /** Current search query */
  searchQuery: string
  /** Search change handler */
  onSearchChange: (query: string) => void
  /** Current status filter */
  statusFilter?: ProductStatus | OrderStatus | 'all'
  /** Status filter change handler */
  onStatusChange?: (status: string) => void
  /** Available status options */
  statusOptions?: { value: string; label: string }[]
  /** Current category filter */
  categoryFilter?: string
  /** Category filter change handler */
  onCategoryChange?: (category: string) => void
  /** Available categories */
  categories?: { id: string; name: string }[]
  /** Current sort option */
  sortBy?: string
  /** Sort change handler */
  onSortChange?: (sort: string) => void
  /** Available sort options */
  sortOptions?: { value: string; label: string }[]
  /** Current view mode */
  viewMode?: 'grid' | 'list'
  /** View mode change handler */
  onViewModeChange?: (mode: 'grid' | 'list') => void
  /** Show view toggle */
  showViewToggle?: boolean
  /** Additional filters */
  additionalFilters?: React.ReactNode
  /** Placeholder text */
  placeholder?: string
  /** Additional class names */
  className?: string
}

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const defaultProductStatuses: { value: string; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const defaultOrderStatuses: { value: string; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const defaultSortOptions: { value: string; label: string }[] = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
]

// =============================================================================
// DEBOUNCE HOOK
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// ACTIVE FILTERS
// =============================================================================

interface ActiveFilter {
  key: string
  label: string
  value: string
  displayValue: string
}

function ActiveFilterBadges({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ActiveFilter[]
  onRemove: (key: string) => void
  onClearAll: () => void
}) {
  if (filters.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-wrap items-center gap-2 mt-3"
    >
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="font-normal text-muted-foreground">{filter.label}:</span>
          <span>{filter.displayValue}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 p-0.5 hover:bg-muted rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 text-xs"
      >
        Clear all
      </Button>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EcommerceFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
  statusOptions = defaultProductStatuses,
  categoryFilter,
  onCategoryChange,
  categories = [],
  sortBy = 'created_desc',
  onSortChange,
  sortOptions = defaultSortOptions,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  additionalFilters,
  placeholder = 'Search products...',
  className,
}: EcommerceFilterBarProps) {
  const [localSearch, setLocalSearch] = React.useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)

  // Sync debounced search with parent
  React.useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchQuery, onSearchChange])

  // Build active filters list
  const activeFilters: ActiveFilter[] = React.useMemo(() => {
    const filters: ActiveFilter[] = []
    
    if (statusFilter && statusFilter !== 'all') {
      const option = statusOptions.find(o => o.value === statusFilter)
      filters.push({
        key: 'status',
        label: 'Status',
        value: statusFilter,
        displayValue: option?.label || statusFilter,
      })
    }

    if (categoryFilter && categoryFilter !== 'all') {
      const category = categories.find(c => c.id === categoryFilter)
      filters.push({
        key: 'category',
        label: 'Category',
        value: categoryFilter,
        displayValue: category?.name || categoryFilter,
      })
    }

    if (localSearch) {
      filters.push({
        key: 'search',
        label: 'Search',
        value: localSearch,
        displayValue: localSearch,
      })
    }

    return filters
  }, [statusFilter, categoryFilter, localSearch, statusOptions, categories])

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'status':
        onStatusChange?.('all')
        break
      case 'category':
        onCategoryChange?.('all')
        break
      case 'search':
        setLocalSearch('')
        break
    }
  }

  const handleClearAll = () => {
    setLocalSearch('')
    onStatusChange?.('all')
    onCategoryChange?.('all')
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        {onStatusChange && (
          <Select value={statusFilter as string} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Category Filter */}
        {onCategoryChange && categories.length > 0 && (
          <Select value={categoryFilter || 'all'} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        {onSortChange && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Additional Filters */}
        {additionalFilters}

        {/* View Toggle */}
        {showViewToggle && onViewModeChange && (
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <ActiveFilterBadges
            filters={activeFilters}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAll}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// PRESET FILTER BARS
// =============================================================================

export function ProductFilterBar(
  props: Omit<EcommerceFilterBarProps, 'statusOptions' | 'placeholder'>
) {
  return (
    <EcommerceFilterBar
      {...props}
      statusOptions={defaultProductStatuses}
      placeholder="Search products by name, SKU..."
    />
  )
}

export function OrderFilterBar(
  props: Omit<EcommerceFilterBarProps, 'statusOptions' | 'placeholder' | 'showViewToggle'>
) {
  return (
    <EcommerceFilterBar
      {...props}
      statusOptions={defaultOrderStatuses}
      placeholder="Search orders by number, email..."
      showViewToggle={false}
    />
  )
}
