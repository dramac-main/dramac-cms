/**
 * DRAMAC Studio - Enhanced AI Component Configurations
 * 
 * Provides rich AI metadata for intelligent component modification.
 * Each component type has detailed AI configuration for:
 * - What properties AI can modify
 * - Available quick actions
 * - Smart suggestions based on component state
 * - Prompt context for better AI responses
 * 
 * @phase STUDIO-30 - Component Superpowers
 */

// =============================================================================
// TYPES
// =============================================================================

/** AI capability levels indicating complexity of AI operations */
export type AICapabilityLevel = "basic" | "standard" | "advanced" | "expert";

/** Types of AI actions available */
export type AIActionType = 
  | "text-improvement" 
  | "style-change" 
  | "layout-adjust" 
  | "content-generate"
  | "responsive-fix"
  | "accessibility-fix"
  | "seo-optimize"
  | "animation-add";

/** Configuration for a single AI action */
export interface AIActionConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  type: AIActionType;
  prompt: string;
  affectedProps: string[];
  requiresSelection?: boolean;
}

/** Conditional suggestion based on component props */
export interface AISuggestion {
  condition: (props: Record<string, unknown>) => boolean;
  message: string;
  action?: string;
}

/** Template for component generation */
export interface AIGenerationTemplate {
  id: string;
  name: string;
  description: string;
  props: Record<string, unknown>;
}

/** Complete AI configuration for a component type */
export interface AIComponentConfig {
  description: string;
  category: "layout" | "content" | "interactive" | "media" | "navigation";
  capability: AICapabilityLevel;
  
  canModify: {
    props: string[];
    styles: string[];
    content: string[];
    layout: boolean;
    children: boolean;
  };
  
  actions: AIActionConfig[];
  suggestions: AISuggestion[];
  
  promptContext: {
    roleHint: string;
    bestPractices: string[];
    avoidPatterns: string[];
  };
  
  templates: AIGenerationTemplate[];
}

// =============================================================================
// AI CONFIGURATIONS BY COMPONENT TYPE
// =============================================================================

