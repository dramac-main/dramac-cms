# PHASE-STUDIO-29: Component & UI Enhancement

## 🎯 Phase Overview

**Wave**: 11 - Comprehensive Platform Fix  
**Phase**: 29 of 31  
**Priority**: 🟠 HIGH  
**Estimated Time**: 12-16 hours  
**Dependencies**: Phase 28 Complete (Core System Fixes)

---

## 📋 Mission

After fixing core system issues in Phase 28, this phase enhances the user experience with:
- Toolbar cleanup and compression
- AI button functionality
- Bottom panel AI integration
- AI generator progress indication
- Hero component video backgrounds
- Mobile hamburger menu for navigation
- SEO settings panel
- Animation presets system

---

## 📊 Issues Addressed

### 🟠 HIGH Priority Issues

| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| H1 | AI toolbar button doesn't open assistant | `studio-toolbar.tsx` | 🟠 P1 |
| H2 | Bottom panel AI tab shows placeholder | `studio-editor.tsx` | 🟠 P1 |
| H3 | Components need enhancement | `renders.tsx` | 🟠 P1 |

### 🟡 MEDIUM Priority Issues

| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| M1 | Toolbar looks cluttered | `studio-toolbar.tsx` | 🟡 P2 |
| M2 | AI generator doesn't show progress | `ai-page-generator.tsx` | 🟡 P2 |
| M3 | Navbar needs hamburger on mobile | `renders.tsx` | 🟡 P2 |

### 🔵 ENHANCEMENT Features

| ID | Issue | Location | Priority |
|----|-------|----------|----------|
| E1 | Hero needs video backgrounds | `renders.tsx` | 🔵 P3 |
| E2 | SEO optimization | New component | 🔵 P3 |
| E3 | Animation system | New files | 🔵 P3 |

---

## 🔧 Implementation Tasks

### Task 29.1: Toolbar Cleanup & Compression

**Problem**: Toolbar is cluttered with too many buttons visible.

**File**: `src/components/studio/layout/studio-toolbar.tsx`

```tsx
// REDESIGNED toolbar with grouped controls and dropdowns

export const StudioToolbar = memo(function StudioToolbar({
  siteId,
  pageId,
  pageTitle,
  siteName,
  onSave,
  onPreview,
  onPublish,
  saveStatus = "idle",
}: StudioToolbarProps) {
  // ... existing hooks
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full items-center justify-between px-2">
        {/* LEFT: Navigation + History + Save Status (Compact) */}
        <div className="flex items-center gap-1">
          {/* Back Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/dashboard/sites/${siteId}/pages`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to pages</TooltipContent>
          </Tooltip>

          {/* Page Info - More compact */}
          <div className="hidden sm:flex flex-col px-2 max-w-[120px]">
            <span className="text-[10px] text-muted-foreground truncate">{siteName}</span>
            <span className="text-xs font-medium leading-tight truncate">{pageTitle}</span>
          </div>

          <Separator orientation="vertical" className="mx-1 h-5" />

          {/* Undo/Redo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleUndo}
              disabled={!historyCanUndo}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRedo}
              disabled={!historyCanRedo}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Save Status - Inline */}
          <div className="ml-2">
            {renderSaveStatus()}
          </div>
        </div>

        {/* CENTER: Device + AI (Combined, Compact) */}
        <div className="flex items-center gap-2">
          {/* Unified Device Toggle - Single button group */}
          <div className="flex items-center rounded-md border p-0.5 bg-background">
            {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((size) => {
              const Icon = viewportIcons[size];
              return (
                <Toggle
                  key={size}
                  pressed={breakpoint === size}
                  onPressedChange={() => setBreakpoint(size)}
                  className="h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label={`${size} view`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Toggle>
              );
            })}
          </div>

          {/* AI Actions - Combined Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">AI</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => setShowPageGenerator(true)}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openAIAssistant}>
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Assistant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTemplateBrowser(true)}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Add Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* RIGHT: Panels + Actions (Compact) */}
        <div className="flex items-center gap-1">
          {/* Panel Toggles */}
          <div className="hidden md:flex items-center gap-0.5">
            <Toggle
              pressed={panels.left}
              onPressedChange={() => togglePanel("left")}
              className="h-7 w-7 p-0"
              aria-label="Toggle components panel"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              pressed={panels.right}
              onPressedChange={() => togglePanel("right")}
              className="h-7 w-7 p-0"
              aria-label="Toggle properties panel"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              pressed={panels.bottom}
              onPressedChange={() => togglePanel("bottom")}
              className="h-7 w-7 p-0"
              aria-label="Toggle layers panel"
            >
              <PanelBottom className="h-3.5 w-3.5" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="mx-1 h-5 hidden md:block" />

          {/* Preview */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview (⌘P)</TooltipContent>
          </Tooltip>

          {/* Save */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onSave}
            disabled={!isDirty || saveStatus === "saving"}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>

          {/* Publish */}
          <Button size="sm" className="h-8 gap-1.5" onClick={onPublish}>
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Page Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
});
```

---

### Task 29.2: Fix AI Toolbar Button

**Problem**: The AI button in toolbar doesn't open anything.

**File**: `src/components/studio/layout/studio-toolbar.tsx`

```tsx
// Add this handler function

