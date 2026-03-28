/**
 * DRAMAC Studio Canvas Content
 *
 * Rendered INSIDE the CanvasIframe via React portal.
 * This is where components are rendered with full brand color injection,
 * exactly matching how the StudioRenderer renders published pages.
 *
 * Responsibilities:
 * 1. Brand color/font injection into component props (matches renderer.tsx pipeline)
 * 2. Inner DndContext for canvas reordering (@dnd-kit)
 * 3. HTML5 drop handling for library/symbol cross-iframe drops
 * 4. Component rendering with responsive behavior
 * 5. ComponentStateStyles for hover/active/focus effects
 *
 * This component bridges the gap between studio editing and preview rendering —
 * components in the canvas now look identical to the published site.
 */

"use client";

import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
} from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  UniqueIdentifier,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  useEditorStore,
  useUIStore,
  useSelectionStore,
} from "@/lib/studio/store";
import { useSymbolStore } from "@/lib/studio/store/symbol-store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import {
  DroppableCanvas,
  StudioSortableContext,
  SortableComponent,
  ContainerDropZone,
  DragOverlayContent,
} from "@/components/studio/dnd";
import { ComponentWrapper } from "@/components/studio/core/component-wrapper";
import { AIPageGenerator } from "@/components/studio/ai";
import { ComponentStateStyles } from "@/components/studio/canvas/component-state-styles";
import {
  resolveBrandColors,
  injectBrandColors,
  injectBrandFonts,
  extractBrandSource,
} from "@/lib/studio/engine/brand-colors";
import type { BrandColorPalette } from "@/lib/studio/engine/brand-colors";
import type {
  DragData,
  CanvasDragData,
  StudioComponent,
  ZoneDefinition,
} from "@/types/studio";
import { parseZoneId } from "@/types/studio";
import { Button } from "@/components/ui/button";
import { MousePointer, Sparkles, LayoutGrid } from "lucide-react";
import { useCanvasIframe } from "./canvas-iframe";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// COLLISION DETECTION (same as dnd-provider.tsx)
// =============================================================================

