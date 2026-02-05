/**
 * useHapticFeedback - Haptic feedback hook
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Provides vibration feedback for mobile interactions.
 * Falls back gracefully when vibration API is not available.
 */
'use client'

import { useCallback, useMemo } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export interface HapticConfig {
  enabled?: boolean
  respectReducedMotion?: boolean
}

export interface UseHapticFeedbackReturn {
  trigger: (pattern?: HapticPattern) => void
  isSupported: boolean
  isEnabled: boolean
}

// ============================================================================
// PATTERNS
// ============================================================================

// Vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [30, 50, 30],
  error: [50, 100, 50, 100, 50],
  selection: 5,
}

// ============================================================================
// HOOK
// ============================================================================

export function useHapticFeedback(config: HapticConfig = {}): UseHapticFeedbackReturn {
  const { enabled = true, respectReducedMotion = true } = config

  // Check if vibration API is supported
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'vibrate' in navigator
  }, [])

  // Check reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Determine if haptics should be active
  const isEnabled = useMemo(() => {
    if (!isSupported) return false
    if (!enabled) return false
    if (respectReducedMotion && prefersReducedMotion) return false
    return true
  }, [isSupported, enabled, respectReducedMotion, prefersReducedMotion])

  // Trigger haptic feedback
  const trigger = useCallback((pattern: HapticPattern = 'medium') => {
    if (!isEnabled) return

    try {
      const vibrationPattern = HAPTIC_PATTERNS[pattern]
      navigator.vibrate(vibrationPattern)
    } catch (error) {
      // Silently fail if vibration not available
      console.debug('Haptic feedback failed:', error)
    }
  }, [isEnabled])

  return {
    trigger,
    isSupported,
    isEnabled,
  }
}

/**
 * Utility function for one-off haptic triggers
 */
export function triggerHaptic(pattern: HapticPattern = 'medium'): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern]
    navigator.vibrate(vibrationPattern)
  } catch {
    // Silently fail
  }
}
