/**
 * useSwipeGesture - Touch gesture detection hook
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Provides swipe gesture detection for touch-enabled components.
 * Supports horizontal and vertical swipes with configurable thresholds.
 */
'use client'

import { useRef, useCallback, useState, type TouchEvent as ReactTouchEvent } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeState {
  isSwiping: boolean
  direction: SwipeDirection | null
  deltaX: number
  deltaY: number
  velocity: number
}

export interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: () => void
  onSwipeEnd?: (direction: SwipeDirection | null) => void
  onSwiping?: (state: SwipeState) => void
  threshold?: number           // Minimum distance for swipe (default: 50px)
  velocityThreshold?: number   // Minimum velocity (default: 0.3 px/ms)
  preventScrollOnSwipe?: boolean
  trackTouch?: boolean         // Continuously track touch position
}

export interface SwipeHandlers {
  onTouchStart: (e: ReactTouchEvent) => void
  onTouchMove: (e: ReactTouchEvent) => void
  onTouchEnd: (e: ReactTouchEvent) => void
}

export interface UseSwipeGestureReturn {
  handlers: SwipeHandlers
  state: SwipeState
  reset: () => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useSwipeGesture(config: SwipeConfig = {}): UseSwipeGestureReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeStart,
    onSwipeEnd,
    onSwiping,
    threshold = 50,
    velocityThreshold = 0.3,
    preventScrollOnSwipe = false,
    trackTouch = true,
  } = config

  // Track touch state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isSwipingRef = useRef(false)

  // State for external access
  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
  })

  // Reset state
  const reset = useCallback(() => {
    touchStartRef.current = null
    isSwipingRef.current = false
    setState({
      isSwiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    })
  }, [])

  // Determine swipe direction
  const getDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection | null => {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Must meet minimum threshold
    if (absX < threshold && absY < threshold) {
      return null
    }

    // Horizontal swipe
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left'
    }

    // Vertical swipe
    return deltaY > 0 ? 'down' : 'up'
  }, [threshold])

  // Touch start handler
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    isSwipingRef.current = true
    onSwipeStart?.()

    setState(prev => ({
      ...prev,
      isSwiping: true,
      deltaX: 0,
      deltaY: 0,
      direction: null,
    }))
  }, [onSwipeStart])

  // Touch move handler
  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!touchStartRef.current || !isSwipingRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const direction = getDirection(deltaX, deltaY)

    // Prevent scroll if swiping horizontally
    if (preventScrollOnSwipe && direction && (direction === 'left' || direction === 'right')) {
      e.preventDefault()
    }

    if (trackTouch) {
      const elapsed = Date.now() - touchStartRef.current.time
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / Math.max(elapsed, 1)

      const newState: SwipeState = {
        isSwiping: true,
        direction,
        deltaX,
        deltaY,
        velocity,
      }

      setState(newState)
      onSwiping?.(newState)
    }
  }, [getDirection, preventScrollOnSwipe, trackTouch, onSwiping])

  // Touch end handler
  const onTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const elapsed = Date.now() - touchStartRef.current.time
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / Math.max(elapsed, 1)

    const direction = getDirection(deltaX, deltaY)

    // Check if swipe meets velocity threshold
    const isValidSwipe = direction && velocity >= velocityThreshold

    if (isValidSwipe && direction) {
      switch (direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    }

    onSwipeEnd?.(isValidSwipe ? direction : null)

    // Reset state
    touchStartRef.current = null
    isSwipingRef.current = false
    setState({
      isSwiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
    })
  }, [getDirection, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    state,
    reset,
  }
}

/**
 * useSwipeToDelete - Simplified hook for swipe-to-delete pattern
 */
export function useSwipeToDelete(config: {
  onDelete: () => void
  threshold?: number
}) {
  const { onDelete, threshold = 100 } = config
  const [offset, setOffset] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const { handlers, state } = useSwipeGesture({
    threshold: threshold / 2,
    trackTouch: true,
    preventScrollOnSwipe: true,
    onSwiping: (swipeState) => {
      // Only track left swipes
      if (swipeState.deltaX < 0) {
        setOffset(Math.max(swipeState.deltaX, -threshold * 1.5))
      }
    },
    onSwipeLeft: () => {
      if (Math.abs(offset) >= threshold) {
        setIsDeleting(true)
        onDelete()
      }
    },
    onSwipeEnd: () => {
      if (Math.abs(offset) < threshold) {
        setOffset(0)
      }
    },
  })

  const reset = useCallback(() => {
    setOffset(0)
    setIsDeleting(false)
  }, [])

  return {
    handlers,
    offset,
    isDeleting,
    reset,
    isRevealed: Math.abs(offset) >= threshold * 0.5,
  }
}
