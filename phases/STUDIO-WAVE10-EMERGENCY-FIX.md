# TASK: Emergency Platform Recovery - WAVE 10 (Critical Fix)

You are a senior software architect performing an **EMERGENCY RECOVERY** of the DRAMAC CMS platform. Wave 9 (Puck Removal) caused critical issues across the editor, components, preview, and publish functionality.

## ⚠️ CRITICAL MISSION

**DO NOT START CODING UNTIL YOU COMPLETE THE DEEP SCAN.**

Your mission is to:
1. **DEEP SCAN** - Read and understand EVERY file in the platform
2. **DOCUMENT** - List every broken feature, missing component, and error
3. **FIX** - Repair or recreate everything that's broken
4. **VERIFY** - Test every feature end-to-end

---

## 🔍 PHASE 1: DEEP PLATFORM SCAN (MANDATORY FIRST STEP)

Before fixing ANYTHING, you MUST scan and understand the entire platform. Read these directories completely:

### 1.1 Core Application Structure
```
src/app/                           # All routes - understand every page
src/app/studio/                    # Editor routes
src/app/preview/                   # Preview routes
src/app/(public)/                  # Public site rendering
src/app/(dashboard)/               # Dashboard routes
```

### 1.2 Studio Editor (The Broken Part)
```
src/components/studio/             # ALL studio components
src/components/studio/core/        # Core editor components
src/components/studio/panels/      # Left, Right, Bottom panels
src/components/studio/fields/      # Field editors
src/components/studio/ai/          # AI integration
src/components/studio/dnd/         # Drag and drop
src/components/studio/features/    # Extra features
src/components/studio/blocks/      # Component renders (MAY BE MISSING)
src/components/studio/onboarding/  # Tutorial system
src/components/studio/help/        # Help system
```

### 1.3 Studio Logic
```
src/lib/studio/                    # All editor logic
src/lib/studio/store/              # Zustand stores
src/lib/studio/registry/           # Component registry
src/lib/studio/engine/             # Renderer, serializer, optimizer
src/lib/studio/utils/              # Utilities
src/lib/studio/hooks/              # Custom hooks
src/lib/studio/data/               # Templates, presets
```

### 1.4 Types
```
src/types/studio.ts                # Studio types
src/types/studio-templates.ts      # Template types
src/types/studio-symbols.ts        # Symbol types
```

### 1.5 Existing Components (What Should Exist)
```
src/components/studio/blocks/
├── layout/                        # Section, Container, Columns, Spacer, Grid, Flex
├── typography/                    # Heading, Text, RichText, Label, Quote
├── media/                         # Image, Video, Icon, Gallery
├── interactive/                   # Button, Link, Accordion, Tabs, Modal
├── marketing/                     # Hero, CTA, Testimonial, Pricing, FAQ
├── ecommerce/                     # ProductCard, Cart, Checkout (if module installed)
├── forms/                         # Input, Select, Checkbox, Form
└── navigation/                    # Navbar, Footer, Breadcrumb, Menu
```

### 1.6 Related Systems
```
src/lib/supabase/                  # Database client
src/components/sites/              # Site management
src/components/pages/              # Page management
```

---

## 📋 PHASE 2: CREATE ISSUE INVENTORY

After scanning, create a comprehensive list of ALL issues found:

### Issue Categories

#### A. Missing Components
```
[ ] List every component type that should exist but doesn't
[ ] List every component that exists but is broken
[ ] List every component with incomplete props/fields
```

#### B. Editor Functionality
```
[ ] Canvas not rendering
[ ] Components not selectable
[ ] Drag and drop not working
[ ] Properties panel not showing fields
[ ] Save not working
[ ] Load not working
[ ] Undo/redo broken
[ ] Keyboard shortcuts broken
[ ] AI chat not working
[ ] Layers panel broken
[ ] History panel broken
```

#### C. Preview & Publish
```
[ ] Preview route broken (src/app/preview/...)
[ ] Public site route broken (src/app/(public)/...)
[ ] StudioRenderer missing or broken
[ ] Components not rendering in preview
[ ] Styles not applying
[ ] Responsive design broken
```

#### D. Type Errors
```
[ ] Run: npx tsc --noEmit
[ ] Document every TypeScript error
[ ] Fix every type mismatch
```

