"use client";

/**
 * Site Renderer using DRAMAC Studio
 * 
 * Receives pre-fetched data from server component and renders using StudioRenderer.
 * Supports module components when modules are installed for the site.
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 */

import { StudioRenderer } from "@/lib/studio/engine/renderer";
import type { InstalledModuleInfo } from "@/types/studio-module";

interface CraftRendererProps {
  content: string;
  themeSettings: Record<string, unknown> | null;
  siteId?: string;
  pageId?: string;
  modules?: InstalledModuleInfo[];
}

export function CraftRenderer({ 
  content, 
  themeSettings,
  siteId,
  pageId,
  modules,
}: CraftRendererProps) {
  return (
    <StudioRenderer 
      data={content} 
      themeSettings={themeSettings}
      siteId={siteId}
      pageId={pageId}
      modules={modules}
    />
  );
}
