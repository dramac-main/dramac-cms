# DRAMAC STUDIO - Custom Website Builder/Editor
## Master Phase Generation Prompt

**Document Version:** 1.0  
**Created:** February 2, 2026  
**Purpose:** AI Agent prompt for generating implementation phases

---

# 🎯 INSTRUCTION TO AI AGENT

You are tasked with generating comprehensive, detailed implementation phase documents for building **DRAMAC Studio** - a custom, AI-powered website builder/editor for the DRAMAC CMS platform.

Read this entire document carefully. Then generate individual phase documents following the specifications provided.

---

## 📋 PROJECT CONTEXT

### What is DRAMAC CMS?

DRAMAC is an **Enterprise Module Marketplace Platform** - a multi-tenant SaaS that combines:
- Website Builder (visual drag-and-drop editor)
- Module Marketplace (business apps like CRM, Booking, E-Commerce)
- Agency Dashboard (manage clients, sites, billing)
- White-label capabilities

**Tech Stack:**
- Framework: Next.js 16, React 19, TypeScript 5.x
- Database: Supabase (PostgreSQL)
- UI: Tailwind CSS 4.x, Radix UI, Shadcn/ui
- State: Zustand, TanStack Query
- Current Editor: Puck (being replaced)

### Why Build a Custom Editor?

