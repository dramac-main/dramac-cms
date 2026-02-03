/**
 * DRAMAC Studio Core Components
 * 
 * Registers all built-in components from the existing Puck implementation.
 * Uses adapter pattern to wrap existing renders with Studio metadata.
 */

import { componentRegistry, defineComponent } from "./component-registry";
import { presetOptions } from "./field-registry";
import type { ComponentDefinition } from "@/types/studio";

// Import existing render components - Layout
import {
  SectionRender,
  ContainerRender,
  ColumnsRender,
  CardRender,
  SpacerRender,
  DividerRender,
} from "@/components/editor/puck/components/layout";

// Import existing render components - Typography
import {
  HeadingRender,
  TextRender,
} from "@/components/editor/puck/components/typography";

// Import existing render components - Buttons
import {
  ButtonRender,
} from "@/components/editor/puck/components/buttons";

// Import existing render components - Media
import {
  ImageRender,
  VideoRender,
  MapRender,
} from "@/components/editor/puck/components/media";

// Import existing render components - Sections
import {
  HeroRender,
  FeaturesRender,
  CTARender,
  TestimonialsRender,
  FAQRender,
  StatsRender,
  TeamRender,
  GalleryRender,
} from "@/components/editor/puck/components/sections";

// Import existing render components - Navigation
import {
  NavbarRender,
  FooterRender,
  SocialLinksRender,
} from "@/components/editor/puck/components/navigation";

// Import existing render components - Forms
import {
  FormRender,
  FormFieldRender,
  ContactFormRender,
  NewsletterRender,
} from "@/components/editor/puck/components/forms";

// Import existing render components - Content
import {
  RichTextRender,
  QuoteRender,
  CodeBlockRender,
} from "@/components/editor/puck/components/content";

// Import existing render components - Interactive
import {
  CarouselRender,
  CountdownRender,
  TypewriterRender,
  ParallaxRender,
} from "@/components/editor/puck/components/interactive";

// Import existing render components - Marketing
import {
  AnnouncementBarRender,
  SocialProofRender,
  TrustBadgesRender,
  LogoCloudRender,
  ComparisonTableRender,
} from "@/components/editor/puck/components/marketing";

// Import existing render components - E-Commerce
import {
  ProductGridRender,
  ProductCardRender,
  ProductCategoriesRender,
  CartSummaryRender,
  FeaturedProductsRender,
  CartIconRender,
} from "@/components/editor/puck/components/ecommerce";

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
    ...marketingComponents,
    ...ecommerceComponents,
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
  marketingComponents,
  ecommerceComponents,
};
