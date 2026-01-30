/**
 * Custom Hooks Barrel Export
 * 
 * Provides centralized exports for all custom hooks.
 * Import from '@/hooks' for cleaner imports.
 * 
 * @module hooks
 */

// Media Query & Responsive
export {
  useMediaQuery,
  useBreakpoint,
  useBreakpointDown,
  useBreakpointBetween,
  useCurrentBreakpoint,
  useResponsive,
  usePrefersReducedMotion,
  breakpoints,
  type Breakpoint,
} from "./use-media-query";

// Scroll
export {
  useScrollDirection,
  useScrollPosition,
  useIsScrolled,
  useScrollLock,
  type ScrollDirection,
} from "./use-scroll-direction";
