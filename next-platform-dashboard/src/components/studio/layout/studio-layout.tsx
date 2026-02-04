/**
 * DRAMAC Studio Layout
 * 
 * Main layout shell with fixed panels.
 * Uses flexbox layout for reliable panel visibility.
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
// COMPONENT
// =============================================================================

export function StudioLayout({
  toolbar,
  leftPanel,
  canvas,
  rightPanel,
  bottomPanel,
}: StudioLayoutProps) {
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Components */}
        {panels.left && (
          <div 
            className="w-64 shrink-0 border-r border-border bg-muted/30"
            data-panel="left"
          >
            {leftPanel}
          </div>
        )}

        {/* Center Area - Canvas + Bottom */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 overflow-auto" data-panel="canvas">
            {canvas}
          </div>

          {/* Bottom Panel - AI Chat, etc. */}
          {panels.bottom && (
            <div 
              className="h-48 shrink-0 border-t border-border bg-muted/30"
              data-panel="bottom"
            >
              {bottomPanel}
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        {panels.right && (
          <div 
            className="w-80 shrink-0 border-l border-border bg-muted/30 overflow-y-auto"
            data-panel="right"
          >
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