#### E. Import Errors
```
[ ] Missing imports
[ ] Circular dependencies
[ ] Broken module paths
```

#### F. Database/API Issues
```
[ ] Page data not saving
[ ] Page data not loading
[ ] API routes broken
```

---

## 🔧 PHASE 3: COMPONENT RECONSTRUCTION

If components are missing or broken, you MUST recreate them with FULL editing capabilities.

### Component Requirements (CRITICAL)

Every component MUST have:

```typescript
// 1. Type definition with ResponsiveValue support
interface HeadingProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  fontSize: ResponsiveValue<string>;
  fontWeight: ResponsiveValue<string>;
  textAlign: ResponsiveValue<'left' | 'center' | 'right'>;
  color: string;
  margin: ResponsiveValue<SpacingValue>;
  padding: ResponsiveValue<SpacingValue>;
  // Animation
  animation?: AnimationConfig;
  // States
  hoverStyles?: Partial<HeadingProps>;
  // Visibility
  hideOn?: Breakpoint[];
}

// 2. ComponentDefinition in registry
export const HeadingDefinition: ComponentDefinition = {
  type: 'Heading',
  label: 'Heading',
  description: 'Text heading with customizable size and style',
  category: 'Typography',
  icon: 'heading',
  
  fields: {
    text: { type: 'text', label: 'Text', required: true },
    level: { 
      type: 'select', 
      label: 'Level',
      options: [
        { label: 'H1', value: 'h1' },
        { label: 'H2', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
        { label: 'H5', value: 'h5' },
        { label: 'H6', value: 'h6' },
      ],
      defaultValue: 'h2',
    },
    fontSize: { type: 'text', label: 'Font Size', responsive: true },
    fontWeight: { 
      type: 'select', 
      label: 'Font Weight',
      options: [
        { label: 'Normal', value: '400' },
        { label: 'Medium', value: '500' },
        { label: 'Semibold', value: '600' },
        { label: 'Bold', value: '700' },
      ],
      responsive: true,
    },
    textAlign: { type: 'select', label: 'Align', responsive: true },
    color: { type: 'color', label: 'Color' },
    margin: { type: 'spacing', label: 'Margin', responsive: true },
    padding: { type: 'spacing', label: 'Padding', responsive: true },
  },
  
  defaultProps: {
    text: 'Heading',
    level: 'h2',
    fontSize: { mobile: '24px', tablet: '32px', desktop: '40px' },
    fontWeight: { mobile: '700' },
    textAlign: { mobile: 'left' },
    color: 'inherit',
    margin: { mobile: { top: '0', right: '0', bottom: '16px', left: '0' } },
    padding: { mobile: { top: '0', right: '0', bottom: '0', left: '0' } },
  },
  
  render: HeadingRender,
  
  ai: {
    description: 'A text heading. Can change text, size, weight, color, alignment.',
    canModify: ['text', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    suggestions: ['Make it bigger', 'Center align', 'Change to bold', 'Make it exciting'],
  },
};

// 3. Render component
export function HeadingRender({ text, level, fontSize, fontWeight, textAlign, color, margin, padding, ...props }: HeadingProps) {
  const Tag = level as keyof JSX.IntrinsicElements;
  
  const styles = useMemo(() => ({
    fontSize: getResponsiveValue(fontSize),
    fontWeight: getResponsiveValue(fontWeight),
    textAlign: getResponsiveValue(textAlign),
    color,
    margin: formatSpacing(margin),
    padding: formatSpacing(padding),
  }), [fontSize, fontWeight, textAlign, color, margin, padding]);
  
  return (
    <Tag 
      className={cn(
        'studio-heading',
        generateResponsiveClasses(fontSize, 'text'),
        generateResponsiveClasses(fontWeight, 'font'),
        generateResponsiveClasses(textAlign, 'text'),
      )}
      style={styles}
    >
      {text}
    </Tag>
  );
}
```

### Required Components List

You MUST ensure ALL of these exist and work:

#### Layout Components (6)
```
1. Section      - Full-width container with background options
2. Container    - Max-width centered container
3. Columns      - Multi-column layout (2-6 columns)
4. Grid         - CSS Grid layout
5. Flex         - Flexbox layout
6. Spacer       - Vertical spacing
```

#### Typography Components (5)
```
1. Heading      - H1-H6 with full styling
2. Text         - Paragraph text
3. RichText     - TipTap-powered rich text
4. Label        - Small label text
5. Quote        - Blockquote with citation
```

