/**
 * useKeyboardVisible - Keyboard visibility detection hook
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Detects when the virtual keyboard is open on mobile devices.
 * Useful for adjusting UI elements that might be obscured.
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface KeyboardState {
  isVisible: boolean
  height: number
}

export interface UseKeyboardVisibleReturn {
  isKeyboardVisible: boolean
  keyboardHeight: number
  scrollInputIntoView: (element: HTMLElement | null) => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useKeyboardVisible(): UseKeyboardVisibleReturn {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  })
  
  const initialViewportHeight = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Store initial viewport height
    initialViewportHeight.current = window.innerHeight

    // Detect keyboard via viewport resize
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDiff = initialViewportHeight.current - currentHeight
      
      // Keyboard is likely visible if viewport shrunk significantly
      // (typically 150px+ for mobile keyboards)
      const isVisible = heightDiff > 150
      
      setKeyboardState({
        isVisible,
        height: isVisible ? heightDiff : 0,
      })
    }

    // Also detect via visualViewport API (more reliable on modern browsers)
    const handleVisualViewportResize = () => {
      if (!window.visualViewport) return
      
      const heightDiff = initialViewportHeight.current - window.visualViewport.height
      const isVisible = heightDiff > 150
      
      setKeyboardState({
        isVisible,
        height: isVisible ? heightDiff : 0,
      })
    }

    // Use visualViewport if available (better accuracy)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportResize)
      }
    }

    // Fallback to window resize
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Utility to scroll an input into view when keyboard opens
  const scrollInputIntoView = useCallback((element: HTMLElement | null) => {
    if (!element) return

    // Small delay to let keyboard animation complete
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)
  }, [])

  return {
    isKeyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    scrollInputIntoView,
  }
}

/**
 * Hook to automatically scroll focused input into view
 */
export function useAutoScrollOnFocus() {
  const { scrollInputIntoView } = useKeyboardVisible()

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    scrollInputIntoView(e.target)
  }, [scrollInputIntoView])

  return { handleFocus }
}
