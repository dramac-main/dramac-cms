/**
 * @dramac/sdk - Style Utilities
 * 
 * CSS and styling utilities for module development
 */

/**
 * Merge class names conditionally (similar to clsx/classnames)
 */
export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }
  
  return classes.join(' ');
}

/**
 * Dramac design system color tokens
 */
export const colors = {
  // Primary
  primary: {
    50: 'hsl(var(--primary-50))',
    100: 'hsl(var(--primary-100))',
    200: 'hsl(var(--primary-200))',
    300: 'hsl(var(--primary-300))',
    400: 'hsl(var(--primary-400))',
    500: 'hsl(var(--primary))',
    600: 'hsl(var(--primary-600))',
    700: 'hsl(var(--primary-700))',
    800: 'hsl(var(--primary-800))',
    900: 'hsl(var(--primary-900))',
  },
  
  // Semantic colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  
  // Status colors
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  error: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
} as const;

/**
 * Spacing scale (matches Tailwind)
 */
export const spacing = {
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

/**
 * Common animation classes
 */
export const animations = {
  fadeIn: 'animate-in fade-in-0',
  fadeOut: 'animate-out fade-out-0',
  slideInFromTop: 'animate-in slide-in-from-top-2',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2',
  slideInFromLeft: 'animate-in slide-in-from-left-2',
  slideInFromRight: 'animate-in slide-in-from-right-2',
  zoomIn: 'animate-in zoom-in-95',
  zoomOut: 'animate-out zoom-out-95',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
} as const;

/**
 * Common layout utilities
 */
export const layout = {
  // Flexbox
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  
  // Grid
  gridCols1: 'grid grid-cols-1',
  gridCols2: 'grid grid-cols-2',
  gridCols3: 'grid grid-cols-3',
  gridCols4: 'grid grid-cols-4',
  
  // Container
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  
  // Card layouts
  cardGrid: 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  statGrid: 'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
} as const;

/**
 * Responsive breakpoint prefixes
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Create responsive class with breakpoint prefix
 */
export function responsive(
  base: string,
  variants: Partial<Record<keyof typeof breakpoints, string>>
): string {
  const classes = [base];
  
  for (const [breakpoint, className] of Object.entries(variants)) {
    if (className) {
      classes.push(`${breakpoint}:${className}`);
    }
  }
  
  return classes.join(' ');
}

/**
 * CSS variable utilities
 */
export const cssVar = {
  /**
   * Get CSS variable value
   */
  get(name: string): string {
    return `var(--${name})`;
  },
  
  /**
   * Set CSS variable on element
   */
  set(element: HTMLElement, name: string, value: string): void {
    element.style.setProperty(`--${name}`, value);
  },
  
  /**
   * Set CSS variable on root
   */
  setRoot(name: string, value: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(`--${name}`, value);
    }
  },
};
