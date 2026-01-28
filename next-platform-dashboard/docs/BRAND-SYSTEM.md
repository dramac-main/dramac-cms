# DRAMAC CMS Brand System

Enterprise-grade, scalable branding configuration system for DRAMAC CMS.

## Overview

The brand system provides a **single source of truth** for all brand-related configuration:

- 🎨 **Colors** - Full color scales (50-950) for all brand and status colors
- 📝 **Typography** - Font families, sizes, weights, and line heights
- 📏 **Spacing** - Consistent spacing scale matching Tailwind
- 🔲 **Borders** - Border radius and shadow scales
- 📱 **Responsive** - Breakpoint configuration
- 🏢 **Identity** - Brand name, tagline, logos, SEO metadata
- 🔗 **Social** - Social media links
- 📊 **Analytics** - Analytics provider configuration

## Quick Start

### Using in Components

```tsx
// Import what you need
import { brand, colors, getColor, getHex } from '@/config/brand';

// Access brand identity
const appName = brand.identity.name;  // "DRAMAC"
const tagline = brand.identity.tagline;  // "Build beautiful websites..."

// Get colors
const primaryHex = getHex('primary', 500);  // "#6366f1"
const successHsl = getHsl('success', 600);  // "161 94% 47%"

// Access full color scale
const primary100 = colors.primary[100].hex;  // "#e0e7ff"
const primary900 = colors.primary[900].hex;  // "#312e81"
```

### Using React Hooks

```tsx
'use client';

import { useBrand, useColors, useIdentity } from '@/config/brand/hooks';

function MyComponent() {
  // All brand config
  const brand = useBrand();
  
  // Theme-aware colors
  const { theme, colors } = useColors();
  
  // Identity with copyright
  const { name, copyright } = useIdentity();
  
  return (
    <div>
      <h1>{name}</h1>
      <p style={{ color: colors.brand.primary.scale[500].hex }}>
        Primary colored text
      </p>
      <footer>{copyright}</footer>
    </div>
  );
}
```

### Using Tailwind Classes

All brand colors are available as Tailwind utilities with full scales:

```tsx
// Primary colors (50-950)
<button className="bg-primary-500 hover:bg-primary-600 text-white">
  Primary Button
</button>

// Status colors with scales
<div className="bg-success-100 text-success-800 border-success-200">
  Success message
</div>

// Default shades (500)
<span className="text-primary">Default primary</span>
<span className="text-danger">Default danger</span>
```

## File Structure

```
src/config/brand/
├── index.ts              # Main exports (import from here)
├── types.ts              # TypeScript type definitions
├── identity.ts           # Brand identity, SEO, social, analytics
├── tokens.ts             # Typography, spacing, borders, shadows
├── hooks.ts              # React hooks for components
├── css-generator.ts      # CSS variable generation utilities
└── colors/
    ├── index.ts          # Color configuration and scales
    └── utils.ts          # Color manipulation utilities

src/styles/
└── brand-variables.css   # Generated CSS variables
```

## Configuration Files

### Changing Brand Colors

Edit `src/config/brand/colors/index.ts`:

```typescript
// Primary brand color - Indigo
const PRIMARY_HEX: HexColor = '#6366f1';  // Change this

// Secondary brand color - Violet  
const SECONDARY_HEX: HexColor = '#8b5cf6';  // Change this

// Accent brand color - Pink
const ACCENT_HEX: HexColor = '#ec4899';  // Change this
```

### Changing Brand Identity

Edit `src/config/brand/identity.ts`:

```typescript
export const identity: BrandIdentity = {
  name: 'DRAMAC',
  tagline: 'Build beautiful websites for your clients',
  domain: 'dramac.io',
  url: 'https://dramac.io',
  supportEmail: 'support@dramac.io',
  // ... more fields
};
```

### Changing Social Links

Edit `src/config/brand/identity.ts`:

