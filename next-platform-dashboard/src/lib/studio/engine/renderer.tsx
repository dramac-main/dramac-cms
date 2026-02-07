"use client";

/**
 * StudioRenderer - Main page rendering component
 * 
 * Renders page content using DRAMAC Studio's component system.
 * Replaces Puck's <Render> component for preview and published pages.
 * 
 * Features:
 * - Auto-migrates old Puck data to Studio format
 * - Renders all registered Studio components
 * - Supports theme settings/CSS variables
 * - SSR-compatible with "use client" directive
 * - Auto-initializes component registry
 * - Loads module components when modules prop provided
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 * @phase STUDIO-28 - Fixed registry initialization for preview
 */

import React, { useMemo, useEffect, useState } from "react";
import { ensureStudioFormat } from "../utils/migrate-puck-data";
import { getComponent, componentRegistry } from "../registry/component-registry";
import { initializeRegistry, isRegistryInitialized } from "../registry";
import { loadModuleComponents } from "../registry/module-loader";
import type { StudioComponent } from "@/types/studio";
import type { InstalledModuleInfo } from "@/types/studio-module";

// ============================================================================
// Types
// ============================================================================

export interface StudioRendererProps {
  /** Page data - can be Studio format, Puck format, or string JSON */
  data: unknown;
  /** Theme settings for CSS variables */
  themeSettings?: Record<string, unknown> | null;
  /** Site ID for analytics/tracking */
  siteId?: string;
  /** Page ID for analytics/tracking */
  pageId?: string;
  /** Additional CSS class */
  className?: string;
  /** Installed modules for this site - enables module component rendering */
  modules?: InstalledModuleInfo[];
}

interface ComponentRendererProps {
  component: StudioComponent;
  components: Record<string, StudioComponent>;
  depth?: number;
}

// ============================================================================
// Component Renderer
// ============================================================================

/**
 * Renders a single component and its children recursively
 */
function ComponentRenderer({ 
  component, 
  components,
  depth = 0,
}: ComponentRendererProps): React.ReactElement | null {
  // Get component definition from registry
  const definition = getComponent(component.type);
  
  if (!definition) {
    // Component type not found - show placeholder in dev, hide in prod
    if (process.env.NODE_ENV === "development") {
      return (
        <div 
          key={component.id}
          className="border-2 border-dashed border-amber-400 bg-amber-50 p-4 rounded text-center"
        >
          <p className="text-amber-700 text-sm font-medium">
            Unknown component: {component.type}
          </p>
        </div>
      );
    }
    return null;
  }
  
  // Render component
  const RenderComponent = definition.render;
  
  // Only get children if this component accepts them
  // This prevents passing children to void elements like img, input, etc.
  const acceptsChildren = definition.acceptsChildren === true;
  
  const children = acceptsChildren && component.children?.length 
    ? component.children.map((childId) => {
        const childComponent = components[childId];
        if (!childComponent) return null;
        
        return (
          <ComponentRenderer
            key={childId}
            component={childComponent}
            components={components}
            depth={depth + 1}
          />
        );
      }).filter(Boolean)
    : null;
  
  // Only pass children prop if the component accepts children AND has children
  if (acceptsChildren && children && children.length > 0) {
    return (
      <RenderComponent
        key={component.id}
        {...component.props}
        id={component.id}
      >
        {children}
      </RenderComponent>
    );
  }
  
  // For components that don't accept children, render without children prop
  return (
    <RenderComponent
      key={component.id}
      {...component.props}
      id={component.id}
    />
  );
}

// ============================================================================
// Zone Renderer
// ============================================================================

interface ZoneRendererProps {
  zoneId: string;
  componentIds: string[];
  components: Record<string, StudioComponent>;
}

/**
 * Renders components within a zone
 */
