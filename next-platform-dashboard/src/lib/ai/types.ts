// Craft.js node structure types
export interface CraftNode {
  type: {
    resolvedName: string;
  };
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName?: string;
  custom?: Record<string, unknown>;
  parent?: string;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
}

export interface CraftState {
  ROOT: CraftNode;
  [nodeId: string]: CraftNode;
}

// AI Generated types
export interface AISection {
  type: string;
  props: Record<string, unknown>;
}

export interface AIWebsiteContent {
  metadata: {
    title: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  sections: AISection[];
}
