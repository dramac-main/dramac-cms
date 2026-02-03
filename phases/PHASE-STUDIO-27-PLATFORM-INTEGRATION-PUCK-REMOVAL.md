# PHASE-STUDIO-27: Platform Integration & Puck Removal

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-27 |
| Title | Platform Integration & Puck Removal |
| Priority | **CRITICAL** |
| Estimated Time | 12-16 hours |
| Dependencies | All previous Studio phases (01-26) |
| Risk Level | **HIGH** (affects entire platform) |

## Problem Statement

DRAMAC Studio is now feature-complete after implementing Waves 1-8 (26 phases), but the platform still has remnants of the old Puck editor:

1. **Navigation Links**: Some "Edit Page" buttons and redirects still point to `/dashboard/sites/[siteId]/editor`
2. **Page Renderers**: Preview and public site pages still use Puck's `<Render>` component from `@puckeditor/core`
3. **Dependencies**: Puck package (`@puckeditor/core`) adds ~200KB to the bundle
4. **Legacy Code**: Old editor files, Puck config, and related components clutter the codebase
5. **User Experience**: Mixed editing experiences confuse users

This is the **FINAL phase** that transitions 100% of the platform to DRAMAC Studio, removes all Puck dependencies, and completes the editor migration.

## Goals

- [ ] All editor links redirect to `/studio/[siteId]/[pageId]`
- [ ] All page renderers use `StudioRenderer` instead of Puck's `<Render>`
- [ ] Zero Puck imports remain in the codebase
- [ ] All old editor files deleted
- [ ] Bundle size reduced by ~200KB
- [ ] Platform fully tested end-to-end
- [ ] Legacy URLs redirect gracefully to Studio

---

## Technical Approach

### Phase Execution Order

1. **Create Migration Utility** (Task 1) - Build before changing renderers
2. **Create StudioRenderer** (Task 2) - Build the new renderer component
3. **Update Navigation Links** (Task 3) - Switch all links to Studio
4. **Replace Page Renderers** (Task 4) - Update preview/public routes
5. **Create Legacy Redirect** (Task 5) - Handle bookmarked old URLs
6. **Delete Old Files** (Task 6) - Remove Puck-specific code
7. **Remove Dependencies** (Task 7) - Uninstall Puck packages
8. **Final Testing** (Task 8) - Comprehensive platform verification

### Key Considerations

- **Non-destructive Migration**: Page data stored in database is not affected
- **Backward Compatibility**: Old Puck page data auto-migrates to Studio format
- **Graceful Degradation**: Legacy URLs redirect instead of 404
- **Rollback Plan**: Git-based revert strategy documented

---

## Implementation Tasks

### Task 1: Create Data Migration Utility

**Description:** Create a utility that converts old Puck page data to Studio format. This ensures pages created before Studio still render correctly.

**File to CREATE:** `src/lib/studio/utils/migrate-puck-data.ts`

