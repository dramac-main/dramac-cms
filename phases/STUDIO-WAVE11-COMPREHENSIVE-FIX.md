# DRAMAC Studio Wave 11: Comprehensive Platform Fix

## 🎯 MISSION CRITICAL

After completing Waves 1-10, the DRAMAC Studio editor has critical issues that must be resolved. This wave addresses ALL reported problems with a complete deep-dive into the codebase.

**This is a 2-PHASE wave:**
- **Phase 28**: Core System Fixes (Save, Publish, Preview, Canvas)
- **Phase 29**: Component & UI Enhancement (Components, Toolbar, AI, Animations)

---

## 📋 ISSUES TO FIX (User Reported + Deep Scan Findings)

### ❌ CRITICAL (Breaking Functionality)
| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| C1 | Site preview completely doesn't work | `/preview/[siteId]/[pageId]/page.tsx`, `StudioRenderer` | 🔴 P0 |
| C2 | Website doesn't save nor publish | `studio-editor.tsx`, `savePageContentAction`, `publishSite` | 🔴 P0 |
| C3 | Canvas scrolling breaks and stops working | `editor-canvas.tsx`, wheel event handling | 🔴 P0 |
| C4 | AI generator - Apply button makes everything disappear | `ai-page-generator.tsx`, `applyPage()`, `setData()` | 🔴 P0 |
| C5 | Add Section button doesn't add anything | `studio-toolbar.tsx`, `TemplateBrowser` | 🔴 P0 |

### ⚠️ HIGH (Major Feature Issues)
| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| H1 | Layout components can't drag inside them (no drop zones work) | `dnd-provider.tsx`, zone handling | 🟠 P1 |
| H2 | Open AI assistant toolbar button doesn't work | `studio-toolbar.tsx`, AI button handler missing | 🟠 P1 |
| H3 | Bottom panel AI tab shows placeholder text only | `BottomPanelContent` in `studio-editor.tsx` | 🟠 P1 |
| H4 | Components are super basic - need maxing out | `renders.tsx`, component definitions | 🟠 P1 |

### 🟡 MEDIUM (UX Issues)
| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| M1 | Toolbar looks cluttered - needs compression | `studio-toolbar.tsx` | 🟡 P2 |
| M2 | AI page generator doesn't indicate background work | `ai-page-generator.tsx` | 🟡 P2 |
| M3 | AI assistant should appear when no component selected | AI store, canvas empty state | 🟡 P2 |
| M4 | Header/footer need hamburger menu on mobile | `NavbarRender`, `FooterRender` | 🟡 P2 |

### 🔵 ENHANCEMENT (Features to Add)
| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| E1 | Components need to be highly customizable for AI building | All component definitions | 🔵 P3 |
| E2 | Hero needs video backgrounds, super customization | `HeroRender` | 🔵 P3 |
| E3 | SEO optimization for all sites | Page/site settings | 🔵 P3 |
| E4 | Animations, 3D, award-winning capabilities | New component system | 🔵 P3 |
| E5 | Module component building instructions | Documentation | 🔵 P3 |

---

## 📚 CODEBASE CONTEXT (Critical Files)

### Core Architecture
```
src/components/studio/
├── studio-editor.tsx          # Main editor (334 lines) - has handleSave, handlePublish
├── canvas/
│   └── editor-canvas.tsx      # Canvas rendering (417 lines) - has scroll/zoom issues
├── ai/
│   └── ai-page-generator.tsx  # AI wizard (431 lines) - Apply button broken
├── dnd/
│   └── dnd-provider.tsx       # Drag-and-drop (435 lines) - zone drops not working
├── layout/
│   └── studio-toolbar.tsx     # Toolbar (475 lines) - cluttered, AI button broken
└── panels/
    └── component-library.tsx  # Component browser
```

### Data Flow
```
User Action → Store Update → Canvas Re-render → Preview/Publish

Save Flow:
1. handleSave() in studio-editor.tsx
2. Gets data from useEditorStore.getState().data
3. Calls savePageContentAction(pageId, data)
4. Should update page_content table

Publish Flow:
1. handlePublish() in studio-editor.tsx
2. Calls handleSave() first
3. Then calls publishSite(siteId)
4. Updates sites.published = true
```

### Store Structure (11 stores in `/lib/studio/store/`)
```typescript
// editor-store.ts (801 lines)
interface EditorState {
  data: StudioPageData;      // Page content
  siteId: string | null;
  pageId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
}

// Key actions that may be broken:
- initialize(siteId, pageId, data)
- addComponent(type, props, parentId, index, zoneId)
- setData(data)  // Used by AI generator - THIS MAY BE THE BUG
- insertComponents(components, insertIndex, parentId, zoneId)
```

### Component Registry (`/lib/studio/registry/`)
```typescript
// core-components.ts (1759 lines) - Registers 50+ components
// Component categories:
- layout: Section, Container, Columns, Card, Spacer, Divider (6)
- typography: Heading, Text (2)
- buttons: Button (1)
- media: Image, Video, Map (3)
- sections: Hero, Features, CTA, Testimonials, FAQ, Stats, Team, Gallery (8)
- navigation: Navbar, Footer, SocialLinks (3)
- forms: Form, FormField, ContactForm, Newsletter (4)
- content: RichText, Quote, CodeBlock (3)
- interactive: Carousel, Countdown, Typewriter, Parallax (4)
- marketing: AnnouncementBar, SocialProof, TrustBadges, LogoCloud, ComparisonTable (5)
- ecommerce: ProductGrid, ProductCard, ProductCategories, CartSummary, FeaturedProducts, CartIcon (6)
```

