# Phase AWD-08: Preview & Iteration System

> **Priority**: 🟢 MEDIUM
> **Estimated Time**: 8-10 hours
> **Prerequisites**: AWD-03 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - React component patterns, Zustand state management
2. **AWD-03**: Output format of WebsiteDesignerEngine (GeneratedWebsite type)
3. **Studio Architecture**: `src/components/studio/` for existing patterns

**This phase DEPENDS ON AWD-03** - displays and iterates on generated websites.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/preview/types.ts` | Preview state types |
| `next-platform-dashboard/src/lib/ai/website-designer/preview/store.ts` | Zustand store for preview state |
| `next-platform-dashboard/src/lib/ai/website-designer/preview/iteration-engine.ts` | Handle user feedback |
| `next-platform-dashboard/src/components/studio/website-designer/PreviewRenderer.tsx` | Main preview component |
| `next-platform-dashboard/src/components/studio/website-designer/IterationPanel.tsx` | Feedback/iteration UI |
| `next-platform-dashboard/src/components/studio/website-designer/VersionHistory.tsx` | Version comparison |

---

## 🔧 React Component Pattern

```typescript
// Client components need "use client" directive
"use client";

import { usePreviewStore } from "@/lib/ai/website-designer/preview/store";
import { useState } from "react";

export function PreviewRenderer() {
  const { generatedWebsite, currentPage, setCurrentPage } = usePreviewStore();
  
  // ... component logic
}
```

---

## 🎯 Objective

Build a comprehensive **Preview and Iteration System** that allows users to:
1. Preview generated websites before applying
2. View on different device sizes
3. Make refinement requests through natural language
4. Iterate until satisfied
5. Approve and deploy

**Principle:** Users have full control over the AI output through intuitive iteration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PREVIEW & ITERATION SYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    PREVIEW RENDERER                            │ │
│  │  • Full-page preview                                           │ │
│  │  • Device frame simulation                                     │ │
│  │  • Interactive components                                      │ │
│  │  • Real-time updates                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    ITERATION ENGINE                            │ │
│  │  • Natural language refinement                                 │ │
│  │  • Component-level edits                                       │ │
│  │  • Page-level changes                                          │ │
│  │  • Global style adjustments                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    VERSION CONTROL                             │ │
│  │  • Iteration history                                           │ │
│  │  • Undo/redo support                                           │ │
│  │  • Comparison view                                             │ │
│  │  • Final approval                                              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Types

```typescript
// src/lib/ai/website-designer/preview/types.ts

export interface PreviewState {
  id: string;
  siteId: string;
  version: number;
  generatedAt: Date;
  pages: PreviewPage[];
  designSystem: DesignSystem;
  status: "generating" | "preview" | "iterating" | "approved" | "applied";
  iterations: Iteration[];
  currentIteration: number;
}

export interface PreviewPage {
  id: string;
  name: string;
  slug: string;
  components: PreviewComponent[];
  seo: PageSEO;
}

export interface PreviewComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  renderKey: string;  // For React key
  highlighted?: boolean;
  hasChanges?: boolean;
}

export interface Iteration {
  id: string;
  version: number;
  request: string;           // User's refinement request
  changes: Change[];         // What was changed
  timestamp: Date;
  approved: boolean;
}

export interface Change {
  type: "component" | "page" | "style" | "content";
  target: string;            // Component ID, page slug, or "global"
  field?: string;            // Specific field changed
  oldValue?: any;
  newValue: any;
  description: string;
}

export interface DevicePreview {
  device: "mobile" | "tablet" | "desktop";
  width: number;
  height: number;
  scale: number;
}

export interface RefinementRequest {
  type: "component" | "page" | "style" | "content" | "general";
  target?: string;           // Optional specific target
  request: string;           // Natural language request
  context?: Record<string, any>;  // Additional context
}

export interface RefinementResult {
  success: boolean;
  changes: Change[];
  explanation: string;
  requiresRegeneration: boolean;
}
```

---

## 🔧 Implementation

### 1. Preview Renderer Component

```typescript
// src/components/ai/website-designer/preview-renderer.tsx

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Tablet, Smartphone, RefreshCw, Check, X, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StudioBlockRenderer } from "@/components/studio/block-renderer";
import type { PreviewState, DevicePreview } from "@/lib/ai/website-designer/preview/types";