```typescript
/**
 * Puck to Studio Data Migration Utility
 * 
 * Automatically migrates old Puck editor page data to the new Studio format.
 * This runs transparently at render time, ensuring backward compatibility.
 */

import type { StudioPageData, StudioComponent } from "@/types/studio";
import { nanoid } from "nanoid";

// ============================================================================
// Puck Data Types (for migration reference)
// ============================================================================

interface PuckData {
  root: { 
    props: Record<string, unknown>;
  };
  content: PuckComponent[];
  zones?: Record<string, PuckComponent[]>;
}

interface PuckComponent {
  type: string;
  props: Record<string, unknown>;
}

// ============================================================================
// Type Mapping
// ============================================================================

/**
 * Map old Puck component types to new Studio types
 */
function mapPuckTypeToStudio(puckType: string): string {
  const typeMap: Record<string, string> = {
    // Layout Components
    "Section": "Section",
    "Container": "Container",
    "Columns": "Columns",
    "Column": "Column",
    "Flex": "Flex",
    "Grid": "Grid",
    "Spacer": "Spacer",
    "Divider": "Divider",
    
    // Typography Components
    "Heading": "Heading",
    "Text": "Text",
    "Paragraph": "Text",
    "RichText": "RichText",
    "Quote": "Quote",
    "Label": "Label",
    
    // Media Components
    "Image": "Image",
    "Video": "Video",
    "Icon": "Icon",
    "Gallery": "Gallery",
    "Logo": "Logo",
    
    // Interactive Components
    "Button": "Button",
    "ButtonGroup": "ButtonGroup",
    "Link": "Link",
    "Accordion": "Accordion",
    "Tabs": "Tabs",
    "Modal": "Modal",
    
    // Marketing Components
    "Hero": "Hero",
    "HeroSection": "Hero",
    "FeatureList": "Features",
    "Features": "Features",
    "FeatureGrid": "Features",
    "Testimonial": "Testimonials",
    "Testimonials": "Testimonials",
    "CTA": "CTA",
    "CallToAction": "CTA",
    "Pricing": "Pricing",
    "PricingTable": "Pricing",
    "FAQ": "FAQ",
    "ContactForm": "ContactForm",
    "Team": "Team",
    "Stats": "Stats",
    "Newsletter": "Newsletter",
    
    // Navigation Components
    "Navbar": "Navbar",
    "Footer": "Footer",
    "Breadcrumb": "Breadcrumb",
    "Menu": "Menu",
    
    // Form Components
    "Form": "Form",
    "FormField": "FormField",
    "Input": "Input",
    "Select": "Select",
    "Checkbox": "Checkbox",
    "Radio": "Radio",
    "Textarea": "Textarea",
  };
  
  // Return mapped type or original if not in map
  return typeMap[puckType] || puckType;
}

// ============================================================================
// Props Migration
// ============================================================================

/**
 * Props that should be wrapped in ResponsiveValue format
 */
const RESPONSIVE_PROPS = [
  "fontSize",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "gap",
  "textAlign",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "flexDirection",
  "columns",
  "gridCols",
  "display",
  "alignItems",
  "justifyContent",
];

/**
 * Check if a value is already in ResponsiveValue format
 */
function isResponsiveValue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "mobile" in v || "tablet" in v || "desktop" in v;
}

/**
 * Migrate props to Studio format (add responsive wrapper if needed)
 */
function migrateProps(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  const migratedProps: Record<string, unknown> = {};
  
  Object.entries(props).forEach(([key, value]) => {
    // Skip null/undefined
    if (value === null || value === undefined) {
      return;
    }
    
    // Wrap responsive props in ResponsiveValue format if not already
    if (RESPONSIVE_PROPS.includes(key) && !isResponsiveValue(value)) {
      migratedProps[key] = { mobile: value };
    } else {
      migratedProps[key] = value;
    }
  });
  
  return migratedProps;
}

// ============================================================================
// Main Migration Functions
// ============================================================================

/**
 * Generate a unique component ID
 */
function generateId(prefix: string = "comp"): string {
  return `${prefix}-${nanoid(8)}`;
}

/**
 * Migrates old Puck page data to Studio format.
 * Run this on pages that were created before Studio.
 */
export function migratePuckToStudio(puckData: PuckData): StudioPageData {
  const components: Record<string, StudioComponent> = {};
  const rootChildren: string[] = [];
  
  // Create base Studio data structure
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
  if (puckData.content && Array.isArray(puckData.content)) {
    puckData.content.forEach((puckComp) => {
      const id = generateId("migrated");
      
      components[id] = {
        id,
        type: mapPuckTypeToStudio(puckComp.type),
        props: migrateProps(puckComp.type, puckComp.props || {}),
        parentId: "root",
      };
      
      rootChildren.push(id);
    });
  }
  
  // Migrate zones if present
  if (puckData.zones && typeof puckData.zones === "object") {
    Object.entries(puckData.zones).forEach(([zoneId, zoneContent]) => {
      if (!Array.isArray(zoneContent)) return;
      
      studioData.zones![zoneId] = [];
      
      zoneContent.forEach((puckComp) => {
        const id = generateId(`zone-${zoneId}`);
        
        components[id] = {
          id,
          type: mapPuckTypeToStudio(puckComp.type),
          props: migrateProps(puckComp.type, puckComp.props || {}),
          zoneId,
        };
        
        studioData.zones![zoneId].push(id);
      });
    });
  }
  
  return studioData;
}

/**
 * Check if data is already in Studio format
 */
export function isStudioFormat(data: unknown): data is StudioPageData {
  if (!data || typeof data !== "object") return false;
  
  const d = data as Record<string, unknown>;
  
  // Studio format has version "1.0", root object, and components record
  return (
    d.version === "1.0" && 
    typeof d.root === "object" && 
    d.root !== null &&
    typeof d.components === "object" &&
    d.components !== null
  );
}

/**
 * Check if data is in Puck format
 */
export function isPuckFormat(data: unknown): data is PuckData {
  if (!data || typeof data !== "object") return false;
  
  const d = data as Record<string, unknown>;
  
  // Puck format has content array and root object
  return (
    Array.isArray(d.content) && 
    typeof d.root === "object" &&
    d.root !== null
  );
}

/**
 * Auto-migrate data to Studio format if needed
 * This is the main entry point for migration
 */
export function ensureStudioFormat(data: unknown): StudioPageData {
  // Already Studio format
  if (isStudioFormat(data)) {
    return data;
  }
  
  // Empty data - return empty Studio format
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return createEmptyStudioData();
  }
  
  // Parse if string
  let parsed = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      console.warn("[Migration] Failed to parse data string, returning empty");
      return createEmptyStudioData();
    }
  }
  
  // Puck format - migrate
  if (isPuckFormat(parsed)) {
    console.log("[Migration] Converting Puck format to Studio format");
    return migratePuckToStudio(parsed);
  }
  
  // Unknown format - return empty
  console.warn("[Migration] Unknown data format, returning empty");
  return createEmptyStudioData();
}

/**
 * Create empty Studio page data
 */
export function createEmptyStudioData(): StudioPageData {
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {},
      children: [],
    },
    components: {},
    zones: {},
  };
}

/**
 * Validate Studio data structure
 */
export function validateStudioData(data: StudioPageData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (data.version !== "1.0") {
    errors.push(`Invalid version: ${data.version}`);
  }
  
  if (!data.root || typeof data.root !== "object") {
    errors.push("Missing or invalid root object");
  }
  
  if (!data.components || typeof data.components !== "object") {
    errors.push("Missing or invalid components object");
  }
  
  // Validate component references
  if (data.root?.children) {
    data.root.children.forEach((childId) => {
      if (!data.components[childId]) {
        errors.push(`Root references missing component: ${childId}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Acceptance Criteria:**
