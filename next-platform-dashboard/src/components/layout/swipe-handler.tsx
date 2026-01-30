"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { useSidebar } from "./sidebar-context";

interface SwipeHandlerProps {
  children: ReactNode;
  /** Whether swipe gestures are enabled (default: true) */
  enabled?: boolean;
  /** Minimum swipe distance to trigger (default: 50) */
  threshold?: number;
  /** Edge zone width for swipe-to-open (default: 20) */
  edgeZone?: number;
  /** Maximum vertical movement before canceling swipe (default: 100) */
  maxVertical?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isTracking: boolean;
  isFromEdge: boolean;
}

/**
 * Swipe gesture handler for mobile sidebar.
 * 
 * Supports:
 * - Swipe right from left edge to open sidebar
 * - Swipe left anywhere to close sidebar (when open)
 * 
 * @example
 * ```tsx
 * <SwipeHandler>
 *   <main>{children}</main>
 * </SwipeHandler>
 * ```
 */
export function SwipeHandler({
  children,
  enabled = true,
  threshold = 50,
  edgeZone = 20,
  maxVertical = 100,
}: SwipeHandlerProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isTracking: false,
    isFromEdge: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const isFromEdge = touch.clientX < edgeZone;

    // Only track if:
    // 1. Starting from edge (to open)
    // 2. Or sidebar is open (to close)
    if (!isFromEdge && !mobileOpen) return;

    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isTracking: true,
      isFromEdge,
    };
  }, [enabled, edgeZone, mobileOpen]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.current.isTracking) return;

    const touch = e.touches[0];
    touchState.current.currentX = touch.clientX;
    touchState.current.currentY = touch.clientY;

    // Check if vertical movement exceeds threshold (user is scrolling)
    const verticalDiff = Math.abs(touch.clientY - touchState.current.startY);
    if (verticalDiff > maxVertical) {
      touchState.current.isTracking = false;
    }
  }, [maxVertical]);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.current.isTracking) return;

    const { startX, currentX, startY, currentY, isFromEdge, startTime } = touchState.current;
    
    const horizontalDiff = currentX - startX;
    const verticalDiff = Math.abs(currentY - startY);
    const timeDiff = Date.now() - startTime;

    // Reset tracking
    touchState.current.isTracking = false;

    // Validate swipe
    // Must be primarily horizontal and exceed threshold
    if (verticalDiff > Math.abs(horizontalDiff)) return;
    if (Math.abs(horizontalDiff) < threshold) return;

    // Quick swipe (velocity check) - allow shorter swipes if fast
    const isQuickSwipe = timeDiff < 300 && Math.abs(horizontalDiff) > threshold / 2;
    if (!isQuickSwipe && Math.abs(horizontalDiff) < threshold) return;

    // Swipe right from edge = open
    if (isFromEdge && horizontalDiff > 0 && !mobileOpen) {
      setMobileOpen(true);
      return;
    }

    // Swipe left when open = close
    if (horizontalDiff < 0 && mobileOpen) {
      setMobileOpen(false);
      return;
    }
  }, [threshold, mobileOpen, setMobileOpen]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const options: AddEventListenerOptions = { passive: true };

    document.addEventListener("touchstart", handleTouchStart, options);
    document.addEventListener("touchmove", handleTouchMove, options);
    document.addEventListener("touchend", handleTouchEnd, options);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return <>{children}</>;
}
