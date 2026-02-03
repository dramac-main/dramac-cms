# PHASE-STUDIO-30: Component Superpowers

## 🎯 Phase Overview

**Wave**: 12 - Award-Winning Features  
**Phase**: 30 of 31  
**Priority**: 🟣 FEATURE  
**Estimated Time**: 16-20 hours  
**Dependencies**: Wave 11 Complete (Phases 28-29)

---

## 📋 Mission

Transform the component system into a powerhouse with:
- Enhanced AI configurations per component
- Universal props system (animation, hover, visibility)
- Unified render wrapper with smart features
- AI quick actions integration in properties panel
- Context-aware AI suggestions
- Component cloning and variation system

---

## 🚀 Feature Overview

### Feature Set

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | Enhanced AI Configs | Rich AI metadata per component | 🟣 P0 |
| F2 | Universal Props | Animation, hover, visibility on all | 🟣 P0 |
| F3 | Render Wrapper | Smart wrapper with all features | 🟣 P0 |
| F4 | Quick Actions Panel | AI actions in properties panel | 🟣 P1 |
| F5 | Context Suggestions | Smart AI suggestions | 🟣 P1 |
| F6 | Component Variations | Clone and create variants | 🟣 P2 |

---

## 🔧 Implementation Tasks

### Task 30.1: Enhanced AI Configurations

**Purpose**: Rich AI metadata enabling intelligent component modification.

**File**: `src/lib/studio/registry/ai-configs.ts`

