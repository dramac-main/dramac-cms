# TASK: Generate Implementation Phases - WAVE 2 (Core Editor)

You are a senior software architect. Wave 1 (Foundation) has been successfully implemented. Now generate the **next 4 core editor phases** for DRAMAC Studio.

## ✅ Wave 1 Completion Status

The following has been implemented:

### Files Created (Wave 1):
```
src/app/studio/[siteId]/[pageId]/
  ├── page.tsx                    ✅ Route entry point
  ├── layout.tsx                  ✅ Full-screen layout
  └── studio-editor-placeholder.tsx

src/components/studio/
  ├── layout/
  │   ├── studio-layout.tsx       ✅ Main layout shell with panels
  │   └── studio-toolbar.tsx      ✅ Top toolbar
  ├── panels/
  │   ├── left-panel.tsx          ✅ Component library panel
  │   ├── right-panel.tsx         ✅ Properties panel
  │   └── bottom-panel.tsx        ✅ Layers/structure panel
  ├── core/
  │   └── studio-provider.tsx     ✅ Context provider
  └── studio-editor.tsx           ✅ Main editor component

src/lib/studio/
  ├── store/
  │   ├── editor-store.ts         ✅ Page data, components
  │   ├── ui-store.ts             ✅ Panel visibility, zoom
  │   ├── selection-store.ts      ✅ Selected component
  │   └── index.ts                ✅ Store exports with history
  ├── registry/
  │   ├── component-registry.ts   ✅ Component registration
  │   ├── core-components.ts      ✅ 116 components registered
  │   ├── field-registry.ts       ✅ Field type definitions
  │   └── hooks.ts                ✅ useComponent, useRegistry hooks
  └── utils/
      ├── component-utils.ts      ✅ Component helpers
      ├── tree-utils.ts           ✅ Tree traversal
      └── id-utils.ts             ✅ ID generation

src/types/studio.ts               ✅ All TypeScript types
src/styles/studio.css             ✅ Studio-specific styles
```

### Current State:
- ✅ Editor opens at `/studio/[siteId]/[pageId]`
- ✅ Full-screen layout with resizable panels
- ✅ Zustand stores with undo/redo (zundo middleware)
- ✅ 116 components registered in registry
- ✅ TypeScript compiles with zero errors
- ✅ Design system integrated (CSS variables, Tailwind)

### What Works:
- Panel collapse/expand
- Top toolbar with back button
- Empty left panel (component library placeholder)
- Empty right panel (properties placeholder)  
- Empty bottom panel (layers placeholder)
- Empty canvas (placeholder)

---

## 🎯 Generate These Phases (Wave 2):

1. **PHASE-STUDIO-05: Drag & Drop System**
2. **PHASE-STUDIO-06: Canvas & Rendering**
3. **PHASE-STUDIO-07: Component Library Panel**
4. **PHASE-STUDIO-08: Properties Panel Foundation**

## Expected Outcome After Wave 2

After implementing these 4 phases, we should have:
- ✅ Drag components from library to canvas
- ✅ Drop zones on canvas
- ✅ 10-15 premium components with rich props (not basic HTML wrappers)
- ✅ Components render on canvas with all their settings
- ✅ Click to select components
- ✅ Hover highlights
- ✅ Selected component shows in properties panel
- ✅ Basic field editing (text, number, select, toggle, color)
- ✅ Reorder components via drag
- ✅ Delete components
- ✅ Undo/redo works with drag operations

## Component Quality Standard (CRITICAL!)

**DO NOT create basic HTML wrappers. Create PREMIUM components like Webflow.**

### Example: What we DON'T want (too basic):
```typescript
// ❌ BAD - Basic Heading
const HeadingRender = ({ text, level }) => {
  const Tag = `h${level}`;
  return <Tag>{text}</Tag>;
};

const HeadingFields = {
  text: { type: 'text', label: 'Text' },
  level: { type: 'select', label: 'Level', options: [1,2,3,4,5,6] },
};
```

### Example: What we WANT (premium):
```typescript
// ✅ GOOD - Premium Heading
interface HeadingProps {
  // Content
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Typography
  fontFamily: 'heading' | 'body' | 'mono' | string;
  fontSize: ResponsiveValue<string>;
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  letterSpacing: ResponsiveValue<string>;
  lineHeight: ResponsiveValue<string>;
  textAlign: ResponsiveValue<'left' | 'center' | 'right'>;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  // Colors
  color: string; // Supports CSS variables or hex
  gradient?: {
    enabled: boolean;
    type: 'linear' | 'radial';
    angle: number;
    stops: { color: string; position: number }[];
  };
  
  // Effects
  textShadow?: {
    enabled: boolean;
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  
  // Animation
  animation: 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'blur-in' | 'typewriter';
  animationDelay: number;
  animationDuration: number;
  animationOnScroll: boolean;
  
  // Visibility
  hideOn: ('mobile' | 'tablet' | 'desktop')[];
  
  // Spacing
  margin: ResponsiveValue<Spacing>;
  padding: ResponsiveValue<Spacing>;
}

// With proper render that applies all settings
const HeadingRender: React.FC<HeadingProps> = (props) => {
  const Tag = `h${props.level}` as keyof JSX.IntrinsicElements;
  const styles = useComponentStyles(props); // Generates CSS from props
  const animationClass = useAnimation(props);
  const visibilityClass = useResponsiveVisibility(props.hideOn);
  
  return (
    <Tag 
      className={cn(styles, animationClass, visibilityClass)}
      style={props.gradient?.enabled ? { backgroundClip: 'text', ... } : undefined}
    >
      {props.text}
    </Tag>
  );
};
```

