export type RegenerationMode =
  | "rewrite"      // Complete rewrite, same structure
  | "improve"      // Improve existing content quality
  | "expand"       // Add more content/detail
  | "simplify"     // Make simpler/shorter
  | "professional" // More formal/professional tone
  | "casual"       // More friendly/casual tone
  | "seo"          // Optimize for search engines
  | "custom";      // User-provided instructions

export interface RegenerationOptions {
  mode: RegenerationMode;
  customInstructions?: string;
  preserveStructure?: boolean;
  preserveImages?: boolean;
  targetLength?: "shorter" | "same" | "longer";
  keywords?: string[];
}

export interface SectionContent {
  type: string;
  text?: string;
  heading?: string;
  items?: string[];
  props?: Record<string, unknown>;
}

export interface RegenerationResult {
  success: boolean;
  content?: SectionContent;
  error?: string;
  tokensUsed?: number;
}

export interface RegenerationContext {
  businessName?: string;
  industry?: string;
}

export const MODE_LABELS: Record<RegenerationMode, string> = {
  rewrite: "Rewrite",
  improve: "Improve",
  expand: "Expand",
  simplify: "Simplify",
  professional: "Professional",
  casual: "Casual",
  seo: "SEO Optimize",
  custom: "Custom",
};

export const MODE_DESCRIPTIONS: Record<RegenerationMode, string> = {
  rewrite: "Completely rewrite content while keeping the same message",
  improve: "Enhance quality with better wording and flow",
  expand: "Add more detail and supporting information",
  simplify: "Make it shorter and easier to understand",
  professional: "Use formal, business-appropriate tone",
  casual: "Use friendly, conversational tone",
  seo: "Optimize for search engines while keeping readability",
  custom: "Provide your own instructions",
};