- [ ] Migration correctly converts Puck `content` array to Studio `components` record
- [ ] Responsive props are wrapped in `{ mobile: value }` format
- [ ] Component type names are correctly mapped
- [ ] Empty data returns valid empty Studio format
- [ ] Already-Studio data passes through unchanged

---

### Task 2: Create StudioRenderer Component

**Description:** Create the main StudioRenderer component that renders pages using Studio's component system. This replaces Puck's `<Render>` component.

**File to CREATE:** `src/lib/studio/engine/renderer.tsx`

```tsx
"use client";

/**
 * StudioRenderer - Main page rendering component
 * 
 * Renders page content using DRAMAC Studio's component system.
 * Replaces Puck's <Render> component for preview and published pages.
 * 
 * Features:
 * - Auto-migrates old Puck data to Studio format
 * - Renders all registered Studio components
 * - Supports theme settings/CSS variables
 * - SSR-compatible with "use client" directive
 */

import React, { useMemo } from "react";
import { ensureStudioFormat } from "../utils/migrate-puck-data";
import { getComponent } from "../registry/component-registry";
import type { StudioPageData, StudioComponent } from "@/types/studio";

// ============================================================================
// Types
// ============================================================================

interface StudioRendererProps {
  /** Page data - can be Studio format, Puck format, or string JSON */
  data: unknown;
  /** Theme settings for CSS variables */
  themeSettings?: Record<string, unknown> | null;
  /** Site ID for analytics/tracking */
  siteId?: string;
  /** Page ID for analytics/tracking */
  pageId?: string;
  /** Additional CSS class */
  className?: string;
}

interface ComponentRendererProps {
  component: StudioComponent;
  components: Record<string, StudioComponent>;
  depth?: number;
}

// ============================================================================
// Component Renderer
// ============================================================================

/**
 * Renders a single component and its children recursively
 */
function ComponentRenderer({ 
  component, 
  components,
  depth = 0,
}: ComponentRendererProps): React.ReactElement | null {
  // Get component definition from registry
  const definition = getComponent(component.type);
  
  if (!definition) {
    // Component type not found - show placeholder in dev, hide in prod
    if (process.env.NODE_ENV === "development") {
      return (
        <div 
          key={component.id}
          className="border-2 border-dashed border-amber-400 bg-amber-50 p-4 rounded text-center"
        >
          <p className="text-amber-700 text-sm font-medium">
            Unknown component: {component.type}
          </p>
        </div>
      );
    }
    return null;
  }
  
  // Render component
  const RenderComponent = definition.render;
  
  // Get children if this component has any
  const children = component.children?.map((childId) => {
    const childComponent = components[childId];
    if (!childComponent) return null;
    
    return (
      <ComponentRenderer
        key={childId}
        component={childComponent}
        components={components}
        depth={depth + 1}
      />
    );
  }).filter(Boolean);
  
  return (
    <RenderComponent
      key={component.id}
      {...component.props}
      id={component.id}
    >
      {children && children.length > 0 ? children : undefined}
    </RenderComponent>
  );
}

// ============================================================================
// Zone Renderer
// ============================================================================

interface ZoneRendererProps {
  zoneId: string;
  componentIds: string[];
  components: Record<string, StudioComponent>;
}

/**
 * Renders components within a zone
 */
function ZoneRenderer({ 
  zoneId, 
  componentIds, 
  components,
}: ZoneRendererProps): React.ReactElement {
  return (
    <div data-zone={zoneId} className="studio-zone">
      {componentIds.map((id) => {
        const component = components[id];
        if (!component) return null;
        
        return (
          <ComponentRenderer
            key={id}
            component={component}
            components={components}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Theme CSS Generator
// ============================================================================

/**
 * Generate CSS custom properties from theme settings
 */
function generateThemeCSS(settings: Record<string, unknown>): React.CSSProperties {
  const cssVars: Record<string, string> = {};
  
  // Map theme settings to CSS variables
  const mappings: Record<string, string> = {
    primaryColor: "--theme-primary",
    secondaryColor: "--theme-secondary",
    accentColor: "--theme-accent",
    backgroundColor: "--theme-background",
    textColor: "--theme-foreground",
    headingFont: "--theme-font-heading",
    bodyFont: "--theme-font-body",
    borderRadius: "--theme-radius",
  };
  
  Object.entries(mappings).forEach(([key, cssVar]) => {
    if (settings[key] !== undefined && settings[key] !== null) {
      cssVars[cssVar] = String(settings[key]);
    }
  });
  
  return cssVars as React.CSSProperties;
}

// ============================================================================
// Main StudioRenderer
// ============================================================================

/**
 * Main page renderer component
 * Use this instead of Puck's <Render> for all page rendering
 */
export function StudioRenderer({
  data,
  themeSettings,
  siteId,
  pageId,
  className = "",
}: StudioRendererProps): React.ReactElement {
  // Migrate data to Studio format (memoized)
  const studioData = useMemo(() => {
    return ensureStudioFormat(data);
  }, [data]);
  
  // Generate theme CSS variables
  const themeStyles = useMemo(() => {
    return themeSettings ? generateThemeCSS(themeSettings) : {};
  }, [themeSettings]);
  
  // Empty state
  if (!studioData.root.children || studioData.root.children.length === 0) {
    return (
      <div 
        className={`studio-renderer studio-empty ${className}`}
        style={themeStyles}
        data-site-id={siteId}
        data-page-id={pageId}
      >
        {/* Empty page - could show a placeholder in preview mode */}
      </div>
    );
  }
  
  // Render page content
  return (
    <div 
      className={`studio-renderer ${className}`}
      style={themeStyles}
      data-site-id={siteId}
      data-page-id={pageId}
    >
      {/* Root children */}
      {studioData.root.children.map((id) => {
        const component = studioData.components[id];
        if (!component) return null;
        
        return (
          <ComponentRenderer
            key={id}
            component={component}
            components={studioData.components}
          />
        );
      })}
      
      {/* Zones (if any) */}
      {studioData.zones && Object.entries(studioData.zones).map(([zoneId, componentIds]) => (
        <ZoneRenderer
          key={zoneId}
          zoneId={zoneId}
          componentIds={componentIds}
          components={studioData.components}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ComponentRenderer, ZoneRenderer };
export type { StudioRendererProps };
```

