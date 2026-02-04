/**
 * DRAMAC Studio Editor Canvas
 * 
 * Renders the page content with all components.
 * Handles drop zones and component rendering.
 * Supports responsive breakpoint preview.
 * 
 * PHASE-STUDIO-18: Integrated responsive preview with rulers and device frames.
 * PHASE-STUDIO-28: Fixed component registry initialization check.
 * 
 * Canvas Design: Always renders content with light background (like published site).
 * Professional editors (Webflow, Figma) use fixed light canvas regardless of editor theme.
 */

"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { initializeRegistry, isRegistryInitialized } from "@/lib/studio/registry";
import { DroppableCanvas, StudioSortableContext, SortableComponent, ContainerDropZone } from "@/components/studio/dnd";
import { ComponentWrapper } from "@/components/studio/core/component-wrapper";
import { AIPageGenerator } from "@/components/studio/ai";
import { RulerContainer } from "@/components/studio/features/ruler";
import { DeviceFrame as ResponsiveDeviceFrame } from "@/components/studio/features/device-frame";
import { ComponentStateStyles } from "@/components/studio/canvas/component-state-styles";
import { ResponsiveCanvasStyles } from "@/components/studio/canvas/responsive-canvas-styles";
import { getDevicePreset } from "@/lib/studio/data/device-presets";
import { Button } from "@/components/ui/button";
import { MousePointer, Sparkles, LayoutGrid } from "lucide-react";

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
  const liveEffects = useUIStore((s) => s.liveEffects);
  const zoom = useUIStore((s) => s.zoom);
  
  // Get the render function from registry (memoized to avoid repeated lookups)
  const definition = component ? componentRegistry.get(component.type) : null;
  
  // Resolve responsive props for the current breakpoint
  // Components can access _breakpoint, _isEditor, and _liveEffects for context
  // Note: This hook must be called unconditionally (before any early returns)
  const resolvedProps = useMemo(() => {
    if (!component) return {};
    
    const props: Record<string, unknown> = { ...component.props };
    
    // Add editor context
    props._breakpoint = breakpoint;
    props._isEditor = true;
    // Enable live effects when toggle is on AND zoom is 100% (transforms break fixed positioning)
    props._liveEffects = liveEffects && zoom === 1;
    
    return props;
  }, [component, breakpoint, liveEffects, zoom]);
  
  // Early returns after all hooks
  if (!component) {
    console.warn(`[Canvas] Component not found: ${componentId}`);
    return null;
  }
  
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
  
  // Determine if this is a container that can accept children
  const isContainer = definition.acceptsChildren || definition.isContainer;
  
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
          {/* Render children inside ContainerDropZone if this is a container */}
          {isContainer && (
            <ContainerDropZone
              containerId={componentId}
              containerType={component.type}
              direction={definition.layoutDirection || "vertical"}
            >
              {component.children && component.children.length > 0 && (
                <NestedComponents
                  componentIds={component.children}
                  parentId={componentId}
                />
              )}
            </ContainerDropZone>
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
// RESPONSIVE CANVAS FRAME
// =============================================================================

interface CanvasFrameProps {
  children: React.ReactNode;
}

/**
 * Responsive canvas frame that uses ui-store for dimensions and features.
 * Supports rulers, device frames, and custom dimensions from Phase 18.
 * 
 * ARCHITECTURE:
 * 1. Content always renders at FULL SIZE (viewportWidth × viewportHeight)
 * 2. Zoom is applied via CSS transform on the outer container
 * 3. Rulers measure the UNZOOMED viewport dimensions
 * 4. Device frame wraps the zoomed content
 * 
 * IMPORTANT: Canvas content always renders with LIGHT theme (like a real website).
 * This matches professional editors like Webflow, Figma, Framer.
 */
function CanvasFrame({ children }: CanvasFrameProps) {
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const selectedDeviceId = useUIStore((s) => s.selectedDeviceId);
  const zoom = useUIStore((s) => s.zoom);
  const showDeviceFrame = useUIStore((s) => s.showDeviceFrame);
  const showRuler = useUIStore((s) => s.showRuler);
  
  // Get the selected device preset for frame styling
  const devicePreset = useMemo(() => {
    return getDevicePreset(selectedDeviceId);
  }, [selectedDeviceId]);
  
  // Check if device frame should hide the default container styling
  const hasDeviceFrame = showDeviceFrame && devicePreset && devicePreset.category !== 'custom';
  
  // The actual content with FORCED LIGHT THEME at FULL SIZE
  // This is what gets zoomed via CSS transform
  // Content scrolls vertically when it exceeds viewport height
  const contentFrame = (
    <div
      className={cn(
        // Force light theme on canvas content - websites are typically light
        "light",
        "bg-white text-gray-900",
        "relative overflow-x-hidden overflow-y-auto",
        // Class for responsive CSS overrides to target
        "studio-canvas-content"
      )}
      style={{
        width: viewportWidth,
        minHeight: viewportHeight,
        // Allow content to grow beyond viewport height
      }}
    >
      {children}
    </div>
  );
  
  // The zoomed container - applies zoom transform to the full-size content
  // This wrapper handles the sizing so the content looks smaller/larger
  // Only used when device frame is OFF
  // Allow vertical scrolling when content exceeds viewport height
  const zoomedContent = (
    <div
      className="relative shadow-lg rounded-lg overflow-y-auto overflow-x-hidden border border-gray-200"
      style={{
        width: viewportWidth * zoom,
        minHeight: viewportHeight * zoom,
        maxHeight: "calc(100vh - 200px)", // Limit max height for outer scroll
        borderRadius: 8,
      }}
    >
      <div
        style={{
          width: viewportWidth,
          minHeight: viewportHeight,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {contentFrame}
      </div>
    </div>
  );
  
  // Wrap with device frame if enabled for ANY device type
  let framedContent = zoomedContent;
  
  if (hasDeviceFrame) {
    // Device frame renders at zoomed size - pass zoom for bezel scaling
    // DeviceFrame handles ALL device types: phone, tablet, laptop, desktop
    framedContent = (
      <ResponsiveDeviceFrame 
        preset={devicePreset}
        width={viewportWidth} 
        height={viewportHeight} 
        zoom={zoom}
      >
        {/* Pass the unzoomed content - DeviceFrame handles the zoom internally */}
        {contentFrame}
      </ResponsiveDeviceFrame>
    );
  }
  
  // Wrap with rulers if enabled - rulers measure UNZOOMED viewport
  if (showRuler) {
    return (
      <RulerContainer 
        width={viewportWidth} 
        height={viewportHeight} 
        zoom={zoom}
      >
        {framedContent}
      </RulerContainer>
    );
  }
  
  return framedContent;
}

// =============================================================================
// MAIN CANVAS
// =============================================================================

export function EditorCanvas({ className }: EditorCanvasProps) {
  // State
  const data = useEditorStore((s) => s.data);
  const zoom = useUIStore((s) => s.zoom);
  const showGrid = useUIStore((s) => s.showGrid);
  const setZoom = useUIStore((s) => s.setZoom);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Track registry initialization
  const [registryReady, setRegistryReady] = useState(isRegistryInitialized());
  
  // Canvas ref for wheel events
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Get root children
  const rootChildren = data.root.children;
  const hasComponents = rootChildren.length > 0;
  
  // Ensure registry is initialized
  useEffect(() => {
    if (!isRegistryInitialized()) {
      console.log("[EditorCanvas] Initializing component registry...");
      initializeRegistry();
      setRegistryReady(true);
    }
  }, []);
  
  // Handle click on canvas (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on a component
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };
  
  // Handle Ctrl+wheel zoom - IMPROVED: More robust wheel handling
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
  
  // Add wheel event listener with passive: false to allow preventDefault
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
  
  // Wait for registry to be ready before rendering components
  if (!registryReady) {
    return (
      <div className={cn("flex w-full h-full items-center justify-center", className)}>
        <div className="animate-pulse text-muted-foreground">
          Loading components...
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={canvasRef}
      className={cn(
        "flex w-full h-full overflow-auto items-start justify-center p-8",
        className
      )}
      onClick={handleCanvasClick}
      style={{
        backgroundColor: "hsl(var(--muted) / 0.3)",
        backgroundImage: showGrid ? `
          radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)
        ` : undefined,
        backgroundSize: showGrid ? "20px 20px" : undefined,
        // Use overscrollBehavior to prevent scroll chaining issues
        overscrollBehavior: "contain",
      }}
      data-canvas-container
    >
      {/* Canvas frame container with responsive features */}
      <div className="flex flex-col items-center">
        {/* Inject component state CSS for hover/active/focus effects */}
        <ComponentStateStyles />
        
        {/* Inject responsive CSS overrides based on canvas width */}
        <ResponsiveCanvasStyles />
        
        {/* CanvasFrame uses viewportWidth/Height and supports rulers/device frames */}
        <CanvasFrame>
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
        </CanvasFrame>
      </div>
    </div>
  );
}
