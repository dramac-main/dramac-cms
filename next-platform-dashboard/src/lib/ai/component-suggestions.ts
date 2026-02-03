/**
 * Component Suggestions Service
 * 
 * AI service for suggesting components based on page context.
 * Part of PHASE-ED-05B: AI Editor - Custom Generation
 * 
 * @phase STUDIO-27 - Updated to use standalone types
 */

import { anthropic, AI_MODELS } from "./config";
import type { PuckData } from "@/types/puck";

// ============================================
// Types
// ============================================

export interface PageContext {
  title?: string;
  description?: string;
  industry?: string;
  targetAudience?: string;
  existingContent?: string[];
  existingComponents?: string[];
}

export interface ComponentSuggestion {
  id: string;
  type: "addition" | "improvement" | "alternative" | "reorganization";
  component: string;
  title: string;
  description: string;
  reasoning: string;
  priority: "high" | "medium" | "low";
  position?: "before" | "after" | "replace";
  targetComponent?: string;
}

export interface SuggestionResult {
  success: boolean;
  suggestions?: ComponentSuggestion[];
  error?: string;
}

// ============================================
// Component Catalog (for suggestions)
// ============================================

export const COMPONENT_CATALOG = {
  Hero: {
    description: "Large banner section with title, subtitle, and call-to-action",
    bestFor: ["landing pages", "home pages", "product pages"],
    usualPosition: "top",
  },
  Features: {
    description: "Grid of feature highlights with icons",
    bestFor: ["product pages", "service pages", "landing pages"],
    usualPosition: "after hero",
  },
  Testimonials: {
    description: "Customer quotes and reviews",
    bestFor: ["landing pages", "service pages", "product pages"],
    usualPosition: "middle to bottom",
  },
  CTA: {
    description: "Call-to-action section with button",
    bestFor: ["landing pages", "end of sections", "conversion focus"],
    usualPosition: "bottom or between sections",
  },
  FAQ: {
    description: "Frequently asked questions accordion",
    bestFor: ["product pages", "service pages", "support pages"],
    usualPosition: "bottom half",
  },
  Stats: {
    description: "Number statistics and metrics display",
    bestFor: ["about pages", "landing pages", "case studies"],
    usualPosition: "after features or testimonials",
  },
  Team: {
    description: "Team member profiles with photos",
    bestFor: ["about pages", "company pages", "professional services"],
    usualPosition: "middle",
  },
  Gallery: {
    description: "Image gallery or portfolio grid",
    bestFor: ["portfolio", "product showcase", "visual content"],
    usualPosition: "middle",
  },
  Pricing: {
    description: "Pricing plans comparison table",
    bestFor: ["SaaS", "service pricing", "subscription products"],
    usualPosition: "middle to bottom",
  },
  ContactForm: {
    description: "Contact form with fields",
    bestFor: ["contact pages", "landing pages", "lead generation"],
    usualPosition: "bottom",
  },
  Newsletter: {
    description: "Email signup form",
    bestFor: ["blogs", "content sites", "e-commerce"],
    usualPosition: "bottom",
  },
  LogoCloud: {
    description: "Partner or client logos display",
    bestFor: ["landing pages", "about pages", "B2B sites"],
    usualPosition: "after hero or testimonials",
  },
  Video: {
    description: "Video player or embed",
    bestFor: ["product demos", "explainers", "testimonials"],
    usualPosition: "varies",
  },
} as const;

// ============================================
// Suggestion Generation
// ============================================

function buildSuggestionPrompt(context: PageContext, puckData?: PuckData): string {
  const existingComponents = puckData?.content?.map((c) => c.type) || context.existingComponents || [];
  
  return `Analyze this page and suggest improvements.

PAGE CONTEXT:
Title: ${context.title || "Not set"}
Description: ${context.description || "Not set"}
Industry: ${context.industry || "General"}
Target Audience: ${context.targetAudience || "General"}

EXISTING COMPONENTS ON PAGE:
${existingComponents.length > 0 ? existingComponents.join(", ") : "None yet"}

AVAILABLE COMPONENTS:
${Object.entries(COMPONENT_CATALOG)
  .map(([name, info]) => `- ${name}: ${info.description}`)
  .join("\n")}

TASK:
Suggest 3-5 improvements or additions to enhance this page. Consider:
1. Missing components that would help achieve the page's goal
2. Better ordering/organization of existing components
3. Components that would increase engagement or conversions
4. Components commonly used together that are missing

OUTPUT FORMAT (JSON array):
[
  {
    "component": "ComponentName",
    "type": "addition" | "improvement" | "alternative" | "reorganization",
    "title": "Short title for suggestion",
    "description": "What this suggestion does",
    "reasoning": "Why this would help",
    "priority": "high" | "medium" | "low",
    "position": "before" | "after" | "replace",
    "targetComponent": "ExistingComponentName" (optional, for positioning)
  }
]

Return ONLY the JSON array:`;
}