**Update the engine index file:**

**File to MODIFY:** `src/lib/studio/engine/index.ts`

Add the export:

```typescript
export { StudioRenderer } from "./renderer";
export type { StudioRendererProps } from "./renderer";
```

**Acceptance Criteria:**
- [ ] StudioRenderer accepts Puck format, Studio format, or JSON string
- [ ] Components render correctly based on registry definitions
- [ ] Theme settings apply as CSS custom properties
- [ ] Unknown components show placeholder in dev, hidden in prod
- [ ] Empty pages render without errors

---

### Task 3: Update All Navigation Links

**Description:** Find and update every link that points to the old Puck editor. Switch them to use Studio.

**Files to MODIFY:**

#### 3.1 src/components/sites/site-pages-list.tsx

Current file already has most links pointing to Studio, but there's a "Legacy Editor" option that should be removed:

```typescript
// FIND (around line 128):
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Legacy Editor
                          </Link>
                        </DropdownMenuItem>

// REMOVE this entire DropdownMenuItem block
// Users should only see Studio as the editor option
```

#### 3.2 src/components/sites/create-site-dialog.tsx

```typescript
// FIND (around line 85-87):
        const siteId = result.data?.site?.id;
        const pageId = result.data?.homepage?.id;
        if (siteId && pageId) {
          router.push(`/dashboard/sites/${siteId}/editor?pageId=${pageId}`);
        } else {
          router.push(`/dashboard/sites/${siteId}`);
        }

// REPLACE WITH:
        const siteId = result.data?.site?.id;
        const pageId = result.data?.homepage?.id;
        if (siteId && pageId) {
          router.push(`/studio/${siteId}/${pageId}`);
        } else {
          router.push(`/dashboard/sites/${siteId}`);
        }
```

