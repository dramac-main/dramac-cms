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
      if (typeof filterValue === 'string') {
        return filterValue === value
      }
      return false
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