## Key Implementation Context

### Existing Stores to Use:
```typescript
// Editor store (src/lib/studio/store/editor-store.ts)
- data: StudioPageData              // Page content
- addComponent(comp, parentId?)     // Add to page
- updateComponent(id, props)        // Update props
- deleteComponent(id)               // Remove
- moveComponent(id, parentId, index)// Reorder

// Selection store (src/lib/studio/store/selection-store.ts)
- selectedId: string | null
- selectComponent(id)
- deselectComponent()

// UI store (src/lib/studio/store/ui-store.ts)
- panels: { left, right, bottom }
- zoom: number
```

### Component Registry to Use:
```typescript
// Get all components
const components = useComponentRegistry();

// Get single component definition
const { definition } = useComponent('Heading');

// Definition structure (Wave 2 creates fresh premium components):
{
  type: "Heading",
  label: "Heading",
  category: "Typography",
  icon: "type",
  fields: { /* Rich responsive fields */ },
  render: HeadingBlock,  // NEW premium component from src/components/studio/blocks/
}
```

### Component Strategy: FRESH COMPONENTS (Not Reusing Puck)

**Decision**: Create all-new premium components from scratch.

**Why NOT reuse existing Puck components:**
- Too basic (minimal props, no animations, no interactions)
- Built for Puck's constraints, not our vision
- No AI context or responsive breakpoint support
- Don't match Webflow/Wix Studio quality

**New Component Architecture:**
```
src/components/studio/blocks/
  ├── layout/
  │   ├── section.tsx          → Premium section with parallax, overlays
  │   ├── container.tsx        → Flex/grid container with gap, alignment
  │   ├── columns.tsx          → Responsive columns with custom breakpoints
  │   └── spacer.tsx           → Visual spacer with responsive heights
  ├── typography/
  │   ├── heading.tsx          → Rich heading with animations, gradients
  │   ├── text.tsx             → Paragraph with typography controls
  │   ├── rich-text.tsx        → WYSIWYG editable text
  │   └── label.tsx            → Small text labels
  ├── media/
  │   ├── image.tsx            → Image with focal point, lazy loading
  │   ├── video.tsx            → Video with autoplay, controls
  │   ├── icon.tsx             → Icon picker with 1000+ icons
  │   └── lottie.tsx           → Lottie animations
  ├── interactive/
  │   ├── button.tsx           → Button with hover states, loading
  │   ├── link.tsx             → Styled links
  │   └── accordion.tsx        → Animated accordions
  └── index.ts                 → Barrel exports
```

**Each component includes:**
- Responsive props (mobile/tablet/desktop values)
- Animation settings (entrance, hover, scroll-triggered)
- AI context for intelligent suggestions
- Design tokens integration
- Accessibility built-in

### Design System to Follow:
- Use `hsl(var(--primary))` for colors
- Use Tailwind spacing classes
- Match existing panel styling from Wave 1
- Use Lucide React icons

---

## Requirements for Each Phase

### PHASE-STUDIO-05: Drag & Drop System

Must implement:
- `@dnd-kit/core` setup with DndContext provider
- Draggable component items in library (DraggableComponentItem)
- Droppable canvas area (DroppableCanvas)
- Sortable components on canvas (SortableComponent)
- Drag overlay showing component preview
- Drop handlers that call `editorStore.addComponent()` or `moveComponent()`
- Visual feedback during drag (highlight drop zones)
- Keyboard support (Space to pick up, Escape to cancel)

### PHASE-STUDIO-06: Canvas & Rendering + Starter Components

Must implement:

**Canvas Infrastructure:**
- EditorCanvas component showing page structure
- ComponentWrapper that wraps each rendered component
- Click handler → calls `selectionStore.selectComponent(id)`
- Hover state → highlight border
- Selected state → blue border + resize handles (visual only for now)
- Render components using their `render` function from registry
- Handle nested components (children)
- Empty state when no components

**Create 10 Premium Starter Components (NOT basic HTML wrappers):**

| Component | Category | Rich Props Must Include |
|-----------|----------|------------------------|
| `Section` | Layout | background (color/gradient/image), padding responsive, parallax, overlay |
| `Container` | Layout | maxWidth, padding responsive, flexbox settings |
| `Columns` | Layout | columns responsive (1-6), gap, vertical align |
| `Heading` | Typography | fontFamily, fontSize responsive, weight, gradient text, animation |
| `Text` | Typography | fontSize responsive, lineHeight, columns, dropcap |
| `Button` | Interactive | variant, size responsive, icon, loading state, hover animation |
| `Image` | Media | src, alt, objectFit, aspectRatio, borderRadius, lazy loading |
| `Spacer` | Layout | height responsive (mobile/tablet/desktop values) |
| `Divider` | Layout | style (solid/dashed/dotted), color, width, margin |
| `Icon` | Media | icon picker (lucide), size, color, animation |

