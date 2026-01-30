/**
 * Spline 3D Components for Puck Editor (PHASE-ED-04B)
 * 
 * Spline.design integration for no-code 3D scene embedding in DRAMAC CMS.
 * These components allow users to embed interactive 3D scenes from Spline.
 */

"use client";

import React, { Suspense, useState, lazy } from "react";
import type {
  SplineSceneProps,
  SplineViewerProps,
  Spline3DCardProps,
  SplineBackgroundProps,
  SplineProductViewerProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";

// Dynamically import Spline to avoid SSR issues
const Spline = lazy(() => import("@splinetool/react-spline"));

// ============================================
// Shared Components
// ============================================

function SplineLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">Loading 3D Scene...</span>
      </div>
    </div>
  );
}

function SplineFallback({ message = "3D scene unavailable" }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">🎨</div>
        <p className="text-muted-foreground font-medium">{message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Add a Spline scene URL to display 3D content
        </p>
      </div>
    </div>
  );
}

function SplineError({ error }: { error: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 rounded-lg border border-destructive/20">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-destructive font-medium">Failed to load 3D scene</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs">{error}</p>
      </div>
    </div>
  );
}

// ============================================
// SplineScene Component - Basic Embed
// ============================================

export function SplineSceneRender(props: SplineSceneProps) {
  const {
    sceneUrl = "",
    height = 400,
    backgroundColor = "#1a1a2e",
    loading = "lazy",
    fallbackText = "No Spline scene configured",
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (err: unknown) => {
    setIsLoading(false);
    setError(err instanceof Error ? err.message : "Failed to load scene");
  };

  // No URL provided - show placeholder
  if (!sceneUrl) {
    return (
      <div 
        style={{ height, background: backgroundColor }} 
        className="relative rounded-lg overflow-hidden"
      >
        <SplineFallback message={fallbackText} />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="relative rounded-lg overflow-hidden"
    >
      {isLoading && <SplineLoader />}
      {error && <SplineError error={error} />}
      
      <Suspense fallback={<SplineLoader />}>
        <Spline
          scene={sceneUrl}
          onLoad={handleLoad}
          onError={handleError}
          style={{ width: "100%", height: "100%" }}
        />
      </Suspense>
    </div>
  );
}

// ============================================
// SplineViewer Component - Interactive Viewer
// ============================================

export function SplineViewerRender(props: SplineViewerProps) {
  const {
    sceneUrl = "",
    height = 500,
    interactive = true,
    autoRotate = false,
    backgroundColor = "#0a0a0f",
    showControls = true,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (err: unknown) => {
    setIsLoading(false);
    setError(err instanceof Error ? err.message : "Failed to load scene");
  };

  if (!sceneUrl) {
    return (
      <div 
        style={{ height, background: backgroundColor }} 
        className="relative rounded-lg overflow-hidden"
      >
        <SplineFallback message="Add a Spline scene URL for 3D viewer" />
      </div>
    );
  }

  return (
    <div 
      style={{ height, background: backgroundColor }} 
      className="relative rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Controls overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            title="Fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Interaction hint */}
      {interactive && !isLoading && !error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-2 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
            🖱️ Drag to rotate • Scroll to zoom
          </div>
        </div>
      )}

      {isLoading && <SplineLoader />}
      {error && <SplineError error={error} />}
      
      <Suspense fallback={<SplineLoader />}>
        <Spline
          scene={sceneUrl}
          onLoad={handleLoad}
          onError={handleError}
          style={{ 
            width: "100%", 
            height: "100%",
            pointerEvents: interactive ? "auto" : "none",
          }}
        />
      </Suspense>
    </div>
  );
}

// ============================================
// Spline3DCard Component - Card with 3D Background
// ============================================

export function Spline3DCardRender(props: Spline3DCardProps) {
  const {
    sceneUrl = "",
    title = "3D Card Title",
    description = "Add a description for your 3D card content",
    height = 400,
    cardBackground = "rgba(0, 0, 0, 0.7)",
    textColor = "#ffffff",
  } = props;

  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      style={{ height }} 
      className="relative rounded-xl overflow-hidden group"
    >
      {/* 3D Background */}
      {sceneUrl ? (
        <>
          {isLoading && <SplineLoader />}
          <Suspense fallback={<SplineLoader />}>
            <Spline
              scene={sceneUrl}
              onLoad={() => setIsLoading(false)}
              style={{ 
                width: "100%", 
                height: "100%",
                pointerEvents: "none", // Background is non-interactive
              }}
            />
          </Suspense>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
      )}

      {/* Content Overlay */}
      <div 
        className="absolute inset-0 flex flex-col justify-end p-8 transition-opacity duration-300"
        style={{ background: `linear-gradient(transparent 30%, ${cardBackground})` }}
      >
        <div className="transform transition-transform duration-300 group-hover:translate-y-[-4px]">
          <h3 
            className="text-2xl font-bold mb-2"
            style={{ color: textColor }}
          >
            {title}
          </h3>
          <p 
            className="text-base opacity-90"
            style={{ color: textColor }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-xl border-2 border-white/0 group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />
    </div>
  );
}

// ============================================
// SplineBackground Component - Section Background
// ============================================

export function SplineBackgroundRender(props: SplineBackgroundProps) {
  const {
    sceneUrl = "",
    opacity = 0.5,
    overlayColor = "rgba(0, 0, 0, 0.5)",
    minHeight = 500,
  } = props;

  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      style={{ minHeight }} 
      className="relative overflow-hidden"
    >
      {/* 3D Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{ opacity }}
      >
        {sceneUrl ? (
          <>
            {isLoading && <SplineLoader />}
            <Suspense fallback={<SplineLoader />}>
              <Spline
                scene={sceneUrl}
                onLoad={() => setIsLoading(false)}
                style={{ 
                  width: "100%", 
                  height: "100%",
                  pointerEvents: "none",
                }}
              />
            </Suspense>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800" />
        )}
      </div>

      {/* Overlay */}
      <div 
        className="absolute inset-0 z-10"
        style={{ backgroundColor: overlayColor }}
      />

      {/* Content Placeholder */}
      <div className="relative z-20 flex items-center justify-center h-full min-h-[inherit] p-8">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Your Content Here</h2>
          <p className="text-xl opacity-80 max-w-2xl">
            This is a 3D background section. Add your own content using the editor or connect child components.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SplineProductViewer Component - E-commerce Display
// ============================================

export function SplineProductViewerRender(props: SplineProductViewerProps) {
  const {
    sceneUrl = "",
    productName = "Product Name",
    productDescription = "Explore this product in 3D",
    price = "$99.99",
    height = 500,
    showInfo = true,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-background rounded-2xl overflow-hidden shadow-xl border">
      {/* 3D Viewer */}
      <div 
        style={{ height }} 
        className="relative bg-gradient-to-b from-muted/30 to-muted/10"
      >
        {sceneUrl ? (
          <>
            {isLoading && <SplineLoader />}
            {error && <SplineError error={error} />}
            <Suspense fallback={<SplineLoader />}>
              <Spline
                scene={sceneUrl}
                onLoad={() => setIsLoading(false)}
                onError={() => setError("Failed to load product view")}
                style={{ width: "100%", height: "100%" }}
              />
            </Suspense>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-muted/50 flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
              <p className="text-muted-foreground">Add a Spline scene URL for 3D product view</p>
            </div>
          </div>
        )}

        {/* Interaction hint */}
        {sceneUrl && !isLoading && !error && (
          <div className="absolute top-4 left-4">
            <div className="px-3 py-1.5 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
              🔄 Drag to rotate
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      {showInfo && (
        <div className="p-6 border-t">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">
                {productName}
              </h3>
              <p className="text-muted-foreground text-sm">
                {productDescription}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {price}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <button className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Add to Cart
            </button>
            <button className="px-4 py-2.5 rounded-lg border border-input hover:bg-accent transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
