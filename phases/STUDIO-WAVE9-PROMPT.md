# TASK: Generate Implementation Phase - WAVE 9 (Final: Integration & Cleanup)

You are a senior software architect. Wave 8 (Templates & Extras) has been successfully implemented. Now generate the **FINAL phase** to complete the DRAMAC Studio transition.

## ✅ Wave 8 Completion Status

The following has been implemented:

### Files Created (Wave 8):
```
src/types/studio-templates.ts             ✅ Template data structure
src/types/studio-symbols.ts               ✅ Symbol data structure

src/lib/studio/store/
  ├── template-store.ts                   ✅ Template library state
  └── symbol-store.ts                     ✅ Symbols state

src/lib/studio/data/
  └── starter-templates.ts                ✅ 12+ starter templates

src/lib/studio/utils/
  └── template-utils.ts                   ✅ Clone, color token replacement

src/components/studio/features/
  ├── template-browser.tsx                ✅ Template browser dialog
  ├── template-card.tsx                   ✅ Template preview card
  ├── create-symbol-dialog.tsx            ✅ Save as symbol dialog
  ├── symbols-panel.tsx                   ✅ Symbols panel in sidebar
  ├── symbol-instance-wrapper.tsx         ✅ Symbol instance rendering
  └── symbol-properties-panel.tsx         ✅ Override props UI

src/components/studio/onboarding/
  ├── tutorial.tsx                        ✅ First-time tutorial
  ├── tutorial-overlay.tsx                ✅ Spotlight overlay
  └── tutorial-tooltip.tsx                ✅ Step tooltips

src/components/studio/help/
  ├── contextual-tooltips.tsx             ✅ Hover tooltips
  ├── help-panel.tsx                      ✅ Help sidebar
  ├── whats-new-panel.tsx                 ✅ Changelog panel
  └── empty-canvas-guide.tsx              ✅ Empty state guidance

Integration:
  ✅ Template browser opens from toolbar "Add Section" button
  ✅ Templates searchable and filterable by category
  ✅ Templates adapt to site colors via token replacement
  ✅ Right-click component → "Save as Symbol"
  ✅ Symbols panel shows all saved symbols
  ✅ Symbol instances sync when source edited
  ✅ Can override instance props
  ✅ Can unlink instance from source
  ✅ Tutorial runs on first visit
  ✅ Contextual tooltips on hover
  ✅ Help panel with documentation links
  ✅ What's new changelog panel
```

### Current State:
- ✅ 12+ section templates available (hero, features, pricing, etc.)
- ✅ Templates insert with color adaptation
- ✅ Symbols system fully working
- ✅ New users get guided tutorial
- ✅ Help always accessible
- ✅ DRAMAC Studio is feature-complete!

### What's Missing (Wave 9 Will Complete):
- ❌ All navigation links still point to old Puck editor
- ❌ Preview/public pages still use Puck renderer
- ❌ Puck dependencies still in package.json
- ❌ Old editor files not cleaned up
- ❌ Final platform-wide testing not done

---

## 🎯 Generate This Phase (Wave 9 - FINAL):

1. **PHASE-STUDIO-27: Platform Integration & Puck Removal**

## ⚠️ CRITICAL: This Phase Completes the Transition

This is the **most critical phase** - it switches the entire platform from Puck to DRAMAC Studio. Every link, every renderer, every dependency must be updated.

---

## PHASE-STUDIO-27: Platform Integration & Puck Removal

### Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-27 |
| Title | Platform Integration & Puck Removal |
| Priority | **CRITICAL** |
| Estimated Time | 12-16 hours |
| Dependencies | All previous Studio phases (01-26) |
| Risk Level | **HIGH** (affects entire platform) |

### Problem Statement

DRAMAC Studio is now feature-complete, but the platform still uses the old Puck editor:
- All "Edit Page" buttons link to `/dashboard/sites/[siteId]/editor`
- Preview and public pages render using Puck's `<Render>` component
- Puck dependencies add ~200KB to the bundle
- Old editor files clutter the codebase
- Users see two different editing experiences

This phase transitions 100% of the platform to DRAMAC Studio.

### Goals

- [ ] All editor links redirect to `/studio/[siteId]/[pageId]`
- [ ] All page renderers use `StudioRenderer`
- [ ] Zero Puck imports remain in codebase
- [ ] All old editor files deleted
- [ ] Bundle size reduced
- [ ] Platform fully tested end-to-end

