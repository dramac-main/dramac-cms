"use client";

/**
 * PuckSiteRenderer - Unified site rendering using Puck
 * 
 * This component renders published sites and previews using Puck:
 * - Uses Puck's Render component for read-only rendering
 * - Handles both Puck and legacy Craft.js content formats
 * - Automatically migrates old content to Puck format
 * 
 * Replaces: CraftRenderer, PublishedSiteRenderer
 */

import { Render } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "@/components/editor/puck/puck-config";
import { detectContentFormat, migrateCraftToPuck, isPuckFormat } from "@/lib/migration/craft-to-puck";
import type { PuckData } from "@/types/puck";
import type { ThemeSettings } from "@/lib/renderer/theme";

interface PuckSiteRendererProps {
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
 * Convert content to Puck format, handling both Puck and Craft.js formats
 */
function convertContentToPuck(content: string | Record<string, unknown>): PuckData {
  const emptyData: PuckData = { content: [], root: { props: { title: "" } } };
  
  try {
    // Parse if string
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    
    // Check for empty content
    if (!parsed || Object.keys(parsed).length === 0) {
      return emptyData;
    }
    
    // Already Puck format
    if (isPuckFormat(parsed)) {
      return parsed as PuckData;
    }
    
    // Try to migrate from Craft.js
    const detection = detectContentFormat(parsed);
    if (detection.format === "craft") {
      const migrationResult = migrateCraftToPuck(parsed);
      if (migrationResult.success && migrationResult.data) {
        return migrationResult.data;
      }
      console.warn("[PuckSiteRenderer] Migration failed:", migrationResult.errors);
    }
    
    return emptyData;
  } catch (error) {
    console.error("[PuckSiteRenderer] Failed to parse content:", error);
    return emptyData;
  }
}

export function PuckSiteRenderer({
  content,
  themeSettings,
  siteId,
  pageId,
  className = "",
}: PuckSiteRendererProps) {
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
    if (settings.backgroundColor) {
      themeVars["--theme-background"] = settings.backgroundColor;
    }
    if (settings.foregroundColor) {
      themeVars["--theme-text"] = settings.foregroundColor;
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

  // Convert to Puck format
  const puckData = convertContentToPuck(content);

  return (
    <div
      className={`min-h-screen bg-white published-site puck-preview ${className}`}
      style={themeVars as React.CSSProperties}
      data-site-id={siteId}
      data-page-id={pageId}
    >
      <Render config={puckConfig} data={puckData} />
    </div>
  );
}

// Export CraftRenderer as alias for backward compatibility
export { PuckSiteRenderer as CraftRenderer };
export { PuckSiteRenderer as PublishedSiteRenderer };