**Each component MUST have:**
1. Full TypeScript interface with JSDoc comments
2. Default props that look good out of the box
3. Responsive utilities for key visual props
4. Animation option (at least fade-in)
5. AI context string for future AI integration

### PHASE-STUDIO-07: Component Library Panel

Must implement:
- Search/filter components by name
- Category accordion (Layout, Typography, Content, etc.)
- Component cards with icon, name, description
- Drag to canvas functionality (works with Phase 05)
- Show component count per category
- Responsive scrolling for long lists
- "Recently used" section (optional but nice)

### PHASE-STUDIO-08: Properties Panel Foundation

Must implement:
- Show selected component info (type, label)
- Render fields based on component definition
- Field types:
  - TextFieldEditor (text input)
  - NumberFieldEditor (number input with +/- buttons)
  - SelectFieldEditor (dropdown)
  - ToggleFieldEditor (switch)
- Field onChange → calls `editorStore.updateComponent(id, { field: value })`
- Field labels and descriptions
- Empty state when nothing selected
- Delete button for selected component

---

## Output Format

Generate each phase as a complete markdown document with:

```markdown
# PHASE-STUDIO-0X: [Title]

## Overview
| Property | Value |
|----------|-------|
| Phase | STUDIO-0X |
| Priority | Critical |
| Estimated Time | X hours |
| Dependencies | STUDIO-01, STUDIO-02, STUDIO-03, STUDIO-04 |

## Problem Statement
[What this phase solves]

## Implementation Tasks

### Task 1: [Specific task name]

**Files to create:**
- `src/path/to/file.tsx`

**Complete code:**
```typescript
// Full implementation with imports
// NO placeholders like "...existing code..."
// Complete, copy-paste ready code
```

**Acceptance Criteria:**
- [ ] Specific testable criterion
- [ ] Another criterion

### Task 2: [Next task]
...

## Testing Instructions
- How to test each feature
- What to verify

## Success Criteria
- [ ] Overall success criterion 1
- [ ] Overall success criterion 2
```

---

## Important Constraints

1. **Create fresh premium components** - Don't reuse basic Puck components
2. **MOBILE-FIRST RESPONSIVE** - ALL visual props must support ResponsiveValue<T>
3. **Use existing stores** - Don't create new state, use Wave 1 stores
4. **Follow DRAMAC design** - CSS variables, Tailwind, match panel styling
5. **Complete code** - No "// TODO" or "...existing code..." placeholders
6. **TypeScript strict** - Must compile with zero errors
7. **Accessibility** - Keyboard navigation, ARIA labels
8. **Animation-ready** - Components support entrance/hover animations

## 📱 MOBILE-FIRST REQUIREMENT (CRITICAL!)

**Every component prop that affects visual appearance MUST use ResponsiveValue<T>:**

```typescript
// The ResponsiveValue type
type ResponsiveValue<T> = {
  mobile: T;      // REQUIRED - base value (mobile-first)
  tablet?: T;     // Optional tablet override
  desktop?: T;    // Optional desktop override
};

// Example: Section component
interface SectionProps {
  // These MUST be responsive:
  padding: ResponsiveValue<Spacing>;       // { mobile: '16px', tablet: '32px', desktop: '64px' }
  minHeight: ResponsiveValue<string>;      // { mobile: '300px', desktop: '600px' }
  gap: ResponsiveValue<string>;            // { mobile: '16px', tablet: '24px' }
  flexDirection: ResponsiveValue<'column' | 'row'>; // { mobile: 'column', desktop: 'row' }
  
  // Plus visibility control:
  hideOn?: ('mobile' | 'tablet' | 'desktop')[];
  
  // Non-responsive props (same on all breakpoints):
  backgroundColor: string;
  backgroundImage?: string;
}
```

**Breakpoints:**
- `mobile`: 0-767px (DEFAULT/BASE - always required)
- `tablet`: 768-1023px (optional override)
- `desktop`: 1024px+ (optional override)

**CSS Generation must be mobile-first:**
```css
/* Base styles (mobile) */
.section { padding: 16px; }

/* Tablet override */
@media (min-width: 768px) { .section { padding: 32px; } }

/* Desktop override */
@media (min-width: 1024px) { .section { padding: 64px; } }
```

---

## Dependencies to Install

If any new packages are needed for Wave 2:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Start Now

Generate **PHASE-STUDIO-05** first (Drag & Drop System), then continue through **PHASE-STUDIO-08**.

Each phase should be detailed enough that an AI agent can implement it without additional context beyond this prompt and the master prompt.

---

# MASTER PROMPT FOLLOWS BELOW

[Paste the contents of PHASE-STUDIO-00-MASTER-PROMPT.md here]
