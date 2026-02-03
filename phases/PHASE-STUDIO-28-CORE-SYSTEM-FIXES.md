# PHASE-STUDIO-28: Core System Fixes

## 🎯 Phase Overview

**Wave**: 11 - Comprehensive Platform Fix  
**Phase**: 28 of 31  
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 10-14 hours  
**Dependencies**: Waves 1-10 Complete

---

## 📋 Mission

Fix ALL critical system issues identified after Wave 10 completion. This phase addresses the core functionality problems that break the user experience:
- Save/Publish not working
- Preview not rendering
- Canvas scrolling issues
- AI Generator Apply button failures
- Add Section button not inserting
- Drop zones not working

---

## 📊 Issues Addressed

### 🔴 CRITICAL Issues (This Phase)

| ID | Issue | Root Cause | File Location |
|----|-------|------------|---------------|
| C1 | Site preview doesn't work | API route or StudioRenderer issue | `preview/[siteId]/[pageId]/page.tsx` |
| C2 | Save/Publish silently fails | Data flow or action errors | `studio-editor.tsx`, `page-content-actions.ts` |
| C3 | Canvas scrolling breaks | Wheel event conflicts | `editor-canvas.tsx` |
| C4 | AI Apply makes content disappear | `setData()` implementation issue | `ai-page-generator.tsx`, `editor-store.ts` |
| C5 | Add Section doesn't insert | `insertComponents` not working | `template-browser.tsx`, `editor-store.ts` |
| C6 | Drop zones don't accept drops | Zone handling in DnD | `dnd-provider.tsx`, `droppable-zone.tsx` |

---

## 🔧 Implementation Tasks

### Task 28.1: Fix Save & Publish System

**Problem**: `handleSave()` and `handlePublish()` silently fail or don't persist data.

**Investigation Points**:
1. Check if `savePageContentAction` is properly imported and working
2. Verify Supabase `page_content` table has correct data
3. Check if `markSaved()` is called after successful save
4. Verify `publishSite()` is updating `sites.published` correctly

**File**: `src/components/studio/studio-editor.tsx`

```typescript
// ENHANCED handleSave with proper error handling and debugging

const handleSave = useCallback(async () => {
  try {
    setSaveStatus("saving");
    
    // Get current editor data
    const currentData = useEditorStore.getState().data;
    
    // DEBUG: Log the data being saved
    console.log("[Studio] Saving data:", {
      pageId,
      componentsCount: Object.keys(currentData.components).length,
      rootChildren: currentData.root.children.length,
    });
    
    // Validate data before save
    if (!currentData.root || !currentData.components) {
      throw new Error("Invalid page data structure");
    }
    
    // Check for empty page
    if (Object.keys(currentData.components).length === 0) {
      console.log("[Studio] Saving empty page");
    }
    
    // Save to database
    const result = await savePageContentAction(pageId, currentData as unknown as Json);
    
    if (result.error) {
      console.error("[Studio] Save error:", result.error);
      throw new Error(result.error);
    }
    
    // SUCCESS: Mark as saved
    markSaved();
    setSaveStatus("saved");
    toast.success("Page saved successfully", {
      description: `${Object.keys(currentData.components).length} components saved`,
    });
    
    setTimeout(() => setSaveStatus("idle"), 2000);
  } catch (error) {
    console.error("[Studio] Save failed:", error);
    setSaveStatus("error");
    toast.error(error instanceof Error ? error.message : "Failed to save page", {
      description: "Check console for details",
    });
  }
}, [pageId, markSaved]);

// ENHANCED handlePublish with proper error handling

const handlePublish = useCallback(async () => {
  try {
    setSaveStatus("saving");
    
    // Save first
    await handleSave();
    
    // Wait a moment for save to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Then publish the site
    console.log("[Studio] Publishing site:", siteId);
    const result = await publishSite(siteId);
    
    if (!result.success) {
      throw new Error(result.error || "Failed to publish site");
    }
    
    console.log("[Studio] Publish success:", result);
    
    toast.success("Site published successfully!", {
      description: result.siteUrl ? `Available at ${result.siteUrl}` : undefined,
      action: result.siteUrl ? {
        label: "View Site",
        onClick: () => window.open(result.siteUrl, "_blank"),
      } : undefined,
    });
  } catch (error) {
    console.error("[Studio] Publish failed:", error);
    toast.error(error instanceof Error ? error.message : "Failed to publish site");
  }
}, [handleSave, siteId]);
```