```typescript
/**
 * DRAMAC Studio - Enhanced AI Component Configurations
 * 
 * Provides rich AI metadata for intelligent component modification.
 */

import { ComponentType } from "./core-components";

// AI capability levels
export type AICapabilityLevel = "basic" | "standard" | "advanced" | "expert";

// AI action types
export type AIActionType = 
  | "text-improvement" 
  | "style-change" 
  | "layout-adjust" 
  | "content-generate"
  | "responsive-fix"
  | "accessibility-fix"
  | "seo-optimize"
  | "animation-add";

// AI configuration interface
export interface AIComponentConfig {
  // Basic metadata
  description: string;
  category: "layout" | "content" | "interactive" | "media" | "navigation";
  capability: AICapabilityLevel;
  
  // Modification capabilities
  canModify: {
    props: string[];          // Which props AI can change
    styles: string[];         // Which style properties
    content: string[];        // Which content fields
    layout: boolean;          // Can modify layout/structure
    children: boolean;        // Can modify child components
  };
  
  // Available AI actions
  actions: AIActionConfig[];
  
  // Smart suggestions based on context
  suggestions: AISuggestion[];
  
  // Prompt enhancement
  promptContext: {
    roleHint: string;         // What role this component plays
    bestPractices: string[];  // Tips for AI to follow
    avoidPatterns: string[];  // What not to do
  };
  
  // Generation templates
  templates: AIGenerationTemplate[];
}

export interface AIActionConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  type: AIActionType;
  prompt: string;            // Base prompt for this action
  affectedProps: string[];   // Props this action modifies
  requiresSelection?: boolean;
}

export interface AISuggestion {
  condition: (props: Record<string, any>) => boolean;
  message: string;
  action?: string;           // Action ID to trigger
}

export interface AIGenerationTemplate {
  id: string;
  name: string;
  description: string;
  props: Record<string, any>;
}

// ============================================
// AI CONFIGURATIONS BY COMPONENT TYPE
// ============================================

export const AI_COMPONENT_CONFIGS: Record<ComponentType, AIComponentConfig> = {
  // ----------------------------------------
  // SECTION COMPONENTS
  // ----------------------------------------
  
  Hero: {
    description: "A hero section that creates the first impression - supports video backgrounds, split layouts, and animations",
    category: "content",
    capability: "expert",
    canModify: {
      props: ["title", "subtitle", "buttonText", "buttonLink", "layout", "backgroundType", "backgroundColor", "gradientFrom", "gradientTo", "backgroundVideo", "animation", "alignment", "textColor", "overlay", "overlayOpacity"],
      styles: ["minHeight", "textColor", "backgroundColor"],
      content: ["title", "subtitle", "buttonText"],
      layout: true,
      children: false,
    },
    actions: [
      {
        id: "improve-hero-text",
        label: "Improve Headlines",
        icon: "✨",
        description: "Make the title and subtitle more compelling",
        type: "text-improvement",
        prompt: "Improve this hero section's title and subtitle to be more compelling and conversion-focused while keeping the same meaning. Make it punchy and memorable.",
        affectedProps: ["title", "subtitle"],
      },
      {
        id: "hero-add-video",
        label: "Add Video Background",
        icon: "🎬",
        description: "Set up for video background",
        type: "style-change",
        prompt: "Configure this hero for a video background with an appropriate dark overlay for text readability",
        affectedProps: ["backgroundType", "overlay", "overlayOpacity", "textColor"],
      },
      {
        id: "hero-split-layout",
        label: "Use Split Layout",
        icon: "📐",
        description: "Change to split layout with image",
        type: "layout-adjust",
        prompt: "Convert this hero to use a split layout with content on one side and image on the other",
        affectedProps: ["layout", "splitImagePosition", "alignment"],
      },
      {
        id: "hero-make-bold",
        label: "Make Bold & Dramatic",
        icon: "💪",
        description: "Increase impact with bold styling",
        type: "style-change",
        prompt: "Make this hero section more bold and dramatic with larger text, stronger contrast, and full viewport height",
        affectedProps: ["titleSize", "fullHeight", "textColor", "backgroundColor"],
      },
    ],
    suggestions: [
      {
        condition: (props) => !props.subtitle,
        message: "Add a subtitle to support your headline",
        action: "improve-hero-text",
      },
      {
        condition: (props) => props.backgroundType === "color" && !props.backgroundColor,
        message: "Consider adding a gradient or image background",
      },
      {
        condition: (props) => !props.buttonText,
        message: "Add a call-to-action button to drive conversions",
      },
    ],
    promptContext: {
      roleHint: "The hero is the first thing visitors see - it should immediately communicate value and encourage scrolling or action",
      bestPractices: [
        "Keep headlines under 10 words",
        "Use action-oriented button text",
        "Ensure high contrast for readability",
        "Consider adding social proof nearby",
      ],
      avoidPatterns: [
        "Generic 'Welcome to our website' headlines",
        "Too many call-to-action buttons",
        "Low contrast text on busy backgrounds",
      ],
    },
    templates: [
      {
        id: "startup-hero",
        name: "Startup Hero",
        description: "Bold gradient with centered content",
        props: {
          title: "Build Something Amazing",
          subtitle: "The fastest way to launch your next big idea",
          buttonText: "Get Started Free",
          backgroundType: "gradient",
          gradientFrom: "#667eea",
          gradientTo: "#764ba2",
          layout: "centered",
          animation: "fade-up",
        },
      },
      {
        id: "agency-hero",
        name: "Agency Hero",
        description: "Split layout with image",
        props: {
          title: "Creative Agency",
          subtitle: "We craft digital experiences that inspire",
          buttonText: "View Our Work",
          layout: "split-right",
          backgroundColor: "#111827",
          textColor: "#ffffff",
        },
      },
    ],
  },
  
  Features: {
    description: "A features section showing product/service capabilities in a grid or list format",
    category: "content",
    capability: "advanced",
    canModify: {
      props: ["title", "subtitle", "features", "layout", "columns", "showIcons", "iconStyle"],
      styles: ["backgroundColor", "textColor"],
      content: ["title", "subtitle", "features"],
      layout: true,
      children: false,
    },
    actions: [
      {
        id: "improve-features",
        label: "Improve Feature Text",
        icon: "✨",
        description: "Enhance feature titles and descriptions",
        type: "text-improvement",
        prompt: "Improve all feature titles and descriptions to be more benefit-focused and compelling",
        affectedProps: ["features"],
      },
      {
        id: "add-more-features",
        label: "Add More Features",
        icon: "➕",
        description: "Generate additional features",
        type: "content-generate",
        prompt: "Generate 2-3 additional features that would complement the existing ones",
        affectedProps: ["features"],
      },
      {
        id: "change-layout",
        label: "Change Layout",
        icon: "📐",
        description: "Switch between grid layouts",
        type: "layout-adjust",
        prompt: "Suggest a better layout based on the number of features",
        affectedProps: ["layout", "columns"],
      },
    ],
    suggestions: [
      {
        condition: (props) => (props.features?.length || 0) < 3,
        message: "Add more features for a balanced layout",
        action: "add-more-features",
      },
      {
        condition: (props) => props.features?.some((f: any) => !f.description),
        message: "Add descriptions to all features",
      },
    ],
    promptContext: {
      roleHint: "Features sections convince visitors of product value through clear benefits",
      bestPractices: [
        "Focus on benefits, not just features",
        "Use consistent formatting across all features",
        "Include icons for visual scanning",
        "Keep descriptions concise (1-2 sentences)",
      ],
      avoidPatterns: [
        "Technical jargon without context",
        "Walls of text",
        "Inconsistent icon styles",
      ],
    },
    templates: [],
  },
  
  // ... Additional component configs follow same pattern
  
  Card: {
    description: "A versatile card component for displaying content with image, title, and description",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["title", "description", "image", "link", "variant", "hover"],
      styles: ["backgroundColor", "borderRadius"],
      content: ["title", "description"],
      layout: false,
      children: true,
    },
    actions: [
      {
        id: "improve-card-text",
        label: "Improve Text",
        icon: "✨",
        description: "Make title and description more engaging",
        type: "text-improvement",
        prompt: "Improve the card's title and description to be more engaging and clear",
        affectedProps: ["title", "description"],
      },
      {
        id: "add-hover-effect",
        label: "Add Hover Effect",
        icon: "👆",
        description: "Add an interactive hover effect",
        type: "style-change",
        prompt: "Add an appropriate hover effect to this card",
        affectedProps: ["hover"],
      },
    ],
    suggestions: [
      {
        condition: (props) => !props.image,
        message: "Consider adding an image for visual appeal",
      },
      {
        condition: (props) => !props.hover || props.hover === "none",
        message: "Add a hover effect for interactivity",
        action: "add-hover-effect",
      },
    ],
    promptContext: {
      roleHint: "Cards organize content into digestible chunks and can be clickable",
      bestPractices: [
        "Keep titles short (3-5 words)",
        "Use high-quality images",
        "Make the entire card clickable if it has a link",
      ],
      avoidPatterns: [
        "Overcrowding with too much content",
        "Missing alt text for images",
      ],
    },
    templates: [],
  },
  
  Button: {
    description: "An interactive button component for calls to action",
    category: "interactive",
    capability: "basic",
    canModify: {
      props: ["label", "link", "variant", "size", "icon"],
      styles: ["backgroundColor", "textColor", "borderRadius"],
      content: ["label"],
      layout: false,
      children: false,
    },
    actions: [
      {
        id: "improve-button-text",
        label: "Improve CTA",
        icon: "✨",
        description: "Make the button text more action-oriented",
        type: "text-improvement",
        prompt: "Improve this button's label to be more action-oriented and compelling. Use verbs and create urgency.",
        affectedProps: ["label"],
      },
    ],
    suggestions: [
      {
        condition: (props) => props.label?.toLowerCase() === "click here",
        message: "Use more descriptive button text",
        action: "improve-button-text",
      },
      {
        condition: (props) => !props.link,
        message: "Add a link to make the button functional",
      },
    ],
    promptContext: {
      roleHint: "Buttons drive user action - they should clearly communicate what happens when clicked",
      bestPractices: [
        "Use action verbs (Get, Start, Download, Learn)",
        "Keep text short (2-4 words)",
        "Make primary actions visually prominent",
      ],
      avoidPatterns: [
        "Vague text like 'Click Here' or 'Submit'",
        "Too many buttons competing for attention",
      ],
    },
    templates: [],
  },
  
  // Define minimal configs for remaining components
  Section: {
    description: "A layout section container",
    category: "layout",
    capability: "basic",
    canModify: { props: ["backgroundColor", "padding"], styles: ["backgroundColor"], content: [], layout: true, children: true },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Sections organize page content", bestPractices: [], avoidPatterns: [] },
    templates: [],
  },
  
  Container: {
    description: "A container with max-width for content",
    category: "layout",
    capability: "basic",
    canModify: { props: ["maxWidth", "padding"], styles: [], content: [], layout: true, children: true },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Containers constrain content width", bestPractices: [], avoidPatterns: [] },
    templates: [],
  },
  
  Columns: {
    description: "A multi-column responsive layout",
    category: "layout",
    capability: "standard",
    canModify: { props: ["columns", "gap"], styles: [], content: [], layout: true, children: true },
    actions: [
      {
        id: "adjust-columns",
        label: "Adjust Columns",
        icon: "📐",
        description: "Change column layout",
        type: "layout-adjust",
        prompt: "Suggest optimal column configuration for the content",
        affectedProps: ["columns", "gap"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "Columns create side-by-side layouts", bestPractices: ["Use 2-4 columns", "Ensure mobile responsiveness"], avoidPatterns: ["Too many columns on mobile"] },
    templates: [],
  },
  
  Text: {
    description: "A text block component",
    category: "content",
    capability: "standard",
    canModify: { props: ["content", "variant", "alignment"], styles: ["color"], content: ["content"], layout: false, children: false },
    actions: [
      {
        id: "improve-text",
        label: "Improve Writing",
        icon: "✨",
        description: "Enhance text quality",
        type: "text-improvement",
        prompt: "Improve this text to be clearer and more engaging",
        affectedProps: ["content"],
      },
      {
        id: "make-concise",
        label: "Make Concise",
        icon: "✂️",
        description: "Shorten the text",
        type: "text-improvement",
        prompt: "Shorten this text while keeping the key message",
        affectedProps: ["content"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "Text blocks convey information", bestPractices: ["Keep paragraphs short", "Use clear language"], avoidPatterns: ["Walls of text", "Jargon"] },
    templates: [],
  },
  
  Heading: {
    description: "A heading/title component",
    category: "content",
    capability: "basic",
    canModify: { props: ["text", "level", "alignment"], styles: ["color"], content: ["text"], layout: false, children: false },
    actions: [
      {
        id: "improve-heading",
        label: "Improve Heading",
        icon: "✨",
        description: "Make heading more impactful",
        type: "text-improvement",
        prompt: "Make this heading more impactful and memorable",
        affectedProps: ["text"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "Headings organize content and catch attention", bestPractices: ["Be specific", "Use action words"], avoidPatterns: ["Generic titles"] },
    templates: [],
  },
  
  Image: {
    description: "An image component",
    category: "media",
    capability: "basic",
    canModify: { props: ["src", "alt", "aspectRatio"], styles: ["borderRadius"], content: ["alt"], layout: false, children: false },
    actions: [
      {
        id: "optimize-alt",
        label: "Optimize Alt Text",
        icon: "🔍",
        description: "Improve alt text for SEO",
        type: "seo-optimize",
        prompt: "Write SEO-optimized alt text for this image",
        affectedProps: ["alt"],
      },
    ],
    suggestions: [
      {
        condition: (props) => !props.alt,
        message: "Add alt text for accessibility and SEO",
        action: "optimize-alt",
      },
    ],
    promptContext: { roleHint: "Images add visual interest and convey information", bestPractices: ["Always include alt text", "Use appropriate aspect ratios"], avoidPatterns: ["Generic stock photos", "Missing alt text"] },
    templates: [],
  },
  
  Navbar: {
    description: "Navigation header with logo and links",
    category: "navigation",
    capability: "advanced",
    canModify: { props: ["logo", "logoText", "links", "ctaText", "sticky"], styles: ["backgroundColor"], content: ["logoText", "ctaText"], layout: false, children: false },
    actions: [
      {
        id: "improve-nav-cta",
        label: "Improve CTA",
        icon: "✨",
        description: "Make navigation CTA more compelling",
        type: "text-improvement",
        prompt: "Improve the navigation call-to-action button text",
        affectedProps: ["ctaText"],
      },
    ],
    suggestions: [
      {
        condition: (props) => !props.ctaText,
        message: "Add a CTA button for conversions",
      },
    ],
    promptContext: { roleHint: "Navigation helps users find content", bestPractices: ["Keep links under 6", "Include clear CTA"], avoidPatterns: ["Too many links", "Vague labels"] },
    templates: [],
  },
  
  Footer: {
    description: "Page footer with links and copyright",
    category: "navigation",
    capability: "standard",
    canModify: { props: ["copyright", "links", "socialLinks"], styles: ["backgroundColor"], content: ["copyright"], layout: false, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Footer provides secondary navigation and legal info", bestPractices: ["Include essential links", "Add social media"], avoidPatterns: ["Cluttered design"] },
    templates: [],
  },
  
  Testimonials: {
    description: "Customer testimonials section",
    category: "content",
    capability: "advanced",
    canModify: { props: ["title", "testimonials", "layout"], styles: ["backgroundColor"], content: ["title", "testimonials"], layout: true, children: false },
    actions: [
      {
        id: "add-testimonial",
        label: "Add Testimonial",
        icon: "➕",
        description: "Generate a new testimonial",
        type: "content-generate",
        prompt: "Generate a realistic testimonial that matches the existing style",
        affectedProps: ["testimonials"],
      },
    ],
    suggestions: [
      {
        condition: (props) => (props.testimonials?.length || 0) < 2,
        message: "Add more testimonials for credibility",
        action: "add-testimonial",
      },
    ],
    promptContext: { roleHint: "Testimonials build trust and social proof", bestPractices: ["Include real names and photos", "Keep quotes concise"], avoidPatterns: ["Fake-sounding quotes", "Too many at once"] },
    templates: [],
  },
  
  Pricing: {
    description: "Pricing table section",
    category: "content",
    capability: "expert",
    canModify: { props: ["title", "plans", "highlighted"], styles: ["backgroundColor"], content: ["title", "plans"], layout: false, children: false },
    actions: [
      {
        id: "improve-pricing",
        label: "Improve Copy",
        icon: "✨",
        description: "Enhance plan descriptions",
        type: "text-improvement",
        prompt: "Improve the pricing plan names and feature descriptions to be more compelling",
        affectedProps: ["plans"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "Pricing tables drive conversions", bestPractices: ["Highlight recommended plan", "List key features", "Clear pricing"], avoidPatterns: ["Hidden fees", "Confusing tiers"] },
    templates: [],
  },
  
  FAQ: {
    description: "Frequently asked questions section",
    category: "content",
    capability: "standard",
    canModify: { props: ["title", "questions"], styles: ["backgroundColor"], content: ["title", "questions"], layout: false, children: false },
    actions: [
      {
        id: "add-faq",
        label: "Add Question",
        icon: "➕",
        description: "Generate a new FAQ item",
        type: "content-generate",
        prompt: "Generate a relevant FAQ question and answer",
        affectedProps: ["questions"],
      },
      {
        id: "improve-answers",
        label: "Improve Answers",
        icon: "✨",
        description: "Make answers clearer",
        type: "text-improvement",
        prompt: "Improve the FAQ answers to be clearer and more helpful",
        affectedProps: ["questions"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "FAQs answer common questions and reduce support", bestPractices: ["Address real concerns", "Keep answers concise"], avoidPatterns: ["Made-up questions", "Long-winded answers"] },
    templates: [],
  },
  
  CTA: {
    description: "Call-to-action section",
    category: "content",
    capability: "advanced",
    canModify: { props: ["title", "subtitle", "buttonText", "buttonLink", "variant"], styles: ["backgroundColor"], content: ["title", "subtitle", "buttonText"], layout: false, children: false },
    actions: [
      {
        id: "improve-cta",
        label: "Boost Conversion",
        icon: "🚀",
        description: "Make CTA more compelling",
        type: "text-improvement",
        prompt: "Improve this CTA section to drive more conversions. Make the headline urgent, the subtitle supportive, and the button action-oriented.",
        affectedProps: ["title", "subtitle", "buttonText"],
      },
    ],
    suggestions: [
      {
        condition: (props) => !props.subtitle,
        message: "Add a subtitle to support your CTA",
      },
    ],
    promptContext: { roleHint: "CTAs drive specific user actions", bestPractices: ["Create urgency", "Clear value proposition", "Single action"], avoidPatterns: ["Multiple competing buttons", "Vague messaging"] },
    templates: [],
  },
  
  Gallery: {
    description: "Image gallery component",
    category: "media",
    capability: "standard",
    canModify: { props: ["images", "columns", "layout"], styles: [], content: [], layout: true, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Galleries showcase visual content", bestPractices: ["Consistent image sizes", "Include captions"], avoidPatterns: ["Low quality images", "No organization"] },
    templates: [],
  },
  
  Stats: {
    description: "Statistics/numbers display",
    category: "content",
    capability: "standard",
    canModify: { props: ["title", "stats"], styles: ["backgroundColor"], content: ["title", "stats"], layout: false, children: false },
    actions: [
      {
        id: "improve-stats",
        label: "Improve Labels",
        icon: "✨",
        description: "Make stat labels more impactful",
        type: "text-improvement",
        prompt: "Improve the stat labels to be more impactful and memorable",
        affectedProps: ["stats"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "Stats build credibility with numbers", bestPractices: ["Use impressive real numbers", "Add context"], avoidPatterns: ["Fake statistics", "Too many numbers"] },
    templates: [],
  },
  
  LogoCloud: {
    description: "Logo showcase for clients/partners",
    category: "content",
    capability: "basic",
    canModify: { props: ["title", "logos"], styles: ["backgroundColor"], content: ["title"], layout: false, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Logo clouds show social proof through partnerships", bestPractices: ["Use recognizable brands", "Consistent sizing"], avoidPatterns: ["Unknown logos", "Too many logos"] },
    templates: [],
  },
  
  Team: {
    description: "Team members section",
    category: "content",
    capability: "standard",
    canModify: { props: ["title", "members", "layout"], styles: ["backgroundColor"], content: ["title", "members"], layout: true, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Team sections humanize the company", bestPractices: ["Professional photos", "Brief bios"], avoidPatterns: ["Inconsistent photo styles"] },
    templates: [],
  },
  
  ContactForm: {
    description: "Contact form component",
    category: "interactive",
    capability: "advanced",
    canModify: { props: ["title", "fields", "submitText"], styles: ["backgroundColor"], content: ["title", "submitText"], layout: false, children: false },
    actions: [
      {
        id: "improve-form",
        label: "Improve Form",
        icon: "✨",
        description: "Enhance form copy",
        type: "text-improvement",
        prompt: "Improve the form title and submit button to encourage submissions",
        affectedProps: ["title", "submitText"],
      },
    ],
    suggestions: [],
    promptContext: { roleHint: "Contact forms capture leads", bestPractices: ["Minimal required fields", "Clear submit button"], avoidPatterns: ["Too many fields", "No confirmation message"] },
    templates: [],
  },
  
  Map: {
    description: "Map embed component",
    category: "media",
    capability: "basic",
    canModify: { props: ["address", "height"], styles: [], content: ["address"], layout: false, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Maps show physical location", bestPractices: ["Accurate address", "Appropriate zoom"], avoidPatterns: [] },
    templates: [],
  },
  
  Video: {
    description: "Video embed component",
    category: "media",
    capability: "basic",
    canModify: { props: ["url", "autoplay", "loop"], styles: [], content: [], layout: false, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Videos engage visitors with dynamic content", bestPractices: ["High quality video", "Proper aspect ratio"], avoidPatterns: ["Autoplay with sound"] },
    templates: [],
  },
  
  Divider: {
    description: "Visual divider component",
    category: "layout",
    capability: "basic",
    canModify: { props: ["style", "color"], styles: ["color"], content: [], layout: false, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Dividers separate content sections", bestPractices: [], avoidPatterns: [] },
    templates: [],
  },
  
  Spacer: {
    description: "Vertical space component",
    category: "layout",
    capability: "basic",
    canModify: { props: ["height"], styles: [], content: [], layout: false, children: false },
    actions: [],
    suggestions: [],
    promptContext: { roleHint: "Spacers add breathing room", bestPractices: [], avoidPatterns: [] },
    templates: [],
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get AI config for a component type
 */
export function getAIConfig(componentType: string): AIComponentConfig | null {
  return AI_COMPONENT_CONFIGS[componentType as ComponentType] || null;
}

/**
 * Get available actions for a component
 */
export function getAvailableActions(componentType: string): AIActionConfig[] {
  const config = getAIConfig(componentType);
  return config?.actions || [];
}

/**
 * Get suggestions based on current props
 */
export function getSuggestions(componentType: string, props: Record<string, any>): string[] {
  const config = getAIConfig(componentType);
  if (!config) return [];
  
  return config.suggestions
    .filter((s) => s.condition(props))
    .map((s) => s.message);
}

/**
 * Build AI prompt with context
 */
export function buildAIPrompt(
  componentType: string,
  basePrompt: string,
  currentProps: Record<string, any>
): string {
  const config = getAIConfig(componentType);
  if (!config) return basePrompt;
  
  const context = config.promptContext;
  
  return `