#### 3.3 src/components/sites/create-site-form.tsx

```typescript
// FIND (around line 130-136):
          const siteId = result.data?.site?.id;
          const pageId = result.data?.homepage?.id;
          if (siteId && pageId) {
            router.push(`/dashboard/sites/${siteId}/editor?pageId=${pageId}`);
          } else {
            router.push(`/dashboard/sites/${siteId}`);
          }

// REPLACE WITH:
          const siteId = result.data?.site?.id;
          const pageId = result.data?.homepage?.id;
          if (siteId && pageId) {
            router.push(`/studio/${siteId}/${pageId}`);
          } else {
            router.push(`/dashboard/sites/${siteId}`);
          }
```

#### 3.4 src/components/pages/create-page-form.tsx

```typescript
// FIND (around line 79):
        router.push(`/dashboard/sites/${siteId}/editor?page=${result.data?.id}`);

// REPLACE WITH:
        router.push(`/studio/${siteId}/${result.data?.id}`);
```

#### 3.5 src/components/sites/sites-grid.tsx

```typescript
// FIND (around line 145):
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/sites/${site.id}/editor`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Open Editor
                    </Link>
                  </DropdownMenuItem>

// This link needs a page ID. Either:
// Option A: Link to the site's homepage in Studio (requires fetching homepage)
// Option B: Link to site overview page

// REPLACE WITH Option B (simpler):
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/sites/${site.id}/pages`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Edit Pages
                    </Link>
                  </DropdownMenuItem>
```

**Verification Command:**
```bash
# After changes, verify no old editor links remain
grep -r "/editor" src/components/ --include="*.tsx" | grep -v "Legacy" | grep -v "//"
```

**Acceptance Criteria:**
- [ ] Zero links to `/dashboard/sites/*/editor*` remain (except legacy redirect)
- [ ] Creating a new site redirects to Studio
- [ ] Creating a new page redirects to Studio
- [ ] All "Edit" buttons use Studio route format `/studio/[siteId]/[pageId]`

---

### Task 4: Replace Page Renderers

**Description:** Update preview and public page routes to use StudioRenderer instead of Puck's Render.

#### 4.1 src/app/preview/[siteId]/[pageId]/page.tsx

**REPLACE entire file with:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import { Loader2, AlertTriangle, FileText } from "lucide-react";

interface PreviewPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

interface PreviewData {
  page: {
    id: string;
    name: string;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  site: {
    id: string;
    name: string;
    subdomain: string;
    theme_settings: Record<string, unknown> | null;
  } | null;
  content: string | null;
  themeSettings: Record<string, unknown> | null;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const resolvedParams = use(params);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch(
          `/api/preview/${resolvedParams.siteId}/${resolvedParams.pageId}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to load preview (${response.status})`
          );
        }

        const previewData = await response.json();
        setData(previewData);
      } catch (err) {
        console.error("[Preview] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [resolvedParams.siteId, resolvedParams.pageId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-gray-900">
            Preview Error
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (!data || !data.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-gray-900">
            No Content Yet
          </h1>
          <p className="text-gray-500">
            This page hasn&apos;t been built yet. Open the Studio to add content.
          </p>
        </div>
      </div>
    );
  }

  // Parse content
  let pageContent: unknown;
  try {
    pageContent = typeof data.content === "string" 
      ? JSON.parse(data.content) 
      : data.content;
  } catch {
    pageContent = {};
  }

  // Render with StudioRenderer
  return (
    <>
      {/* Meta tags */}
      {data.page.metaTitle && (
        <title>{data.page.metaTitle}</title>
      )}
      
      {/* Main content */}
      <StudioRenderer
        data={pageContent}
        themeSettings={data.themeSettings || data.site?.theme_settings}
        siteId={resolvedParams.siteId}
        pageId={resolvedParams.pageId}
        className="min-h-screen"
      />
    </>
  );
}
```

#### 4.2 src/components/renderer/puck-site-renderer.tsx

**REPLACE entire file with a wrapper that uses StudioRenderer:**

```tsx
"use client";

/**
 * Site Renderer - Unified page rendering
 * 
 * This component has been migrated to use DRAMAC Studio's renderer.
 * Kept for backward compatibility with existing imports.
 * 
 * @deprecated Use StudioRenderer from "@/lib/studio/engine/renderer" directly
 */