The current Puck-based editor has critical limitations:
1. Cannot customize UI to match platform design
2. DropZone limitations (can't layer components)
3. No native AI integration per component
4. No support for dynamic module components
5. Limited field type system
6. Locked to Puck's data format

### What is DRAMAC Studio?

DRAMAC Studio is a **custom-built, AI-first website editor** that will:
- Provide a full-screen, immersive editing experience
- Have AI chat integrated into every component
- Dynamically load components from installed modules
- Match the DRAMAC design system perfectly
- Produce fast, optimized websites
- Rival Webflow, Wix Studio, and Framer

---

## 🏗️ TECHNICAL ARCHITECTURE

### Core Libraries to Use

```
DRAG & DROP:
- @dnd-kit/core (main DnD engine)
- @dnd-kit/sortable (sortable lists)
- @dnd-kit/utilities (helpers)

STATE MANAGEMENT:
- zustand (main state)
- immer (immutable updates)
- zundo (undo/redo middleware)

UI COMPONENTS:
- @radix-ui/* (primitives)
- shadcn/ui components (buttons, dialogs, etc.)
- react-resizable-panels (panel layout)
- @floating-ui/react (tooltips, popovers)
- react-colorful (color picker)
- lucide-react (icons)

RICH TEXT:
- @tiptap/react (text editing)
- @tiptap/starter-kit
- @tiptap/extension-* (various extensions)

UTILITIES:
- react-hotkeys-hook (keyboard shortcuts)
- framer-motion (animations)
- clsx + tailwind-merge (className utilities)
- nanoid (ID generation)

AI:
- @ai-sdk/anthropic (Claude integration)
- ai (Vercel AI SDK)
```

### Project Structure

```
src/
├── app/
│   └── studio/                          # NEW: Full-screen editor routes
│       └── [siteId]/
│           └── [pageId]/
│               ├── page.tsx             # Editor entry point
│               └── layout.tsx           # Editor layout (no dashboard)
│
├── components/
│   └── studio/                          # NEW: All editor components
│       ├── core/
│       │   ├── studio-provider.tsx      # Context provider
│       │   ├── studio-canvas.tsx        # Main editing canvas
│       │   ├── studio-frame.tsx         # Device frame wrapper
│       │   └── component-wrapper.tsx    # Wraps each component
│       │
│       ├── panels/
│       │   ├── left-panel.tsx           # Component library
│       │   ├── right-panel.tsx          # Properties/fields
│       │   ├── bottom-panel.tsx         # Layers/structure
│       │   └── top-toolbar.tsx          # Actions toolbar
│       │
│       ├── fields/                      # Custom field editors
│       │   ├── text-field.tsx
│       │   ├── number-field.tsx
│       │   ├── select-field.tsx
│       │   ├── color-field.tsx
│       │   ├── spacing-field.tsx        # Visual box model
│       │   ├── typography-field.tsx
│       │   ├── image-field.tsx
│       │   ├── link-field.tsx
│       │   ├── array-field.tsx          # For lists/items
│       │   └── object-field.tsx         # For nested objects
│       │
│       ├── ai/
│       │   ├── ai-component-chat.tsx    # Per-component AI
│       │   ├── ai-page-generator.tsx    # Full page generation
│       │   ├── ai-suggestions.tsx       # Contextual suggestions
│       │   └── ai-context.tsx           # AI state/context
│       │
│       ├── dnd/
│       │   ├── droppable-canvas.tsx     # Canvas drop zone
│       │   ├── draggable-component.tsx  # Library items
│       │   ├── sortable-component.tsx   # Canvas components
│       │   └── drag-overlay.tsx         # Drag preview
│       │
│       └── features/
│           ├── history-panel.tsx        # Undo/redo UI
│           ├── responsive-controls.tsx  # Breakpoint selector
│           ├── zoom-controls.tsx        # Canvas zoom
│           ├── layers-panel.tsx         # Component tree
│           ├── shortcuts-panel.tsx      # Keyboard help
│           └── settings-panel.tsx       # Page settings
│
├── lib/
│   └── studio/                          # NEW: Editor logic
│       ├── store/
│       │   ├── editor-store.ts          # Main Zustand store
│       │   ├── history-store.ts         # Undo/redo state
│       │   ├── ui-store.ts              # Panel states
│       │   └── selection-store.ts       # Selected component
│       │
│       ├── registry/
│       │   ├── component-registry.ts    # Component definitions
│       │   ├── core-components.ts       # Built-in components
│       │   ├── module-loader.ts         # Load module components
│       │   └── field-registry.ts        # Field type definitions
│       │
│       ├── engine/
│       │   ├── renderer.tsx             # Renders page from data
│       │   ├── serializer.ts            # Save/load data
│       │   └── optimizer.ts             # Output optimization
│       │
│       └── utils/
│           ├── component-utils.ts
│           ├── tree-utils.ts            # Component tree helpers
│           └── id-utils.ts              # ID generation
│
├── types/
│   └── studio.ts                        # NEW: All Studio types
│
└── styles/
    └── studio.css                       # NEW: Editor-specific styles
```

### Data Structure

```typescript
// Page data format
interface StudioPageData {
  version: "1.0";
  root: {
    id: "root";
    type: "Root";
    props: {
      title?: string;
      description?: string;
      styles?: RootStyles;
    };
    children: string[]; // Component IDs
  };
  components: Record<string, StudioComponent>;
  zones?: Record<string, string[]>; // For nested drop zones
}

// Individual component
interface StudioComponent {
  id: string;
  type: string; // e.g., "Heading", "Hero", "ProductCard"
  props: Record<string, unknown>;
  children?: string[]; // Child component IDs (for containers)
  parentId?: string;
  zoneId?: string; // Which zone it's in (for nested)
  locked?: boolean;
  hidden?: boolean;
}

// Component definition (in registry)
interface ComponentDefinition {
  type: string;
  label: string;
  description?: string;
  category: string;
  icon: string;
  
  // Field definitions
  fields: Record<string, FieldDefinition>;
  
  // Default prop values
  defaultProps: Record<string, unknown>;
  
  // Render component
  render: React.ComponentType<any>;
  
  // Does it accept children?
  acceptsChildren?: boolean;
  
  // What components can it contain?
  allowedChildren?: string[];
  
  // AI configuration
  ai?: {
    description: string;
    canModify: string[];
    suggestions?: string[];
  };
  
  // Module source (if from module)
  module?: {
    id: string;
    name: string;
  };
}

// Field definition
interface FieldDefinition {
  type: FieldType;
  label: string;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
  options?: FieldOption[]; // For select/radio
  min?: number; // For number
  max?: number;
  step?: number;
  rows?: number; // For textarea
  accepts?: string[]; // For image (mime types)
  fields?: Record<string, FieldDefinition>; // For object type
  itemFields?: Record<string, FieldDefinition>; // For array type
  responsive?: boolean; // Show per-breakpoint
}

type FieldType = 
  | "text" 
  | "textarea" 
  | "number" 
  | "select" 
  | "radio"
  | "checkbox"
  | "toggle"
  | "color"
  | "image"
  | "link"
  | "spacing"    // Visual margin/padding
  | "typography" // Font settings
  | "array"      // List of items
  | "object"     // Nested fields
  | "richtext"   // TipTap editor
  | "code"       // Code input
  | "custom";    // Custom render
```

---

## 🎨 DESIGN SPECIFICATIONS

### Editor Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Back │ Site Name / Page Name ▼ │ ↶ ↷ │ 📱💻🖥️ │ Zoom: 100% ▼ │ [Preview] [Save] │
├───────────────┬──────────────────────────────────────────────┬───────────────┤
│               │                                              │               │
│  COMPONENTS   │                                              │  PROPERTIES   │
│  ───────────  │                                              │  ───────────  │
│               │                                              │               │
│  🔍 Search    │                                              │  [Component]  │
│               │                                              │               │
│  ▼ Layout     │            ┌──────────────────┐              │  Title        │
│    Section    │            │                  │              │  [_________]  │
│    Container  │            │                  │              │               │
│    Columns    │            │   CANVAS         │              │  ✨ Ask AI    │
│    Grid       │            │                  │              │               │
│               │            │   (iframe or     │              │  ▼ Style      │
│  ▼ Content    │            │    direct)       │              │  ▼ Spacing    │
│    Heading    │            │                  │              │  ▼ Advanced   │
│    Text       │            │                  │              │               │
│    Image      │            │                  │              │               │
│    Button     │            │                  │              │               │
│               │            │                  │              │               │
│  ▼ E-Commerce │            └──────────────────┘              │               │
│    Product    │                                              │               │
│    Cart       │                                              │               │
│               │                                              │               │
├───────────────┴──────────────────────────────────────────────┴───────────────┤
│  LAYERS: [Page] › [Hero Section] › [Container] › [Heading ●]                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Color Palette (Use DRAMAC Design System)

All colors must use CSS variables from the existing design system:
- `hsl(var(--background))` - Background
- `hsl(var(--foreground))` - Text
- `hsl(var(--primary))` - Primary actions
- `hsl(var(--muted))` - Muted backgrounds
- `hsl(var(--border))` - Borders
- `hsl(var(--card))` - Card backgrounds
- etc.

### Typography

Use existing Tailwind typography:
- Font: `font-sans` (Geist Sans)
- Sizes: `text-xs`, `text-sm`, `text-base`, etc.
- Weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Spacing

Use Tailwind spacing scale:
- `p-1` through `p-12`
- `m-1` through `m-12`
- `gap-1` through `gap-12`

---

## 🤖 AI INTEGRATION SPECIFICATIONS

### Per-Component AI Chat

Every component should have an AI button that opens a contextual chat:

```typescript
interface AIComponentContext {
  componentType: string;
  currentProps: Record<string, unknown>;
  componentDefinition: ComponentDefinition;
  pageContext: {
    title: string;
    businessType?: string;
    existingContent: string[]; // Other component texts
  };
}

// AI can return prop changes
interface AIPropsUpdate {
  props: Partial<Record<string, unknown>>;
  explanation: string;
}
```

**Example AI interactions:**
- "Make this heading more exciting"
- "Change colors to blue theme"
- "Add more features to this list"
- "Make the CTA more urgent"
- "Translate to Spanish"
- "Shorten this text"
- "Add an emoji"

### AI System Prompt Template

```
You are an AI assistant helping edit a {componentType} component in a website builder.

Current component properties:
{JSON.stringify(currentProps, null, 2)}

The user wants to: {userPrompt}

Respond with a JSON object containing the updated props. Only include props you want to change.
Keep the same structure as the current props.

Guidelines:
- For text changes, keep similar length unless asked otherwise
- For colors, use valid CSS colors or hex codes
- For spacing, use numbers (pixels) or CSS values
- Be creative but stay professional
- Match the website's tone: {businessType}

Respond ONLY with valid JSON, no explanation.
```

### AI Page Generator

Allow generating entire pages from prompts:

```typescript
interface PageGenerationRequest {
  prompt: string; // "Create a landing page for a fitness app"
  businessType?: string;
  colorScheme?: string;
  includeModules?: string[]; // ["e-commerce", "booking"]
}

interface PageGenerationResponse {
  data: StudioPageData;
  explanation: string;
}
```

---

## 📦 MODULE COMPONENT INTEGRATION

### Module Component Discovery

When a module is installed, scan for editor components:

```typescript
// Module package structure
// packages/ecommerce-module/
//   └── src/
//       └── studio/
//           └── components/
//               ├── index.ts        # Exports all components
//               ├── product-card.tsx
//               ├── cart-widget.tsx
//               └── ...

// Module exports format
// index.ts
export const studioComponents: Record<string, ComponentDefinition> = {
  ProductCard: {
    type: "ProductCard",
    label: "Product Card",
    category: "E-Commerce",
    icon: "shopping-bag",
    fields: {
      productId: { type: "text", label: "Product ID" },
      showPrice: { type: "toggle", label: "Show Price", defaultValue: true },
      // ...
    },
    render: ProductCardRender,
    ai: {
      description: "Displays a product with image, title, price, and buy button",
      canModify: ["layout", "showPrice", "showRating"],
    },
  },
  // ...
};
```

### Component Registry Flow

```
1. App starts
2. Load core components (always available)
3. Query installed modules for site
4. For each module with studioComponents:
   a. Dynamically import module's component definitions
   b. Register to component registry
   c. Add to appropriate category in sidebar
5. Editor shows all available components
```

---

## ⌨️ KEYBOARD SHORTCUTS

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Save | Ctrl+S | Cmd+S |
| Undo | Ctrl+Z | Cmd+Z |
| Redo | Ctrl+Shift+Z | Cmd+Shift+Z |
| Delete component | Delete / Backspace | Delete / Backspace |
| Duplicate | Ctrl+D | Cmd+D |
| Copy | Ctrl+C | Cmd+C |
| Paste | Ctrl+V | Cmd+V |
| Select all | Ctrl+A | Cmd+A |
| Deselect | Escape | Escape |
| Toggle preview | Ctrl+P | Cmd+P |
| Open AI chat | Ctrl+/ | Cmd+/ |
| Search components | Ctrl+K | Cmd+K |
| Zoom in | Ctrl++ | Cmd++ |
| Zoom out | Ctrl+- | Cmd+- |
| Reset zoom | Ctrl+0 | Cmd+0 |

---

## 📄 PHASE DOCUMENT REQUIREMENTS

Generate individual phase documents with this structure:

### File Naming

```
PHASE-STUDIO-[XX]-[SHORT-NAME].md

Examples:
PHASE-STUDIO-01-PROJECT-SETUP.md
PHASE-STUDIO-02-EDITOR-STORE.md
PHASE-STUDIO-03-COMPONENT-REGISTRY.md
```

### Document Template

```markdown
# PHASE-STUDIO-XX: [Full Phase Title]

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-XX |
| Title | [Title] |
| Priority | Critical / High / Medium / Low |
| Estimated Time | X hours |
| Dependencies | [List prerequisite phases] |
| Risk Level | Low / Medium / High |

## Problem Statement

[Describe what problem this phase solves and why it's needed]

## Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Technical Approach

[Detailed explanation of how to implement this phase]

## Implementation Tasks

### Task 1: [Task Name]

**Description:** [What to do]

**Files:**
- CREATE: `path/to/file.ts`
- MODIFY: `path/to/file.ts`

**Code:**
```typescript
// Key code snippets
```

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

### Task 2: [Task Name]
...

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | path/file.ts | Description |
| MODIFY | path/file.ts | Description |

## Testing Requirements

### Unit Tests
- [ ] Test 1
- [ ] Test 2

### Integration Tests
- [ ] Test 1

### Manual Testing
- [ ] Test 1

## Dependencies to Install

```bash
pnpm add [packages]
```

## Environment Variables

```env
# If any new env vars needed
```

## Database Changes

```sql
-- If any schema changes needed
```

## Rollback Plan

[How to revert if issues arise]

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

---

## 📋 REQUIRED PHASES TO GENERATE

Generate these phases in order:

### WAVE 1: Foundation (Critical - Week 1-2)

**PHASE-STUDIO-01: Project Setup & Dependencies**
- Install all required packages
- Create folder structure
- Setup TypeScript types
- Create base CSS file
- Configure imports/aliases

**PHASE-STUDIO-02: Editor State Management**
- Create Zustand stores (editor, UI, selection, history)
- Implement undo/redo with zundo
- Create state hooks
- Handle state persistence

**PHASE-STUDIO-03: Component Registry System**
- Define component registration API
- Create core component definitions (port from Puck)
- Implement category system
- Create component lookup utilities

**PHASE-STUDIO-04: Studio Layout Shell**
- Create studio route and layout
- Implement resizable panel layout
- Create top toolbar
- Create panel headers
- Implement panel toggle/collapse

### WAVE 2: Core Editor (Critical - Week 2-3)

**PHASE-STUDIO-05: Drag & Drop System**
- Setup dnd-kit providers
- Create draggable component items
- Create droppable canvas
- Implement sortable components
- Create drag overlay preview
- Handle drop logic (add/move)

**PHASE-STUDIO-06: Canvas & Rendering**
- Create editor canvas component
- Implement component wrapper
- Handle component selection
- Render components from data
- Implement hover states
- Handle click to select

**PHASE-STUDIO-07: Component Library Panel**
- Create left panel UI
- Implement component search
- Create category accordion
- Display component items with icons
- Implement drag from library

**PHASE-STUDIO-08: Properties Panel Foundation**
- Create right panel UI
- Show selected component info
- Create field renderer system
- Implement basic fields (text, number, select, toggle)
- Handle prop updates

### WAVE 3: Field System (High - Week 3-4)

**PHASE-STUDIO-09: Advanced Field Types**
- Color field with picker
- Image field with upload/URL
- Link field with page picker
- Spacing field with visual box model
- Typography field
- Array field (add/remove/reorder items)
- Object field (nested fields)

**PHASE-STUDIO-10: Responsive Field System**
- Add breakpoint selector
- Store per-breakpoint values
- Toggle responsive mode per field
- Preview at different breakpoints

### WAVE 4: AI Integration (High - Week 4-5)

**PHASE-STUDIO-11: AI Component Chat**
- Create AI chat UI component
- Implement per-component context
- Create AI API endpoint
- Handle prop updates from AI
- Add preview before apply
- Store chat history per session

**PHASE-STUDIO-12: AI Page Generator**
- Create full-page generation wizard
- Implement prompt templates
- Handle module-aware generation
- Preview and apply generated pages

**PHASE-STUDIO-13: AI Suggestions & Quick Actions**
- Add suggestion chips per component
- Implement quick AI actions (translate, shorten, etc.)
- Add inline AI editing in text fields

### WAVE 5: Module Integration (High - Week 5-6)

**PHASE-STUDIO-14: Module Component Loader**
- Create module discovery system
- Dynamic import module components
- Register module components
- Handle module enable/disable
- Show module category in sidebar

**PHASE-STUDIO-15: Module-Specific Fields**
- Load custom field types from modules
- Module data binding (e.g., product selector)
- Module API integration in fields

### WAVE 6: Advanced Features (Medium - Week 6-7)

**PHASE-STUDIO-16: Layers & Structure Panel**
- Create bottom panel layers UI
- Show component tree
- Drag to reorder in tree
- Click to select
- Visibility toggle
- Lock toggle

**PHASE-STUDIO-17: History & Versioning**
- Create visual history panel
- Show undo/redo list
- Named snapshots
- Version comparison
- Restore from history

**PHASE-STUDIO-18: Responsive Preview**
- Device frame selector
- Custom width input
- Visual device frames
- Zoom controls
- Ruler/guides

**PHASE-STUDIO-19: Nested Components & Zones**
- Support DropZone in components
- Multiple zones per component
- Zone-specific allowed components
- Visual zone indicators

### WAVE 7: Polish & Optimization (Medium - Week 7-8)

**PHASE-STUDIO-20: Keyboard Shortcuts**
- Implement all shortcuts
- Command palette (Cmd+K)
- Shortcuts help panel
- Customizable shortcuts

**PHASE-STUDIO-21: Performance Optimization**
- Virtualize component list
- Memoize renders
- Debounce updates
- Code split panels
- Lazy load AI features

**PHASE-STUDIO-22: Component States (Hover, Active)**
- Add state selector to wrapper
- Edit hover styles
- Edit active/focus styles
- Preview states

**PHASE-STUDIO-23: Export & Render Optimization**
- Generate optimized HTML/CSS
- Critical CSS extraction
- Image optimization pipeline
- Lazy load components
- Code splitting for heavy components

### WAVE 8: Templates & Extras (Low - Week 8+)

**PHASE-STUDIO-24: Section Templates**
- Section-level templates
- Template browser UI
- Insert at position
- Adapt to site colors

**PHASE-STUDIO-25: Symbols (Reusable Components)**
- Save component as symbol
- Symbols panel
- Edit symbol (updates instances)
- Override instance props
- Unlink symbol

**PHASE-STUDIO-26: Onboarding & Help**
- First-time tutorial
- Tooltips on hover
- Help panel
- Documentation links
- What's new panel

### WAVE 9: Integration & Cleanup (Final)

**PHASE-STUDIO-27: Platform Integration & Puck Removal**
- Update all navigation links to use Studio
- Replace page renderer in preview/public routes
- Remove Puck dependencies and imports
- Clean up old editor files
- Final testing across platform

---

## 📝 PHASE-STUDIO-27 DETAILED SPECIFICATION

This phase is critical for completing the transition. Generate it with these specifics:

### Files to MODIFY (Update Links)

```typescript
// 1. src/components/sites/site-pages-list.tsx
// Find all instances of:
href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}
// Replace with:
href={`/studio/${siteId}/${page.id}`}

