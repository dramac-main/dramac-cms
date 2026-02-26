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
import { resolveBrandColors, injectBrandColors, injectBrandFonts, extractBrandSource, generateBrandCSSVars } from "./brand-colors";
import { getModuleNavigation, mergeMainNavLinks, buildUtilityItems, mergeFooterLinks, type SiteNavigation } from "./smart-navigation";
import type { BrandColorPalette } from "./brand-colors";
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
  /** Full site settings object for brand color resolution */
  siteSettings?: Record<string, unknown> | null;
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
  /** Brand color palette resolved from site settings — injected into component props */
  brandPalette?: BrandColorPalette | null;
  /** Site settings — used for smart navigation (module-contributed nav items) */
  siteSettings?: Record<string, unknown> | null;
  /** Installed modules — used to determine which modules contribute nav items */
  modules?: InstalledModuleInfo[];
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
  "EcommerceProductGrid", "EcommerceProductCard", "EcommerceProductCatalog",
  "EcommerceFeaturedProducts", "EcommerceCartPage", "EcommerceCartDrawer",
  "EcommerceMiniCart", "EcommerceCheckoutPage", "EcommerceOrderConfirmation",
  "EcommerceCategoryNav", "EcommerceSearchBar", "EcommerceFilterSidebar",
  "EcommerceBreadcrumb", "EcommerceProductSort", "EcommerceQuoteRequest",
  "EcommerceQuoteList", "EcommerceQuoteDetail", "EcommerceReviewForm",
  "EcommerceReviewList", "ProductDetailBlock", "CategoryHeroBlock",
]);

/**
 * Renders a single component and its children recursively
 */
