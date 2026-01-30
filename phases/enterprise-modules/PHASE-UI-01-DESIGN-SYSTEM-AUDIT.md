# PHASE-UI-01: Design System Audit & Token Consolidation

## Overview

- **Objective**: Audit and consolidate the design system, ensuring all colors, typography, spacing, and other tokens are centralized and consistently used across the application
- **Scope**: Design tokens, CSS variables, component theming, hardcoded color fixes
- **Dependencies**: None (foundational phase)
- **Estimated Effort**: 4 hours

## Pre-Implementation Checklist

- [x] Memory bank reviewed (all 6 files)
- [x] Affected files identified
- [x] Patterns verified
- [x] No conflicts detected

## Current State Analysis

### What Exists ✅

The platform already has a comprehensive design system at `src/config/brand/`:

1. **Color System** (`colors/index.ts`)
   - Primary: `#8b5cf6` (Violet)
   - Secondary: `#14b8a6` (Teal)
   - Accent: `#ec4899` (Pink)
   - Status colors: Success, Warning, Danger, Info
   - Full 50-950 scales for all colors

2. **Design Tokens** (`tokens.ts`)
   - Typography (Geist font family, size scales)
   - Spacing (4px base unit)
   - Border radius (sm → full)
   - Shadows (sm → 2xl)
   - Breakpoints (xs → 2xl)

3. **CSS Variables** (`styles/brand-variables.css`)
   - All tokens as CSS custom properties
   - Generated from TypeScript config

4. **Tailwind Integration** (`tailwind.config.ts`)
   - Color scales mapped to CSS variables
   - Custom gradients and shadows

### Issues Found ⚠️

1. **Duplicate Token Definitions**
   - Spacing defined in both `globals.css` AND `brand-variables.css`
   - Typography tokens duplicated
   - Some OKLCH colors mixed with HSL colors

2. **Hardcoded Colors in Components**
   - `bg-blue-600`, `bg-green-100`, `bg-red-500` used instead of semantic tokens
   - Found in: Social Media module, CRM module, test modules

3. **Missing Semantic Utilities**
   - No utility functions to easily use design tokens in code
   - Status colors not exposed via utility functions

4. **Inconsistent Color Format**
   - Mix of HSL (`--color-primary-500`) and OKLCH (`--primary`)
   - shadcn/ui variables conflict with brand system

## Implementation Steps

### Step 1: Clean Up CSS Variable Conflicts

**File**: `src/app/globals.css`
**Action**: Remove duplicate token definitions and consolidate with brand-variables.css

The globals.css has OKLCH variables from shadcn that conflict with our HSL brand system. We need to align them.

### Step 2: Create Semantic Color Utility Functions

**File**: `src/config/brand/semantic-colors.ts` (NEW)
**Action**: Create utility functions for semantic color usage

```typescript
/**
 * Semantic Color Utilities
 * 
 * Provides type-safe access to semantic colors with proper
 * dark mode support and consistent API.
 */

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type IntensityLevel = 'subtle' | 'moderate' | 'strong';

/**
 * Get semantic background/text color classes for status indicators.
 * Uses design tokens instead of hardcoded colors.
 */
export const statusColors: Record<StatusType, {
  bg: string;
  bgSubtle: string;
  text: string;
  textSubtle: string;
  border: string;
}> = {
  success: {
    bg: 'bg-success',
    bgSubtle: 'bg-success-50 dark:bg-success-950/30',
    text: 'text-success-foreground',
    textSubtle: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-800',
  },
  warning: {
    bg: 'bg-warning',
    bgSubtle: 'bg-warning-50 dark:bg-warning-950/30',
    text: 'text-warning-foreground',
    textSubtle: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-800',
  },
  danger: {
    bg: 'bg-danger',
    bgSubtle: 'bg-danger-50 dark:bg-danger-950/30',
    text: 'text-danger-foreground',
    textSubtle: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-800',
  },
  info: {
    bg: 'bg-info',
    bgSubtle: 'bg-info-50 dark:bg-info-950/30',
    text: 'text-info-foreground',
    textSubtle: 'text-info-700 dark:text-info-400',
    border: 'border-info-200 dark:border-info-800',
  },
  neutral: {
    bg: 'bg-muted',
    bgSubtle: 'bg-muted/50',
    text: 'text-muted-foreground',
    textSubtle: 'text-muted-foreground/80',
    border: 'border-border',
  },
};

/**
 * Get status color classes for badges, pills, status indicators.
 */
export function getStatusClasses(status: StatusType, intensity: IntensityLevel = 'moderate'): string {
  const colors = statusColors[status];
  
  switch (intensity) {
    case 'subtle':
      return `${colors.bgSubtle} ${colors.textSubtle} ${colors.border}`;
    case 'moderate':
      return `${colors.bgSubtle} ${colors.textSubtle}`;
    case 'strong':
      return `${colors.bg} ${colors.text}`;
    default:
      return `${colors.bgSubtle} ${colors.textSubtle}`;
  }
}

/**
 * Map common status strings to StatusType.
 */
export function mapToStatusType(status: string): StatusType {
  const lowerStatus = status.toLowerCase();
  
  // Success states
  if (['success', 'active', 'completed', 'confirmed', 'published', 'approved', 'enabled'].includes(lowerStatus)) {
    return 'success';
  }
  
  // Warning states  
  if (['warning', 'pending', 'scheduled', 'processing', 'draft', 'paused'].includes(lowerStatus)) {
    return 'warning';
  }
  
  // Danger states
  if (['danger', 'error', 'failed', 'cancelled', 'rejected', 'expired', 'disabled'].includes(lowerStatus)) {
    return 'danger';
  }
  
  // Info states
  if (['info', 'new', 'updated', 'modified'].includes(lowerStatus)) {
    return 'info';
  }
  
  return 'neutral';
}
```

### Step 3: Update Badge Component with Semantic Colors

**File**: `src/components/ui/badge.tsx`
**Action**: Add utility function for dynamic status badges

### Step 4: Update Social Media Components

Fix hardcoded colors in the Social Media module to use semantic tokens.

### Step 5: Add Design System Documentation

**File**: `src/config/brand/README.md` (NEW)
**Action**: Document the design system for developers

## Verification Steps

1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Visual verification: Check dark mode renders correctly
4. Manual testing: Badge, Button variants display properly

## Rollback Plan

If issues arise:
1. Revert files: `globals.css`, `semantic-colors.ts`
2. No database changes
3. Clear `.next` cache: `rm -rf .next`

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/config/brand/semantic-colors.ts` | Created | Semantic color utilities |
| `src/config/brand/index.ts` | Modified | Export semantic colors |
| `src/config/brand/README.md` | Created | Design system documentation |
| `src/app/globals.css` | Modified | Remove duplicate tokens, align variables |
| `src/components/ui/badge.tsx` | Modified | Add StatusBadge utility |
| Social media components | Modified | Replace hardcoded colors |