const openAIAssistant = useCallback(() => {
  const selectedId = useSelectionStore.getState().componentId;
  
  if (selectedId) {
    // Open AI chat for selected component
    useAIStore.getState().openChat(selectedId);
    toast.success("AI Assistant opened", {
      description: "Editing selected component",
    });
  } else {
    // Open general AI assistant (no component selected)
    useAIStore.getState().openChat(null);
    toast.info("AI Assistant", {
      description: "Select a component to get AI suggestions",
    });
  }
  
  // Ensure right panel is visible (AI chat is in right panel)
  if (!useUIStore.getState().panels.right) {
    useUIStore.getState().togglePanel("right");
  }
  
  // Ensure bottom panel is visible with AI tab
  if (!useUIStore.getState().panels.bottom) {
    useUIStore.getState().togglePanel("bottom");
  }
}, []);
```

---

### Task 29.3: Bottom Panel AI Integration

**Problem**: Bottom panel AI tab shows placeholder only.

**File**: `src/components/studio/studio-editor.tsx`

```tsx
// ENHANCED BottomPanelContent with full AI integration

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

// NEW: Bottom AI Panel component
function BottomAIPanel({ selectedId }: { selectedId: string | null }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPageGenerator, setShowPageGenerator] = useState(false);
  
  const components = useEditorStore((s) => s.data.components);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  
  const selectedComponent = selectedId ? components[selectedId] : null;
  
  const handleQuickAction = async (action: string) => {
    if (!selectedId || !selectedComponent) {
      toast.info("Select a component first");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Call AI quick action API
      const response = await fetch("/api/studio/ai/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          componentId: selectedId,
          componentType: selectedComponent.type,
          currentProps: selectedComponent.props,
        }),
      });
      
      if (!response.ok) throw new Error("Action failed");
      
      const result = await response.json();
      
      if (result.updates) {
        updateComponentProps(selectedId, result.updates);
        toast.success(`Applied: ${action}`);
      }
    } catch (error) {
      console.error("[AI Panel] Quick action error:", error);
      toast.error("Action failed - try again");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCustomPrompt = async () => {
    if (!prompt.trim()) return;
    if (!selectedId) {
      toast.info("Select a component first");
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/studio/ai/modify-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          componentId: selectedId,
          componentType: selectedComponent?.type,
          currentProps: selectedComponent?.props,
        }),
      });
      
      if (!response.ok) throw new Error("Request failed");
      
      const result = await response.json();
      
      if (result.updates) {
        updateComponentProps(selectedId, result.updates);
        toast.success("Changes applied!");
        setPrompt("");
      }
    } catch (error) {
      console.error("[AI Panel] Custom prompt error:", error);
      toast.error("Failed to apply changes");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="p-3 space-y-3 h-full overflow-auto">
      {selectedComponent ? (
        <>
          {/* Selected component info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Editing:</span>
            <span className="font-medium">{selectedComponent.type}</span>
            <span className="text-xs text-muted-foreground">({selectedId.slice(0, 8)}...)</span>
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAction("improve-text")}
                disabled={isGenerating}
                className="h-7 text-xs"
              >
                ✨ Improve Text
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAction("change-colors")}
                disabled={isGenerating}
                className="h-7 text-xs"
              >
                🎨 New Colors
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAction("add-animation")}
                disabled={isGenerating}
                className="h-7 text-xs"
              >
                🎬 Animate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAction("make-responsive")}
                disabled={isGenerating}
                className="h-7 text-xs"
              >
                📱 Mobile Fix
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAction("add-hover")}
                disabled={isGenerating}
                className="h-7 text-xs"
              >
                👆 Hover Effect
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAction("make-bold")}
                disabled={isGenerating}
                className="h-7 text-xs"
              >
                💪 Make Bold
              </Button>
            </div>
          </div>
          
          {/* Custom Prompt */}
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to change..."
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCustomPrompt()}
            />
            <Button 
              size="sm"
              className="h-8"
              onClick={handleCustomPrompt}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Select a component</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click on a component to use AI assistance
          </p>
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPageGenerator(true)}
              className="gap-1.5"
            >
              <Wand2 className="h-4 w-4" />
              Generate Page
            </Button>
          </div>
        </div>
      )}
      
      {/* Page Generator Dialog */}
      <AIPageGenerator 
        isOpen={showPageGenerator} 
        onClose={() => setShowPageGenerator(false)} 
      />
    </div>
  );
}
```

---

### Task 29.4: AI Generator Background Indication

**Problem**: No clear indication that AI is working in the background.

**File**: `src/components/studio/ai/ai-page-generator.tsx`

```tsx
// ENHANCED generating step with animated progress

