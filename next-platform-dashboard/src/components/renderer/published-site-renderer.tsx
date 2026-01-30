"use client";

/**
 * PublishedSiteRenderer - Site rendering using Puck
 * 
 * This is a re-export of PuckSiteRenderer for backward compatibility.
 * All sites now render using Puck instead of Craft.js.
 */

import { PuckSiteRenderer } from "./puck-site-renderer";
import type { ThemeSettings } from "@/lib/renderer/theme";

interface PublishedSiteRendererProps {
  /** Serialized content JSON string or object */
  content: string;
  /** Site theme settings */
  themeSettings?: ThemeSettings | null;
  /** Site ID for tracking */
  siteId?: string;
  /** Page ID for tracking */
  pageId?: string;
}

export function PublishedSiteRenderer({
  content,
  themeSettings,
  siteId,
  pageId,
}: PublishedSiteRendererProps) {
  return (
    <PuckSiteRenderer
      content={content}
      themeSettings={themeSettings}
      siteId={siteId}
      pageId={pageId}
    />
  );
}
