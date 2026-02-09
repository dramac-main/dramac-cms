/**
 * useStorefrontProducts - Product listing hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Fetches products with filtering, sorting, and pagination support.
 */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPublicProducts, getPublicProductsByCategory } from '../actions/public-ecommerce-actions'
import type { 
  Product, 
  StorefrontProductsOptions, 
  StorefrontProductsResult 
} from '../types/ecommerce-types'

export function useStorefrontProducts(
  siteId: string,
  options: StorefrontProductsOptions = {}
): StorefrontProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    limit: options.limit || 12,
    hasNext: false,
    hasPrev: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize options to prevent unnecessary re-fetches
  const optionsKey = useMemo(() => JSON.stringify(options), [options])

  const fetchProducts = useCallback(async () => {
    if (!siteId) return

    setIsLoading(true)
    setError(null)

    try {
      const {
        categoryId,
        categorySlug,
        featured,
        search,
        minPrice,
        maxPrice,
        inStock,
        sortBy,
        limit = 12,
        page = 1
      } = options

      // Build filters for the action
      const filters: Record<string, unknown> = {}
      
      if (featured !== undefined) filters.featured = featured
      if (search) filters.search = search
      if (minPrice !== undefined) filters.minPrice = minPrice
      if (maxPrice !== undefined) filters.maxPrice = maxPrice
      if (inStock !== undefined) filters.inStock = inStock

      // Handle sorting
      if (sortBy) {
        switch (sortBy) {
          case 'price-asc':
            filters.sortBy = 'base_price'
            filters.sortOrder = 'asc'
            break
          case 'price-desc':
            filters.sortBy = 'base_price'
            filters.sortOrder = 'desc'
            break
          case 'newest':
            filters.sortBy = 'created_at'
            filters.sortOrder = 'desc'
            break
          case 'name':
            filters.sortBy = 'name'
            filters.sortOrder = 'asc'
            break
          case 'popularity':
            // Would need a popularity field
            filters.sortBy = 'created_at'
            filters.sortOrder = 'desc'
            break
        }
      }

      let result

      // Fetch by category or all products
      if (categoryId || categorySlug) {
        result = await getPublicProductsByCategory(
          siteId,
          categoryId || categorySlug || '',
          page,
          limit
        )
      } else {
        result = await getPublicProducts(siteId, filters, page, limit)
      }

      // Filter to only active products for storefront
      const activeProducts = result.data.filter(p => p.status === 'active')
      
      setProducts(activeProducts)
      setPagination({
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      })
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, optionsKey])

  // Fetch on mount and when options change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    pagination,
    isLoading,
    error,
    refetch: fetchProducts
  }
}