### Render Components (`/lib/studio/blocks/renders.tsx`)
```typescript
// 4642 lines of premium mobile-first components
// Uses ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T }

// Spacing Maps:
const paddingYMap = { none: "", xs: "py-1 md:py-2", sm: "py-2 md:py-4", ... }
const paddingXMap = { none: "", xs: "px-1 md:px-2", sm: "px-2 md:px-4", ... }
const gapMap = { none: "", xs: "gap-1", sm: "gap-2", ... }

// Key function:
function getResponsiveClasses<T extends string>(
  value: ResponsiveValue<T> | undefined,
  classMap: Record<T, string>
): string
```

---

## 🔧 PHASE 28: Core System Fixes

### Estimated Time: 10-14 hours
### Files: 8-12 files modified

### Task 28.1: Fix Save & Publish System 🔴

**Problem**: `handleSave()` and `handlePublish()` silently fail or don't persist data.

**Root Cause Investigation**:
1. Check if `savePageContentAction` is properly imported and working
2. Verify Supabase `page_content` table has correct data
3. Check if `markSaved()` is called after successful save
4. Verify `publishSite()` is updating `sites.published` correctly

**Implementation**:

```typescript
// src/components/studio/studio-editor.tsx - ENHANCE handleSave

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
```

**Also check**:
- `src/app/actions/page-content-actions.ts` - Verify `savePageContentAction` works
- Database: Ensure `page_content` table exists and has correct schema

---

### Task 28.2: Fix Preview System 🔴

**Problem**: `/preview/[siteId]/[pageId]` shows empty or errors.

**Root Cause Investigation**:
1. Check API route `/api/preview/[siteId]/[pageId]/route.ts`
2. Verify `StudioRenderer` receives valid data
3. Check if `ensureStudioFormat()` handles the data correctly

**Implementation**:

```tsx
// src/app/preview/[siteId]/[pageId]/page.tsx - ENHANCE with better error handling

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
          `/api/preview/${resolvedParams.siteId}/${resolvedParams.pageId}`
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

  // ... rest of component with improved error states
  
  // CRITICAL: Parse and validate content
  if (data?.content) {
    let pageContent: StudioPageData;
    try {
      pageContent = typeof data.content === 'string' 
        ? JSON.parse(data.content) 
        : data.content;
      
      console.log("[Preview] Parsed content:", {
        hasRoot: !!pageContent.root,
        componentsCount: Object.keys(pageContent.components || {}).length,
      });
    } catch (parseError) {
      console.error("[Preview] Parse error:", parseError);
      // Show parse error state
    }
  }
}
```

---

### Task 28.3: Fix Canvas Scrolling 🔴

**Problem**: Canvas scrolling breaks and stops working after interactions.

**Root Cause**: The wheel event handler with `passive: false` may conflict with other handlers.

**Implementation**:

```tsx
// src/components/studio/canvas/editor-canvas.tsx - FIX wheel handling

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
    }
    // Allow normal scrolling to pass through
  }, [zoom, setZoom]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use capture phase to handle before other listeners
    canvas.addEventListener("wheel", handleWheel, { 
      passive: false,
      capture: true 
    });
    
    return () => {
      canvas.removeEventListener("wheel", handleWheel, { capture: true });
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
      // ... rest
    />
  );
}
```

---

### Task 28.4: Fix AI Generator Apply Button 🔴

**Problem**: Clicking "Apply" in AI generator makes everything disappear.

**Root Cause**: `setData()` likely replaces ALL data instead of merging components.

**Investigation Points**:
1. Check what `result.data` contains after generation
2. Verify `setData()` in editor-store properly updates state
3. Check if components are registered in registry

**Implementation**:

```tsx
// src/components/studio/ai/ai-page-generator.tsx - FIX applyPage

const applyPage = () => {
  if (!result?.data) {
    console.error("[AI Generator] No data to apply");
    return;
  }
  
  console.log("[AI Generator] Applying data:", {
    rootChildren: result.data.root?.children?.length,
    componentsCount: Object.keys(result.data.components || {}).length,
    components: Object.keys(result.data.components || {}),
  });
  
  // Validate the generated data structure
  if (!result.data.root || !result.data.components) {
    toast.error("Invalid generated page structure");
    return;
  }
  
  // Check that all component types are registered
  const unregisteredTypes: string[] = [];
  Object.values(result.data.components).forEach((comp: StudioComponent) => {
    if (!componentRegistry.has(comp.type)) {
      unregisteredTypes.push(comp.type);
    }
  });
  
  if (unregisteredTypes.length > 0) {
    console.warn("[AI Generator] Unregistered component types:", unregisteredTypes);
    toast.warning(`Some component types not found: ${unregisteredTypes.join(', ')}`);
  }
  
  // Apply the data
  try {
    setData(result.data);
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

**Also check** `editor-store.ts` setData:

```typescript
// Ensure setData properly resets and applies new data
setData: (data) => {
  set((state) => {
    // Completely replace data
    state.data = {
      root: data.root || { children: [], props: {} },
      components: data.components || {},
      zones: data.zones || {},
    };
    state.isDirty = true;
    state.isLoading = false;
  });
},
```

---

### Task 28.5: Fix Add Section Button 🔴

**Problem**: "Add Section" button in toolbar doesn't add anything.

**Root Cause**: Template browser's insert mechanism may not be calling `insertComponents` correctly.

**Implementation**:

```tsx
// src/components/studio/features/template-browser.tsx - FIX insertion

