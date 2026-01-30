/**
 * DRAMAC CMS Semantic Color Utilities
 * 
 * Provides type-safe access to semantic colors with proper
 * dark mode support and consistent API across the application.
 * 
 * @example
 * ```tsx
 * import { getStatusClasses, mapToStatusType } from '@/config/brand/semantic-colors';
 * 
 * // Get classes for a status
 * <Badge className={getStatusClasses('success', 'subtle')}>Active</Badge>
 * 
 * // Map dynamic status strings
 * const status = mapToStatusType('completed'); // returns 'success'
 * ```
 * 
 * @module config/brand/semantic-colors
 * @version 1.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Status types for semantic color selection.
 */
export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Brand color types for primary actions.
 */
export type BrandColorType = 'primary' | 'secondary' | 'accent';

/**
 * Intensity level for color application.
 * - subtle: Light background with muted text (for indicators)
 * - moderate: Medium background with contrasting text (for badges)
 * - strong: Full color background with foreground text (for buttons)
 */
export type IntensityLevel = 'subtle' | 'moderate' | 'strong';

/**
 * Color classes for a semantic color.
 */
export interface SemanticColorClasses {
  /** Full background color (e.g., bg-success) */
  bg: string;
  /** Subtle background color (e.g., bg-success-50) */
  bgSubtle: string;
  /** Foreground text on full background */
  text: string;
  /** Text color for subtle backgrounds */
  textSubtle: string;
  /** Border color */
  border: string;
  /** Ring/focus color */
  ring: string;
}

// =============================================================================
// STATUS COLOR CLASSES
// =============================================================================

/**
 * Semantic color classes for status indicators.
 * Uses design tokens from the brand configuration.
 * All classes include dark mode variants.
 */
export const statusColors: Record<StatusType, SemanticColorClasses> = {
  success: {
    bg: 'bg-success',
    bgSubtle: 'bg-success-50 dark:bg-success-950/30',
    text: 'text-success-foreground',
    textSubtle: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-800',
    ring: 'ring-success-500/20',
  },
  warning: {
    bg: 'bg-warning',
    bgSubtle: 'bg-warning-50 dark:bg-warning-950/30',
    text: 'text-warning-foreground',
    textSubtle: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-800',
    ring: 'ring-warning-500/20',
  },
  danger: {
    bg: 'bg-danger',
    bgSubtle: 'bg-danger-50 dark:bg-danger-950/30',
    text: 'text-danger-foreground',
    textSubtle: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-800',
    ring: 'ring-danger-500/20',
  },
  info: {
    bg: 'bg-info',
    bgSubtle: 'bg-info-50 dark:bg-info-950/30',
    text: 'text-info-foreground',
    textSubtle: 'text-info-700 dark:text-info-400',
    border: 'border-info-200 dark:border-info-800',
    ring: 'ring-info-500/20',
  },
  neutral: {
    bg: 'bg-muted',
    bgSubtle: 'bg-muted/50',
    text: 'text-muted-foreground',
    textSubtle: 'text-muted-foreground/80',
    border: 'border-border',
    ring: 'ring-ring/20',
  },
};

/**
 * Brand color classes for primary UI elements.
 */
