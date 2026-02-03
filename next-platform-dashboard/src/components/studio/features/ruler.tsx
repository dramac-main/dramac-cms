/**
 * DRAMAC Studio Ruler Component
 * 
 * Horizontal and vertical rulers for canvas measurement.
 * Created in PHASE-STUDIO-18.
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number; // Viewport width or height
  zoom: number; // Zoom as decimal (1 = 100%)
  className?: string;
}

interface RulerContainerProps {
  width: number;
  height: number;
  zoom: number;
  children: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAJOR_TICK_INTERVAL = 100; // Major tick every 100px
const MINOR_TICK_INTERVAL = 10; // Minor tick every 10px
const RULER_SIZE = 20; // Width/height of ruler in pixels

// =============================================================================
// RULER COMPONENT
// =============================================================================

export function Ruler({ orientation, length, zoom, className }: RulerProps) {
  const isHorizontal = orientation === 'horizontal';
  
  // Calculate visible ticks based on zoom
  const ticks = useMemo(() => {
    const result: Array<{ position: number; isMajor: boolean; label?: string }> = [];
    const scaledLength = length;
    
    for (let i = 0; i <= scaledLength; i += MINOR_TICK_INTERVAL) {
      const isMajor = i % MAJOR_TICK_INTERVAL === 0;
      result.push({
        position: i * zoom,
        isMajor,
        label: isMajor ? String(i) : undefined,
      });
    }
    
    return result;
  }, [length, zoom]);
  
  const scaledSize = length * zoom;
  
  return (
    <div
      className={cn(
        'bg-muted/50 border-border select-none overflow-hidden',
        isHorizontal ? 'h-5 border-b' : 'w-5 border-r',
        className
      )}
      style={{
        [isHorizontal ? 'width' : 'height']: scaledSize,
      }}
    >
      {isHorizontal ? (
        // Horizontal ruler
        <svg 
          width={scaledSize} 
          height={RULER_SIZE} 
          className="text-muted-foreground"
        >
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.position}
                y1={tick.isMajor ? 0 : 12}
                x2={tick.position}
                y2={RULER_SIZE}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.6 : 0.3}
              />
              {tick.label && (
                <text
                  x={tick.position + 3}
                  y={10}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.7}
                >
                  {tick.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      ) : (
        // Vertical ruler
        <svg 
          width={RULER_SIZE} 
          height={scaledSize} 
          className="text-muted-foreground"
        >
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.isMajor ? 0 : 12}
                y1={tick.position}
                x2={RULER_SIZE}
                y2={tick.position}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.6 : 0.3}
              />
              {tick.label && (
                <text
                  x={2}
                  y={tick.position + 10}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.7}
                  style={{ 
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                  }}
                >
                  {tick.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

// =============================================================================
// RULER CONTAINER
// =============================================================================

export function RulerContainer({ width, height, zoom, children }: RulerContainerProps) {
  return (
    <div className="relative">
      {/* Corner square */}
      <div className="absolute top-0 left-0 w-5 h-5 bg-muted/50 border-r border-b z-10" />
      
      {/* Horizontal ruler */}
      <div className="absolute top-0 left-5">
        <Ruler orientation="horizontal" length={width} zoom={zoom} />
      </div>
      
      {/* Vertical ruler */}
      <div className="absolute top-5 left-0">
        <Ruler orientation="vertical" length={height} zoom={zoom} />
      </div>
      
      {/* Content with offset for rulers */}
      <div className="pl-5 pt-5">
        {children}
      </div>
    </div>
  );
}
