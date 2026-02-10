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
  /** Site ID injected by StudioRenderer so every component can fetch real data */
  siteId?: string;
}

// ============================================================================
// Component Renderer
// ============================================================================

/**
 * Module component types that need containment wrappers
 * These come from Booking/E-commerce modules and should not stretch full-screen
 */
const MODULE_COMPONENT_TYPES = new Set([
  "BookingServiceSelector", "BookingWidget", "BookingCalendar",
  "BookingForm", "BookingEmbed", "BookingStaffGrid",
  "ProductGrid", "CartItems", "CartSummary", "CheckoutForm",
]);

/**
 * Renders a single component and its children recursively
 */
function ComponentRenderer({ 
  component, 
  components,
  depth = 0,
  siteId,
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
            siteId={siteId}
          />
        );
      }).filter(Boolean)
    : null;
  
  // Only pass children prop if the component accepts children AND has children
  // Build props with siteId injection — components can use this to fetch real data
  const injectedProps = { ...component.props, siteId: component.props?.siteId || siteId };

  // Determine if this is a module component that needs containment wrapping
  const isModuleComponent = MODULE_COMPONENT_TYPES.has(component.type);
  
  let rendered: React.ReactElement;
  
  if (acceptsChildren && children && children.length > 0) {
    rendered = (
      <RenderComponent
        key={component.id}
        {...injectedProps}
        id={component.id}
      >
        {children}
      </RenderComponent>
    );
  } else {
    rendered = (
      <RenderComponent
        key={component.id}
        {...injectedProps}
        id={component.id}
      />
    );
  }
  
  // Wrap module components in a containment section so they don't stretch full-screen
  if (isModuleComponent) {
    const bgColor = (component.props?.backgroundColor as string) || undefined;
    const paddingY = (component.props?.sectionPaddingY as string) || "py-12 md:py-16";
    const paddingX = (component.props?.sectionPaddingX as string) || "px-4 sm:px-6 lg:px-8";
    return (
      <section 
        key={`module-wrap-${component.id}`}
        className={`w-full ${paddingY}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <div className={`max-w-screen-xl mx-auto ${paddingX}`}>
          {rendered}
        </div>
      </section>
    );
  }
  
  return rendered;
}

// ============================================================================
// Zone Renderer
// ============================================================================

interface ZoneRendererProps {
  zoneId: string;
  componentIds: string[];
  components: Record<string, StudioComponent>;
  siteId?: string;
}

/**
 * Renders components within a zone
 */
function ZoneRenderer({ 
  zoneId, 
  componentIds, 
  components,
  siteId,
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
            siteId={siteId}
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
      let isCancelled = false;
      
      // Timeout: never let module loading block rendering for more than 3 seconds
      const timeout = setTimeout(() => {
        if (!isCancelled) {
          console.warn("[StudioRenderer] Module loading timed out after 3s — rendering without modules");
          setModulesLoaded(true);
        }
      }, 3000);
      
      loadModuleComponents(modules)
        .then(() => {
          if (!isCancelled) {
            setModulesLoaded(true);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error("[StudioRenderer] Error loading module components:", err);
            setModulesLoaded(true); // Continue even if modules fail to load
          }
        })
        .finally(() => clearTimeout(timeout));
      
      return () => {
        isCancelled = true;
        clearTimeout(timeout);
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
  // Show nothing during load — content appears seamlessly once ready
  // Industry standard: published sites never show loading spinners or text.
  // Wix/Squarespace/Webflow render server-side so there's no client loading state.
  // We keep this brief (max 3s timeout) and invisible to match that experience.
  if (!registryReady || !modulesLoaded) {
    return (
      <div 
        className={`studio-renderer ${className}`}
        style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}
        aria-hidden="true"
      />
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
      className={`studio-renderer light ${className}`}
      style={{
        ...themeStyles,
        // Force light mode rendering for website content
        // Studio-built websites are always light-themed — their colors come from
        // inline styles and theme CSS vars, NOT from Tailwind dark: variants.
        // The "light" class prevents any dark: variant from activating inside.
        colorScheme: "light",
        backgroundColor: "#ffffff",
        color: "#111827",
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
            siteId={siteId}
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
          siteId={siteId}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ComponentRenderer, ZoneRenderer };
