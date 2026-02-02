/**
 * DRAMAC Studio Editor Canvas
 * 
 * Renders the page content with all components.
 * Handles drop zones and component rendering.
 */

"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { DroppableCanvas, StudioSortableContext, SortableComponent } from "@/components/studio/dnd";
import { ComponentWrapper } from "@/components/studio/core/component-wrapper";
import { BREAKPOINTS } from "@/types/studio";
import { Plus, MousePointer } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface EditorCanvasProps {
  className?: string;
}

// =============================================================================
// COMPONENT RENDERER
// =============================================================================

interface CanvasComponentProps {
  componentId: string;
  index: number;
  parentId: string | null;
}

function CanvasComponent({ componentId, index, parentId }: CanvasComponentProps) {
  const component = useEditorStore((s) => s.data.components[componentId]);
  
  if (!component) {
    console.warn(`[Canvas] Component not found: ${componentId}`);
    return null;
  }
  
  // Get the render function from registry
  const definition = componentRegistry.get(component.type);
  
  if (!definition) {
    console.warn(`[Canvas] Unknown component type: ${component.type}`);
    return (
      <SortableComponent
        id={componentId}
        componentType={component.type}
        parentId={parentId}
        index={index}
      >
        <ComponentWrapper
          componentId={componentId}
          componentType={component.type}
          locked={component.locked}
          hidden={component.hidden}
        >
          <div className="rounded border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Unknown component: {component.type}
          </div>
        </ComponentWrapper>
      </SortableComponent>
    );
  }
  
  const RenderComponent = definition.render;
  
  return (
    <SortableComponent
      id={componentId}
      componentType={component.type}
      parentId={parentId}
      index={index}
      disabled={component.locked}
    >
      <ComponentWrapper
        componentId={componentId}
        componentType={component.type}
        locked={component.locked}
        hidden={component.hidden}
      >
        <RenderComponent {...component.props}>
          {/* Render children if this is a container */}
          {definition.acceptsChildren && component.children && component.children.length > 0 && (
            <NestedComponents
              componentIds={component.children}
              parentId={componentId}
            />
          )}
        </RenderComponent>
      </ComponentWrapper>
    </SortableComponent>
  );
}

// =============================================================================
// NESTED COMPONENTS
// =============================================================================

interface NestedComponentsProps {
  componentIds: string[];
  parentId: string;
}

function NestedComponents({ componentIds, parentId }: NestedComponentsProps) {
  return (
    <StudioSortableContext items={componentIds}>
      {componentIds.map((id, index) => (
        <CanvasComponent
          key={id}
          componentId={id}
          index={index}
          parentId={parentId}
        />
      ))}
    </StudioSortableContext>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyCanvasState() {
  const isDragging = useUIStore((s) => s.isDragging);
  
  return (
    <div className="studio-canvas-empty">
      {isDragging ? (
        <>
          <MousePointer className="mb-4 h-12 w-12 animate-bounce text-primary" />
          <h3 className="text-lg font-medium">Drop component here</h3>
          <p className="mt-2 text-sm">Release to add your first component</p>
        </>
      ) : (
        <>
          <Plus className="mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">Start building your page</h3>
          <p className="mt-2 text-sm">Drag components from the left panel</p>
          <p className="mt-1 text-xs">or press Ctrl+K to search components</p>
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN CANVAS
// =============================================================================

export function EditorCanvas({ className }: EditorCanvasProps) {
  // State
  const data = useEditorStore((s) => s.data);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const zoom = useUIStore((s) => s.zoom);
  const showGrid = useUIStore((s) => s.showGrid);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Get root children
  const rootChildren = data.root.children;
  const hasComponents = rootChildren.length > 0;
  
  // Get canvas width based on breakpoint
  const canvasWidth = useMemo(() => {
    if (breakpoint === "mobile") return BREAKPOINTS.mobile.width;
    if (breakpoint === "tablet") return BREAKPOINTS.tablet.width;
    return "100%";
  }, [breakpoint]);
  
  // Handle click on canvas (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on a component
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };
  
  return (
    <div
      className={cn(
        "flex h-full items-start justify-center overflow-auto bg-muted/30 p-8",
        className
      )}
      onClick={handleCanvasClick}
    >
      {/* Canvas container with zoom and responsive width */}
      <div
        className={cn(
          "studio-canvas-grid rounded-lg border border-border bg-background shadow-sm",
          showGrid && "show-grid"
        )}
        style={{
          width: typeof canvasWidth === "number" ? `${canvasWidth}px` : canvasWidth,
          maxWidth: "100%",
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          minHeight: "600px",
        }}
      >
        <DroppableCanvas>
          {hasComponents ? (
            <StudioSortableContext items={rootChildren}>
              {rootChildren.map((id, index) => (
                <CanvasComponent
                  key={id}
                  componentId={id}
                  index={index}
                  parentId={null}
                />
              ))}
            </StudioSortableContext>
          ) : (
            <EmptyCanvasState />
          )}
        </DroppableCanvas>
      </div>
    </div>
  );
}