// 2. src/components/sites/create-site-dialog.tsx
// Find:
router.push(`/dashboard/sites/${siteId}/editor?pageId=${pageId}`);
// Replace with:
router.push(`/studio/${siteId}/${pageId}`);

// 3. src/components/sites/create-site-form.tsx
// Find:
router.push(`/dashboard/sites/${siteId}/editor?pageId=${pageId}`);
// Replace with:
router.push(`/studio/${siteId}/${pageId}`);

// 4. src/components/pages/create-page-form.tsx
// Find:
router.push(`/dashboard/sites/${siteId}/editor?page=${result.data?.id}`);
// Replace with:
router.push(`/studio/${siteId}/${result.data?.id}`);

// 5. Any other files with /editor? links (search codebase)
```

### Files to MODIFY (Replace Renderer)

```typescript
// 1. src/app/preview/[siteId]/[pageId]/page.tsx
// Remove: import { Render } from "@puckeditor/core";
// Remove: import "@puckeditor/core/puck.css";
// Remove: import { puckConfig } from "...";
// Add: import { StudioRenderer } from "@/lib/studio/engine/renderer";
// Replace: <Render config={puckConfig} data={data} />
// With: <StudioRenderer data={data} />

// 2. src/app/(public)/[domain]/[[...slug]]/page.tsx (if exists)
// Same replacement pattern

