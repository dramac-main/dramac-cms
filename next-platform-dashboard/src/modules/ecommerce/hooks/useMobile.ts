/**
 * useMobile - Device detection hooks
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * 
 * Provides device type detection and breakpoint awareness
 * for responsive mobile-first components.
 */
'use client'

import { useState, useEffect } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface BreakpointConfig {
  mobile: number    // 0-767px
  tablet: number    // 768-1023px
  desktop: number   // 1024px+
}

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: Breakpoint
  width: number
  isTouchDevice: boolean
  isIOS: boolean
  isAndroid: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Simple mobile detection hook
 * @param breakpoint - Width threshold for mobile (default 768)
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check initial value
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Run on mount
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

/**
 * Breakpoint detection hook
 * Returns current breakpoint: 'mobile' | 'tablet' | 'desktop'
 */
export function useBreakpoint(config: Partial<BreakpointConfig> = {}): Breakpoint {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...config }
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < breakpoints.tablet) {
        setBreakpoint('mobile')
      } else if (width < breakpoints.desktop) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [breakpoints.tablet, breakpoints.desktop])

  return breakpoint
}

/**
 * Comprehensive device info hook
 * Returns detailed device information including touch capability
 */
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Detect touch capability
      const isTouchDevice = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0

      // Detect OS
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)

      // Determine breakpoint
      let breakpoint: Breakpoint = 'desktop'
      let isMobile = false
      let isTablet = false
      let isDesktop = true

      if (width < DEFAULT_BREAKPOINTS.tablet) {
        breakpoint = 'mobile'
        isMobile = true
        isTablet = false
        isDesktop = false
      } else if (width < DEFAULT_BREAKPOINTS.desktop) {
        breakpoint = 'tablet'
        isMobile = false
        isTablet = true
        isDesktop = false
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint,
        width,
        isTouchDevice,
        isIOS,
        isAndroid,
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  return deviceInfo
}

/**
 * Media query hook
 * @param query - CSS media query string
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Preferred color scheme hook
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Reduced motion preference hook
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
