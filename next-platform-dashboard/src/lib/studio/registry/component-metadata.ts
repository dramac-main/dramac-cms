/**
 * Server-Compatible Component Metadata
 * 
 * This file contains component type information without React renders,
 * allowing it to be imported in server contexts (API routes).
 * 
 * Used by AI Page Generator to know what components are available.
 */

import type { ComponentCategory } from "@/types/studio";

export interface ComponentMetadata {
  type: string;
  label: string;
  category: ComponentCategory;
  description?: string;
  acceptsChildren: boolean;
  keywords?: string[];
  ai?: {
    description?: string;
    usageGuidelines?: string;
    suggestedWith?: string[];
  };
}

/**
 * All available core components with metadata
 * This list should match core-components.ts
 */
export const COMPONENT_METADATA: ComponentMetadata[] = [
  // ==========================================================================
  // LAYOUT
  // ==========================================================================
  {
    type: "Section",
    label: "Section",
    category: "layout",
    description: "Container section with background options",
    acceptsChildren: true,
    keywords: ["section", "container", "wrapper", "block"],
    ai: {
      description: "Primary container for page sections with padding and background options",
      usageGuidelines: "Use to create distinct content blocks",
      suggestedWith: ["Container", "Heading", "Text"],
    },
  },
  {
    type: "Container",
    label: "Container",
    category: "layout",
    description: "Centered container with max width",
    acceptsChildren: true,
    keywords: ["container", "wrapper", "center"],
    ai: {
      description: "Centers content with configurable max width",
      usageGuidelines: "Use inside Section for centered layouts",
    },
  },
  {
    type: "Columns",
    label: "Columns",
    category: "layout",
    description: "Multi-column layout grid",
    acceptsChildren: true,
    keywords: ["columns", "grid", "layout", "side by side"],
    ai: {
      description: "Create multi-column layouts (2-4 columns)",
      usageGuidelines: "Ideal for feature grids, team sections, and comparisons",
    },
  },
  {
    type: "Card",
    label: "Card",
    category: "layout",
    description: "Content card with border and shadow",
    acceptsChildren: true,
    keywords: ["card", "box", "panel"],
    ai: {
      description: "Elevated container for grouped content",
      usageGuidelines: "Use for feature highlights, testimonials, or grouped info",
    },
  },
  {
    type: "Spacer",
    label: "Spacer",
    category: "layout",
    description: "Vertical spacing element",
    acceptsChildren: false,
    keywords: ["spacer", "gap", "margin"],
    ai: {
      description: "Adds vertical space between elements",
      usageGuidelines: "Use sparingly between major sections",
    },
  },
  {
    type: "Divider",
    label: "Divider",
    category: "layout",
    description: "Horizontal divider line",
    acceptsChildren: false,
    keywords: ["divider", "line", "separator", "hr"],
    ai: {
      description: "Horizontal line to separate content sections",
    },
  },

  // ==========================================================================
  // TYPOGRAPHY
  // ==========================================================================
  {
    type: "Heading",
    label: "Heading",
    category: "typography",
    description: "Text heading H1-H6",
    acceptsChildren: false,
    keywords: ["heading", "title", "h1", "h2", "h3"],
    ai: {
      description: "Headline text from H1 to H6",
      usageGuidelines: "Use H1 for page title, H2 for sections, H3 for subsections",
    },
  },
  {
    type: "Text",
    label: "Text",
    category: "typography",
    description: "Body text paragraph",
    acceptsChildren: false,
    keywords: ["text", "paragraph", "body", "content"],
    ai: {
      description: "Body text paragraph with configurable styling",
      usageGuidelines: "Use for descriptions, explanations, and body content",
    },
  },

  // ==========================================================================
  // BUTTONS
  // ==========================================================================
  {
    type: "Button",
    label: "Button",
    category: "buttons",
    description: "Clickable button with link",
    acceptsChildren: false,
    keywords: ["button", "cta", "link", "action"],
    ai: {
      description: "Call-to-action button with customizable styles",
      usageGuidelines: "Use for primary actions, CTAs, and navigation",
    },
  },

  // ==========================================================================
  // MEDIA
  // ==========================================================================
  {
    type: "Image",
    label: "Image",
    category: "media",
    description: "Image with alt text",
    acceptsChildren: false,
    keywords: ["image", "photo", "picture", "img"],
    ai: {
      description: "Responsive image with alt text support",
      usageGuidelines: "Always include descriptive alt text",
    },
  },
  {
    type: "Video",
    label: "Video",
    category: "media",
    description: "Embedded video player",
    acceptsChildren: false,
    keywords: ["video", "youtube", "vimeo", "embed"],
    ai: {
      description: "Video player supporting YouTube, Vimeo, and direct URLs",
    },
  },
  {
    type: "Map",
    label: "Map",
    category: "media",
    description: "Embedded Google Map",
    acceptsChildren: false,
    keywords: ["map", "location", "google maps", "address"],
    ai: {
      description: "Embedded Google Maps iframe",
      usageGuidelines: "Use for contact pages and location display",
    },
  },

  // ==========================================================================
  // SECTIONS (Pre-built)
  // ==========================================================================
  {
    type: "Hero",
    label: "Hero Section",
    category: "sections",
    description: "Full hero section with headline and CTA",
    acceptsChildren: false,
    keywords: ["hero", "banner", "header", "jumbotron"],
    ai: {
      description: "Full-width hero with headline, subheadline, image, and CTA buttons",
      usageGuidelines: "Use as first section on landing pages",
      suggestedWith: ["Features", "CTA"],
    },
  },
  {
    type: "Features",
    label: "Features Grid",
    category: "sections",
    description: "Feature cards grid",
    acceptsChildren: false,
    keywords: ["features", "benefits", "services", "grid"],
    ai: {
      description: "Grid of feature/benefit cards with icons",
      usageGuidelines: "Use to highlight key features or services",
    },
  },
  {
    type: "CTA",
    label: "Call to Action",
    category: "sections",
    description: "Call-to-action section",
    acceptsChildren: false,
    keywords: ["cta", "action", "signup", "convert"],
    ai: {
      description: "Prominent call-to-action section with button",
      usageGuidelines: "Place after value proposition sections",
    },
  },
  {
    type: "Testimonials",
    label: "Testimonials",
    category: "sections",
    description: "Customer testimonials",
    acceptsChildren: false,
    keywords: ["testimonials", "reviews", "quotes", "social proof"],
    ai: {
      description: "Customer testimonial cards with quotes and attribution",
      usageGuidelines: "Use for social proof, typically after features",
    },
  },
  {
    type: "FAQ",
    label: "FAQ",
    category: "sections",
    description: "Frequently asked questions",
    acceptsChildren: false,
    keywords: ["faq", "questions", "help", "support"],
    ai: {
      description: "Collapsible FAQ accordion",
      usageGuidelines: "Use to address common concerns and questions",
    },
  },
  {
    type: "Stats",
    label: "Statistics",
    category: "sections",
    description: "Statistics counter section",
    acceptsChildren: false,
    keywords: ["stats", "numbers", "metrics", "counters"],
    ai: {
      description: "Statistics/metrics display with large numbers",
      usageGuidelines: "Use to showcase achievements and social proof",
    },
  },
  {
    type: "Team",
    label: "Team Grid",
    category: "sections",
    description: "Team member cards",
    acceptsChildren: false,
    keywords: ["team", "staff", "people", "about"],
    ai: {
      description: "Grid of team member cards with photos and bios",
      usageGuidelines: "Use on about pages to introduce team",
    },
  },
  {
    type: "Gallery",
    label: "Gallery",
    category: "sections",
    description: "Image gallery grid",
    acceptsChildren: false,
    keywords: ["gallery", "images", "photos", "portfolio"],
    ai: {
      description: "Responsive image gallery grid",
      usageGuidelines: "Use for portfolios, product showcases, or photo galleries",
    },
  },

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  {
    type: "Navbar",
    label: "Navigation Bar",
    category: "navigation",
    description: "Site navigation header",
    acceptsChildren: false,
    keywords: ["navbar", "header", "menu", "navigation"],
    ai: {
      description: "Site header with logo and navigation links",
      usageGuidelines: "Place at the top of every page",
    },
  },
  {
    type: "Footer",
    label: "Footer",
    category: "navigation",
    description: "Site footer with links",
    acceptsChildren: false,
    keywords: ["footer", "bottom", "links"],
    ai: {
      description: "Site footer with navigation, social links, and copyright",
      usageGuidelines: "Place at the bottom of every page",
    },
  },
  {
    type: "SocialLinks",
    label: "Social Links",
    category: "navigation",
    description: "Social media link icons",
    acceptsChildren: false,
    keywords: ["social", "facebook", "twitter", "instagram", "linkedin"],
    ai: {
      description: "Row of social media icon links",
      usageGuidelines: "Use in footer or contact sections",
    },
  },

  // ==========================================================================
  // FORMS
  // ==========================================================================
  {
    type: "Form",
    label: "Form",
    category: "forms",
    description: "Form container",
    acceptsChildren: true,
    keywords: ["form", "input", "submit"],
    ai: {
      description: "Form wrapper with submit handling",
      usageGuidelines: "Use with FormField children",
    },
  },
  {
    type: "FormField",
    label: "Form Field",
    category: "forms",
    description: "Form input field",
    acceptsChildren: false,
    keywords: ["input", "field", "text", "email"],
    ai: {
      description: "Individual form input (text, email, textarea, etc.)",
    },
  },
  {
    type: "ContactForm",
    label: "Contact Form",
    category: "forms",
    description: "Pre-built contact form",
    acceptsChildren: false,
    keywords: ["contact", "form", "email", "message"],
    ai: {
      description: "Complete contact form with name, email, and message fields",
      usageGuidelines: "Use on contact pages",
    },
  },
  {
    type: "Newsletter",
    label: "Newsletter Signup",
    category: "forms",
    description: "Email newsletter form",
    acceptsChildren: false,
    keywords: ["newsletter", "email", "signup", "subscribe"],
    ai: {
      description: "Email subscription form for newsletters",
      usageGuidelines: "Use in footer or as standalone CTA",
    },
  },

  // ==========================================================================
  // CONTENT
  // ==========================================================================
  {
    type: "RichText",
    label: "Rich Text",
    category: "content",
    description: "Rich text content block",
    acceptsChildren: false,
    keywords: ["rich text", "html", "content", "wysiwyg"],
    ai: {
      description: "Rich text block supporting formatted content",
    },
  },
  {
    type: "Quote",
    label: "Quote",
    category: "content",
    description: "Blockquote with attribution",
    acceptsChildren: false,
    keywords: ["quote", "blockquote", "citation"],
    ai: {
      description: "Styled blockquote with optional attribution",
    },
  },
  {
    type: "CodeBlock",
    label: "Code Block",
    category: "content",
    description: "Syntax highlighted code",
    acceptsChildren: false,
    keywords: ["code", "snippet", "programming"],
    ai: {
      description: "Code block with syntax highlighting",
      usageGuidelines: "Use for technical content and documentation",
    },
  },

  // ==========================================================================
  // INTERACTIVE
  // ==========================================================================
  {
    type: "Carousel",
    label: "Carousel",
    category: "interactive",
    description: "Image/content carousel",
    acceptsChildren: false,
    keywords: ["carousel", "slider", "slideshow"],
    ai: {
      description: "Rotating carousel for images or content slides",
    },
  },
  {
    type: "Countdown",
    label: "Countdown",
    category: "interactive",
    description: "Countdown timer",
    acceptsChildren: false,
    keywords: ["countdown", "timer", "launch", "event"],
    ai: {
      description: "Countdown timer to a specific date",
      usageGuidelines: "Use for launches, events, and limited offers",
    },
  },
  {
    type: "Typewriter",
    label: "Typewriter",
    category: "interactive",
    description: "Animated typewriter text",
    acceptsChildren: false,
    keywords: ["typewriter", "animation", "typing"],
    ai: {
      description: "Animated typing effect for text",
      usageGuidelines: "Use sparingly in hero sections",
    },
  },
  {
    type: "Parallax",
    label: "Parallax Section",
    category: "interactive",
    description: "Parallax scrolling section",
    acceptsChildren: true,
    keywords: ["parallax", "scroll", "effect"],
    ai: {
      description: "Section with parallax background scrolling effect",
    },
  },

  // ==========================================================================
  // MARKETING
  // ==========================================================================
  {
    type: "AnnouncementBar",
    label: "Announcement Bar",
    category: "marketing",
    description: "Top page announcement",
    acceptsChildren: false,
    keywords: ["announcement", "banner", "promo", "alert"],
    ai: {
      description: "Top-of-page announcement banner",
      usageGuidelines: "Use for promotions, alerts, or important announcements",
    },
  },
  {
    type: "SocialProof",
    label: "Social Proof",
    category: "marketing",
    description: "User/customer count display",
    acceptsChildren: false,
    keywords: ["social proof", "users", "customers", "trust"],
    ai: {
      description: "Display customer/user counts for credibility",
    },
  },
  {
    type: "TrustBadges",
    label: "Trust Badges",
    category: "marketing",
    description: "Trust and security badges",
    acceptsChildren: false,
    keywords: ["trust", "badges", "security", "certifications"],
    ai: {
      description: "Row of trust/security badges",
      usageGuidelines: "Use near forms and checkout areas",
    },
  },
  {
    type: "LogoCloud",
    label: "Logo Cloud",
    category: "marketing",
    description: "Client/partner logos grid",
    acceptsChildren: false,
    keywords: ["logos", "clients", "partners", "brands"],
    ai: {
      description: "Grid of client/partner logos",
      usageGuidelines: "Use for social proof - 'Trusted by...'",
    },
  },
  {
    type: "ComparisonTable",
    label: "Comparison Table",
    category: "marketing",
    description: "Feature comparison table",
    acceptsChildren: false,
    keywords: ["comparison", "table", "pricing", "features"],
    ai: {
      description: "Table comparing features across options",
      usageGuidelines: "Use for pricing pages and product comparisons",
    },
  },

  // ==========================================================================
  // E-COMMERCE
  // ==========================================================================
  {
    type: "ProductGrid",
    label: "Product Grid",
    category: "ecommerce",
    description: "Grid of products",
    acceptsChildren: false,
    keywords: ["products", "shop", "store", "catalog"],
    ai: {
      description: "Responsive grid of product cards",
      usageGuidelines: "Use on shop/store pages",
    },
  },
  {
    type: "ProductCard",
    label: "Product Card",
    category: "ecommerce",
    description: "Single product card",
    acceptsChildren: false,
    keywords: ["product", "item", "card"],
    ai: {
      description: "Individual product card with image, price, and CTA",
    },
  },
  {
    type: "ProductCategories",
    label: "Product Categories",
    category: "ecommerce",
    description: "Category cards grid",
    acceptsChildren: false,
    keywords: ["categories", "collections", "departments"],
    ai: {
      description: "Grid of product category cards",
    },
  },
  {
    type: "CartSummary",
    label: "Cart Summary",
    category: "ecommerce",
    description: "Shopping cart summary",
    acceptsChildren: false,
    keywords: ["cart", "basket", "checkout", "summary"],
    ai: {
      description: "Shopping cart summary component",
    },
  },
  {
    type: "FeaturedProducts",
    label: "Featured Products",
    category: "ecommerce",
    description: "Featured products section",
    acceptsChildren: false,
    keywords: ["featured", "popular", "bestsellers"],
    ai: {
      description: "Showcase of featured/popular products",
    },
  },
  {
    type: "CartIcon",
    label: "Cart Icon",
    category: "ecommerce",
    description: "Shopping cart icon with count",
    acceptsChildren: false,
    keywords: ["cart", "icon", "basket"],
    ai: {
      description: "Cart icon button with item count badge",
      usageGuidelines: "Use in navigation header",
    },
  },
];

/**
 * Get component metadata by type
 */
export function getComponentMetadata(type: string): ComponentMetadata | undefined {
  return COMPONENT_METADATA.find(c => c.type === type);
}

/**
 * Get all component types as a simple list
 */
export function getAvailableComponentTypes(): string[] {
  return COMPONENT_METADATA.map(c => c.type);
}

/**
 * Get component metadata for AI prompts (compatible with ComponentDefinition interface)
 */
export function getComponentsForAI(): Array<{
  type: string;
  label: string;
  category: string;
  description?: string;
  acceptsChildren: boolean;
  keywords?: string[];
  ai?: {
    description?: string;
    usageGuidelines?: string;
    suggestedWith?: string[];
  };
}> {
  return COMPONENT_METADATA;
}
