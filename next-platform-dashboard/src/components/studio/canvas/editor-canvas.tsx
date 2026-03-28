/**
 * DRAMAC Studio Editor Canvas
 *
 * Industry-standard iframe-based canvas for accurate page rendering.
 * Uses an isolated iframe so components render identically to the published site.
 *
 * Architecture (matches Webflow/Wix/Squarespace/Framer):
 * 1. CanvasIframe — isolated rendering surface with brand CSS variables
 * 2. CanvasContent — component rendering with brand color injection + DnD
 * 3. CanvasFrame — zoom, rulers, device frames wrapping the iframe
 *
 * Benefits of iframe canvas:
 * - TRUE CSS ISOLATION: Dashboard dark mode can't bleed into page content
 * - TRUE RESPONSIVE: Tailwind @media queries respond to iframe width naturally
 * - ACCURATE RENDERING: Components render exactly like the published site
 * - BRAND COLORS: Same injection pipeline as StudioRenderer (146+ field mappings)
 *
 * PHASE-STUDIO-18: Integrated responsive preview with rulers and device frames.
 * PHASE-STUDIO-28: Fixed component registry initialization check.
 * PHASE-STUDIO-30: Iframe-based canvas with brand color injection.
 */

"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { initializeRegistry, isRegistryInitialized } from "@/lib/studio/registry";
import { RulerContainer } from "@/components/studio/features/ruler";
import { DeviceFrame as ResponsiveDeviceFrame } from "@/components/studio/features/device-frame";
import { CanvasIframe } from "@/components/studio/canvas/canvas-iframe";
import { CanvasContent } from "@/components/studio/canvas/canvas-content";
import { getDevicePreset } from "@/lib/studio/data/device-presets";
import {
  resolveBrandColors,
  extractBrandSource,
  generateBrandCSSVars,
} from "@/lib/studio/engine/brand-colors";

// =============================================================================
// TYPES
// =============================================================================

interface EditorCanvasProps {
  className?: string;
}

// =============================================================================
// RESPONSIVE CANVAS FRAME
// =============================================================================

interface CanvasFrameProps {
  children: React.ReactNode;
}

/**
 * Responsive canvas frame that uses ui-store for dimensions and features.
 * Supports rulers, device frames, and custom dimensions from Phase 18.
 *
 * ARCHITECTURE:
 * 1. Content always renders at FULL SIZE (viewportWidth × viewportHeight)
 * 2. Zoom is applied via CSS transform on the outer container
 * 3. Rulers measure the UNZOOMED viewport dimensions
 * 4. Device frame wraps the zoomed content
 *
 * IMPORTANT: Canvas content always renders with LIGHT theme (like a real website).
 * The iframe handles this isolation automatically.
 */