**Also Check**: `src/lib/actions/pages.ts` - Verify `savePageContentAction` implementation

```typescript
// Ensure proper error handling and return structure
export async function savePageContentAction(pageId: string, content: Json) {
  try {
    const supabase = await createClient();
    
    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if page_content exists
    const { data: existing } = await supabase
      .from("page_content")
      .select("id")
      .eq("page_id", pageId)
      .single();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("page_content")
        .update({ 
          content, 
          updated_at: new Date().toISOString(),
          updated_by: user?.id 
        })
        .eq("page_id", pageId);
      
      if (error) {
        console.error("[savePageContent] Update error:", error);
        return { error: error.message };
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("page_content")
        .insert({ 
          page_id: pageId, 
          content,
          created_by: user?.id 
        });
      
      if (error) {
        console.error("[savePageContent] Insert error:", error);
        return { error: error.message };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("[savePageContent] Exception:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
```

---

### Task 28.2: Fix Preview System

**Problem**: `/preview/[siteId]/[pageId]` shows empty or errors.

**File**: `src/app/preview/[siteId]/[pageId]/page.tsx`

```tsx
// ENHANCED preview page with comprehensive error handling

"use client";

import { use, useEffect, useState } from "react";
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import type { StudioPageData } from "@/types/studio";
import { createEmptyPageData } from "@/types/studio";

interface PreviewPageProps {
  params: Promise<{
    siteId: string;
    pageId: string;
  }>;
}

interface PreviewData {
  content: StudioPageData | string | null;
  site?: {
    name: string;
    subdomain: string;
  };
  page?: {
    title: string;
    slug: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const resolvedParams = use(params);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        console.log("[Preview] Fetching:", resolvedParams);
        
        const response = await fetch(
          `/api/preview/${resolvedParams.siteId}/${resolvedParams.pageId}`,
          { cache: "no-store" }
        );

        const responseData = await response.json();
        console.log("[Preview] API Response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.error || `Failed to load preview (${response.status})`);
        }

        setData(responseData);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h1 className="text-lg font-semibold text-destructive">Preview Error</h1>
          <p className="mt-2 text-sm text-destructive/80">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-primary px-4 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!data?.content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-lg font-semibold">No Content</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page has no content yet.
          </p>
        </div>
      </div>
    );
  }

  // Parse content if it's a string
  let pageContent: StudioPageData;
  try {
    pageContent = typeof data.content === "string" 
      ? JSON.parse(data.content) 
      : data.content;
    
    console.log("[Preview] Parsed content:", {
      hasRoot: !!pageContent.root,
      componentsCount: Object.keys(pageContent.components || {}).length,
      rootChildren: pageContent.root?.children?.length || 0,
    });
    
    // Validate structure
    if (!pageContent.root || !pageContent.components) {
      throw new Error("Invalid page structure");
    }
  } catch (parseError) {
    console.error("[Preview] Parse error:", parseError);
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h1 className="text-lg font-semibold text-destructive">Content Error</h1>
          <p className="mt-2 text-sm text-destructive/80">
            Failed to parse page content. Please try saving the page again.
          </p>
        </div>
      </div>
    );
  }

  // Empty page check
  if (pageContent.root.children.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Empty Page</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add some components in the editor to see them here.
          </p>
        </div>
      </div>
    );
  }

  // Render the page
  return (
    <div className="min-h-screen">
      <StudioRenderer data={pageContent} />
    </div>
  );
}
```

**Also Check**: `src/app/api/preview/[siteId]/[pageId]/route.ts`

```typescript
// Ensure API route returns proper data
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; pageId: string }> }
) {
  try {
    const { siteId, pageId } = await params;
    const supabase = await createClient();
    
    // Fetch page content
    const { data: pageContent, error: contentError } = await supabase
      .from("page_content")
      .select("content")
      .eq("page_id", pageId)
      .single();
    
    if (contentError && contentError.code !== "PGRST116") {
      console.error("[Preview API] Content error:", contentError);
      return NextResponse.json({ error: contentError.message }, { status: 500 });
    }
    
    // Fetch page metadata
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("title, slug")
      .eq("id", pageId)
      .single();
    
    if (pageError) {
      console.error("[Preview API] Page error:", pageError);
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    
    // Fetch site info
    const { data: site } = await supabase
      .from("sites")
      .select("name, subdomain")
      .eq("id", siteId)
      .single();
    
    return NextResponse.json({
      content: pageContent?.content || null,
      page,
      site,
    });
  } catch (error) {
    console.error("[Preview API] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
```