#### Media Components (4)
```
1. Image        - Responsive image with srcset
2. Video        - Video embed (YouTube, Vimeo, self-hosted)
3. Icon         - Lucide icon picker
4. Gallery      - Image gallery/carousel
```

#### Interactive Components (5)
```
1. Button       - CTA button with variants
2. Link         - Text or button link
3. Accordion    - Collapsible sections
4. Tabs         - Tabbed content
5. Modal        - Popup modal (trigger + content)
```

#### Marketing Components (5)
```
1. Hero         - Hero section with headline, text, CTA
2. CTA          - Call-to-action banner
3. Testimonial  - Customer testimonial card
4. Pricing      - Pricing table/card
5. FAQ          - Frequently asked questions
```

#### Form Components (4)
```
1. Input        - Text input field
2. Select       - Dropdown select
3. Checkbox     - Checkbox/toggle
4. Form         - Form container with submit
```

#### Navigation Components (3)
```
1. Navbar       - Top navigation bar
2. Footer       - Page footer
3. Breadcrumb   - Breadcrumb navigation
```

**TOTAL: 32 Components (minimum)**

---

## 🎨 PHASE 4: FIX STUDIO EDITOR

### 4.1 Verify Core Systems

```typescript
// Check these files exist and work:

// Store
src/lib/studio/store/editor-store.ts      // Page data, components, actions
src/lib/studio/store/ui-store.ts          // Panel states, zoom, breakpoint
src/lib/studio/store/selection-store.ts   // Selected component
src/lib/studio/store/history-store.ts     // Undo/redo
src/lib/studio/store/template-store.ts    // Templates
src/lib/studio/store/symbol-store.ts      // Symbols

// Registry
src/lib/studio/registry/component-registry.ts  // Component definitions
src/lib/studio/registry/core-components.ts     // Built-in components
src/lib/studio/registry/field-registry.ts      // Field types

// Engine
src/lib/studio/engine/renderer.tsx         // StudioRenderer for preview/public
src/lib/studio/engine/serializer.ts        // Save/load data
src/lib/studio/engine/optimizer.ts         // Output optimization
```

### 4.2 Verify UI Components

```typescript
// Check these exist and render correctly:

// Core
src/components/studio/core/studio-provider.tsx     // Context provider
src/components/studio/core/studio-canvas.tsx       // Main canvas
src/components/studio/core/studio-frame.tsx        // Device frame
src/components/studio/core/component-wrapper.tsx   // Component selection wrapper

// Panels
src/components/studio/panels/left-panel.tsx        // Component library
src/components/studio/panels/right-panel.tsx       // Properties
src/components/studio/panels/bottom-panel.tsx      // Layers
src/components/studio/layout/studio-toolbar.tsx    // Top toolbar

// DnD
src/components/studio/dnd/droppable-canvas.tsx
src/components/studio/dnd/draggable-component.tsx
src/components/studio/dnd/sortable-component.tsx
src/components/studio/dnd/drag-overlay.tsx
```

### 4.3 Verify Field System

```typescript
// All field types must work:
src/components/studio/fields/text-field.tsx
src/components/studio/fields/textarea-field.tsx
src/components/studio/fields/number-field.tsx
src/components/studio/fields/select-field.tsx
src/components/studio/fields/toggle-field.tsx
src/components/studio/fields/color-field.tsx
src/components/studio/fields/image-field.tsx
src/components/studio/fields/link-field.tsx
src/components/studio/fields/spacing-field.tsx
src/components/studio/fields/typography-field.tsx
src/components/studio/fields/array-field.tsx
src/components/studio/fields/object-field.tsx
src/components/studio/fields/richtext-field.tsx
```

---

## 🌐 PHASE 5: FIX PREVIEW & PUBLISH

### 5.1 Fix Preview Route

**File:** `src/app/preview/[siteId]/[pageId]/page.tsx`

```typescript
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PreviewPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { siteId, pageId } = await params;
  const supabase = await createClient();
  
  // Get page data
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .eq('site_id', siteId)
    .single();
  
  if (error || !page) {
    notFound();
  }
  
  // Get site for branding
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();
  
  return (
    <div className="min-h-screen">
      <StudioRenderer 
        data={page.content} 
        siteConfig={site?.config}
        isPreview={true}
      />
    </div>
  );
}
```