export async function getSuggestions(
  context: PageContext,
  puckData?: PuckData
): Promise<SuggestionResult> {
  try {
    const prompt = buildSuggestionPrompt(context, puckData);

    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku, // Use faster model for suggestions
      max_tokens: 1500,
      temperature: 0.5,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { success: false, error: "No response from AI" };
    }

    // Parse JSON
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { success: false, error: "No valid suggestions found" };
    }

    const suggestions = JSON.parse(jsonMatch[0]) as Omit<ComponentSuggestion, "id">[];
    
    // Add IDs to suggestions
    const suggestionsWithIds: ComponentSuggestion[] = suggestions.map((s, i) => ({
      ...s,
      id: `suggestion-${Date.now()}-${i}`,
    }));

    return { success: true, suggestions: suggestionsWithIds };
  } catch (error) {
    console.error("Suggestion generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate suggestions",
    };
  }
}

// ============================================
// Component Compatibility Check
// ============================================

export interface CompatibilityResult {
  isCompatible: boolean;
  warnings: string[];
  suggestions: string[];
}

export function checkComponentCompatibility(
  newComponent: string,
  existingComponents: string[]
): CompatibilityResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for duplicates
  if (existingComponents.includes(newComponent)) {
    warnings.push(`Page already has a ${newComponent} component`);
  }

  // Check for common patterns
  const catalog = COMPONENT_CATALOG[newComponent as keyof typeof COMPONENT_CATALOG];
  if (catalog) {
    // Position suggestions
    if (catalog.usualPosition === "top" && existingComponents.length > 0) {
      suggestions.push(`${newComponent} is typically placed at the top of the page`);
    }

    // Complementary components
    if (newComponent === "Pricing" && !existingComponents.includes("FAQ")) {
      suggestions.push("Consider adding an FAQ section to address pricing questions");
    }

    if (newComponent === "Hero" && !existingComponents.includes("CTA")) {
      suggestions.push("A Hero section pairs well with a CTA section later on the page");
    }

    if (newComponent === "Features" && !existingComponents.includes("Testimonials")) {
      suggestions.push("Adding Testimonials can reinforce your feature claims");
    }
  }

  return {
    isCompatible: warnings.length === 0,
    warnings,
    suggestions,
  };
}

// ============================================
// Section Order Recommendation
// ============================================

const IDEAL_ORDER = [
  "Navbar",
  "Hero",
  "LogoCloud",
  "Features",
  "Stats",
  "Gallery",
  "Video",
  "Testimonials",
  "Team",
  "Pricing",
  "FAQ",
  "CTA",
  "ContactForm",
  "Newsletter",
  "Footer",
];

export function getRecommendedOrder(components: string[]): string[] {
  return [...components].sort((a, b) => {
    const indexA = IDEAL_ORDER.indexOf(a);
    const indexB = IDEAL_ORDER.indexOf(b);
    
    // Unknown components go to the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

export function getOrderSuggestions(
  currentOrder: string[]
): { current: string; suggested: string; reason: string }[] {
  const suggestions: { current: string; suggested: string; reason: string }[] = [];
  const recommendedOrder = getRecommendedOrder(currentOrder);

  for (let i = 0; i < currentOrder.length; i++) {
    if (currentOrder[i] !== recommendedOrder[i]) {
      const component = currentOrder[i];
      const currentIndex = i;
      const recommendedIndex = recommendedOrder.indexOf(component);
      
      if (recommendedIndex < currentIndex) {
        suggestions.push({
          current: component,
          suggested: `Move ${component} higher`,
          reason: `${component} typically appears earlier on pages for better user flow`,
        });
      } else if (recommendedIndex > currentIndex) {
        suggestions.push({
          current: component,
          suggested: `Move ${component} lower`,
          reason: `${component} typically appears later on pages to build toward conversion`,
        });
      }
    }
  }

  return suggestions;
}

// ============================================
// Quick Component Suggestions by Page Type
// ============================================

export type PageType = "landing" | "about" | "services" | "product" | "contact" | "blog";

export function getQuickSuggestions(
  pageType: PageType,
  existingComponents: string[]
): string[] {
  const suggestionsByType: Record<PageType, string[]> = {
    landing: ["Hero", "Features", "Testimonials", "CTA", "FAQ", "Footer"],
    about: ["Hero", "Team", "Stats", "Testimonials", "ContactForm", "Footer"],
    services: ["Hero", "Features", "Pricing", "FAQ", "CTA", "ContactForm", "Footer"],
    product: ["Hero", "Features", "Gallery", "Testimonials", "Pricing", "FAQ", "CTA", "Footer"],
    contact: ["Hero", "ContactForm", "FAQ", "Footer"],
    blog: ["Navbar", "Hero", "Newsletter", "Footer"],
  };

  const suggestions = suggestionsByType[pageType] || [];
  return suggestions.filter((s) => !existingComponents.includes(s));
}
