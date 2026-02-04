/**
 * DRAMAC Studio Responsive Canvas Styles
 * 
 * Provides CSS Container Query overrides for responsive behavior in the canvas.
 * This allows the canvas to simulate responsive layouts based on its width
 * rather than the browser viewport width.
 * 
 * The preview page works naturally because it opens in a new window where
 * browser viewport === content width. The canvas needs container queries.
 * 
 * @phase STUDIO-18 - Responsive Preview
 */

'use client';

import { useUIStore } from '@/lib/studio/store';

/**
 * Generates CSS that overrides Tailwind responsive classes based on canvas width.
 * Uses @container queries when available, with JS-based fallback.
 */
export function ResponsiveCanvasStyles() {
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  
  // Tailwind breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };
  
  // Determine current breakpoint based on canvas width
  const isSm = viewportWidth >= breakpoints.sm;
  const isMd = viewportWidth >= breakpoints.md;
  const isLg = viewportWidth >= breakpoints.lg;
  const isXl = viewportWidth >= breakpoints.xl;
  const is2Xl = viewportWidth >= breakpoints['2xl'];
  
  // Generate override CSS - this forces responsive classes to follow canvas width
  // Note: This is a targeted fix for common responsive patterns
  const overrideCSS = `
    /* DRAMAC Studio Canvas Responsive Overrides */
    /* Canvas width: ${viewportWidth}px */
    /* Active breakpoints: ${isSm ? 'sm ' : ''}${isMd ? 'md ' : ''}${isLg ? 'lg ' : ''}${isXl ? 'xl ' : ''}${is2Xl ? '2xl' : ''} */
    
    /* Container query context */
    [data-canvas-container] .studio-canvas-content {
      container-type: inline-size;
      container-name: canvas;
    }
    
    /* === DISPLAY UTILITIES === */
    /* md:hidden - hide on tablet+ */
    ${isMd ? `
    [data-canvas-container] .md\\:hidden {
      display: none !important;
    }
    ` : `
    [data-canvas-container] .md\\:hidden {
      display: revert !important;
    }
    `}
    
    /* md:block - show on tablet+ */
    ${isMd ? `
    [data-canvas-container] .hidden.md\\:block {
      display: block !important;
    }
    ` : `
    [data-canvas-container] .hidden.md\\:block {
      display: none !important;
    }
    `}
    
    /* md:flex - flex on tablet+ */
    ${isMd ? `
    [data-canvas-container] .hidden.md\\:flex {
      display: flex !important;
    }
    ` : `
    [data-canvas-container] .hidden.md\\:flex {
      display: none !important;
    }
    `}
    
    /* md:inline-flex - inline-flex on tablet+ */
    ${isMd ? `
    [data-canvas-container] .hidden.md\\:inline-flex {
      display: inline-flex !important;
    }
    ` : `
    [data-canvas-container] .hidden.md\\:inline-flex {
      display: none !important;
    }
    `}
    
    /* lg:hidden - hide on desktop+ */
    ${isLg ? `
    [data-canvas-container] .lg\\:hidden {
      display: none !important;
    }
    ` : ``}
    
    /* lg:block - show on desktop+ */
    ${isLg ? `
    [data-canvas-container] .hidden.lg\\:block {
      display: block !important;
    }
    ` : ``}
    
    /* lg:flex - flex on desktop+ */
    ${isLg ? `
    [data-canvas-container] .hidden.lg\\:flex {
      display: flex !important;
    }
    ` : ``}
    
    /* === GRID COLUMNS === */
    ${isMd ? `
    [data-canvas-container] .md\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    [data-canvas-container] .md\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
    [data-canvas-container] .md\\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
    ` : `
    [data-canvas-container] .md\\:grid-cols-2,
    [data-canvas-container] .md\\:grid-cols-3,
    [data-canvas-container] .md\\:grid-cols-4 {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
    }
    `}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    [data-canvas-container] .lg\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
    [data-canvas-container] .lg\\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
    [data-canvas-container] .lg\\:grid-cols-5 {
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    }
    ` : ``}
    
    /* === FLEX DIRECTION === */
    ${isMd ? `
    [data-canvas-container] .flex-col.md\\:flex-row {
      flex-direction: row !important;
    }
    ` : `
    [data-canvas-container] .flex-col.md\\:flex-row {
      flex-direction: column !important;
    }
    `}
    
    ${isLg ? `
    [data-canvas-container] .flex-col.lg\\:flex-row {
      flex-direction: row !important;
    }
    ` : ``}
    
    /* === TEXT ALIGNMENT === */
    ${isMd ? `
    [data-canvas-container] .text-center.md\\:text-left {
      text-align: left !important;
    }
    [data-canvas-container] .text-left.md\\:text-center {
      text-align: center !important;
    }
    [data-canvas-container] .md\\:text-left {
      text-align: left !important;
    }
    [data-canvas-container] .md\\:text-center {
      text-align: center !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:text-left {
      text-align: left !important;
    }
    [data-canvas-container] .lg\\:text-center {
      text-align: center !important;
    }
    ` : ``}
    
    /* === FONT SIZES === */
    ${isMd ? `
    [data-canvas-container] .text-2xl.md\\:text-3xl,
    [data-canvas-container] .md\\:text-3xl {
      font-size: 1.875rem !important;
      line-height: 2.25rem !important;
    }
    [data-canvas-container] .text-3xl.md\\:text-4xl,
    [data-canvas-container] .md\\:text-4xl {
      font-size: 2.25rem !important;
      line-height: 2.5rem !important;
    }
    [data-canvas-container] .text-xl.md\\:text-2xl,
    [data-canvas-container] .md\\:text-2xl {
      font-size: 1.5rem !important;
      line-height: 2rem !important;
    }
    [data-canvas-container] .md\\:text-lg {
      font-size: 1.125rem !important;
      line-height: 1.75rem !important;
    }
    [data-canvas-container] .md\\:text-xl {
      font-size: 1.25rem !important;
      line-height: 1.75rem !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:text-4xl {
      font-size: 2.25rem !important;
      line-height: 2.5rem !important;
    }
    [data-canvas-container] .lg\\:text-5xl {
      font-size: 3rem !important;
      line-height: 1 !important;
    }
    [data-canvas-container] .lg\\:text-6xl {
      font-size: 3.75rem !important;
      line-height: 1 !important;
    }
    [data-canvas-container] .lg\\:text-3xl {
      font-size: 1.875rem !important;
      line-height: 2.25rem !important;
    }
    [data-canvas-container] .lg\\:text-2xl {
      font-size: 1.5rem !important;
      line-height: 2rem !important;
    }
    [data-canvas-container] .lg\\:text-xl {
      font-size: 1.25rem !important;
      line-height: 1.75rem !important;
    }
    [data-canvas-container] .lg\\:text-lg {
      font-size: 1.125rem !important;
      line-height: 1.75rem !important;
    }
    ` : ``}
    
    ${isXl ? `
    [data-canvas-container] .xl\\:text-6xl {
      font-size: 3.75rem !important;
      line-height: 1 !important;
    }
    ` : ``}
    
    /* === PADDING === */
    ${isMd ? `
    [data-canvas-container] .md\\:px-8 {
      padding-left: 2rem !important;
      padding-right: 2rem !important;
    }
    [data-canvas-container] .md\\:py-4 {
      padding-top: 1rem !important;
      padding-bottom: 1rem !important;
    }
    [data-canvas-container] .md\\:py-8 {
      padding-top: 2rem !important;
      padding-bottom: 2rem !important;
    }
    [data-canvas-container] .md\\:py-16 {
      padding-top: 4rem !important;
      padding-bottom: 4rem !important;
    }
    [data-canvas-container] .md\\:py-20 {
      padding-top: 5rem !important;
      padding-bottom: 5rem !important;
    }
    [data-canvas-container] .md\\:py-24 {
      padding-top: 6rem !important;
      padding-bottom: 6rem !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:px-8 {
      padding-left: 2rem !important;
      padding-right: 2rem !important;
    }
    [data-canvas-container] .lg\\:py-24 {
      padding-top: 6rem !important;
      padding-bottom: 6rem !important;
    }
    [data-canvas-container] .lg\\:py-32 {
      padding-top: 8rem !important;
      padding-bottom: 8rem !important;
    }
    ` : ``}
    
    /* === MARGIN === */
    ${isMd ? `
    [data-canvas-container] .md\\:mb-0 {
      margin-bottom: 0 !important;
    }
    [data-canvas-container] .md\\:mb-4 {
      margin-bottom: 1rem !important;
    }
    [data-canvas-container] .md\\:mb-6 {
      margin-bottom: 1.5rem !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:mb-0 {
      margin-bottom: 0 !important;
    }
    [data-canvas-container] .lg\\:mb-6 {
      margin-bottom: 1.5rem !important;
    }
    [data-canvas-container] .lg\\:mb-8 {
      margin-bottom: 2rem !important;
    }
    ` : ``}
    
    /* === WIDTH === */
    ${isMd ? `
    [data-canvas-container] .w-full.md\\:w-1\\/2 {
      width: 50% !important;
    }
    [data-canvas-container] .md\\:w-1\\/2 {
      width: 50% !important;
    }
    [data-canvas-container] .md\\:w-1\\/3 {
      width: 33.333333% !important;
    }
    [data-canvas-container] .md\\:w-auto {
      width: auto !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:w-1\\/2 {
      width: 50% !important;
    }
    [data-canvas-container] .lg\\:w-1\\/3 {
      width: 33.333333% !important;
    }
    [data-canvas-container] .lg\\:w-1\\/4 {
      width: 25% !important;
    }
    ` : ``}
    
    /* === GAP === */
    ${isMd ? `
    [data-canvas-container] .gap-4.md\\:gap-6 {
      gap: 1.5rem !important;
    }
    [data-canvas-container] .gap-6.md\\:gap-8 {
      gap: 2rem !important;
    }
    [data-canvas-container] .md\\:gap-8 {
      gap: 2rem !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:gap-8 {
      gap: 2rem !important;
    }
    [data-canvas-container] .lg\\:gap-12 {
      gap: 3rem !important;
    }
    ` : ``}
    
    /* === HEIGHT === */
    ${isMd ? `
    [data-canvas-container] .md\\:h-10 {
      height: 2.5rem !important;
    }
    [data-canvas-container] .md\\:h-24 {
      height: 6rem !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:h-28 {
      height: 7rem !important;
    }
    ` : ``}
    
    /* === SPACING UTILITIES === */
    ${isMd ? `
    [data-canvas-container] .space-y-4.md\\:space-y-0 > :not([hidden]) ~ :not([hidden]) {
      --tw-space-y-reverse: 0;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }
    ` : ``}
    
    /* === MAX WIDTH === */
    ${isMd ? `
    [data-canvas-container] .md\\:max-w-none {
      max-width: none !important;
    }
    [data-canvas-container] .md\\:max-w-md {
      max-width: 28rem !important;
    }
    [data-canvas-container] .md\\:max-w-lg {
      max-width: 32rem !important;
    }
    [data-canvas-container] .md\\:max-w-xl {
      max-width: 36rem !important;
    }
    ` : ``}
    
    ${isLg ? `
    [data-canvas-container] .lg\\:max-w-none {
      max-width: none !important;
    }
    ` : ``}
    
    /* === ITEMS ALIGNMENT === */
    ${isMd ? `
    [data-canvas-container] .items-center.md\\:items-start {
      align-items: flex-start !important;
    }
    [data-canvas-container] .items-start.md\\:items-center {
      align-items: center !important;
    }
    [data-canvas-container] .md\\:items-end {
      align-items: flex-end !important;
    }
    ` : ``}
    
    /* === JUSTIFY CONTENT === */
    ${isMd ? `
    [data-canvas-container] .justify-center.md\\:justify-start {
      justify-content: flex-start !important;
    }
    [data-canvas-container] .justify-center.md\\:justify-between {
      justify-content: space-between !important;
    }
    ` : ``}
    
    /* === ORDER === */
    ${isMd ? `
    [data-canvas-container] .order-2.md\\:order-1 {
      order: 1 !important;
    }
    [data-canvas-container] .order-1.md\\:order-2 {
      order: 2 !important;
    }
    ` : ``}
  `;
  
  return (
    <style
      dangerouslySetInnerHTML={{ __html: overrideCSS }}
      data-studio-responsive-overrides
    />
  );
}
