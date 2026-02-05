/**
 * useStorefrontProduct - Single product hook
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Fetches a single product by ID or slug with variants and related products.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getProduct, 
  getProductBySlug, 
  getProductVariants, 
  getProductOptions,
  getProducts 
} from '../actions/ecommerce-actions'
import type { 
  Product, 
  ProductVariant, 
  ProductOption,
  StorefrontProductResult 
} from '../types/ecommerce-types'

export function useStorefrontProduct(
  siteId: string,
  idOrSlug: string
): StorefrontProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!siteId || !idOrSlug) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Determine if idOrSlug is a UUID or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
      
      let productData: Product | null = null
      
      if (isUUID) {
        productData = await getProduct(siteId, idOrSlug)
      } else {
        productData = await getProductBySlug(siteId, idOrSlug)
      }

      if (!productData) {
        setError('Product not found')
        setProduct(null)
        return
      }

      // Only show active products on storefront
      if (productData.status !== 'active') {
        setError('Product not available')
        setProduct(null)
        return
      }

      setProduct(productData)

      // Fetch variants and options in parallel
      const [variantsData, optionsData] = await Promise.all([
        getProductVariants(productData.id).catch(() => []),
        getProductOptions(productData.id).catch(() => [])
      ])

      setVariants(variantsData.filter(v => v.is_active))
      setOptions(optionsData)

      // Fetch related products (same category, excluding this product)
      try {
        const relatedResult = await getProducts(siteId, {
          status: 'active'
        }, 1, 8)
        
        // Filter out current product and limit to 4
        const related = relatedResult.data
          .filter(p => p.id !== productData.id && p.status === 'active')
          .slice(0, 4)
        
        setRelatedProducts(related)
      } catch {
        // Non-critical, don't fail the whole request
        setRelatedProducts([])
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err instanceof Error ? err.message : 'Failed to load product')
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }, [siteId, idOrSlug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    variants,
    options,
    relatedProducts,
    isLoading,
    error,
    refetch: fetchProduct
  }
}
