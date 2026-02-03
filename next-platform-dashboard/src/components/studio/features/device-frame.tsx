/**
 * DRAMAC Studio Device Frame
 * 
 * Visual device frame with bezel styling for phones and tablets.
 * Created in PHASE-STUDIO-18.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { DevicePreset } from '@/lib/studio/data/device-presets';

// =============================================================================
// TYPES
// =============================================================================

interface DeviceFrameProps {
  preset?: DevicePreset;
  width: number;
  height: number;
  zoom: number; // Zoom as decimal (1 = 100%)
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeviceFrame({ 
  preset, 
  width, 
  height, 
  zoom, 
  children,
  className,
}: DeviceFrameProps) {
  const isPhone = preset?.category === 'phone';
  const isTablet = preset?.category === 'tablet';
  const showFrame = isPhone || isTablet;
  
  // Desktop/laptop - no frame, just shadow
  if (!showFrame) {
    return (
      <div
        className={cn(
          'bg-background shadow-2xl rounded-lg overflow-hidden',
          className
        )}
        style={{
          width: width * zoom,
          height: height * zoom,
        }}
      >
        <div
          style={{
            width: width,
            height: height,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  
  // Phone or tablet frame
  const borderRadius = preset?.borderRadius || 40;
  const bezelWidth = isPhone ? 12 : 16;
  const frameWidth = width + bezelWidth * 2;
  const frameHeight = height + bezelWidth * 2;
  
  // Calculate status bar height (for phones)
  const statusBarHeight = isPhone ? 44 : 0;
  const homeIndicatorHeight = isPhone && !preset?.hasHomeButton ? 34 : 0;
  
  return (
    <div
      className={cn('relative', className)}
      style={{
        width: frameWidth * zoom,
        height: frameHeight * zoom,
      }}
    >
      {/* Device bezel */}
      <div
        className="absolute inset-0 bg-gray-900 dark:bg-gray-800 shadow-2xl"
        style={{
          borderRadius: (borderRadius + bezelWidth) * zoom,
        }}
      />
      
      {/* Screen area */}
      <div
        className="absolute bg-background overflow-hidden"
        style={{
          top: bezelWidth * zoom,
          left: bezelWidth * zoom,
          width: width * zoom,
          height: height * zoom,
          borderRadius: borderRadius * zoom,
        }}
      >
        {/* Status bar for phones */}
        {isPhone && (
          <div 
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6"
            style={{
              height: statusBarHeight * zoom,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), transparent)',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: width,
            }}
          >
            <span className="text-xs font-medium">9:41</span>
            
            {/* Notch */}
            {preset?.hasNotch && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-0 bg-black rounded-b-xl"
                style={{
                  width: 150,
                  height: 30,
                }}
              />
            )}
            
            {/* Dynamic Island */}
            {preset?.hasDynamicIsland && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-2 bg-black rounded-full"
                style={{
                  width: 120,
                  height: 34,
                }}
              />
            )}
            
            <div className="flex items-center gap-1 text-xs">
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>
        )}
        
        {/* Home indicator for newer phones */}
        {isPhone && !preset?.hasHomeButton && (
          <div 
            className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 rounded-full z-10"
            style={{
              width: 134 * zoom,
              height: 5 * zoom,
            }}
          />
        )}
        
        {/* Actual content - scaled */}
        <div
          className="absolute overflow-auto"
          style={{
            top: statusBarHeight * zoom,
            left: 0,
            right: 0,
            bottom: homeIndicatorHeight * zoom,
            width: width * zoom,
            height: (height - statusBarHeight - homeIndicatorHeight) * zoom,
          }}
        >
          <div
            style={{
              width: width,
              height: height - statusBarHeight - homeIndicatorHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
      
      {/* Side buttons (decorative) - phone only */}
      {isPhone && (
        <>
          {/* Volume buttons (left side) */}
          <div
            className="absolute bg-gray-700 rounded-l"
            style={{
              left: 0,
              top: 100 * zoom,
              width: 3 * zoom,
              height: 30 * zoom,
            }}
          />
          <div
            className="absolute bg-gray-700 rounded-l"
            style={{
              left: 0,
              top: 140 * zoom,
              width: 3 * zoom,
              height: 60 * zoom,
            }}
          />
          {/* Power button (right side) */}
          <div
            className="absolute bg-gray-700 rounded-r"
            style={{
              right: 0,
              top: 120 * zoom,
              width: 3 * zoom,
              height: 80 * zoom,
            }}
          />
        </>
      )}
    </div>
  );
}