---

### Task 28.3: Fix Canvas Scrolling

**Problem**: Canvas scrolling breaks and stops working after interactions.

**File**: `src/components/studio/canvas/editor-canvas.tsx`

```tsx
// IMPROVED wheel handling - add this to EditorCanvas component

export function EditorCanvas({ className }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  
  // IMPROVED: More robust wheel handling
  const handleWheel = useCallback((e: WheelEvent) => {
    // Only intercept zoom gestures (Ctrl/Cmd + wheel)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.min(4, Math.max(0.1, zoom + delta));
      setZoom(newZoom);
      return;
    }
    
    // Allow normal scrolling to pass through - DO NOT prevent default
    // This ensures scrolling works naturally
  }, [zoom, setZoom]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use capture phase to handle zoom before other listeners
    // BUT only prevent default for zoom, not scroll
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleWheel(e);
      }
      // Normal scroll events pass through naturally
    };
    
    canvas.addEventListener("wheel", wheelHandler, { passive: false });
    
    return () => {
      canvas.removeEventListener("wheel", wheelHandler);
    };
  }, [handleWheel]);
  
  return (
    <div
      ref={canvasRef}
      className={cn(
        "flex w-full h-full overflow-auto items-start justify-center p-8",
        className
      )}
      style={{
        // Use overscrollBehavior to prevent scroll chaining issues
        overscrollBehavior: "contain",
      }}
      data-canvas-container
    >
      {/* Canvas content */}
    </div>
  );
}
```

---

### Task 28.4: Fix AI Generator Apply Button

**Problem**: Clicking "Apply" in AI generator makes everything disappear.

**File**: `src/components/studio/ai/ai-page-generator.tsx`

```tsx
// ENHANCED applyPage function with validation and debugging

const applyPage = () => {
  if (!result?.data) {
    console.error("[AI Generator] No data to apply");
    toast.error("No generated page data available");
    return;
  }
  
  console.log("[AI Generator] Applying data:", {
    rootChildren: result.data.root?.children?.length || 0,
    componentsCount: Object.keys(result.data.components || {}).length,
    componentTypes: Object.values(result.data.components || {}).map((c: any) => c.type),
  });
  
  // Validate the generated data structure
  if (!result.data.root) {
    console.error("[AI Generator] Missing root in generated data");
    toast.error("Invalid generated page structure: missing root");
    return;
  }
  
  if (!result.data.components) {
    console.error("[AI Generator] Missing components in generated data");
    toast.error("Invalid generated page structure: missing components");
    return;
  }
  
  // Ensure root.children array exists
  if (!result.data.root.children) {
    result.data.root.children = [];
  }
  
  // Ensure zones object exists
  if (!result.data.zones) {
    result.data.zones = {};
  }
  
  // Check that all component types are registered
  const { componentRegistry } = await import("@/lib/studio/registry/component-registry");
  const unregisteredTypes: string[] = [];
  
  Object.values(result.data.components).forEach((comp: any) => {
    if (!componentRegistry.has(comp.type)) {
      unregisteredTypes.push(comp.type);
    }
  });
  
  if (unregisteredTypes.length > 0) {
    console.warn("[AI Generator] Unregistered component types:", unregisteredTypes);
    toast.warning(`Some component types not found: ${unregisteredTypes.join(', ')}`, {
      description: "These components will show as unknown",
    });
  }
  
  // Apply the data
  try {
    console.log("[AI Generator] Calling setData...");
    setData(result.data);
    console.log("[AI Generator] setData complete");
    
    toast.success("Page generated successfully!", {
      description: `Added ${Object.keys(result.data.components).length} components`,
    });
    
    handleClose();
  } catch (error) {
    console.error("[AI Generator] Apply error:", error);
    toast.error("Failed to apply generated page");
  }
};
```

**Also verify** `src/lib/studio/store/editor-store.ts` setData implementation:

```typescript
setData: (data) => {
  console.log("[EditorStore] setData called:", {
    rootChildren: data.root?.children?.length,
    componentsCount: Object.keys(data.components || {}).length,
  });
  
  set((state) => {
    // Completely replace data with validated structure
    state.data = {
      root: {
        children: data.root?.children || [],
        props: data.root?.props || {},
      },
      components: data.components || {},
      zones: data.zones || {},
    };
    state.isDirty = true;
    state.isLoading = false;
    state.error = null;
  });
  
  console.log("[EditorStore] setData complete, new state:", {
    rootChildren: get().data.root.children.length,
    componentsCount: Object.keys(get().data.components).length,
  });
},
```