Component: ${componentType}
Role: ${context.roleHint}

Current State:
${JSON.stringify(currentProps, null, 2)}

Guidelines:
- ${context.bestPractices.join("\n- ")}

Avoid:
- ${context.avoidPatterns.join("\n- ")}

Task: ${basePrompt}

Respond with ONLY a JSON object containing the updated props.
`;
}
```

---

### Task 30.2: Universal Props System

**Purpose**: Add animation, hover, and visibility props to all components.

**File**: `src/lib/studio/registry/universal-props.ts`

```typescript
/**
 * DRAMAC Studio - Universal Props System
 * 
 * Adds animation, hover, visibility, and other universal props to all components.
 */

import { FieldConfig } from "./field-types";
import { animationFieldOptions, hoverFieldOptions } from "../animations/animation-presets";

// Universal prop values
export interface UniversalProps {
  // Animation
  animation?: string;
  animationDelay?: number;
  animationDuration?: number;
  
  // Hover effects
  hover?: string;
  
  // Visibility
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  
  // Spacing overrides
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
  
  // Advanced
  customClassName?: string;
  customId?: string;
  ariaLabel?: string;
}

// Universal field definitions
export const UNIVERSAL_FIELDS: Record<string, FieldConfig> = {
  // Animation section
  animation: {
    type: "select",
    label: "Entrance Animation",
    options: animationFieldOptions,
    defaultValue: "none",
    group: "Animation",
  },
  animationDelay: {
    type: "number",
    label: "Animation Delay (ms)",
    min: 0,
    max: 2000,
    step: 100,
    defaultValue: 0,
    group: "Animation",
  },
  animationDuration: {
    type: "number",
    label: "Animation Duration (ms)",
    min: 100,
    max: 3000,
    step: 100,
    defaultValue: 600,
    group: "Animation",
  },
  
  // Hover section
  hover: {
    type: "select",
    label: "Hover Effect",
    options: hoverFieldOptions,
    defaultValue: "none",
    group: "Interaction",
  },
  
  // Visibility section
  hideOnMobile: {
    type: "toggle",
    label: "Hide on Mobile",
    defaultValue: false,
    group: "Visibility",
  },
  hideOnTablet: {
    type: "toggle",
    label: "Hide on Tablet",
    defaultValue: false,
    group: "Visibility",
  },
  hideOnDesktop: {
    type: "toggle",
    label: "Hide on Desktop",
    defaultValue: false,
    group: "Visibility",
  },
  
  // Spacing section
  marginTop: {
    type: "number",
    label: "Margin Top (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  marginBottom: {
    type: "number",
    label: "Margin Bottom (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  paddingTop: {
    type: "number",
    label: "Padding Top (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  paddingBottom: {
    type: "number",
    label: "Padding Bottom (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  
  // Advanced section
  customClassName: {
    type: "text",
    label: "Custom CSS Class",
    group: "Advanced",
  },
  customId: {
    type: "text",
    label: "HTML ID",
    group: "Advanced",
  },
  ariaLabel: {
    type: "text",
    label: "Accessibility Label",
    group: "Advanced",
  },
};

// Groups for properties panel UI
export const UNIVERSAL_GROUPS = [
  { id: "Animation", label: "Animation", icon: "Sparkles", defaultOpen: false },
  { id: "Interaction", label: "Interaction", icon: "MousePointer", defaultOpen: false },
  { id: "Visibility", label: "Visibility", icon: "Eye", defaultOpen: false },
  { id: "Spacing", label: "Spacing", icon: "Move", defaultOpen: false },
  { id: "Advanced", label: "Advanced", icon: "Settings", defaultOpen: false },
];

/**
 * Get universal classes based on props
 */
export function getUniversalClasses(props: Partial<UniversalProps>): string {
  const classes: string[] = [];
  
  // Animation
  if (props.animation && props.animation !== "none") {
    classes.push(`animate-${props.animation}`);
  }
  
  // Hover
  if (props.hover && props.hover !== "none") {
    // Hover classes are added from HOVER_EFFECTS lookup
  }
  
  // Visibility
  if (props.hideOnMobile) classes.push("hidden sm:block");
  if (props.hideOnTablet) classes.push("sm:hidden md:block");
  if (props.hideOnDesktop) classes.push("md:hidden");
  
  // Custom class
  if (props.customClassName) classes.push(props.customClassName);
  
  return classes.join(" ");
}

/**
 * Get universal inline styles
 */
export function getUniversalStyles(props: Partial<UniversalProps>): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  // Animation delay/duration
  if (props.animationDelay) {
    styles.animationDelay = `${props.animationDelay}ms`;
  }
  if (props.animationDuration) {
    styles.animationDuration = `${props.animationDuration}ms`;
  }
  
  // Spacing
  if (props.marginTop !== undefined) styles.marginTop = `${props.marginTop}px`;
  if (props.marginBottom !== undefined) styles.marginBottom = `${props.marginBottom}px`;
  if (props.paddingTop !== undefined) styles.paddingTop = `${props.paddingTop}px`;
  if (props.paddingBottom !== undefined) styles.paddingBottom = `${props.paddingBottom}px`;
  
  return styles;
}
```