---

## Implementation Tasks

### Task 1: Update All Navigation Links

**Description:** Find and update every link that points to the old Puck editor.

**Files to Search:**
```bash
# Search for all editor links in the codebase
grep -r "/editor" src/
grep -r "editor?page" src/
grep -r "editor?pageId" src/
```

**Files to MODIFY:**

#### 1. src/components/sites/site-pages-list.tsx

```typescript
// FIND (may vary slightly):
href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}

// REPLACE WITH:
href={`/studio/${siteId}/${page.id}`}

// Also update any "Edit" buttons:
// FIND:
onClick={() => router.push(`/dashboard/sites/${siteId}/editor?page=${pageId}`)}

// REPLACE WITH:
onClick={() => router.push(`/studio/${siteId}/${pageId}`)}
```

#### 2. src/components/sites/create-site-dialog.tsx

```typescript
// FIND:
router.push(`/dashboard/sites/${siteId}/editor?pageId=${pageId}`);
// OR:
router.push(`/dashboard/sites/${result.data.id}/editor?pageId=${homePageId}`);

// REPLACE WITH:
router.push(`/studio/${siteId}/${pageId}`);
// OR:
router.push(`/studio/${result.data.id}/${homePageId}`);
```

#### 3. src/components/sites/create-site-form.tsx

```typescript
// FIND:
router.push(`/dashboard/sites/${siteId}/editor?pageId=${pageId}`);

// REPLACE WITH:
router.push(`/studio/${siteId}/${pageId}`);
```

#### 4. src/components/pages/create-page-form.tsx

```typescript
// FIND:
router.push(`/dashboard/sites/${siteId}/editor?page=${result.data?.id}`);

// REPLACE WITH:
router.push(`/studio/${siteId}/${result.data?.id}`);
```

#### 5. src/components/pages/page-actions.tsx (if exists)

```typescript
// FIND any:
href={`/dashboard/sites/${siteId}/editor?page=${pageId}`}

// REPLACE WITH:
href={`/studio/${siteId}/${pageId}`}
```

#### 6. Any Dashboard Quick Actions

```typescript
// Search for "Edit Page" or "Open Editor" buttons
// Update all routes to /studio/[siteId]/[pageId]
```

**Acceptance Criteria:**
- [ ] Zero links to `/dashboard/sites/*/editor*` remain
- [ ] All page editing opens in Studio
- [ ] Creating a site redirects to Studio
- [ ] Creating a page redirects to Studio

---

### Task 2: Replace Page Renderer in Preview Routes

**Description:** Update preview pages to use StudioRenderer instead of Puck's Render.

**Files to MODIFY:**

#### 1. src/app/preview/[siteId]/[pageId]/page.tsx

```typescript
// REMOVE these imports:
import { Render } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config"; // or similar path

// ADD this import:
import { StudioRenderer } from "@/lib/studio/engine/renderer";

// FIND the render section (approximately):
return (
  <div>
    <Render config={puckConfig} data={pageData} />
  </div>
);

// REPLACE WITH:
return (
  <div>
    <StudioRenderer data={pageData} />
  </div>
);
```

#### 2. src/app/(public)/[domain]/[[...slug]]/page.tsx

```typescript
// Same pattern - remove Puck, add StudioRenderer

// REMOVE:
import { Render } from "@measured/puck";
import "@measured/puck/puck.css";

// ADD:
import { StudioRenderer } from "@/lib/studio/engine/renderer";

// REPLACE render:
// FROM: <Render config={puckConfig} data={data} />
// TO: <StudioRenderer data={data} />
```

#### 3. Any Other Renderer Files

Search for and update:
- `src/components/renderer/puck-site-renderer.tsx`
- `src/components/renderer/page-renderer.tsx`
- Any component that imports from `@measured/puck`

**Acceptance Criteria:**
- [ ] Preview route renders correctly with StudioRenderer
- [ ] Public site pages render correctly
- [ ] No visual differences from Puck rendering
- [ ] All responsive breakpoints work

---

### Task 3: Data Migration Utility

**Description:** Create a utility to migrate old Puck page data to Studio format (if needed).

**File to CREATE:** `src/lib/studio/utils/migrate-puck-data.ts`

