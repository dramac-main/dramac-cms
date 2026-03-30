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
    type: "Accordion",
    label: "Accordion",
    category: "sections",
    description: "Expandable content accordion with multiple variants",
    acceptsChildren: false,
    keywords: ["accordion", "expand", "collapse", "faq", "toggle", "details"],
    ai: {
      description:
        "Expandable accordion section with bordered, filled, separated, and minimal variants. Supports badge, section header, dark mode, and custom padding.",
      usageGuidelines:
        "Use for FAQ sections, expandable content, or any collapsible information blocks",
    },
  },
  {
    type: "Pricing",
    label: "Pricing",
    category: "sections",
    description: "Pricing plans with billing toggle and feature comparison",
    acceptsChildren: false,
    keywords: [
      "pricing",
      "plans",
      "subscription",
      "billing",
      "tiers",
      "packages",
    ],
    ai: {
      description:
        "Pricing section with monthly/yearly billing toggle, plan cards with feature lists, highlighted recommended plan, and guarantee badge. Supports dark mode.",
      usageGuidelines:
        "Use to display pricing tiers, subscription plans, or service packages with clear comparison",
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
  {
    type: "Tabs",
    label: "Tabs",
    category: "interactive",
    description: "Tabbed content panels with multiple layout variants",
    acceptsChildren: false,
    keywords: [
      "tabs",
      "tab panel",
      "tabbed content",
      "tab navigation",
      "tab bar",
      "tab group",
    ],
    ai: {
      description:
        "Tabbed content organizer with 7 variants (underline, pills, boxed, enclosed, soft, minimal, lifted), vertical/horizontal layout, ARIA tablist pattern, keyboard navigation, and optional icons/badges per tab.",
      usageGuidelines:
        "Use for organizing related content into switchable panels. Provide tabs array with label and content. Set variant to match page style. Supports up to 8 tabs.",
      suggestedWith: ["Section", "Card", "Heading"],
    },
  },

  // ==========================================================================
  // FORMS
  // ==========================================================================
  {
    type: "Form",
    label: "Form",
    category: "forms",
    description:
      "Premium form container with submission pipeline, validation states, and flexible layouts",
    acceptsChildren: true,
    keywords: ["form", "input", "submit", "container", "layout", "grid"],
    ai: {
      description:
        "Form wrapper with built-in submit button, success/error states, optional platform submission via /api/forms/submit, animations, and 5 layout modes (vertical, horizontal, inline, grid-2, grid-3).",
      usageGuidelines:
        "Use with FormField children. Enable enablePlatformSubmission to store submissions in the platform. Set layout to grid-2 for side-by-side fields.",
      suggestedWith: ["FormField"],
    },
  },
  {
    type: "FormField",
    label: "Form Field",
    category: "forms",
    description:
      "Versatile form input supporting text, email, textarea, select, checkbox, radio, password, file, and more",
    acceptsChildren: false,
    keywords: [
      "input",
      "field",
      "text",
      "email",
      "textarea",
      "select",
      "checkbox",
      "radio",
      "password",
      "file",
      "form input",
    ],
    ai: {
      description:
        "Individual form input with 12+ types, 4 variants (default, filled, underline, ghost), icons, prefix/suffix, character counter, password toggle, clear button, and full colour customisation. ARIA-compliant with aria-required, aria-invalid, and aria-describedby.",
      usageGuidelines:
        "Place inside a Form component. Set type for the input kind. Use variant to match the form's visual style.",
      suggestedWith: ["Form"],
    },
  },
  {
    type: "ContactForm",
    label: "Contact Form",
    category: "forms",
    description:
      "Pre-built contact form with name, email, phone, subject, and message fields",
    acceptsChildren: false,
    keywords: [
      "contact",
      "form",
      "email",
      "message",
      "enquiry",
      "inquiry",
      "get in touch",
    ],
    ai: {
      description:
        "Complete contact form with fetch-based submission to /api/forms/submit, honeypot spam protection, success/error states, customisable field labels, full colour theming, and dark-mode aware styling.",
      usageGuidelines:
        "Use on contact pages. Set emailTo to override notification recipient. Toggle showPhone and showSubject for optional fields.",
    },
  },
  {
    type: "Newsletter",
    label: "Newsletter Signup",
    category: "forms",
    description:
      "Email newsletter signup form with inline, stacked, and card layouts",
    acceptsChildren: false,
    keywords: [
      "newsletter",
      "email",
      "signup",
      "subscribe",
      "mailing list",
      "opt-in",
    ],
    ai: {
      description:
        "Email subscription form with fetch-based submission to /api/forms/submit, honeypot spam protection, 3 variants (inline, stacked, card), 3 sizes, success/error states, and full colour customisation.",
      usageGuidelines:
        "Use in footer, hero section, or as standalone CTA. Set variant to card for emphasis, inline for compact placement.",
    },
  },

  // ==========================================================================
  // CONTENT
  // ==========================================================================
  {
    type: "RichText",
    label: "Rich Text",
    category: "content",
    description:
      "Rich text content section with title, subtitle, layout options, pull quotes, and full typography controls",
    acceptsChildren: false,
    keywords: [
      "rich text",
      "html",
      "content",
      "wysiwyg",
      "article",
      "blog",
      "prose",
      "markdown",
      "body text",
      "long-form",
    ],
    ai: {
      description:
        "Rich text content section with 4 layouts (centered, left, two-column, wide), pull quotes, section titles, and full colour/typography control. Converts markdown to HTML automatically.",
      usageGuidelines:
        "Use for blog posts (layout: left, maxWidth: prose), about pages (layout: centered, proseSize: lg), and editorial content (layout: two-column with pullQuote). Not for short labels or headings — use Heading or DisplayText instead.",
    },
  },
  {
    type: "Quote",
    label: "Quote",
    category: "content",
    description:
      "Blockquote with 6 variants: simple, bordered, card, modern, pullquote, testimonial",
    acceptsChildren: false,
    keywords: [
      "quote",
      "blockquote",
      "citation",
      "testimonial",
      "review",
      "pullquote",
      "attribution",
    ],
    ai: {
      description:
        "Styled blockquote with 6 variants (simple, bordered, card, modern, pullquote, testimonial), author name/image, and 3 size options",
      usageGuidelines:
        "Use testimonial variant with author image for social proof sections. Use pullquote for editorial emphasis in articles. Use bordered as a general-purpose blockquote. Use modern for decorative large quotes.",
    },
  },
  {
    type: "CodeBlock",
    label: "Code Block",
    category: "content",
    description:
      "Syntax highlighted code block with 4 themes, line numbers, copy button, and line highlighting",
    acceptsChildren: false,
    keywords: [
      "code",
      "snippet",
      "programming",
      "syntax",
      "terminal",
      "pre",
      "source code",
      "developer",
    ],
    ai: {
      description:
        "Code block with 4 syntax themes (dark, light, github, monokai), line numbers, copy button, line highlighting, word wrap, and responsive max height. Supports 16 languages.",
      usageGuidelines:
        "Use for technical documentation, tutorials, and API examples. Match theme to page background: github/dark/monokai for dark pages, light for light pages. Add title for filename display. Use highlightLines to draw attention to key lines.",
    },
  },
  {
    type: "Label",
    label: "Label",
    category: "content",
    description:
      "Small utility text for tags, badges, categories, and overlines",
    acceptsChildren: false,
    keywords: [
      "label",
      "tag",
      "badge",
      "pill",
      "overline",
      "category",
      "status",
      "chip",
    ],
    ai: {
      description:
        "Small utility text element with 7 variants: default, badge, overline, tag, pill, outline, subtle. Supports 3 sizes (xs, sm, md) with text transform and letter spacing control.",
      usageGuidelines:
        "Use overline variant above headings as section category labels. Use badge/pill for status indicators. Use tag for content categories. Use outline for subtle bordered tags.",
    },
  },
  {
    type: "List",
    label: "List",
    category: "content",
    description:
      "Styled list with bullet, numbered, check, arrow, dash, icon, and none variants",
    acceptsChildren: false,
    keywords: [
      "list",
      "bullet",
      "numbered",
      "checklist",
      "items",
      "features",
      "benefits",
      "steps",
    ],
    ai: {
      description:
        "Styled list component with 7 marker variants (bullet, numbered, check, arrow, dash, icon, none) and multi-column support (1-3 columns). Uses semantic ol/ul.",
      usageGuidelines:
        "Use check variant with green iconColor for feature/benefit lists. Use numbered for step-by-step guides. Use arrow for navigation-style lists. Use columns: 2 or 3 for compact feature grids.",
    },
  },
  {
    type: "DisplayText",
    label: "Display Text",
    category: "content",
    description:
      "Large decorative display text for hero sections with gradient and shadow support",
    acceptsChildren: false,
    keywords: [
      "display",
      "hero text",
      "large text",
      "decorative",
      "title",
      "splash",
      "gradient text",
    ],
    ai: {
      description:
        "Extra-large decorative text for hero sections with gradient text, text-wrap: balance, text-shadow, and custom font sizing. Uses role=heading for accessibility.",
      usageGuidelines:
        "Use ONLY in hero sections or splash contexts for dramatic impact. Not a replacement for Heading component. Enable gradient for eye-catching colourful text. Use textWrap: balance for even line distribution.",
    },
  },
  {
    type: "DividerText",
    label: "Divider Text",
    category: "content",
    description:
      "Text with decorative divider lines in 5 ornamental variants",
    acceptsChildren: false,
    keywords: [
      "divider",
      "separator",
      "section break",
      "ornament",
      "line",
      "decoration",
    ],
    ai: {
      description:
        "Text element with decorative lines in 5 variants: line-sides, line-through, dots, gradient, ornament. Includes spacing control and text styling.",
      usageGuidelines:
        "Use line-sides for modern sections, ornament for luxury/editorial sites, gradient for creative pages, dots for minimal designs. Place between content sections as visual breaks.",
    },
  },
  {
    type: "StatNumber",
    label: "Stat Number",
    category: "content",
    description:
      "Large statistics/metrics display with prefix, suffix, and label",
    acceptsChildren: false,
    keywords: [
      "stat",
      "number",
      "metric",
      "counter",
      "statistic",
      "achievement",
      "data point",
      "KPI",
    ],
    ai: {
      description:
        "Large statistic display with value, prefix ($, +), suffix (%, K, +), and descriptive label. Uses tabular-nums for aligned digits. Supports stacked and inline layouts.",
      usageGuidelines:
        "Use for key metrics, achievements, and data points. Always include a descriptive label (e.g. 'Customers' not 'Statistic'). Use prefix for currency symbols, suffix for units. Combine multiple in a row/grid for stats sections.",
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

  // ==========================================================================
  // BUTTONS & INTERACTIVE (New Components)
  // ==========================================================================
  {
    type: "Link",
    label: "Link",
    category: "navigation",
    description: "Styled link with underline animations and external icon",
    acceptsChildren: false,
    keywords: [
      "link",
      "anchor",
      "hyperlink",
      "text link",
      "nav link",
      "inline link",
    ],
    ai: {
      description:
        "Styled inline or navigation link with 6 variants (default, underline, hover-underline, subtle, bold, nav), external link auto-detection, and CSS variable theming",
      usageGuidelines:
        "Use for inline text links, navigation links, and styled anchor elements. Prefer over raw <a> tags for consistent styling.",
      suggestedWith: ["Text", "Breadcrumb", "Button"],
    },
  },
  {
    type: "ButtonGroup",
    label: "Button Group",
    category: "buttons",
    description:
      "Groups multiple buttons together with connected or separated layouts",
    acceptsChildren: false,
    keywords: [
      "button group",
      "button row",
      "action bar",
      "toolbar",
      "button set",
    ],
    ai: {
      description:
        "Groups 2-5 buttons with connected, separated, or toggle variants. Supports horizontal/vertical direction and shared border radius.",
      usageGuidelines:
        "Use when 2+ buttons share a context, like view toggles (grid/list), segmented controls, or action groups. Provide items array with label, variant, and optional href/active.",
      suggestedWith: ["Button", "Section"],
    },
  },
  {
    type: "Chip",
    label: "Chip",
    category: "buttons",
    description: "Compact selectable element for filters, tags, and selections",
    acceptsChildren: false,
    keywords: ["chip", "tag", "filter", "selectable", "filter chip", "choice"],
    ai: {
      description:
        "Compact interactive chip with filled/outline/subtle variants, selected state via aria-pressed, optional avatar and delete button. Ideal for filter bars and tag displays.",
      usageGuidelines:
        "Use for filter selections, tag displays, or multi-select inputs. Set selected=true for active state. Add onDelete for dismissible chips.",
      suggestedWith: ["Section", "Badge", "ButtonGroup"],
    },
  },
  {
    type: "Breadcrumb",
    label: "Breadcrumb",
    category: "navigation",
    description: "Navigation breadcrumb trail showing page hierarchy",
    acceptsChildren: false,
    keywords: [
      "breadcrumb",
      "navigation",
      "path",
      "trail",
      "hierarchy",
      "page path",
    ],
    ai: {
      description:
        "Breadcrumb navigation with 5 separator types (/, >, →, •, chevron), 3 variants (default, contained, pills), maxItems truncation with ellipsis, and home icon support.",
      usageGuidelines:
        "Use at the top of pages to show navigation hierarchy. Provide items array with label and href. Last item is automatically styled as current page.",
      suggestedWith: ["Section", "Heading"],
    },
  },
  {
    type: "Pagination",
    label: "Pagination",
    category: "interactive",
    description: "Page navigation with numbered buttons and prev/next controls",
    acceptsChildren: false,
    keywords: [
      "pagination",
      "pager",
      "page numbers",
      "page nav",
      "page navigation",
    ],
    ai: {
      description:
        "Pagination control with 4 variants (default, simple, minimal, dots), 3 shapes (rounded, pill, square), smart sibling/boundary algorithm, and first/last/prev/next buttons.",
      usageGuidelines:
        "Use below lists, grids, or tables that span multiple pages. Set totalPages and currentPage. Pairs well with product grids and blog listings.",
      suggestedWith: ["Section", "ProductGrid", "BlogListing"],
    },
  },
  {
    type: "Badge",
    label: "Badge",
    category: "buttons",
    description:
      "Small status indicator or label with optional link and dismiss",
    acceptsChildren: false,
    keywords: ["badge", "tag", "label", "status", "indicator", "pill"],
    ai: {
      description:
        "Inline badge with 7 variants (default, primary, success, warning, error, info, outline), 4 sizes, dot indicator with pulse animation, icon support, linkable (href), and dismissible (onDismiss).",
      usageGuidelines:
        "Use for status indicators, category labels, notification counts, and feature tags. Add dot=true for status dots, pulse=true for attention. Use href to make clickable.",
      suggestedWith: ["Text", "Heading", "Card"],
    },
  },
  {
    type: "BlogPreview",
    label: "Blog Preview",
    category: "sections",
    description: "Display blog posts in grid, list, featured, or card layouts",
    acceptsChildren: false,
    keywords: [
      "blog",
      "posts",
      "articles",
      "news",
      "content",
      "feed",
      "preview",
      "recent",
    ],
    ai: {
      description:
        "Blog post preview section with 4 variants (grid, list, featured, cards), configurable columns (2-4), post cards with image, category, title, excerpt, author avatar, date, and read time. Supports section header with badge, CTA link, and dark-mode-aware colors.",
      usageGuidelines:
        "Use to showcase recent blog posts, news articles, or content updates. Use variant=featured for a hero-style layout with one large post and side list. Use variant=list for text-heavy layouts.",
      suggestedWith: ["Hero", "Newsletter", "CTA"],
    },
  },
  {
    type: "Timeline",
    label: "Timeline",
    category: "sections",
    description:
      "Display chronological events, milestones, or step-by-step processes",
    acceptsChildren: false,
    keywords: [
      "timeline",
      "history",
      "milestones",
      "events",
      "chronological",
      "steps",
      "process",
      "roadmap",
    ],
    ai: {
      description:
        "A timeline section for displaying chronological events with vertical, horizontal, or alternating layouts. Each item has title, description, date, optional icon, image, and badge. Customizable line style, node style, and card appearance. Supports scroll animation.",
      usageGuidelines:
        "Use for company history, project milestones, step-by-step guides, or event timelines. Use variant=alternating for balanced layouts, horizontal for compact overviews. Keep items to 4-8 for readability.",
      suggestedWith: ["Hero", "Stats", "Team", "CTA"],
    },
  },
  {
    type: "BeforeAfter",
    label: "Before & After",
    category: "media",
    description:
      "Interactive image comparison slider showing before and after states",
    acceptsChildren: false,
    keywords: [
      "before",
      "after",
      "comparison",
      "slider",
      "image",
      "compare",
      "transformation",
      "progress",
    ],
    ai: {
      description:
        "An interactive before/after image comparison component with a draggable slider. Supports horizontal and vertical orientations, customizable handle style (line, circle, arrows), labels, and keyboard/touch accessibility. Uses clip-path for GPU-accelerated rendering.",
      usageGuidelines:
        "Use for showing transformations, renovations, design changes, photo editing results, or product improvements. Always provide descriptive alt text for both images. Set initialPosition to 50 for balanced start.",
      suggestedWith: ["Gallery", "Image", "CTA", "Features"],
    },
  },
  {
    type: "Icon",
    label: "Icon",
    category: "media",
    description:
      "Display decorative or functional icons with optional backgrounds and animations",
    acceptsChildren: false,
    keywords: ["icon", "symbol", "graphic", "decorative", "lucide", "svg"],
    ai: {
      description:
        "A standalone icon component supporting Lucide icons with configurable size (xs-3xl), color, background shapes (circle, rounded, square), and animations (spin, pulse, bounce, float). Can be decorative or accessible with aria labels.",
      usageGuidelines:
        "Use as visual accents in feature lists, section dividers, or standalone decorative elements. Set decorative=true for purely visual icons. Use backgroundShape for emphasis.",
      suggestedWith: ["Features", "Text", "Heading"],
    },
  },

  // Audio Player
  {
    type: "Audio",
    label: "Audio Player",
    category: "media",
    description:
      "Audio player with waveform visualisation, cover art, and playback speed control",
    acceptsChildren: false,
    keywords: [
      "audio",
      "player",
      "music",
      "podcast",
      "sound",
      "waveform",
      "track",
    ],
    ai: {
      description:
        "An audio player component with three variants (full with cover art and waveform, compact inline bar, minimal play/progress). Supports waveform visualisation, playback speed cycling, download button, and full colour theming via CSS variables.",
      usageGuidelines:
        "Use full variant for podcasts or music with cover art. Use compact for inline players in blog posts. Use minimal for subtle ambient audio. Pair with text content for context.",
      suggestedWith: ["Text", "Image", "Card"],
    },
  },

  // Embed
  {
    type: "Embed",
    label: "Embed",
    category: "media",
    description:
      "Secure responsive iframe embed for videos, maps, or external content",
    acceptsChildren: false,
    keywords: [
      "embed",
      "iframe",
      "video",
      "map",
      "external",
      "youtube",
      "vimeo",
    ],
    ai: {
      description:
        "A secure iframe wrapper with configurable aspect ratio (1:1, 4:3, 16:9, 21:9), loading placeholder, sandbox/allow security attributes, and optional caption via figure/figcaption. Supports lazy loading.",
      usageGuidelines:
        "Use for embedding YouTube videos, Google Maps, Spotify playlists, or any external widget. Set appropriate sandbox permissions. Use caption to describe the embedded content.",
      suggestedWith: ["Text", "Heading", "CTA"],
    },
  },

  // Avatar Group
  {
    type: "AvatarGroup",
    label: "Avatar Group",
    category: "media",
    description:
      "Stacked overlapping avatar collection with overflow count badge",
    acceptsChildren: false,
    keywords: ["avatar", "group", "stack", "team", "users", "faces", "people"],
    ai: {
      description:
        "A horizontal stack of overlapping circular avatars with a +N overflow badge. Configurable size (xs-xl), overlap amount, stack direction, ring colour, and fallback initials when no image provided.",
      usageGuidelines:
        "Use to show team members, active users, or contributors without taking full space. Pair with text showing total count. Use max to limit visible avatars.",
      suggestedWith: ["Text", "Stats", "Card", "SocialProof"],
    },
  },

  // Modal
  {
    type: "Modal",
    label: "Modal / Dialog",
    category: "interactive",
    description:
      "Full-featured modal dialog with backdrop, close button, and configurable size",
    acceptsChildren: true,
    keywords: [
      "modal",
      "dialog",
      "popup",
      "overlay",
      "lightbox",
      "drawer",
      "sheet",
    ],
    ai: {
      description:
        "A modal overlay dialog with configurable size (sm-xl/full), close-on-backdrop-click, close-on-escape, backdrop blur, header/footer sections, and smooth enter/exit animations. Supports primary/secondary action buttons in footer.",
      usageGuidelines:
        "Use for confirmations, forms, image lightboxes, or any content requiring focused attention. Always provide a clear close mechanism. Use size to match content complexity.",
      suggestedWith: ["Button", "Form", "Card", "Text"],
    },
  },

  // Progress
  {
    type: "Progress",
    label: "Progress Bar",
    category: "interactive",
    description:
      "Animated progress bar with label, percentage display, and multiple variants",
    acceptsChildren: false,
    keywords: [
      "progress",
      "bar",
      "loading",
      "percentage",
      "meter",
      "completion",
      "status",
    ],
    ai: {
      description:
        "A horizontal progress bar with configurable value/max, size (sm/md/lg), variant (default/gradient/striped), optional label and percentage display, custom colours, and smooth animation.",
      usageGuidelines:
        "Use to show completion status, upload progress, skill levels, or any measurable metric. Set showValue for explicit percentage. Use gradient variant for visual emphasis.",
      suggestedWith: ["Text", "Stats", "Card", "Heading"],
    },
  },

  // Alert
  {
    type: "Alert",
    label: "Alert / Notification",
    category: "interactive",
    description:
      "Contextual alert message with icon, variant colours, and optional close button",
    acceptsChildren: false,
    keywords: [
      "alert",
      "notification",
      "banner",
      "message",
      "info",
      "warning",
      "error",
      "success",
    ],
    ai: {
      description:
        "A contextual alert with variant (info/success/warning/error), icon, optional title and message, closable dismiss button, and action link. Three sizes (sm/md/lg).",
      usageGuidelines:
        "Use for system messages, form validation feedback, status updates, or important notices. Match variant to message severity. Use closable for dismissible notifications.",
      suggestedWith: ["Text", "Button", "Form", "Card"],
    },
  },

  // CardFlip3D
  {
    type: "CardFlip3D",
    label: "3D Flip Card",
    category: "interactive",
    description:
      "Two-sided card with 3D flip animation on hover or click",
    acceptsChildren: true,
    keywords: [
      "card",
      "flip",
      "3d",
      "rotate",
      "two-sided",
      "hover",
      "interactive",
      "reveal",
    ],
    ai: {
      description:
        "A perspective-transformed card that flips 180° on hover/click to reveal back content. Configurable flip direction (horizontal/vertical), trigger, animation duration, front/back background colours, and border radius.",
      usageGuidelines:
        "Use for team member reveals, pricing comparisons, product before/after, or any content with a hidden secondary side. Keep front content concise to encourage interaction.",
      suggestedWith: ["Image", "Text", "Button", "Avatar"],
    },
  },

  // TiltCard
  {
    type: "TiltCard",
    label: "Tilt Card",
    category: "interactive",
    description:
      "Mouse-tracking 3D tilt effect card with parallax layers",
    acceptsChildren: true,
    keywords: [
      "tilt",
      "3d",
      "parallax",
      "hover",
      "perspective",
      "interactive",
      "card",
    ],
    ai: {
      description:
        "A card that tracks mouse position to create a 3D tilt effect with configurable max angle, glare, perspective depth, and parallax child layers. Resets smoothly on mouse leave.",
      usageGuidelines:
        "Use for featured content, product showcases, or hero elements that benefit from depth. Pair with images or icons. Use sparingly to avoid motion fatigue.",
      suggestedWith: ["Image", "Card", "Heading", "Button"],
    },
  },

  // GlassCard
  {
    type: "GlassCard",
    label: "Glass Card",
    category: "interactive",
    description:
      "Frosted glass effect card with backdrop blur and transparency",
    acceptsChildren: true,
    keywords: [
      "glass",
      "glassmorphism",
      "frosted",
      "blur",
      "transparent",
      "card",
      "modern",
    ],
    ai: {
      description:
        "A glassmorphism card with configurable backdrop blur intensity, background opacity, border opacity, tint colour, and optional glow ring. Works best over colourful or image backgrounds.",
      usageGuidelines:
        "Use over hero images, gradient backgrounds, or colourful sections for a modern frosted effect. Ensure sufficient text contrast. Works best with light content on darker backgrounds.",
      suggestedWith: ["Parallax", "Image", "Text", "Button"],
    },
  },

  // ParticleBackground
  {
    type: "ParticleBackground",
    label: "Particle Background",
    category: "interactive",
    description:
      "Animated particle system background with configurable density and behaviour",
    acceptsChildren: true,
    keywords: [
      "particles",
      "background",
      "animation",
      "dots",
      "stars",
      "floating",
      "ambient",
    ],
    ai: {
      description:
        "A CSS/canvas particle animation background with configurable particle count, size range, speed, colour, connecting lines, mouse interaction, and blend mode. Children render above via z-index.",
      usageGuidelines:
        "Use for hero sections, landing pages, or sections needing visual dynamism. Keep particle count reasonable for performance. Pair with high-contrast text for readability.",
      suggestedWith: ["Hero", "Heading", "CTA", "GlassCard"],
    },
  },

  // ScrollAnimate
  {
    type: "ScrollAnimate",
    label: "Scroll Animate",
    category: "interactive",
    description:
      "Scroll-triggered animation wrapper using IntersectionObserver",
    acceptsChildren: true,
    keywords: [
      "scroll",
      "animate",
      "reveal",
      "intersection",
      "observer",
      "fade",
      "slide",
      "entrance",
    ],
    ai: {
      description:
        "A wrapper that triggers CSS entrance animations when children scroll into view using IntersectionObserver. Configurable animation type (fade/slide/scale/rotate), direction, duration, delay, easing, threshold, and one-shot vs repeat modes.",
      usageGuidelines:
        "Use to add entrance animations to any content as users scroll. Wrap sections, cards, or text blocks. Stagger delays for sequential reveals. Use sparingly on mobile for performance.",
      suggestedWith: ["Card", "Stats", "Features", "Timeline"],
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