const devicePresets: Record<string, DevicePreview> = {
  mobile: { device: "mobile", width: 375, height: 812, scale: 0.6 },
  tablet: { device: "tablet", width: 768, height: 1024, scale: 0.5 },
  desktop: { device: "desktop", width: 1440, height: 900, scale: 0.65 },
};

interface PreviewRendererProps {
  previewState: PreviewState;
  onRefine: (request: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onDiscard: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isRefining: boolean;
}

export function PreviewRenderer({
  previewState,
  onRefine,
  onApprove,
  onDiscard,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isRefining,
}: PreviewRendererProps) {
  const [activeDevice, setActiveDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [activePage, setActivePage] = useState(0);
  const [refinementInput, setRefinementInput] = useState("");
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  
  const currentPage = previewState.pages[activePage];
  const device = devicePresets[activeDevice];
  
  const handleRefine = async () => {
    if (!refinementInput.trim()) return;
    await onRefine(refinementInput);
    setRefinementInput("");
    setShowRefinementPanel(false);
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="h-14 border-b bg-white dark:bg-gray-800 flex items-center justify-between px-4">
        {/* Page Selector */}
        <div className="flex items-center gap-2">
          {previewState.pages.map((page, index) => (
            <Button
              key={page.id}
              variant={activePage === index ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePage(index)}
            >
              {page.name}
            </Button>
          ))}
        </div>
        
        {/* Device Selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <Button
            variant={activeDevice === "mobile" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveDevice("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={activeDevice === "tablet" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveDevice("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={activeDevice === "desktop" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveDevice("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          <Button
            variant="outline"
            onClick={() => setShowRefinementPanel(!showRefinementPanel)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refine
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
          >
            <X className="h-4 w-4 mr-2" />
            Discard
          </Button>
          <Button
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve & Apply
          </Button>
        </div>
      </div>
      
      {/* Preview Area */}
      <div className="flex-1 flex">
        {/* Device Preview */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div
            className={cn(
              "bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden transition-all",
              activeDevice === "mobile" && "rounded-[2.5rem]"
            )}
            style={{
              width: device.width,
              height: device.height,
              transform: `scale(${device.scale})`,
              transformOrigin: "center",
            }}
          >
            {/* Device Frame */}
            {activeDevice === "mobile" && (
              <div className="h-6 bg-black flex items-center justify-center">
                <div className="w-20 h-4 bg-gray-800 rounded-full" />
              </div>
            )}
            
            {/* Page Content */}
            <div className="h-full overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {currentPage.components.map((component) => (
                    <div
                      key={component.id}
                      className={cn(
                        "relative transition-all",
                        component.highlighted && "ring-2 ring-blue-500",
                        component.hasChanges && "ring-2 ring-green-500"
                      )}
                    >
                      <StudioBlockRenderer
                        type={component.type}
                        props={component.props}
                        isPreview
                      />
                      
                      {/* Change indicator */}
                      {component.hasChanges && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Updated
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Refinement Panel */}
        <AnimatePresence>
          {showRefinementPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-white dark:bg-gray-800 overflow-hidden"
            >
              <div className="p-4 h-full flex flex-col">
                <h3 className="font-semibold mb-4">Refine Your Website</h3>
                
                {/* Quick Actions */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Quick refinements:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Make it more modern",
                      "Use brighter colors",
                      "Add more white space",
                      "Make headlines bolder",
                      "Simplify the design",
                      "Add more animations",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => setRefinementInput(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Request */}
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder="Describe what you'd like to change..."
                    className="flex-1 p-3 border rounded-lg resize-none text-sm"
                  />
                  <Button
                    onClick={handleRefine}
                    disabled={!refinementInput.trim() || isRefining}
                    className="mt-4"
                  >
                    {isRefining ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refining...
                      </>
                    ) : (
                      "Apply Refinement"
                    )}
                  </Button>
                </div>
                
                {/* Iteration History */}
                {previewState.iterations.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium mb-2">
                      Iteration History ({previewState.iterations.length})
                    </p>
                    <div className="max-h-32 overflow-auto space-y-2">
                      {previewState.iterations.map((iteration, index) => (
                        <div
                          key={iteration.id}
                          className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          <span className="font-medium">v{iteration.version}:</span>{" "}
                          {iteration.request}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Status Bar */}
      <div className="h-8 border-t bg-white dark:bg-gray-800 flex items-center justify-between px-4 text-xs text-gray-500">
        <span>
          Version {previewState.version} • {previewState.pages.length} pages •{" "}
          {previewState.pages.reduce((acc, p) => acc + p.components.length, 0)} components
        </span>
        <span>
          {previewState.status === "generating" && "Generating preview..."}
          {previewState.status === "preview" && "Ready for review"}
          {previewState.status === "iterating" && "Applying changes..."}
          {previewState.status === "approved" && "Approved"}
        </span>
      </div>
    </div>
  );
}
```

### 2. Iteration Engine

```typescript
// src/lib/ai/website-designer/preview/iteration-engine.ts

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { PreviewState, RefinementRequest, RefinementResult, Change } from "./types";

export class IterationEngine {
  private previewState: PreviewState;
  
  constructor(previewState: PreviewState) {
    this.previewState = previewState;
  }
  
  async processRefinement(request: RefinementRequest): Promise<RefinementResult> {
    // Analyze the request to determine scope
    const scope = await this.analyzeRequestScope(request);
    
    // Generate changes based on scope
    let changes: Change[] = [];
    
    switch (scope.type) {
      case "component":
        changes = await this.refineComponent(request, scope.targets);
        break;
      case "page":
        changes = await this.refinePage(request, scope.targets);
        break;
      case "style":
        changes = await this.refineStyle(request);
        break;
      case "content":
        changes = await this.refineContent(request, scope.targets);
        break;
      case "general":
        changes = await this.refineGeneral(request);
        break;
    }
    
    return {
      success: changes.length > 0,
      changes,
      explanation: this.generateExplanation(changes),
      requiresRegeneration: scope.requiresRegeneration,
    };
  }
  
  private async analyzeRequestScope(request: RefinementRequest): Promise<{
    type: RefinementRequest["type"];
    targets: string[];
    requiresRegeneration: boolean;
  }> {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: z.object({
        type: z.enum(["component", "page", "style", "content", "general"]),
        targets: z.array(z.string()).describe("Component IDs or page slugs to modify"),
        requiresRegeneration: z.boolean().describe("Whether full page regeneration is needed"),
        confidence: z.number().min(0).max(1),
      }),
      prompt: `Analyze this refinement request and determine its scope.

Request: "${request.request}"

Current Preview State:
- Pages: ${this.previewState.pages.map(p => p.name).join(", ")}
- Components per page: ${this.previewState.pages.map(p => `${p.name}: ${p.components.map(c => c.type).join(", ")}`).join("\n")}

Determine:
1. Type: Is this about a specific component, page, styling, content, or general?
2. Targets: Which specific components or pages are affected?
3. Requires Regeneration: Can this be done with prop changes or does it need regeneration?

Examples:
- "Make the hero bigger" → component, target: Hero, no regen
- "Change all colors to blue" → style, no targets, no regen
- "Rewrite the about section" → content, target: About page, no regen
- "Add a testimonials section" → general, requires regen
`,
    });
    
    return object;
  }
  
  private async refineComponent(
    request: RefinementRequest,
    targetIds: string[]
  ): Promise<Change[]> {
    const changes: Change[] = [];
    
    for (const targetId of targetIds) {
      // Find the component
      const component = this.findComponent(targetId);
      if (!component) continue;
      
      const { object } = await generateObject({
        model: anthropic("claude-sonnet-4-20250514"),
        schema: z.object({
          changes: z.array(z.object({
            field: z.string(),
            newValue: z.any(),
            reason: z.string(),
          })),
        }),
        prompt: `Refine this component based on the user's request.

Component: ${component.type}
Current props: ${JSON.stringify(component.props, null, 2)}

User request: "${request.request}"

Return the specific prop changes needed. Only include props that need to change.
`,
      });
      
      for (const change of object.changes) {
        changes.push({
          type: "component",
          target: targetId,
          field: change.field,
          oldValue: component.props[change.field],
          newValue: change.newValue,
          description: change.reason,
        });
      }
    }
    
    return changes;
  }
  
  private async refineStyle(request: RefinementRequest): Promise<Change[]> {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: z.object({
        designSystemChanges: z.object({
          colors: z.record(z.string()).optional(),
          typography: z.record(z.string()).optional(),
          spacing: z.record(z.string()).optional(),
          borders: z.record(z.string()).optional(),
        }),
        componentStyleChanges: z.array(z.object({
          componentType: z.string(),
          props: z.record(z.any()),
        })),
      }),
      prompt: `Apply style changes based on the user's request.

User request: "${request.request}"

Current design system: ${JSON.stringify(this.previewState.designSystem, null, 2)}

Return:
1. Design system level changes (colors, typography, etc.)
2. Component-level style changes that should apply to all instances
`,
    });
    
    const changes: Change[] = [];
    
    // Design system changes
    if (object.designSystemChanges.colors) {
      changes.push({
        type: "style",
        target: "global",
        field: "colors",
        newValue: object.designSystemChanges.colors,
        description: "Updated color palette",
      });
    }
    
    // Component style changes
    for (const componentChange of object.componentStyleChanges) {
      // Apply to all matching components
      for (const page of this.previewState.pages) {
        for (const component of page.components) {
          if (component.type === componentChange.componentType) {
            for (const [field, value] of Object.entries(componentChange.props)) {
              changes.push({
                type: "component",
                target: component.id,
                field,
                oldValue: component.props[field],
                newValue: value,
                description: `Style update for ${component.type}`,
              });
            }
          }
        }
      }
    }
    
    return changes;
  }
  
  private async refineContent(
    request: RefinementRequest,
    targetIds: string[]
  ): Promise<Change[]> {
    // Similar to refineComponent but focused on content fields
    const changes: Change[] = [];
    
    const contentFields = ["headline", "subheadline", "title", "description", "text", "content", "ctaText", "buttonText"];
    
    for (const targetId of targetIds) {
      const component = this.findComponent(targetId);
      if (!component) continue;
      
      const { object } = await generateObject({
        model: anthropic("claude-sonnet-4-20250514"),
        schema: z.object({
          changes: z.array(z.object({
            field: z.string(),
            newValue: z.string(),
            reason: z.string(),
          })),
        }),
        prompt: `Rewrite content based on the user's request.

Component: ${component.type}
Current content fields: ${JSON.stringify(
          Object.fromEntries(
            Object.entries(component.props).filter(([k]) => contentFields.includes(k))
          ),
          null,
          2
        )}

User request: "${request.request}"

Return only content field changes (headlines, descriptions, button text, etc.)
`,
      });
      
      for (const change of object.changes) {
        changes.push({
          type: "content",
          target: targetId,
          field: change.field,
          oldValue: component.props[change.field],
          newValue: change.newValue,
          description: change.reason,
        });
      }
    }
    
    return changes;
  }
  
  private async refinePage(
    request: RefinementRequest,
    targetSlugs: string[]
  ): Promise<Change[]> {
    // Page-level changes like reordering sections, adding/removing components
    const changes: Change[] = [];
    
    // ... implementation
    
    return changes;
  }
  
  private async refineGeneral(request: RefinementRequest): Promise<Change[]> {
    // General changes that might affect multiple areas
    const changes: Change[] = [];
    
    // ... implementation
    
    return changes;
  }
  
  private findComponent(idOrType: string): PreviewComponent | null {
    for (const page of this.previewState.pages) {
      const component = page.components.find(
        c => c.id === idOrType || c.type === idOrType
      );
      if (component) return component;
    }
    return null;
  }
  
  private generateExplanation(changes: Change[]): string {
    if (changes.length === 0) {
      return "No changes were made.";
    }
    
    const summary = changes.map(c => c.description).join(". ");
    return `Made ${changes.length} change(s): ${summary}`;
  }
  
  applyChanges(changes: Change[]): PreviewState {
    // Create new state with changes applied
    const newState = JSON.parse(JSON.stringify(this.previewState)) as PreviewState;
    newState.version += 1;
    
    for (const change of changes) {
      if (change.type === "component" || change.type === "content") {
        // Find and update component
        for (const page of newState.pages) {
          const component = page.components.find(c => c.id === change.target);
          if (component && change.field) {
            component.props[change.field] = change.newValue;
            component.hasChanges = true;
          }
        }
      } else if (change.type === "style" && change.target === "global") {
        // Update design system
        if (change.field === "colors") {
          Object.assign(newState.designSystem.colors, change.newValue);
        }
        // ... other design system fields
      }
    }
    
    // Add iteration record
    newState.iterations.push({
      id: crypto.randomUUID(),
      version: newState.version,
      request: "User refinement",
      changes,
      timestamp: new Date(),
      approved: false,
    });
    
    newState.currentIteration = newState.iterations.length - 1;
    
    return newState;
  }
}
```

### 3. Version Control Hook

```typescript
// src/lib/ai/website-designer/preview/use-preview-state.ts

import { useState, useCallback, useMemo } from "react";
import { IterationEngine } from "./iteration-engine";
import type { PreviewState, Change } from "./types";

export function usePreviewState(initialState: PreviewState) {
  const [stateHistory, setStateHistory] = useState<PreviewState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  
  const currentState = stateHistory[currentIndex];
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < stateHistory.length - 1;
  
  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(i => i - 1);
    }
  }, [canUndo]);
  
  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(i => i + 1);
    }
  }, [canRedo]);
  
  const refine = useCallback(async (request: string) => {
    setIsRefining(true);
    
    try {
      const engine = new IterationEngine(currentState);
      const result = await engine.processRefinement({
        type: "general",
        request,
      });
      
      if (result.success) {
        const newState = engine.applyChanges(result.changes);
        
        // Trim any future history (if we undid and then made changes)
        const newHistory = stateHistory.slice(0, currentIndex + 1);
        newHistory.push(newState);
        
        setStateHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
      }
      
      return result;
    } finally {
      setIsRefining(false);
    }
  }, [currentState, currentIndex, stateHistory]);
  
  const approve = useCallback(() => {
    const approvedState = {
      ...currentState,
      status: "approved" as const,
    };
    
    const newHistory = [...stateHistory];
    newHistory[currentIndex] = approvedState;
    setStateHistory(newHistory);
    
    return approvedState;
  }, [currentState, currentIndex, stateHistory]);
  
  return {
    state: currentState,
    isRefining,
    canUndo,
    canRedo,
    undo,
    redo,
    refine,
    approve,
    iterationCount: currentState.iterations.length,
  };
}
```

---

## 📋 Implementation Tasks

### Task 1: Preview Renderer (3 hours)
- Build preview component
- Add device frame simulation
- Implement device switching
- Add page navigation

### Task 2: Iteration Engine (3 hours)
- Build request analyzer
- Implement component refinement
- Implement style refinement
- Implement content refinement

### Task 3: Version Control (2 hours)
- Implement state history
- Add undo/redo
- Build comparison view

### Task 4: Integration (2 hours)
- Connect to AWD-03 engine
- Build approval flow
- Test full pipeline

---

## ✅ Completion Checklist

- [ ] Preview renderer working
- [ ] Device simulation working
- [ ] Page navigation working
- [ ] Refinement panel working
- [ ] Iteration engine working
- [ ] Natural language refinement working
- [ ] Style refinement working
- [ ] Content refinement working
- [ ] Undo/redo working
- [ ] Version history working
- [ ] Approval flow working
- [ ] Integration complete

---

## 📁 Files Created

```
src/lib/ai/website-designer/preview/
├── types.ts
├── iteration-engine.ts
├── use-preview-state.ts
└── index.ts

src/components/ai/website-designer/
├── preview-renderer.tsx
├── device-frame.tsx
├── refinement-panel.tsx
└── iteration-history.tsx
```

---

**READY TO IMPLEMENT! 🚀**
