# DRAMAC Studio - Quick Reference Card

## 🎯 What to Build

**DRAMAC Studio** = Custom AI-powered website builder to replace Puck editor

## 📦 Key Libraries

```bash
# Drag & Drop
@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# State
zustand immer zundo

# UI
react-resizable-panels @floating-ui/react react-colorful react-hotkeys-hook

# Rich Text
@tiptap/react @tiptap/starter-kit

# Already Installed
framer-motion lucide-react @radix-ui/* tailwindcss zustand @ai-sdk/anthropic
```

## 🗂️ Project Structure

```
src/
├── app/studio/[siteId]/[pageId]/     # Full-screen editor route
├── components/studio/                 # All editor components
│   ├── core/                         # Canvas, providers, wrappers
│   ├── panels/                       # Left, right, bottom, top
│   ├── fields/                       # Field type editors
│   ├── ai/                           # AI chat, generator
│   └── dnd/                          # Drag & drop components
├── lib/studio/                        # Editor logic
│   ├── store/                        # Zustand stores
│   ├── registry/                     # Component registry
│   └── engine/                       # Renderer, serializer
└── types/studio.ts                    # TypeScript types
```

## 🎨 Design Rules

- Use existing CSS variables (`hsl(var(--primary))`, etc.)
- Use Tailwind classes
- Match dashboard design exactly
- Dark mode must work

## 🤖 AI Features

1. **Per-component chat**: Click component → AI button → Chat
2. **Page generator**: Generate entire pages from prompt
3. **Quick actions**: Translate, shorten, improve, etc.

## 📋 27 Phases

### Wave 1: Foundation (Week 1-2)
- 01: Project Setup
- 02: Editor Store
- 03: Component Registry
- 04: Layout Shell

### Wave 2: Core Editor (Week 2-3)
- 05: Drag & Drop
- 06: Canvas & Rendering
- 07: Component Library Panel
- 08: Properties Panel

### Wave 3: Fields (Week 3-4)
- 09: Advanced Field Types
- 10: Responsive Fields

### Wave 4: AI (Week 4-5)
- 11: AI Component Chat
- 12: AI Page Generator
- 13: AI Suggestions

### Wave 5: Modules (Week 5-6)
- 14: Module Component Loader
- 15: Module-Specific Fields

### Wave 6: Advanced (Week 6-7)
- 16: Layers Panel
- 17: History/Versioning
- 18: Responsive Preview
- 19: Nested Zones

### Wave 7: Polish (Week 7-8)
- 20: Keyboard Shortcuts
- 21: Performance
- 22: Component States
- 23: Export Optimization

### Wave 8: Extras (Week 8+)
- 24: Section Templates
- 25: Symbols
- 26: Onboarding

### Wave 9: Integration (Final)
- 27: Platform Integration & Puck Removal ⭐

## 🔄 Phase 27 Key Actions

**Update Links (4 files):**
```
src/components/sites/site-pages-list.tsx
src/components/sites/create-site-dialog.tsx
src/components/sites/create-site-form.tsx
src/components/pages/create-page-form.tsx
```

**Replace Renderer:**
```
src/app/preview/[siteId]/[pageId]/page.tsx
src/app/(public)/[domain]/[[...slug]]/page.tsx
```

**Delete Old Editor:**
```
src/app/(dashboard)/dashboard/sites/[siteId]/editor/
src/components/editor/puck/
src/components/editor/puck-editor-integrated.tsx
```

**Keep & Move:**
```
src/components/editor/puck/components/*.tsx → src/components/studio/renders/
```

**Remove from package.json:**
```
@puckeditor/core
```

## ⚠️ Key Constraints

1. **REUSE** existing 116 component renders from Puck
2. **USE** existing design system (CSS vars, Tailwind)
3. **PASS** TypeScript strict mode
4. **SUPPORT** loading existing Puck pages (migration)
5. **ACHIEVE** < 2s editor load, < 1.5s page render

## 📁 Reference Files

```
# Reuse renders from:
src/components/editor/puck/components/*.tsx

# Types reference:
src/types/puck.ts

# Design system:
src/app/globals.css
tailwind.config.ts

# Module system:
src/lib/modules/
src/modules/
```

---

**Full prompt document:** `phases/PHASE-STUDIO-00-MASTER-PROMPT.md`
