/**
 * CanvasControls — Zoom, fit, minimap, and auto-layout controls.
 */

"use client";

import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  Lock,
  Unlock,
} from "lucide-react";

interface CanvasControlsProps {
  onAutoLayout: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

export function CanvasControls({
  onAutoLayout,
  isLocked,
  onToggleLock,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => zoomIn({ duration: 200 })}
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => zoomOut({ duration: 200 })}
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => fitView({ duration: 300, padding: 0.2 })}
        title="Fit to view"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <div className="mx-0.5 h-4 border-l" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onAutoLayout}
        title="Auto-layout"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleLock}
        title={isLocked ? "Unlock nodes" : "Lock nodes"}
      >
        {isLocked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
