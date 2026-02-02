# TASK: Generate Implementation Phases - WAVE 1 (Foundation)

You are a senior software architect. Read the attached MASTER PROMPT document completely, then generate the **first 4 foundation phases** for building DRAMAC Studio - a custom AI-powered website editor.

## Generate These Phases Only:

1. **PHASE-STUDIO-01: Project Setup & Dependencies**
2. **PHASE-STUDIO-02: Editor State Management**
3. **PHASE-STUDIO-03: Component Registry System**
4. **PHASE-STUDIO-04: Studio Layout Shell**

## Expected Outcome After Wave 1

After implementing these 4 phases, we should have:
- ✅ All required npm packages installed
- ✅ Editor route at `/studio/[siteId]/[pageId]` (full-screen, no dashboard)
- ✅ Zustand stores: editor state, UI state, selection, history (with undo/redo)
- ✅ Component registry with all 116 existing components registered
- ✅ Resizable panel layout (left sidebar, right sidebar, bottom panel, top toolbar)
- ✅ Panel collapse/expand functionality
- ✅ Basic navigation (back to dashboard)
- ✅ TypeScript compiles with zero errors

## Requirements

1. **Each phase must be self-contained** - implementable by another AI agent without additional context
2. **Include exact file paths** for all files to create
3. **Include complete code** for key files (not just snippets or descriptions)
4. **Follow DRAMAC's existing design system** - use CSS variables (`hsl(var(--primary))`) and Tailwind classes
5. **Prepare for fresh components** - Wave 2 will create premium mobile-first components (NOT reusing basic Puck)

## Output Format

Generate each phase as a separate markdown document:

```markdown
# PHASE-STUDIO-01: Project Setup & Dependencies

## Overview
| Property | Value |
|----------|-------|
| Phase | STUDIO-01 |
| Priority | Critical |
| Estimated Time | X hours |
| Dependencies | None |

## Problem Statement
[What this phase solves]

## Implementation Tasks

### Task 1: [Name]
**Files to create:**
- `path/to/file.ts`

**Code:**
```typescript
// Complete implementation
```

[Continue with full task details...]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Important Context

- **Current editor**: Puck-based at `/dashboard/sites/[siteId]/editor`
- **Component renders exist at**: `src/components/editor/puck/components/*.tsx`
- **Design system**: `src/app/globals.css`, `tailwind.config.ts`
- **Existing stores pattern**: Check `src/lib/` for Zustand usage examples

## Start Now

Generate **PHASE-STUDIO-01** first, then continue through **PHASE-STUDIO-04**.

---

# MASTER PROMPT FOLLOWS BELOW

[Paste the contents of PHASE-STUDIO-00-MASTER-PROMPT.md here]
