"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Standard breakpoints matching Tailwind CSS defaults.
 * Use these for consistent responsive behavior across the app.
 */
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * SSR-safe media query hook.
 * Returns true if the media query matches, false otherwise.
 * 
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 * 
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if window is available
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener("change", listener);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [query]);

  // Return false during SSR to prevent hydration mismatch
  return mounted ? matches : false;
}

/**
 * Hook to check if viewport is at or above a specific breakpoint.
 * 
 * @param breakpoint - Breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @returns boolean indicating if viewport is at or above the breakpoint
 * 
 * @example
 * ```tsx
 * const isTablet = useBreakpoint("md");  // true if >= 768px
 * const isDesktop = useBreakpoint("lg"); // true if >= 1024px
 * ```
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}

/**
 * Hook to check if viewport is below a specific breakpoint.
 * 
 * @param breakpoint - Breakpoint name (xs, sm, md, lg, xl, 2xl)
 * @returns boolean indicating if viewport is below the breakpoint
 * 
 * @example
 * ```tsx
 * const isMobile = useBreakpointDown("md");    // true if < 768px
 * const isNotDesktop = useBreakpointDown("lg"); // true if < 1024px
 * ```
 */
export function useBreakpointDown(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${breakpoints[breakpoint] - 1}px)`);
}

/**
 * Hook to check if viewport is between two breakpoints.
 * 
 * @param min - Minimum breakpoint (inclusive)
 * @param max - Maximum breakpoint (exclusive)
 * @returns boolean indicating if viewport is between the breakpoints
 * 
 * @example
 * ```tsx
 * const isTabletOnly = useBreakpointBetween("md", "lg"); // true if >= 768px and < 1024px
 * ```
 */
export function useBreakpointBetween(min: Breakpoint, max: Breakpoint): boolean {
  return useMediaQuery(
    `(min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`
  );
}

/**
 * Hook that returns the current breakpoint name.
 * Useful for conditional rendering based on screen size.
 * 
 * @returns Current breakpoint name or null during SSR
 * 
 * @example
 * ```tsx
 * const breakpoint = useCurrentBreakpoint();
 * // breakpoint: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | null
 * ```
 */
export function useCurrentBreakpoint(): Breakpoint | null {
  const is2xl = useBreakpoint("2xl");
  const isXl = useBreakpoint("xl");
  const isLg = useBreakpoint("lg");
  const isMd = useBreakpoint("md");
  const isSm = useBreakpoint("sm");
  const isXs = useBreakpoint("xs");

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  if (isXs) return "xs";
  return null;
}

/**
 * Convenience hook for common responsive checks.
 * 
 * @returns Object with common responsive boolean flags
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useResponsive();
 * ```
 */
export function useResponsive() {
  const isMobile = useBreakpointDown("md");
  const isTablet = useBreakpointBetween("md", "lg");
  const isDesktop = useBreakpoint("lg");
  const isLargeDesktop = useBreakpoint("xl");

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Convenience aliases
    isPhone: isMobile,
    isTouch: isMobile || isTablet,
  };
}

/**
 * Hook to check if user prefers reduced motion.
 * Use this to disable animations for accessibility.
 * 
 * @returns boolean indicating if user prefers reduced motion
 * 
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 * const transition = prefersReducedMotion ? {} : { duration: 0.3 };
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