{step === "generating" && (
  <div className="py-12 text-center space-y-6">
    {/* Animated Progress Ring */}
    <div className="relative mx-auto w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        {/* Background circle */}
        <circle
          cx="48" 
          cy="48" 
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted"
        />
        {/* Animated progress circle */}
        <circle
          cx="48" 
          cy="48" 
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-primary"
          strokeDasharray="251.2"
          strokeLinecap="round"
          style={{
            animation: "dash 2s ease-in-out infinite",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
      </div>
    </div>
    
    {/* Status Messages */}
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">Generating Your Page</h3>
      <GenerationStatusText />
    </div>
    
    {/* Progress Steps */}
    <div className="flex justify-center gap-4 text-xs">
      <StepIndicator 
        label="Analyzing" 
        status={generationStep >= 1 ? "complete" : generationStep === 0 ? "active" : "pending"} 
      />
      <StepIndicator 
        label="Designing" 
        status={generationStep >= 2 ? "complete" : generationStep === 1 ? "active" : "pending"} 
      />
      <StepIndicator 
        label="Creating" 
        status={generationStep >= 3 ? "complete" : generationStep === 2 ? "active" : "pending"} 
      />
      <StepIndicator 
        label="Optimizing" 
        status={generationStep === 3 ? "active" : "pending"} 
      />
    </div>
    
    <p className="text-sm text-muted-foreground">
      This typically takes 15-30 seconds...
    </p>
    
    {/* Cancel button */}
    <Button variant="ghost" size="sm" onClick={handleClose}>
      Cancel
    </Button>
  </div>
)}

// Step indicator component
function StepIndicator({ label, status }: { label: string; status: "pending" | "active" | "complete" }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5",
      status === "pending" && "text-muted-foreground opacity-50",
      status === "active" && "text-primary",
      status === "complete" && "text-green-600"
    )}>
      {status === "complete" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status === "active" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === "pending" && <Circle className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  );
}

// Rotating status messages
function GenerationStatusText() {
  const [index, setIndex] = useState(0);
  const messages = [
    "Analyzing your requirements...",
    "Designing the layout structure...",
    "Generating component content...",
    "Selecting color scheme...",
    "Optimizing for mobile...",
    "Adding final touches...",
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <p className="text-muted-foreground transition-opacity duration-500">
      {messages[index]}
    </p>
  );
}

