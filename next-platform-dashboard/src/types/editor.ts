import type { Node, SerializedNodes } from "@craftjs/core";

export interface EditorComponent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  defaultProps: Record<string, unknown>;
}

export type ComponentCategory =
  | "layout"
  | "typography"
  | "media"
  | "buttons"
  | "forms"
  | "sections"
  | "navigation";

export interface EditorState {
  nodes: SerializedNodes;
  selectedNodeId: string | null;
  isDragging: boolean;
  isEditing: boolean;
}

export interface CanvasSettings {
  width: "mobile" | "tablet" | "desktop" | "full";
  showGrid: boolean;
  showOutlines: boolean;
}

export const CANVAS_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
  full: "100%",
} as const;
