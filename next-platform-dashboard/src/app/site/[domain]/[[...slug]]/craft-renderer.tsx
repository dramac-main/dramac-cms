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
 * @phase LPB-03 - Landing Page Public Serving
 */

import { useEffect } from "react";
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import type { InstalledModuleInfo } from "@/types/studio-module";
import { StorefrontProvider } from "@/modules/ecommerce/context/storefront-context";
import { StorefrontAuthProvider } from "@/modules/ecommerce/context/storefront-auth-context";
import { StorefrontAuthDialogProvider } from "@/modules/ecommerce/studio/components/StorefrontAuthDialog";
import { initLPTracking } from "@/modules/marketing/lib/lp-tracking-client";

interface CraftRendererProps {
  content: string;
  themeSettings: Record<string, unknown> | null;
  siteSettings?: Record<string, unknown> | null;
  siteId?: string;
  pageId?: string;
  modules?: InstalledModuleInfo[];
  // LP mode props — Phase LPB-03
  isLandingPage?: boolean;
  landingPageId?: string;
}

export function CraftRenderer({
  content,
  themeSettings,
  siteSettings,
  siteId,
  pageId,
  modules,
  isLandingPage,
  landingPageId,
}: CraftRendererProps) {
  // ── LP Visit + Engagement Tracking — Phase LPB-08 ──────────────────────
  useEffect(() => {
    if (!isLandingPage || !landingPageId || !siteId) return;
    initLPTracking(siteId, landingPageId);
  }, [isLandingPage, landingPageId, siteId]);

  // Always wrap in StorefrontProvider to maintain a consistent component tree.
  // Conditional wrapping causes React error #310 ("Rendered more hooks than
  // during the previous render") because StorefrontProvider has hooks inside it.
  // When ecommerce is not active, StorefrontProvider is a harmless no-op
  // (skips API call when siteId is empty, returns default context values).
  return (
    <StorefrontProvider siteId={siteId || ""}>
      <StorefrontAuthProvider siteId={siteId || ""}>
        <StudioRenderer
          data={content}
          themeSettings={themeSettings}
          siteSettings={siteSettings}
          siteId={siteId}
          pageId={pageId}
          modules={modules}
        >
          {/* Auth dialog MUST be inside StudioRenderer so it inherits brand CSS variables */}
          <StorefrontAuthDialogProvider />
        </StudioRenderer>
      </StorefrontAuthProvider>
    </StorefrontProvider>
  );
}
