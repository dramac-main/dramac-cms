/**
 * Global Layout Constants
 * 
 * SINGLE SOURCE OF TRUTH for all spacing, dimensions, and layout values.
 * Change these values to update the entire platform globally.
 * 
 * @module config/layout
 * @example
 * import { LAYOUT } from '@/config/layout';
 * <div className={LAYOUT.PAGE_PADDING}>...</div>
 */

export const LAYOUT = {
  // ============================================
  // PAGE PADDING (Main Content Area)
  // ============================================
  
  /** Standard page padding: 16px mobile, 24px desktop */
  PAGE_PADDING: 'p-4 lg:p-6',
  
  /** Horizontal page padding only */
  PAGE_PADDING_X: 'px-4 lg:px-6',
  
  /** Vertical page padding only */
  PAGE_PADDING_Y: 'py-4 lg:py-6',
  
  /** No padding (for full-width layouts like editors) */
  PAGE_PADDING_NONE: 'p-0',
  
  /** Dense padding (for compact layouts) */
  PAGE_PADDING_DENSE: 'p-2 lg:p-4',
  
  // ============================================
  // CONTENT MAX WIDTH
  // ============================================
  
  /** Standard content width: 1536px */
  CONTENT_MAX_WIDTH: 'max-w-screen-2xl',
  
  /** Large content width: 1280px */
  CONTENT_MAX_WIDTH_LG: 'max-w-screen-xl',
  
  /** Medium content width: 1024px */
  CONTENT_MAX_WIDTH_MD: 'max-w-screen-lg',
  
  /** Small content width: 768px */
  CONTENT_MAX_WIDTH_SM: 'max-w-screen-md',
  
  /** Full width (no constraint) */
  CONTENT_MAX_WIDTH_FULL: 'max-w-full',
  
  // ============================================
  // SECTION SPACING (Vertical gaps between sections)
  // ============================================
  
  /** Standard section gap: 24px */
  SECTION_GAP: 'space-y-6',
  
  /** Large section gap: 32px */
  SECTION_GAP_LG: 'space-y-8',
  
  /** Small section gap: 16px */
  SECTION_GAP_SM: 'space-y-4',
  
  /** Extra small section gap: 8px */
  SECTION_GAP_XS: 'space-y-2',
  
  // ============================================
  // GRID GAPS (For card grids, form layouts)
  // ============================================
  
  /** Standard grid gap: 16px mobile, 24px desktop */
  GRID_GAP: 'gap-4 lg:gap-6',
  
  /** Small grid gap: 8px mobile, 16px desktop */
  GRID_GAP_SM: 'gap-2 lg:gap-4',
  
  /** Large grid gap: 24px mobile, 32px desktop */
  GRID_GAP_LG: 'gap-6 lg:gap-8',
  
  // ============================================
  // SIDEBAR DIMENSIONS
  // ============================================
  
  /** Expanded sidebar width: 256px (16rem) */
  SIDEBAR_WIDTH: 'w-64',
  
  /** Collapsed sidebar width: 64px (4rem) */
  SIDEBAR_COLLAPSED_WIDTH: 'w-16',
  
  /** Sidebar sticky positioning classes */
  SIDEBAR_POSITION: 'sticky top-0 h-screen',
  
  // ============================================
  // HEADER DIMENSIONS
  // ============================================
  
  /** Header height: 56px mobile, 64px desktop */
  HEADER_HEIGHT: 'h-14 md:h-16',
  
  /** Header sticky positioning */
  HEADER_POSITION: 'sticky top-0',
  
  // ============================================
  // CONTAINER WIDTHS
  // ============================================
  
  /** Full width container with auto margins */
  CONTAINER: 'container mx-auto',
  
  /** Container with standard padding */
  CONTAINER_PADDED: 'container mx-auto px-4 lg:px-6',
  
  // ============================================
  // CARD PADDING
  // ============================================
  
  /** Standard card padding: 24px */
  CARD_PADDING: 'p-6',
  
  /** Small card padding: 16px */
  CARD_PADDING_SM: 'p-4',
  
  /** Large card padding: 32px */
  CARD_PADDING_LG: 'p-8',
  
  // ============================================
  // FORM SPACING
  // ============================================
  
  /** Form field vertical gap: 16px */
  FORM_GAP: 'space-y-4',
  
  /** Form field vertical gap (large): 24px */
  FORM_GAP_LG: 'space-y-6',
  
  /** Form field vertical gap (small): 8px */
  FORM_GAP_SM: 'space-y-2',
  
  // ============================================
  // PAGE HEADER SPACING
  // ============================================
  
  /** Space below page header: 24px */
  PAGE_HEADER_MARGIN: 'pb-6',
  
  /** Space below page header (large): 32px */
  PAGE_HEADER_MARGIN_LG: 'pb-8',
  
} as const;

/**
 * Helper function to combine layout classes safely
 * @param classes - Layout class strings to combine
 * @returns Combined class string
 * @example
 * combineLayout(LAYOUT.PAGE_PADDING, LAYOUT.SECTION_GAP)
 * // Returns: "p-4 lg:p-6 space-y-6"
 */
export function combineLayout(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Type for layout constant keys (for type-safe usage)
 */
export type LayoutKey = keyof typeof LAYOUT;

/**
 * Type for the LAYOUT constant values
 */
export type LayoutValue = typeof LAYOUT[LayoutKey];