import { StudioRenderer } from "@/lib/studio/engine/renderer";
import type { ThemeSettings } from "@/lib/renderer/theme";

interface SiteRendererProps {
  /** Content - can be string (JSON) or object */
  content: string | Record<string, unknown>;
  /** Site theme settings */
  themeSettings?: ThemeSettings | Record<string, unknown> | null;
  /** Site ID for tracking */
  siteId?: string;
  /** Page ID for tracking */
  pageId?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * @deprecated Use StudioRenderer instead
 */
export function PuckSiteRenderer({
  content,
  themeSettings,
  siteId,
  pageId,
  className = "",
}: SiteRendererProps) {
  return (
    <StudioRenderer
      data={content}
      themeSettings={themeSettings as Record<string, unknown> | null}
      siteId={siteId}
      pageId={pageId}
      className={className}
    />
  );
}

// Re-export StudioRenderer for migration convenience
export { StudioRenderer };
```

#### 4.3 Check for any other Puck render usages

Search and update any other files that use `<Render>` from Puck:

```bash
grep -r "from \"@puckeditor/core\"" src/
grep -r "from '@puckeditor/core'" src/
```

Update each file found to use StudioRenderer instead.

**Acceptance Criteria:**
- [ ] Preview route renders correctly with StudioRenderer
- [ ] Old Puck pages auto-migrate and render correctly
- [ ] Theme settings apply as CSS variables
- [ ] No visual differences from previous Puck rendering
- [ ] All responsive breakpoints work

---

### Task 5: Create Legacy Route Redirect

**Description:** Add a redirect for any bookmarked old editor URLs. This ensures users with old bookmarks don't see 404 errors.

**File to CREATE:** `src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ page?: string; pageId?: string }>;
}

/**
 * Legacy Editor Redirect
 * 
 * Redirects old Puck editor URLs to the new DRAMAC Studio.
 * Handles both ?page=X and ?pageId=X query params.
 * 
 * Old format: /dashboard/sites/[siteId]/editor?page=[pageId]
 * New format: /studio/[siteId]/[pageId]
 */
export default async function LegacyEditorRedirect({ 
  params, 
  searchParams,
}: PageProps) {
  const { siteId } = await params;
  const { page, pageId } = await searchParams;
  
  // Get the page ID from either query param
  const targetPageId = page || pageId;
  
  if (targetPageId) {
    // Redirect to Studio with the page
    redirect(`/studio/${siteId}/${targetPageId}`);
  }
  
  // No page specified - try to find the homepage
  try {
    const supabase = await createClient();
    
    const { data: homepage } = await supabase
      .from("pages")
      .select("id")
      .eq("site_id", siteId)
      .eq("is_homepage", true)
      .single();
    
    if (homepage?.id) {
      redirect(`/studio/${siteId}/${homepage.id}`);
    }
  } catch {
    // Ignore errors and fallback to pages list
  }
  
  // Fallback: redirect to site pages list
  redirect(`/dashboard/sites/${siteId}/pages`);
}
```

**Keep the existing layout file:** `src/app/(dashboard)/dashboard/sites/[siteId]/editor/layout.tsx`

If it exists and has useful logic, keep it. Otherwise, it can be deleted.

**Acceptance Criteria:**
- [ ] `/dashboard/sites/X/editor?page=Y` redirects to `/studio/X/Y`
- [ ] `/dashboard/sites/X/editor?pageId=Y` redirects to `/studio/X/Y`
- [ ] `/dashboard/sites/X/editor` (no page) redirects to homepage or pages list
- [ ] No 404 errors for legacy URLs

---

### Task 6: Delete Old Editor Files

**Description:** Remove all Puck-specific editor files from the codebase. Be careful not to delete files that are still needed.

**Directories to DELETE:**

```
# Old Puck editor components - DELETE ENTIRE FOLDER
src/components/editor/puck/

# Contents include:
# - ai/
# - components/
# - templates/
# - custom-fields.tsx
# - editor-empty-state.tsx
# - editor-loading-skeleton.tsx
# - editor-toolbar.tsx
# - index.ts
# - keyboard-shortcuts.tsx
# - puck-config.tsx
# - puck-editor-page.tsx
# - puck-editor-wrapper.tsx
# - use-puck-editor.ts
```

**Individual Files to DELETE:**

```
src/components/editor/puck-editor-integrated.tsx
```

**Files to KEEP (may reference editor context):**

```
# These may be used elsewhere - check before deleting:
src/components/editor/canvas.tsx
src/components/editor/editor-context.tsx
src/components/editor/toolbox.tsx
src/components/editor/preview-frame.tsx
src/components/editor/theme-settings.tsx
src/components/editor/toolbar/
src/components/editor/user-components/
src/components/editor/settings-panel.tsx
src/components/editor/template-library.tsx
```

**Verification Commands:**

```bash
# After deletion, check for broken imports
npx tsc --noEmit

