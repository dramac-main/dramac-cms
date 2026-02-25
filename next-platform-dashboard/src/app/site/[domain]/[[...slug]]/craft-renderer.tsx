"use client";

/**
 * Site Renderer using DRAMAC Studio
 * 
 * Receives pre-fetched data from server component and renders using StudioRenderer.
 * Supports module components when modules are installed for the site.
 * Wraps with StorefrontProvider when ecommerce module is installed.
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 * @phase ECOM-51 - StorefrontProvider Integration
 */

import { useMemo } from "react";
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import type { InstalledModuleInfo } from "@/types/studio-module";

// Lazy-load StorefrontProvider to avoid bundling ecommerce for non-ecom sites
import { StorefrontProvider } from "@/modules/ecommerce/context/storefront-context";

interface CraftRendererProps {
  content: string;
  themeSettings: Record<string, unknown> | null;
  siteSettings?: Record<string, unknown> | null;
  siteId?: string;
  pageId?: string;
  modules?: InstalledModuleInfo[];
}

export function CraftRenderer({ 
  content, 
  themeSettings,
  siteSettings,
  siteId,
  pageId,
  modules,
}: CraftRendererProps) {
  // Check if ecommerce module is installed
  const hasEcommerce = useMemo(
    () => modules?.some(m => m.slug === 'ecommerce' || m.category === 'ecommerce') ?? false,
    [modules]
  );

  const renderer = (
    <StudioRenderer 
      data={content} 
      themeSettings={themeSettings}
      siteSettings={siteSettings}
      siteId={siteId}
      pageId={pageId}
      modules={modules}
    />
  );

  // Wrap in StorefrontProvider when ecommerce is active — this gives all
  // ecommerce blocks access to site settings, currency, quote mode, etc.
  if (hasEcommerce && siteId) {
    return (
      <StorefrontProvider siteId={siteId}>
        {renderer}
      </StorefrontProvider>
    );
  }

  return renderer;
}