```typescript
export const social: SocialLinks = {
  twitter: 'https://twitter.com/dramac_io',
  github: 'https://github.com/dramac-main',
  discord: 'https://discord.gg/dramac',
  // Set to undefined to hide
  facebook: undefined,
};
```

## Color System

### Color Scales

Each color has an 11-shade scale (50-950):

| Shade | Usage |
|-------|-------|
| 50 | Subtle backgrounds |
| 100 | Hover backgrounds, badges |
| 200 | Active backgrounds |
| 300 | Disabled text |
| 400 | Placeholder text |
| 500 | **Default shade** (main color) |
| 600 | Hover states |
| 700 | Active/pressed states |
| 800 | High contrast text |
| 900 | Headings, emphasis |
| 950 | Maximum contrast |

### Available Colors

**Brand Colors:**
- `primary` - Main brand color (Indigo)
- `secondary` - Secondary accent (Violet)
- `accent` - Special highlights (Pink)

**Status Colors:**
- `success` - Positive states (Emerald)
- `warning` - Caution states (Amber)
- `danger` - Error/destructive (Red)
- `info` - Informational (Sky Blue)

### Color Utilities

```typescript
import { 
  getColor, 
  getHex, 
  getHsl,
  lighten,
  darken,
  withAlpha,
  getContrastRatio,
  meetsContrastRequirement,
} from '@/config/brand';

// Get full color value
const color = getColor('primary', 500);
// { hex: '#6366f1', rgb: { r: 99, g: 102, b: 241 }, hsl: '239 84% 55%' }

// Manipulate colors
const lighter = lighten(color, 20);
const darker = darken(color, 10);
const transparent = withAlpha(color, 0.5);  // "rgba(99, 102, 241, 0.5)"

// Check contrast for accessibility
const passes = meetsContrastRequirement(foreground, background, 'AA', 'normal');
```

## Backward Compatibility

The old `APP_NAME` and `APP_DESCRIPTION` exports still work:

```typescript
// Old way (still works)
import { APP_NAME, APP_DESCRIPTION } from '@/config/constants';

// New way (recommended)
import { identity } from '@/config/brand';
const name = identity.name;
const description = identity.description;
```

## Regenerating CSS Variables

If you modify color values, regenerate the CSS:

```bash
npx tsx scripts/generate-brand-css.ts
```

This updates `src/styles/brand-variables.css`.

## White-Label Support

The brand system is designed for easy white-labeling:

```typescript
import { brand, type PartialSiteConfig } from '@/config/brand';

// Override for a specific tenant
const tenantBrand: PartialSiteConfig = {
  identity: {
    name: 'TenantCMS',
    domain: 'tenant.com',
  },
  colors: {
    // Custom color config...
  },
};

// Merge with defaults
const mergedBrand = { ...brand, ...tenantBrand };
```

## Best Practices

1. **Import from index** - Always import from `@/config/brand`, not individual files
2. **Use hooks in components** - Use the React hooks for theme-aware colors
3. **Use Tailwind classes** - Prefer Tailwind utilities over inline styles
4. **Check accessibility** - Use `meetsContrastRequirement()` for color combinations
5. **Keep colors semantic** - Use `success`, `danger` etc. for appropriate contexts

## Migration Guide

### From Old Constants

```typescript
// Before
import { APP_NAME, APP_DESCRIPTION } from '@/config/constants';

// After
import { identity } from '@/config/brand';
const { name, tagline } = identity;
```

### From Hardcoded Colors

```typescript
// Before
<button className="bg-indigo-600 hover:bg-indigo-700">

// After
<button className="bg-primary-600 hover:bg-primary-700">
```

## TypeScript Support

Full TypeScript support with strict types:

```typescript
import type { 
  ColorScale,
  BrandIdentity,
  SiteConfig,
  ColorName,
} from '@/config/brand';

// Type-safe color access
const colorName: ColorName = 'primary';
const scale: ColorScale = colors[colorName];
```
