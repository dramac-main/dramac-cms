/**
 * DRAMAC Studio Core Components
 * 
 * Registers all built-in components with Studio metadata.
 * Uses standalone render components after Puck removal.
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import { componentRegistry, defineComponent } from "./component-registry";
import { presetOptions } from "./field-registry";
import type { ComponentDefinition } from "@/types/studio";

// Import Studio render components
import {
  // Layout
  SectionRender,
  ContainerRender,
  ColumnsRender,
  CardRender,
  SpacerRender,
  DividerRender,
  // Typography
  HeadingRender,
  TextRender,
  // Buttons
  ButtonRender,
  // Media
  ImageRender,
  VideoRender,
  MapRender,
  // Sections
  HeroRender,
  FeaturesRender,
  CTARender,
  TestimonialsRender,
  FAQRender,
  StatsRender,
  TeamRender,
  GalleryRender,
  // Navigation
  NavbarRender,
  FooterRender,
  SocialLinksRender,
  // Forms
  FormRender,
  FormFieldRender,
  ContactFormRender,
  NewsletterRender,
  // Content
  RichTextRender,
  QuoteRender,
  CodeBlockRender,
  // Interactive
  CarouselRender,
  CountdownRender,
  TypewriterRender,
  ParallaxRender,
  PricingRender,
  AccordionRender,
  TabsRender,
  ModalRender,
  // UI Elements
  BadgeRender,
  AvatarRender,
  ProgressRender,
  AlertRender,
  TooltipRender,
  // Marketing
  AnnouncementBarRender,
  SocialProofRender,
  TrustBadgesRender,
  LogoCloudRender,
  ComparisonTableRender,
  // E-Commerce
  ProductGridRender,
  ProductCardRender,
  ProductCategoriesRender,
  CartSummaryRender,
  FeaturedProductsRender,
  CartIconRender,
  // 3D Effects (Phase 31)
  CardFlip3DRender,
  TiltCardRender,
  GlassCardRender,
  ParticleBackgroundRender,
  ScrollAnimateRender,
} from "@/lib/studio/blocks/renders";

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

const layoutComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Section",
    label: "Section",
    description: "Full-width section with background options",
    category: "layout",
    icon: "Square",
    render: SectionRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      backgroundColor: { type: "color", label: "Background Color" },
      backgroundImage: { type: "image", label: "Background Image" },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "md",
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: presetOptions.maxWidth,
        defaultValue: "xl",
      },
      minHeight: {
        type: "number",
        label: "Min Height (px)",
        min: 0,
        max: 1000,
        defaultValue: 0,
      },
    },
    defaultProps: {
      padding: "md",
      maxWidth: "xl",
      minHeight: 0,
    },
    ai: {
      description: "A full-width section that can contain other components",
      canModify: ["backgroundColor", "padding", "minHeight"],
      suggestions: ["Change background color", "Adjust padding"],
    },
  }),

  defineComponent({
    type: "Container",
    label: "Container",
    description: "Centered container with max-width",
    category: "layout",
    icon: "Box",
    render: ContainerRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: presetOptions.maxWidth,
        defaultValue: "xl",
      },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "md",
      },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      maxWidth: "xl",
      padding: "md",
    },
    ai: {
      description: "A centered container with max-width constraint",
      canModify: ["maxWidth", "padding", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "Columns",
    label: "Columns",
    description: "Multi-column layout grid",
    category: "layout",
    icon: "Columns",
    render: ColumnsRender,
    acceptsChildren: true,
    isContainer: true,
    zones: {
      "column-1": { label: "Column 1", acceptsChildren: true },
      "column-2": { label: "Column 2", acceptsChildren: true },
      "column-3": { label: "Column 3", acceptsChildren: true },
      "column-4": { label: "Column 4", acceptsChildren: true },
    },
    fields: {
      columns: {
        type: "select",
        label: "Number of Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "2",
      },
      gap: {
        type: "select",
        label: "Gap",
        options: presetOptions.gap,
        defaultValue: "md",
      },
      verticalAlign: {
        type: "select",
        label: "Vertical Align",
        options: presetOptions.verticalAlign,
        defaultValue: "top",
      },
      reverseOnMobile: {
        type: "toggle",
        label: "Reverse on Mobile",
        defaultValue: false,
      },
    },
    defaultProps: {
      columns: 2,
      gap: "md",
      verticalAlign: "top",
      reverseOnMobile: false,
    },
    ai: {
      description: "A multi-column layout grid",
      canModify: ["columns", "gap", "verticalAlign"],
    },
  }),

  defineComponent({
    type: "Card",
    label: "Card",
    description: "Card container with shadow and border",
    category: "layout",
    icon: "CreditCard",
    render: CardRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "md",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: presetOptions.shadow,
        defaultValue: "md",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "md",
      },
      backgroundColor: { type: "color", label: "Background Color" },
      border: { type: "toggle", label: "Show Border", defaultValue: true },
    },
    defaultProps: {
      padding: "md",
      shadow: "md",
      borderRadius: "md",
      border: true,
    },
    ai: {
      description: "A card container with shadow and optional border",
      canModify: ["padding", "shadow", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "Spacer",
    label: "Spacer",
    description: "Vertical spacing element",
    category: "layout",
    icon: "ArrowUpDown",
    render: SpacerRender,
    fields: {
      height: {
        type: "number",
        label: "Height (px)",
        min: 0,
        max: 500,
        defaultValue: 32,
      },
      mobileHeight: {
        type: "number",
        label: "Mobile Height (px)",
        min: 0,
        max: 500,
      },
    },
    defaultProps: {
      height: 32,
    },
    ai: {
      description: "Adds vertical spacing between components",
      canModify: ["height", "mobileHeight"],
    },
  }),

  defineComponent({
    type: "Divider",
    label: "Divider",
    description: "Horizontal line separator",
    category: "layout",
    icon: "Minus",
    render: DividerRender,
    fields: {
      color: { type: "color", label: "Color", defaultValue: "#e5e7eb" },
      thickness: {
        type: "number",
        label: "Thickness (px)",
        min: 1,
        max: 10,
        defaultValue: 1,
      },
      style: {
        type: "select",
        label: "Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Dashed", value: "dashed" },
          { label: "Dotted", value: "dotted" },
        ],
        defaultValue: "solid",
      },
      margin: {
        type: "select",
        label: "Margin",
        options: presetOptions.padding,
        defaultValue: "md",
      },
    },
    defaultProps: {
      color: "#e5e7eb",
      thickness: 1,
      style: "solid",
      margin: "md",
    },
    ai: {
      description: "A horizontal line separator",
      canModify: ["color", "thickness", "style"],
    },
  }),
];

// =============================================================================
// TYPOGRAPHY COMPONENTS
// =============================================================================

const typographyComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Heading",
    label: "Heading",
    description: "Heading text (H1-H6)",
    category: "typography",
    icon: "Heading",
    render: HeadingRender,
    fields: {
      text: {
        type: "textarea",
        label: "Text",
        rows: 2,
        defaultValue: "Heading Text",
      },
      level: {
        type: "select",
        label: "Level",
        options: presetOptions.headingLevel,
        defaultValue: "h2",
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.alignment,
        defaultValue: "left",
      },
      color: { type: "color", label: "Color" },
    },
    defaultProps: {
      text: "Heading Text",
      level: "h2",
      alignment: "left",
    },
    ai: {
      description: "A heading element for titles and section headers",
      canModify: ["text", "level", "alignment", "color"],
      suggestions: ["Make it more exciting", "Shorten it", "Add an emoji"],
    },
  }),

  defineComponent({
    type: "Text",
    label: "Text",
    description: "Paragraph text block",
    category: "typography",
    icon: "AlignLeft",
    render: TextRender,
    fields: {
      text: {
        type: "textarea",
        label: "Text",
        rows: 4,
        defaultValue: "Your text content goes here.",
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.textAlign,
        defaultValue: "left",
      },
      color: { type: "color", label: "Color" },
      fontSize: {
        type: "select",
        label: "Font Size",
        options: presetOptions.fontSize,
        defaultValue: "base",
      },
    },
    defaultProps: {
      text: "Your text content goes here.",
      alignment: "left",
      fontSize: "base",
    },
    ai: {
      description: "A paragraph text block",
      canModify: ["text", "alignment", "color", "fontSize"],
      suggestions: ["Make it shorter", "Make it longer", "Improve clarity"],
    },
  }),
];

// =============================================================================
// BUTTON COMPONENTS
// =============================================================================

const buttonComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Button",
    label: "Button",
    description: "Clickable button with link",
    category: "buttons",
    icon: "MousePointer",
    render: ButtonRender,
    fields: {
      text: {
        type: "text",
        label: "Text",
        defaultValue: "Click Me",
      },
      link: { type: "link", label: "Link" },
      variant: {
        type: "select",
        label: "Variant",
        options: presetOptions.buttonVariant,
        defaultValue: "primary",
      },
      size: {
        type: "select",
        label: "Size",
        options: presetOptions.buttonSize,
        defaultValue: "md",
      },
      fullWidth: {
        type: "toggle",
        label: "Full Width",
        defaultValue: false,
      },
      openInNewTab: {
        type: "toggle",
        label: "Open in New Tab",
        defaultValue: false,
      },
    },
    defaultProps: {
      text: "Click Me",
      variant: "primary",
      size: "md",
      fullWidth: false,
      openInNewTab: false,
    },
    ai: {
      description: "A clickable button that can link to pages or URLs",
      canModify: ["text", "variant", "size"],
      suggestions: ["Make CTA more urgent", "Change to secondary style"],
    },
  }),
];

// =============================================================================
// MEDIA COMPONENTS
// =============================================================================

const mediaComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Image",
    label: "Image",
    description: "Image with responsive options",
    category: "media",
    icon: "Image",
    render: ImageRender,
    fields: {
      src: { type: "image", label: "Image" },
      alt: { type: "text", label: "Alt Text", defaultValue: "" },
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Full Width", value: "full" },
          { label: "Fixed", value: "fixed" },
        ],
        defaultValue: "full",
      },
      objectFit: {
        type: "select",
        label: "Object Fit",
        options: presetOptions.objectFit,
        defaultValue: "cover",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "none",
      },
    },
    defaultProps: {
      alt: "",
      width: "full",
      objectFit: "cover",
      borderRadius: "none",
    },
    ai: {
      description: "An image element with responsive sizing",
      canModify: ["alt", "width", "borderRadius"],
      suggestions: ["Add descriptive alt text"],
    },
  }),

  defineComponent({
    type: "Video",
    label: "Video",
    description: "Embedded video player",
    category: "media",
    icon: "Video",
    render: VideoRender,
    fields: {
      url: { type: "text", label: "Video URL" },
      type: {
        type: "select",
        label: "Type",
        options: [
          { label: "YouTube", value: "youtube" },
          { label: "Vimeo", value: "vimeo" },
          { label: "File", value: "file" },
        ],
        defaultValue: "youtube",
      },
      autoplay: { type: "toggle", label: "Autoplay", defaultValue: false },
      muted: { type: "toggle", label: "Muted", defaultValue: false },
      loop: { type: "toggle", label: "Loop", defaultValue: false },
      controls: { type: "toggle", label: "Show Controls", defaultValue: true },
      aspectRatio: {
        type: "select",
        label: "Aspect Ratio",
        options: presetOptions.aspectRatio,
        defaultValue: "16:9",
      },
    },
    defaultProps: {
      type: "youtube",
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      aspectRatio: "16:9",
    },
    ai: {
      description: "An embedded video player (YouTube, Vimeo, or file)",
      canModify: ["aspectRatio", "autoplay", "controls"],
    },
  }),

  defineComponent({
    type: "Map",
    label: "Map",
    description: "Embedded map",
    category: "media",
    icon: "MapPin",
    render: MapRender,
    fields: {
      address: { type: "text", label: "Address" },
      zoom: {
        type: "number",
        label: "Zoom",
        min: 1,
        max: 20,
        defaultValue: 15,
      },
      height: {
        type: "number",
        label: "Height (px)",
        min: 100,
        max: 800,
        defaultValue: 400,
      },
    },
    defaultProps: {
      zoom: 15,
      height: 400,
    },
    ai: {
      description: "An embedded map showing a location",
      canModify: ["address", "zoom", "height"],
    },
  }),
];

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

const sectionComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Hero",
    label: "Hero",
    description: "Hero section with title, subtitle, and CTA",
    category: "sections",
    icon: "Star",
    render: HeroRender,
    fields: {
      title: {
        type: "text",
        label: "Title",
        defaultValue: "Welcome to Our Site",
      },
      subtitle: {
        type: "textarea",
        label: "Subtitle",
        rows: 2,
        defaultValue: "Discover amazing features and services.",
      },
      buttonText: { type: "text", label: "Button Text", defaultValue: "Get Started" },
      buttonLink: { type: "link", label: "Button Link" },
      backgroundColor: { type: "color", label: "Background Color" },
      backgroundImage: { type: "image", label: "Background Image" },
      textColor: { type: "color", label: "Text Color" },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      minHeight: {
        type: "number",
        label: "Min Height (px)",
        min: 200,
        max: 1000,
        defaultValue: 500,
      },
      overlay: { type: "toggle", label: "Show Overlay", defaultValue: false },
    },
    defaultProps: {
      title: "Welcome to Our Site",
      subtitle: "Discover amazing features and services.",
      buttonText: "Get Started",
      alignment: "center",
      minHeight: 500,
      overlay: false,
    },
    ai: {
      description: "A hero section with title, subtitle, and call-to-action button",
      canModify: ["title", "subtitle", "buttonText", "backgroundColor", "alignment"],
      suggestions: ["Make title more impactful", "Add urgency to CTA", "Change color scheme"],
    },
  }),

  defineComponent({
    type: "Features",
    label: "Features",
    description: "Feature grid with icons",
    category: "sections",
    icon: "Grid3X3",
    render: FeaturesRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "Our Features" },
      subtitle: { type: "textarea", label: "Section Subtitle" },
      features: {
        type: "array",
        label: "Features",
        itemFields: {
          icon: { type: "text", label: "Icon Name" },
          title: { type: "text", label: "Title" },
          description: { type: "textarea", label: "Description" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "3",
      },
    },
    defaultProps: {
      title: "Our Features",
      features: [
        { icon: "Zap", title: "Fast", description: "Lightning quick performance" },
        { icon: "Shield", title: "Secure", description: "Enterprise-grade security" },
        { icon: "Heart", title: "Loved", description: "Used by thousands" },
      ],
      columns: 3,
    },
    ai: {
      description: "A grid of features with icons, titles, and descriptions",
      canModify: ["title", "subtitle", "features", "columns"],
      suggestions: ["Add more features", "Improve feature descriptions"],
    },
  }),

  defineComponent({
    type: "CTA",
    label: "CTA",
    description: "Call-to-action section",
    category: "sections",
    icon: "Megaphone",
    render: CTARender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Ready to Get Started?" },
      subtitle: { type: "textarea", label: "Subtitle" },
      buttonText: { type: "text", label: "Button Text", defaultValue: "Start Now" },
      buttonLink: { type: "link", label: "Button Link" },
      backgroundColor: { type: "color", label: "Background Color" },
      textColor: { type: "color", label: "Text Color" },
    },
    defaultProps: {
      title: "Ready to Get Started?",
      buttonText: "Start Now",
    },
    ai: {
      description: "A call-to-action section to drive conversions",
      canModify: ["title", "subtitle", "buttonText", "backgroundColor"],
      suggestions: ["Add urgency", "Make CTA more compelling"],
    },
  }),

  defineComponent({
    type: "Testimonials",
    label: "Testimonials",
    description: "Customer testimonials section",
    category: "sections",
    icon: "Quote",
    render: TestimonialsRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "What Our Customers Say" },
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemFields: {
          quote: { type: "textarea", label: "Quote" },
          author: { type: "text", label: "Author Name" },
          role: { type: "text", label: "Role/Company" },
          avatar: { type: "image", label: "Avatar" },
        },
      },
    },
    defaultProps: {
      title: "What Our Customers Say",
      testimonials: [
        { quote: "Amazing product!", author: "John Doe", role: "CEO, Company" },
      ],
    },
    ai: {
      description: "A section displaying customer testimonials",
      canModify: ["title", "testimonials"],
      suggestions: ["Add more testimonials", "Improve quote impact"],
    },
  }),

  defineComponent({
    type: "FAQ",
    label: "FAQ",
    description: "Frequently asked questions",
    category: "sections",
    icon: "HelpCircle",
    render: FAQRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "Frequently Asked Questions" },
      faqs: {
        type: "array",
        label: "FAQs",
        itemFields: {
          question: { type: "text", label: "Question" },
          answer: { type: "textarea", label: "Answer" },
        },
      },
    },
    defaultProps: {
      title: "Frequently Asked Questions",
      faqs: [
        { question: "How does it work?", answer: "It's simple and easy to use." },
      ],
    },
    ai: {
      description: "An FAQ accordion section",
      canModify: ["title", "faqs"],
      suggestions: ["Add more FAQs", "Improve answer clarity"],
    },
  }),

  defineComponent({
    type: "Stats",
    label: "Stats",
    description: "Statistics/numbers section",
    category: "sections",
    icon: "BarChart3",
    render: StatsRender,
    fields: {
      title: { type: "text", label: "Section Title" },
      stats: {
        type: "array",
        label: "Stats",
        itemFields: {
          value: { type: "text", label: "Value" },
          label: { type: "text", label: "Label" },
          prefix: { type: "text", label: "Prefix" },
          suffix: { type: "text", label: "Suffix" },
        },
      },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      stats: [
        { value: "100", label: "Customers", suffix: "+" },
        { value: "50", label: "Projects", suffix: "K" },
        { value: "99", label: "Satisfaction", suffix: "%" },
      ],
    },
    ai: {
      description: "A section displaying statistics and numbers",
      canModify: ["title", "stats", "backgroundColor"],
      suggestions: ["Update numbers", "Add more stats"],
    },
  }),

  defineComponent({
    type: "Team",
    label: "Team",
    description: "Team members section",
    category: "sections",
    icon: "Users",
    render: TeamRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "Our Team" },
      members: {
        type: "array",
        label: "Team Members",
        itemFields: {
          name: { type: "text", label: "Name" },
          role: { type: "text", label: "Role" },
          image: { type: "image", label: "Photo" },
          bio: { type: "textarea", label: "Bio" },
        },
      },
    },
    defaultProps: {
      title: "Our Team",
      members: [],
    },
    ai: {
      description: "A section displaying team member profiles",
      canModify: ["title", "members"],
    },
  }),

  defineComponent({
    type: "Gallery",
    label: "Gallery",
    description: "Image gallery grid",
    category: "sections",
    icon: "Images",
    render: GalleryRender,
    fields: {
      title: { type: "text", label: "Section Title" },
      images: {
        type: "array",
        label: "Images",
        itemFields: {
          src: { type: "image", label: "Image" },
          alt: { type: "text", label: "Alt Text" },
          caption: { type: "text", label: "Caption" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "3",
      },
    },
    defaultProps: {
      images: [],
      columns: 3,
    },
    ai: {
      description: "An image gallery displayed in a grid",
      canModify: ["title", "columns"],
    },
  }),
];

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

const navigationComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Navbar",
    label: "Navbar",
    description: "Site navigation header",
    category: "navigation",
    icon: "Menu",
    render: NavbarRender,
    fields: {
      logo: { type: "image", label: "Logo" },
      logoText: { type: "text", label: "Logo Text" },
      links: {
        type: "array",
        label: "Navigation Links",
        itemFields: {
          text: { type: "text", label: "Text" },
          href: { type: "link", label: "Link" },
        },
      },
      ctaText: { type: "text", label: "CTA Button Text" },
      ctaLink: { type: "link", label: "CTA Button Link" },
      sticky: { type: "toggle", label: "Sticky Header", defaultValue: false },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      links: [
        { text: "Home", href: "/" },
        { text: "About", href: "/about" },
        { text: "Contact", href: "/contact" },
      ],
      sticky: false,
    },
    ai: {
      description: "A navigation header with logo and links",
      canModify: ["logoText", "links", "ctaText", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "Footer",
    label: "Footer",
    description: "Site footer",
    category: "navigation",
    icon: "Footprints",
    render: FooterRender,
    fields: {
      logo: { type: "image", label: "Logo" },
      companyName: { type: "text", label: "Company Name" },
      description: { type: "textarea", label: "Description" },
      columns: {
        type: "array",
        label: "Link Columns",
        itemFields: {
          title: { type: "text", label: "Column Title" },
          links: {
            type: "array",
            label: "Links",
            itemFields: {
              text: { type: "text", label: "Text" },
              href: { type: "link", label: "Link" },
            },
          },
        },
      },
      copyright: { type: "text", label: "Copyright Text" },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      companyName: "Your Company",
      copyright: "© 2024 Your Company. All rights reserved.",
      columns: [],
    },
    ai: {
      description: "A site footer with links and copyright",
      canModify: ["companyName", "description", "copyright", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "SocialLinks",
    label: "Social Links",
    description: "Social media icon links",
    category: "navigation",
    icon: "Share2",
    render: SocialLinksRender,
    fields: {
      links: {
        type: "array",
        label: "Social Links",
        itemFields: {
          platform: {
            type: "select",
            label: "Platform",
            options: [
              { label: "Facebook", value: "facebook" },
              { label: "Twitter", value: "twitter" },
              { label: "Instagram", value: "instagram" },
              { label: "LinkedIn", value: "linkedin" },
              { label: "YouTube", value: "youtube" },
              { label: "TikTok", value: "tiktok" },
            ],
          },
          url: { type: "link", label: "URL" },
        },
      },
      size: {
        type: "select",
        label: "Icon Size",
        options: presetOptions.buttonSize,
        defaultValue: "md",
      },
      color: { type: "color", label: "Icon Color" },
    },
    defaultProps: {
      links: [],
      size: "md",
    },
    ai: {
      description: "Social media icon links",
      canModify: ["links", "size", "color"],
    },
  }),
];

// =============================================================================
// FORM COMPONENTS
// =============================================================================

const formComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Form",
    label: "Form",
    description: "Custom form container",
    category: "forms",
    icon: "ClipboardList",
    render: FormRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      action: { type: "text", label: "Form Action URL" },
      method: {
        type: "select",
        label: "Method",
        options: [
          { label: "POST", value: "post" },
          { label: "GET", value: "get" },
        ],
        defaultValue: "post",
      },
      submitText: { type: "text", label: "Submit Button Text", defaultValue: "Submit" },
      successMessage: { type: "text", label: "Success Message" },
    },
    defaultProps: {
      method: "post",
      submitText: "Submit",
    },
    ai: {
      description: "A form container for custom forms",
      canModify: ["submitText", "successMessage"],
    },
  }),

  defineComponent({
    type: "FormField",
    label: "Form Field",
    description: "Form input field",
    category: "forms",
    icon: "FormInput",
    render: FormFieldRender,
    fields: {
      label: { type: "text", label: "Label" },
      name: { type: "text", label: "Field Name" },
      type: {
        type: "select",
        label: "Type",
        options: [
          { label: "Text", value: "text" },
          { label: "Email", value: "email" },
          { label: "Phone", value: "tel" },
          { label: "Number", value: "number" },
          { label: "Textarea", value: "textarea" },
          { label: "Select", value: "select" },
          { label: "Checkbox", value: "checkbox" },
        ],
        defaultValue: "text",
      },
      placeholder: { type: "text", label: "Placeholder" },
      required: { type: "toggle", label: "Required", defaultValue: false },
    },
    defaultProps: {
      type: "text",
      required: false,
    },
    ai: {
      description: "A form input field",
      canModify: ["label", "placeholder", "required"],
    },
  }),

  defineComponent({
    type: "ContactForm",
    label: "Contact Form",
    description: "Pre-built contact form",
    category: "forms",
    icon: "Mail",
    render: ContactFormRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Contact Us" },
      subtitle: { type: "textarea", label: "Subtitle" },
      emailTo: { type: "text", label: "Send To Email" },
      submitText: { type: "text", label: "Submit Button Text", defaultValue: "Send Message" },
      successMessage: { type: "text", label: "Success Message", defaultValue: "Thanks! We'll be in touch." },
      showPhone: { type: "toggle", label: "Show Phone Field", defaultValue: true },
      showSubject: { type: "toggle", label: "Show Subject Field", defaultValue: true },
    },
    defaultProps: {
      title: "Contact Us",
      submitText: "Send Message",
      successMessage: "Thanks! We'll be in touch.",
      showPhone: true,
      showSubject: true,
    },
    ai: {
      description: "A pre-built contact form with name, email, and message fields",
      canModify: ["title", "subtitle", "submitText", "successMessage"],
    },
  }),

  defineComponent({
    type: "Newsletter",
    label: "Newsletter",
    description: "Email signup form",
    category: "forms",
    icon: "Newspaper",
    render: NewsletterRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Subscribe to our newsletter" },
      subtitle: { type: "textarea", label: "Subtitle" },
      placeholder: { type: "text", label: "Placeholder", defaultValue: "Enter your email" },
      submitText: { type: "text", label: "Button Text", defaultValue: "Subscribe" },
      successMessage: { type: "text", label: "Success Message", defaultValue: "Thanks for subscribing!" },
      layout: {
        type: "select",
        label: "Layout",
        options: [
          { label: "Inline", value: "inline" },
          { label: "Stacked", value: "stacked" },
        ],
        defaultValue: "inline",
      },
    },
    defaultProps: {
      title: "Subscribe to our newsletter",
      placeholder: "Enter your email",
      submitText: "Subscribe",
      successMessage: "Thanks for subscribing!",
      layout: "inline",
    },
    ai: {
      description: "An email newsletter signup form",
      canModify: ["title", "subtitle", "submitText", "successMessage"],
    },
  }),
];

// =============================================================================
// CONTENT COMPONENTS
// =============================================================================

const contentComponents: ComponentDefinition[] = [
  defineComponent({
    type: "RichText",
    label: "Rich Text",
    description: "Rich text content block",
    category: "content",
    icon: "FileText",
    render: RichTextRender,
    fields: {
      content: { type: "richtext", label: "Content" },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: presetOptions.maxWidth,
        defaultValue: "xl",
      },
    },
    defaultProps: {
      content: "<p>Start typing your content here...</p>",
      maxWidth: "xl",
    },
    ai: {
      description: "A rich text content block",
      canModify: ["content"],
    },
  }),

  defineComponent({
    type: "Quote",
    label: "Quote",
    description: "Blockquote element",
    category: "content",
    icon: "Quote",
    render: QuoteRender,
    fields: {
      text: { type: "textarea", label: "Quote Text" },
      author: { type: "text", label: "Author" },
      source: { type: "text", label: "Source" },
      style: {
        type: "select",
        label: "Style",
        options: [
          { label: "Default", value: "default" },
          { label: "Large", value: "large" },
          { label: "Bordered", value: "bordered" },
        ],
        defaultValue: "default",
      },
    },
    defaultProps: {
      text: "This is a quote.",
      style: "default",
    },
    ai: {
      description: "A blockquote element for displaying quotes",
      canModify: ["text", "author", "source"],
    },
  }),

  defineComponent({
    type: "CodeBlock",
    label: "Code Block",
    description: "Syntax highlighted code",
    category: "content",
    icon: "Code",
    render: CodeBlockRender,
    fields: {
      code: { type: "code", label: "Code" },
      language: {
        type: "select",
        label: "Language",
        options: [
          { label: "JavaScript", value: "javascript" },
          { label: "TypeScript", value: "typescript" },
          { label: "HTML", value: "html" },
          { label: "CSS", value: "css" },
          { label: "Python", value: "python" },
          { label: "JSON", value: "json" },
        ],
        defaultValue: "javascript",
      },
      showLineNumbers: { type: "toggle", label: "Show Line Numbers", defaultValue: true },
    },
    defaultProps: {
      code: "// Your code here",
      language: "javascript",
      showLineNumbers: true,
    },
    ai: {
      description: "A code block with syntax highlighting",
      canModify: ["code", "language"],
    },
  }),
];

// =============================================================================
// INTERACTIVE COMPONENTS
// =============================================================================

const interactiveComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Carousel",
    label: "Carousel",
    description: "Image/content carousel",
    category: "interactive",
    icon: "GalleryHorizontal",
    render: CarouselRender,
    fields: {
      slides: {
        type: "array",
        label: "Slides",
        itemFields: {
          image: { type: "image", label: "Image" },
          title: { type: "text", label: "Title" },
          description: { type: "textarea", label: "Description" },
        },
      },
      autoplay: { type: "toggle", label: "Autoplay", defaultValue: false },
      interval: { type: "number", label: "Interval (ms)", defaultValue: 5000 },
      showDots: { type: "toggle", label: "Show Dots", defaultValue: true },
      showArrows: { type: "toggle", label: "Show Arrows", defaultValue: true },
    },
    defaultProps: {
      slides: [],
      autoplay: false,
      interval: 5000,
      showDots: true,
      showArrows: true,
    },
    ai: {
      description: "An image/content carousel slider",
      canModify: ["slides", "autoplay", "interval"],
    },
  }),

  defineComponent({
    type: "Countdown",
    label: "Countdown",
    description: "Countdown timer",
    category: "interactive",
    icon: "Clock",
    render: CountdownRender,
    fields: {
      targetDate: { type: "text", label: "Target Date (ISO format)" },
      title: { type: "text", label: "Title" },
      expiredMessage: { type: "text", label: "Expired Message", defaultValue: "Time's up!" },
    },
    defaultProps: {
      expiredMessage: "Time's up!",
    },
    ai: {
      description: "A countdown timer to a specific date",
      canModify: ["targetDate", "title", "expiredMessage"],
    },
  }),

  defineComponent({
    type: "Typewriter",
    label: "Typewriter",
    description: "Typewriter text effect",
    category: "interactive",
    icon: "Type",
    render: TypewriterRender,
    fields: {
      texts: {
        type: "array",
        label: "Texts to Type",
        itemFields: {
          text: { type: "text", label: "Text" },
        },
      },
      speed: { type: "number", label: "Speed (ms)", defaultValue: 100 },
      loop: { type: "toggle", label: "Loop", defaultValue: true },
    },
    defaultProps: {
      texts: [],
      speed: 100,
      loop: true,
    },
    ai: {
      description: "A typewriter text animation effect",
      canModify: ["texts", "speed"],
    },
  }),

  defineComponent({
    type: "Parallax",
    label: "Parallax",
    description: "Parallax scrolling effect",
    category: "interactive",
    icon: "Layers",
    render: ParallaxRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      backgroundImage: { type: "image", label: "Background Image" },
      speed: { type: "number", label: "Speed", min: 0, max: 1, defaultValue: 0.5 },
      height: { type: "number", label: "Height (px)", defaultValue: 400 },
    },
    defaultProps: {
      speed: 0.5,
      height: 400,
    },
    ai: {
      description: "A parallax scrolling effect container",
      canModify: ["speed", "height"],
    },
  }),

  // =========================================================================
  // PRICING - Pricing Tables
  // =========================================================================
  defineComponent({
    type: "Pricing",
    label: "Pricing",
    description: "Pricing plans comparison table",
    category: "interactive",
    icon: "CreditCard",
    render: PricingRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Pricing Plans" },
      subtitle: { type: "text", label: "Subtitle" },
      description: { type: "textarea", label: "Description" },
      plans: {
        type: "array",
        label: "Plans",
        itemFields: {
          name: { type: "text", label: "Plan Name" },
          description: { type: "textarea", label: "Plan Description" },
          price: { type: "text", label: "Price" },
          period: { type: "text", label: "Period (e.g., /month)" },
          features: { type: "array", label: "Features", itemFields: { text: { type: "text", label: "Feature" } } },
          buttonText: { type: "text", label: "Button Text" },
          buttonLink: { type: "link", label: "Button Link" },
          popular: { type: "toggle", label: "Popular (highlighted)" },
          badge: { type: "text", label: "Badge Text" },
        },
      },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Cards", value: "cards" },
          { label: "Simple", value: "simple" },
        ],
        defaultValue: "cards",
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: 2 },
          { label: "3 Columns", value: 3 },
          { label: "4 Columns", value: 4 },
        ],
        defaultValue: 3,
      },
      backgroundColor: { type: "color", label: "Background Color" },
      popularBorderColor: { type: "color", label: "Popular Border Color", defaultValue: "#3b82f6" },
    },
    defaultProps: {
      title: "Pricing Plans",
      plans: [],
      variant: "cards",
      columns: 3,
    },
    ai: {
      description: "A pricing comparison table with multiple plans",
      canModify: ["title", "subtitle", "plans", "columns"],
    },
  }),

  // =========================================================================
  // ACCORDION - Expandable Content
  // =========================================================================
  defineComponent({
    type: "Accordion",
    label: "Accordion",
    description: "Expandable accordion content",
    category: "interactive",
    icon: "ChevronsUpDown",
    render: AccordionRender,
    fields: {
      items: {
        type: "array",
        label: "Items",
        itemFields: {
          title: { type: "text", label: "Title" },
          content: { type: "textarea", label: "Content" },
          defaultOpen: { type: "toggle", label: "Open by Default" },
        },
      },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Simple", value: "simple" },
          { label: "Bordered", value: "bordered" },
          { label: "Separated", value: "separated" },
          { label: "Filled", value: "filled" },
        ],
        defaultValue: "bordered",
      },
      allowMultiple: { type: "toggle", label: "Allow Multiple Open", defaultValue: true },
      backgroundColor: { type: "color", label: "Background Color" },
      borderColor: { type: "color", label: "Border Color" },
    },
    defaultProps: {
      items: [],
      variant: "bordered",
      allowMultiple: true,
    },
    ai: {
      description: "An expandable accordion component with multiple items",
      canModify: ["items", "variant"],
    },
  }),

  // =========================================================================
  // TABS - Tabbed Content
  // =========================================================================
  defineComponent({
    type: "Tabs",
    label: "Tabs",
    description: "Tabbed content switcher",
    category: "interactive",
    icon: "LayoutList",
    render: TabsRender,
    fields: {
      tabs: {
        type: "array",
        label: "Tabs",
        itemFields: {
          label: { type: "text", label: "Tab Label" },
          content: { type: "textarea", label: "Tab Content" },
          icon: { type: "text", label: "Icon (optional)" },
        },
      },
      defaultTab: { type: "number", label: "Default Tab (0-based)", defaultValue: 0 },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Underline", value: "underline" },
          { label: "Pills", value: "pills" },
          { label: "Boxed", value: "boxed" },
        ],
        defaultValue: "underline",
      },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      fullWidth: { type: "toggle", label: "Full Width", defaultValue: false },
      centered: { type: "toggle", label: "Centered", defaultValue: false },
      activeColor: { type: "color", label: "Active Color", defaultValue: "#3b82f6" },
    },
    defaultProps: {
      tabs: [],
      defaultTab: 0,
      variant: "underline",
      size: "md",
    },
    ai: {
      description: "A tabbed content component for organizing information",
      canModify: ["tabs", "variant", "size"],
    },
  }),

  // =========================================================================
  // MODAL - Dialog Component
  // =========================================================================
  defineComponent({
    type: "Modal",
    label: "Modal",
    description: "Modal/dialog popup",
    category: "interactive",
    icon: "Square",
    render: ModalRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "textarea", label: "Description" },
      isOpen: { type: "toggle", label: "Show in Editor", defaultValue: true },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "md",
      },
      showCloseButton: { type: "toggle", label: "Show Close Button", defaultValue: true },
      centered: { type: "toggle", label: "Centered", defaultValue: true },
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      overlayOpacity: { type: "number", label: "Overlay Opacity (%)", min: 0, max: 100, defaultValue: 50 },
    },
    defaultProps: {
      isOpen: true,
      size: "md",
      showCloseButton: true,
      centered: true,
      overlayOpacity: 50,
    },
    ai: {
      description: "A modal dialog popup component",
      canModify: ["title", "description", "size"],
    },
  }),
];

// =============================================================================
// UI ELEMENT COMPONENTS
// =============================================================================

const uiComponents: ComponentDefinition[] = [
  // =========================================================================
  // BADGE - Status/Label Badge
  // =========================================================================
  defineComponent({
    type: "Badge",
    label: "Badge",
    description: "Status or label badge",
    category: "content",
    icon: "Tag",
    render: BadgeRender,
    fields: {
      text: { type: "text", label: "Text", defaultValue: "Badge" },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Default", value: "default" },
          { label: "Primary", value: "primary" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
          { label: "Info", value: "info" },
        ],
        defaultValue: "default",
      },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      rounded: {
        type: "select",
        label: "Rounded",
        options: [
          { label: "Default", value: "default" },
          { label: "Full (Pill)", value: "full" },
        ],
        defaultValue: "full",
      },
      outline: { type: "toggle", label: "Outline Style", defaultValue: false },
      dot: { type: "toggle", label: "Show Dot", defaultValue: false },
    },
    defaultProps: {
      text: "Badge",
      variant: "default",
      size: "md",
      rounded: "full",
    },
    ai: {
      description: "A status or label badge component",
      canModify: ["text", "variant", "size"],
    },
  }),

  // =========================================================================
  // AVATAR - User Avatar
  // =========================================================================
  defineComponent({
    type: "Avatar",
    label: "Avatar",
    description: "User avatar with status",
    category: "content",
    icon: "UserCircle",
    render: AvatarRender,
    fields: {
      src: { type: "image", label: "Image" },
      alt: { type: "text", label: "Alt Text", defaultValue: "Avatar" },
      name: { type: "text", label: "Name (for fallback initials)" },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "md",
      },
      shape: {
        type: "select",
        label: "Shape",
        options: [
          { label: "Circle", value: "circle" },
          { label: "Rounded", value: "rounded" },
          { label: "Square", value: "square" },
        ],
        defaultValue: "circle",
      },
      status: {
        type: "select",
        label: "Status",
        options: [
          { label: "None", value: "" },
          { label: "Online", value: "online" },
          { label: "Offline", value: "offline" },
          { label: "Busy", value: "busy" },
          { label: "Away", value: "away" },
        ],
        defaultValue: "",
      },
      border: { type: "toggle", label: "Show Border", defaultValue: false },
    },
    defaultProps: {
      size: "md",
      shape: "circle",
    },
    ai: {
      description: "A user avatar component with optional status indicator",
      canModify: ["src", "name", "size", "status"],
    },
  }),

  // =========================================================================
  // PROGRESS - Progress Bar
  // =========================================================================
  defineComponent({
    type: "Progress",
    label: "Progress",
    description: "Progress bar indicator",
    category: "content",
    icon: "BarChart",
    render: ProgressRender,
    fields: {
      value: { type: "number", label: "Value", min: 0, max: 100, defaultValue: 50 },
      max: { type: "number", label: "Max Value", defaultValue: 100 },
      label: { type: "text", label: "Label" },
      showValue: { type: "toggle", label: "Show Percentage", defaultValue: true },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Default", value: "default" },
          { label: "Gradient", value: "gradient" },
          { label: "Striped", value: "striped" },
        ],
        defaultValue: "default",
      },
      color: { type: "color", label: "Bar Color", defaultValue: "#3b82f6" },
      backgroundColor: { type: "color", label: "Track Color", defaultValue: "#e5e7eb" },
      rounded: { type: "toggle", label: "Rounded", defaultValue: true },
      animate: { type: "toggle", label: "Animate (Pulse)", defaultValue: false },
    },
    defaultProps: {
      value: 50,
      max: 100,
      showValue: true,
      size: "md",
      variant: "default",
      rounded: true,
    },
    ai: {
      description: "A progress bar indicator component",
      canModify: ["value", "label", "color", "variant"],
    },
  }),

  // =========================================================================
  // ALERT - Alert/Notification
  // =========================================================================
  defineComponent({
    type: "Alert",
    label: "Alert",
    description: "Alert or notification message",
    category: "content",
    icon: "AlertCircle",
    render: AlertRender,
    fields: {
      title: { type: "text", label: "Title" },
      message: { type: "textarea", label: "Message" },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Info", value: "info" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
        defaultValue: "info",
      },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      icon: { type: "toggle", label: "Show Icon", defaultValue: true },
      closable: { type: "toggle", label: "Closable", defaultValue: false },
    },
    defaultProps: {
      variant: "info",
      size: "md",
      icon: true,
      closable: false,
    },
    ai: {
      description: "An alert or notification message component",
      canModify: ["title", "message", "variant"],
    },
  }),

  // =========================================================================
  // TOOLTIP - Hover Tooltip
  // =========================================================================
  defineComponent({
    type: "Tooltip",
    label: "Tooltip",
    description: "Hover tooltip wrapper",
    category: "content",
    icon: "MessageSquare",
    render: TooltipRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      text: { type: "text", label: "Tooltip Text", defaultValue: "Tooltip" },
      position: {
        type: "select",
        label: "Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "top",
      },
      variant: {
        type: "select",
        label: "Style",
        options: [
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
        ],
        defaultValue: "dark",
      },
    },
    defaultProps: {
      text: "Tooltip",
      position: "top",
      variant: "dark",
    },
    ai: {
      description: "A tooltip that shows on hover",
      canModify: ["text", "position"],
    },
  }),
];

// =============================================================================
// MARKETING COMPONENTS
// =============================================================================

const marketingComponents: ComponentDefinition[] = [
  defineComponent({
    type: "AnnouncementBar",
    label: "Announcement Bar",
    description: "Top banner announcement",
    category: "marketing",
    icon: "Bell",
    render: AnnouncementBarRender,
    fields: {
      text: { type: "text", label: "Announcement Text" },
      link: { type: "link", label: "Link" },
      backgroundColor: { type: "color", label: "Background Color" },
      textColor: { type: "color", label: "Text Color" },
      closable: { type: "toggle", label: "Closable", defaultValue: true },
    },
    defaultProps: {
      closable: true,
    },
    ai: {
      description: "A top banner announcement bar",
      canModify: ["text", "link", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "SocialProof",
    label: "Social Proof",
    description: "Social proof indicators",
    category: "marketing",
    icon: "Users",
    render: SocialProofRender,
    fields: {
      text: { type: "text", label: "Text" },
      count: { type: "number", label: "Count" },
      showAvatars: { type: "toggle", label: "Show Avatars", defaultValue: true },
    },
    defaultProps: {
      showAvatars: true,
    },
    ai: {
      description: "Social proof indicators with user count",
      canModify: ["text", "count"],
    },
  }),

  defineComponent({
    type: "TrustBadges",
    label: "Trust Badges",
    description: "Trust and security badges",
    category: "marketing",
    icon: "ShieldCheck",
    render: TrustBadgesRender,
    fields: {
      badges: {
        type: "array",
        label: "Badges",
        itemFields: {
          icon: { type: "text", label: "Icon" },
          text: { type: "text", label: "Text" },
        },
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
    },
    defaultProps: {
      badges: [],
      alignment: "center",
    },
    ai: {
      description: "Trust and security badges display",
      canModify: ["badges", "alignment"],
    },
  }),

  defineComponent({
    type: "LogoCloud",
    label: "Logo Cloud",
    description: "Client/partner logos",
    category: "marketing",
    icon: "Building2",
    render: LogoCloudRender,
    fields: {
      title: { type: "text", label: "Title" },
      logos: {
        type: "array",
        label: "Logos",
        itemFields: {
          image: { type: "image", label: "Logo" },
          alt: { type: "text", label: "Alt Text" },
          link: { type: "link", label: "Link" },
        },
      },
    },
    defaultProps: {
      logos: [],
    },
    ai: {
      description: "A cloud of client/partner logos",
      canModify: ["title", "logos"],
    },
  }),

  defineComponent({
    type: "ComparisonTable",
    label: "Comparison Table",
    description: "Feature comparison table",
    category: "marketing",
    icon: "Table",
    render: ComparisonTableRender,
    fields: {
      title: { type: "text", label: "Title" },
      columns: {
        type: "array",
        label: "Columns",
        itemFields: {
          name: { type: "text", label: "Name" },
          highlighted: { type: "toggle", label: "Highlighted" },
        },
      },
      rows: {
        type: "array",
        label: "Features",
        itemFields: {
          feature: { type: "text", label: "Feature" },
          values: { type: "text", label: "Values (comma-separated)" },
        },
      },
    },
    defaultProps: {
      columns: [],
      rows: [],
    },
    ai: {
      description: "A feature comparison table",
      canModify: ["title", "columns", "rows"],
    },
  }),
];

// =============================================================================
// E-COMMERCE COMPONENTS
// =============================================================================

const ecommerceComponents: ComponentDefinition[] = [
  defineComponent({
    type: "ProductGrid",
    label: "Product Grid",
    description: "Grid of product cards",
    category: "ecommerce",
    icon: "ShoppingBag",
    render: ProductGridRender,
    fields: {
      title: { type: "text", label: "Title" },
      products: {
        type: "array",
        label: "Products",
        itemFields: {
          name: { type: "text", label: "Name" },
          price: { type: "number", label: "Price" },
          image: { type: "image", label: "Image" },
          link: { type: "link", label: "Link" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "4",
      },
    },
    defaultProps: {
      products: [],
      columns: 4,
    },
    ai: {
      description: "A grid displaying product cards",
      canModify: ["title", "columns"],
    },
  }),

  defineComponent({
    type: "ProductCard",
    label: "Product Card",
    description: "Single product card",
    category: "ecommerce",
    icon: "ShoppingBag",
    render: ProductCardRender,
    fields: {
      name: { type: "text", label: "Product Name" },
      price: { type: "number", label: "Price" },
      originalPrice: { type: "number", label: "Original Price" },
      image: { type: "image", label: "Image" },
      link: { type: "link", label: "Product Link" },
      badge: { type: "text", label: "Badge Text" },
      rating: { type: "number", label: "Rating", min: 0, max: 5 },
    },
    defaultProps: {},
    ai: {
      description: "A single product card",
      canModify: ["name", "price", "badge"],
    },
  }),

  defineComponent({
    type: "ProductCategories",
    label: "Product Categories",
    description: "Category navigation",
    category: "ecommerce",
    icon: "Tags",
    render: ProductCategoriesRender,
    fields: {
      title: { type: "text", label: "Title" },
      categories: {
        type: "array",
        label: "Categories",
        itemFields: {
          name: { type: "text", label: "Name" },
          image: { type: "image", label: "Image" },
          link: { type: "link", label: "Link" },
        },
      },
    },
    defaultProps: {
      categories: [],
    },
    ai: {
      description: "Product category navigation",
      canModify: ["title", "categories"],
    },
  }),

  defineComponent({
    type: "CartSummary",
    label: "Cart Summary",
    description: "Shopping cart summary",
    category: "ecommerce",
    icon: "ShoppingCart",
    render: CartSummaryRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Your Cart" },
      showCoupon: { type: "toggle", label: "Show Coupon Field", defaultValue: true },
      checkoutLink: { type: "link", label: "Checkout Link" },
    },
    defaultProps: {
      title: "Your Cart",
      showCoupon: true,
    },
    ai: {
      description: "A shopping cart summary widget",
      canModify: ["title", "showCoupon"],
    },
  }),

  defineComponent({
    type: "FeaturedProducts",
    label: "Featured Products",
    description: "Featured products section",
    category: "ecommerce",
    icon: "Star",
    render: FeaturedProductsRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Featured Products" },
      products: {
        type: "array",
        label: "Products",
        itemFields: {
          name: { type: "text", label: "Name" },
          price: { type: "number", label: "Price" },
          image: { type: "image", label: "Image" },
          link: { type: "link", label: "Link" },
        },
      },
    },
    defaultProps: {
      title: "Featured Products",
      products: [],
    },
    ai: {
      description: "A featured products showcase",
      canModify: ["title", "products"],
    },
  }),

  defineComponent({
    type: "CartIcon",
    label: "Cart Icon",
    description: "Shopping cart icon with count",
    category: "ecommerce",
    icon: "ShoppingCart",
    render: CartIconRender,
    fields: {
      style: {
        type: "select",
        label: "Style",
        options: [
          { label: "Default", value: "default" },
          { label: "Minimal", value: "minimal" },
          { label: "Outlined", value: "outlined" },
        ],
        defaultValue: "default",
      },
      showCount: { type: "toggle", label: "Show Count", defaultValue: true },
    },
    defaultProps: {
      style: "default",
      showCount: true,
    },
    ai: {
      description: "A shopping cart icon with item count",
      canModify: ["style", "showCount"],
    },
  }),
];

// =============================================================================
// 3D EFFECTS COMPONENTS (Phase 31)
// =============================================================================

const effectsComponents: ComponentDefinition[] = [
  defineComponent({
    type: "CardFlip3D",
    label: "3D Flip Card",
    description: "A card that flips to reveal back content on hover or click",
    category: "3d",
    icon: "RotateCcw",
    render: CardFlip3DRender,
    fields: {
      frontTitle: { type: "text", label: "Front Title", defaultValue: "Front Side" },
      frontDescription: { type: "text", label: "Front Description", defaultValue: "Hover to flip" },
      backTitle: { type: "text", label: "Back Title", defaultValue: "Back Side" },
      backDescription: { type: "text", label: "Back Description", defaultValue: "Amazing content here" },
      frontBackgroundColor: { type: "color", label: "Front Color", defaultValue: "#6366f1" },
      backBackgroundColor: { type: "color", label: "Back Color", defaultValue: "#ec4899" },
      frontImage: { type: "image", label: "Front Image" },
      backImage: { type: "image", label: "Back Image" },
      flipOn: {
        type: "select",
        label: "Flip Trigger",
        options: [
          { label: "Hover", value: "hover" },
          { label: "Click", value: "click" },
        ],
        defaultValue: "hover",
      },
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "md",
      },
      height: {
        type: "select",
        label: "Height",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "lg",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: presetOptions.shadow,
        defaultValue: "lg",
      },
    },
    defaultProps: {
      frontTitle: "Front Side",
      frontDescription: "Hover to flip",
      backTitle: "Back Side",
      backDescription: "Amazing content here",
      frontBackgroundColor: "#6366f1",
      backBackgroundColor: "#ec4899",
      flipOn: "hover",
      width: "md",
      height: "md",
      borderRadius: "lg",
      shadow: "lg",
    },
    ai: {
      description: "A 3D flip card that reveals back content on hover or click, perfect for team members, product features, or interactive content",
      canModify: ["frontTitle", "frontDescription", "backTitle", "backDescription", "frontBackgroundColor", "backBackgroundColor", "flipOn"],
      suggestions: ["Add images to both sides", "Change flip trigger to click", "Update card colors"],
    },
  }),

  defineComponent({
    type: "TiltCard",
    label: "3D Tilt Card",
    description: "A card with 3D tilt effect on mouse hover",
    category: "3d",
    icon: "Move3d",
    render: TiltCardRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Tilt Card" },
      description: { type: "text", label: "Description", defaultValue: "Hover to see 3D tilt effect" },
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#1f2937" },
      backgroundImage: { type: "image", label: "Background Image" },
      textColor: { type: "color", label: "Text Color", defaultValue: "#ffffff" },
      maxRotation: {
        type: "number",
        label: "Max Rotation (deg)",
        min: 5,
        max: 45,
        defaultValue: 15,
      },
      scale: {
        type: "number",
        label: "Hover Scale",
        min: 1,
        max: 1.2,
        step: 0.01,
        defaultValue: 1.05,
      },
      glare: { type: "toggle", label: "Enable Glare Effect", defaultValue: true },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "lg",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "xl",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: presetOptions.shadow,
        defaultValue: "xl",
      },
    },
    defaultProps: {
      title: "Tilt Card",
      description: "Hover to see 3D tilt effect",
      backgroundColor: "#1f2937",
      textColor: "#ffffff",
      maxRotation: 15,
      scale: 1.05,
      glare: true,
      padding: "lg",
      borderRadius: "xl",
      shadow: "xl",
    },
    ai: {
      description: "An interactive card with 3D tilt effect on mouse hover, adds depth and interactivity",
      canModify: ["title", "description", "backgroundColor", "textColor", "maxRotation", "glare"],
      suggestions: ["Add background image", "Adjust tilt intensity", "Toggle glare effect"],
    },
  }),

  defineComponent({
    type: "GlassCard",
    label: "Glass Card",
    description: "A card with glassmorphism (frosted glass) effect",
    category: "3d",
    icon: "Sparkles",
    render: GlassCardRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Glass Card" },
      description: { type: "text", label: "Description", defaultValue: "Beautiful frosted glass effect" },
      preset: {
        type: "select",
        label: "Glass Preset",
        options: [
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
          { label: "Colored", value: "colored" },
          { label: "Subtle", value: "subtle" },
          { label: "Heavy", value: "heavy" },
        ],
        defaultValue: "light",
      },
      blur: {
        type: "number",
        label: "Blur Amount (px)",
        min: 0,
        max: 50,
        defaultValue: 10,
      },
      tint: { type: "color", label: "Tint Color" },
      borderOpacity: {
        type: "number",
        label: "Border Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.2,
      },
      textColor: { type: "color", label: "Text Color", defaultValue: "#ffffff" },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "lg",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "xl",
      },
    },
    defaultProps: {
      title: "Glass Card",
      description: "Beautiful frosted glass effect",
      preset: "light",
      blur: 10,
      borderOpacity: 0.2,
      textColor: "#ffffff",
      padding: "lg",
      borderRadius: "xl",
    },
    ai: {
      description: "A card with modern glassmorphism effect - frosted glass with blur and transparency",
      canModify: ["title", "description", "preset", "blur", "tint", "textColor"],
      suggestions: ["Try dark preset", "Increase blur effect", "Add custom tint color"],
    },
  }),

  defineComponent({
    type: "ParticleBackground",
    label: "Particle Background",
    description: "Animated particle effects for backgrounds",
    category: "3d",
    icon: "Atom",
    render: ParticleBackgroundRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      particleCount: {
        type: "number",
        label: "Particle Count",
        min: 10,
        max: 200,
        defaultValue: 50,
      },
      particleColor: { type: "color", label: "Particle Color", defaultValue: "#6366f1" },
      particleSize: {
        type: "number",
        label: "Max Particle Size",
        min: 1,
        max: 10,
        defaultValue: 4,
      },
      speed: {
        type: "number",
        label: "Speed",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 1,
      },
      connected: { type: "toggle", label: "Connect Particles", defaultValue: true },
      connectionDistance: {
        type: "number",
        label: "Connection Distance",
        min: 50,
        max: 300,
        defaultValue: 150,
      },
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#0f172a" },
      height: {
        type: "select",
        label: "Height",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Full Screen", value: "screen" },
        ],
        defaultValue: "md",
      },
    },
    defaultProps: {
      particleCount: 50,
      particleColor: "#6366f1",
      particleSize: 4,
      speed: 1,
      connected: true,
      connectionDistance: 150,
      backgroundColor: "#0f172a",
      height: "md",
    },
    ai: {
      description: "An animated particle background that creates a modern, dynamic effect - great for hero sections",
      canModify: ["particleCount", "particleColor", "speed", "connected", "backgroundColor", "height"],
      suggestions: ["Increase particle count", "Change particle color", "Make full screen"],
    },
  }),

  defineComponent({
    type: "ScrollAnimate",
    label: "Scroll Animation",
    description: "Content that animates when scrolling into view",
    category: "3d",
    icon: "MoveVertical",
    render: ScrollAnimateRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Scroll Animation" },
      description: { type: "text", label: "Description", defaultValue: "This content animates when you scroll" },
      animation: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade Up", value: "fade-up" },
          { label: "Fade Down", value: "fade-down" },
          { label: "Fade Left", value: "fade-left" },
          { label: "Fade Right", value: "fade-right" },
          { label: "Zoom In", value: "zoom-in" },
          { label: "Zoom Out", value: "zoom-out" },
          { label: "Flip Up", value: "flip-up" },
          { label: "Flip Left", value: "flip-left" },
          { label: "Bounce In", value: "bounce-in" },
          { label: "Rotate In", value: "rotate-in" },
        ],
        defaultValue: "fade-up",
      },
      delay: {
        type: "number",
        label: "Delay (ms)",
        min: 0,
        max: 2000,
        step: 100,
        defaultValue: 0,
      },
      duration: {
        type: "number",
        label: "Duration (ms)",
        min: 100,
        max: 2000,
        step: 100,
        defaultValue: 600,
      },
      threshold: {
        type: "number",
        label: "Trigger Threshold (0-1)",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.1,
      },
      once: { type: "toggle", label: "Animate Once", defaultValue: true },
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#f8fafc" },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "lg",
      },
    },
    defaultProps: {
      title: "Scroll Animation",
      description: "This content animates when you scroll",
      animation: "fade-up",
      delay: 0,
      duration: 600,
      threshold: 0.1,
      once: true,
      backgroundColor: "#f8fafc",
      padding: "lg",
    },
    ai: {
      description: "A content block with scroll-triggered animation - reveals content as user scrolls",
      canModify: ["title", "description", "animation", "delay", "duration", "backgroundColor"],
      suggestions: ["Try bounce-in animation", "Add delay for stagger effect", "Change to zoom-in"],
    },
  }),
];

// =============================================================================
// REGISTER ALL COMPONENTS
// =============================================================================

/**
 * Register all core components with the registry
 */
export function registerCoreComponents(): void {
  const allComponents = [
    ...layoutComponents,
    ...typographyComponents,
    ...buttonComponents,
    ...mediaComponents,
    ...sectionComponents,
    ...navigationComponents,
    ...formComponents,
    ...contentComponents,
    ...interactiveComponents,
    ...uiComponents,
    ...marketingComponents,
    ...ecommerceComponents,
    ...effectsComponents,
  ];

  componentRegistry.registerAll(allComponents, "core");
  
  console.log(`[Studio] Registered ${componentRegistry.coreCount} core components`);
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  layoutComponents,
  typographyComponents,
  buttonComponents,
  mediaComponents,
  sectionComponents,
  navigationComponents,
  formComponents,
  contentComponents,
  interactiveComponents,
  uiComponents,
  marketingComponents,
  ecommerceComponents,
  effectsComponents,
};