---

### Task 30.3: Unified Render Wrapper

**Purpose**: Smart wrapper that applies universal features to all components.

**File**: `src/lib/studio/blocks/render-wrapper.tsx`

```tsx
/**
 * DRAMAC Studio - Unified Render Wrapper
 * 
 * Wraps all component renders with universal features:
 * - Animations
 * - Hover effects
 * - Visibility controls
 * - Custom spacing
 * - Accessibility attributes
 */

"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  UniversalProps, 
  getUniversalClasses, 
  getUniversalStyles 
} from "../registry/universal-props";
import { HOVER_EFFECTS } from "../animations/animation-presets";

interface RenderWrapperProps extends UniversalProps {
  children: React.ReactNode;
  componentType: string;
  componentId: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * RenderWrapper - Wraps component renders with universal features
 */
export function RenderWrapper({
  children,
  componentType,
  componentId,
  className,
  style,
  as: Component = "div",
  // Universal props
  animation,
  animationDelay,
  animationDuration,
  hover,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  marginTop,
  marginBottom,
  paddingTop,
  paddingBottom,
  customClassName,
  customId,
  ariaLabel,
}: RenderWrapperProps) {
  // Compute classes
  const computedClasses = useMemo(() => {
    const universalClasses = getUniversalClasses({
      animation,
      hideOnMobile,
      hideOnTablet,
      hideOnDesktop,
      customClassName,
    });
    
    const hoverClass = hover ? HOVER_EFFECTS[hover as keyof typeof HOVER_EFFECTS] || "" : "";
    
    return cn(universalClasses, hoverClass, className);
  }, [animation, hideOnMobile, hideOnTablet, hideOnDesktop, customClassName, hover, className]);
  
  // Compute styles
  const computedStyles = useMemo(() => {
    const universalStyles = getUniversalStyles({
      animationDelay,
      animationDuration,
      marginTop,
      marginBottom,
      paddingTop,
      paddingBottom,
    });
    
    return { ...universalStyles, ...style };
  }, [animationDelay, animationDuration, marginTop, marginBottom, paddingTop, paddingBottom, style]);
  
  return (
    <Component
      className={computedClasses}
      style={computedStyles}
      id={customId || undefined}
      aria-label={ariaLabel || undefined}
      data-component-type={componentType}
      data-component-id={componentId}
    >
      {children}
    </Component>
  );
}

/**
 * withUniversalProps - HOC to add universal props to any render component
 */
export function withUniversalProps<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentType: string
) {
  const WithUniversalProps = React.forwardRef<any, P & UniversalProps & { componentId: string }>(
    (props, ref) => {
      const {
        componentId,
        animation,
        animationDelay,
        animationDuration,
        hover,
        hideOnMobile,
        hideOnTablet,
        hideOnDesktop,
        marginTop,
        marginBottom,
        paddingTop,
        paddingBottom,
        customClassName,
        customId,
        ariaLabel,
        ...componentProps
      } = props;
      
      return (
        <RenderWrapper
          componentType={componentType}
          componentId={componentId}
          animation={animation}
          animationDelay={animationDelay}
          animationDuration={animationDuration}
          hover={hover}
          hideOnMobile={hideOnMobile}
          hideOnTablet={hideOnTablet}
          hideOnDesktop={hideOnDesktop}
          marginTop={marginTop}
          marginBottom={marginBottom}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          customClassName={customClassName}
          customId={customId}
          ariaLabel={ariaLabel}
        >
          <WrappedComponent {...(componentProps as P)} ref={ref} />
        </RenderWrapper>
      );
    }
  );
  
  WithUniversalProps.displayName = `WithUniversalProps(${componentType})`;
  return WithUniversalProps;
}
```

