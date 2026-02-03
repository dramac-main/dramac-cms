"use client";

/**
 * Site Renderer - Unified page rendering
 * 
 * This component has been migrated to use DRAMAC Studio's renderer.
 * Kept for backward compatibility with existing imports.
 * 
 * @deprecated Use StudioRenderer from "@/lib/studio/engine/renderer" directly
 * @phase STUDIO-27 - Migrated from Puck to StudioRenderer
 */

import { StudioRenderer } from "@/lib/studio/engine/renderer";
import type { ThemeSettings } from "@/lib/renderer/theme";

interface SiteRendererProps {
  /** Content - can be string (JSON) or object */
  content: string | Record<string, unknown>;
  /** Site theme settings */
  themeSettings?: ThemeSettings | Record<string, unknown> | null;
  /** Site ID for tracking */
  siteId?: string;
  /** Page ID for tracking */
  pageId?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * @deprecated Use StudioRenderer instead
 */
export function PuckSiteRenderer({
  content,
  themeSettings,
  siteId,
  pageId,
  className = "",
}: SiteRendererProps) {
  return (
    <StudioRenderer
      data={content}
      themeSettings={themeSettings as Record<string, unknown> | null}
      siteId={siteId}
      pageId={pageId}
      className={className}
    />
  );
}

// Re-export StudioRenderer for migration convenience
export { StudioRenderer };

// Export aliases for backward compatibility
export { PuckSiteRenderer as CraftRenderer };
export { PuckSiteRenderer as PublishedSiteRenderer };