// 3. src/components/renderer/puck-site-renderer.tsx
// Either delete or refactor to use StudioRenderer
```

### Files to DELETE (Old Editor)

```
src/app/(dashboard)/dashboard/sites/[siteId]/editor/  (entire folder)
src/app/editor/[siteId]/  (entire folder if exists)
src/components/editor/puck/  (entire folder)
src/components/editor/puck-editor-integrated.tsx
src/components/editor/editor-wrapper.tsx (if Puck-specific)
src/types/puck.ts (after migrating any needed types)
```

### Files to KEEP (Reused in Studio)

```
src/components/editor/puck/components/*.tsx  
→ Move to: src/components/studio/renders/*.tsx
→ These are the actual component render functions - KEEP THEM!

src/lib/templates/  (keep template data)
src/lib/ai/  (keep AI utilities)
```

### Dependencies to REMOVE from package.json

```json
{
  "dependencies": {
    "@puckeditor/core": "REMOVE",
    "@puckeditor/plugin-ai": "REMOVE (if exists)"
  }
}
```

### Final Verification Checklist

```
[ ] All "Edit Page" links go to /studio/[siteId]/[pageId]
[ ] Creating a new page redirects to Studio
[ ] Creating a new site redirects to Studio
[ ] Preview renders pages correctly with StudioRenderer
[ ] Public site pages render correctly
[ ] No Puck imports remain in codebase
[ ] No TypeScript errors (npx tsc --noEmit)
[ ] Build succeeds (pnpm build)
[ ] All existing dashboard features still work:
    [ ] Sites list
    [ ] Client management
    [ ] Blog system
    [ ] Media library
    [ ] Module marketplace
    [ ] Billing
    [ ] Team management
    [ ] Settings
[ ] Studio editor fully functional:
    [ ] Can create new pages
    [ ] Can edit components
    [ ] AI chat works
    [ ] Save/load works
    [ ] Preview works
```

---

## ⚠️ IMPORTANT CONSTRAINTS

1. **Reuse Existing Components**: The 116 Puck component renders should be adapted, not rewritten. Create wrappers that use the existing render functions.

2. **Design System Compliance**: All UI must use DRAMAC's existing design tokens (CSS variables, Tailwind classes).

3. **TypeScript Strict Mode**: All code must pass `tsc --noEmit` with zero errors.

4. **Accessibility**: All interactive elements must be keyboard accessible. Use proper ARIA attributes.

5. **Performance**: Editor should be interactive within 2 seconds. Use code splitting and lazy loading.

6. **Mobile Consideration**: Editing is desktop-only, but preview must work on all devices.

7. **Data Migration**: Must support loading existing Puck-format pages (migration utility).

8. **Backward Compatibility**: Old pages must still render with the new renderer.

---

## 🎯 SUCCESS METRICS

- **Visual Consistency**: 100% match with DRAMAC design system
- **Component Count**: All 116 existing components available plus module components
- **AI Response Time**: < 3 seconds for component edits
- **Editor Load Time**: < 2 seconds to interactive
- **Save/Load**: < 500ms for average page
- **Render Performance**: < 1.5s LCP for published sites
- **User Satisfaction**: "Feels like Webflow or better"

---

## 📁 REFERENCE FILES

Key existing files to reference:

```
# Component renders (REUSE THESE)
src/components/editor/puck/components/layout.tsx
src/components/editor/puck/components/typography.tsx
src/components/editor/puck/components/buttons.tsx
src/components/editor/puck/components/media.tsx
src/components/editor/puck/components/sections.tsx
src/components/editor/puck/components/navigation.tsx
src/components/editor/puck/components/forms.tsx
src/components/editor/puck/components/ecommerce.tsx
src/components/editor/puck/components/interactive.tsx
src/components/editor/puck/components/marketing.tsx
src/components/editor/puck/components/content.tsx
src/components/editor/puck/components/three-d.tsx
src/components/editor/puck/components/spline.tsx

# Types (REFERENCE)
src/types/puck.ts

# Existing AI integration (REFERENCE)
src/components/editor/puck/ai/

# Design system (USE)
src/app/globals.css
src/styles/brand-variables.css
tailwind.config.ts

# Module system (INTEGRATE WITH)
src/lib/modules/
src/modules/
```

---

## 🚀 BEGIN GENERATING PHASES

Now generate all 26 phase documents following the specifications above. Each phase should be:
- Self-contained and implementable independently (respecting dependencies)
- Include exact file paths for all changes
- Include key code snippets
- Include test requirements
- Include success criteria checkboxes

Start with **PHASE-STUDIO-01** and continue in order.

**OUTPUT FORMAT**: Generate each phase as a separate code block with the filename as the first line comment.