export const brandColors: Record<BrandColorType, SemanticColorClasses> = {
  primary: {
    bg: 'bg-primary',
    bgSubtle: 'bg-primary-50 dark:bg-primary-950/30',
    text: 'text-primary-foreground',
    textSubtle: 'text-primary-700 dark:text-primary-400',
    border: 'border-primary-200 dark:border-primary-800',
    ring: 'ring-primary-500/20',
  },
  secondary: {
    bg: 'bg-secondary',
    bgSubtle: 'bg-secondary-50 dark:bg-secondary-950/30',
    text: 'text-secondary-foreground',
    textSubtle: 'text-secondary-700 dark:text-secondary-400',
    border: 'border-secondary-200 dark:border-secondary-800',
    ring: 'ring-secondary-500/20',
  },
  accent: {
    bg: 'bg-accent',
    bgSubtle: 'bg-accent-50 dark:bg-accent-950/30',
    text: 'text-accent-foreground',
    textSubtle: 'text-accent-700 dark:text-accent-400',
    border: 'border-accent-200 dark:border-accent-800',
    ring: 'ring-accent-500/20',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get status color classes based on status type and intensity.
 * 
 * @param status - The status type (success, warning, danger, info, neutral)
 * @param intensity - The color intensity (subtle, moderate, strong)
 * @returns Tailwind class string for styling
 * 
 * @example
 * ```tsx
 * // Subtle (light bg, muted text)
 * <div className={getStatusClasses('success', 'subtle')}>Active</div>
 * // Returns: "bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400"
 * 
 * // Strong (full bg, white text)
 * <div className={getStatusClasses('danger', 'strong')}>Error</div>
 * // Returns: "bg-danger text-danger-foreground"
 * ```
 */
export function getStatusClasses(
  status: StatusType, 
  intensity: IntensityLevel = 'moderate'
): string {
  const colors = statusColors[status];
  
  switch (intensity) {
    case 'subtle':
      return `${colors.bgSubtle} ${colors.textSubtle}`;
    case 'moderate':
      return `${colors.bgSubtle} ${colors.textSubtle} border ${colors.border}`;
    case 'strong':
      return `${colors.bg} ${colors.text}`;
    default:
      return `${colors.bgSubtle} ${colors.textSubtle}`;
  }
}

/**
 * Get brand color classes for primary UI elements.
 * 
 * @param color - The brand color (primary, secondary, accent)
 * @param intensity - The color intensity
 * @returns Tailwind class string
 */
export function getBrandClasses(
  color: BrandColorType,
  intensity: IntensityLevel = 'moderate'
): string {
  const colors = brandColors[color];
  
  switch (intensity) {
    case 'subtle':
      return `${colors.bgSubtle} ${colors.textSubtle}`;
    case 'moderate':
      return `${colors.bgSubtle} ${colors.textSubtle} border ${colors.border}`;
    case 'strong':
      return `${colors.bg} ${colors.text}`;
    default:
      return `${colors.bgSubtle} ${colors.textSubtle}`;
  }
}

// =============================================================================
// STATUS MAPPING
// =============================================================================

/** Map of common status strings to StatusType */
const STATUS_MAPPINGS: Record<string, StatusType> = {
  // Success states
  success: 'success',
  active: 'success',
  completed: 'success',
  confirmed: 'success',
  published: 'success',
  approved: 'success',
  enabled: 'success',
  connected: 'success',
  online: 'success',
  healthy: 'success',
  passed: 'success',
  verified: 'success',
  resolved: 'success',
  
  // Warning states
  warning: 'warning',
  pending: 'warning',
  scheduled: 'warning',
  processing: 'warning',
  draft: 'warning',
  paused: 'warning',
  reviewing: 'warning',
  awaiting: 'warning',
  'pending_approval': 'warning',
  queued: 'warning',
  
  // Danger states
  danger: 'danger',
  error: 'danger',
  failed: 'danger',
  cancelled: 'danger',
  rejected: 'danger',
  expired: 'danger',
  disabled: 'danger',
  offline: 'danger',
  disconnected: 'danger',
  unhealthy: 'danger',
  overdue: 'danger',
  
  // Info states
  info: 'info',
  new: 'info',
  updated: 'info',
  modified: 'info',
  changed: 'info',
};

/**
 * Map common status strings to StatusType.
 * Handles various status naming conventions used across the platform.
 * 
 * @param status - The status string to map
 * @returns The corresponding StatusType
 * 
 * @example
 * ```tsx
 * const statusType = mapToStatusType('completed'); // 'success'
 * const statusType = mapToStatusType('PENDING');   // 'warning'
 * const statusType = mapToStatusType('failed');    // 'danger'
 * ```
 */
export function mapToStatusType(status: string): StatusType {
  const normalizedStatus = status.toLowerCase().replace(/[_-]/g, '_');
  return STATUS_MAPPINGS[normalizedStatus] ?? 'neutral';
}

/**
 * Get complete status styling (classes + icon suggestion).
 * Useful for status indicators that need both color and icon.
 * 
 * @param status - Raw status string
 * @param intensity - Color intensity
 * @returns Object with classes and suggested icon name
 */
export function getStatusStyle(
  status: string,
  intensity: IntensityLevel = 'moderate'
): {
  classes: string;
  statusType: StatusType;
  iconName: string;
} {
  const statusType = mapToStatusType(status);
  const classes = getStatusClasses(statusType, intensity);
  
  const iconMap: Record<StatusType, string> = {
    success: 'check-circle',
    warning: 'alert-circle',
    danger: 'x-circle',
    info: 'info',
    neutral: 'circle',
  };
  
  return {
    classes,
    statusType,
    iconName: iconMap[statusType],
  };
}

// =============================================================================
// AVATAR/ICON BACKGROUND COLORS
// =============================================================================

/**
 * Color classes for avatar backgrounds.
 * Ensures readable contrast and consistent styling.
 */
export const avatarColors = [
  'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
  'bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300',
  'bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300',
  'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300',
  'bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300',
  'bg-info-100 dark:bg-info-900 text-info-700 dark:text-info-300',
] as const;

/**
 * Get a consistent avatar color based on a string (e.g., name or ID).
 * Uses a simple hash to ensure the same input always returns the same color.
 * 
 * @param identifier - String to hash for color selection
 * @returns Tailwind class string for avatar styling
 */
export function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

// =============================================================================
// CHART COLORS
// =============================================================================

/**
 * Semantic chart color palette.
 * Uses CSS variables that adapt to light/dark mode.
 */
export const chartColors = {
  /** Primary series color (violet) */
  primary: 'hsl(var(--color-primary))',
  /** Secondary series color (teal) */
  secondary: 'hsl(var(--color-secondary))',
  /** Accent series color (pink) */
  accent: 'hsl(var(--color-accent))',
  /** Success color for positive metrics */
  success: 'hsl(var(--color-success))',
  /** Warning color for cautionary metrics */
  warning: 'hsl(var(--color-warning))',
  /** Danger color for negative metrics */
  danger: 'hsl(var(--color-danger))',
  /** Info color for neutral metrics */
  info: 'hsl(var(--color-info))',
  /** Muted color for background elements */
  muted: 'hsl(var(--color-muted))',
} as const;

/**
 * Array of chart colors for multi-series charts.
 */
export const chartColorArray = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.accent,
  chartColors.info,
  chartColors.success,
  chartColors.warning,
] as const;

/**
 * Get chart color by index (cycles through palette).
 */
export function getChartColor(index: number): string {
  return chartColorArray[index % chartColorArray.length];
}
