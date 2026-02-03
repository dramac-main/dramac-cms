/**
 * DRAMAC Studio Dimensions Input
 * 
 * Editable width/height inputs with orientation toggle.
 * Created in PHASE-STUDIO-18.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, RotateCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/lib/studio/store/ui-store';

// =============================================================================
// COMPONENT
// =============================================================================

export function DimensionsInput() {
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const isLandscape = useUIStore((s) => s.isLandscape);
  const setViewportDimensions = useUIStore((s) => s.setViewportDimensions);
  const toggleOrientation = useUIStore((s) => s.toggleOrientation);
  
  const [width, setWidth] = useState(String(viewportWidth));
  const [height, setHeight] = useState(String(viewportHeight));
  
  // Sync with store
  useEffect(() => {
    setWidth(String(viewportWidth));
  }, [viewportWidth]);
  
  useEffect(() => {
    setHeight(String(viewportHeight));
  }, [viewportHeight]);
  
  const handleWidthBlur = useCallback(() => {
    const numWidth = parseInt(width, 10);
    if (!isNaN(numWidth) && numWidth > 0) {
      setViewportDimensions(numWidth, viewportHeight);
    } else {
      setWidth(String(viewportWidth));
    }
  }, [width, viewportWidth, viewportHeight, setViewportDimensions]);
  
  const handleHeightBlur = useCallback(() => {
    const numHeight = parseInt(height, 10);
    if (!isNaN(numHeight) && numHeight > 0) {
      setViewportDimensions(viewportWidth, numHeight);
    } else {
      setHeight(String(viewportHeight));
    }
  }, [height, viewportWidth, viewportHeight, setViewportDimensions]);
  
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'width' | 'height'
  ) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    
    // Arrow key adjustments
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.shiftKey ? 10 : 1;
      const direction = e.key === 'ArrowUp' ? 1 : -1;
      
      if (type === 'width') {
        const newWidth = Math.max(1, viewportWidth + delta * direction);
        setViewportDimensions(newWidth, viewportHeight);
      } else {
        const newHeight = Math.max(1, viewportHeight + delta * direction);
        setViewportDimensions(viewportWidth, newHeight);
      }
    }
  }, [viewportWidth, viewportHeight, setViewportDimensions]);
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              onBlur={handleWidthBlur}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
              className="w-14 h-7 text-center text-xs px-1"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Width (px)</p>
            <p className="text-xs text-muted-foreground">Use ↑↓ to adjust. Shift for ±10.</p>
          </TooltipContent>
        </Tooltip>
        
        <X className="h-2.5 w-2.5 text-muted-foreground" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onBlur={handleHeightBlur}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              className="w-14 h-7 text-center text-xs px-1"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Height (px)</p>
            <p className="text-xs text-muted-foreground">Use ↑↓ to adjust. Shift for ±10.</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleOrientation}
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLandscape ? 'text-primary' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle orientation
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
