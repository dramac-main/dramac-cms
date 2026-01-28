/**
 * DRAMAC CMS Accessibility Utilities
 * 
 * Enterprise-grade accessibility utilities for WCAG 2.1 AA compliance.
 * Includes focus management, screen reader support, and keyboard navigation.
 * 
 * @module config/brand/accessibility
 * @version 1.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

export interface FocusRingConfig {
  /** Ring color (CSS value) */
  color: string;
  /** Ring width in pixels */
  width: number;
  /** Ring offset in pixels */
  offset: number;
  /** Ring style ('solid' | 'dashed' | 'dotted') */
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface SkipLinkConfig {
  /** Target element ID */
  targetId: string;
  /** Link text */
  text: string;
}

// =============================================================================
// FOCUS STYLES
// =============================================================================

/**
 * Default focus ring configuration.
 * Used for interactive elements across the platform.
 */
export const defaultFocusRing: FocusRingConfig = {
  color: 'hsl(var(--color-primary-500))',
  width: 2,
  offset: 2,
  style: 'solid',
};

/**
 * Generate CSS for focus ring.
 */
export function focusRingCss(config: Partial<FocusRingConfig> = {}): string {
  const { color, width, offset, style } = { ...defaultFocusRing, ...config };
  return `
    outline: ${width}px ${style} ${color};
    outline-offset: ${offset}px;
  `;
}

/**
 * Focus-visible styles for keyboard-only focus indication.
 */
export const focusVisibleStyles = `
  /* Remove default outline */
  &:focus {
    outline: none;
  }
  
  /* Show focus ring only for keyboard navigation */
  &:focus-visible {
    outline: 2px solid hsl(var(--color-primary-500));
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (forced-colors: active) {
    &:focus-visible {
      outline: 3px solid CanvasText;
      outline-offset: 2px;
    }
  }
`;

// =============================================================================
// SCREEN READER UTILITIES
// =============================================================================

/**
 * CSS to visually hide content but keep it accessible to screen readers.
 * Use for labels, descriptions, and other assistive content.
 */
export const visuallyHidden = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * CSS class for screen reader only content.
 */
export const srOnlyClass = 'sr-only';

/**
 * Announce content to screen readers.
 * Creates a live region that announces content changes.
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;
  
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  Object.assign(announcer.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  
  document.body.appendChild(announcer);
  
  // Delay to ensure the live region is registered
  requestAnimationFrame(() => {
    announcer.textContent = message;
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  });
}

// =============================================================================
// SKIP LINKS
// =============================================================================

/**
 * Default skip links for common page sections.
 */
export const defaultSkipLinks: SkipLinkConfig[] = [
  { targetId: 'main-content', text: 'Skip to main content' },
  { targetId: 'main-navigation', text: 'Skip to navigation' },
  { targetId: 'footer', text: 'Skip to footer' },
];

/**
 * CSS for skip links.
 */
export const skipLinkStyles = `
  .skip-link {
    position: absolute;
    top: -100%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    padding: 0.75rem 1.5rem;
    background: hsl(var(--color-primary-500));
    color: white;
    text-decoration: none;
    font-weight: 600;
    border-radius: 0 0 0.5rem 0.5rem;
    transition: top 0.2s ease;
  }
  
  .skip-link:focus {
    top: 0;
    outline: 2px solid white;
    outline-offset: 2px;
  }
`;

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * Common keyboard keys for navigation.
 */
export const Keys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  Tab: 'Tab',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
} as const;

/**
 * Check if a keyboard event is an activation key (Enter or Space).
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === Keys.Enter || event.key === Keys.Space;
}

/**
 * Check if a keyboard event is an arrow key.
 */
export function isArrowKey(event: KeyboardEvent): boolean {
  const arrowKeys = [Keys.ArrowUp, Keys.ArrowDown, Keys.ArrowLeft, Keys.ArrowRight];
  return arrowKeys.includes(event.key as (typeof arrowKeys)[number]);
}