// Add CSS for dash animation
const styles = `
  @keyframes dash {
    0% {
      stroke-dashoffset: 251.2;
    }
    50% {
      stroke-dashoffset: 62.8;
    }
    100% {
      stroke-dashoffset: 251.2;
    }
  }
`;
```

---

### Task 29.5: Hero Component Enhancement

**Problem**: Hero needs video backgrounds and super customization.

**File**: `src/lib/studio/registry/core-components.ts` - Update Hero definition

```typescript
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
    gradientFrom: { type: "color", label: "Gradient From", defaultValue: "#667eea" },
    gradientTo: { type: "color", label: "Gradient To", defaultValue: "#764ba2" },
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
    overlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
    overlayOpacity: { type: "number", label: "Overlay Opacity (%)", min: 0, max: 100, defaultValue: 50 },
    
    // Split Layout
    splitImage: { type: "image", label: "Split Image" },
    splitImagePosition: { 
      type: "select", 
      label: "Image Position",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
      defaultValue: "right",
    },
    
    // Sizing
    minHeight: { type: "number", label: "Min Height (px)", min: 200, max: 1200, defaultValue: 600 },
    fullHeight: { type: "toggle", label: "Full Viewport Height", defaultValue: false },
    
    // Typography
    textColor: { type: "color", label: "Text Color" },
    titleSize: {
      type: "select",
      label: "Title Size",
      options: [
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "3XL (Giant)", value: "3xl" },
      ],
      defaultValue: "xl",
    },
    
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
      ],
      defaultValue: "fade-up",
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
    canModify: ["title", "subtitle", "buttonText", "layout", "backgroundType", "animation", "textColor", "backgroundColor"],
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

**File**: `src/lib/studio/blocks/renders.tsx` - Update HeroRender

