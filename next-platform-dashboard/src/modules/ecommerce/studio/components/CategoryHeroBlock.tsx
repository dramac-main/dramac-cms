/**
 * CategoryHeroBlock - Category hero/banner component
 * 
 * Phase ECOM-51: Dynamic Route Components
 * 
 * Renders a hero section for category pages with the category name,
 * description, image, and product count. Reads the category slug
 * from the URL and fetches real data.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Grid3X3, AlertCircle } from 'lucide-react'
import { getPublicCategories } from '../../actions/public-ecommerce-actions'
import { getPublicProducts } from '../../actions/public-ecommerce-actions'
import { useStorefront } from '../../context/storefront-context'
import type { Category } from '../../types/ecommerce-types'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

interface CategoryHeroBlockProps {
  siteId?: string
  _siteId?: string | null
  categorySlug?: string
  showImage?: boolean
  showDescription?: boolean
  showProductCount?: boolean
  overlayOpacity?: number
  minHeight?: string
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function getCategorySlugFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const parts = window.location.pathname.split('/')
  // URL: /categories/[slug] → last segment
  return parts[parts.length - 1] || ''
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategoryHeroBlock({
  siteId,
  _siteId,
  categorySlug,
  showImage = true,
  showDescription = true,
  showProductCount = true,
  overlayOpacity = 0.5,
  minHeight = '200px',
  className,
}: CategoryHeroBlockProps) {
  const storefront = useStorefront()
  const effectiveSiteId = _siteId || siteId || storefront?.siteId || ''
  const slug = categorySlug || getCategorySlugFromUrl()

  const [category, setCategory] = useState<Category | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!effectiveSiteId || !slug) {
      setIsLoading(false)
      return
    }

    async function fetchCategory() {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch all categories and find by slug
        const categories = await getPublicCategories(effectiveSiteId)
        const found = categories.find(c => c.slug === slug)
        
        if (!found) {
          setError('Category not found')
          setCategory(null)
          setIsLoading(false)
          return
        }

        setCategory(found)

        // Fetch product count for this category
        if (showProductCount) {
          try {
            const productsResult = await getPublicProducts(effectiveSiteId, {
              categoryId: found.id,
              status: 'active',
            }, 1, 1)
            setProductCount(productsResult.total || 0)
          } catch {
            setProductCount(0)
          }
        }
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Failed to load category')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategory()
  }, [effectiveSiteId, slug, showProductCount])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)} style={{ minHeight }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error / not found
  if (error || !category) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)} style={{ minHeight }}>
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Category Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">{error || 'This category may have been removed.'}</p>
      </div>
    )
  }

  const hasImage = showImage && category.image_url

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        hasImage ? 'text-white' : 'bg-gradient-to-r from-gray-100 to-gray-50',
        className
      )}
      style={{ minHeight }}
    >
      {/* Background image */}
      {hasImage && (
        <>
          <img
            src={category.image_url!}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-8" style={{ minHeight }}>
        <h1 className={cn(
          'text-3xl md:text-4xl font-bold',
          !hasImage && 'text-gray-900'
        )}>
          {category.name}
        </h1>

        {showDescription && category.description && (
          <p className={cn(
            'mt-3 max-w-2xl text-lg',
            hasImage ? 'text-white/90' : 'text-gray-600'
          )}>
            {category.description}
          </p>
        )}

        {showProductCount && (
          <div className={cn(
            'mt-4 flex items-center gap-2 text-sm font-medium',
            hasImage ? 'text-white/80' : 'text-gray-500'
          )}>
            <Grid3X3 className="h-4 w-4" />
            <span>{productCount} {productCount === 1 ? 'product' : 'products'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// DEFINITION
// =============================================================================

export const categoryHeroDefinition: ComponentDefinition = {
  type: 'CategoryHeroBlock',
  label: 'Category Hero',
  description: 'Hero banner for category pages with name, description, image, and product count',
  category: 'ecommerce',
  icon: 'Image',
  defaultProps: {
    showImage: true,
    showDescription: true,
    showProductCount: true,
    overlayOpacity: 0.5,
    minHeight: '200px',
  },
  fields: {
    showImage: { type: 'boolean', label: 'Show Image', description: 'Display category image as background' },
    showDescription: { type: 'boolean', label: 'Show Description', description: 'Display category description' },
    showProductCount: { type: 'boolean', label: 'Show Product Count', description: 'Display number of products' },
    overlayOpacity: {
      type: 'number',
      label: 'Overlay Opacity',
      description: 'Darkness of the image overlay (0-1)',
    },
    minHeight: {
      type: 'text',
      label: 'Minimum Height',
      description: 'Minimum height of the hero section',
    },
  },
}
