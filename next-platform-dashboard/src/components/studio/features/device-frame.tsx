/**
 * DRAMAC Studio Device Frame
 * 
 * Visual device frame with bezel styling for ALL device types:
 * - Phones: Rounded bezel with notch/Dynamic Island, side buttons
 * - Tablets: Rounded bezel with speaker grille
 * - Laptops: Laptop screen with keyboard base
 * - Desktops: Monitor stand with screen bezel
 * 
 * Created in PHASE-STUDIO-18.
 * 
 * ARCHITECTURE:
 * - `width` and `height` are the UNZOOMED viewport dimensions
 * - `zoom` is applied to all visual elements (bezel, content wrapper)
 * - Children are passed at FULL SIZE and scaled via transform
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
  width: number; // UNZOOMED viewport width
  height: number; // UNZOOMED viewport height
  zoom: number; // Zoom as decimal (1 = 100%)
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PHONE_BEZEL_WIDTH = 14;
const TABLET_BEZEL_WIDTH = 18;
const LAPTOP_BEZEL_WIDTH = 12;
const LAPTOP_CHIN_HEIGHT = 24;
const LAPTOP_KEYBOARD_HEIGHT = 50;
const DESKTOP_BEZEL_WIDTH = 16;
const DESKTOP_CHIN_HEIGHT = 40;
const DESKTOP_STAND_HEIGHT = 80;
const DESKTOP_STAND_WIDTH = 120;
const DESKTOP_BASE_WIDTH = 200;
const DESKTOP_BASE_HEIGHT = 16;

// =============================================================================
// PHONE FRAME
// =============================================================================

function PhoneFrame({ 
  preset, 
  width, 
  height, 
  zoom, 
  children 
}: Omit<DeviceFrameProps, 'className'>) {
  const borderRadius = preset?.borderRadius || 40;
  const bezelWidth = PHONE_BEZEL_WIDTH;
  const frameWidth = width + bezelWidth * 2;
  const frameHeight = height + bezelWidth * 2;
  
  const hasHomeButton = preset?.hasHomeButton ?? false;
  const hasNotch = preset?.hasNotch ?? false;
  const hasDynamicIsland = preset?.hasDynamicIsland ?? false;
  
  const zoomedFrameWidth = frameWidth * zoom;
  const zoomedFrameHeight = frameHeight * zoom;
  const zoomedBezelWidth = bezelWidth * zoom;
  const zoomedBorderRadius = (borderRadius + bezelWidth) * zoom;
  const zoomedScreenRadius = borderRadius * zoom;
  
  return (
    <div className="relative" style={{ width: zoomedFrameWidth, height: zoomedFrameHeight }}>
      {/* Device bezel */}
      <div 
        className="absolute inset-0 bg-zinc-900 shadow-2xl"
        style={{ borderRadius: zoomedBorderRadius }}
      />
      
      {/* Screen area */}
      <div
        className="absolute bg-white overflow-hidden"
        style={{
          top: zoomedBezelWidth,
          left: zoomedBezelWidth,
          width: width * zoom,
          height: height * zoom,
          borderRadius: zoomedScreenRadius,
        }}
      >
        {/* Content */}
        <div style={{ width: width * zoom, height: height * zoom }}>
          <div style={{ width, height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
        
        {/* Notch */}
        {hasNotch && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bg-zinc-900 z-20"
            style={{
              width: 150 * zoom,
              height: 32 * zoom,
              borderBottomLeftRadius: 16 * zoom,
              borderBottomRightRadius: 16 * zoom,
            }}
          />
        )}
        
        {/* Dynamic Island */}
        {hasDynamicIsland && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 rounded-full z-20"
            style={{ top: 12 * zoom, width: 120 * zoom, height: 36 * zoom }}
          />
        )}
        
        {/* Home indicator */}
        {!hasHomeButton && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 bg-zinc-800 rounded-full z-20"
            style={{ bottom: 8 * zoom, width: 135 * zoom, height: 5 * zoom }}
          />
        )}
      </div>
      
      {/* Side buttons */}
      <div
        className="absolute bg-zinc-700"
        style={{ left: 0, top: 100 * zoom, width: 3 * zoom, height: 30 * zoom, borderRadius: 2 * zoom }}
      />
      <div
        className="absolute bg-zinc-700"
        style={{ left: 0, top: 140 * zoom, width: 3 * zoom, height: 60 * zoom, borderRadius: 2 * zoom }}
      />
      <div
        className="absolute bg-zinc-700"
        style={{ right: 0, top: 120 * zoom, width: 3 * zoom, height: 80 * zoom, borderRadius: 2 * zoom }}
      />
    </div>
  );
}

// =============================================================================
// TABLET FRAME
// =============================================================================