export const AI_COMPONENT_CONFIGS: Record<string, AIComponentConfig> = {
  // =========================================================================
  // HERO & MAJOR SECTIONS
  // =========================================================================
  
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
        affectedProps: ["layout", "alignment"],
      },
      {
        id: "hero-make-bold",
        label: "Make Bold & Dramatic",
        icon: "💪",
        description: "Increase impact with bold styling",
        type: "style-change",
        prompt: "Make this hero section more bold and dramatic with larger text, stronger contrast, and full viewport height",
        affectedProps: ["textColor", "backgroundColor"],
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
        condition: (props) => (Array.isArray(props.features) ? props.features.length : 0) < 3,
        message: "Add more features for a balanced layout",
        action: "add-more-features",
      },
      {
        condition: (props) => Array.isArray(props.features) && props.features.some((f: Record<string, unknown>) => !f.description),
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
  
  CTA: {
    description: "Call-to-action section",
    category: "content",
    capability: "advanced",
    canModify: {
      props: ["title", "subtitle", "buttonText", "buttonLink", "variant"],
      styles: ["backgroundColor"],
      content: ["title", "subtitle", "buttonText"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "CTAs drive specific user actions",
      bestPractices: ["Create urgency", "Clear value proposition", "Single action"],
      avoidPatterns: ["Multiple competing buttons", "Vague messaging"],
    },
    templates: [],
  },
  
  Testimonials: {
    description: "Customer testimonials section",
    category: "content",
    capability: "advanced",
    canModify: {
      props: ["title", "testimonials", "layout"],
      styles: ["backgroundColor"],
      content: ["title", "testimonials"],
      layout: true,
      children: false,
    },
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
        condition: (props) => (Array.isArray(props.testimonials) ? props.testimonials.length : 0) < 2,
        message: "Add more testimonials for credibility",
        action: "add-testimonial",
      },
    ],
    promptContext: {
      roleHint: "Testimonials build trust and social proof",
      bestPractices: ["Include real names and photos", "Keep quotes concise"],
      avoidPatterns: ["Fake-sounding quotes", "Too many at once"],
    },
    templates: [],
  },
  
  Pricing: {
    description: "Pricing table section",
    category: "content",
    capability: "expert",
    canModify: {
      props: ["title", "plans", "highlighted"],
      styles: ["backgroundColor"],
      content: ["title", "plans"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Pricing tables drive conversions",
      bestPractices: ["Highlight recommended plan", "List key features", "Clear pricing"],
      avoidPatterns: ["Hidden fees", "Confusing tiers"],
    },
    templates: [],
  },
  
  FAQ: {
    description: "Frequently asked questions section",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["title", "questions"],
      styles: ["backgroundColor"],
      content: ["title", "questions"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "FAQs answer common questions and reduce support",
      bestPractices: ["Address real concerns", "Keep answers concise"],
      avoidPatterns: ["Made-up questions", "Long-winded answers"],
    },
    templates: [],
  },
  
  Stats: {
    description: "Statistics/numbers display",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["title", "stats"],
      styles: ["backgroundColor"],
      content: ["title", "stats"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Stats build credibility with numbers",
      bestPractices: ["Use impressive real numbers", "Add context"],
      avoidPatterns: ["Fake statistics", "Too many numbers"],
    },
    templates: [],
  },
  
  Team: {
    description: "Team members section",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["title", "members", "layout"],
      styles: ["backgroundColor"],
      content: ["title", "members"],
      layout: true,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Team sections humanize the company",
      bestPractices: ["Professional photos", "Brief bios"],
      avoidPatterns: ["Inconsistent photo styles"],
    },
    templates: [],
  },
  
  Gallery: {
    description: "Image gallery component",
    category: "media",
    capability: "standard",
    canModify: {
      props: ["images", "columns", "layout"],
      styles: [],
      content: [],
      layout: true,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Galleries showcase visual content",
      bestPractices: ["Consistent image sizes", "Include captions"],
      avoidPatterns: ["Low quality images", "No organization"],
    },
    templates: [],
  },
  
  LogoCloud: {
    description: "Logo showcase for clients/partners",
    category: "content",
    capability: "basic",
    canModify: {
      props: ["title", "logos"],
      styles: ["backgroundColor"],
      content: ["title"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Logo clouds show social proof through partnerships",
      bestPractices: ["Use recognizable brands", "Consistent sizing"],
      avoidPatterns: ["Unknown logos", "Too many logos"],
    },
    templates: [],
  },
  
  // =========================================================================
  // LAYOUT COMPONENTS
  // =========================================================================
  
  Section: {
    description: "A layout section container",
    category: "layout",
    capability: "basic",
    canModify: {
      props: ["backgroundColor", "padding"],
      styles: ["backgroundColor"],
      content: [],
      layout: true,
      children: true,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Sections organize page content",
      bestPractices: [],
      avoidPatterns: [],
    },
    templates: [],
  },
  
  Container: {
    description: "A container with max-width for content",
    category: "layout",
    capability: "basic",
    canModify: {
      props: ["maxWidth", "padding"],
      styles: [],
      content: [],
      layout: true,
      children: true,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Containers constrain content width",
      bestPractices: [],
      avoidPatterns: [],
    },
    templates: [],
  },
  
  Columns: {
    description: "A multi-column responsive layout",
    category: "layout",
    capability: "standard",
    canModify: {
      props: ["columns", "gap"],
      styles: [],
      content: [],
      layout: true,
      children: true,
    },
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
    promptContext: {
      roleHint: "Columns create side-by-side layouts",
      bestPractices: ["Use 2-4 columns", "Ensure mobile responsiveness"],
      avoidPatterns: ["Too many columns on mobile"],
    },
    templates: [],
  },
  
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
  
  Spacer: {
    description: "Vertical space component",
    category: "layout",
    capability: "basic",
    canModify: {
      props: ["height"],
      styles: [],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Spacers add breathing room",
      bestPractices: [],
      avoidPatterns: [],
    },
    templates: [],
  },
  
  Divider: {
    description: "Visual divider component",
    category: "layout",
    capability: "basic",
    canModify: {
      props: ["style", "color"],
      styles: ["color"],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Dividers separate content sections",
      bestPractices: [],
      avoidPatterns: [],
    },
    templates: [],
  },
  
  // =========================================================================
  // TYPOGRAPHY COMPONENTS
  // =========================================================================
  
  Text: {
    description: "A text block component",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["content", "variant", "alignment"],
      styles: ["color"],
      content: ["content"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Text blocks convey information",
      bestPractices: ["Keep paragraphs short", "Use clear language"],
      avoidPatterns: ["Walls of text", "Jargon"],
    },
    templates: [],
  },
  
  Heading: {
    description: "A heading/title component",
    category: "content",
    capability: "basic",
    canModify: {
      props: ["text", "level", "alignment"],
      styles: ["color"],
      content: ["text"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Headings organize content and catch attention",
      bestPractices: ["Be specific", "Use action words"],
      avoidPatterns: ["Generic titles"],
    },
    templates: [],
  },
  
  RichText: {
    description: "Rich text content with formatting",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["content"],
      styles: [],
      content: ["content"],
      layout: false,
      children: false,
    },
    actions: [
      {
        id: "improve-richtext",
        label: "Improve Writing",
        icon: "✨",
        description: "Enhance content quality",
        type: "text-improvement",
        prompt: "Improve this content to be clearer, more engaging, and better structured",
        affectedProps: ["content"],
      },
    ],
    suggestions: [],
    promptContext: {
      roleHint: "Rich text allows formatted long-form content",
      bestPractices: ["Use headings for structure", "Keep paragraphs readable"],
      avoidPatterns: ["Inconsistent formatting", "Too many styles"],
    },
    templates: [],
  },
  
  Quote: {
    description: "Blockquote component",
    category: "content",
    capability: "basic",
    canModify: {
      props: ["text", "author", "role"],
      styles: [],
      content: ["text", "author"],
      layout: false,
      children: false,
    },
    actions: [
      {
        id: "improve-quote",
        label: "Enhance Quote",
        icon: "✨",
        description: "Make the quote more impactful",
        type: "text-improvement",
        prompt: "Make this quote more impactful and memorable",
        affectedProps: ["text"],
      },
    ],
    suggestions: [],
    promptContext: {
      roleHint: "Quotes add authority and visual interest",
      bestPractices: ["Attribute the source", "Keep quotes memorable"],
      avoidPatterns: ["Overlong quotes", "Missing attribution"],
    },
    templates: [],
  },
  
  // =========================================================================
  // BUTTON & INTERACTIVE COMPONENTS
  // =========================================================================
  
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
        condition: (props) => typeof props.label === "string" && props.label.toLowerCase() === "click here",
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
  
  // =========================================================================
  // MEDIA COMPONENTS
  // =========================================================================
  
  Image: {
    description: "An image component",
    category: "media",
    capability: "basic",
    canModify: {
      props: ["src", "alt", "aspectRatio"],
      styles: ["borderRadius"],
      content: ["alt"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Images add visual interest and convey information",
      bestPractices: ["Always include alt text", "Use appropriate aspect ratios"],
      avoidPatterns: ["Generic stock photos", "Missing alt text"],
    },
    templates: [],
  },
  
  Video: {
    description: "Video embed component",
    category: "media",
    capability: "basic",
    canModify: {
      props: ["url", "autoplay", "loop"],
      styles: [],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Videos engage visitors with dynamic content",
      bestPractices: ["High quality video", "Proper aspect ratio"],
      avoidPatterns: ["Autoplay with sound"],
    },
    templates: [],
  },
  
  Map: {
    description: "Map embed component",
    category: "media",
    capability: "basic",
    canModify: {
      props: ["address", "height"],
      styles: [],
      content: ["address"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Maps show physical location",
      bestPractices: ["Accurate address", "Appropriate zoom"],
      avoidPatterns: [],
    },
    templates: [],
  },
  
  // =========================================================================
  // NAVIGATION COMPONENTS
  // =========================================================================
  
  Navbar: {
    description: "Navigation header with logo and links",
    category: "navigation",
    capability: "advanced",
    canModify: {
      props: ["logo", "logoText", "links", "ctaText", "sticky"],
      styles: ["backgroundColor"],
      content: ["logoText", "ctaText"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Navigation helps users find content",
      bestPractices: ["Keep links under 6", "Include clear CTA"],
      avoidPatterns: ["Too many links", "Vague labels"],
    },
    templates: [],
  },
  
  Footer: {
    description: "Page footer with links and copyright",
    category: "navigation",
    capability: "standard",
    canModify: {
      props: ["copyright", "links", "socialLinks"],
      styles: ["backgroundColor"],
      content: ["copyright"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Footer provides secondary navigation and legal info",
      bestPractices: ["Include essential links", "Add social media"],
      avoidPatterns: ["Cluttered design"],
    },
    templates: [],
  },
  
  SocialLinks: {
    description: "Social media links component",
    category: "navigation",
    capability: "basic",
    canModify: {
      props: ["links", "size", "style"],
      styles: [],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Social links connect visitors to your social presence",
      bestPractices: ["Include only active profiles", "Use recognizable icons"],
      avoidPatterns: ["Broken links", "Too many platforms"],
    },
    templates: [],
  },
  
  // =========================================================================
  // FORM COMPONENTS
  // =========================================================================
  
  ContactForm: {
    description: "Contact form component",
    category: "interactive",
    capability: "advanced",
    canModify: {
      props: ["title", "fields", "submitText"],
      styles: ["backgroundColor"],
      content: ["title", "submitText"],
      layout: false,
      children: false,
    },
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
    promptContext: {
      roleHint: "Contact forms capture leads",
      bestPractices: ["Minimal required fields", "Clear submit button"],
      avoidPatterns: ["Too many fields", "No confirmation message"],
    },
    templates: [],
  },
  
  Form: {
    description: "Generic form component",
    category: "interactive",
    capability: "advanced",
    canModify: {
      props: ["title", "fields", "submitText"],
      styles: ["backgroundColor"],
      content: ["title", "submitText"],
      layout: false,
      children: true,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Forms collect user information",
      bestPractices: ["Clear labels", "Logical field order"],
      avoidPatterns: ["Unnecessary fields", "Confusing layout"],
    },
    templates: [],
  },
  
  FormField: {
    description: "Form field component",
    category: "interactive",
    capability: "basic",
    canModify: {
      props: ["label", "type", "placeholder", "required"],
      styles: [],
      content: ["label", "placeholder"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Form fields capture specific data",
      bestPractices: ["Clear labels", "Helpful placeholders"],
      avoidPatterns: ["Vague labels", "No validation"],
    },
    templates: [],
  },
  
  Newsletter: {
    description: "Newsletter signup form",
    category: "interactive",
    capability: "standard",
    canModify: {
      props: ["title", "description", "buttonText", "placeholder"],
      styles: ["backgroundColor"],
      content: ["title", "description", "buttonText"],
      layout: false,
      children: false,
    },
    actions: [
      {
        id: "improve-newsletter",
        label: "Improve Copy",
        icon: "✨",
        description: "Make newsletter signup more compelling",
        type: "text-improvement",
        prompt: "Improve the newsletter signup copy to encourage more subscriptions",
        affectedProps: ["title", "description", "buttonText"],
      },
    ],
    suggestions: [],
    promptContext: {
      roleHint: "Newsletter signups grow your email list",
      bestPractices: ["Clear value proposition", "Simple form"],
      avoidPatterns: ["Too many fields", "Unclear benefits"],
    },
    templates: [],
  },
  
  // =========================================================================
  // INTERACTIVE & ANIMATED COMPONENTS
  // =========================================================================
  
  Carousel: {
    description: "Carousel/slider component",
    category: "interactive",
    capability: "standard",
    canModify: {
      props: ["slides", "autoplay", "interval"],
      styles: [],
      content: ["slides"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Carousels showcase multiple items in limited space",
      bestPractices: ["Clear navigation", "Not too many slides"],
      avoidPatterns: ["Overuse", "Hidden important content"],
    },
    templates: [],
  },
  
  Countdown: {
    description: "Countdown timer component",
    category: "interactive",
    capability: "standard",
    canModify: {
      props: ["targetDate", "title", "expiredMessage"],
      styles: [],
      content: ["title", "expiredMessage"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Countdown timers create urgency",
      bestPractices: ["Real deadlines", "Clear messaging"],
      avoidPatterns: ["Fake urgency", "Expired timers"],
    },
    templates: [],
  },
  
  Typewriter: {
    description: "Typewriter text effect",
    category: "interactive",
    capability: "standard",
    canModify: {
      props: ["texts", "speed", "loop"],
      styles: [],
      content: ["texts"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Typewriter effects add dynamic text",
      bestPractices: ["Short phrases", "Relevant content"],
      avoidPatterns: ["Too fast", "Distracting overuse"],
    },
    templates: [],
  },
  
  Parallax: {
    description: "Parallax scrolling effect",
    category: "interactive",
    capability: "standard",
    canModify: {
      props: ["image", "speed", "height"],
      styles: [],
      content: [],
      layout: false,
      children: true,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Parallax adds depth to scrolling",
      bestPractices: ["Subtle speed", "High-quality images"],
      avoidPatterns: ["Overuse", "Motion sickness"],
    },
    templates: [],
  },
  
  // =========================================================================
  // MARKETING COMPONENTS
  // =========================================================================
  
  AnnouncementBar: {
    description: "Announcement/notification bar",
    category: "content",
    capability: "basic",
    canModify: {
      props: ["text", "link", "linkText", "dismissible"],
      styles: ["backgroundColor"],
      content: ["text", "linkText"],
      layout: false,
      children: false,
    },
    actions: [
      {
        id: "improve-announcement",
        label: "Improve Message",
        icon: "✨",
        description: "Make announcement more compelling",
        type: "text-improvement",
        prompt: "Improve this announcement to be more attention-grabbing and action-oriented",
        affectedProps: ["text", "linkText"],
      },
    ],
    suggestions: [],
    promptContext: {
      roleHint: "Announcement bars communicate urgent messages",
      bestPractices: ["Short and clear", "Single call to action"],
      avoidPatterns: ["Too long", "Multiple messages"],
    },
    templates: [],
  },
  
  SocialProof: {
    description: "Social proof indicators",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["type", "count", "text"],
      styles: [],
      content: ["text"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Social proof builds trust",
      bestPractices: ["Real numbers", "Relevant metrics"],
      avoidPatterns: ["Fake numbers", "Irrelevant stats"],
    },
    templates: [],
  },
  
  TrustBadges: {
    description: "Trust badges and certifications",
    category: "content",
    capability: "basic",
    canModify: {
      props: ["badges"],
      styles: [],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Trust badges increase credibility",
      bestPractices: ["Genuine certifications", "Recognizable badges"],
      avoidPatterns: ["Fake badges", "Too many"],
    },
    templates: [],
  },
  
  ComparisonTable: {
    description: "Feature comparison table",
    category: "content",
    capability: "advanced",
    canModify: {
      props: ["title", "features", "plans"],
      styles: ["backgroundColor"],
      content: ["title", "features"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Comparison tables help decision making",
      bestPractices: ["Clear categories", "Highlight differences"],
      avoidPatterns: ["Too complex", "Biased comparisons"],
    },
    templates: [],
  },
  
  // =========================================================================
  // E-COMMERCE COMPONENTS
  // =========================================================================
  
  ProductCard: {
    description: "Product display card",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["title", "description", "price", "image", "link"],
      styles: [],
      content: ["title", "description"],
      layout: false,
      children: false,
    },
    actions: [
      {
        id: "improve-product",
        label: "Improve Copy",
        icon: "✨",
        description: "Enhance product description",
        type: "text-improvement",
        prompt: "Improve the product title and description to be more compelling and conversion-focused",
        affectedProps: ["title", "description"],
      },
    ],
    suggestions: [],
    promptContext: {
      roleHint: "Product cards drive purchases",
      bestPractices: ["Clear pricing", "Quality images", "Compelling descriptions"],
      avoidPatterns: ["Missing info", "Poor images"],
    },
    templates: [],
  },
  
  ProductGrid: {
    description: "Grid of product cards",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["products", "columns"],
      styles: [],
      content: [],
      layout: true,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Product grids showcase inventory",
      bestPractices: ["Consistent card sizes", "Clear organization"],
      avoidPatterns: ["Overcrowded", "Inconsistent styling"],
    },
    templates: [],
  },
  
  ProductCategories: {
    description: "Product category navigation",
    category: "navigation",
    capability: "standard",
    canModify: {
      props: ["categories"],
      styles: [],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Categories help users find products",
      bestPractices: ["Clear labels", "Logical organization"],
      avoidPatterns: ["Too many categories", "Confusing names"],
    },
    templates: [],
  },
  
  CartSummary: {
    description: "Shopping cart summary",
    category: "interactive",
    capability: "standard",
    canModify: {
      props: ["showSubtotal", "checkoutText"],
      styles: [],
      content: ["checkoutText"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Cart summary drives checkout",
      bestPractices: ["Clear totals", "Obvious checkout button"],
      avoidPatterns: ["Hidden fees", "Unclear pricing"],
    },
    templates: [],
  },
  
  FeaturedProducts: {
    description: "Featured products showcase",
    category: "content",
    capability: "standard",
    canModify: {
      props: ["title", "products"],
      styles: [],
      content: ["title"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Featured products highlight bestsellers",
      bestPractices: ["Curated selection", "Clear value proposition"],
      avoidPatterns: ["Random selection", "Too many products"],
    },
    templates: [],
  },
  
  CartIcon: {
    description: "Shopping cart icon with count",
    category: "interactive",
    capability: "basic",
    canModify: {
      props: ["showCount"],
      styles: [],
      content: [],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Cart icon provides quick access to cart",
      bestPractices: ["Clear count indicator", "Easy to find"],
      avoidPatterns: ["Hidden location", "Unclear state"],
    },
    templates: [],
  },
  
  CodeBlock: {
    description: "Code display with syntax highlighting",
    category: "content",
    capability: "basic",
    canModify: {
      props: ["code", "language", "showLineNumbers"],
      styles: [],
      content: ["code"],
      layout: false,
      children: false,
    },
    actions: [],
    suggestions: [],
    promptContext: {
      roleHint: "Code blocks display technical content",
      bestPractices: ["Proper syntax highlighting", "Readable formatting"],
      avoidPatterns: ["No highlighting", "Overlong blocks"],
    },
    templates: [],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get AI config for a component type
 */
export function getAIConfig(componentType: string): AIComponentConfig | null {
  return AI_COMPONENT_CONFIGS[componentType] || null;
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
export function getSuggestions(componentType: string, props: Record<string, unknown>): string[] {
  const config = getAIConfig(componentType);
  if (!config) return [];
  
  return config.suggestions
    .filter((s) => s.condition(props))
    .map((s) => s.message);
}

/**
 * Get actionable suggestions with their action IDs
 */
export function getActionableSuggestions(
  componentType: string, 
  props: Record<string, unknown>
): Array<{ message: string; action?: string }> {
  const config = getAIConfig(componentType);
  if (!config) return [];
  
  return config.suggestions
    .filter((s) => s.condition(props))
    .map((s) => ({ message: s.message, action: s.action }));
}

/**
 * Build AI prompt with context
 */
export function buildAIPrompt(
  componentType: string,
  basePrompt: string,
  currentProps: Record<string, unknown>
): string {
  const config = getAIConfig(componentType);
  if (!config) return basePrompt;
  
  const context = config.promptContext;
  const bestPractices = context.bestPractices.length > 0 
    ? `Guidelines:\n- ${context.bestPractices.join("\n- ")}` 
    : "";
  const avoidPatterns = context.avoidPatterns.length > 0 
    ? `Avoid:\n- ${context.avoidPatterns.join("\n- ")}` 
    : "";
  
  return `
Component: ${componentType}
Role: ${context.roleHint}

Current State:
${JSON.stringify(currentProps, null, 2)}

${bestPractices}

${avoidPatterns}

Task: ${basePrompt}

Respond with ONLY a JSON object containing the updated props.
`.trim();
}

/**
 * Check if a component type has AI capabilities
 */
export function hasAICapabilities(componentType: string): boolean {
  const config = getAIConfig(componentType);
  return config !== null && (config.actions.length > 0 || config.suggestions.length > 0);
}

/**
 * Get all component types with AI capabilities
 */
export function getAIEnabledComponentTypes(): string[] {
  return Object.keys(AI_COMPONENT_CONFIGS).filter(hasAICapabilities);
}
