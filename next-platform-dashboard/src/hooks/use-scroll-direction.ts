"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ScrollDirection = "up" | "down" | null;

interface UseScrollDirectionOptions {
  /** Minimum scroll amount before direction is determined (default: 10) */
  threshold?: number;
  /** Throttle scroll events by this many milliseconds (default: 100) */
  throttle?: number;
  /** Initial direction (default: null) */
  initialDirection?: ScrollDirection;
}

/**
 * Hook to detect scroll direction.
 * Useful for auto-hiding headers or showing/hiding UI elements on scroll.
 * 
 * @param options - Configuration options
 * @returns Current scroll direction ("up", "down", or null)
 * 
 * @example
 * ```tsx
 * const scrollDirection = useScrollDirection();
 * const isHeaderVisible = scrollDirection !== "down";
 * ```
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): ScrollDirection {
  const { 
    threshold = 10, 
    throttle = 100,
    initialDirection = null 
  } = options;

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize lastScrollY
    lastScrollY.current = window.scrollY;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      // Only update if we've scrolled past the threshold
      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      // Determine direction
      const direction: ScrollDirection = diff > 0 ? "down" : "up";
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }

      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const handleScroll = () => {
      const now = Date.now();

      // Throttle scroll events
      if (now - lastScrollTime.current < throttle) {
        return;
      }

      lastScrollTime.current = now;

      // Use requestAnimationFrame for smooth updates
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollDirection, threshold, throttle]);

  return scrollDirection;
}

/**
 * Hook to get current scroll position.
 * 
 * @returns Object with x and y scroll positions
 * 
 * @example
 * ```tsx
 * const { y } = useScrollPosition();
 * const isScrolled = y > 0;
 * ```
 */
export function useScrollPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePosition = () => {
      setPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    // Set initial position
    updatePosition();

    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("scroll", updatePosition);
    };
  }, []);

  return position;
}

/**
 * Hook to check if page is scrolled past a certain point.
 * 
 * @param offset - Scroll offset in pixels (default: 0)
 * @returns boolean indicating if scrolled past the offset
 * 
 * @example
 * ```tsx
 * const isScrolled = useIsScrolled(50); // true if scrolled > 50px
 * ```
 */
export function useIsScrolled(offset = 0): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > offset);
    };

    // Check initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [offset]);

  return isScrolled;
}

/**
 * Hook to lock body scroll.
 * Useful for modals, mobile menus, etc.
 * 
 * @param lock - Whether to lock scroll
 * 
 * @example
 * ```tsx
 * const [isMenuOpen, setIsMenuOpen] = useState(false);
 * useScrollLock(isMenuOpen);
 * ```
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (lock) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
}