function ComponentRenderer({ 
  component, 
  components,
  depth = 0,
  siteId,
  brandPalette,
  siteSettings,
  modules,
}: ComponentRendererProps): React.ReactElement | null {
  // Get component definition from registry
  const definition = getComponent(component.type);
  
  if (!definition) {
    // Component type not found — try to render a generic fallback
    // instead of silently dropping the section (which causes blank pages)
    const props = component.props || {};
    const title = String(props.title || props.headline || props.text || "");
    const subtitle = String(props.subtitle || props.description || "");
    const hasContent = title || subtitle;
    
    if (process.env.NODE_ENV === "development") {
      return (
        <div 
          key={component.id}
          className="border-2 border-dashed border-amber-400 bg-amber-50 p-8 rounded text-center"
        >
          <p className="text-amber-700 text-sm font-medium mb-2">
            Unknown component: {component.type}
          </p>
          {hasContent && (
            <div className="text-amber-600 text-xs">
              {title && <p className="font-semibold">{title}</p>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
        </div>
      );
    }
    
    // Production fallback: render the content in a clean section
    // rather than showing nothing (which is worse)
    if (hasContent) {
      return (
        <section key={component.id} className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {title && <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>}
            {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
          </div>
        </section>
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
            brandPalette={brandPalette}
            siteSettings={siteSettings}
            modules={modules}
          />
        );
      }).filter(Boolean)
    : null;
  
  // Only pass children prop if the component accepts children AND has children
  // Build props with siteId injection — components can use this to fetch real data
  let injectedProps: Record<string, unknown> = { ...component.props, siteId: component.props?.siteId || siteId };

  // BRAND COLOR INJECTION: Fill unset color props with brand-derived values.
  // This is the key architectural change — components no longer need to define
  // their own color defaults. Any color field left empty inherits from the
  // site's brand palette, ensuring consistency across the entire site.
  if (brandPalette) {
    injectedProps = injectBrandColors(injectedProps, brandPalette);
  }

  // BRAND FONT INJECTION: Fill unset font props with brand-derived values.
  // Ensures consistent typography across the entire site. Font fields like
  // titleFont, nameFont, fontFamily etc. inherit from the site's brand fonts
  // unless the user explicitly customized them in Studio.
  if (siteSettings) {
    const fontHeading = (siteSettings.font_heading as string) || (siteSettings.theme as Record<string, unknown>)?.fontHeading as string || null;
    const fontBody = (siteSettings.font_body as string) || (siteSettings.theme as Record<string, unknown>)?.fontBody as string || null;
    injectedProps = injectBrandFonts(injectedProps, fontHeading, fontBody);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SMART NAVIGATION: When rendering Navbar or Footer, merge module-contributed
  // navigation items at render time. This is the runtime assembly that makes
  // enabling a module (Booking, E-commerce) automatically update the navbar
  // with links ("Shop", "Book Now") and utility icons (cart badge).
  // ──────────────────────────────────────────────────────────────────────────
  if (component.type === "Navbar" && siteSettings) {
    const moduleNav = getModuleNavigation(siteSettings, modules);
    const existingLinks = (injectedProps.links as Array<{ label: string; href: string }>) || [];
    injectedProps.links = mergeMainNavLinks(existingLinks, moduleNav.main);
    injectedProps.utilityItems = buildUtilityItems(moduleNav.utility);
  }
  if (component.type === "Footer" && siteSettings) {
    const moduleNav = getModuleNavigation(siteSettings, modules);
    if (moduleNav.footer.length > 0) {
      const existingColumns = (injectedProps.columns as Array<{ title: string; links: Array<{ label: string; href: string }> }>) || [];
      injectedProps.columns = mergeFooterLinks(existingColumns, moduleNav.footer);
    }
  }

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
  brandPalette?: BrandColorPalette | null;
  siteSettings?: Record<string, unknown> | null;
  modules?: InstalledModuleInfo[];
}

/**
 * Renders components within a zone
 */
function ZoneRenderer({ 
  zoneId, 
  componentIds, 
  components,
  siteId,
  brandPalette,
  siteSettings,
  modules,
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
            brandPalette={brandPalette}
            siteSettings={siteSettings}
            modules={modules}
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
  siteSettings,
  siteId,
  pageId,
  modules,
  className = "",
}: StudioRendererProps): React.ReactElement {
  // Resolve brand color palette from site settings (memoized)
  // This is the single source of truth for all component colors.
  // Components with explicit color overrides keep them; unset colors
  // inherit from this palette automatically.
  const brandPalette = useMemo(() => {
    const source = siteSettings
      ? extractBrandSource(siteSettings)
      : themeSettings
        ? { theme: themeSettings as BrandColorPalette extends never ? never : Record<string, string> }
        : null;
    if (!source) return null;
    return resolveBrandColors(source);
  }, [siteSettings, themeSettings]);

  // ── GLOBAL BRANDING CSS VARIABLES ────────────────────────────────────
  // Generate CSS custom properties from the brand palette. These override
  // every Tailwind and shadcn CSS variable inside the published site.
  // This is THE mechanism that makes `bg-card`, `text-foreground`,
  // `bg-primary`, `border`, etc. use the site's brand colors instead
  // of the dashboard's dark/light mode colors.
  //
  // Also handles fonts: reads font_heading / font_body from site settings
  // and sets --font-sans / --font-display CSS variables.
  const brandCSSVars = useMemo(() => {
    if (!brandPalette) return {};
    // Read fonts from flat settings first, then theme.* (AI designer saves under theme)
    const themeObj = siteSettings?.theme as Record<string, unknown> | undefined;
    const fontHeading = (siteSettings?.font_heading as string) || (themeObj?.fontHeading as string) || null;
    const fontBody = (siteSettings?.font_body as string) || (themeObj?.fontBody as string) || null;
    return generateBrandCSSVars(brandPalette, fontHeading, fontBody);
  }, [brandPalette, siteSettings]);

  // ── GOOGLE FONTS LOADER ──────────────────────────────────────────────
  // Dynamically load Google Fonts based on site settings.
  // This ensures the published site has the correct fonts available.
  useEffect(() => {
    // Read fonts from flat settings first, then theme.* (AI designer saves under theme)
    const themeObj = siteSettings?.theme as Record<string, unknown> | undefined;
    const fontHeading = (siteSettings?.font_heading as string) || (themeObj?.fontHeading as string) || null;
    const fontBody = (siteSettings?.font_body as string) || (themeObj?.fontBody as string) || null;
    const fonts = new Set<string>();
    if (fontHeading) fonts.add(fontHeading);
    if (fontBody) fonts.add(fontBody);
    if (fonts.size === 0) return;

    // Build Google Fonts URL
    const families = Array.from(fonts)
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;

    // Don't add if already loaded
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount (unlikely for published sites, but safe)
      try { document.head.removeChild(link); } catch { /* noop */ }
    };
  }, [siteSettings]);

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
        // ── GLOBAL BRANDING CSS VARIABLES ────────────────────────────────
        // This spreads ALL CSS custom properties derived from the brand palette.
        // Every Tailwind utility and shadcn component inside this div will
        // read these variables instead of the dashboard's :root / .dark values.
        // This is the single mechanism that ensures:
        //   1. Published sites NEVER show dark mode (variables are always light)
        //   2. All components use the site's brand colors
        //   3. Fonts are consistent across all modules
        ...(brandCSSVars as React.CSSProperties),
        // Force light mode rendering for website content
        colorScheme: "light",
        backgroundColor: brandPalette?.background || "#ffffff",
        color: brandPalette?.foreground || "#111827",
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
            brandPalette={brandPalette}
            siteSettings={siteSettings}
            modules={modules}
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
          brandPalette={brandPalette}
          siteSettings={siteSettings}
          modules={modules}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ComponentRenderer, ZoneRenderer };