const handleInsertTemplate = useCallback(async (template: SectionTemplate) => {
  console.log("[TemplateBrowser] Inserting template:", template.name);
  
  try {
    startTransition(() => {
      // Prepare template components with new IDs
      const { components, rootId } = prepareTemplateForInsertion(template.components);
      
      console.log("[TemplateBrowser] Prepared components:", {
        count: components.length,
        rootId,
        types: components.map(c => c.type),
      });
      
      // Use insertComponents from editor store
      const insertedIds = insertComponents(
        components,
        insertPosition === "end" ? undefined : 0,
        parentId || undefined,
        undefined // zoneId
      );
      
      console.log("[TemplateBrowser] Inserted IDs:", insertedIds);
      
      if (insertedIds.length > 0) {
        toast.success(`Added "${template.name}" section`, {
          description: `${insertedIds.length} components added`,
        });
        onOpenChange(false);
      } else {
        toast.error("Failed to insert template");
      }
    });
  } catch (error) {
    console.error("[TemplateBrowser] Insert error:", error);
    toast.error("Failed to add section");
  }
}, [insertComponents, insertPosition, parentId, onOpenChange]);
```

---

### Task 28.6: Fix Drop Zones for Layout Components 🟠

**Problem**: Can't drag components inside layout containers (Section, Columns, Container).

**Root Cause**: `dnd-provider.tsx` may not be creating proper droppable zones for container children.

**Implementation**:

```tsx
// src/components/studio/dnd/dnd-provider.tsx - ENHANCE zone handling

// In handleDragEnd:
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  console.log("[DnD] Drag end:", {
    activeId: active?.id,
    overId: over?.id,
    activeData: active?.data?.current,
    overData: over?.data?.current,
  });
  
  if (!over) {
    console.log("[DnD] No drop target");
    return;
  }
  
  const activeData = active.data.current as DragData;
  const overData = over.data.current as DropData;
  
  // Handle zone drops
  if (overData?.type === "zone") {
    const { parentId, zoneId } = overData;
    const dropIndex = overData.index ?? 0;
    
    console.log("[DnD] Zone drop:", { parentId, zoneId, dropIndex });
    
    if (activeData?.source === "library") {
      // Add new component to zone
      addComponent(
        activeData.componentType,
        activeData.defaultProps || {},
        parentId,
        dropIndex,
        zoneId
      );
    } else if (activeData?.source === "canvas") {
      // Move existing component to zone
      moveComponent(activeData.componentId, parentId, dropIndex, zoneId);
    }
    return;
  }
  
  // Handle direct canvas drops (to root)
  if (overData?.type === "canvas" || over.id === "droppable-canvas") {
    // ... existing canvas drop logic
  }
};
```

**Also update component-wrapper.tsx** to expose drop zones:

```tsx
// Ensure container components expose their drop zones
{definition?.isContainer && definition?.zones && (
  Object.entries(definition.zones).map(([zoneId, zoneDef]) => (
    <DroppableZone
      key={zoneId}
      zoneId={zoneId}
      parentId={component.id}
      zoneDef={zoneDef}
    >
      {/* Zone children */}
      {getZoneComponents(zoneId).map((child, index) => (
        <ComponentWrapper
          key={child.id}
          component={child}
          index={index}
        />
      ))}
    </DroppableZone>
  ))
)}
```

---

## 🎨 PHASE 29: Component & UI Enhancement

### Estimated Time: 12-16 hours
### Files: 15-20 files modified

### Task 29.1: Toolbar Cleanup & Compression 🟡

**Problem**: Toolbar is cluttered with too many buttons visible.

**Implementation**:

```tsx
// src/components/studio/layout/studio-toolbar.tsx - REDESIGN

// Group related controls together
// Use dropdown menus for less-used actions
// Compress device selector into single toggle

<div className="flex h-full items-center justify-between px-2">
  {/* LEFT: Navigation + History */}
  <div className="flex items-center gap-1">
    <BackButton />
    <PageInfo siteName={siteName} pageTitle={pageTitle} />
    <Separator />
    <UndoRedoButtons />
    <SaveStatus status={saveStatus} isDirty={isDirty} />
  </div>
  
  {/* CENTER: Device + AI (Compact) */}
  <div className="flex items-center gap-2">
    {/* Unified device toggle - 3 icons in one group */}
    <DeviceToggleGroup value={breakpoint} onChange={setBreakpoint} />
    
    {/* AI Actions - Combined dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setShowPageGenerator(true)}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Page
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openAIAssistant}>
          <MessageSquare className="mr-2 h-4 w-4" />
          AI Assistant
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowTemplateBrowser(true)}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          Add Section
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  
  {/* RIGHT: Actions + Panels */}
  <div className="flex items-center gap-1">
    <PanelToggles />
    <Separator />
    <PreviewButton onClick={onPreview} />
    <SaveButton onClick={onSave} status={saveStatus} disabled={!isDirty} />
    <PublishButton onClick={onPublish} />
    <MoreActionsMenu />
  </div>