---

### Task 28.5: Fix Add Section Button

**Problem**: "Add Section" button in toolbar doesn't add anything.

**File**: `src/components/studio/features/template-browser.tsx`

```tsx
// ENHANCED handleInsertTemplate with proper debugging and error handling

const handleInsertTemplate = useCallback(async (template: SectionTemplate) => {
  console.log("[TemplateBrowser] Inserting template:", template.name);
  
  try {
    // Prepare template components with new IDs
    const { components, rootId, idMap } = prepareTemplateForInsertion(template.components);
    
    console.log("[TemplateBrowser] Prepared components:", {
      count: components.length,
      rootId,
      types: components.map(c => c.type),
      idMap,
    });
    
    if (components.length === 0) {
      console.error("[TemplateBrowser] No components to insert");
      toast.error("Template has no components");
      return;
    }
    
    // Get current root children count for insert position
    const currentChildrenCount = useEditorStore.getState().data.root.children.length;
    
    // Use insertComponents from editor store
    const insertedIds = insertComponents(
      components,
      insertPosition === "end" ? currentChildrenCount : 0,
      undefined, // parentId - inserting at root
      undefined  // zoneId
    );
    
    console.log("[TemplateBrowser] Inserted IDs:", insertedIds);
    
    if (insertedIds && insertedIds.length > 0) {
      toast.success(`Added "${template.name}" section`, {
        description: `${insertedIds.length} components added`,
      });
      onOpenChange(false);
    } else {
      console.error("[TemplateBrowser] insertComponents returned empty");
      toast.error("Failed to insert template - no components added");
    }
  } catch (error) {
    console.error("[TemplateBrowser] Insert error:", error);
    toast.error("Failed to add section");
  }
}, [insertComponents, insertPosition, onOpenChange]);
```

**Verify** `src/lib/studio/store/editor-store.ts` insertComponents:

```typescript
insertComponents: (components, insertIndex, parentId, zoneId) => {
  console.log("[EditorStore] insertComponents called:", {
    count: components.length,
    insertIndex,
    parentId,
    zoneId,
  });
  
  const insertedIds: string[] = [];
  
  set((state) => {
    for (const component of components) {
      // Generate new ID if not provided
      const id = component.id || generateComponentId();
      
      // Add component to map
      state.data.components[id] = {
        ...component,
        id,
        parentId: parentId || undefined,
        zoneId: zoneId || undefined,
      };
      
      insertedIds.push(id);
      
      // Add to parent's children or root
      if (zoneId && state.data.zones) {
        if (!state.data.zones[zoneId]) {
          state.data.zones[zoneId] = [];
        }
        if (insertIndex !== undefined) {
          state.data.zones[zoneId].splice(insertIndex, 0, id);
        } else {
          state.data.zones[zoneId].push(id);
        }
      } else if (parentId && state.data.components[parentId]) {
        const parent = state.data.components[parentId];
        if (!parent.children) {
          parent.children = [];
        }
        if (insertIndex !== undefined) {
          parent.children.splice(insertIndex, 0, id);
        } else {
          parent.children.push(id);
        }
      } else {
        // Insert at root
        if (insertIndex !== undefined) {
          state.data.root.children.splice(insertIndex, 0, id);
        } else {
          state.data.root.children.push(id);
        }
      }
    }
    
    state.isDirty = true;
  });
  
  console.log("[EditorStore] insertComponents complete:", insertedIds);
  return insertedIds;
},
```

---

### Task 28.6: Fix Drop Zones for Layout Components

**Problem**: Can't drag components inside layout containers (Section, Columns, Container).

**File**: `src/components/studio/dnd/dnd-provider.tsx`