---

### Task 30.4: Quick Actions Panel

**Purpose**: AI quick actions integrated into the properties panel.

**File**: `src/components/studio/panels/quick-actions-panel.tsx`

```tsx
/**
 * DRAMAC Studio - Quick Actions Panel
 * 
 * AI-powered quick actions for the selected component.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  getAvailableActions, 
  getSuggestions, 
  buildAIPrompt,
  AIActionConfig 
} from "@/lib/studio/registry/ai-configs";
import { useEditorStore } from "@/lib/studio/store/editor-store";

interface QuickActionsPanelProps {
  componentId: string;
  componentType: string;
  componentProps: Record<string, any>;
}

export function QuickActionsPanel({
  componentId,
  componentType,
  componentProps,
}: QuickActionsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  
  const actions = getAvailableActions(componentType);
  const suggestions = getSuggestions(componentType, componentProps);
  
  const handleAction = async (action: AIActionConfig) => {
    setLoading(action.id);
    
    try {
      const prompt = buildAIPrompt(componentType, action.prompt, componentProps);
      
      const response = await fetch("/api/studio/ai/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId,
          componentType,
          action: action.id,
          prompt,
          currentProps: componentProps,
          affectedProps: action.affectedProps,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Action failed");
      }
      
      const result = await response.json();
      
      if (result.updates) {
        updateComponentProps(componentId, result.updates);
        toast.success(action.label, {
          description: "Changes applied successfully",
        });
      }
    } catch (error) {
      console.error("[QuickActions] Error:", error);
      toast.error("Action failed", {
        description: "Please try again",
      });
    } finally {
      setLoading(null);
    }
  };
  
  if (actions.length === 0 && suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="border-t p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>AI Quick Actions</span>
      </div>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.map((suggestion, i) => (
            <div 
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2"
            >
              <span className="text-yellow-500">💡</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant="outline"
              className={cn(
                "h-7 text-xs gap-1.5",
                loading === action.id && "pointer-events-none"
              )}
              onClick={() => handleAction(action)}
              disabled={loading !== null}
            >
              {loading === action.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span>{action.icon}</span>
              )}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 30.5: Quick Action API Endpoint

**File**: `src/app/api/studio/ai/quick-action/route.ts`

```typescript
/**
 * AI Quick Action API
 * 
 * Processes AI quick actions for components.
 */

