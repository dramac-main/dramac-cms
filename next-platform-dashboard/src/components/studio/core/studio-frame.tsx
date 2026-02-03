/**
 * DRAMAC Studio Frame
 * 
 * Wraps the canvas with rulers and device frame based on settings.
 * Created in PHASE-STUDIO-18.
 */

'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { getDevicePreset } from '@/lib/studio/data/device-presets';
import { RulerContainer } from '@/components/studio/features/ruler';
import { DeviceFrame } from '@/components/studio/features/device-frame';

// =============================================================================
// TYPES
// =============================================================================

interface StudioFrameProps {
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StudioFrame({ children, className }: StudioFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const zoom = useUIStore((s) => s.zoom);
  const showDeviceFrame = useUIStore((s) => s.showDeviceFrame);
  const showRuler = useUIStore((s) => s.showRuler);
  const selectedDeviceId = useUIStore((s) => s.selectedDeviceId);
  
  const devicePreset = getDevicePreset(selectedDeviceId);
  
  // Render the canvas content
  const content = showDeviceFrame ? (
    <DeviceFrame
      preset={devicePreset}
      width={viewportWidth}
      height={viewportHeight}
      zoom={zoom}
    >
      {children}
    </DeviceFrame>
  ) : (
    <div
      className="bg-background shadow-lg rounded-lg overflow-hidden"
      style={{
        width: viewportWidth * zoom,
        height: viewportHeight * zoom,
      }}
    >
      <div
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
  
  return (
    <div
      ref={containerRef}
      data-canvas-container
      className={cn(
        'flex-1 overflow-auto',
        // Checkered background pattern
        'bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)]',
        'bg-[length:20px_20px]',
        className
      )}
    >
      <div className="min-h-full flex items-start justify-center p-8">
        {showRuler ? (
          <RulerContainer
            width={viewportWidth}
            height={viewportHeight}
            zoom={zoom}
          >
            {content}
          </RulerContainer>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