```tsx
// ENHANCED handleDragEnd with zone handling

const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  
  console.log("[DnD] Drag end:", {
    activeId: active?.id,
    overId: over?.id,
    activeData: active?.data?.current,
    overData: over?.data?.current,
  });
  
  // Reset state
  setActiveDrag(null);
  setOverId(null);
  setDragging(false, null);
  
  if (!over) {
    console.log("[DnD] No drop target");
    return;
  }
  
  const dragData = active.data.current as DragData;
  const overData = over.data.current;
  
  // Handle zone drops (containers like Section, Columns)
  if (overData?.type === "zone") {
    const zoneId = overData.zone as string;
    const zoneDef = overData.zoneDef as ZoneDefinition | undefined;
    const parsedZone = parseZoneId(zoneId);
    
    console.log("[DnD] Zone drop:", { zoneId, zoneDef, parsedZone });
    
    if (!parsedZone) {
      console.error("[DnD] Invalid zone ID:", zoneId);
      return;
    }
    
    const { parentId } = parsedZone;
    
    if (dragData.source === "library") {
      const libData = dragData as LibraryDragData;
      const definition = componentRegistry.get(libData.componentType);
      
      // Add new component to zone
      const newId = addComponent(
        libData.componentType,
        definition?.defaultProps || {},
        parentId,
        overData.index ?? 0,
        zoneId
      );
      
      console.log("[DnD] Added to zone:", newId);
      selectComponent(newId);
      toast.success(`Added ${libData.componentType}`);
      
    } else if (dragData.source === "canvas") {
      const canvasData = dragData as CanvasDragData;
      
      // Move existing component to zone
      moveComponent(
        canvasData.componentId,
        parentId,
        overData.index ?? 0,
        zoneId
      );
      
      console.log("[DnD] Moved to zone");
    }
    return;
  }
  
  // Handle canvas/root drops
  if (overData?.type === "canvas" || over.id === "droppable-canvas") {
    if (dragData.source === "library") {
      const libData = dragData as LibraryDragData;
      const definition = componentRegistry.get(libData.componentType);
      
      const newId = addComponent(
        libData.componentType,
        definition?.defaultProps || {},
        "root",
        overData?.index
      );
      
      console.log("[DnD] Added to root:", newId);
      selectComponent(newId);
      toast.success(`Added ${libData.componentType}`);
    }
    return;
  }
  
  // Handle sortable reorder
  if (overData?.type === "sortable") {
    // Reorder logic...
  }
}, [addComponent, moveComponent, selectComponent, setDragging, data]);
```

**Also update** `src/components/studio/dnd/droppable-zone.tsx`:

```tsx
// Ensure zones are properly droppable

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableZoneProps {
  zoneId: string;
  parentId: string;
  zoneDef?: ZoneDefinition;
  children?: React.ReactNode;
  className?: string;
}

export function DroppableZone({ 
  zoneId, 
  parentId, 
  zoneDef, 
  children,
  className 
}: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `zone:${zoneId}`,
    data: {
      type: "zone",
      zone: zoneId,
      parentId,
      zoneDef,
    },
  });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[40px] transition-colors",
        isOver && "bg-primary/10 ring-2 ring-primary/50 ring-inset",
        !children && "border-2 border-dashed border-muted-foreground/20",
        className
      )}
      data-zone={zoneId}
    >
      {children || (
        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
          {zoneDef?.label || "Drop components here"}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Deliverables Checklist

- [ ] Save system working with proper error handling and feedback
- [ ] Publish system working with confirmation and site URL
- [ ] Preview page loading and rendering correctly
- [ ] Canvas scrolling smooth and unbreakable
- [ ] AI generator Apply button working correctly
- [ ] Add Section button inserting templates
- [ ] Drop zones working for all layout components
- [ ] All changes have console logging for debugging
- [ ] TypeScript compiles with 0 errors

---

## 🧪 Testing Requirements

### After Implementation:
```
1. Create new site → Add page → Open Studio
2. Add components (Section > Heading > Text > Button)
3. Click Save → Should show success toast with component count
4. Refresh page → Content should persist
5. Click Publish → Should show success with URL
6. Open Preview in new tab → Should render page correctly
7. Test scrolling in canvas → Should be smooth, zoom with Ctrl+wheel
8. Use AI Generator → Apply → Content should appear on canvas
9. Click Add Section → Select template → Should add to canvas
10. Drag component into Section → Should nest properly
11. Check console for any errors
```

---

## 📝 Notes

1. **Debug First**: Add console.log statements to understand data flow
2. **Check Data Flow**: Most issues are data not flowing correctly between stores
3. **Verify Registry**: Components must be registered before they can render
4. **Test Incrementally**: Fix one issue, test, then move to next
5. **Keep Existing Code**: Don't delete working code, only enhance

---

## 🚨 CRITICAL: DO NOT

1. ❌ Delete or remove existing component files
2. ❌ Change the store structure significantly
3. ❌ Remove any working features
4. ❌ Skip error handling
5. ❌ Ignore TypeScript errors

---

**Phase Duration**: 10-14 hours  
**Dependencies**: Waves 1-10 complete  
**Blocks**: Phase 29 (Component & UI Enhancement)
