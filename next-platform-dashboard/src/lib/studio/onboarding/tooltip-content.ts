/**
 * DRAMAC Studio Tooltip Content
 * 
 * Tooltip text for UI elements throughout the editor.
 * 
 * @phase STUDIO-26
 */

// =============================================================================
// TOOLTIP CONTENT MAP
// =============================================================================

/**
 * Tooltip content for UI elements.
 * Key is a data-tooltip attribute value.
 */
export const TOOLTIP_CONTENT: Record<string, string> = {
  // Panels
  "component-library": "Drag components from here to your page",
  "properties-panel": "Edit the selected component here",
  "layers-panel": "View and reorder page structure",
  "history-panel": "View change history and restore versions",

  // Responsive
  "responsive-mobile": "Preview how your page looks on mobile (320px)",
  "responsive-tablet": "Preview how your page looks on tablet (768px)",
  "responsive-desktop": "Preview how your page looks on desktop (1024px+)",
  "device-selector": "Choose a device to preview",
  "orientation-toggle": "Switch between portrait and landscape",

  // Zoom
  "zoom-in": "Zoom in (Ctrl +)",
  "zoom-out": "Zoom out (Ctrl -)",
  "zoom-fit": "Fit canvas to screen (Ctrl 0)",
  "zoom-100": "Reset to 100% zoom (Ctrl 1)",

  // Actions
  "undo-button": "Undo last action (Ctrl+Z)",
  "redo-button": "Redo last action (Ctrl+Shift+Z)",
  "save-button": "Save your page (Ctrl+S)",
  "preview-button": "Open page preview in new tab",
  "publish-button": "Publish your page live",

  // Features
  "ai-button": "Ask AI to help edit this component",
  "template-button": "Insert a pre-designed section",
  "symbols-button": "View and insert reusable symbols",
  "settings-button": "Page settings (title, SEO, etc.)",

  // Component actions
  "component-duplicate": "Duplicate this component (Ctrl+D)",
  "component-delete": "Delete this component (Del)",
  "component-copy": "Copy this component (Ctrl+C)",
  "component-paste": "Paste copied component (Ctrl+V)",
  "component-lock": "Lock/unlock this component",
  "component-hide": "Show/hide this component",

  // Layers
  "layer-visibility": "Toggle visibility",
  "layer-lock": "Toggle lock (prevent editing)",
  "layer-expand": "Expand/collapse children",

  // Misc
  "command-palette": "Open command palette (Ctrl+K)",
  "shortcuts-help": "View keyboard shortcuts (?)",
  "whats-new": "See what's new in DRAMAC Studio",
  "help-panel": "Get help and resources",
};

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Get tooltip content for a key
 */
export function getTooltipContent(key: string): string | null {
  return TOOLTIP_CONTENT[key] || null;
}

/**
 * Check if a tooltip exists for a key
 */
export function hasTooltip(key: string): boolean {
  return key in TOOLTIP_CONTENT;
}