```typescript
import { StudioPageData, StudioComponent } from "@/types/studio";

interface PuckData {
  root: { props: Record<string, unknown> };
  content: PuckComponent[];
  zones?: Record<string, PuckComponent[]>;
}

interface PuckComponent {
  type: string;
  props: Record<string, unknown>;
}

/**
 * Migrates old Puck page data to Studio format.
 * Run this on pages that were created before Studio.
 */
export function migratePuckToStudio(puckData: PuckData): StudioPageData {
  const components: Record<string, StudioComponent> = {};
  const rootChildren: string[] = [];
  
  // Migrate root
  const studioData: StudioPageData = {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: puckData.root?.props || {},
      children: rootChildren,
    },
    components,
    zones: {},
  };
  
  // Migrate content components
  puckData.content?.forEach((puckComp, index) => {
    const id = `comp-${index}-${Date.now()}`;
    
    components[id] = {
      id,
      type: mapPuckTypeToStudio(puckComp.type),
      props: migrateProps(puckComp.type, puckComp.props),
      parentId: "root",
    };
    
    rootChildren.push(id);
  });
  
  // Migrate zones if present
  if (puckData.zones) {
    Object.entries(puckData.zones).forEach(([zoneId, zoneContent]) => {
      studioData.zones![zoneId] = [];
      
      zoneContent.forEach((puckComp, index) => {
        const id = `zone-${zoneId}-${index}-${Date.now()}`;
        
        components[id] = {
          id,
          type: mapPuckTypeToStudio(puckComp.type),
          props: migrateProps(puckComp.type, puckComp.props),
          zoneId,
        };
        
        studioData.zones![zoneId].push(id);
      });
    });
  }
  
  return studioData;
}

// Map old Puck component types to new Studio types
function mapPuckTypeToStudio(puckType: string): string {
  const typeMap: Record<string, string> = {
    // Layout
    "Section": "Section",
    "Container": "Container",
    "Columns": "Columns",
    "Flex": "Flex",
    "Grid": "Grid",
    "Spacer": "Spacer",
    
    // Typography
    "Heading": "Heading",
    "Text": "Text",
    "Paragraph": "Text",
    "RichText": "RichText",
    
    // Media
    "Image": "Image",
    "Video": "Video",
    "Icon": "Icon",
    
    // Interactive
    "Button": "Button",
    "ButtonGroup": "ButtonGroup",
    "Link": "Link",
    
    // Marketing
    "Hero": "Hero",
    "FeatureList": "Features",
    "Testimonial": "Testimonial",
    "CTA": "CTA",
    "Pricing": "Pricing",
    "FAQ": "FAQ",
    
    // Add more mappings as needed
  };
  
  return typeMap[puckType] || puckType;
}

// Migrate props to new format (add responsive wrapper if needed)
function migrateProps(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  const migratedProps: Record<string, unknown> = {};
  
  // Props that need to be wrapped in ResponsiveValue
  const responsiveProps = [
    "fontSize", "padding", "margin", "gap", "textAlign",
    "width", "height", "flexDirection", "columns"
  ];
  
  Object.entries(props).forEach(([key, value]) => {
    if (responsiveProps.includes(key) && typeof value !== "object") {
      // Wrap in ResponsiveValue with mobile as base
      migratedProps[key] = { mobile: value };
    } else {
      migratedProps[key] = value;
    }
  });
  
  return migratedProps;
}

/**
 * Check if data is already in Studio format
 */
export function isStudioFormat(data: unknown): data is StudioPageData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.version === "1.0" && typeof d.root === "object" && typeof d.components === "object";
}

/**
 * Auto-migrate data if needed
 */
export function ensureStudioFormat(data: unknown): StudioPageData {
  if (isStudioFormat(data)) {
    return data;
  }
  
  // Assume it's Puck format and migrate
  return migratePuckToStudio(data as PuckData);
}
```

**Update StudioRenderer to handle both formats:**

```typescript
// In src/lib/studio/engine/renderer.tsx

import { ensureStudioFormat } from "../utils/migrate-puck-data";

export function StudioRenderer({ data }: { data: unknown }) {
  // Auto-migrate if needed
  const studioData = ensureStudioFormat(data);
  
  // Continue with normal rendering...
  return <RenderPage data={studioData} />;
}
```

**Acceptance Criteria:**
- [ ] Old Puck pages render correctly after migration
- [ ] Migration is automatic and transparent
- [ ] No data loss during migration
- [ ] Migration runs once and caches result