</div>
```

---

### Task 29.2: Fix AI Toolbar Button 🟠

**Problem**: The AI button in toolbar doesn't open anything.

**Implementation**:

```tsx
// src/components/studio/layout/studio-toolbar.tsx

// Add handler to open AI assistant
const openAIAssistant = useCallback(() => {
  const selectedId = useSelectionStore.getState().componentId;
  
  if (selectedId) {
    // Open AI chat for selected component
    useAIStore.getState().openChat(selectedId);
  } else {
    // Open general AI assistant (no component selected)
    // Either open empty state or show AI page generator
    useAIStore.getState().openChat(null); // Allow null for general AI
  }
  
  // Ensure right panel is visible
  if (!useUIStore.getState().panels.right) {
    useUIStore.getState().togglePanel("right");
  }
}, []);

// Update AI button
<Button 
  variant="outline" 
  size="sm" 
  className="gap-1.5" 
  onClick={openAIAssistant}
  data-ai-button
>
  <Sparkles className="h-4 w-4 text-primary" />
  <span>AI</span>
</Button>
```

---

### Task 29.3: Bottom Panel AI Integration 🟠

**Problem**: Bottom panel AI tab shows placeholder only.

**Implementation**:

```tsx
// src/components/studio/studio-editor.tsx - ENHANCE BottomPanelContent

