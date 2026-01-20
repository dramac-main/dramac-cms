"use client";

/**
 * Client Component for Craft.js Rendering
 * 
 * Receives pre-fetched data from server component and renders using Craft.js.
 * Editor is disabled (enabled={false}) for read-only published view.
 */

import { Editor, Frame, Element } from "@craftjs/core";
import { componentResolver } from "@/components/editor/resolver";
import { Root } from "@/components/editor/user-components/root";

interface CraftRendererProps {
  content: string;
  themeSettings: Record<string, unknown> | null;
}

export function CraftRenderer({ content, themeSettings }: CraftRendererProps) {
  // Apply theme settings as CSS custom properties
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

  return (
    <div
      className="min-h-screen bg-white"
      style={themeVars as React.CSSProperties}
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
