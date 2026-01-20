"use client";

/**
 * PublishedSiteRenderer - Industry-standard site rendering using Craft.js
 * 
 * This component renders published sites using the EXACT same approach as the preview:
 * - Client-side Craft.js Editor with enabled={false}
 * - Uses the same componentResolver as the editor
 * - 100% visual parity guaranteed
 * 
 * Architecture:
 * 1. Server fetches page data and passes it as props
 * 2. This client component renders using Craft.js
 * 3. All editor components work identically in read-only mode
 */

import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";
import type { ThemeSettings } from "@/lib/renderer/theme";

interface PublishedSiteRendererProps {
  /** Serialized Craft.js content JSON string */
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
  // Generate CSS custom properties from theme settings
  const themeVars: Record<string, string> = {};
  
  if (themeSettings) {
    if (themeSettings.primaryColor) {
      themeVars["--theme-primary"] = themeSettings.primaryColor;
      themeVars["--primary"] = themeSettings.primaryColor;
    }
    if (themeSettings.secondaryColor) {
      themeVars["--theme-secondary"] = themeSettings.secondaryColor;
    }
    if (themeSettings.accentColor) {
      themeVars["--theme-accent"] = themeSettings.accentColor;
    }
    if (themeSettings.fontFamily) {
      themeVars["--theme-font-family"] = themeSettings.fontFamily;
    }
    if (themeSettings.backgroundColor) {
      themeVars["--theme-background"] = themeSettings.backgroundColor;
    }
    if (themeSettings.foregroundColor) {
      themeVars["--theme-text"] = themeSettings.foregroundColor;
    }
  }

  // Handle empty or invalid content
  if (!content || content === '{}' || content === 'null' || content === '""') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
        data-site-id={siteId}
        data-page-id={pageId}
      >
        <div className="text-center text-gray-500 p-8">
          <svg 
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h1 className="text-xl font-semibold mb-2">Page Coming Soon</h1>
          <p className="text-sm">This page is being built and will be available shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white published-site"
      style={themeVars as React.CSSProperties}
      data-site-id={siteId}
      data-page-id={pageId}
    >
      <Editor
        resolver={componentResolver}
        enabled={false}
        onRender={({ render }) => render}
      >
        <Frame data={content}>
          <Element is={Root} canvas />
        </Frame>
      </Editor>
    </div>
  );
}