function BottomPanelContent() {
  const togglePanel = useUIStore((s) => s.togglePanel);
  const [activeTab, setActiveTab] = useState<"layers" | "ai">("layers");
  const selectedId = useSelectionStore((s) => s.componentId);
  
  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Tab header */}
      <div className="flex items-center border-b bg-muted/30 px-2 shrink-0">
        <button
          className={cn(
            "px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "layers" 
              ? "border-b-2 border-primary text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("layers")}
        >
          <Layers className="inline-block w-4 h-4 mr-1.5" />
          Layers
        </button>
        <button
          className={cn(
            "px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "ai" 
              ? "border-b-2 border-primary text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("ai")}
        >
          <Sparkles className="inline-block w-4 h-4 mr-1.5" />
          AI Assistant
        </button>
        <div className="flex-1" />
        <button
          className="p-1 text-muted-foreground hover:text-foreground rounded"
          onClick={() => togglePanel("bottom")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "layers" ? (
          <LayersPanel />
        ) : (
          <BottomAIPanel selectedId={selectedId} />
        )}
      </div>
    </div>
  );
}

// Create new BottomAIPanel component
function BottomAIPanel({ selectedId }: { selectedId: string | null }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleQuickAction = async (action: string) => {
    if (!selectedId) {
      toast.info("Select a component first");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Call AI quick action
      await applyQuickAction(selectedId, action);
      toast.success(`Applied: ${action}`);
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="p-3 space-y-3">
      {selectedId ? (
        <>
          <p className="text-sm text-muted-foreground">
            Editing: <span className="font-medium">{getComponentLabel(selectedId)}</span>
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleQuickAction("improve-text")}>
              ✨ Improve Text
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction("change-colors")}>
              🎨 New Colors
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction("add-animation")}>
              🎬 Animate
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction("make-responsive")}>
              📱 Mobile Fix
            </Button>
          </div>
          
          {/* Custom Prompt */}
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to change..."
              className="flex-1"
            />
            <Button disabled={!prompt || isGenerating}>
              {isGenerating ? <Loader2 className="animate-spin" /> : "Apply"}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Select a component to use AI assistance
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Or use "Generate Page" to create a complete page
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {/* Open AI page generator */}}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Page
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 29.4: AI Generator Background Indication 🟡

**Problem**: No clear indication that AI is working in the background.

**Implementation**:

```tsx
// src/components/studio/ai/ai-page-generator.tsx - ENHANCE generating state

{step === "generating" && (
  <div className="py-12 text-center space-y-6">
    {/* Animated progress ring */}
    <div className="relative mx-auto w-24 h-24">
      <svg className="w-24 h-24 -rotate-90">
        <circle
          cx="48" cy="48" r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="48" cy="48" r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-primary"
          strokeDasharray="251.2"
          strokeDashoffset="62.8"
          style={{
            animation: "progress 2s ease-in-out infinite",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
      </div>
    </div>
    
    {/* Status messages */}
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">Generating Your Page</h3>
      <GenerationStatusText />
    </div>
    
    {/* Progress steps */}
    <div className="flex justify-center gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        Analyzing prompt
      </span>
      <span className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Generating layout
      </span>
      <span className="flex items-center gap-1 opacity-50">
        <Circle className="w-3 h-3" />
        Creating content
      </span>
    </div>
    
    <p className="text-sm text-muted-foreground">
      This typically takes 15-30 seconds...
    </p>
  </div>
)}

// Rotating status messages
function GenerationStatusText() {
  const [index, setIndex] = useState(0);
  const messages = [
    "Analyzing your requirements...",
    "Designing the layout structure...",
    "Generating component content...",
    "Applying color scheme...",
    "Optimizing for mobile...",
    "Final touches...",
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <p className="text-muted-foreground animate-fade-in">
      {messages[index]}
    </p>
  );
}
```

---

### Task 29.5: Hero Component Enhancement 🔵

**Problem**: Hero needs video backgrounds and super customization.

**Implementation**:

```tsx
// src/lib/studio/registry/core-components.ts - ENHANCE Hero definition

defineComponent({
  type: "Hero",
  label: "Hero",
  description: "Hero section with video backgrounds, animations, and full customization",
  category: "sections",
  icon: "Star",
  render: HeroRender,
  fields: {
    // Content
    title: { type: "text", label: "Title", defaultValue: "Welcome to Our Site" },
    subtitle: { type: "textarea", label: "Subtitle", rows: 2 },
    buttonText: { type: "text", label: "Primary Button" },
    buttonLink: { type: "link", label: "Primary Button Link" },
    secondaryButtonText: { type: "text", label: "Secondary Button" },
    secondaryButtonLink: { type: "link", label: "Secondary Button Link" },
    
    // Layout
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Centered", value: "centered" },
        { label: "Left Aligned", value: "left" },
        { label: "Split (Image Right)", value: "split-right" },
        { label: "Split (Image Left)", value: "split-left" },
        { label: "Fullscreen", value: "fullscreen" },
      ],
      defaultValue: "centered",
    },
    alignment: {
      type: "select",
      label: "Text Alignment",
      options: presetOptions.alignment,
      defaultValue: "center",
    },
    
    // Background
    backgroundType: {
      type: "select",
      label: "Background Type",
      options: [
        { label: "Color", value: "color" },
        { label: "Gradient", value: "gradient" },
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
      ],
      defaultValue: "color",
    },
    backgroundColor: { type: "color", label: "Background Color" },
    gradientFrom: { type: "color", label: "Gradient From" },
    gradientTo: { type: "color", label: "Gradient To" },
    gradientDirection: {
      type: "select",
      label: "Gradient Direction",
      options: [
        { label: "To Bottom", value: "to-b" },
        { label: "To Right", value: "to-r" },
        { label: "To Bottom Right", value: "to-br" },
        { label: "To Bottom Left", value: "to-bl" },
        { label: "Radial", value: "radial" },
      ],
      defaultValue: "to-b",
    },
    backgroundImage: { type: "image", label: "Background Image" },
    backgroundVideo: { type: "text", label: "Video URL (MP4/WebM)" },
    videoAutoplay: { type: "toggle", label: "Autoplay Video", defaultValue: true },
    videoLoop: { type: "toggle", label: "Loop Video", defaultValue: true },
    videoMuted: { type: "toggle", label: "Muted Video", defaultValue: true },
    
    // Overlay
    overlay: { type: "toggle", label: "Show Overlay", defaultValue: false },
    overlayColor: { type: "color", label: "Overlay Color", defaultValue: "rgba(0,0,0,0.5)" },
    overlayOpacity: { type: "number", label: "Overlay Opacity", min: 0, max: 100, defaultValue: 50 },
    
    // Split Layout Image
    splitImage: { type: "image", label: "Split Layout Image" },
    
    // Sizing
    minHeight: { type: "number", label: "Min Height (px)", min: 200, max: 1200, defaultValue: 600 },
    fullHeight: { type: "toggle", label: "Full Viewport Height", defaultValue: false },
    
    // Animation
    animation: {
      type: "select",
      label: "Content Animation",
      options: [
        { label: "None", value: "none" },
        { label: "Fade Up", value: "fade-up" },
        { label: "Fade In", value: "fade-in" },
        { label: "Slide Left", value: "slide-left" },
        { label: "Slide Right", value: "slide-right" },
        { label: "Zoom In", value: "zoom-in" },
        { label: "Typewriter", value: "typewriter" },
      ],
      defaultValue: "none",
    },
    
    // Typography
    textColor: { type: "color", label: "Text Color" },
    titleSize: {
      type: "select",
      label: "Title Size",
      options: [
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "3XL (Giant)", value: "3xl" },
      ],
      defaultValue: "xl",
    },
  },
  defaultProps: {
    title: "Welcome to Our Site",
    subtitle: "Discover amazing features and services.",
    buttonText: "Get Started",
    layout: "centered",
    alignment: "center",
    backgroundType: "color",
    minHeight: 600,
    animation: "fade-up",
    titleSize: "xl",
  },
  ai: {
    description: "A highly customizable hero section with video backgrounds, gradients, animations, and split layouts",
    canModify: ["title", "subtitle", "buttonText", "layout", "backgroundType", "animation", "textColor"],
    suggestions: [
      "Add a video background",
      "Use split layout with image",
      "Add gradient background",
      "Enable fade-up animation",
      "Make it fullscreen",
    ],
  },
}),
```

**And update HeroRender** in `renders.tsx` to support video backgrounds:

```tsx
// In renders.tsx - HeroRender enhancement
export const HeroRender: React.FC<HeroRenderProps> = ({
  title,
  subtitle,
  buttonText,
  buttonLink,
  secondaryButtonText,
  secondaryButtonLink,
  layout = "centered",
  backgroundType = "color",
  backgroundColor,
  gradientFrom,
  gradientTo,
  gradientDirection = "to-b",
  backgroundImage,
  backgroundVideo,
  videoAutoplay = true,
  videoLoop = true,
  videoMuted = true,
  overlay = false,
  overlayColor = "rgba(0,0,0,0.5)",
  overlayOpacity = 50,
  splitImage,
  minHeight = 600,
  fullHeight = false,
  animation = "none",
  textColor,
  titleSize = "xl",
  children,
}) => {
  // Video background
  const renderVideoBackground = () => {
    if (backgroundType !== "video" || !backgroundVideo) return null;
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay={videoAutoplay}
          loop={videoLoop}
          muted={videoMuted}
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      </div>
    );
  };
  
  // Gradient background
  const getGradientStyle = () => {
    if (backgroundType !== "gradient") return {};
    
    const direction = {
      "to-b": "to bottom",
      "to-r": "to right",
      "to-br": "to bottom right",
      "to-bl": "to bottom left",
      "radial": "circle",
    }[gradientDirection];
    
    if (gradientDirection === "radial") {
      return {
        background: `radial-gradient(${direction}, ${gradientFrom || '#667eea'} 0%, ${gradientTo || '#764ba2'} 100%)`,
      };
    }
    
    return {
      background: `linear-gradient(${direction}, ${gradientFrom || '#667eea'} 0%, ${gradientTo || '#764ba2'} 100%)`,
    };
  };
  
  // Animation classes
  const animationClasses = {
    "none": "",
    "fade-up": "animate-fade-up",
    "fade-in": "animate-fade-in",
    "slide-left": "animate-slide-left",
    "slide-right": "animate-slide-right",
    "zoom-in": "animate-zoom-in",
    "typewriter": "animate-typewriter",
  };
  
  // ... rest of render implementation
};
```

---

### Task 29.6: Navbar with Hamburger Menu 🟡

**Problem**: Header needs hamburger menu on mobile.

**Implementation**:

```tsx
// In renders.tsx - NavbarRender enhancement
export const NavbarRender: React.FC<NavbarRenderProps> = ({
  logo,
  logoText,
  links = [],
  ctaText,
  ctaLink,
  sticky = false,
  backgroundColor,
  textColor,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav
      className={cn(
        "w-full",
        sticky && "sticky top-0 z-50",
      )}
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo ? (
              <img src={logo} alt={logoText || "Logo"} className="h-8 w-auto" />
            ) : (
              <span className="font-bold text-xl">{logoText || "Logo"}</span>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-sm font-medium hover:opacity-80 transition-opacity"
              >
                {link.text}
              </a>
            ))}
            {ctaText && (
              <a
                href={ctaLink || "#"}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {ctaText}
              </a>
            )}
          </div>
          
          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 py-4 space-y-2 border-t">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="block py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              {link.text}
            </a>
          ))}
          {ctaText && (
            <a
              href={ctaLink || "#"}
              className="block py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center mt-4"
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};
```

---

### Task 29.7: SEO Enhancement 🔵

**Problem**: Need SEO optimization for all sites.

**Implementation**:

```tsx
// Create src/components/studio/seo/seo-settings-panel.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Share2, Image, Code } from "lucide-react";

interface SEOSettingsPanelProps {
  pageId: string;
  initialData: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterCard?: string;
    canonicalUrl?: string;
    robots?: string;
    structuredData?: string;
  };
  onSave: (data: SEOData) => Promise<void>;
}

export function SEOSettingsPanel({ pageId, initialData, onSave }: SEOSettingsPanelProps) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  
  // SEO Score Calculator
  const calculateSEOScore = () => {
    let score = 0;
    if (data.title && data.title.length >= 30 && data.title.length <= 60) score += 20;
    if (data.description && data.description.length >= 120 && data.description.length <= 160) score += 20;
    if (data.keywords) score += 10;
    if (data.ogImage) score += 15;
    if (data.ogTitle && data.ogDescription) score += 15;
    if (data.canonicalUrl) score += 10;
    if (data.structuredData) score += 10;
    return score;
  };
  
  const score = calculateSEOScore();
  
  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div 
              className={cn(
                "text-4xl font-bold",
                score >= 80 ? "text-green-500" :
                score >= 50 ? "text-yellow-500" :
                "text-red-500"
              )}
            >
              {score}%
            </div>
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    score >= 80 ? "bg-green-500" :
                    score >= 50 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label>Page Title</Label>
            <Input 
              value={data.title || ""} 
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="Page Title - Site Name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(data.title?.length || 0)}/60 characters (30-60 recommended)
            </p>
          </div>
          
          <div>
            <Label>Meta Description</Label>
            <Textarea 
              value={data.description || ""} 
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="A compelling description of this page..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(data.description?.length || 0)}/160 characters (120-160 recommended)
            </p>
          </div>
          
          <div>
            <Label>Keywords</Label>
            <Input 
              value={data.keywords || ""} 
              onChange={(e) => setData({ ...data, keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </TabsContent>
        
        {/* Social, Advanced, Preview tabs... */}
      </Tabs>
      
      <Button onClick={() => onSave(data)} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save SEO Settings"}
      </Button>
    </div>
  );
}
```

---

### Task 29.8: Animation System 🔵

**Problem**: Need animations, 3D effects for award-winning websites.

**Implementation**:

```tsx
// Create src/lib/studio/animations/animation-presets.ts

export const ANIMATION_PRESETS = {
  // Entrance Animations
  "fade-in": {
    keyframes: { opacity: [0, 1] },
    options: { duration: 500, easing: "ease-out" },
    tailwind: "animate-fade-in",
    css: "@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }",
  },
  "fade-up": {
    keyframes: { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0)"] },
    options: { duration: 600, easing: "ease-out" },
    tailwind: "animate-fade-up",
    css: "@keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }",
  },
  "fade-down": {
    keyframes: { opacity: [0, 1], transform: ["translateY(-20px)", "translateY(0)"] },
    options: { duration: 600, easing: "ease-out" },
    tailwind: "animate-fade-down",
    css: "@keyframes fade-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }",
  },
  "slide-left": {
    keyframes: { opacity: [0, 1], transform: ["translateX(50px)", "translateX(0)"] },
    options: { duration: 600, easing: "ease-out" },
    tailwind: "animate-slide-left",
    css: "@keyframes slide-left { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }",
  },
  "slide-right": {
    keyframes: { opacity: [0, 1], transform: ["translateX(-50px)", "translateX(0)"] },
    options: { duration: 600, easing: "ease-out" },
    tailwind: "animate-slide-right",
    css: "@keyframes slide-right { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }",
  },
  "zoom-in": {
    keyframes: { opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] },
    options: { duration: 500, easing: "ease-out" },
    tailwind: "animate-zoom-in",
    css: "@keyframes zoom-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }",
  },
  "zoom-out": {
    keyframes: { opacity: [0, 1], transform: ["scale(1.1)", "scale(1)"] },
    options: { duration: 500, easing: "ease-out" },
    tailwind: "animate-zoom-out",
    css: "@keyframes zoom-out { from { opacity: 0; transform: scale(1.1); } to { opacity: 1; transform: scale(1); } }",
  },
  
  // Attention Animations
  "bounce": {
    keyframes: { transform: ["translateY(0)", "translateY(-10px)", "translateY(0)"] },
    options: { duration: 600, iterations: Infinity },
    tailwind: "animate-bounce",
    css: "/* uses Tailwind's built-in animate-bounce */",
  },
  "pulse": {
    keyframes: { opacity: [1, 0.5, 1] },
    options: { duration: 2000, iterations: Infinity },
    tailwind: "animate-pulse",
    css: "/* uses Tailwind's built-in animate-pulse */",
  },
  "shake": {
    keyframes: { transform: ["translateX(0)", "translateX(-5px)", "translateX(5px)", "translateX(0)"] },
    options: { duration: 400 },
    tailwind: "animate-shake",
    css: "@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }",
  },
  
  // Scroll Animations (with Intersection Observer)
  "scroll-fade-up": {
    trigger: "scroll",
    threshold: 0.1,
    keyframes: { opacity: [0, 1], transform: ["translateY(40px)", "translateY(0)"] },
    options: { duration: 800, easing: "ease-out" },
  },
  "scroll-zoom": {
    trigger: "scroll",
    threshold: 0.2,
    keyframes: { opacity: [0, 1], transform: ["scale(0.8)", "scale(1)"] },
    options: { duration: 600, easing: "ease-out" },
  },
  
  // Parallax
  "parallax-slow": {
    trigger: "scroll",
    parallaxSpeed: 0.5,
  },
  "parallax-fast": {
    trigger: "scroll",
    parallaxSpeed: 1.5,
  },
  
  // 3D Effects
  "flip-in": {
    keyframes: { transform: ["perspective(400px) rotateY(-90deg)", "perspective(400px) rotateY(0)"], opacity: [0, 1] },
    options: { duration: 800, easing: "ease-out" },
    tailwind: "animate-flip-in",
    css: "@keyframes flip-in { from { transform: perspective(400px) rotateY(-90deg); opacity: 0; } to { transform: perspective(400px) rotateY(0); opacity: 1; } }",
  },
  "rotate-in": {
    keyframes: { transform: ["rotate(-180deg) scale(0)", "rotate(0) scale(1)"], opacity: [0, 1] },
    options: { duration: 600, easing: "ease-out" },
    tailwind: "animate-rotate-in",
    css: "@keyframes rotate-in { from { transform: rotate(-180deg) scale(0); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }",
  },
  
  // Hover Effects
  "hover-lift": {
    hover: true,
    tailwind: "transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg",
  },
  "hover-glow": {
    hover: true,
    tailwind: "transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
  },
  "hover-scale": {
    hover: true,
    tailwind: "transition-transform duration-300 hover:scale-105",
  },
} as const;

export type AnimationPreset = keyof typeof ANIMATION_PRESETS;

// Animation field for component definitions
export const animationField = {
  type: "select",
  label: "Animation",
  options: [
    { label: "None", value: "none" },
    { label: "─── Entrance ───", value: "", disabled: true },
    { label: "Fade In", value: "fade-in" },
    { label: "Fade Up", value: "fade-up" },
    { label: "Fade Down", value: "fade-down" },
    { label: "Slide Left", value: "slide-left" },
    { label: "Slide Right", value: "slide-right" },
    { label: "Zoom In", value: "zoom-in" },
    { label: "Zoom Out", value: "zoom-out" },
    { label: "─── On Scroll ───", value: "", disabled: true },
    { label: "Scroll Fade Up", value: "scroll-fade-up" },
    { label: "Scroll Zoom", value: "scroll-zoom" },
    { label: "─── Attention ───", value: "", disabled: true },
    { label: "Bounce", value: "bounce" },
    { label: "Pulse", value: "pulse" },
    { label: "Shake", value: "shake" },
    { label: "─── 3D Effects ───", value: "", disabled: true },
    { label: "Flip In", value: "flip-in" },
    { label: "Rotate In", value: "rotate-in" },
    { label: "─── Hover ───", value: "", disabled: true },
    { label: "Lift on Hover", value: "hover-lift" },
    { label: "Glow on Hover", value: "hover-glow" },
    { label: "Scale on Hover", value: "hover-scale" },
  ],
  defaultValue: "none",
};

// Add to tailwind.config.ts
export const animationTailwindConfig = {
  keyframes: {
    "fade-up": {
      "0%": { opacity: "0", transform: "translateY(20px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
    "fade-down": {
      "0%": { opacity: "0", transform: "translateY(-20px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
    "slide-left": {
      "0%": { opacity: "0", transform: "translateX(50px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
    "slide-right": {
      "0%": { opacity: "0", transform: "translateX(-50px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
    "zoom-in": {
      "0%": { opacity: "0", transform: "scale(0.9)" },
      "100%": { opacity: "1", transform: "scale(1)" },
    },
    "flip-in": {
      "0%": { opacity: "0", transform: "perspective(400px) rotateY(-90deg)" },
      "100%": { opacity: "1", transform: "perspective(400px) rotateY(0)" },
    },
    "rotate-in": {
      "0%": { opacity: "0", transform: "rotate(-180deg) scale(0)" },
      "100%": { opacity: "1", transform: "rotate(0) scale(1)" },
    },
  },
  animation: {
    "fade-up": "fade-up 0.6s ease-out",
    "fade-down": "fade-down 0.6s ease-out",
    "slide-left": "slide-left 0.6s ease-out",
    "slide-right": "slide-right 0.6s ease-out",
    "zoom-in": "zoom-in 0.5s ease-out",
    "flip-in": "flip-in 0.8s ease-out",
    "rotate-in": "rotate-in 0.6s ease-out",
  },
};
```

---

## ✅ DELIVERABLES CHECKLIST

### Phase 28 Deliverables:
- [ ] Save system working with proper error handling and feedback
- [ ] Publish system working with confirmation
- [ ] Preview page loading and rendering correctly
- [ ] Canvas scrolling smooth and unbreakable
- [ ] AI generator Apply button working
- [ ] Add Section button inserting templates
- [ ] Drop zones working for all layout components

### Phase 29 Deliverables:
- [ ] Toolbar cleaned up and less cluttered
- [ ] AI button in toolbar opening assistant
- [ ] Bottom panel AI tab fully functional
- [ ] AI generator with background progress indication
- [ ] Hero component with video backgrounds
- [ ] Navbar with hamburger menu on mobile
- [ ] SEO settings panel
- [ ] Animation presets system

---

## 🔄 TESTING REQUIREMENTS

### After Phase 28:
```
1. Create new site → Add page → Open Studio
2. Add components (Section > Heading > Text > Button)
3. Click Save → Should show success toast
4. Refresh page → Content should persist
5. Click Publish → Should show success with URL
6. Open Preview in new tab → Should render page
7. Test scrolling in canvas → Should be smooth
8. Use AI Generator → Apply → Content should appear
9. Click Add Section → Insert template → Should add to canvas
10. Drag component into Section → Should nest properly
```

### After Phase 29:
```
1. Check toolbar is cleaner and less cluttered
2. Click AI button → Should open assistant
3. Open bottom panel → Switch to AI tab → Should show interface
4. Run AI generator → Should show progress animation
5. Add Hero → Set video background → Should play
6. Add Navbar → Check mobile view → Should show hamburger
7. Open More → SEO Settings → Should show SEO panel
8. Add animation to component → Should animate on preview
```

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Debug First**: Add console.log statements to understand what's happening before fixing
2. **Check Data Flow**: Most issues are data not flowing correctly between stores
3. **Verify Registry**: Components must be registered before they can render
4. **Test Incrementally**: Fix one issue, test, then move to next
5. **Keep Existing Code**: Don't delete working code, only enhance

## 🚨 CRITICAL: DO NOT

1. ❌ Delete or remove existing component files
2. ❌ Change the store structure significantly
3. ❌ Remove any working features
4. ❌ Skip error handling
5. ❌ Ignore TypeScript errors

---

**Ready for Implementation**: This document provides complete context for fixing all reported issues.