function ZoneRenderer({ 
  zoneId, 
  componentIds, 
  components,
}: ZoneRendererProps): React.ReactElement {
  return (
    <div data-zone={zoneId} className="studio-zone">
      {componentIds.map((id) => {
        const component = components[id];
        if (!component) return null;
        
        return (
          <ComponentRenderer
            key={id}
            component={component}
            components={components}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Theme CSS Generator
// ============================================================================

/**
 * Generate CSS custom properties from theme settings
 */
function generateThemeCSS(settings: Record<string, unknown>): React.CSSProperties {
  const cssVars: Record<string, string> = {};
  
  // Map theme settings to CSS variables
  const mappings: Record<string, string> = {
    primaryColor: "--theme-primary",
    secondaryColor: "--theme-secondary",
    accentColor: "--theme-accent",
    backgroundColor: "--theme-background",
    textColor: "--theme-foreground",
    headingFont: "--theme-font-heading",
    bodyFont: "--theme-font-body",
    borderRadius: "--theme-radius",
  };
  
  Object.entries(mappings).forEach(([key, cssVar]) => {
    if (settings[key] !== undefined && settings[key] !== null) {
      cssVars[cssVar] = String(settings[key]);
    }
  });
  
  return cssVars as React.CSSProperties;
}

// ============================================================================
// Main StudioRenderer
// ============================================================================

/**
 * Main page renderer component
 * Use this instead of Puck's <Render> for all page rendering
 */
export function StudioRenderer({
  data,
  themeSettings,
  siteId,
  pageId,
  modules,
  className = "",
}: StudioRendererProps): React.ReactElement {
  // Ensure registry is initialized synchronously on first render
  const registryReady = useMemo(() => {
    if (!isRegistryInitialized()) {
      console.log("[StudioRenderer] Initializing component registry...");
      initializeRegistry();
      console.log("[StudioRenderer] Registry initialized with", componentRegistry.count, "components");
    }
    return true;
  }, []);
  
  const [modulesLoaded, setModulesLoaded] = useState(!modules || modules.length === 0);
  
  // Load module components if modules are provided
  useEffect(() => {
    if (modules && modules.length > 0) {
      console.log("[StudioRenderer] Loading module components for", modules.length, "modules...");
      let isCancelled = false;
      
      loadModuleComponents(modules)
        .then(() => {
          if (!isCancelled) {
            console.log("[StudioRenderer] Module components loaded");
            setModulesLoaded(true);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error("[StudioRenderer] Error loading module components:", err);
            setModulesLoaded(true); // Continue even if modules fail to load
          }
        });
      
      return () => {
        isCancelled = true;
      };
    }
  }, [modules]);
  
  // Migrate data to Studio format (memoized)
  const studioData = useMemo(() => {
    return ensureStudioFormat(data);
  }, [data]);
  
  // Generate theme CSS variables
  const themeStyles = useMemo(() => {
    return themeSettings ? generateThemeCSS(themeSettings) : {};
  }, [themeSettings]);
  
  // Wait for registry and modules to be ready
  if (!registryReady || !modulesLoaded) {
    return (
      <div className={`studio-renderer studio-loading ${className}`}>
        <div className="flex items-center justify-center min-h-50">
          <div className="animate-pulse text-muted-foreground">Loading components...</div>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!studioData.root.children || studioData.root.children.length === 0) {
    return (
      <div 
        className={`studio-renderer studio-empty ${className}`}
        style={themeStyles}
        data-site-id={siteId}
        data-page-id={pageId}
      >
        {/* Empty page - could show a placeholder in preview mode */}
      </div>
    );
  }
  
  // Render page content
  return (
    <div 
      className={`studio-renderer ${className}`}
      style={{
        ...themeStyles,
        // Prevent OS dark-mode from overriding our inline styles
        // The AI-generated components set all colors explicitly via inline styles,
        // so we just need to prevent the browser from inverting anything.
        colorScheme: "normal",
      }}
      data-site-id={siteId}
      data-page-id={pageId}
    >
      {/* Root children */}
      {studioData.root.children.map((id) => {
        const component = studioData.components[id];
        if (!component) return null;
        
        return (
          <ComponentRenderer
            key={id}
            component={component}
            components={studioData.components}
          />
        );
      })}
      
      {/* Zones (if any) */}
      {studioData.zones && Object.entries(studioData.zones).map(([zoneId, componentIds]) => (
        <ZoneRenderer
          key={zoneId}
          zoneId={zoneId}
          componentIds={componentIds}
          components={studioData.components}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ComponentRenderer, ZoneRenderer };
