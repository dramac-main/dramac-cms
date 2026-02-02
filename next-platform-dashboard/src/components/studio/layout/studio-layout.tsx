/**
 * DRAMAC Studio Layout
 * 
 * Main layout shell with resizable panels.
 * 
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────┐
 * │                     Top Toolbar                         │
 * ├──────────┬───────────────────────────┬─────────────────┤
 * │          │                           │                  │
 * │   Left   │        Canvas             │      Right       │
 * │  Panel   │        (Main)             │      Panel       │
 * │          │                           │                  │
 * │          ├───────────────────────────┤                  │
 * │          │     Bottom Panel          │                  │
 * └──────────┴───────────────────────────┴─────────────────┘
 */

"use client";

import { useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useUIStore } from "@/lib/studio/store";

// =============================================================================
// TYPES
// =============================================================================

interface StudioLayoutProps {
  toolbar: React.ReactNode;
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PANEL_SIZES = {
  left: { min: 10, default: 15, max: 25 },
  right: { min: 15, default: 20, max: 30 },
  bottom: { min: 15, default: 25, max: 40 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function StudioLayout({
  toolbar,
  leftPanel,
  canvas,
  rightPanel,
  bottomPanel,
}: StudioLayoutProps) {
  // Get panel state directly from store
  // Panels are NOT persisted to localStorage to avoid hydration issues
  const panels = useUIStore((s) => s.panels);
  const togglePanel = useUIStore((s) => s.togglePanel);

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for meta key (Cmd on Mac, Ctrl on Windows)
      const isMeta = e.metaKey || e.ctrlKey;
      
      if (isMeta && e.key === "\\") {
        e.preventDefault();
        togglePanel("left");
      }
      
      if (isMeta && e.shiftKey && e.key === "\\") {
        e.preventDefault();
        togglePanel("right");
      }
      
      if (isMeta && e.key === "j") {
        e.preventDefault();
        togglePanel("bottom");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePanel]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Top Toolbar */}
      <div className="studio-toolbar h-12 shrink-0 border-b border-border">
        {toolbar}
      </div>

      {/* Main Panel Layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
        autoSaveId="studio-horizontal"
      >
        {/* Left Panel (Component List) */}
        {panels.left && (
          <>
            <ResizablePanel
              id="left-panel"
              defaultSize={PANEL_SIZES.left.default}
              minSize={PANEL_SIZES.left.min}
              maxSize={PANEL_SIZES.left.max}
              className="studio-panel-left"
            >
              <div className="flex h-full flex-col border-r border-border bg-muted/30">
                {leftPanel}
              </div>
            </ResizablePanel>
            <ResizableHandle className="studio-resize-handle-horizontal" />
          </>
        )}

        {/* Center Area (Canvas + Bottom Panel) */}
        <ResizablePanel id="center-panel">
          <ResizablePanelGroup
            direction="vertical"
            autoSaveId="studio-vertical"
          >
            {/* Canvas */}
            <ResizablePanel
              id="canvas-panel"
              minSize={30}
              className="studio-panel-canvas"
            >
              <div className="flex h-full flex-col">
                {canvas}
              </div>
            </ResizablePanel>

            {/* Bottom Panel (Timeline, AI Chat, etc.) */}
            {panels.bottom && (
              <>
                <ResizableHandle className="studio-resize-handle-vertical" />
                <ResizablePanel
                  id="bottom-panel"
                  defaultSize={PANEL_SIZES.bottom.default}
                  minSize={PANEL_SIZES.bottom.min}
                  maxSize={PANEL_SIZES.bottom.max}
                  className="studio-panel-bottom"
                >
                  <div className="flex h-full flex-col border-t border-border bg-muted/30">
                    {bottomPanel}
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Right Panel (Properties) */}
        {panels.right && (
          <>
            <ResizableHandle className="studio-resize-handle-horizontal" />
            <ResizablePanel
              id="right-panel"
              defaultSize={PANEL_SIZES.right.default}
              minSize={PANEL_SIZES.right.min}
              maxSize={PANEL_SIZES.right.max}
              className="studio-panel-right"
            >
              <div className="flex h-full flex-col border-l border-border bg-muted/30">
                {rightPanel}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