---

### Task 4: Delete Old Editor Files

**Description:** Remove all Puck-specific editor files from the codebase.

**Directories to DELETE:**

```
# Old editor routes
src/app/(dashboard)/dashboard/sites/[siteId]/editor/  (entire folder)
src/app/editor/  (entire folder if exists)

# Old editor components
src/components/editor/puck/  (entire folder)
src/components/editor/puck-editor-integrated.tsx
src/components/editor/editor-wrapper.tsx  (if Puck-specific)

# Old Puck config
src/lib/puck/  (entire folder if exists)
```

**Files to MOVE (not delete):**

```
# Component renders - KEEP but move to Studio
# If any valuable render logic exists in:
src/components/editor/puck/components/*.tsx

# Move to:
src/components/studio/legacy-renders/  (for reference only)
```

**Files to UPDATE:**

```typescript
// src/types/puck.ts - Can be deleted if no longer needed
// OR keep for reference/migration types
```

**Verification Commands:**

```bash
# After deletion, verify no orphaned imports
grep -r "@measured/puck" src/
grep -r "from \"@/components/editor/puck" src/
grep -r "from '@/components/editor/puck" src/
grep -r "/dashboard/sites/.*editor" src/
```

**Acceptance Criteria:**
- [ ] No Puck editor folders remain
- [ ] No orphaned imports (build succeeds)
- [ ] TypeScript has no errors
- [ ] No broken routes

---

### Task 5: Remove Puck Dependencies

**Description:** Remove Puck packages from package.json and clean up.

**File to MODIFY:** `package.json`

```json
{
  "dependencies": {
    // REMOVE these:
    "@measured/puck": "X.X.X",
    "@measured/puck-plugin-heading-analyzer": "X.X.X",  // if exists
    // Any other @measured/* packages
  }
}
```

**Commands to Run:**

```bash
# Remove Puck packages
pnpm remove @measured/puck
pnpm remove @measured/puck-plugin-heading-analyzer  # if exists

# Clean install
pnpm install

# Verify build
pnpm build
```

**Acceptance Criteria:**
- [ ] No `@measured/*` packages in package.json
- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] Bundle size reduced

---

### Task 6: Create Legacy Route Redirect

**Description:** Add a redirect for any bookmarked old editor URLs.

**File to CREATE:** `src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx`

```typescript
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ page?: string; pageId?: string }>;
}

export default async function LegacyEditorRedirect({ params, searchParams }: PageProps) {
  const { siteId } = await params;
  const { page, pageId } = await searchParams;
  
  // Get the page ID from either query param
  const targetPageId = page || pageId;
  
  if (targetPageId) {
    // Redirect to Studio with the page
    redirect(`/studio/${siteId}/${targetPageId}`);
  } else {
    // No page specified, redirect to site pages list
    redirect(`/dashboard/sites/${siteId}/pages`);
  }
}
```

**Acceptance Criteria:**
- [ ] Old bookmarked URLs redirect correctly
- [ ] No 404 errors for legacy URLs
- [ ] Query params are preserved

---

### Task 7: Final Platform Testing

**Description:** Comprehensive testing of the entire platform after transition.

**Test Checklist:**

#### A. Editor Navigation Tests
```
[ ] Dashboard → Sites List → Click site → Pages list loads
[ ] Pages list → Click "Edit" → Studio opens
[ ] Pages list → Click "New Page" → Create form → Studio opens
[ ] Dashboard → Quick Actions → "Edit Site" → Studio opens
[ ] Direct URL /studio/[siteId]/[pageId] → Studio loads
[ ] Legacy URL /dashboard/sites/[siteId]/editor?page=X → Redirects to Studio
```

#### B. Studio Functionality Tests
```
[ ] Studio loads in under 2 seconds
[ ] Component library shows all components
[ ] Can drag component to canvas
[ ] Can select component on canvas
[ ] Properties panel shows correct fields
[ ] Can edit component props
[ ] Responsive preview works (mobile/tablet/desktop)
[ ] AI chat opens and responds
[ ] Undo/redo works (Ctrl+Z, Ctrl+Shift+Z)
[ ] Save works (Ctrl+S)
[ ] Save shows success toast
[ ] Templates browser opens
[ ] Can insert template
[ ] Symbols panel shows symbols
[ ] Can create symbol
[ ] Can insert symbol instance
[ ] Layers panel shows structure
[ ] History panel shows changes
[ ] Keyboard shortcuts work
[ ] Command palette opens (Ctrl+K)
```

