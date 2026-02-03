/**
 * DRAMAC Studio Editor Canvas
 * 
 * Renders the page content with all components.
 * Handles drop zones and component rendering.
 * Supports responsive breakpoint preview.
 */

"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { DroppableCanvas, StudioSortableContext, SortableComponent } from "@/components/studio/dnd";
import { ComponentWrapper } from "@/components/studio/core/component-wrapper";
import { AIPageGenerator } from "@/components/studio/ai";
import { BREAKPOINT_PIXELS, BREAKPOINT_LABELS } from "@/lib/studio/utils/responsive-utils";
import { Button } from "@/components/ui/button";
import type { Breakpoint } from "@/types/studio";
import { Plus, MousePointer, Smartphone, Tablet, Monitor, Sparkles, LayoutGrid } from "lucide-react";

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
  const breakpoint = useUIStore((s) => s.breakpoint);
  
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
  
  // Resolve responsive props for the current breakpoint
  // Components can access _breakpoint and _isEditor for context
  const resolvedProps = useMemo(() => {
    const props: Record<string, unknown> = { ...component.props };
    
    // Add editor context
    props._breakpoint = breakpoint;
    props._isEditor = true;
    
    return props;
  }, [component.props, breakpoint]);
  
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
        <RenderComponent {...resolvedProps}>
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
  const togglePanel = useUIStore((s) => s.togglePanel);
  const [showGenerator, setShowGenerator] = useState(false);
  
  return (
    <>
      <div className="studio-canvas-empty">
        {isDragging ? (
          <>
            <MousePointer className="mb-4 h-12 w-12 animate-bounce text-primary" />
            <h3 className="text-lg font-medium">Drop component here</h3>
            <p className="mt-2 text-sm">Release to add your first component</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Start Building Your Page</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Drag components from the left panel, or let AI generate a complete page for you.
            </p>
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => togglePanel("left")}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Browse Components
              </Button>
              <Button 
                onClick={() => setShowGenerator(true)} 
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              or press Ctrl+K to search components
            </p>
          </>
        )}
      </div>
      
      {/* AI Page Generator Dialog */}
      <AIPageGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </>
  );
}

// =============================================================================
// BREAKPOINT INFO BAR
// =============================================================================

const BREAKPOINT_ICON_MAP: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

function BreakpointInfoBar({ breakpoint }: { breakpoint: Breakpoint }) {
  const Icon = BREAKPOINT_ICON_MAP[breakpoint];
  const width = BREAKPOINT_PIXELS[breakpoint];
  
  return (
    <div className="flex items-center justify-center gap-2 bg-muted/50 text-muted-foreground text-xs py-1.5 px-3 mb-2 rounded-md border border-border">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{BREAKPOINT_LABELS[breakpoint]}</span>
      <span className="text-muted-foreground/70">
        {breakpoint === "desktop" ? "(Full width)" : `(${width}px)`}
      </span>
    </div>
  );
}

// =============================================================================
// DEVICE FRAME CONTAINER
// =============================================================================

interface DeviceFrameProps {
  breakpoint: Breakpoint;
  zoom: number;
  children: React.ReactNode;
}

const DEVICE_FRAME_STYLES: Record<Breakpoint, React.CSSProperties> = {
  mobile: {
    boxShadow: "0 0 0 12px hsl(var(--muted)), 0 0 0 14px hsl(var(--border))",
    borderRadius: "36px",
  },
  tablet: {
    boxShadow: "0 0 0 10px hsl(var(--muted)), 0 0 0 12px hsl(var(--border))",
    borderRadius: "20px",
  },
  desktop: {
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    borderRadius: "8px",
  },
};

function DeviceFrame({ breakpoint, zoom, children }: DeviceFrameProps) {
  const frameStyle = DEVICE_FRAME_STYLES[breakpoint];
  
  // Width based on breakpoint
  const getWidth = () => {
    switch (breakpoint) {
      case "mobile":
        return `${BREAKPOINT_PIXELS.mobile}px`;
      case "tablet":
        return `${BREAKPOINT_PIXELS.tablet}px`;
      case "desktop":
      default:
        return "100%";
    }
  };
  
  return (
    <div
      className={cn(
        "bg-background transition-all duration-300 ease-out",
        "relative border border-border",
        // Desktop takes full width, allow overflow for scrolling
        breakpoint === "desktop" ? "w-full overflow-visible" : "overflow-hidden"
      )}
      style={{
        width: getWidth(),
        minWidth: breakpoint === "mobile" ? `${BREAKPOINT_PIXELS.mobile}px` : undefined,
        maxWidth: breakpoint === "desktop" ? "100%" : `${BREAKPOINT_PIXELS[breakpoint]}px`,
        minHeight: "600px",
        ...frameStyle,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: "top center",
      }}
    >
      {children}
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
  const mode = useUIStore((s) => s.mode);
  const setZoom = useUIStore((s) => s.setZoom);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Canvas ref for wheel events
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Get root children
  const rootChildren = data.root.children;
  const hasComponents = rootChildren.length > 0;
  
  // Handle click on canvas (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on a component
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };
  
  // Handle Ctrl+wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(2, Math.max(0.25, zoom + delta));
      setZoom(newZoom);
    }
  }, [zoom, setZoom]);
  
  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);
  
  const isPreviewMode = mode === "preview";
  const isDesktop = breakpoint === "desktop";
  
  return (
    <div
      ref={canvasRef}
      className={cn(
        "flex w-full overflow-auto",
        // Desktop: fill entire canvas area, allow natural scrolling
        isDesktop ? "h-auto min-h-full p-4" : "h-full items-start justify-center p-8",
        className
      )}
      onClick={handleCanvasClick}
      style={{
        backgroundColor: "hsl(var(--muted) / 0.3)",
        backgroundImage: showGrid ? `
          radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)
        ` : undefined,
        backgroundSize: showGrid ? "20px 20px" : undefined,
      }}
    >
      {/* Device frame container with breakpoint styling */}
      <div className={cn(
        "flex flex-col",
        // Desktop takes full width, others are centered
        isDesktop ? "w-full" : "items-center"
      )}>
        {/* Breakpoint indicator (not in preview mode) */}
        {!isPreviewMode && (
          <BreakpointInfoBar breakpoint={breakpoint} />
        )}
        
        <DeviceFrame breakpoint={breakpoint} zoom={zoom}>
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
        </DeviceFrame>
      </div>
    </div>
  );
}
