# DRAMAC CMS Design System

> **Version**: 1.0.0  
> **Last Updated**: January 30, 2026

## Overview

The DRAMAC Design System provides a centralized configuration for all visual aspects of the platform. It ensures consistency across all UI components and enables easy customization through a single source of truth.

## Quick Start

```tsx
// Import design utilities
import { 
  getStatusClasses, 
  mapToStatusType,
  getAvatarColor,
  chartColors 
} from '@/config/brand';

// Use semantic status colors
<Badge className={getStatusClasses('success', 'subtle')}>Active</Badge>

// Auto-map status strings to colors
const statusType = mapToStatusType('pending'); // 'warning'

// Get consistent avatar colors
<Avatar className={getAvatarColor('John Doe')}>JD</Avatar>
```

## File Structure

```
src/config/brand/
├── index.ts              # Main exports (import from here)
├── types.ts              # TypeScript type definitions
├── tokens.ts             # Design tokens (spacing, typography, etc.)
├── semantic-colors.ts    # Semantic color utilities
├── identity.ts           # Brand identity (name, logo, SEO)
├── css-generator.ts      # CSS variable generator
├── responsive.ts         # Responsive utilities
├── animations.ts         # Animation presets
├── accessibility.ts      # A11y utilities
├── hooks.ts              # React hooks
├── colors/
│   ├── index.ts          # Color definitions
│   └── utils.ts          # Color manipulation utilities
└── README.md             # This file
```

## Color System

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#8b5cf6` (Violet) | CTAs, links, active states |
| **Secondary** | `#14b8a6` (Teal) | Accents, charts |
| **Accent** | `#ec4899` (Pink) | Highlights, promotions |

### Status Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Success** | `#10b981` (Emerald) | Success states, positive feedback |
| **Warning** | `#f59e0b` (Amber) | Warnings, pending states |
| **Danger** | `#ef4444` (Red) | Errors, destructive actions |
| **Info** | `#0ea5e9` (Sky) | Information, neutral feedback |

### Color Scales

Each color has 11 shades (50-950) for maximum flexibility:

```css
/* Example: Primary color scale */
--color-primary-50: 258 23% 97%;   /* Lightest */
--color-primary-100: 258 31% 94%;
--color-primary-200: 258 45% 86%;
--color-primary-300: 258 63% 77%;
--color-primary-400: 258 77% 66%;
--color-primary-500: 258 90% 55%;  /* Default */
--color-primary-600: 258 90% 47%;
--color-primary-700: 258 86% 39%;
--color-primary-800: 258 81% 32%;
--color-primary-900: 258 77% 24%;
--color-primary-950: 258 72% 14%;  /* Darkest */
```

## Using Semantic Colors

### StatusBadge Component

For status indicators, use the `StatusBadge` component:

```tsx
import { StatusBadge } from '@/components/ui/badge';

// Auto-maps status strings to appropriate colors
<StatusBadge status="active" />      // Green
<StatusBadge status="pending" />     // Yellow
<StatusBadge status="failed" />      // Red
<StatusBadge status="new" />         // Blue

// With custom label
<StatusBadge status="completed" label="Done" />

// With intensity control
<StatusBadge status="error" intensity="strong" />
```

### Status Mapping

The `mapToStatusType` function automatically maps common status strings:

**Success (Green):**
- active, completed, confirmed, published, approved, enabled, connected, online, healthy, passed, verified, resolved

**Warning (Yellow):**
- warning, pending, scheduled, processing, draft, paused, reviewing, awaiting, queued

**Danger (Red):**
- danger, error, failed, cancelled, rejected, expired, disabled, offline, disconnected, overdue

**Info (Blue):**
- info, new, updated, modified, changed

### Manual Status Classes

For more control, use `getStatusClasses`:

```tsx
import { getStatusClasses } from '@/config/brand';

// Subtle (light background)
<div className={getStatusClasses('success', 'subtle')}>
  Light green background, dark green text
</div>

// Moderate (with border)
<div className={getStatusClasses('warning', 'moderate')}>
  Light yellow background, dark yellow text, yellow border
</div>

// Strong (full color)
<div className={getStatusClasses('danger', 'strong')}>
  Red background, white text
</div>
```

## Avoiding Hardcoded Colors

❌ **Don't use hardcoded Tailwind colors:**
```tsx
// Bad
<div className="bg-green-100 text-green-800">Active</div>
<div className="bg-red-500 text-white">Error</div>
```

✅ **Use semantic tokens instead:**
```tsx
// Good
<div className={getStatusClasses('success', 'subtle')}>Active</div>
<div className={getStatusClasses('danger', 'strong')}>Error</div>

// Or with Badge component
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Error</Badge>
```

## Typography

### Font Families

```css
--font-sans: Geist Sans (system fallbacks)
--font-mono: Geist Mono (monospace fallbacks)
```

### Font Sizes

| Size | Value | Usage |
|------|-------|-------|
| xs | 0.75rem (12px) | Fine print, labels |
| sm | 0.875rem (14px) | Secondary text |
| base | 1rem (16px) | Body text |
| lg | 1.125rem (18px) | Emphasis |
| xl | 1.25rem (20px) | Section titles |
| 2xl | 1.5rem (24px) | Page subtitles |
| 3xl | 1.875rem (30px) | Page titles |
| 4xl | 2.25rem (36px) | Hero text |

## Spacing

Based on 4px unit scale:

| Token | Value | Pixels |
|-------|-------|--------|
| 1 | 0.25rem | 4px |
| 2 | 0.5rem | 8px |
| 3 | 0.75rem | 12px |
| 4 | 1rem | 16px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 0.125rem | Subtle rounding |
| DEFAULT | 0.25rem | Default rounding |
| md | 0.375rem | Medium rounding |
| lg | 0.5rem | Cards, inputs |
| xl | 0.75rem | Large cards |
| 2xl | 1rem | Modals |
| full | 9999px | Pills, avatars |

## Charts & Data Visualization

Use the chart color palette for consistent data visualization:

```tsx
import { chartColors, chartColorArray, getChartColor } from '@/config/brand';

// Named colors
<Line stroke={chartColors.primary} />
<Bar fill={chartColors.success} />

// Array for multi-series
{data.map((series, i) => (
  <Line key={i} stroke={getChartColor(i)} />
))}
```

## Dark Mode

All semantic colors automatically adapt to dark mode. Use the design tokens and they will work correctly:

```tsx
// This automatically adapts to dark mode
<div className="bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400">
  Works in both modes
</div>

// Or use getStatusClasses which includes dark variants
<div className={getStatusClasses('success', 'subtle')}>
  Auto dark mode
</div>
```

## Best Practices

1. **Always import from `@/config/brand`** - Don't access internal files directly
2. **Use semantic names** - `success` instead of `green`, `danger` instead of `red`
3. **Prefer StatusBadge** - For status indicators, use the pre-built component
4. **Check dark mode** - Preview changes in both light and dark themes
5. **Use CSS variables** - For custom components, reference `--color-*` variables

## Updating the Design System

To change colors or tokens:

1. Edit the source files in `src/config/brand/`
2. Run `pnpm dev` to see changes
3. CSS variables are auto-generated from TypeScript config
4. Update `brand-variables.css` if needed (usually auto-generated)

## Related Files

- `src/app/globals.css` - Global styles and CSS imports
- `src/styles/brand-variables.css` - Generated CSS variables
- `tailwind.config.ts` - Tailwind configuration
- `src/components/ui/` - shadcn/ui components using design tokens