import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      componentId, 
      componentType, 
      action, 
      prompt, 
      currentProps, 
      affectedProps 
    } = body;
    
    if (!componentType || !action || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }
    
    // Build dynamic schema based on affected props
    const schemaShape: Record<string, z.ZodType> = {};
    for (const prop of affectedProps) {
      // Determine type based on current value
      const currentValue = currentProps[prop];
      if (typeof currentValue === "boolean") {
        schemaShape[prop] = z.boolean().optional();
      } else if (typeof currentValue === "number") {
        schemaShape[prop] = z.number().optional();
      } else if (Array.isArray(currentValue)) {
        schemaShape[prop] = z.array(z.any()).optional();
      } else {
        schemaShape[prop] = z.string().optional();
      }
    }
    
    const resultSchema = z.object(schemaShape);
    
    // Generate with AI
    const { object: updates } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: resultSchema,
      prompt: prompt,
    });
    
    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    
    return NextResponse.json({
      success: true,
      updates: cleanUpdates,
      action,
      componentId,
    });
  } catch (error) {
    console.error("[Quick Action API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
```

---

### Task 30.6: Component Variations System

**File**: `src/lib/studio/store/variations-store.ts`

```typescript
/**
 * DRAMAC Studio - Component Variations Store
 * 
 * Manages component variations and cloning.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { nanoid } from "nanoid";
import { ComponentData } from "../types";

interface Variation {
  id: string;
  name: string;
  description?: string;
  componentType: string;
  props: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface VariationsState {
  // Saved variations
  variations: Record<string, Variation>;
  
  // Actions
  saveVariation: (name: string, component: ComponentData, description?: string) => string;
  updateVariation: (id: string, updates: Partial<Variation>) => void;
  deleteVariation: (id: string) => void;
  getVariationsForType: (componentType: string) => Variation[];
  
  // Clone functionality
  cloneComponent: (component: ComponentData) => ComponentData;
  createFromVariation: (variationId: string) => ComponentData | null;
}

export const useVariationsStore = create<VariationsState>()(
  devtools(
    (set, get) => ({
      variations: {},
      
      saveVariation: (name, component, description) => {
        const id = nanoid();
        const variation: Variation = {
          id,
          name,
          description,
          componentType: component.type,
          props: { ...component.props },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          variations: { ...state.variations, [id]: variation },
        }));
        
        return id;
      },
      
      updateVariation: (id, updates) => {
        set((state) => {
          const existing = state.variations[id];
          if (!existing) return state;
          
          return {
            variations: {
              ...state.variations,
              [id]: {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      
      deleteVariation: (id) => {
        set((state) => {
          const { [id]: removed, ...rest } = state.variations;
          return { variations: rest };
        });
      },
      
      getVariationsForType: (componentType) => {
        const { variations } = get();
        return Object.values(variations)
          .filter((v) => v.componentType === componentType)
          .sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      },
      
      cloneComponent: (component) => {
        const newId = nanoid();
        return {
          ...component,
          id: newId,
          props: { ...component.props },
        };
      },
      
      createFromVariation: (variationId) => {
        const variation = get().variations[variationId];
        if (!variation) return null;
        
        return {
          id: nanoid(),
          type: variation.componentType,
          props: { ...variation.props },
        };
      },
    }),
    { name: "dramac-variations-store" }
  )
);
```

---

## ✅ Deliverables Checklist

- [ ] AI configurations for all 25+ component types
- [ ] Universal props (animation, hover, visibility) on all components
- [ ] Render wrapper applying universal features
- [ ] Quick actions panel in properties panel
- [ ] Quick action API endpoint working
- [ ] Component variations/cloning system
- [ ] AI suggestions appearing based on component state
- [ ] All TypeScript types properly defined
- [ ] API rate limiting for AI calls
- [ ] 0 TypeScript errors

---

## 🧪 Testing Requirements

### After Implementation:
```
1. Select Hero component → Quick actions should appear
2. Click "Improve Headlines" → Title/subtitle should update
3. Check Hero AI suggestions → Should show based on missing props
4. Add animation to any component → Should animate in preview
5. Add hover effect → Should work in preview
6. Toggle visibility on mobile → Component should hide in mobile view
7. Save a component as variation → Should appear in variations list
8. Create new component from variation → Should work
9. Clone component → Should create exact copy with new ID
10. Test AI actions on different component types
```

---

## 📝 Notes

1. **API Security**: Ensure AI endpoints are rate-limited
2. **Caching**: Cache AI configs for performance
3. **Progressive Enhancement**: UI should work without AI features
4. **Error Handling**: Graceful degradation when AI fails
5. **Metrics**: Track AI action usage for optimization

---

**Phase Duration**: 16-20 hours  
**Dependencies**: Wave 11 complete  
**Blocks**: Phase 31 (3D Effects & Advanced Animations)
