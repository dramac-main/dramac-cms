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
      description:
        "Primary container for page sections with padding and background options",
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
      usageGuidelines:
        "Ideal for feature grids, team sections, and comparisons",
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
      usageGuidelines:
        "Use for feature highlights, testimonials, or grouped info",
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

  // --- Phase 2: Advanced Layout Components ---
  {
    type: "Stack",
    label: "Stack",
    category: "layout",
    description:
      "Vertical or horizontal stack with responsive direction and gap",
    acceptsChildren: true,
    keywords: ["stack", "vstack", "hstack", "flex", "column", "row", "layout"],
    ai: {
      description:
        "Arranges children vertically or horizontally with consistent spacing. Supports responsive direction (column on mobile, row on desktop) and dividers between items.",
      usageGuidelines:
        "Use for simple linear layouts: vertical content stacks, horizontal button groups, icon+text pairs. Prefer over FlexBox when you only need direction + gap.",
      suggestedWith: ["Card", "Button", "Heading", "Text"],
    },
  },
  {
    type: "FlexBox",
    label: "FlexBox",
    category: "layout",
    description:
      "Full flexbox container with wrap, alignment, and responsive gap",
    acceptsChildren: true,
    keywords: ["flexbox", "flex", "row", "wrap", "align", "justify", "layout"],
    ai: {
      description:
        "A full-featured flexbox container supporting direction, wrap, justify-content, align-items, and responsive gap. Use when you need wrapping behavior or advanced alignment that Stack doesn't cover.",
      usageGuidelines:
        "Use for tag clouds, button groups that wrap, centered hero content, or any layout needing flex-wrap. Prefer over Grid when item count is dynamic.",
      suggestedWith: ["Card", "Button", "Badge"],
    },
  },
  {
    type: "Grid",
    label: "Grid",
    category: "layout",
    description: "CSS Grid container with responsive columns and gap",
    acceptsChildren: true,
    keywords: ["grid", "columns", "layout", "responsive", "masonry"],
    ai: {
      description:
        "CSS Grid layout with responsive column counts (e.g., 1 col mobile, 2 tablet, 3 desktop), customizable gap, and auto-fit/auto-fill modes. Perfect for card grids and dashboards.",
      usageGuidelines:
        "Use for equal-width card grids, image galleries, pricing tables, and feature grids where precise column control is needed. Contains GridItem children for per-cell span control.",
      suggestedWith: ["GridItem", "Card"],
    },
  },
  {
    type: "GridItem",
    label: "Grid Item",
    category: "layout",
    description: "Grid child with column/row span control",
    acceptsChildren: true,
    keywords: ["grid item", "grid cell", "span", "column span", "row span"],
    ai: {
      description:
        "A Grid child that can span multiple columns or rows. Use inside a Grid to create featured/larger cells.",
      usageGuidelines:
        "Place inside Grid. Use colSpan/rowSpan for featured items (e.g., a hero card spanning 2 columns).",
      suggestedWith: ["Grid"],
    },
  },
  {
    type: "Wrapper",
    label: "Wrapper",
    category: "layout",
    description:
      "Utility wrapper with padding, margin, background, and border control",
    acceptsChildren: true,
    keywords: ["wrapper", "box", "div", "container", "padding", "margin"],
    ai: {
      description:
        "A generic utility wrapper for adding padding, margin, background, borders, or click actions around any content. The CSS 'div' equivalent in the visual builder.",
      usageGuidelines:
        "Use when you need fine-grained spacing/styling control around a group of elements without semantic meaning. Good for adding click-to-link behavior to a group.",
      suggestedWith: ["Card", "Section"],
    },
  },
  {
    type: "AspectRatioBox",
    label: "Aspect Ratio Box",
    category: "layout",
    description: "Container that maintains a fixed aspect ratio",
    acceptsChildren: true,
    keywords: ["aspect ratio", "ratio", "16:9", "4:3", "square", "video frame"],
    ai: {
      description:
        "Maintains a fixed aspect ratio (16:9, 4:3, 1:1, etc.) regardless of content or screen size. Content is absolutely positioned inside and can overflow-hidden.",
      usageGuidelines:
        "Use for video embeds, image placeholders, hero banners, or any element that must maintain proportions. Supports custom ratios via width:height string.",
      suggestedWith: ["Image", "Video"],
    },
  },
  {
    type: "Overlay",
    label: "Overlay",
    category: "layout",
    description: "Positioned overlay layer on top of parent content",
    acceptsChildren: true,
    keywords: ["overlay", "absolute", "floating", "badge", "label", "position"],
    ai: {
      description:
        "A positioned overlay that floats on top of sibling content. Supports preset positions (top-left, center, bottom-right, etc.), custom offsets, backdrop blur, and click-through mode.",
      usageGuidelines:
        "Use for floating labels, sale badges, image captions, or decorative elements positioned over other content. Parent should be position:relative.",
      suggestedWith: ["Section", "Card", "Image"],
    },
  },

  // --- Phase 3: Advanced Experience Components ---
  {
    type: "ScrollSection",
    label: "Scroll Section",
    category: "layout",
    description: "Full-page scroll-snap container for immersive storytelling",
    acceptsChildren: true,
    keywords: ["scroll", "snap", "fullpage", "storytelling", "slides", "pages"],
    ai: {
      description:
        "A full-viewport scroll-snap container that creates a slide-by-slide storytelling experience. Each child ScrollSectionItem snaps into view. Supports navigation dots and keyboard navigation.",
      usageGuidelines:
        "Use for landing page hero sequences, product showcases, or immersive brand stories. Each slide should have distinct content and background. 3-7 slides recommended.",
      suggestedWith: ["ScrollSectionItem"],
    },
  },
  {
    type: "ScrollSectionItem",
    label: "Scroll Section Item",
    category: "layout",
    description: "Individual slide within a ScrollSection",
    acceptsChildren: true,
    keywords: ["scroll item", "slide", "snap item", "page"],
    ai: {
      description:
        "A single full-viewport slide inside a ScrollSection. Each item fills the viewport height and snaps into place during scrolling.",
      usageGuidelines:
        "Place inside ScrollSection only. Set unique backgroundColor and content per slide. Can contain any components.",
      suggestedWith: ["ScrollSection"],
    },
  },
  {
    type: "StickyContainer",
    label: "Sticky Container",
    category: "layout",
    description: "Sticky-positioned container for scroll storytelling",
    acceptsChildren: true,
    keywords: ["sticky", "fixed", "scroll", "storytelling", "pin"],
    ai: {
      description:
        "A container that sticks to a position while the user scrolls through its content region. Great for scroll-driven storytelling where a visual stays fixed while text content scrolls past.",
      usageGuidelines:
        "Use for scroll-driven narratives: a sticky image/video on one side while text paragraphs scroll on the other. Set stickyOffset for top position.",
      suggestedWith: ["Section", "Image"],
    },
  },
  {
    type: "Animate",
    label: "Animate",
    category: "layout",
    description: "Universal animation wrapper with scroll and hover triggers",
    acceptsChildren: true,
    keywords: [
      "animate",
      "animation",
      "motion",
      "fade",
      "slide",
      "scale",
      "scroll trigger",
    ],
    ai: {
      description:
        "Wraps any content with entrance animations (fade, slide, scale, rotate, blur, bounce, flip) triggered on scroll-into-view or hover. Supports delay, duration, easing, and stagger for child elements.",
      usageGuidelines:
        "Use to add polish to any section. Wrap headings, cards, images, or entire sections. Use stagger for lists/grids where items should animate in sequence. Keep animations subtle for professionalism.",
      suggestedWith: ["Card", "Heading", "Features"],
    },
  },
  {
    type: "Tilt3DContainer",
    label: "3D Tilt Container",
    category: "layout",
    description: "Interactive 3D tilt effect on hover with perspective",
    acceptsChildren: true,
    keywords: ["tilt", "3d", "perspective", "interactive", "hover", "parallax"],
    ai: {
      description:
        "Applies an interactive 3D tilt effect on mouse hover, with configurable max tilt angle, perspective, glare effect, and scale. Creates a premium, tactile feel.",
      usageGuidelines:
        "Use on cards, product images, or hero elements for premium interactivity. Keep maxTilt modest (10-20deg) for elegance. Works best on individual cards rather than large sections.",
      suggestedWith: ["Card", "Image"],
    },
  },
  {
    type: "ShapeDivider",
    label: "Shape Divider",
    category: "layout",
    description: "SVG shape divider between sections",
    acceptsChildren: false,
    keywords: ["shape", "divider", "wave", "curve", "arrow", "triangle", "svg"],
    ai: {
      description:
        "An SVG shape divider that creates smooth visual transitions between sections. Shapes include wave, curve, tilt, arrow, triangle, zigzag, and more. Color should match the adjacent section's background.",
      usageGuidelines:
        "Place between sections to create flowing visual transitions. Set color to match the NEXT section's backgroundColor. Set position to 'top' or 'bottom'. Height 40-80px typical.",
      suggestedWith: ["Section"],
    },
  },
  {
    type: "CursorEffect",
    label: "Cursor Effect",
    category: "layout",
    description: "Interactive cursor effects like glow, spotlight, and trail",
    acceptsChildren: true,
    keywords: ["cursor", "mouse", "glow", "spotlight", "trail", "interactive"],
    ai: {
      description:
        "Adds interactive cursor-following effects to a container: glow (radial light), spotlight (focused beam), trail (particle trail), magnetic (element attraction), ripple (click waves). Creates engaging interactivity.",
      usageGuidelines:
        "Use on hero sections or feature showcases for wow factor. Glow and spotlight work best on dark backgrounds. Keep subtle — one per page maximum.",
      suggestedWith: ["Section", "Hero"],
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
      usageGuidelines:
        "Use H1 for page title, H2 for sections, H3 for subsections",
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
      description:
        "Full-width hero with headline, subheadline, image, and CTA buttons",
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
      usageGuidelines:
        "Use for portfolios, product showcases, or photo galleries",
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
  {
    type: "Label",
    label: "Label",
    category: "content",
    description: "Small utility text for tags, badges, categories, and overlines",
    acceptsChildren: false,
    keywords: ["label", "tag", "badge", "pill", "overline", "category"],
    ai: {
      description: "Small utility text element with 7 variants: default, badge, overline, tag, pill, outline, subtle",
      usageGuidelines: "Use above headings as overlines, as category tags, or as status badges",
    },
  },
  {
    type: "List",
    label: "List",
    category: "content",
    description: "Styled list with bullet, numbered, check, arrow, and dash variants",
    acceptsChildren: false,
    keywords: ["list", "bullet", "numbered", "checklist", "items"],
    ai: {
      description: "Styled list component with 7 marker variants and multi-column support",
      usageGuidelines: "Use for feature lists, benefits, steps, and checklists",
    },
  },
  {
    type: "DisplayText",
    label: "Display Text",
    category: "content",
    description: "Large decorative display text for hero sections",
    acceptsChildren: false,
    keywords: ["display", "hero text", "large text", "decorative", "title"],
    ai: {
      description: "Extra-large decorative text for hero sections with gradient and shadow support",
      usageGuidelines: "Use for dramatic hero headings, landing page titles, and splash text. Typically 4xl-9xl size.",
    },
  },
  {
    type: "DividerText",
    label: "Divider Text",
    category: "content",
    description: "Text with decorative divider lines",
    acceptsChildren: false,
    keywords: ["divider", "separator", "section break", "ornament"],
    ai: {
      description: "Text element with decorative lines in 5 variants: line-sides, line-through, dots, gradient, ornament",
      usageGuidelines: "Use as section separators, visual breaks between content areas",
    },
  },
  {
    type: "StatNumber",
    label: "Stat Number",
    category: "content",
    description: "Large statistics/metrics display",
    acceptsChildren: false,
    keywords: ["stat", "number", "metric", "counter", "statistic"],
    ai: {
      description: "Large statistic display with value, prefix, suffix, and label using tabular-nums for aligned numbers",
      usageGuidelines: "Use for key metrics, achievements, and data points. Combine multiple in a row for stats sections.",
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
export function getComponentMetadata(
  type: string,
): ComponentMetadata | undefined {
  return COMPONENT_METADATA.find((c) => c.type === type);
}

/**
 * Get all component types as a simple list
 */
export function getAvailableComponentTypes(): string[] {
  return COMPONENT_METADATA.map((c) => c.type);
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