### 5.2 Fix Public Site Route

**File:** `src/app/(public)/[domain]/[[...slug]]/page.tsx`

```typescript
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PublicPageProps {
  params: Promise<{ domain: string; slug?: string[] }>;
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { domain, slug } = await params;
  const supabase = await createClient();
  
  // Find site by domain
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('domain', domain)
    .single();
  
  if (!site) {
    notFound();
  }
  
  // Find page by slug (or homepage if no slug)
  const pagePath = slug?.join('/') || '';
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', site.id)
    .eq('path', pagePath || '/')
    .single();
  
  if (!page) {
    notFound();
  }
  
  return (
    <div className="min-h-screen">
      <StudioRenderer 
        data={page.content}
        siteConfig={site.config}
        isPreview={false}
      />
    </div>
  );
}
```

### 5.3 Fix StudioRenderer

**File:** `src/lib/studio/engine/renderer.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import { StudioPageData, StudioComponent } from '@/types/studio';
import { getComponentDefinition } from '../registry/component-registry';
import { ensureStudioFormat } from '../utils/migrate-puck-data';

interface StudioRendererProps {
  data: unknown;
  siteConfig?: Record<string, unknown>;
  isPreview?: boolean;
}

export function StudioRenderer({ data, siteConfig, isPreview }: StudioRendererProps) {
  // Ensure data is in correct format
  const pageData = useMemo(() => {
    if (!data) {
      return null;
    }
    return ensureStudioFormat(data);
  }, [data]);
  
  if (!pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No content to display</p>
      </div>
    );
  }
  
  return (
    <div className="studio-renderer">
      {/* Apply site styles */}
      {siteConfig?.styles && (
        <style dangerouslySetInnerHTML={{ __html: siteConfig.styles as string }} />
      )}
      
      {/* Render components */}
      {pageData.root.children.map((componentId) => (
        <RenderComponent 
          key={componentId}
          componentId={componentId}
          components={pageData.components}
          zones={pageData.zones}
        />
      ))}
    </div>
  );
}

interface RenderComponentProps {
  componentId: string;
  components: Record<string, StudioComponent>;
  zones?: Record<string, string[]>;
}

function RenderComponent({ componentId, components, zones }: RenderComponentProps) {
  const component = components[componentId];
  
  if (!component) {
    console.warn(`Component not found: ${componentId}`);
    return null;
  }
  
  const definition = getComponentDefinition(component.type);
  
  if (!definition) {
    console.warn(`Component definition not found: ${component.type}`);
    return (
      <div className="p-4 border border-dashed border-yellow-500 bg-yellow-50">
        <p className="text-sm text-yellow-700">Unknown component: {component.type}</p>
      </div>
    );
  }
  
  const RenderFn = definition.render;
  
  // Get children if this component has them
  const childContent = component.children?.map((childId) => (
    <RenderComponent 
      key={childId}
      componentId={childId}
      components={components}
      zones={zones}
    />
  ));
  
  // Get zone content if this component has zones
  const zoneContent: Record<string, React.ReactNode> = {};
  if (zones && definition.acceptsChildren) {
    Object.entries(zones).forEach(([zoneId, zoneChildren]) => {
      if (zoneId.startsWith(`${componentId}:`)) {
        const zoneName = zoneId.split(':')[1];
        zoneContent[zoneName] = zoneChildren.map((childId) => (
          <RenderComponent 
            key={childId}
            componentId={childId}
            components={components}
            zones={zones}
          />
        ));
      }
    });
  }
  
  return (
    <RenderFn 
      {...component.props}
      children={childContent}
      zones={zoneContent}
    />
  );
}
```

---

## 🧪 PHASE 6: COMPREHENSIVE TESTING

### 6.1 Build Test
```bash
# Must pass with 0 errors
npx tsc --noEmit
pnpm lint
pnpm build
```