# Search for orphaned imports
grep -r "from \"@/components/editor/puck" src/
grep -r "from '@/components/editor/puck" src/
grep -r "@puckeditor/core" src/

# All should return empty or only show the phase doc
```

**Acceptance Criteria:**
- [ ] `src/components/editor/puck/` folder deleted
- [ ] No orphaned imports (build succeeds)
- [ ] TypeScript has no errors
- [ ] No broken routes

---

### Task 7: Remove Puck Dependencies

**Description:** Remove Puck packages from package.json and clean up.

**File to MODIFY:** `package.json`

```bash
# Run these commands from next-platform-dashboard/

# Remove Puck package
pnpm remove @puckeditor/core

# Clean install
pnpm install

# Verify build
pnpm build
```

**After removal, verify package.json no longer contains:**

```json
{
  "dependencies": {
    "@puckeditor/core": "..."  // SHOULD BE GONE
  }
}
```

**Acceptance Criteria:**
- [ ] No `@puckeditor/*` packages in package.json
- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] Bundle size reduced (check with `pnpm analyze` if available)

---

### Task 8: Final Platform Testing

**Description:** Comprehensive testing of the entire platform after transition.

#### A. Editor Navigation Tests

| Test | Expected Result | Status |
|------|----------------|--------|
| Dashboard → Sites List → Click site → Pages list | Pages list loads | [ ] |
| Pages list → Click "Edit in Studio" | Studio opens | [ ] |
| Pages list → Click "Add Page" → Create form → Submit | Studio opens with new page | [ ] |
| Dashboard → Quick Actions → "Edit Site" (if exists) | Studio opens or pages list | [ ] |
| Direct URL `/studio/[siteId]/[pageId]` | Studio loads | [ ] |
| Legacy URL `/dashboard/sites/[siteId]/editor?page=X` | Redirects to Studio | [ ] |
| Legacy URL `/dashboard/sites/[siteId]/editor?pageId=X` | Redirects to Studio | [ ] |

#### B. Studio Functionality Tests

| Test | Expected Result | Status |
|------|----------------|--------|
| Studio loads | Under 2 seconds | [ ] |
| Component library | Shows all components | [ ] |
| Drag component to canvas | Component appears | [ ] |
| Click component on canvas | Component selected | [ ] |
| Properties panel | Shows correct fields | [ ] |
| Edit component props | Props update live | [ ] |
| Responsive preview | Mobile/tablet/desktop work | [ ] |
| AI chat | Opens and responds | [ ] |
| Undo (Ctrl+Z) | Reverts last action | [ ] |
| Redo (Ctrl+Shift+Z) | Re-applies action | [ ] |
| Save (Ctrl+S) | Shows success toast | [ ] |
| Templates browser | Opens, can insert | [ ] |
| Symbols panel | Shows saved symbols | [ ] |
| Layers panel | Shows component tree | [ ] |
| History panel | Shows changes | [ ] |
| Keyboard shortcuts | All working | [ ] |
| Command palette (Ctrl+K) | Opens | [ ] |

#### C. Preview & Publish Tests

| Test | Expected Result | Status |
|------|----------------|--------|
| Preview button | Opens page in new tab | [ ] |
| Preview rendering | All components correct | [ ] |
| Preview responsive | Works at all sizes | [ ] |
| Published site | Renders correctly | [ ] |
| Published site LCP | Under 1.5s | [ ] |
| Old Puck pages | Still render (migrated) | [ ] |

#### D. Dashboard Feature Regression Tests

| Feature | Status |
|---------|--------|
| Sites list | [ ] |
| Client management | [ ] |
| Blog system | [ ] |
| Media library | [ ] |
| Module marketplace | [ ] |
| Billing | [ ] |
| Team management | [ ] |
| Settings | [ ] |
| User profile | [ ] |
| Logout | [ ] |

#### E. Build & Deploy Tests

```bash
# TypeScript check
npx tsc --noEmit
# Expected: 0 errors

# ESLint check
pnpm lint
# Expected: 0 errors (or only warnings)

# Build
pnpm build
# Expected: Build succeeds

# Preview locally
pnpm start
# Expected: Works

# Deploy to Vercel (if applicable)
vercel --prod
# Expected: Deploy succeeds
```

**Acceptance Criteria:**
- [ ] All navigation tests pass
- [ ] All Studio functionality tests pass
- [ ] All preview/publish tests pass
- [ ] All dashboard features work (no regression)
- [ ] Build and deploy succeed

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/lib/studio/utils/migrate-puck-data.ts | Data migration utility |
| CREATE | src/lib/studio/engine/renderer.tsx | StudioRenderer component |
| MODIFY | src/lib/studio/engine/index.ts | Export renderer |
| MODIFY | src/components/sites/site-pages-list.tsx | Remove legacy editor link |
| MODIFY | src/components/sites/create-site-dialog.tsx | Update redirect to Studio |
| MODIFY | src/components/sites/create-site-form.tsx | Update redirect to Studio |
| MODIFY | src/components/pages/create-page-form.tsx | Update redirect to Studio |
| MODIFY | src/components/sites/sites-grid.tsx | Update "Open Editor" link |
| REPLACE | src/app/preview/[siteId]/[pageId]/page.tsx | Use StudioRenderer |
| REPLACE | src/components/renderer/puck-site-renderer.tsx | Wrapper for StudioRenderer |
| CREATE | src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx | Legacy redirect |
| DELETE | src/components/editor/puck/ | Old Puck components folder |
| DELETE | src/components/editor/puck-editor-integrated.tsx | Old editor integration |
| MODIFY | package.json | Remove @puckeditor/core |

---

## Testing Requirements

### Unit Tests

- [ ] `migrate-puck-data.ts`: Test Puck → Studio conversion
- [ ] `migrate-puck-data.ts`: Test already-Studio data passthrough
- [ ] `migrate-puck-data.ts`: Test empty data handling
- [ ] `renderer.tsx`: Test component rendering
- [ ] `renderer.tsx`: Test unknown component handling

### Integration Tests

- [ ] Legacy URL redirect works
- [ ] Preview page renders with StudioRenderer
- [ ] Old Puck pages migrate and render correctly

### Manual Testing

- [ ] Complete the Task 8 test checklist
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (preview only)

---

## Dependencies to Install

```bash
# No new dependencies needed!
# All required packages are already installed from previous phases

# We're only REMOVING:
pnpm remove @puckeditor/core
```

---

## Environment Variables

No new environment variables required.

---

## Database Changes

No database schema changes required. Page content format remains compatible.

---

## Rollback Plan

### Immediate Rollback

If critical issues arise immediately after deployment:

```bash
# Revert the integration commit
git revert HEAD
git push origin main
```

### Partial Rollback

If Studio works but some pages don't render:

```bash
# Restore old renderer temporarily
git checkout HEAD~1 -- src/components/renderer/puck-site-renderer.tsx
git checkout HEAD~1 -- src/app/preview/[siteId]/[pageId]/page.tsx

# Keep Studio links, restore Puck rendering
git commit -m "temp: restore Puck renderer while debugging"
git push
```

### Data Recovery

- Page data is stored in database, not affected by code changes
- Migration utility is non-destructive (reads only)
- Old Puck format is still parseable if needed

---

## Success Criteria

### Must Have (P0)
- [ ] All "Edit" buttons open Studio
- [ ] Creating site/page → redirects to Studio
- [ ] Preview renders correctly with StudioRenderer
- [ ] Public pages render correctly
- [ ] Old Puck pages auto-migrate
- [ ] Build succeeds with zero errors
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

Once stable for one week with no issues:

1. **Remove Legacy Redirect Route:**
   ```bash
   # Delete redirect file after confirming no traffic
   rm src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx
   rm src/app/(dashboard)/dashboard/sites/[siteId]/editor/layout.tsx
   ```

2. **Remove Migration Logging:**
   - Remove `console.log` from migration utility
   - Keep migration code for potential future needs

3. **Clean Up References:**
   - Remove comments mentioning Puck
   - Update developer documentation
   - Archive old Puck-related issues/PRs

4. **Final Verification:**
   - Check bundle size improvement
   - Verify no Puck references in codebase
   - Confirm all pages still render correctly

---

## 🎉 COMPLETION

After this phase is complete:

- ✅ **DRAMAC Studio is the ONLY editor** - No more Puck
- ✅ **Zero Puck code remains** - Clean codebase
- ✅ **Bundle size reduced** - ~200KB smaller
- ✅ **Codebase is cleaner** - No legacy editor files
- ✅ **Premium editing experience** - Webflow-level quality
- ✅ **Platform ready** - For future AI and module enhancements

---

**DRAMAC Studio is COMPLETE!** 🚀

The platform has been fully transitioned from Puck to the custom DRAMAC Studio editor. Users now have a premium, AI-first editing experience that matches the quality of Webflow, Wix Studio, and Framer.