function CanvasFrame({ children }: CanvasFrameProps) {
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const selectedDeviceId = useUIStore((s) => s.selectedDeviceId);
  const zoom = useUIStore((s) => s.zoom);
  const showDeviceFrame = useUIStore((s) => s.showDeviceFrame);
  const showRuler = useUIStore((s) => s.showRuler);

  const devicePreset = useMemo(() => {
    return getDevicePreset(selectedDeviceId);
  }, [selectedDeviceId]);

  const hasDeviceFrame =
    showDeviceFrame && devicePreset && devicePreset.category !== "custom";

  // The zoomed container - applies zoom transform
  const zoomedContent = (
    <div
      className="relative shadow-lg rounded-lg overflow-hidden border border-gray-200"
      style={{
        width: viewportWidth * zoom,
        minHeight: viewportHeight * zoom,
        maxHeight: "calc(100vh - 200px)",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          width: viewportWidth,
          minHeight: viewportHeight,
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );

  let framedContent = zoomedContent;

  if (hasDeviceFrame) {
    framedContent = (
      <ResponsiveDeviceFrame
        preset={devicePreset}
        width={viewportWidth}
        height={viewportHeight}
        zoom={zoom}
      >
        <div
          style={{
            width: viewportWidth,
            minHeight: viewportHeight,
          }}
        >
          {children}
        </div>
      </ResponsiveDeviceFrame>
    );
  }

  if (showRuler) {
    return (
      <RulerContainer
        width={viewportWidth}
        height={viewportHeight}
        zoom={zoom}
      >
        {framedContent}
      </RulerContainer>
    );
  }

  return framedContent;
}

// =============================================================================
// MAIN CANVAS
// =============================================================================

export function EditorCanvas({ className }: EditorCanvasProps) {
  const siteSettings = useEditorStore((s) => s.siteSettings);
  const zoom = useUIStore((s) => s.zoom);
  const showGrid = useUIStore((s) => s.showGrid);
  const setZoom = useUIStore((s) => s.setZoom);
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // Track registry initialization
  const [registryReady, setRegistryReady] = useState(isRegistryInitialized());

  // Canvas ref for wheel events
  const canvasRef = useRef<HTMLDivElement>(null);

  // Ensure registry is initialized
  useEffect(() => {
    if (!isRegistryInitialized()) {
      console.log("[EditorCanvas] Initializing component registry...");
      initializeRegistry();
      setRegistryReady(true);
    }
  }, []);

  // ── Brand color resolution for iframe CSS variables ──────────────────
  const brandPalette = useMemo(() => {
    if (!siteSettings) return null;
    const source = extractBrandSource(siteSettings);
    return resolveBrandColors(source);
  }, [siteSettings]);

  const brandCSSVars = useMemo(() => {
    if (!brandPalette) return {};
    const themeObj = siteSettings?.theme as Record<string, unknown> | undefined;
    const fontHeading =
      (siteSettings?.font_heading as string) ||
      (themeObj?.fontHeading as string) ||
      null;
    const fontBody =
      (siteSettings?.font_body as string) ||
      (themeObj?.fontBody as string) ||
      null;
    return generateBrandCSSVars(brandPalette, fontHeading, fontBody);
  }, [brandPalette, siteSettings]);

  const fontFamilies = useMemo(() => {
    if (!siteSettings) return [];
    const themeObj = siteSettings?.theme as Record<string, unknown> | undefined;
    const fonts = new Set<string>();
    const fh =
      (siteSettings.font_heading as string) ||
      (themeObj?.fontHeading as string);
    const fb =
      (siteSettings.font_body as string) || (themeObj?.fontBody as string);
    if (fh) fonts.add(fh);
    if (fb) fonts.add(fb);
    return Array.from(fonts);
  }, [siteSettings]);

  // Handle click on canvas background (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // Handle Ctrl+wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newZoom = Math.min(4, Math.max(0.1, zoom + delta));
        setZoom(newZoom);
      }
    },
    [zoom, setZoom]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleWheel(e);
      }
    };

    canvas.addEventListener("wheel", wheelHandler, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", wheelHandler);
    };
  }, [handleWheel]);

  if (!registryReady) {
    return (
      <div
        className={cn(
          "flex w-full h-full items-center justify-center",
          className
        )}
      >
        <div className="animate-pulse text-muted-foreground">
          Loading components...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className={cn(
        "flex w-full h-full overflow-auto items-start justify-center p-8",
        className
      )}
      onClick={handleCanvasClick}
      style={{
        backgroundColor: "hsl(var(--muted) / 0.3)",
        backgroundImage: showGrid
          ? `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`
          : undefined,
        backgroundSize: showGrid ? "20px 20px" : undefined,
        overscrollBehavior: "contain",
      }}
      data-canvas-container
    >
      <div className="flex flex-col items-center">
        <CanvasFrame>
          <CanvasIframe
            brandCSSVars={brandCSSVars}
            backgroundColor={brandPalette?.background || "#ffffff"}
            foregroundColor={brandPalette?.foreground || "#111827"}
            fontFamilies={fontFamilies}
            width={viewportWidth}
            minHeight={viewportHeight}
          >
            <CanvasContent />
          </CanvasIframe>
        </CanvasFrame>
      </div>
    </div>
  );
}