/**
 * Get focusable elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];
  
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  ).filter(el => {
    // Filter out hidden elements
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Trap focus within a container (useful for modals).
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== Keys.Tab) return;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Focus the first focusable element
  firstFocusable?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// =============================================================================
// COLOR CONTRAST
// =============================================================================

/**
 * WCAG contrast ratio requirements.
 */
export const contrastRequirements = {
  /** AA level for normal text (4.5:1) */
  AANormal: 4.5,
  /** AA level for large text (3:1) */
  AALarge: 3,
  /** AAA level for normal text (7:1) */
  AAANormal: 7,
  /** AAA level for large text (4.5:1) */
  AAALarge: 4.5,
  /** UI components and graphics (3:1) */
  UIComponent: 3,
} as const;

/**
 * Check if text size qualifies as "large" for WCAG purposes.
 * Large text is 18pt (24px) or 14pt (18.66px) bold.
 */
export function isLargeText(fontSize: number, isBold: boolean = false): boolean {
  if (isBold) {
    return fontSize >= 18.66; // 14pt bold
  }
  return fontSize >= 24; // 18pt
}

// =============================================================================
// REDUCED MOTION
// =============================================================================

/**
 * CSS for reduced motion support.
 */
export const reducedMotionStyles = `
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

/**
 * CSS for respecting reduced transparency preference.
 */
export const reducedTransparencyStyles = `
  @media (prefers-reduced-transparency: reduce) {
    * {
      backdrop-filter: none !important;
      background-color: var(--color-background) !important;
    }
  }
`;

// =============================================================================
// ARIA HELPERS
// =============================================================================

/**
 * Generate unique ID for ARIA relationships.
 */
let ariaIdCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  ariaIdCounter += 1;
  return `${prefix}-${ariaIdCounter}`;
}

/**
 * Common ARIA role descriptions.
 */
export const ariaRoles = {
  navigation: 'navigation',
  main: 'main',
  banner: 'banner',
  contentinfo: 'contentinfo',
  complementary: 'complementary',
  search: 'search',
  form: 'form',
  region: 'region',
  alert: 'alert',
  alertdialog: 'alertdialog',
  dialog: 'dialog',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  tab: 'tab',
  tablist: 'tablist',
  tabpanel: 'tabpanel',
  tree: 'tree',
  treeitem: 'treeitem',
  listbox: 'listbox',
  option: 'option',
  grid: 'grid',
  gridcell: 'gridcell',
  rowgroup: 'rowgroup',
  row: 'row',
  tooltip: 'tooltip',
  status: 'status',
  progressbar: 'progressbar',
  slider: 'slider',
  spinbutton: 'spinbutton',
  switch: 'switch',
} as const;

// =============================================================================
// TOUCH TARGET SIZES
// =============================================================================

/**
 * Minimum touch target sizes per WCAG 2.5.5.
 */
export const touchTargetSizes = {
  /** Minimum recommended size (44x44px) */
  minimum: '44px',
  /** Comfortable size for mobile (48x48px) */
  comfortable: '48px',
  /** Large size for accessibility (56x56px) */
  large: '56px',
} as const;

/**
 * CSS to ensure minimum touch target size.
 */
export const touchTargetStyles = `
  min-width: ${touchTargetSizes.minimum};
  min-height: ${touchTargetSizes.minimum};
  
  /* Increase target size without affecting visual layout */
  &::before {
    content: '';
    position: absolute;
    inset: -8px;
  }
`;

// =============================================================================
// FORM ACCESSIBILITY
// =============================================================================

/**
 * Generate accessible form field configuration.
 */
export function getFieldAccessibility(options: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}) {
  const { id, label, error, description, required } = options;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;
  
  return {
    input: {
      id,
      'aria-label': label,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : undefined,
      'aria-required': required || undefined,
    },
    label: {
      htmlFor: id,
    },
    description: descriptionId ? { id: descriptionId } : undefined,
    error: errorId ? { id: errorId, role: 'alert' } : undefined,
  };
}
