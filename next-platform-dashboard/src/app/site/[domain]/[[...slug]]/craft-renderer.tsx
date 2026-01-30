"use client";

/**
 * Site Renderer using Puck
 * 
 * Receives pre-fetched data from server component and renders using Puck.
 * Backward compatible - still exported as CraftRenderer for existing imports.
 */

import { PuckSiteRenderer } from "@/components/renderer/puck-site-renderer";

interface CraftRendererProps {
  content: string;
  themeSettings: Record<string, unknown> | null;
}

export function CraftRenderer({ content, themeSettings }: CraftRendererProps) {
  return (
    <PuckSiteRenderer 
      content={content} 
      themeSettings={themeSettings}
    />
  );
}
