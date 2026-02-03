/**
 * DRAMAC Studio Ruler Component
 * 
 * Horizontal and vertical rulers for canvas measurement.
 * Created in PHASE-STUDIO-18.
 * 
 * ARCHITECTURE:
 * - `length` = the UNZOOMED viewport dimension (e.g., 375 for iPhone)
 * - `zoom` = current zoom level (e.g., 0.5 for 50%)
 * - Ruler visual size = length × zoom (so it matches the zoomed canvas)
 * - Tick positions are scaled by zoom
 * - Labels show the UNZOOMED pixel values (0, 100, 200, etc.)
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number; // UNZOOMED viewport width or height
  zoom: number; // Zoom as decimal (1 = 100%)
  className?: string;
}

interface RulerContainerProps {
  width: number; // UNZOOMED viewport width
  height: number; // UNZOOMED viewport height
  zoom: number;
  children: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAJOR_TICK_INTERVAL = 100; // Major tick every 100px
const MINOR_TICK_INTERVAL = 10; // Minor tick every 10px
const RULER_SIZE = 24; // Width/height of ruler in pixels

// =============================================================================
// RULER COMPONENT
// =============================================================================

export function Ruler({ orientation, length, zoom, className }: RulerProps) {
  const isHorizontal = orientation === 'horizontal';
  
  // Visual size of the ruler (matches the zoomed canvas)
  const displaySize = length * zoom;
  
  // Calculate visible ticks based on viewport length
  // Tick labels show UNZOOMED values, positions are scaled by zoom
  const ticks = useMemo(() => {
    const result: Array<{ position: number; isMajor: boolean; label?: string }> = [];
    
    // Generate ticks for the full UNZOOMED length
    for (let i = 0; i <= length; i += MINOR_TICK_INTERVAL) {
      const isMajor = i % MAJOR_TICK_INTERVAL === 0;
      result.push({
        position: i * zoom, // Scale position by zoom for visual placement
        isMajor,
        label: isMajor ? String(i) : undefined, // Label shows UNZOOMED value
      });
    }
    
    return result;
  }, [length, zoom]);
  
  return (
    <div
      className={cn(
        'relative select-none overflow-hidden',
        'bg-zinc-100 dark:bg-zinc-900',
        isHorizontal ? 'border-b border-zinc-300 dark:border-zinc-700' : 'border-r border-zinc-300 dark:border-zinc-700',
        className
      )}
      style={{
        [isHorizontal ? 'width' : 'height']: displaySize,
        [isHorizontal ? 'height' : 'width']: RULER_SIZE,
      }}
    >
      {isHorizontal ? (
        // Horizontal ruler
        <svg 
          width={displaySize} 
          height={RULER_SIZE} 
          className="text-zinc-600 dark:text-zinc-400"
          style={{ display: 'block' }}
        >
          {/* Baseline */}
          <line x1={0} y1={RULER_SIZE - 1} x2={displaySize} y2={RULER_SIZE - 1} stroke="currentColor" strokeWidth={1} opacity={0.3} />
          
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.position}
                y1={tick.isMajor ? 8 : 16}
                x2={tick.position}
                y2={RULER_SIZE}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.7 : 0.35}
              />
              {tick.label && tick.position > 0 && (
                <text
                  x={tick.position + 3}
                  y={7}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.85}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
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
          height={displaySize} 
          className="text-zinc-600 dark:text-zinc-400"
          style={{ display: 'block' }}
        >
          {/* Baseline */}
          <line x1={RULER_SIZE - 1} y1={0} x2={RULER_SIZE - 1} y2={displaySize} stroke="currentColor" strokeWidth={1} opacity={0.3} />
          
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.isMajor ? 8 : 16}
                y1={tick.position}
                x2={RULER_SIZE}
                y2={tick.position}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.7 : 0.35}
              />
              {tick.label && tick.position > 0 && (
                <text
                  x={4}
                  y={tick.position + 10}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.85}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight={500}
                  transform={`rotate(-90, 4, ${tick.position + 10})`}
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
    <div className="relative inline-flex flex-col">
      {/* Top row: Corner + Horizontal ruler */}
      <div className="flex">
        {/* Corner square */}
        <div 
          className="shrink-0 bg-zinc-100 dark:bg-zinc-900 border-r border-b border-zinc-300 dark:border-zinc-700"
          style={{ width: RULER_SIZE, height: RULER_SIZE }}
        >
          {/* Diagonal line in corner */}
          <svg width={RULER_SIZE} height={RULER_SIZE} className="text-zinc-400 dark:text-zinc-600">
            <line x1={RULER_SIZE - 4} y1={4} x2={4} y2={RULER_SIZE - 4} stroke="currentColor" strokeWidth={1} />
          </svg>
        </div>
        
        {/* Horizontal ruler */}
        <Ruler 
          orientation="horizontal" 
          length={width} 
          zoom={zoom} 
        />
      </div>
      
      {/* Bottom row: Vertical ruler + Content */}
      <div className="flex">
        {/* Vertical ruler */}
        <div className="shrink-0">
          <Ruler 
            orientation="vertical" 
            length={height} 
            zoom={zoom} 
          />
        </div>
        
        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}