#### C. Preview & Publish Tests
```
[ ] Preview button opens page in new tab
[ ] Preview renders all components correctly
[ ] Preview responsive design works
[ ] Published site renders correctly
[ ] Published site loads fast (< 1.5s LCP)
[ ] Old pages (created with Puck) still render
[ ] Migration happens transparently
```

#### D. Other Dashboard Features (Regression)
```
[ ] Sites list works
[ ] Client management works
[ ] Blog system works
[ ] Media library works
[ ] Module marketplace works
[ ] Billing works
[ ] Team management works
[ ] Settings work
[ ] User profile works
[ ] Logout works
```

#### E. Build & Deploy Tests
```
[ ] TypeScript: npx tsc --noEmit (0 errors)
[ ] ESLint: pnpm lint (0 errors)
[ ] Build: pnpm build (succeeds)
[ ] Preview: pnpm start (works)
[ ] Deploy to Vercel (succeeds)
```

**Acceptance Criteria:**
- [ ] All test checklists pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Deploy succeeds

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | src/components/sites/site-pages-list.tsx | Update editor links |
| MODIFY | src/components/sites/create-site-dialog.tsx | Update redirect |
| MODIFY | src/components/sites/create-site-form.tsx | Update redirect |
| MODIFY | src/components/pages/create-page-form.tsx | Update redirect |
| MODIFY | src/app/preview/[siteId]/[pageId]/page.tsx | Use StudioRenderer |
| MODIFY | src/app/(public)/[domain]/[[...slug]]/page.tsx | Use StudioRenderer |
| CREATE | src/lib/studio/utils/migrate-puck-data.ts | Data migration utility |
| CREATE | src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx | Legacy redirect |
| DELETE | src/app/(dashboard)/dashboard/sites/[siteId]/editor/ | Old editor route |
| DELETE | src/components/editor/puck/ | Old editor components |
| DELETE | src/lib/puck/ | Old Puck config |
| MODIFY | package.json | Remove Puck dependencies |

---

## Rollback Plan

If critical issues arise after deployment:

1. **Immediate Rollback:**
   ```bash
   git revert HEAD  # Revert the integration commit
   git push origin main
   ```

2. **Partial Rollback (keep Studio, restore Puck links temporarily):**
   ```bash
   # Restore old editor route
   git checkout HEAD~1 -- src/app/(dashboard)/dashboard/sites/[siteId]/editor/
   
   # Restore old links
   git checkout HEAD~1 -- src/components/sites/site-pages-list.tsx
   ```

3. **Data Recovery:**
   - Page data is stored in database, not affected by code changes
   - Migration utility is non-destructive
   - Can render old format with legacy Puck if needed

---

## Success Criteria

### Must Have (P0)
- [ ] All "Edit" buttons open Studio
- [ ] Create site/page → Studio
- [ ] Preview renders correctly
- [ ] Public pages render correctly
- [ ] Build succeeds
- [ ] Deploy succeeds

### Should Have (P1)
- [ ] Legacy URLs redirect correctly
- [ ] Bundle size reduced by ~200KB
- [ ] No console warnings about Puck
- [ ] All keyboard shortcuts work

### Nice to Have (P2)
- [ ] Documentation updated
- [ ] Team notified of transition
- [ ] Analytics tracking Studio usage

---

## Post-Transition Cleanup (After 1 Week)

Once stable for a week:

1. **Remove Legacy Redirect:**
   ```bash
   # Delete the redirect file after confirming no traffic
   rm src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx
   ```

2. **Remove Migration Code (if all pages migrated):**
   ```bash
   # Once all pages are in Studio format
   rm src/lib/studio/utils/migrate-puck-data.ts
   ```

3. **Clean up References:**
   - Remove any comments mentioning Puck
   - Update documentation
   - Archive old Puck-related issues

---

## 🎉 COMPLETION

After this phase:
- ✅ DRAMAC Studio is the ONLY editor
- ✅ No Puck code remains
- ✅ Bundle is smaller
- ✅ Codebase is cleaner
- ✅ Users have a premium editing experience
- ✅ Platform is ready for future enhancements

**DRAMAC Studio is COMPLETE!** 🚀
