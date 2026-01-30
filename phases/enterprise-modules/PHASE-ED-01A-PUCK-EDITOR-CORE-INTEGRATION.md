# PHASE-ED-01A: Puck Editor Core Integration

## Overview
- **Objective**: Integrate Puck Editor as the new visual page builder, replacing Craft.js
- **Scope**: Install Puck, create configuration, build component library, create editor wrapper
- **Dependencies**: None (foundational phase)
- **Estimated Effort**: ~16 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified
- [x] No conflicts detected

## Why Puck Editor?

| Feature | Puck | Craft.js (Current) |
|---------|------|-------------------|
| GitHub Stars | 11.8k+ | 8.5k |
| Active Development | ✅ Very Active | ⚠️ Slower |
| Next.js 16 Support | ✅ Native | ⚠️ Requires patches |
| AI Integration | ✅ Official plugin | ❌ None |
| TypeScript | ✅ First-class | ✅ Good |
| Server Components | ✅ Supported | ❌ Client only |
| License | MIT | MIT |

## Implementation Steps

### Step 1: Install Puck Editor Dependencies
**Action**: Add packages to package.json

```bash
pnpm add @measured/puck
```

### Step 2: Create Puck Configuration
**File**: `src/components/editor/puck/puck-config.tsx`
**Action**: Create

Configuration defines all available components, their fields, and rendering logic.

### Step 3: Create Puck Component Library
**File**: `src/components/editor/puck/components/` (directory)
**Action**: Create

Migrate existing Craft.js components to Puck format:
- Layout: Root, Section, Columns, Container, Card, Spacer, Divider
- Typography: Heading, Text
- Media: Image, Video, Map
- Interactive: Button, Form, FormField
- Sections: Hero, Features, CTA, Testimonials, FAQ, Stats, Team, Gallery
- Navigation: Navbar, Footer, SocialLinks
- E-Commerce: ProductGrid, ProductCard, CartWidget

### Step 4: Create Puck Editor Wrapper
**File**: `src/components/editor/puck/puck-editor-wrapper.tsx`
**Action**: Create

Client component that wraps Puck with:
- Save functionality
- Preview mode
- Device switching
- Toolbar integration

### Step 5: Create Puck Types
**File**: `src/types/puck.ts`
**Action**: Create

TypeScript definitions for Puck data structures.

### Step 6: Create Editor Integration Hook
**File**: `src/components/editor/puck/hooks/use-puck-editor.ts`
**Action**: Create

Custom hook for editor state management.

## Component Migration Strategy

### Puck Component Structure
```typescript
// Example Puck component definition
const Hero: ComponentConfig<HeroProps> = {
  label: "Hero Section",
  fields: {
    title: { type: "text", label: "Title" },
    subtitle: { type: "textarea", label: "Subtitle" },
    buttonText: { type: "text", label: "Button Text" },
    alignment: {
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    title: "Welcome",
    subtitle: "Build amazing experiences",
    buttonText: "Get Started",
    alignment: "center",
  },
  render: ({ title, subtitle, buttonText, alignment }) => (
    <section style={{ textAlign: alignment }}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <button>{buttonText}</button>
    </section>
  ),
};
```

### Components to Migrate (35 total)

| Category | Components |
|----------|------------|
| Layout | Root, Section, Columns, Column, Container, Card, Spacer, Divider |
| Typography | Heading, Text |
| Buttons | Button, ButtonComponent |
| Media | Image, ImageComponent, Video, Map |
| Sections | Hero, HeroSection, Features, FeatureGrid, CTA, CTASection, Testimonials, FAQ, Stats, Team, Gallery |
| Navigation | Navbar, Navigation, Footer, SocialLinks |
| Forms | Form, FormField, ContactForm, Newsletter |
| E-Commerce | ProductGrid, ProductCard, CartWidget, FeaturedProducts, AddToCartButton, CategoryMenu |

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| package.json | Modified | Add @measured/puck |
| src/types/puck.ts | Created | Puck type definitions |
| src/components/editor/puck/puck-config.tsx | Created | Component configuration |
| src/components/editor/puck/puck-editor-wrapper.tsx | Created | Editor wrapper |
| src/components/editor/puck/components/*.tsx | Created | Migrated components |
| src/components/editor/puck/hooks/use-puck-editor.ts | Created | Editor hooks |
| src/components/editor/puck/index.ts | Created | Barrel exports |

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing:
   - Navigate to /dashboard/sites/[siteId]/editor
   - Verify editor loads with Puck
   - Add components via drag-drop
   - Modify component properties
   - Save and reload page

## Rollback Plan
If issues arise:
1. Remove Puck package
2. Restore original editor routes
3. Craft.js remains available for fallback

## Notes
- Puck uses a different data structure than Craft.js
- Migration utility needed in PHASE-ED-01B
- Both editors can coexist during transition