function TabletFrame({ 
  preset, 
  width, 
  height, 
  zoom, 
  children 
}: Omit<DeviceFrameProps, 'className'>) {
  const borderRadius = preset?.borderRadius || 20;
  const bezelWidth = TABLET_BEZEL_WIDTH;
  const frameWidth = width + bezelWidth * 2;
  const frameHeight = height + bezelWidth * 2;
  
  const zoomedFrameWidth = frameWidth * zoom;
  const zoomedFrameHeight = frameHeight * zoom;
  const zoomedBezelWidth = bezelWidth * zoom;
  const zoomedBorderRadius = (borderRadius + bezelWidth) * zoom;
  const zoomedScreenRadius = borderRadius * zoom;
  
  return (
    <div className="relative" style={{ width: zoomedFrameWidth, height: zoomedFrameHeight }}>
      {/* Device bezel */}
      <div 
        className="absolute inset-0 bg-zinc-800 shadow-2xl"
        style={{ borderRadius: zoomedBorderRadius }}
      />
      
      {/* Screen area */}
      <div
        className="absolute bg-white overflow-hidden"
        style={{
          top: zoomedBezelWidth,
          left: zoomedBezelWidth,
          width: width * zoom,
          height: height * zoom,
          borderRadius: zoomedScreenRadius,
        }}
      >
        <div style={{ width: width * zoom, height: height * zoom }}>
          <div style={{ width, height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      </div>
      
      {/* Top speaker grille */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-zinc-700 rounded-full"
        style={{ top: 6 * zoom, width: 80 * zoom, height: 4 * zoom }}
      />
      
      {/* Camera dot */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-zinc-600 rounded-full"
        style={{ top: 8 * zoom, width: 8 * zoom, height: 8 * zoom, marginLeft: 60 * zoom }}
      />
    </div>
  );
}

// =============================================================================
// LAPTOP FRAME
// =============================================================================

function LaptopFrame({ 
  width, 
  height, 
  zoom, 
  children 
}: Omit<DeviceFrameProps, 'className' | 'preset'>) {
  const bezelWidth = LAPTOP_BEZEL_WIDTH;
  const chinHeight = LAPTOP_CHIN_HEIGHT;
  const keyboardHeight = LAPTOP_KEYBOARD_HEIGHT;
  
  const screenWidth = width + bezelWidth * 2;
  const screenHeight = height + bezelWidth + chinHeight;
  const keyboardWidth = screenWidth * 1.1; // Keyboard is slightly wider
  
  const totalWidth = keyboardWidth;
  const totalHeight = screenHeight + keyboardHeight;
  
  const zoomedTotalWidth = totalWidth * zoom;
  const zoomedTotalHeight = totalHeight * zoom;
  const zoomedScreenWidth = screenWidth * zoom;
  const zoomedScreenHeight = screenHeight * zoom;
  const zoomedKeyboardWidth = keyboardWidth * zoom;
  const zoomedKeyboardHeight = keyboardHeight * zoom;
  const zoomedBezelWidth = bezelWidth * zoom;
  
  return (
    <div className="relative" style={{ width: zoomedTotalWidth, height: zoomedTotalHeight }}>
      {/* Screen housing */}
      <div
        className="absolute bg-zinc-800 shadow-xl"
        style={{
          left: (keyboardWidth - screenWidth) / 2 * zoom,
          top: 0,
          width: zoomedScreenWidth,
          height: zoomedScreenHeight,
          borderTopLeftRadius: 12 * zoom,
          borderTopRightRadius: 12 * zoom,
          borderBottomLeftRadius: 4 * zoom,
          borderBottomRightRadius: 4 * zoom,
        }}
      >
        {/* Screen area */}
        <div
          className="absolute bg-white overflow-hidden"
          style={{
            top: zoomedBezelWidth,
            left: zoomedBezelWidth,
            width: width * zoom,
            height: height * zoom,
            borderRadius: 4 * zoom,
          }}
        >
          <div style={{ width: width * zoom, height: height * zoom }}>
            <div style={{ width, height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {children}
            </div>
          </div>
        </div>
        
        {/* Camera notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 rounded-b-sm"
          style={{ top: 0, width: 80 * zoom, height: 6 * zoom }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-zinc-700 rounded-full"
            style={{ top: 1 * zoom, width: 4 * zoom, height: 4 * zoom }}
          />
        </div>
        
        {/* Chin with logo */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-zinc-600"
          style={{ fontSize: 10 * zoom }}
        >
          ●
        </div>
      </div>
      
      {/* Keyboard base */}
      <div
        className="absolute bg-gradient-to-b from-zinc-700 to-zinc-800 shadow-lg"
        style={{
          left: 0,
          top: zoomedScreenHeight - 2 * zoom, // Slight overlap
          width: zoomedKeyboardWidth,
          height: zoomedKeyboardHeight,
          borderBottomLeftRadius: 8 * zoom,
          borderBottomRightRadius: 8 * zoom,
        }}
      >
        {/* Keyboard surface */}
        <div
          className="absolute bg-zinc-900/30"
          style={{
            left: 10 * zoom,
            right: 10 * zoom,
            top: 8 * zoom,
            bottom: 16 * zoom,
            borderRadius: 4 * zoom,
          }}
        />
        
        {/* Trackpad */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-zinc-600/50"
          style={{
            bottom: 4 * zoom,
            width: 100 * zoom,
            height: 6 * zoom,
            borderRadius: 2 * zoom,
          }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// DESKTOP MONITOR FRAME
// =============================================================================

function DesktopFrame({ 
  width, 
  height, 
  zoom, 
  children 
}: Omit<DeviceFrameProps, 'className' | 'preset'>) {
  const bezelWidth = DESKTOP_BEZEL_WIDTH;
  const chinHeight = DESKTOP_CHIN_HEIGHT;
  const standHeight = DESKTOP_STAND_HEIGHT;
  const standWidth = DESKTOP_STAND_WIDTH;
  const baseWidth = DESKTOP_BASE_WIDTH;
  const baseHeight = DESKTOP_BASE_HEIGHT;
  
  const monitorWidth = width + bezelWidth * 2;
  const monitorHeight = height + bezelWidth + chinHeight;
  const totalHeight = monitorHeight + standHeight + baseHeight;
  
  const zoomedMonitorWidth = monitorWidth * zoom;
  const zoomedMonitorHeight = monitorHeight * zoom;
  const zoomedTotalHeight = totalHeight * zoom;
  const zoomedBezelWidth = bezelWidth * zoom;
  const zoomedChinHeight = chinHeight * zoom;
  const zoomedStandHeight = standHeight * zoom;
  const zoomedStandWidth = standWidth * zoom;
  const zoomedBaseWidth = baseWidth * zoom;
  const zoomedBaseHeight = baseHeight * zoom;
  
  return (
    <div 
      className="relative flex flex-col items-center" 
      style={{ width: zoomedMonitorWidth, height: zoomedTotalHeight }}
    >
      {/* Monitor screen */}
      <div
        className="relative bg-zinc-900 shadow-2xl"
        style={{
          width: zoomedMonitorWidth,
          height: zoomedMonitorHeight,
          borderRadius: 8 * zoom,
        }}
      >
        {/* Screen area */}
        <div
          className="absolute bg-white overflow-hidden"
          style={{
            top: zoomedBezelWidth,
            left: zoomedBezelWidth,
            width: width * zoom,
            height: height * zoom,
            borderRadius: 2 * zoom,
          }}
        >
          <div style={{ width: width * zoom, height: height * zoom }}>
            <div style={{ width, height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {children}
            </div>
          </div>
        </div>
        
        {/* Chin with logo */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center text-zinc-600"
          style={{ height: zoomedChinHeight, fontSize: 14 * zoom }}
        >
          ●
        </div>
      </div>
      
      {/* Monitor stand neck */}
      <div
        className="bg-gradient-to-b from-zinc-700 to-zinc-600"
        style={{
          width: zoomedStandWidth,
          height: zoomedStandHeight,
          marginTop: -4 * zoom, // Overlap with monitor
        }}
      />
      
      {/* Monitor base */}
      <div
        className="bg-zinc-700 shadow-lg"
        style={{
          width: zoomedBaseWidth,
          height: zoomedBaseHeight,
          borderRadius: 4 * zoom,
          marginTop: -2 * zoom, // Overlap with neck
        }}
      />
    </div>
  );
}

// =============================================================================
// SIMPLE FRAME (for custom/no frame)
// =============================================================================

function SimpleFrame({ 
  width, 
  height, 
  zoom, 
  children 
}: Omit<DeviceFrameProps, 'className' | 'preset'>) {
  return (
    <div
      className="shadow-2xl rounded-lg overflow-hidden border border-gray-200"
      style={{ width: width * zoom, height: height * zoom }}
    >
      <div style={{ width, height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DeviceFrame({ 
  preset, 
  width, 
  height, 
  zoom, 
  children,
  className,
}: DeviceFrameProps) {
  const category = preset?.category;
  
  const renderFrame = () => {
    switch (category) {
      case 'phone':
        return (
          <PhoneFrame preset={preset} width={width} height={height} zoom={zoom}>
            {children}
          </PhoneFrame>
        );
      case 'tablet':
        return (
          <TabletFrame preset={preset} width={width} height={height} zoom={zoom}>
            {children}
          </TabletFrame>
        );
      case 'laptop':
        return (
          <LaptopFrame width={width} height={height} zoom={zoom}>
            {children}
          </LaptopFrame>
        );
      case 'desktop':
        return (
          <DesktopFrame width={width} height={height} zoom={zoom}>
            {children}
          </DesktopFrame>
        );
      default:
        return (
          <SimpleFrame width={width} height={height} zoom={zoom}>
            {children}
          </SimpleFrame>
        );
    }
  };
  
  return (
    <div className={cn('inline-block', className)}>
      {renderFrame()}
    </div>
  );
}
