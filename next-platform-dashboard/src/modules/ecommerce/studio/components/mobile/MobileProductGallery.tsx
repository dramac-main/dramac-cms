/**
 * MobileProductGallery - Swipeable product image gallery
 * 
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Full-width image gallery with swipe navigation, pinch-to-zoom,
 * and dot indicators. Optimized for mobile viewing.
 */
'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, Expand, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useHapticFeedback } from '../../../hooks/useHapticFeedback'
import { usePrefersReducedMotion } from '../../../hooks/useMobile'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductImage {
  id: string
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface MobileProductGalleryProps {
  images: ProductImage[] | string[]
  productName: string
  aspectRatio?: 'square' | 'portrait' | '4:3'
  showIndicators?: boolean
  showZoomButton?: boolean
  enablePinchZoom?: boolean
  onImageClick?: (index: number) => void
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY = 500

// ============================================================================
// HELPERS
// ============================================================================

function normalizeImages(images: ProductImage[] | string[]): ProductImage[] {
  return images.map((img, index) => {
    if (typeof img === 'string') {
      return { id: `img-${index}`, url: img }
    }
    return img
  })
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileProductGallery({
  images: rawImages,
  productName,
  aspectRatio = 'square',
  showIndicators = true,
  showZoomButton = true,
  enablePinchZoom = true,
  onImageClick,
  className,
}: MobileProductGalleryProps) {
  const haptic = useHapticFeedback()
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // Normalize images
  const images = normalizeImages(rawImages || [])
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<number>(0)

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
  }

  // Navigate to specific image
  const goToImage = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return
    haptic.trigger('selection')
    setCurrentIndex(index)
    setZoomScale(1)
  }, [images.length, haptic])

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    goToImage(currentIndex > 0 ? currentIndex - 1 : images.length - 1)
  }, [currentIndex, images.length, goToImage])

  // Navigate to next image
  const goToNext = useCallback(() => {
    goToImage(currentIndex < images.length - 1 ? currentIndex + 1 : 0)
  }, [currentIndex, images.length, goToImage])

  // Handle drag end (swipe)
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isZoomed) return // Don't navigate when zoomed
      
      const { offset, velocity } = info

      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
        goToNext()
      } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
        goToPrevious()
      }
    },
    [isZoomed, goToNext, goToPrevious]
  )

  // Handle double tap to zoom
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      haptic.trigger('medium')
      if (isZoomed) {
        setZoomScale(1)
        setIsZoomed(false)
      } else {
        setZoomScale(2)
        setIsZoomed(true)
      }
    }
    lastTapRef.current = now
  }, [isZoomed, haptic])

  // Handle image click
  const handleImageClick = useCallback((index: number) => {
    handleDoubleTap()
    onImageClick?.(index)
  }, [handleDoubleTap, onImageClick])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    haptic.trigger('medium')
    setIsFullscreen((prev) => !prev)
    if (!isFullscreen) {
      setZoomScale(1)
      setIsZoomed(false)
    }
  }, [haptic, isFullscreen])

  // Handle pinch zoom (simplified - for production, use gesture library)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enablePinchZoom) return
      e.preventDefault()
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoomScale((prev) => {
        const newScale = Math.max(1, Math.min(3, prev + delta))
        setIsZoomed(newScale > 1)
        return newScale
      })
    },
    [enablePinchZoom]
  )

  // Reset zoom when changing images
  useEffect(() => {
    setZoomScale(1)
    setIsZoomed(false)
  }, [currentIndex])

  // Empty state
  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center',
          aspectClasses[aspectRatio],
          className
        )}
      >
        <span className="text-muted-foreground">No images</span>
      </div>
    )
  }

  return (
    <>
      {/* Main Gallery */}
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden bg-muted', className)}
      >
        {/* Image container */}
        <motion.div
          drag={!isZoomed ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={() => handleImageClick(currentIndex)}
          onWheel={handleWheel}
          className={cn(
            'relative',
            aspectClasses[aspectRatio],
            'touch-pan-y'
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
              style={{
                scale: zoomScale,
                transformOrigin: 'center center',
              }}
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt || `${productName} - Image ${currentIndex + 1}`}
                fill
                className={cn(
                  'object-contain',
                  zoomScale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                )}
                priority={currentIndex === 0}
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Zoom button */}
        {showZoomButton && (
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-10 min-h-[44px] min-w-[44px] bg-background/80 backdrop-blur-sm"
          >
            <Expand className="h-5 w-5" />
          </Button>
        )}

        {/* Image counter */}
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Dot indicators */}
        {showIndicators && images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  'min-h-[44px] min-w-[44px] -m-5', // Touch target expansion
                  'flex items-center justify-center'
                )}
                aria-label={`Go to image ${index + 1}`}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    index === currentIndex
                      ? 'bg-primary w-4'
                      : 'bg-primary/40 hover:bg-primary/60'
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-10 min-h-[44px] min-w-[44px] text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomScale((s) => Math.max(1, s - 0.5))}
                className="min-h-[44px] min-w-[44px] text-white hover:bg-white/20"
                disabled={zoomScale <= 1}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomScale((s) => Math.min(3, s + 0.5))}
                className="min-h-[44px] min-w-[44px] text-white hover:bg-white/20"
                disabled={zoomScale >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Fullscreen image */}
            <motion.div
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
              style={{ scale: zoomScale }}
              className="relative w-full h-full"
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt || productName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Indicators */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MobileProductGallery
