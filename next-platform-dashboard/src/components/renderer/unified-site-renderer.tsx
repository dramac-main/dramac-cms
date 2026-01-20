"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";
import { ThemeSettings } from "@/lib/renderer/theme";

interface UnifiedSiteRendererProps {
  content: string | null;
  themeSettings?: ThemeSettings | null;
  siteId: string;
  pageId: string;
}

/**
 * UnifiedSiteRenderer - Uses the EXACT SAME Craft.js components as the editor
 * 
 * CRITICAL: This is the solution to the preview vs published rendering mismatch.
 * 
 * Previously, published sites used a completely different set of render components
 * (src/components/renderer/components/*) which had:
 * - Different styling
 * - Missing props
 * - Broken responsive design
 * - Missing features (mobile menu, icons, etc.)
 * 
 * Now, published sites use the SAME components as the editor/preview:
 * - Craft.js Editor with enabled={false} (read-only mode)
 * - Same user-components from src/components/editor/user-components/*
 * - 100% visual parity guaranteed
 */
export function UnifiedSiteRenderer({ 
  content, 
  themeSettings,
  siteId,
  pageId 
}: UnifiedSiteRendererProps) {
  // Generate CSS custom properties from theme settings
  const themeVars: Record<string, string> = {};
  if (themeSettings) {
    const settings = themeSettings as Record<string, string>;
    if (settings.primaryColor) {
      themeVars["--theme-primary"] = settings.primaryColor;
      themeVars["--primary"] = settings.primaryColor;
    }
    if (settings.secondaryColor) {
      themeVars["--theme-secondary"] = settings.secondaryColor;
    }
    if (settings.accentColor) {
      themeVars["--theme-accent"] = settings.accentColor;
    }
    if (settings.fontFamily) {
      themeVars["--theme-font-family"] = settings.fontFamily;
    }
    if (settings.headingFont) {
      themeVars["--theme-heading-font"] = settings.headingFont;
    }
    if (settings.backgroundColor) {
      themeVars["--theme-background"] = settings.backgroundColor;
    }
    if (settings.textColor) {
      themeVars["--theme-text"] = settings.textColor;
    }
  }

  // Handle missing or empty content
  if (!content || content === '{}' || content === 'null') {
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

  // Parse content if it's a string that looks like JSON
  let parsedContent = content;
  if (typeof content === 'string') {
    try {
      // Check if it's valid JSON by parsing it
      const parsed = JSON.parse(content);
      // If it has ROOT, it's valid Craft.js JSON
      if (parsed && parsed.ROOT) {
        parsedContent = content; // Keep as string for Craft.js
      }
    } catch {
      // If it can't be parsed, it might already be in the right format
      // or it's invalid - Craft.js will handle the error
    }
  }

  return (
    <div
      className="min-h-screen bg-white site-content"
      style={themeVars as React.CSSProperties}
      data-site-id={siteId}
      data-page-id={pageId}
    >
      <Editor
        resolver={componentResolver}
        enabled={false}
        onRender={({ render }) => render}
      >
        <Frame data={parsedContent}>
          <Element is={Root} canvas />
        </Frame>
      </Editor>
    </div>
  );
}
