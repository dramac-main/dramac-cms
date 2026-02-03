/**
 * DRAMAC Studio Zoom Controls
 * 
 * Zoom buttons and dropdown with fit/ruler/frame toggles.
 * Created in PHASE-STUDIO-18.
 */

'use client';

import React, { useCallback } from 'react';
import { ZoomIn, ZoomOut, Ruler, Frame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/studio/store/ui-store';

// =============================================================================
// CONSTANTS
// =============================================================================

// Zoom levels as percentages for display
const ZOOM_LEVEL_PERCENTS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

// =============================================================================
// TYPES
// =============================================================================

interface ZoomControlsProps {
  canvasContainerRef?: React.RefObject<HTMLElement | null>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ZoomControls({ canvasContainerRef }: ZoomControlsProps) {
  const zoom = useUIStore((s) => s.zoom);
  const showRuler = useUIStore((s) => s.showRuler);
  const showDeviceFrame = useUIStore((s) => s.showDeviceFrame);
  const setZoom = useUIStore((s) => s.setZoom);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  const fitToScreen = useUIStore((s) => s.fitToScreen);
  const toggleRuler = useUIStore((s) => s.toggleRuler);
  const toggleDeviceFrame = useUIStore((s) => s.toggleDeviceFrame);
  
  const handleFitToScreen = useCallback(() => {
    if (canvasContainerRef?.current) {
      const { clientWidth, clientHeight } = canvasContainerRef.current;
      fitToScreen(clientWidth, clientHeight);
    } else {
      // Fallback to approximate dimensions
      fitToScreen(window.innerWidth - 600, window.innerHeight - 200);
    }
  }, [canvasContainerRef, fitToScreen]);
  
  const handleZoomSelect = useCallback((value: string) => {
    if (value === 'fit') {
      handleFitToScreen();
    } else {
      // Convert percentage string to decimal (e.g., "100" -> 1.0)
      setZoom(parseInt(value, 10) / 100);
    }
  }, [handleFitToScreen, setZoom]);
  
  // Convert zoom (0.25-4.0) to percentage for display and matching select value
  const zoomPercent = Math.round(zoom * 100);
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={zoomOut}
              disabled={zoom <= 0.25}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out (⌘−)</TooltipContent>
        </Tooltip>
        
        <Select value={String(zoomPercent)} onValueChange={handleZoomSelect}>
          <SelectTrigger className="w-18 h-7 text-xs">
            <span>{zoomPercent}%</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fit" className="text-xs">Fit to Screen</SelectItem>
            <Separator className="my-1" />
            {ZOOM_LEVEL_PERCENTS.map((level) => (
              <SelectItem key={level} value={String(level)} className="text-xs">
                {level}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={zoomIn}
              disabled={zoom >= 4}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In (⌘+)</TooltipContent>
        </Tooltip>
        
        <Separator orientation="vertical" className="h-5 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${showRuler ? 'bg-accent' : ''}`}
              onClick={toggleRuler}
            >
              <Ruler className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Ruler</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${showDeviceFrame ? 'bg-accent' : ''}`}
              onClick={toggleDeviceFrame}
            >
              <Frame className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Device Frame</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
