"use client";

import { useState, useEffect, useCallback } from "react";

interface TouchDeviceState {
  isTouchDevice: boolean;
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: "portrait" | "landscape";
}

/**
 * Hook to detect touch device capabilities and screen dimensions
 * Useful for adapting UI for mobile/tablet editing experiences
 */
export function useTouchDevice(): TouchDeviceState {
  const [state, setState] = useState<TouchDeviceState>({
    isTouchDevice: false,
    isMobile: false,
    isTablet: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: "portrait",
  });

  const checkDevice = useCallback(() => {
    const touch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE specific
      navigator.msMaxTouchPoints > 0;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 768;
    const tablet = width >= 768 && width < 1024;
    const orientation = width > height ? "landscape" : "portrait";

    setState({
      isTouchDevice: touch,
      isMobile: mobile,
      isTablet: tablet,
      screenWidth: width,
      screenHeight: height,
      orientation,
    });
  }, []);

  useEffect(() => {
    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener("resize", checkDevice);

    // Listen for orientation changes (mobile devices)
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, [checkDevice]);

  return state;
}

/**
 * Simple hook that just returns if device is touch-enabled
 */
export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useTouchDevice();
  return isTouchDevice;
}

/**
 * Hook to detect if we should show mobile UI
 * Returns true for mobile devices OR when viewport is mobile-sized
 */
export function useMobileUI(): boolean {
  const { isMobile, isTouchDevice } = useTouchDevice();
  return isMobile || (isTouchDevice && window.innerWidth < 1024);
}