### 6.2 Editor Tests
```
[ ] Navigate to /studio/[siteId]/[pageId]
[ ] Editor loads without errors
[ ] Component library shows all 32+ components
[ ] Can drag component to canvas
[ ] Component renders on canvas
[ ] Click selects component (blue outline)
[ ] Properties panel shows correct fields
[ ] Can edit text fields
[ ] Can edit select fields
[ ] Can edit color fields
[ ] Can edit spacing fields
[ ] Responsive toggle works
[ ] Can switch breakpoints (mobile/tablet/desktop)
[ ] Canvas resizes for breakpoint
[ ] Undo works (Ctrl+Z)
[ ] Redo works (Ctrl+Shift+Z)
[ ] Save works (Ctrl+S)
[ ] Save shows success toast
[ ] Reload shows saved content
[ ] Delete component works (Delete key)
[ ] Duplicate works (Ctrl+D)
[ ] Copy/paste works (Ctrl+C/V)
[ ] Layers panel shows component tree
[ ] Click layer selects component
[ ] Drag layer reorders component
[ ] AI button opens chat
[ ] AI responds with changes
[ ] Templates browser opens
[ ] Can insert template
[ ] Symbols panel shows symbols
[ ] Can create symbol
[ ] Tutorial runs for new users
[ ] Help panel opens
```

### 6.3 Preview Tests
```
[ ] Click Preview button opens new tab
[ ] Preview shows correct content
[ ] All components render correctly
[ ] Responsive design works
[ ] Images load
[ ] Links work
[ ] Interactive components work (accordions, tabs)
```

### 6.4 Publish Tests
```
[ ] Public URL loads site
[ ] Homepage renders
[ ] Subpages render (e.g., /about)
[ ] All components render
[ ] Site is fast (< 1.5s LCP)
[ ] Mobile view works
[ ] Tablet view works
[ ] Desktop view works
```

### 6.5 Dashboard Tests (Regression)
```
[ ] Dashboard loads
[ ] Sites list works
[ ] Create site works → opens Studio
[ ] Pages list works
[ ] Create page works → opens Studio
[ ] Edit page works → opens Studio
[ ] Client management works
[ ] Blog system works
[ ] Media library works
[ ] Module marketplace works
[ ] Billing works
[ ] Settings work
[ ] User profile works
```

---

## 📁 FILE SUMMARY

After this wave, verify these file counts:

| Directory | Min Files | Purpose |
|-----------|-----------|---------|
| `src/components/studio/blocks/layout/` | 6 | Layout components |
| `src/components/studio/blocks/typography/` | 5 | Typography components |
| `src/components/studio/blocks/media/` | 4 | Media components |
| `src/components/studio/blocks/interactive/` | 5 | Interactive components |
| `src/components/studio/blocks/marketing/` | 5 | Marketing components |
| `src/components/studio/blocks/forms/` | 4 | Form components |
| `src/components/studio/blocks/navigation/` | 3 | Navigation components |
| `src/components/studio/core/` | 4+ | Core editor |
| `src/components/studio/panels/` | 3+ | Panels |
| `src/components/studio/fields/` | 12+ | Field editors |
| `src/lib/studio/store/` | 5+ | State stores |
| `src/lib/studio/registry/` | 3+ | Component registry |
| `src/lib/studio/engine/` | 3+ | Rendering engine |

---

## ⚠️ CRITICAL CONSTRAINTS

1. **DO NOT SKIP THE SCAN** - You must read every file before fixing
2. **FIX EVERYTHING** - Not just obvious errors, find hidden issues
3. **32+ COMPONENTS** - All must exist with full editing capabilities
4. **RESPONSIVE** - Every component must support mobile/tablet/desktop
5. **TYPE SAFE** - Zero TypeScript errors
6. **BUILDS** - `pnpm build` must succeed
7. **PREVIEW WORKS** - Both preview and public routes must render
8. **EDITOR WORKS** - Full editing workflow must function

---

## 🎯 SUCCESS CRITERIA

- [ ] `npx tsc --noEmit` = 0 errors
- [ ] `pnpm build` succeeds
- [ ] Editor loads and is fully functional
- [ ] All 32+ components exist and work
- [ ] Drag-and-drop works
- [ ] Properties editing works
- [ ] Responsive editing works
- [ ] Save/load works
- [ ] Preview renders correctly
- [ ] Public site renders correctly
- [ ] All dashboard features work (regression)
- [ ] No console errors

---

## 📋 OUTPUT FORMAT

As you work, document:

1. **Scan Results** - Every file you read
2. **Issues Found** - Complete list of problems
3. **Fixes Applied** - What you changed
4. **Tests Passed** - What you verified

**This is the most important wave - the platform must be fully functional when complete.**
