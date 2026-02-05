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
import { useStorefrontSearch, useRecentlyViewed } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

export interface SearchBarBlockProps {
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
  className
}: SearchBarBlockProps) {
  const router = useRouter()
  const { siteId, formatPrice } = useStorefront()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [localQuery, setLocalQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  const { results, isSearching, setQuery: performSearch } = useStorefrontSearch(siteId || '')
  const { products: recentItems } = useRecentlyViewed(siteId || '')

  const variantValue = getResponsiveValue(variant, 'default')
  const showDropdown = isFocused && (localQuery.length >= minSearchLength || showRecentSearches)

  // Debounced search
  useEffect(() => {
    if (localQuery.length < minSearchLength) {
      performSearch('')
      return
    }

    const timeout = setTimeout(() => {
      performSearch(localQuery)
    }, debounceMs)

    return () => clearTimeout(timeout)
  }, [localQuery, minSearchLength, debounceMs, performSearch])

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localQuery.trim()) {
      router.push(`${searchUrl}?q=${encodeURIComponent(localQuery.trim())}`)
      setIsFocused(false)
    }
  }

  // Clear search
  const handleClear = () => {
    setLocalQuery('')
    performSearch('')
    inputRef.current?.focus()
  }

  // Handle item click
  const handleProductClick = () => {
    setIsFocused(false)
    setLocalQuery('')
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
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
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
            {localQuery && !isSearching && (
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
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
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
                      {formatPrice(product.compare_at_price && product.compare_at_price > product.base_price 
                        ? product.base_price 
                        : product.base_price)}
                    </p>
                  </div>
                </Link>
              ))}
              
              {results.length > maxSuggestions && (
                <Link
                  href={`${searchUrl}?q=${encodeURIComponent(localQuery)}`}
                  onClick={handleProductClick}
                  className="block p-2 text-center text-sm text-primary hover:underline"
                >
                  View all {results.length} results
                </Link>
              )}
            </div>
          )}

          {/* No Results */}
          {localQuery.length >= minSearchLength && !isSearching && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <p>No products found for &quot;{localQuery}&quot;</p>
            </div>
          )}

          {/* Trending Searches */}
          {showTrendingSearches && !localQuery && (
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
                      setLocalQuery(term)
                      performSearch(term)
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
          {showRecentSearches && !localQuery && recentItems.length > 0 && (
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
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
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
