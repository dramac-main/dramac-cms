/**
 * ProductImageGallery - Image gallery with thumbnails
 * 
 * Phase ECOM-21: Product Display Components
 * 
 * Displays product images with thumbnail navigation.
 */
'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ZoomIn, ImageOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductImage {
  url: string
  alt?: string
}

interface ProductImageGalleryProps {
  /** Array of images */
  images: ProductImage[]
  /** Product name for alt text fallback */
  productName?: string
  /** Layout style */
  layout?: 'stacked' | 'side-by-side' | 'thumbnails-bottom'
  /** Aspect ratio */
  aspectRatio?: 'square' | '4:3' | '3:4' | '16:9'
  /** Whether to show thumbnails */
  showThumbnails?: boolean
  /** Enable zoom on click */
  enableZoom?: boolean
  /** Additional class name */
  className?: string
}

const aspectRatioClasses = {
  'square': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '16:9': 'aspect-video'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductImageGallery({
  images,
  productName = 'Product',
  layout = 'thumbnails-bottom',
  aspectRatio = 'square',
  showThumbnails = true,
  enableZoom = true,
  className
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})

  const selectedImage = images[selectedIndex] || images[0]

  const goToNext = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % images.length)
  }, [images.length])

  const goToPrev = useCallback(() => {
    setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
  }, [images.length])

  if (!images.length) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <ImageOff className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Image */}
      <div className="relative group">
        <div className={cn('relative overflow-hidden rounded-lg bg-muted', aspectRatioClasses[aspectRatio])}>
          {imageError[selectedIndex] ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || productName}
              fill
              className="object-cover"
              onError={() => setImageError(prev => ({ ...prev, [selectedIndex]: true }))}
            />
          )}
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Zoom button */}
          {enableZoom && !imageError[selectedIndex] && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsZoomed(true)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors',
                selectedIndex === index 
                  ? 'border-primary' 
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
            >
              {imageError[index] ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <Image
                  src={image.url}
                  alt={image.alt || `${productName} ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => setImageError(prev => ({ ...prev, [index]: true }))}
                />
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Zoom Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Product Image Zoom</DialogTitle>
          <div className="relative aspect-square">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || productName}
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