```tsx
// ENHANCED HeroRender with video background support

export interface HeroProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  layout?: "centered" | "left" | "split-left" | "split-right" | "fullscreen";
  alignment?: "left" | "center" | "right";
  backgroundType?: "color" | "gradient" | "image" | "video";
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: "to-b" | "to-r" | "to-br" | "to-bl" | "radial";
  backgroundImage?: string;
  backgroundVideo?: string;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  splitImage?: string;
  splitImagePosition?: "left" | "right";
  minHeight?: number;
  fullHeight?: boolean;
  textColor?: string;
  titleSize?: "md" | "lg" | "xl" | "2xl" | "3xl";
  animation?: "none" | "fade-up" | "fade-in" | "slide-left" | "slide-right" | "zoom-in";
  children?: React.ReactNode;
}

export function HeroRender({
  title = "Welcome to Our Site",
  subtitle,
  buttonText,
  buttonLink = "#",
  secondaryButtonText,
  secondaryButtonLink = "#",
  layout = "centered",
  alignment = "center",
  backgroundType = "color",
  backgroundColor,
  gradientFrom = "#667eea",
  gradientTo = "#764ba2",
  gradientDirection = "to-b",
  backgroundImage,
  backgroundVideo,
  videoAutoplay = true,
  videoLoop = true,
  videoMuted = true,
  overlay = false,
  overlayColor = "#000000",
  overlayOpacity = 50,
  splitImage,
  splitImagePosition = "right",
  minHeight = 600,
  fullHeight = false,
  textColor,
  titleSize = "xl",
  animation = "fade-up",
  children,
}: HeroProps) {
  // Title size classes
  const titleSizeClasses = {
    md: "text-2xl md:text-3xl lg:text-4xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
    "3xl": "text-6xl md:text-7xl lg:text-8xl",
  }[titleSize];
  
  // Animation classes
  const animationClasses = {
    none: "",
    "fade-up": "animate-fade-up",
    "fade-in": "animate-fade-in",
    "slide-left": "animate-slide-left",
    "slide-right": "animate-slide-right",
    "zoom-in": "animate-zoom-in",
  }[animation];
  
  // Gradient direction
  const gradientDirections = {
    "to-b": "to bottom",
    "to-r": "to right",
    "to-br": "to bottom right",
    "to-bl": "to bottom left",
    "radial": "circle",
  };
  
  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (backgroundType) {
      case "gradient":
        if (gradientDirection === "radial") {
          return {
            background: `radial-gradient(circle, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          };
        }
        return {
          background: `linear-gradient(${gradientDirections[gradientDirection]}, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        };
      case "image":
        return {
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      case "color":
      default:
        return { backgroundColor: backgroundColor || "#1f2937" };
    }
  };
  
  // Split layout check
  const isSplit = layout === "split-left" || layout === "split-right";
  const imageOnLeft = layout === "split-left" || splitImagePosition === "left";
  
  // Alignment classes
  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[alignment];

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        fullHeight ? "min-h-screen" : ""
      )}
      style={{
        ...(backgroundType !== "video" ? getBackgroundStyle() : {}),
        minHeight: fullHeight ? "100vh" : `${minHeight}px`,
        color: textColor,
      }}
    >
      {/* Video Background */}
      {backgroundType === "video" && backgroundVideo && (
        <video
          autoPlay={videoAutoplay}
          loop={videoLoop}
          muted={videoMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
          }}
        />
      )}
      
      {/* Content */}
      <div className={cn(
        "relative z-20 w-full h-full",
        fullHeight ? "min-h-screen" : "",
        isSplit ? "flex flex-col lg:flex-row" : "flex flex-col justify-center"
      )} style={{ minHeight: fullHeight ? "100vh" : `${minHeight}px` }}>
        
        {/* Split Image - Left */}
        {isSplit && imageOnLeft && splitImage && (
          <div className="w-full lg:w-1/2 h-64 lg:h-auto">
            <img
              src={splitImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Text Content */}
        <div className={cn(
          "flex flex-col justify-center px-4 md:px-8 lg:px-12 py-12",
          isSplit ? "w-full lg:w-1/2" : "w-full max-w-screen-xl mx-auto",
          alignClasses,
          animationClasses
        )}>
          <h1 className={cn("font-bold leading-tight", titleSizeClasses)}>
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-4 md:mt-6 text-lg md:text-xl lg:text-2xl opacity-90 max-w-2xl">
              {subtitle}
            </p>
          )}
          
          {(buttonText || secondaryButtonText) && (
            <div className={cn(
              "mt-6 md:mt-8 flex flex-wrap gap-3",
              alignment === "center" && "justify-center",
              alignment === "right" && "justify-end"
            )}>
              {buttonText && (
                <a
                  href={buttonLink}
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {buttonText}
                </a>
              )}
              {secondaryButtonText && (
                <a
                  href={secondaryButtonLink}
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border-2 border-current hover:bg-white/10 transition-colors"
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          )}
          
          {children}
        </div>
        
        {/* Split Image - Right */}
        {isSplit && !imageOnLeft && splitImage && (
          <div className="w-full lg:w-1/2 h-64 lg:h-auto order-first lg:order-last">
            <img
              src={splitImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
```

---

### Task 29.6: Navbar with Hamburger Menu

**Problem**: Header needs hamburger menu on mobile.

**File**: `src/lib/studio/blocks/renders.tsx` - Update NavbarRender

```tsx
// ENHANCED NavbarRender with mobile hamburger menu

export interface NavbarProps {
  logo?: string;
  logoText?: string;
  links?: Array<{ text: string; href: string }>;
  ctaText?: string;
  ctaLink?: string;
  sticky?: boolean;
  transparent?: boolean;
  backgroundColor?: string;
  textColor?: string;
  children?: React.ReactNode;
}

export function NavbarRender({
  logo,
  logoText = "Logo",
  links = [],
  ctaText,
  ctaLink = "#",
  sticky = false,
  transparent = false,
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav
      className={cn(
        "w-full z-50",
        sticky && "sticky top-0",
        transparent && !mobileMenuOpen ? "bg-transparent" : ""
      )}
      style={{ 
        backgroundColor: transparent && !mobileMenuOpen ? "transparent" : backgroundColor, 
        color: textColor 
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo ? (
              <img src={logo} alt={logoText} className="h-8 w-auto" />
            ) : (
              <span className="font-bold text-xl">{logoText}</span>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-sm font-medium hover:opacity-75 transition-opacity"
              >
                {link.text}
              </a>
            ))}
            {ctaText && (
              <a
                href={ctaLink}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                style={{ backgroundColor: textColor, color: backgroundColor }}
              >
                {ctaText}
              </a>
            )}
          </div>
          
          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-black/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        style={{ backgroundColor }}
      >
        <div className="px-4 py-4 space-y-1 border-t">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="block py-3 px-3 rounded-lg text-sm font-medium hover:bg-black/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.text}
            </a>
          ))}
          {ctaText && (
            <a
              href={ctaLink}
              className="block mt-4 py-3 px-4 rounded-lg text-sm font-medium text-center transition-colors"
              style={{ backgroundColor: textColor, color: backgroundColor }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
```

---

### Task 29.7: SEO Settings Panel

**File**: `src/components/studio/features/seo-settings-panel.tsx`

```tsx
/**
 * SEO Settings Panel
 * 
 * Panel for configuring page-level SEO settings.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Share2, Image as ImageIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: "summary" | "summary_large_image";
  canonicalUrl?: string;
  robots?: string;
}

interface SEOSettingsPanelProps {
  pageId: string;
  pageName: string;
  initialData?: SEOData;
  onSave: (data: SEOData) => Promise<void>;
}

export function SEOSettingsPanel({ 
  pageId, 
  pageName, 
  initialData = {}, 
  onSave 
}: SEOSettingsPanelProps) {
  const [data, setData] = useState<SEOData>(initialData);
  const [saving, setSaving] = useState(false);
  
  // SEO Score Calculator
  const calculateSEOScore = (): number => {
    let score = 0;
    
    // Title: 30-60 chars = 20 points
    if (data.title && data.title.length >= 30 && data.title.length <= 60) {
      score += 20;
    } else if (data.title && data.title.length > 0) {
      score += 10;
    }
    
    // Description: 120-160 chars = 20 points
    if (data.description && data.description.length >= 120 && data.description.length <= 160) {
      score += 20;
    } else if (data.description && data.description.length > 0) {
      score += 10;
    }
    
    // Keywords = 10 points
    if (data.keywords && data.keywords.length > 0) score += 10;
    
    // OG Image = 15 points
    if (data.ogImage) score += 15;
    
    // OG Title + Description = 15 points
    if (data.ogTitle && data.ogDescription) score += 15;
    else if (data.ogTitle || data.ogDescription) score += 7;
    
    // Canonical URL = 10 points
    if (data.canonicalUrl) score += 10;
    
    // Robots = 10 points (bonus)
    if (data.robots) score += 10;
    
    return Math.min(score, 100);
  };
  
  const score = calculateSEOScore();
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };
  
  const ScoreIndicator = ({ value, max, label }: { value: number; max: number; label: string }) => {
    const isOptimal = value >= max * 0.8 && value <= max;
    const isWarning = value > max || (value < max * 0.5 && value > 0);
    
    return (
      <div className="flex items-center gap-2 text-xs">
        {isOptimal && <Check className="h-3 w-3 text-green-500" />}
        {isWarning && <X className="h-3 w-3 text-yellow-500" />}
        {!isOptimal && !isWarning && <div className="h-3 w-3" />}
        <span className={cn(
          isOptimal && "text-green-600",
          isWarning && "text-yellow-600"
        )}>
          {value}/{max} {label}
        </span>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 p-4">
      {/* SEO Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            SEO Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div 
              className={cn(
                "text-4xl font-bold",
                score >= 80 && "text-green-500",
                score >= 50 && score < 80 && "text-yellow-500",
                score < 50 && "text-red-500"
              )}
            >
              {score}%
            </div>
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    score >= 80 && "bg-green-500",
                    score >= 50 && score < 80 && "bg-yellow-500",
                    score < 50 && "bg-red-500"
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {score >= 80 ? "Great! Your page is well optimized" :
                 score >= 50 ? "Good, but there's room for improvement" :
                 "Add more SEO information to improve visibility"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">Page Title</Label>
            <Input 
              id="seo-title"
              value={data.title || ""} 
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder={`${pageName} | Your Site Name`}
            />
            <ScoreIndicator 
              value={data.title?.length || 0} 
              max={60} 
              label="characters (30-60 recommended)" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seo-description">Meta Description</Label>
            <Textarea 
              id="seo-description"
              value={data.description || ""} 
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="A compelling description of this page that will appear in search results..."
              rows={3}
            />
            <ScoreIndicator 
              value={data.description?.length || 0} 
              max={160} 
              label="characters (120-160 recommended)" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seo-keywords">Keywords</Label>
            <Input 
              id="seo-keywords"
              value={data.keywords || ""} 
              onChange={(e) => setData({ ...data, keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas
            </p>
          </div>
        </TabsContent>
        
        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="og-image">Social Image</Label>
            <Input 
              id="og-image"
              type="text"
              value={data.ogImage || ""} 
              onChange={(e) => setData({ ...data, ogImage: e.target.value })}
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 1200x630 pixels
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="og-title">Social Title</Label>
            <Input 
              id="og-title"
              value={data.ogTitle || ""} 
              onChange={(e) => setData({ ...data, ogTitle: e.target.value })}
              placeholder={data.title || "Same as page title"}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="og-description">Social Description</Label>
            <Textarea 
              id="og-description"
              value={data.ogDescription || ""} 
              onChange={(e) => setData({ ...data, ogDescription: e.target.value })}
              placeholder={data.description || "Same as meta description"}
              rows={2}
            />
          </div>
        </TabsContent>
        
        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="canonical">Canonical URL</Label>
            <Input 
              id="canonical"
              value={data.canonicalUrl || ""} 
              onChange={(e) => setData({ ...data, canonicalUrl: e.target.value })}
              placeholder="https://example.com/page"
            />
            <p className="text-xs text-muted-foreground">
              The preferred URL for this page (for duplicate content)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="robots">Robots</Label>
            <Input 
              id="robots"
              value={data.robots || ""} 
              onChange={(e) => setData({ ...data, robots: e.target.value })}
              placeholder="index, follow"
            />
            <p className="text-xs text-muted-foreground">
              Search engine indexing instructions
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save SEO Settings"}
      </Button>
    </div>
  );
}
```

---

### Task 29.8: Animation Presets System

**File**: `src/lib/studio/animations/animation-presets.ts`

```typescript
/**
 * DRAMAC Studio Animation Presets
 * 
 * Comprehensive animation system for award-winning designs.
 */

export const ANIMATION_PRESETS = {
  // Entrance Animations
  "fade-in": {
    css: "animate-fade-in",
    keyframes: { opacity: [0, 1] },
    duration: 500,
    description: "Simple fade in",
  },
  "fade-up": {
    css: "animate-fade-up",
    keyframes: { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0)"] },
    duration: 600,
    description: "Fade in while moving up",
  },
  "fade-down": {
    css: "animate-fade-down",
    keyframes: { opacity: [0, 1], transform: ["translateY(-20px)", "translateY(0)"] },
    duration: 600,
    description: "Fade in while moving down",
  },
  "slide-left": {
    css: "animate-slide-left",
    keyframes: { opacity: [0, 1], transform: ["translateX(50px)", "translateX(0)"] },
    duration: 600,
    description: "Slide in from right",
  },
  "slide-right": {
    css: "animate-slide-right",
    keyframes: { opacity: [0, 1], transform: ["translateX(-50px)", "translateX(0)"] },
    duration: 600,
    description: "Slide in from left",
  },
  "zoom-in": {
    css: "animate-zoom-in",
    keyframes: { opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] },
    duration: 500,
    description: "Zoom in with fade",
  },
  "zoom-out": {
    css: "animate-zoom-out",
    keyframes: { opacity: [0, 1], transform: ["scale(1.1)", "scale(1)"] },
    duration: 500,
    description: "Zoom out with fade",
  },
  
  // Attention Animations
  "bounce": {
    css: "animate-bounce",
    tailwind: true,
    description: "Bouncing animation",
  },
  "pulse": {
    css: "animate-pulse",
    tailwind: true,
    description: "Pulsing opacity",
  },
  "shake": {
    css: "animate-shake",
    keyframes: { transform: ["translateX(0)", "translateX(-5px)", "translateX(5px)", "translateX(0)"] },
    duration: 400,
    description: "Shake left and right",
  },
  
  // 3D Animations
  "flip-in": {
    css: "animate-flip-in",
    keyframes: { opacity: [0, 1], transform: ["perspective(400px) rotateY(-90deg)", "perspective(400px) rotateY(0)"] },
    duration: 800,
    description: "Flip in from side",
  },
  "rotate-in": {
    css: "animate-rotate-in",
    keyframes: { opacity: [0, 1], transform: ["rotate(-180deg) scale(0)", "rotate(0) scale(1)"] },
    duration: 600,
    description: "Rotate in with scale",
  },
} as const;

// Hover effects
export const HOVER_EFFECTS = {
  "none": "",
  "lift": "transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg",
  "scale": "transition-transform duration-300 hover:scale-105",
  "glow": "transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
  "darken": "transition-opacity duration-300 hover:opacity-80",
  "brighten": "transition-all duration-300 hover:brightness-110",
} as const;

// Animation field for component definitions
export const animationFieldOptions = [
  { label: "None", value: "none" },
  { label: "─── Entrance ───", value: "", disabled: true },
  { label: "Fade In", value: "fade-in" },
  { label: "Fade Up", value: "fade-up" },
  { label: "Fade Down", value: "fade-down" },
  { label: "Slide from Right", value: "slide-left" },
  { label: "Slide from Left", value: "slide-right" },
  { label: "Zoom In", value: "zoom-in" },
  { label: "Zoom Out", value: "zoom-out" },
  { label: "─── Attention ───", value: "", disabled: true },
  { label: "Bounce", value: "bounce" },
  { label: "Pulse", value: "pulse" },
  { label: "Shake", value: "shake" },
  { label: "─── 3D ───", value: "", disabled: true },
  { label: "Flip In", value: "flip-in" },
  { label: "Rotate In", value: "rotate-in" },
];

export const hoverFieldOptions = [
  { label: "None", value: "none" },
  { label: "Lift Up", value: "lift" },
  { label: "Scale", value: "scale" },
  { label: "Glow", value: "glow" },
  { label: "Darken", value: "darken" },
  { label: "Brighten", value: "brighten" },
];

// Get animation classes for a component
export function getAnimationClasses(animation?: string, hover?: string): string {
  const animClass = animation && animation !== "none" ? ANIMATION_PRESETS[animation as keyof typeof ANIMATION_PRESETS]?.css || "" : "";
  const hoverClass = hover ? HOVER_EFFECTS[hover as keyof typeof HOVER_EFFECTS] || "" : "";
  return `${animClass} ${hoverClass}`.trim();
}
```

**Add to Tailwind Config** (`tailwind.config.ts`):

```typescript
// Add to theme.extend
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
  "zoom-out": {
    "0%": { opacity: "0", transform: "scale(1.1)" },
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
  shake: {
    "0%, 100%": { transform: "translateX(0)" },
    "25%": { transform: "translateX(-5px)" },
    "75%": { transform: "translateX(5px)" },
  },
},
animation: {
  "fade-up": "fade-up 0.6s ease-out forwards",
  "fade-down": "fade-down 0.6s ease-out forwards",
  "slide-left": "slide-left 0.6s ease-out forwards",
  "slide-right": "slide-right 0.6s ease-out forwards",
  "zoom-in": "zoom-in 0.5s ease-out forwards",
  "zoom-out": "zoom-out 0.5s ease-out forwards",
  "flip-in": "flip-in 0.8s ease-out forwards",
  "rotate-in": "rotate-in 0.6s ease-out forwards",
  shake: "shake 0.4s ease-in-out",
},
```

---

## ✅ Deliverables Checklist

- [ ] Toolbar cleaned up and less cluttered
- [ ] AI button in toolbar opening assistant
- [ ] Bottom panel AI tab fully functional with quick actions
- [ ] AI generator shows animated progress indication
- [ ] Hero component supports video backgrounds
- [ ] Hero component has all layout variants (split, centered, fullscreen)
- [ ] Navbar has hamburger menu on mobile
- [ ] SEO settings panel component created
- [ ] Animation presets system implemented
- [ ] Tailwind config updated with new animations
- [ ] TypeScript compiles with 0 errors

---

## 🧪 Testing Requirements

### After Implementation:
```
1. Check toolbar is cleaner and more compact
2. Click AI dropdown → Should show Generate Page, AI Assistant, Add Section
3. Click AI Assistant → Should open right/bottom panels
4. Open bottom panel → Switch to AI tab → Should show quick actions
5. Select a component → AI tab should show component-specific actions
6. Run AI generator → Should show animated progress with status text
7. Add Hero → Set background type to Video → Add video URL → Should play
8. Add Hero → Set layout to Split → Add split image → Should display properly
9. Add Navbar → Check mobile view → Should show hamburger menu
10. Click hamburger → Menu should slide open
11. Open More menu → Page Settings → Should show SEO panel
12. Add animation to component → Should animate in preview
```

---

## 📝 Notes

1. **UI Polish**: All changes should feel smooth and professional
2. **Mobile First**: Test all UI changes on mobile viewport
3. **Accessibility**: Ensure keyboard navigation works
4. **Performance**: Lazy load SEO panel and heavy components
5. **Error States**: Handle API failures gracefully

---

**Phase Duration**: 12-16 hours  
**Dependencies**: Phase 28 complete  
**Blocks**: Wave 12 (Component Superpowers)
