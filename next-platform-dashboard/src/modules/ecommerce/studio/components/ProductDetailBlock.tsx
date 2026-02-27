/**
 * ProductDetailBlock - Full product detail page component
 * 
 * Phase ECOM-51: Dynamic Route Components
 * 
 * Renders a complete product detail page with image gallery,
 * pricing, variants, quantity selector, add to cart, and reviews.
 * Reads the product slug from the URL and fetches real data.
 */
'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  ShoppingCart, Heart, Share2, Minus, Plus,
  Star, StarHalf, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Package, Truck, Shield,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStorefrontProduct } from '../../hooks/useStorefrontProduct'
import { useStorefrontCart } from '../../hooks/useStorefrontCart'
import { useStorefront } from '../../context/storefront-context'
import type { ComponentDefinition } from '@/types/studio'

// =============================================================================
// TYPES
// =============================================================================

interface ProductDetailBlockProps {
  siteId?: string
  _siteId?: string | null
  productSlug?: string
  showGallery?: boolean
  showVariants?: boolean
  showQuantity?: boolean
  showAddToCart?: boolean
  showWishlist?: boolean
  showShare?: boolean
  showDescription?: boolean
  showSpecifications?: boolean
  showReviews?: boolean
  galleryPosition?: 'left' | 'right'
  stickyAddToCart?: boolean
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function getSlugFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const parts = window.location.pathname.split('/')
  // URL: /products/[slug] → last segment
  return parts[parts.length - 1] || ''
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) return <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          if (i === fullStars && hasHalf) return <StarHalf key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          return <Star key={i} className="h-4 w-4 text-gray-300" />
        })}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductDetailBlock({
  siteId,
  _siteId,
  productSlug,
  showGallery = true,
  showVariants = true,
  showQuantity = true,
  showAddToCart = true,
  showWishlist = true,
  showShare = false,
  showDescription = true,
  showSpecifications = true,
  showReviews = true,
  galleryPosition = 'left',
  stickyAddToCart = false,
  className,
}: ProductDetailBlockProps) {
  const storefront = useStorefront()
  const effectiveSiteId = _siteId || siteId || storefront?.siteId || ''
  const slug = productSlug || getSlugFromUrl()

  const {
    product,
    variants,
    options,
    relatedProducts,
    isLoading,
    error,
  } = useStorefrontProduct(effectiveSiteId, slug)

  const { addItem, isUpdating: isAddingToCart } = useStorefrontCart(effectiveSiteId)

  // Quote mode
  const quotationModeEnabled = storefront?.quotationModeEnabled ?? false
  const quotationButtonLabel = storefront?.quotationButtonLabel || 'Request a Quote'
  const quotationHidePrices = storefront?.quotationHidePrices ?? false
  const quotationRedirectUrl = storefront?.quotationRedirectUrl || '/quotes'

  // Gallery state
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Computed values
  const images = product?.images?.length ? product.images : ['/placeholder-product.png']
  const hasDiscount = product?.compare_at_price && product.compare_at_price > product.base_price
  const discountPercent = hasDiscount
    ? Math.round(((product!.compare_at_price! - product!.base_price) / product!.compare_at_price!) * 100)
    : 0
  const isInStock = product ? (product.track_inventory ? product.quantity > 0 : true) : false
  const isLowStock = product?.track_inventory && product.quantity > 0 && product.quantity <= (product.low_stock_threshold || 10)

  const handleAddToCart = async () => {
    if (!product) return
    if (quotationModeEnabled) {
      // Redirect to quote page
      window.location.href = `${quotationRedirectUrl}?product=${product.id}`
      return
    }
    await addItem(product.id, selectedVariant || null, quantity)
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('py-16', className)}>
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading product...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error / not found
  if (error || !product) {
    return (
      <div className={cn('py-16', className)}>
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This product may have been removed or is no longer available.'}</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  const isSupabaseImage = (url: string) => url?.includes('.supabase.co/') || url?.includes('unsplash.com');

  const galleryContent = showGallery && (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border">
        {isSupabaseImage(images[selectedImage]) ? (
          <Image
            src={images[selectedImage]}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <img
            src={images[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="eager"
          />
        )}
        {hasDiscount && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-1">
            -{discountPercent}%
          </Badge>
        )}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">Out of Stock</Badge>
          </div>
        )}
        {/* Gallery nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-all hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSelectedImage(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-all hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(i)}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                selectedImage === i 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
              )}
            >
              {isSupabaseImage(img) ? (
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const infoContent = (
    <div className={cn('space-y-6', stickyAddToCart && 'lg:sticky lg:top-24')}>
      {/* Product name */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
        {product.sku && (
          <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
        )}
      </div>

      {/* Rating */}
      {showReviews && (product as any).average_rating > 0 && (
        <RatingStars
          rating={(product as any).average_rating || 0}
          count={(product as any).review_count || 0}
        />
      )}

      {/* Price */}
      {!quotationHidePrices && (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">
            {storefront.formatPrice(product.base_price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {storefront.formatPrice(product.compare_at_price!)}
              </span>
              <Badge variant="destructive">Save {discountPercent}%</Badge>
            </>
          )}
        </div>
      )}

      {/* Short description */}
      {product.short_description && (
        <p className="text-muted-foreground">{product.short_description}</p>
      )}

      {/* Stock status */}
      <div className="flex items-center gap-2">
        {isInStock ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              {isLowStock ? `Only ${product.quantity} left in stock` : 'In Stock'}
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500 font-medium">Out of Stock</span>
          </>
        )}
      </div>

      {/* Variants */}
      {showVariants && variants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Options</h3>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={cn(
                  'px-4 py-2.5 min-h-[44px] border rounded-md text-sm transition-colors',
                  selectedVariant === v.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {Object.values(v.options || {}).join(' / ') || v.sku || v.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Quantity & Add to Cart */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showQuantity && (
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="px-4 py-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 min-w-[3rem] text-center font-medium border-x">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="px-4 py-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={product.track_inventory && quantity >= product.quantity}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        {showAddToCart && (
          <Button
            size="lg"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={!isInStock || isAddingToCart}
          >
            {isAddingToCart ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="h-5 w-5 mr-2" />
            )}
            {quotationModeEnabled ? quotationButtonLabel : 'Add to Cart'}
          </Button>
        )}

        {showWishlist && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart className={cn('h-5 w-5', isWishlisted && 'fill-red-500 text-red-500')} />
          </Button>
        )}

        {showShare && (
          <Button variant="outline" size="lg" onClick={handleShare}>
            {linkCopied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="flex flex-col items-center text-center gap-1">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Free Shipping</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Secure Payment</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Easy Returns</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('py-8 md:py-12', className)}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Product Grid — gallery + info */}
        <div className={cn(
          'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12',
          galleryPosition === 'right' && 'lg:[direction:rtl] [&>*]:lg:[direction:ltr]'
        )}>
          {galleryContent}
          {infoContent}
        </div>

        {/* Tabs — Description / Specs / Reviews */}
        {(showDescription || showSpecifications) && (
          <div className="mt-12">
            <Tabs defaultValue="description">
              <TabsList>
                {showDescription && <TabsTrigger value="description">Description</TabsTrigger>}
                {showSpecifications && <TabsTrigger value="specifications">Details</TabsTrigger>}
              </TabsList>
              {showDescription && (
                <TabsContent value="description" className="mt-6">
                  <div className="prose max-w-none">
                    {product.description || 'No description available.'}
                  </div>
                </TabsContent>
              )}
              {showSpecifications && (
                <TabsContent value="specifications" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.sku && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">SKU</span>
                        <span className="font-medium">{product.sku}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Weight</span>
                        <span className="font-medium">{product.weight} {product.weight_unit}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{(product as any).category_name || 'Uncategorized'}</span>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productDetailDefinition: Omit<ComponentDefinition, 'render'> = {
  type: 'ProductDetailBlock',
  label: 'Product Detail',
  description: 'Full product detail page with gallery, pricing, variants, and add to cart',
  category: 'ecommerce',
  icon: 'Package',
  defaultProps: {
    showGallery: true,
    showVariants: true,
    showQuantity: true,
    showAddToCart: true,
    showWishlist: true,
    showShare: false,
    showDescription: true,
    showSpecifications: true,
    showReviews: true,
    galleryPosition: 'left',
    stickyAddToCart: true,
  },
  fields: {
    showGallery: { type: 'toggle', label: 'Show Gallery', description: 'Display product image gallery' },
    showVariants: { type: 'toggle', label: 'Show Variants', description: 'Display product variant selector' },
    showQuantity: { type: 'toggle', label: 'Show Quantity', description: 'Display quantity selector' },
    showAddToCart: { type: 'toggle', label: 'Show Add to Cart', description: 'Display add to cart button' },
    showWishlist: { type: 'toggle', label: 'Show Wishlist', description: 'Display wishlist button' },
    showShare: { type: 'toggle', label: 'Show Share', description: 'Display share button' },
    showDescription: { type: 'toggle', label: 'Show Description', description: 'Display product description tab' },
    showSpecifications: { type: 'toggle', label: 'Show Details', description: 'Display product details tab' },
    showReviews: { type: 'toggle', label: 'Show Reviews', description: 'Display product reviews' },
    galleryPosition: {
      type: 'select',
      label: 'Gallery Position',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    stickyAddToCart: { type: 'toggle', label: 'Sticky Info Panel', description: 'Make product info sticky on scroll' },
  },
}