const canvasCollisionDetection: CollisionDetection = (args) => {
  const closestCenterCollisions = closestCenter(args);
  if (closestCenterCollisions.length > 0) return closestCenterCollisions;
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

// =============================================================================
// TYPES
// =============================================================================

interface CanvasContentProps {
  className?: string;
}

interface ActiveDragState {
  id: UniqueIdentifier;
  data: DragData;
}

// =============================================================================
// BRAND PALETTE HOOK
// =============================================================================

/**
 * Resolves the brand color palette from siteSettings in the editor store.
 * Same logic as StudioRenderer's palette resolution.
 */
function useBrandPalette(): BrandColorPalette | null {
  const siteSettings = useEditorStore((s) => s.siteSettings);

  return useMemo(() => {
    if (!siteSettings) return null;
    const source = extractBrandSource(siteSettings);
    return resolveBrandColors(source);
  }, [siteSettings]);
}

// =============================================================================
// CANVAS COMPONENT (with brand color injection)
// =============================================================================

interface CanvasComponentProps {
  componentId: string;
  index: number;
  parentId: string | null;
  brandPalette: BrandColorPalette | null;
}

function CanvasComponent({
  componentId,
  index,
  parentId,
  brandPalette,
}: CanvasComponentProps) {
  const component = useEditorStore((s) => s.data.components[componentId]);
  const siteId = useEditorStore((s) => s.siteId);
  const siteSettings = useEditorStore((s) => s.siteSettings);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const liveEffects = useUIStore((s) => s.liveEffects);
  const zoom = useUIStore((s) => s.zoom);

  const definition = component ? componentRegistry.get(component.type) : null;

  // Resolve props with brand color/font injection (matching renderer.tsx pipeline)
  const resolvedProps = useMemo(() => {
    if (!component) return {};

    let props: Record<string, unknown> = { ...component.props };

    // Editor context props
    props._breakpoint = breakpoint;
    props._isEditor = true;
    props._siteId = siteId;
    props._liveEffects = liveEffects && zoom === 1;

    // ── BRAND COLOR INJECTION ──────────────────────────────────────────
    // This is the critical piece that was missing! Components on the canvas
    // now receive the same brand-derived color defaults as the published site.
    // Any color field left empty inherits from the site's brand palette.
    if (brandPalette) {
      props = injectBrandColors(props, brandPalette);
    }

    // ── BRAND FONT INJECTION ───────────────────────────────────────────
    // Font fields (titleFont, fontFamily, etc.) inherit from site brand fonts.
    if (siteSettings) {
      const themeObj = siteSettings.theme as
        | Record<string, unknown>
        | undefined;
      const fontHeading =
        (siteSettings.font_heading as string) ||
        (themeObj?.fontHeading as string) ||
        null;
      const fontBody =
        (siteSettings.font_body as string) ||
        (themeObj?.fontBody as string) ||
        null;
      props = injectBrandFonts(props, fontHeading, fontBody);
    }

    return props;
  }, [component, breakpoint, liveEffects, zoom, siteId, brandPalette, siteSettings]);

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
                  brandPalette={brandPalette}
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
  brandPalette: BrandColorPalette | null;
}

function NestedComponents({
  componentIds,
  parentId,
  brandPalette,
}: NestedComponentsProps) {
  return (
    <StudioSortableContext items={componentIds}>
      {componentIds.map((id, index) => (
        <CanvasComponent
          key={id}
          componentId={id}
          index={index}
          parentId={parentId}
          brandPalette={brandPalette}
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Start Building Your Page</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Drag components from the left panel, or let AI generate a complete
              page for you.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => togglePanel("left")}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Browse Components
              </Button>
              <Button
                onClick={() => setShowGenerator(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              or press Ctrl+K to search components
            </p>
          </>
        )}
      </div>

      <AIPageGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </>
  );
}

// =============================================================================
// HTML5 DROP INDICATOR
// =============================================================================

interface DropIndicatorState {
  targetId: string;
  position: "before" | "after" | "inside";
  rect: { top: number; left: number; width: number };
}

function DropIndicator({ indicator }: { indicator: DropIndicatorState }) {
  const top =
    indicator.position === "before"
      ? indicator.rect.top
      : indicator.rect.top + 2; // "after" shows below

  return (
    <div
      style={{
        position: "fixed",
        top,
        left: indicator.rect.left,
        width: indicator.rect.width,
        height: indicator.position === "inside" ? 0 : 3,
        backgroundColor:
          indicator.position === "inside"
            ? "transparent"
            : "hsl(var(--color-primary, 220 90% 56%))",
        borderRadius: 2,
        pointerEvents: "none",
        zIndex: 9999,
        transition: "top 0.1s ease-out",
        boxShadow:
          indicator.position === "inside"
            ? "none"
            : "0 0 6px hsl(var(--color-primary, 220 90% 56%) / 0.5)",
      }}
    />
  );
}

// =============================================================================
// MAIN CANVAS CONTENT
// =============================================================================

export function CanvasContent({ className }: CanvasContentProps) {
  const data = useEditorStore((s) => s.data);
  const addComponent = useEditorStore((s) => s.addComponent);
  const insertComponents = useEditorStore((s) => s.insertComponents);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const canDropInZone = useEditorStore((s) => s.canDropInZone);
  const setDragging = useUIStore((s) => s.setDragging);
  const selectComponent = useSelectionStore((s) => s.select);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const getSymbol = useSymbolStore((s) => s.getSymbol);

  // Brand palette
  const brandPalette = useBrandPalette();

  // Root children
  const rootChildren = data.root.children;
  const hasComponents = rootChildren.length > 0;

  // Inner DnD state for canvas reordering
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [, setOverId] = useState<UniqueIdentifier | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // HTML5 drop indicator state
  const [dropIndicator, setDropIndicator] =
    useState<DropIndicatorState | null>(null);

  // Access iframe document for elementFromPoint
  const { iframeDocument } = useCanvasIframe();

  // ========================================================================
  // @dnd-kit SENSORS (for canvas reordering INSIDE iframe)
  // ========================================================================

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ========================================================================
  // @dnd-kit HANDLERS (canvas reordering)
  // ========================================================================

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragData = event.active.data.current as DragData;
      setActiveDrag({ id: event.active.id, data: dragData });
      if (dragData.source === "canvas") {
        setDragging(true, (dragData as CanvasDragData).componentType);
      }
      clearSelection();
    },
    [setDragging, clearSelection]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id ?? null);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (event.activatorEvent && "clientX" in event.activatorEvent) {
      const at = event.activatorEvent as MouseEvent;
      lastPointerRef.current = {
        x: at.clientX + (event.delta?.x ?? 0),
        y: at.clientY + (event.delta?.y ?? 0),
      };
    }
  }, []);

  const isDroppedAboveCenter = useCallback(
    (overId: string): boolean => {
      const doc = iframeDocument || document;
      const el = doc.querySelector(`[data-component-id="${overId}"]`);
      if (!el || !lastPointerRef.current) return false;
      const rect = el.getBoundingClientRect();
      return lastPointerRef.current.y < rect.top + rect.height / 2;
    },
    [iframeDocument]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDrag(null);
      setOverId(null);
      setDragging(false, null);
      lastPointerRef.current = null;

      if (!over) return;

      const dragData = active.data.current as DragData;
      const overData = over.data.current;

      // ── Zone drops ──────────────────────────────────────────────────
      if (overData?.type === "zone") {
        const zoneId = overData.zone as string;
        const zoneDef = overData.zoneDef as ZoneDefinition | undefined;
        const parsedZone = parseZoneId(zoneId);
        if (!parsedZone) return;

        const componentType =
          dragData.source === "canvas"
            ? data.components[(dragData as CanvasDragData).componentId]?.type
            : null;
        if (!componentType) return;

        if (!canDropInZone(componentType, zoneId, zoneDef)) {
          toast.error(`Cannot drop here`);
          return;
        }

        if (dragData.source === "canvas") {
          moveComponent(
            (dragData as CanvasDragData).componentId,
            parsedZone.parentId,
            0,
            zoneId
          );
          selectComponent((dragData as CanvasDragData).componentId);
        }
        return;
      }

      // ── Canvas reorder ─────────────────────────────────────────────
      if (dragData.source === "canvas") {
        const { componentId, parentId: oldParentId } =
          dragData as CanvasDragData;
        if (active.id === over.id) return;

        const overId = over.id.toString();
        let newParentId = "root";
        let newIndex = 0;

        if (overId === "canvas-drop-zone" || overId === "root") {
          newParentId = "root";
          newIndex = data.root.children.length;
        } else {
          const overComponent = data.components[overId];
          if (overComponent) {
            const overDef = componentRegistry.get(overComponent.type);
            if (overDef?.acceptsChildren || overDef?.isContainer) {
              newParentId = overId;
              newIndex = overComponent.children?.length ?? 0;
            } else {
              newParentId = overComponent.parentId ?? "root";
              const siblings = overComponent.parentId
                ? data.components[overComponent.parentId]?.children ?? []
                : data.root.children;
              const idx = siblings.indexOf(overId);
              newIndex = isDroppedAboveCenter(overId) ? idx : idx + 1;

              if (oldParentId === newParentId) {
                const oldIdx = siblings.indexOf(componentId);
                if (oldIdx < newIndex) newIndex -= 1;
              }
            }
          }
        }

        moveComponent(componentId, newParentId, newIndex);
        selectComponent(componentId);
      }
    },
    [
      data,
      moveComponent,
      selectComponent,
      setDragging,
      isDroppedAboveCenter,
      canDropInZone,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
    setOverId(null);
    setDragging(false, null);
    lastPointerRef.current = null;
  }, [setDragging]);

  // ========================================================================
  // HTML5 DROP HANDLING (for library/symbol drops from outside iframe)
  // ========================================================================

  /**
   * Find the component under the cursor and determine drop position
   */
  const resolveDropTarget = useCallback(
    (
      clientX: number,
      clientY: number
    ): { targetId: string | null; position: "before" | "after" | "inside" } => {
      const doc = iframeDocument || document;
      const el = doc.elementFromPoint(clientX, clientY);
      if (!el) return { targetId: null, position: "after" };

      // Walk up to find a component wrapper
      const componentEl = el.closest("[data-component-id]");
      if (!componentEl) return { targetId: null, position: "after" };

      const targetId = componentEl.getAttribute("data-component-id");
      if (!targetId) return { targetId: null, position: "after" };

      // Check if this is a container
      const comp = data.components[targetId];
      if (comp) {
        const def = componentRegistry.get(comp.type);
        if (def?.acceptsChildren || def?.isContainer) {
          return { targetId, position: "inside" };
        }
      }

      // Determine before/after based on cursor position
      const rect = componentEl.getBoundingClientRect();
      const isAbove = clientY < rect.top + rect.height / 2;
      return { targetId, position: isAbove ? "before" : "after" };
    },
    [data.components, iframeDocument]
  );

  const handleHTML5DragOver = useCallback(
    (e: React.DragEvent) => {
      // Must prevent default to allow drop
      if (
        e.dataTransfer.types.includes("application/studio-component") ||
        e.dataTransfer.types.includes("application/studio-symbol")
      ) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";

        // Update drop indicator
        const { targetId, position } = resolveDropTarget(
          e.clientX,
          e.clientY
        );
        if (targetId) {
          const doc = iframeDocument || document;
          const el = doc.querySelector(
            `[data-component-id="${targetId}"]`
          );
          if (el) {
            const rect = el.getBoundingClientRect();
            setDropIndicator({
              targetId,
              position,
              rect: {
                top:
                  position === "before"
                    ? rect.top
                    : position === "after"
                      ? rect.bottom
                      : rect.top,
                left: rect.left,
                width: rect.width,
              },
            });
          }
        } else {
          setDropIndicator(null);
        }
      }
    },
    [resolveDropTarget, iframeDocument]
  );

  const handleHTML5DragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the canvas entirely
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDropIndicator(null);
    }
  }, []);

  const handleHTML5Drop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropIndicator(null);

      // ── Library component drop ────────────────────────────────────
      const componentData = e.dataTransfer.getData(
        "application/studio-component"
      );
      if (componentData) {
        try {
          const { componentType } = JSON.parse(componentData);
          const definition = componentRegistry.get(componentType);
          if (!definition) {
            console.error(`[Canvas] Unknown component: ${componentType}`);
            return;
          }

          const defaultProps =
            componentRegistry.getDefaultProps(componentType);
          const { targetId, position } = resolveDropTarget(
            e.clientX,
            e.clientY
          );

          let parentId = "root";
          let index = data.root.children.length;

          if (targetId) {
            const comp = data.components[targetId];
            if (comp) {
              if (position === "inside") {
                parentId = targetId;
                index = comp.children?.length ?? 0;
              } else {
                parentId = comp.parentId ?? "root";
                const siblings = comp.parentId
                  ? data.components[comp.parentId]?.children ?? []
                  : data.root.children;
                const idx = siblings.indexOf(targetId);
                index = position === "before" ? idx : idx + 1;
              }
            }
          }

          const newId = addComponent(componentType, defaultProps, parentId, index);
          selectComponent(newId);

          // Emit recently used event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("studio:component-dropped", {
                detail: { type: componentType },
              })
            );
          }
        } catch (err) {
          console.error("[Canvas] Failed to parse library drop data:", err);
        }
        return;
      }

      // ── Symbol drop ───────────────────────────────────────────────
      const symbolData = e.dataTransfer.getData("application/studio-symbol");
      if (symbolData) {
        try {
          const { symbolId, symbolName } = JSON.parse(symbolData);
          const symbol = getSymbol(symbolId);
          if (!symbol) {
            toast.error(`Symbol "${symbolName}" not found`);
            return;
          }

          const componentsToInsert = symbol.components.map(
            (c: StudioComponent) => ({ ...c })
          );

          let insertIndex = data.root.children.length;
          const { targetId, position } = resolveDropTarget(
            e.clientX,
            e.clientY
          );
          if (targetId) {
            const comp = data.components[targetId];
            if (comp) {
              const siblings = !comp.parentId
                ? data.root.children
                : data.components[comp.parentId]?.children ?? [];
              const idx = siblings.indexOf(targetId);
              insertIndex = position === "before" ? idx : idx + 1;
            }
          }

          const insertedIds = insertComponents(componentsToInsert, insertIndex);
          if (insertedIds.length > 0) selectComponent(insertedIds[0]);
          toast.success(`Added "${symbolName}" to canvas`);
        } catch (err) {
          console.error("[Canvas] Failed to parse symbol drop data:", err);
        }
        return;
      }
    },
    [
      data,
      addComponent,
      insertComponents,
      selectComponent,
      getSymbol,
      resolveDropTarget,
    ]
  );

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div
      className={cn("relative min-h-full", className)}
      onDragOver={handleHTML5DragOver}
      onDragLeave={handleHTML5DragLeave}
      onDrop={handleHTML5Drop}
    >
      {/* HTML5 drop position indicator */}
      {dropIndicator && <DropIndicator indicator={dropIndicator} />}

      {/* Component state styles (hover/active/focus) */}
      <ComponentStateStyles />

      {/* Inner DndContext for canvas reordering */}
      <DndContext
        sensors={sensors}
        collisionDetection={canvasCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
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
                  brandPalette={brandPalette}
                />
              ))}
            </StudioSortableContext>
          ) : (
            <EmptyCanvasState />
          )}
        </DroppableCanvas>

        {/* Canvas reorder drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDrag && <DragOverlayContent data={activeDrag.data} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
