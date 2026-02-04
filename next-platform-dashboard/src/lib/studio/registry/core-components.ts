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

// Import Premium components (Wix Studio quality)
import {
  NavbarRender,
  HeroRender,
  FooterRender,
} from "@/lib/studio/blocks/premium-components";

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
  FeaturesRender,
  CTARender,
  TestimonialsRender,
  FAQRender,
  StatsRender,
  TeamRender,
  GalleryRender,
  // Navigation
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
    description: "Paragraph text block with full typography controls",
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
      // === Typography Controls ===
      htmlTag: {
        type: "select",
        label: "HTML Tag",
        options: [
          { label: "Paragraph (p)", value: "p" },
          { label: "Heading 1 (h1)", value: "h1" },
          { label: "Heading 2 (h2)", value: "h2" },
          { label: "Heading 3 (h3)", value: "h3" },
          { label: "Heading 4 (h4)", value: "h4" },
          { label: "Heading 5 (h5)", value: "h5" },
          { label: "Heading 6 (h6)", value: "h6" },
          { label: "Span", value: "span" },
          { label: "Div", value: "div" },
        ],
        defaultValue: "p",
      },
      fontFamily: {
        type: "select",
        label: "Font Family",
        options: [
          { label: "System Default", value: "system-ui, -apple-system, sans-serif" },
          { label: "Inter", value: "'Inter', sans-serif" },
          { label: "Roboto", value: "'Roboto', sans-serif" },
          { label: "Open Sans", value: "'Open Sans', sans-serif" },
          { label: "Lato", value: "'Lato', sans-serif" },
          { label: "Montserrat", value: "'Montserrat', sans-serif" },
          { label: "Poppins", value: "'Poppins', sans-serif" },
          { label: "Playfair Display", value: "'Playfair Display', serif" },
          { label: "Georgia (Serif)", value: "Georgia, serif" },
          { label: "Monospace", value: "'SF Mono', 'Fira Code', monospace" },
        ],
        defaultValue: "system-ui, -apple-system, sans-serif",
      },
      fontSize: {
        type: "select",
        label: "Font Size",
        options: [
          { label: "Extra Small (12px)", value: "xs" },
          { label: "Small (14px)", value: "sm" },
          { label: "Base (16px)", value: "base" },
          { label: "Large (18px)", value: "lg" },
          { label: "XL (20px)", value: "xl" },
          { label: "2XL (24px)", value: "2xl" },
          { label: "3XL (30px)", value: "3xl" },
          { label: "4XL (36px)", value: "4xl" },
          { label: "5XL (48px)", value: "5xl" },
          { label: "6XL (60px)", value: "6xl" },
          { label: "7XL (72px)", value: "7xl" },
          { label: "8XL (96px)", value: "8xl" },
        ],
        defaultValue: "base",
      },
      fontWeight: {
        type: "select",
        label: "Font Weight",
        options: [
          { label: "Thin (100)", value: "100" },
          { label: "Extra Light (200)", value: "200" },
          { label: "Light (300)", value: "300" },
          { label: "Normal (400)", value: "400" },
          { label: "Medium (500)", value: "500" },
          { label: "Semi Bold (600)", value: "600" },
          { label: "Bold (700)", value: "700" },
          { label: "Extra Bold (800)", value: "800" },
          { label: "Black (900)", value: "900" },
        ],
        defaultValue: "400",
      },
      lineHeight: {
        type: "select",
        label: "Line Height",
        options: [
          { label: "None (1)", value: "1" },
          { label: "Tight (1.25)", value: "1.25" },
          { label: "Snug (1.375)", value: "1.375" },
          { label: "Normal (1.5)", value: "1.5" },
          { label: "Relaxed (1.625)", value: "1.625" },
          { label: "Loose (2)", value: "2" },
        ],
        defaultValue: "1.5",
      },
      letterSpacing: {
        type: "select",
        label: "Letter Spacing",
        options: [
          { label: "Tighter (-0.05em)", value: "-0.05em" },
          { label: "Tight (-0.025em)", value: "-0.025em" },
          { label: "Normal (0)", value: "0" },
          { label: "Wide (0.025em)", value: "0.025em" },
          { label: "Wider (0.05em)", value: "0.05em" },
          { label: "Widest (0.1em)", value: "0.1em" },
        ],
        defaultValue: "0",
      },
      textTransform: {
        type: "select",
        label: "Text Transform",
        options: [
          { label: "None", value: "none" },
          { label: "Uppercase", value: "uppercase" },
          { label: "Lowercase", value: "lowercase" },
          { label: "Capitalize", value: "capitalize" },
        ],
        defaultValue: "none",
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.textAlign,
        defaultValue: "left",
      },
      color: { type: "color", label: "Text Color" },
      // === Advanced Styling ===
      textDecoration: {
        type: "select",
        label: "Text Decoration",
        options: [
          { label: "None", value: "none" },
          { label: "Underline", value: "underline" },
          { label: "Line Through", value: "line-through" },
        ],
        defaultValue: "none",
      },
      textShadow: { type: "text", label: "Text Shadow (CSS)", placeholder: "2px 2px 4px rgba(0,0,0,0.3)" },
      maxWidth: { type: "text", label: "Max Width", placeholder: "600px or 80ch" },
    },
    fieldGroups: [
      { id: "content", label: "Content", icon: "Type", fields: ["text", "htmlTag"], defaultExpanded: true },
      { id: "typography", label: "Typography", icon: "ALargeSmall", fields: ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform"], defaultExpanded: true },
      { id: "style", label: "Style", icon: "Palette", fields: ["color", "alignment", "textDecoration", "textShadow", "maxWidth"], defaultExpanded: false },
    ],
    defaultProps: {
      text: "Your text content goes here.",
      htmlTag: "p",
      fontFamily: "system-ui, -apple-system, sans-serif",
      alignment: "left",
      fontSize: "base",
      fontWeight: "400",
      lineHeight: "1.5",
      letterSpacing: "0",
      textTransform: "none",
      textDecoration: "none",
    },
    ai: {
      description: "A paragraph text block with full typography controls",
      canModify: ["text", "alignment", "color", "fontSize", "fontFamily", "fontWeight", "htmlTag"],
      suggestions: ["Make it shorter", "Make it longer", "Improve clarity", "Make it a heading"],
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
    description: "Premium button with 60+ customization options including gradients, animations, badges, and tooltips",
    category: "buttons",
    icon: "MousePointer",
    render: ButtonRender,
    fields: {
      // Content
      label: { type: "text", label: "Button Text", defaultValue: "Click Me" },
      iconEmoji: { type: "text", label: "Icon (emoji)" },
      iconPosition: {
        type: "select",
        label: "Icon Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Icon Only", value: "only" },
        ],
        defaultValue: "left",
      },
      
      // Link & Action
      href: { type: "link", label: "Link URL" },
      target: {
        type: "select",
        label: "Link Target",
        options: [
          { label: "Same Window", value: "_self" },
          { label: "New Tab", value: "_blank" },
        ],
        defaultValue: "_self",
      },
      type: {
        type: "select",
        label: "Button Type",
        options: [
          { label: "Button", value: "button" },
          { label: "Submit", value: "submit" },
          { label: "Reset", value: "reset" },
        ],
        defaultValue: "button",
      },
      
      // Variant & Style
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Link", value: "link" },
          { label: "Destructive", value: "destructive" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "primary",
      },
      size: {
        type: "select",
        label: "Size",
        options: presetOptions.buttonSize,
        defaultValue: "md",
      },
      
      // Colors
      backgroundColor: { type: "color", label: "Background Color" },
      hoverBackgroundColor: { type: "color", label: "Hover Background" },
      textColor: { type: "color", label: "Text Color" },
      hoverTextColor: { type: "color", label: "Hover Text Color" },
      borderColor: { type: "color", label: "Border Color" },
      hoverBorderColor: { type: "color", label: "Hover Border Color" },
      
      // Gradient
      gradientFrom: { type: "color", label: "Gradient Start", defaultValue: "#3b82f6" },
      gradientTo: { type: "color", label: "Gradient End", defaultValue: "#8b5cf6" },
      gradientDirection: {
        type: "select",
        label: "Gradient Direction",
        options: [
          { label: "To Right", value: "to-r" },
          { label: "To Left", value: "to-l" },
          { label: "To Top", value: "to-t" },
          { label: "To Bottom", value: "to-b" },
          { label: "To Bottom Right", value: "to-br" },
          { label: "To Bottom Left", value: "to-bl" },
        ],
        defaultValue: "to-r",
      },
      
      // Border & Radius
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "md",
      },
      borderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "None", value: "0" },
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
        ],
        defaultValue: "1",
      },
      
      // Shadow
      shadow: {
        type: "select",
        label: "Shadow",
        options: presetOptions.shadow,
        defaultValue: "none",
      },
      hoverShadow: {
        type: "select",
        label: "Hover Shadow",
        options: presetOptions.shadow,
      },
      glowOnHover: { type: "toggle", label: "Glow on Hover" },
      glowColor: { type: "color", label: "Glow Color", defaultValue: "#3b82f6" },
      
      // Width
      fullWidth: { type: "toggle", label: "Full Width", defaultValue: false },
      fullWidthMobile: { type: "toggle", label: "Full Width on Mobile" },
      minWidth: { type: "text", label: "Min Width (CSS)" },
      
      // Typography
      fontWeight: {
        type: "select",
        label: "Font Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
        ],
        defaultValue: "medium",
      },
      textTransform: {
        type: "select",
        label: "Text Transform",
        options: [
          { label: "None", value: "none" },
          { label: "Uppercase", value: "uppercase" },
          { label: "Lowercase", value: "lowercase" },
          { label: "Capitalize", value: "capitalize" },
        ],
        defaultValue: "none",
      },
      letterSpacing: {
        type: "select",
        label: "Letter Spacing",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Wide", value: "wide" },
          { label: "Wider", value: "wider" },
        ],
        defaultValue: "normal",
      },
      
      // Animation
      hoverEffect: {
        type: "select",
        label: "Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Lift", value: "lift" },
          { label: "Scale", value: "scale" },
          { label: "Pulse", value: "pulse" },
          { label: "Shine", value: "shine" },
        ],
        defaultValue: "none",
      },
      transitionDuration: {
        type: "select",
        label: "Transition Speed",
        options: [
          { label: "Fast", value: "fast" },
          { label: "Normal", value: "normal" },
          { label: "Slow", value: "slow" },
        ],
        defaultValue: "normal",
      },
      
      // States
      disabled: { type: "toggle", label: "Disabled" },
      loading: { type: "toggle", label: "Loading State" },
      loadingText: { type: "text", label: "Loading Text" },
      loadingAnimation: {
        type: "select",
        label: "Loading Animation",
        options: [
          { label: "Spinner", value: "spinner" },
          { label: "Dots", value: "dots" },
          { label: "Pulse", value: "pulse" },
        ],
        defaultValue: "spinner",
      },
      
      // Focus
      focusRingColor: { type: "color", label: "Focus Ring Color", defaultValue: "#3b82f6" },
      
      // Icon Styling
      iconSize: {
        type: "select",
        label: "Icon Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      iconGap: {
        type: "select",
        label: "Icon Gap",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "sm",
      },
      iconColor: { type: "color", label: "Icon Color" },
      
      // Badge
      showBadge: { type: "toggle", label: "Show Badge" },
      badgeText: { type: "text", label: "Badge Text" },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#ef4444" },
      badgeTextColor: { type: "color", label: "Badge Text Color", defaultValue: "#ffffff" },
      badgePosition: {
        type: "select",
        label: "Badge Position",
        options: [
          { label: "Top Right", value: "top-right" },
          { label: "Top Left", value: "top-left" },
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Bottom Left", value: "bottom-left" },
        ],
        defaultValue: "top-right",
      },
      
      // Tooltip
      tooltip: { type: "text", label: "Tooltip Text" },
      tooltipPosition: {
        type: "select",
        label: "Tooltip Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "top",
      },
      
      // Accessibility
      ariaLabel: { type: "text", label: "Aria Label" },
    },
    fieldGroups: [
      { id: "content", label: "Content", icon: "type", fields: ["label", "iconEmoji", "iconPosition"], defaultExpanded: true },
      { id: "link", label: "Link & Action", icon: "link", fields: ["href", "target", "type"], defaultExpanded: true },
      { id: "style", label: "Style", icon: "palette", fields: ["variant", "size"], defaultExpanded: false },
      { id: "colors", label: "Colors", icon: "droplet", fields: ["backgroundColor", "hoverBackgroundColor", "textColor", "hoverTextColor", "borderColor", "hoverBorderColor"], defaultExpanded: false },
      { id: "gradient", label: "Gradient", icon: "sunset", fields: ["gradientFrom", "gradientTo", "gradientDirection"], defaultExpanded: false },
      { id: "border", label: "Border & Radius", icon: "square", fields: ["borderRadius", "borderWidth"], defaultExpanded: false },
      { id: "shadow", label: "Shadow & Glow", icon: "sun", fields: ["shadow", "hoverShadow", "glowOnHover", "glowColor"], defaultExpanded: false },
      { id: "sizing", label: "Sizing", icon: "maximize", fields: ["fullWidth", "fullWidthMobile", "minWidth"], defaultExpanded: false },
      { id: "typography", label: "Typography", icon: "type", fields: ["fontWeight", "textTransform", "letterSpacing"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "zap", fields: ["hoverEffect", "transitionDuration"], defaultExpanded: false },
      { id: "states", label: "States", icon: "toggle-left", fields: ["disabled", "loading", "loadingText", "loadingAnimation"], defaultExpanded: false },
      { id: "icon", label: "Icon Styling", icon: "image", fields: ["iconSize", "iconGap", "iconColor"], defaultExpanded: false },
      { id: "badge", label: "Badge", icon: "bell", fields: ["showBadge", "badgeText", "badgeColor", "badgeTextColor", "badgePosition"], defaultExpanded: false },
      { id: "tooltip", label: "Tooltip", icon: "message-circle", fields: ["tooltip", "tooltipPosition"], defaultExpanded: false },
      { id: "accessibility", label: "Accessibility", icon: "eye", fields: ["ariaLabel", "focusRingColor"], defaultExpanded: false },
    ],
    defaultProps: {
      label: "Click Me",
      variant: "primary",
      size: "md",
      fullWidth: false,
      borderRadius: "md",
    },
    ai: {
      description: "A premium button with extensive customization including gradients, animations, badges, tooltips, and loading states",
      canModify: ["label", "variant", "size", "backgroundColor", "textColor", "hoverEffect"],
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
    description: "Premium image with 50+ options including filters, overlays, frames, badges, and animations",
    category: "media",
    icon: "Image",
    render: ImageRender,
    fields: {
      // Source
      src: { type: "image", label: "Image" },
      alt: { type: "text", label: "Alt Text", defaultValue: "" },
      title: { type: "text", label: "Title (tooltip)" },
      
      // Sizing
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Full Width", value: "full" },
          { label: "3/4", value: "3/4" },
          { label: "2/3", value: "2/3" },
          { label: "1/2", value: "1/2" },
          { label: "1/3", value: "1/3" },
          { label: "1/4", value: "1/4" },
        ],
        defaultValue: "full",
      },
      maxWidth: { type: "text", label: "Max Width (CSS)" },
      maxHeight: { type: "text", label: "Max Height (CSS)" },
      aspectRatio: {
        type: "select",
        label: "Aspect Ratio",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Square (1:1)", value: "square" },
          { label: "Video (16:9)", value: "video" },
          { label: "4:3", value: "4/3" },
          { label: "3:2", value: "3/2" },
          { label: "21:9", value: "21/9" },
          { label: "Portrait (9:16)", value: "9/16" },
          { label: "Portrait (3:4)", value: "3/4" },
        ],
        defaultValue: "auto",
      },
      
      // Object Fit
      objectFit: {
        type: "select",
        label: "Object Fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
          { label: "Scale Down", value: "scale-down" },
        ],
        defaultValue: "cover",
      },
      objectPosition: {
        type: "select",
        label: "Object Position",
        options: [
          { label: "Center", value: "center" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Right", value: "bottom-right" },
        ],
        defaultValue: "center",
      },
      
      // Border & Radius
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
          { label: "3X Large", value: "3xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "none",
      },
      border: { type: "toggle", label: "Show Border" },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#e5e7eb" },
      borderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
          { label: "4px", value: "4" },
        ],
        defaultValue: "1",
      },
      borderStyle: {
        type: "select",
        label: "Border Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Dashed", value: "dashed" },
          { label: "Dotted", value: "dotted" },
          { label: "Double", value: "double" },
        ],
        defaultValue: "solid",
      },
      
      // Shadow
      shadow: {
        type: "select",
        label: "Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
          { label: "Inner", value: "inner" },
        ],
        defaultValue: "none",
      },
      hoverShadow: {
        type: "select",
        label: "Hover Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
      },
      
      // Hover Effects
      hoverZoom: { type: "toggle", label: "Zoom on Hover" },
      hoverZoomScale: { type: "number", label: "Zoom Scale", min: 1, max: 2, step: 0.05, defaultValue: 1.05 },
      hoverRotate: { type: "toggle", label: "Rotate on Hover" },
      hoverBrightness: { type: "toggle", label: "Brighten on Hover" },
      
      // Filters
      grayscale: { type: "toggle", label: "Grayscale" },
      grayscaleHoverOff: { type: "toggle", label: "Color on Hover" },
      blur: { type: "number", label: "Blur (px)", min: 0, max: 20, defaultValue: 0 },
      brightness: { type: "number", label: "Brightness (%)", min: 0, max: 200, defaultValue: 100 },
      contrast: { type: "number", label: "Contrast (%)", min: 0, max: 200, defaultValue: 100 },
      saturate: { type: "number", label: "Saturation (%)", min: 0, max: 200, defaultValue: 100 },
      sepia: { type: "toggle", label: "Sepia" },
      opacity: { type: "number", label: "Opacity (%)", min: 0, max: 100, defaultValue: 100 },
      
      // Overlay
      showOverlay: { type: "toggle", label: "Show Overlay" },
      overlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      overlayOpacity: { type: "number", label: "Overlay Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
      overlayContent: { type: "text", label: "Overlay Text" },
      overlayContentColor: { type: "color", label: "Overlay Text Color", defaultValue: "#ffffff" },
      overlayContentSize: {
        type: "select",
        label: "Overlay Text Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      overlayPosition: {
        type: "select",
        label: "Overlay Position",
        options: [
          { label: "Center", value: "center" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      
      // Caption
      caption: { type: "text", label: "Caption" },
      captionAlign: {
        type: "select",
        label: "Caption Align",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      captionColor: { type: "color", label: "Caption Color", defaultValue: "#6b7280" },
      captionBackgroundColor: { type: "color", label: "Caption Background" },
      captionPosition: {
        type: "select",
        label: "Caption Position",
        options: [
          { label: "Below", value: "below" },
          { label: "Overlay Bottom", value: "overlay-bottom" },
          { label: "Overlay Top", value: "overlay-top" },
        ],
        defaultValue: "below",
      },
      
      // Link
      href: { type: "link", label: "Link URL" },
      target: {
        type: "select",
        label: "Link Target",
        options: [
          { label: "Same Window", value: "_self" },
          { label: "New Tab", value: "_blank" },
        ],
        defaultValue: "_self",
      },
      
      // Loading
      loading: {
        type: "select",
        label: "Loading",
        options: [
          { label: "Lazy", value: "lazy" },
          { label: "Eager", value: "eager" },
        ],
        defaultValue: "lazy",
      },
      
      // Animation
      animateOnLoad: { type: "toggle", label: "Animate on Load" },
      animationType: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade", value: "fade" },
          { label: "Scale", value: "scale" },
          { label: "Slide Up", value: "slide-up" },
          { label: "Slide Down", value: "slide-down" },
        ],
        defaultValue: "fade",
      },
      animationDuration: {
        type: "select",
        label: "Animation Duration",
        options: [
          { label: "Fast", value: "fast" },
          { label: "Normal", value: "normal" },
          { label: "Slow", value: "slow" },
        ],
        defaultValue: "normal",
      },
      
      // Frame
      showFrame: { type: "toggle", label: "Show Frame" },
      frameColor: { type: "color", label: "Frame Color", defaultValue: "#ffffff" },
      framePadding: {
        type: "select",
        label: "Frame Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      frameStyle: {
        type: "select",
        label: "Frame Style",
        options: [
          { label: "Simple", value: "simple" },
          { label: "Polaroid", value: "polaroid" },
          { label: "Shadow Box", value: "shadow-box" },
          { label: "Rounded", value: "rounded" },
        ],
        defaultValue: "simple",
      },
      
      // Badge
      showBadge: { type: "toggle", label: "Show Badge" },
      badgeText: { type: "text", label: "Badge Text" },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#3b82f6" },
      badgePosition: {
        type: "select",
        label: "Badge Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Right", value: "bottom-right" },
        ],
        defaultValue: "top-right",
      },
    },
    fieldGroups: [
      { id: "source", label: "Source", icon: "image", fields: ["src", "alt", "title"], defaultExpanded: true },
      { id: "sizing", label: "Sizing", icon: "maximize", fields: ["width", "maxWidth", "maxHeight", "aspectRatio"], defaultExpanded: false },
      { id: "fit", label: "Fit & Position", icon: "move", fields: ["objectFit", "objectPosition"], defaultExpanded: false },
      { id: "border", label: "Border", icon: "square", fields: ["borderRadius", "border", "borderColor", "borderWidth", "borderStyle"], defaultExpanded: false },
      { id: "shadow", label: "Shadow", icon: "sun", fields: ["shadow", "hoverShadow"], defaultExpanded: false },
      { id: "hover", label: "Hover Effects", icon: "mouse-pointer", fields: ["hoverZoom", "hoverZoomScale", "hoverRotate", "hoverBrightness"], defaultExpanded: false },
      { id: "filters", label: "Filters", icon: "sliders", fields: ["grayscale", "grayscaleHoverOff", "blur", "brightness", "contrast", "saturate", "sepia", "opacity"], defaultExpanded: false },
      { id: "overlay", label: "Overlay", icon: "layers", fields: ["showOverlay", "overlayColor", "overlayOpacity", "overlayContent", "overlayContentColor", "overlayContentSize", "overlayPosition"], defaultExpanded: false },
      { id: "caption", label: "Caption", icon: "type", fields: ["caption", "captionAlign", "captionColor", "captionBackgroundColor", "captionPosition"], defaultExpanded: false },
      { id: "link", label: "Link", icon: "link", fields: ["href", "target"], defaultExpanded: false },
      { id: "loading", label: "Loading", icon: "loader", fields: ["loading"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "zap", fields: ["animateOnLoad", "animationType", "animationDuration"], defaultExpanded: false },
      { id: "frame", label: "Frame", icon: "frame", fields: ["showFrame", "frameColor", "framePadding", "frameStyle"], defaultExpanded: false },
      { id: "badge", label: "Badge", icon: "tag", fields: ["showBadge", "badgeText", "badgeColor", "badgePosition"], defaultExpanded: false },
    ],
    defaultProps: {
      alt: "",
      width: "full",
      objectFit: "cover",
      borderRadius: "none",
      loading: "lazy",
    },
    ai: {
      description: "A premium image with filters, overlays, frames, badges, and hover effects",
      canModify: ["alt", "width", "aspectRatio", "borderRadius", "grayscale", "hoverZoom", "caption"],
    },
  }),

  defineComponent({
    type: "Video",
    label: "Video",
    description: "Premium video player with 50+ options including YouTube/Vimeo support, custom play buttons, and overlays",
    category: "media",
    icon: "Video",
    render: VideoRender,
    fields: {
      // Source
      src: { type: "text", label: "Video URL" },
      poster: { type: "image", label: "Poster Image" },
      type: {
        type: "select",
        label: "Video Type",
        options: [
          { label: "File", value: "file" },
          { label: "YouTube", value: "youtube" },
          { label: "Vimeo", value: "vimeo" },
          { label: "Embed", value: "embed" },
        ],
        defaultValue: "file",
      },
      
      // Sizing
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Full", value: "full" },
          { label: "3/4", value: "3/4" },
          { label: "2/3", value: "2/3" },
          { label: "1/2", value: "1/2" },
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "full",
      },
      maxWidth: { type: "text", label: "Max Width (CSS)" },
      aspectRatio: {
        type: "select",
        label: "Aspect Ratio",
        options: [
          { label: "16:9", value: "video" },
          { label: "Square", value: "square" },
          { label: "4:3", value: "4/3" },
          { label: "21:9", value: "21/9" },
          { label: "9:16 (Portrait)", value: "9/16" },
          { label: "Custom", value: "custom" },
        ],
        defaultValue: "video",
      },
      customAspect: { type: "text", label: "Custom Aspect (e.g. 4/3)" },
      
      // Playback
      autoplay: { type: "toggle", label: "Autoplay", defaultValue: false },
      muted: { type: "toggle", label: "Muted", defaultValue: false },
      loop: { type: "toggle", label: "Loop", defaultValue: false },
      controls: { type: "toggle", label: "Show Controls", defaultValue: true },
      playsinline: { type: "toggle", label: "Play Inline (mobile)", defaultValue: true },
      preload: {
        type: "select",
        label: "Preload",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Metadata Only", value: "metadata" },
          { label: "None", value: "none" },
        ],
        defaultValue: "metadata",
      },
      startTime: { type: "number", label: "Start Time (seconds)", min: 0, defaultValue: 0 },
      endTime: { type: "number", label: "End Time (seconds)", min: 0 },
      playbackSpeed: { type: "number", label: "Playback Speed", min: 0.25, max: 2, step: 0.25, defaultValue: 1 },
      
      // YouTube/Vimeo Options
      showRelated: { type: "toggle", label: "Show Related Videos", defaultValue: false },
      showInfo: { type: "toggle", label: "Show Video Info", defaultValue: true },
      modestBranding: { type: "toggle", label: "Modest Branding", defaultValue: true },
      privacyEnhanced: { type: "toggle", label: "Privacy Enhanced Mode", defaultValue: true },
      
      // Appearance
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "md",
      },
      border: { type: "toggle", label: "Show Border" },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#e5e7eb" },
      borderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
          { label: "4px", value: "4" },
        ],
        defaultValue: "1",
      },
      
      // Overlay
      showThumbnailOverlay: { type: "toggle", label: "Show Thumbnail Overlay" },
      thumbnailOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      thumbnailOverlayOpacity: { type: "number", label: "Overlay Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.3 },
      customPlayButton: { type: "toggle", label: "Custom Play Button" },
      playButtonColor: { type: "color", label: "Play Button Color", defaultValue: "#ffffff" },
      playButtonSize: {
        type: "select",
        label: "Play Button Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      playButtonStyle: {
        type: "select",
        label: "Play Button Style",
        options: [
          { label: "Circle", value: "circle" },
          { label: "Rounded", value: "rounded" },
          { label: "Minimal", value: "minimal" },
        ],
        defaultValue: "circle",
      },
      
      // Loading
      loading: {
        type: "select",
        label: "Loading",
        options: [
          { label: "Lazy", value: "lazy" },
          { label: "Eager", value: "eager" },
        ],
        defaultValue: "lazy",
      },
      showLoadingSpinner: { type: "toggle", label: "Show Loading Spinner" },
      loadingSpinnerColor: { type: "color", label: "Spinner Color", defaultValue: "#3b82f6" },
      
      // Caption
      caption: { type: "text", label: "Caption" },
      captionAlign: {
        type: "select",
        label: "Caption Align",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      captionColor: { type: "color", label: "Caption Color", defaultValue: "#6b7280" },
      captionSize: {
        type: "select",
        label: "Caption Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "sm",
      },
      
      // Container
      backgroundColor: { type: "color", label: "Background Color" },
      padding: {
        type: "select",
        label: "Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "none",
      },
      
      // Title Bar
      showTitleBar: { type: "toggle", label: "Show Title Bar" },
      title: { type: "text", label: "Title" },
      titleBarColor: { type: "color", label: "Title Bar Color", defaultValue: "#1f2937" },
      titleBarTextColor: { type: "color", label: "Title Text Color", defaultValue: "#ffffff" },
      
      // Accessibility
      ariaLabel: { type: "text", label: "Aria Label" },
    },
    fieldGroups: [
      { id: "source", label: "Source", icon: "video", fields: ["src", "poster", "type"], defaultExpanded: true },
      { id: "sizing", label: "Sizing", icon: "maximize", fields: ["width", "maxWidth", "aspectRatio", "customAspect"], defaultExpanded: false },
      { id: "playback", label: "Playback", icon: "play", fields: ["autoplay", "muted", "loop", "controls", "playsinline", "preload", "startTime", "endTime", "playbackSpeed"], defaultExpanded: false },
      { id: "platform", label: "Platform Options", icon: "youtube", fields: ["showRelated", "showInfo", "modestBranding", "privacyEnhanced"], defaultExpanded: false },
      { id: "appearance", label: "Appearance", icon: "palette", fields: ["borderRadius", "shadow", "border", "borderColor", "borderWidth"], defaultExpanded: false },
      { id: "overlay", label: "Overlay & Play Button", icon: "layers", fields: ["showThumbnailOverlay", "thumbnailOverlayColor", "thumbnailOverlayOpacity", "customPlayButton", "playButtonColor", "playButtonSize", "playButtonStyle"], defaultExpanded: false },
      { id: "loading", label: "Loading", icon: "loader", fields: ["loading", "showLoadingSpinner", "loadingSpinnerColor"], defaultExpanded: false },
      { id: "caption", label: "Caption", icon: "type", fields: ["caption", "captionAlign", "captionColor", "captionSize"], defaultExpanded: false },
      { id: "container", label: "Container", icon: "square", fields: ["backgroundColor", "padding"], defaultExpanded: false },
      { id: "titleBar", label: "Title Bar", icon: "menu", fields: ["showTitleBar", "title", "titleBarColor", "titleBarTextColor"], defaultExpanded: false },
      { id: "accessibility", label: "Accessibility", icon: "eye", fields: ["ariaLabel"], defaultExpanded: false },
    ],
    defaultProps: {
      type: "file",
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      aspectRatio: "video",
      borderRadius: "lg",
      shadow: "md",
    },
    ai: {
      description: "A premium video player supporting YouTube, Vimeo, and native video with custom play buttons and overlays",
      canModify: ["src", "aspectRatio", "autoplay", "controls", "borderRadius"],
    },
  }),

  defineComponent({
    type: "Map",
    label: "Map",
    description: "Premium embedded map with 40+ options including markers, styles, directions, and info windows",
    category: "media",
    icon: "MapPin",
    render: MapRender,
    fields: {
      // Location
      address: { type: "text", label: "Address", defaultValue: "New York, NY" },
      latitude: { type: "number", label: "Latitude" },
      longitude: { type: "number", label: "Longitude" },
      
      // Provider
      provider: {
        type: "select",
        label: "Map Provider",
        options: [
          { label: "Google Maps", value: "google" },
          { label: "OpenStreetMap", value: "openstreetmap" },
        ],
        defaultValue: "google",
      },
      
      // Map Settings
      zoom: { type: "number", label: "Zoom Level", min: 1, max: 20, defaultValue: 14 },
      mapType: {
        type: "select",
        label: "Map Type",
        options: [
          { label: "Roadmap", value: "roadmap" },
          { label: "Satellite", value: "satellite" },
          { label: "Hybrid", value: "hybrid" },
          { label: "Terrain", value: "terrain" },
        ],
        defaultValue: "roadmap",
      },
      
      // Sizing
      height: { type: "number", label: "Height (px)", min: 100, max: 800, defaultValue: 300 },
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Full", value: "full" },
          { label: "3/4", value: "3/4" },
          { label: "2/3", value: "2/3" },
          { label: "1/2", value: "1/2" },
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "full",
      },
      maxWidth: { type: "text", label: "Max Width (CSS)" },
      aspectRatio: {
        type: "select",
        label: "Aspect Ratio",
        options: [
          { label: "Auto (use height)", value: "auto" },
          { label: "16:9", value: "video" },
          { label: "Square", value: "square" },
          { label: "4:3", value: "4/3" },
          { label: "21:9", value: "21/9" },
        ],
        defaultValue: "auto",
      },
      
      // Appearance
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      border: { type: "toggle", label: "Show Border" },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#e5e7eb" },
      borderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
          { label: "4px", value: "4" },
        ],
        defaultValue: "1",
      },
      
      // Marker
      showMarker: { type: "toggle", label: "Show Marker", defaultValue: true },
      markerColor: { type: "color", label: "Marker Color", defaultValue: "#ef4444" },
      markerLabel: { type: "text", label: "Marker Label" },
      
      // Controls
      showZoomControls: { type: "toggle", label: "Zoom Controls", defaultValue: true },
      showFullscreenButton: { type: "toggle", label: "Fullscreen Button", defaultValue: true },
      showMapTypeControl: { type: "toggle", label: "Map Type Control" },
      showStreetViewControl: { type: "toggle", label: "Street View Control" },
      showScaleControl: { type: "toggle", label: "Scale Control" },
      
      // Interaction
      allowScrollZoom: { type: "toggle", label: "Allow Scroll Zoom" },
      allowDragging: { type: "toggle", label: "Allow Dragging", defaultValue: true },
      
      // Style
      mapStyle: {
        type: "select",
        label: "Map Style",
        options: [
          { label: "Default", value: "default" },
          { label: "Silver", value: "silver" },
          { label: "Retro", value: "retro" },
          { label: "Dark", value: "dark" },
          { label: "Night", value: "night" },
          { label: "Aubergine", value: "aubergine" },
        ],
        defaultValue: "default",
      },
      grayscale: { type: "toggle", label: "Grayscale" },
      saturation: { type: "number", label: "Saturation (%)", min: 0, max: 100, defaultValue: 100 },
      
      // Info Window
      showInfoWindow: { type: "toggle", label: "Show Info Window" },
      infoWindowTitle: { type: "text", label: "Info Window Title" },
      
      // Directions
      showDirectionsLink: { type: "toggle", label: "Show Directions Link" },
      directionsLinkText: { type: "text", label: "Directions Text", defaultValue: "Get Directions" },
      directionsLinkPosition: {
        type: "select",
        label: "Directions Position",
        options: [
          { label: "Above Map", value: "above" },
          { label: "Below Map", value: "below" },
          { label: "Overlay", value: "overlay" },
        ],
        defaultValue: "below",
      },
      
      // Loading
      loading: {
        type: "select",
        label: "Loading",
        options: [
          { label: "Lazy", value: "lazy" },
          { label: "Eager", value: "eager" },
        ],
        defaultValue: "lazy",
      },
      showLoadingPlaceholder: { type: "toggle", label: "Show Loading Placeholder", defaultValue: true },
      placeholderColor: { type: "color", label: "Placeholder Color", defaultValue: "#f3f4f6" },
      
      // Caption
      caption: { type: "text", label: "Caption" },
      captionAlign: {
        type: "select",
        label: "Caption Align",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      captionColor: { type: "color", label: "Caption Color", defaultValue: "#6b7280" },
      
      // Container
      backgroundColor: { type: "color", label: "Background Color" },
      padding: {
        type: "select",
        label: "Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "none",
      },
      
      // Accessibility
      ariaLabel: { type: "text", label: "Aria Label" },
      title: { type: "text", label: "Title" },
    },
    fieldGroups: [
      { id: "location", label: "Location", icon: "map-pin", fields: ["address", "latitude", "longitude"], defaultExpanded: true },
      { id: "provider", label: "Provider & Type", icon: "map", fields: ["provider", "mapType", "zoom"], defaultExpanded: false },
      { id: "sizing", label: "Sizing", icon: "maximize", fields: ["height", "width", "maxWidth", "aspectRatio"], defaultExpanded: false },
      { id: "appearance", label: "Appearance", icon: "palette", fields: ["borderRadius", "shadow", "border", "borderColor", "borderWidth"], defaultExpanded: false },
      { id: "marker", label: "Marker", icon: "map-pin", fields: ["showMarker", "markerColor", "markerLabel"], defaultExpanded: false },
      { id: "controls", label: "Controls", icon: "sliders", fields: ["showZoomControls", "showFullscreenButton", "showMapTypeControl", "showStreetViewControl", "showScaleControl"], defaultExpanded: false },
      { id: "interaction", label: "Interaction", icon: "mouse-pointer", fields: ["allowScrollZoom", "allowDragging"], defaultExpanded: false },
      { id: "style", label: "Style", icon: "droplet", fields: ["mapStyle", "grayscale", "saturation"], defaultExpanded: false },
      { id: "infoWindow", label: "Info Window", icon: "info", fields: ["showInfoWindow", "infoWindowTitle"], defaultExpanded: false },
      { id: "directions", label: "Directions", icon: "navigation", fields: ["showDirectionsLink", "directionsLinkText", "directionsLinkPosition"], defaultExpanded: false },
      { id: "loading", label: "Loading", icon: "loader", fields: ["loading", "showLoadingPlaceholder", "placeholderColor"], defaultExpanded: false },
      { id: "caption", label: "Caption", icon: "type", fields: ["caption", "captionAlign", "captionColor"], defaultExpanded: false },
      { id: "container", label: "Container", icon: "square", fields: ["backgroundColor", "padding"], defaultExpanded: false },
      { id: "accessibility", label: "Accessibility", icon: "eye", fields: ["ariaLabel", "title"], defaultExpanded: false },
    ],
    defaultProps: {
      address: "New York, NY",
      zoom: 14,
      height: 300,
      provider: "google",
      mapType: "roadmap",
      borderRadius: "lg",
      shadow: "md",
      showMarker: true,
    },
    ai: {
      description: "A premium embedded map with markers, styles, directions links, and comprehensive customization",
      canModify: ["address", "zoom", "height", "mapType", "borderRadius", "showDirectionsLink"],
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
    description: "Premium hero section with all variants - Wix Studio quality",
    category: "sections",
    icon: "Star",
    render: HeroRender,
    fields: {
      // === Content ===
      title: {
        type: "text",
        label: "Title",
        defaultValue: "Build Something Amazing",
      },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "xl",
      },
      titleColor: { type: "color", label: "Title Color" },
      titleWeight: {
        type: "select",
        label: "Title Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
          { label: "Extra Bold", value: "extrabold" },
        ],
        defaultValue: "bold",
      },
      titleAlign: {
        type: "select",
        label: "Title Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      subtitle: {
        type: "text",
        label: "Subtitle (above title)",
      },
      subtitleSize: {
        type: "select",
        label: "Subtitle Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "lg",
      },
      subtitleColor: { type: "color", label: "Subtitle Color" },
      description: {
        type: "textarea",
        label: "Description",
        rows: 3,
        defaultValue: "Create beautiful, responsive websites with our powerful drag-and-drop builder.",
      },
      descriptionSize: {
        type: "select",
        label: "Description Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      descriptionColor: { type: "color", label: "Description Color" },
      descriptionMaxWidth: {
        type: "select",
        label: "Description Max Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      // === Badge ===
      badge: { type: "text", label: "Badge Text" },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#3b82f6" },
      badgeTextColor: { type: "color", label: "Badge Text Color", defaultValue: "#ffffff" },
      badgeStyle: {
        type: "select",
        label: "Badge Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Pill", value: "pill" },
        ],
        defaultValue: "pill",
      },
      // === Primary CTA ===
      primaryButtonText: { type: "text", label: "Primary Button", defaultValue: "Get Started" },
      primaryButtonLink: { type: "link", label: "Primary Button Link" },
      primaryButtonColor: { type: "color", label: "Primary Button Color", defaultValue: "#3b82f6" },
      primaryButtonTextColor: { type: "color", label: "Primary Button Text", defaultValue: "#ffffff" },
      primaryButtonStyle: {
        type: "select",
        label: "Primary Button Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "solid",
      },
      primaryButtonSize: {
        type: "select",
        label: "Primary Button Size",
        options: presetOptions.buttonSize,
        defaultValue: "lg",
      },
      primaryButtonRadius: {
        type: "select",
        label: "Primary Button Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      primaryButtonIcon: {
        type: "select",
        label: "Primary Button Icon",
        options: [
          { label: "None", value: "none" },
          { label: "Arrow", value: "arrow" },
          { label: "Chevron", value: "chevron" },
          { label: "Play", value: "play" },
        ],
        defaultValue: "arrow",
      },
      // === Secondary CTA ===
      secondaryButtonText: { type: "text", label: "Secondary Button" },
      secondaryButtonLink: { type: "link", label: "Secondary Button Link" },
      secondaryButtonStyle: {
        type: "select",
        label: "Secondary Button Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "outline",
      },
      secondaryButtonColor: { type: "color", label: "Secondary Button Color" },
      // === Layout ===
      variant: {
        type: "select",
        label: "Hero Variant",
        options: [
          { label: "Centered", value: "centered" },
          { label: "Split (Image Right)", value: "split" },
          { label: "Split (Image Left)", value: "splitReverse" },
          { label: "Fullscreen", value: "fullscreen" },
          { label: "Video Background", value: "video" },
          { label: "Minimal", value: "minimal" },
        ],
        defaultValue: "centered",
      },
      contentAlign: {
        type: "select",
        label: "Content Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      verticalAlign: {
        type: "select",
        label: "Vertical Alignment",
        options: [
          { label: "Top", value: "top" },
          { label: "Center", value: "center" },
          { label: "Bottom", value: "bottom" },
        ],
        defaultValue: "center",
      },
      // === Background ===
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      backgroundImage: { type: "image", label: "Background Image" },
      backgroundPosition: {
        type: "select",
        label: "Background Position",
        options: [
          { label: "Center", value: "center" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      backgroundSize: {
        type: "select",
        label: "Background Size",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "cover",
      },
      backgroundAttachment: {
        type: "select",
        label: "Background Attachment",
        options: [
          { label: "Scroll", value: "scroll" },
          { label: "Fixed (Parallax)", value: "fixed" },
        ],
        defaultValue: "scroll",
      },
      backgroundOverlay: { type: "toggle", label: "Show Overlay", defaultValue: false },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      backgroundOverlayOpacity: {
        type: "number",
        label: "Overlay Opacity %",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
      backgroundGradient: { type: "text", label: "CSS Gradient (optional)" },
      // === Video Background ===
      videoSrc: { type: "text", label: "Video URL" },
      videoPoster: { type: "image", label: "Video Poster" },
      videoAutoplay: { type: "toggle", label: "Autoplay Video", defaultValue: true },
      videoLoop: { type: "toggle", label: "Loop Video", defaultValue: true },
      videoMuted: { type: "toggle", label: "Mute Video", defaultValue: true },
      showVideoControls: { type: "toggle", label: "Show Video Controls", defaultValue: false },
      showPlayButton: { type: "toggle", label: "Show Play Button", defaultValue: true },
      playButtonSize: {
        type: "select",
        label: "Play Button Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      playButtonColor: { type: "color", label: "Play Button Color", defaultValue: "#ffffff" },
      // === Hero Image (Split Layouts) ===
      image: { type: "image", label: "Hero Image" },
      imageAlt: { type: "text", label: "Image Alt Text" },
      imagePosition: {
        type: "select",
        label: "Image Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "right",
      },
      imageFit: {
        type: "select",
        label: "Image Fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
        ],
        defaultValue: "cover",
      },
      imageRounded: {
        type: "select",
        label: "Image Rounded",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      imageShadow: {
        type: "select",
        label: "Image Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      imageAnimation: {
        type: "select",
        label: "Image Animation",
        options: [
          { label: "None", value: "none" },
          { label: "Fade In", value: "fadeIn" },
          { label: "Slide Up", value: "slideUp" },
          { label: "Slide In", value: "slideIn" },
          { label: "Zoom", value: "zoom" },
        ],
        defaultValue: "fadeIn",
      },
      // === Sizing ===
      minHeight: {
        type: "select",
        label: "Min Height",
        options: [
          { label: "Auto", value: "auto" },
          { label: "50vh", value: "50vh" },
          { label: "75vh", value: "75vh" },
          { label: "100vh (Full)", value: "100vh" },
          { label: "100dvh (Dynamic - Mobile Safe)", value: "100dvh" },
          { label: "Fullscreen (Overlay Nav)", value: "fullscreen" },
        ],
        defaultValue: "75vh",
      },
      maxWidth: {
        type: "select",
        label: "Content Max Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "7XL", value: "7xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "7xl",
      },
      paddingTop: {
        type: "select",
        label: "Padding Top",
        options: presetOptions.padding,
        defaultValue: "xl",
      },
      paddingBottom: {
        type: "select",
        label: "Padding Bottom",
        options: presetOptions.padding,
        defaultValue: "xl",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      // === Scroll Indicator ===
      showScrollIndicator: { type: "toggle", label: "Show Scroll Indicator", defaultValue: false },
      scrollIndicatorIcon: {
        type: "select",
        label: "Scroll Icon Style",
        options: [
          { label: "Arrow", value: "arrow" },
          { label: "Chevron", value: "chevron" },
          { label: "Double Chevron", value: "chevronDouble" },
          { label: "Mouse", value: "mouse" },
          { label: "Hand", value: "hand" },
          { label: "Dots", value: "dots" },
          { label: "Line", value: "line" },
        ],
        defaultValue: "arrow",
      },
      scrollIndicatorColor: { type: "color", label: "Scroll Indicator Color" },
      scrollIndicatorSize: {
        type: "select",
        label: "Scroll Icon Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      scrollIndicatorAnimation: {
        type: "select",
        label: "Scroll Animation",
        options: [
          { label: "Bounce", value: "bounce" },
          { label: "Pulse", value: "pulse" },
          { label: "Fade", value: "fade" },
          { label: "Slide", value: "slide" },
          { label: "None", value: "none" },
        ],
        defaultValue: "bounce",
      },
      scrollIndicatorLabel: { type: "text", label: "Scroll Label Text", defaultValue: "" },
      scrollTarget: { type: "text", label: "Scroll Target (#id)" },
      // === Mouse Parallax ===
      enableMouseParallax: { type: "toggle", label: "Enable Mouse Parallax", defaultValue: false },
      mouseParallaxIntensity: {
        type: "number",
        label: "Parallax Intensity",
        min: 1,
        max: 100,
        defaultValue: 20,
      },
      mouseParallaxLayers: {
        type: "number",
        label: "Parallax Layers",
        min: 1,
        max: 5,
        defaultValue: 1,
      },
      mouseParallaxSmooth: {
        type: "number",
        label: "Parallax Smoothing (ms)",
        min: 0,
        max: 500,
        defaultValue: 150,
      },
      // === Advanced 3D Parallax ===
      enable3DParallax: { type: "toggle", label: "Enable 3D Parallax", defaultValue: false },
      parallax3DRotateX: {
        type: "number",
        label: "3D Rotate X (deg)",
        min: 0,
        max: 30,
        defaultValue: 10,
      },
      parallax3DRotateY: {
        type: "number",
        label: "3D Rotate Y (deg)",
        min: 0,
        max: 30,
        defaultValue: 10,
      },
      parallax3DScale: {
        type: "number",
        label: "3D Scale Factor",
        min: 1,
        max: 1.2,
        step: 0.01,
        defaultValue: 1.02,
      },
      parallax3DPerspective: {
        type: "number",
        label: "3D Perspective (px)",
        min: 200,
        max: 2000,
        defaultValue: 1000,
      },
      parallaxAffectBackground: { type: "toggle", label: "Parallax Affects Background", defaultValue: true },
      parallaxAffectContent: { type: "toggle", label: "Parallax Affects Content", defaultValue: true },
      // === Decorations ===
      showPattern: { type: "toggle", label: "Show Pattern", defaultValue: false },
      patternType: {
        type: "select",
        label: "Pattern Type",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Grid", value: "grid" },
          { label: "Waves", value: "waves" },
          { label: "Circles", value: "circles" },
        ],
        defaultValue: "dots",
      },
      patternOpacity: {
        type: "number",
        label: "Pattern Opacity",
        min: 0,
        max: 100,
        defaultValue: 10,
      },
      // === Animation ===
      animateOnLoad: { type: "toggle", label: "Animate on Load", defaultValue: true },
      animationType: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade In", value: "fadeIn" },
          { label: "Slide Up", value: "slideUp" },
          { label: "Slide In", value: "slideIn" },
          { label: "Zoom", value: "zoom" },
        ],
        defaultValue: "fadeIn",
      },
      animationDelay: {
        type: "number",
        label: "Animation Delay (ms)",
        min: 0,
        max: 2000,
        defaultValue: 0,
      },
    },
    fieldGroups: [
      { id: "content", label: "Content", icon: "Type", fields: ["title", "titleSize", "titleColor", "titleWeight", "titleAlign", "subtitle", "subtitleSize", "subtitleColor", "description", "descriptionSize", "descriptionColor", "descriptionMaxWidth"], defaultExpanded: true },
      { id: "badge", label: "Badge", icon: "Tag", fields: ["badge", "badgeColor", "badgeTextColor", "badgeStyle"], defaultExpanded: false },
      { id: "buttons", label: "Buttons", icon: "MousePointerClick", fields: ["primaryButtonText", "primaryButtonLink", "primaryButtonColor", "primaryButtonTextColor", "primaryButtonStyle", "primaryButtonSize", "primaryButtonRadius", "primaryButtonIcon", "secondaryButtonText", "secondaryButtonLink", "secondaryButtonStyle", "secondaryButtonColor"], defaultExpanded: true },
      { id: "layout", label: "Layout", icon: "LayoutGrid", fields: ["variant", "contentAlign", "verticalAlign", "minHeight", "maxWidth", "paddingTop", "paddingBottom", "paddingX"], defaultExpanded: false },
      { id: "background", label: "Background", icon: "Image", fields: ["backgroundColor", "backgroundImage", "backgroundPosition", "backgroundSize", "backgroundAttachment", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity", "backgroundGradient"], defaultExpanded: false },
      { id: "video", label: "Video Background", icon: "Video", fields: ["videoSrc", "videoPoster", "videoAutoplay", "videoLoop", "videoMuted", "showVideoControls", "showPlayButton", "playButtonSize", "playButtonColor"], defaultExpanded: false },
      { id: "image", label: "Hero Image", icon: "ImageIcon", fields: ["image", "imageAlt", "imagePosition", "imageFit", "imageRounded", "imageShadow", "imageAnimation"], defaultExpanded: false },
      { id: "scroll", label: "Scroll Indicator", icon: "ArrowDown", fields: ["showScrollIndicator", "scrollIndicatorIcon", "scrollIndicatorColor", "scrollIndicatorSize", "scrollIndicatorAnimation", "scrollIndicatorLabel", "scrollTarget"], defaultExpanded: false },
      { id: "parallax", label: "Mouse Parallax", icon: "Move", fields: ["enableMouseParallax", "mouseParallaxIntensity", "mouseParallaxLayers", "mouseParallaxSmooth"], defaultExpanded: false },
      { id: "parallax3d", label: "3D Parallax", icon: "Box", fields: ["enable3DParallax", "parallax3DRotateX", "parallax3DRotateY", "parallax3DScale", "parallax3DPerspective", "parallaxAffectBackground", "parallaxAffectContent"], defaultExpanded: false },
      { id: "decorations", label: "Decorations", icon: "Sparkles", fields: ["showPattern", "patternType", "patternOpacity"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "Zap", fields: ["animateOnLoad", "animationType", "animationDelay"], defaultExpanded: false },
    ],
    defaultProps: {
      title: "Build Something Amazing",
      description: "Create beautiful, responsive websites with our powerful drag-and-drop builder.",
      titleSize: "xl",
      titleWeight: "bold",
      titleAlign: "center",
      primaryButtonText: "Get Started",
      primaryButtonColor: "#3b82f6",
      primaryButtonStyle: "solid",
      primaryButtonSize: "lg",
      primaryButtonRadius: "lg",
      primaryButtonIcon: "arrow",
      secondaryButtonText: "Learn More",
      secondaryButtonStyle: "outline",
      variant: "centered",
      contentAlign: "center",
      verticalAlign: "center",
      backgroundColor: "#ffffff",
      backgroundOverlay: false,
      backgroundOverlayOpacity: 50,
      minHeight: "100dvh",
      maxWidth: "7xl",
      paddingTop: "2xl",
      paddingBottom: "xl",
      paddingX: "md",
      animateOnLoad: true,
      animationType: "fadeIn",
    },
    ai: {
      description: "A premium hero section with video backgrounds, split layouts, badges, CTAs, and animations",
      canModify: ["title", "subtitle", "description", "primaryButtonText", "secondaryButtonText", "backgroundColor", "variant", "badge"],
      suggestions: ["Add video background", "Try split layout", "Add a badge", "Enable scroll indicator", "Change to fullscreen"],
    },
  }),

  defineComponent({
    type: "Features",
    label: "Features",
    description: "Premium feature grid with extensive styling, icon options, animations, and CTA sections",
    category: "sections",
    icon: "Grid3X3",
    render: FeaturesRender,
    fields: {
      // Header Content
      title: { type: "text", label: "Title", defaultValue: "Amazing Features" },
      subtitle: { type: "text", label: "Subtitle" },
      description: { type: "textarea", label: "Description" },
      badge: { type: "text", label: "Badge Text" },
      badgeIcon: { type: "text", label: "Badge Icon (emoji)" },
      
      // Header Styling
      headerAlign: {
        type: "select",
        label: "Header Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      titleColor: { type: "color", label: "Title Color" },
      titleFont: { type: "text", label: "Title Font" },
      subtitleColor: { type: "color", label: "Subtitle Color" },
      descriptionColor: { type: "color", label: "Description Color" },
      badgeStyle: {
        type: "select",
        label: "Badge Style",
        options: [
          { label: "Pill", value: "pill" },
          { label: "Outlined", value: "outlined" },
          { label: "Solid", value: "solid" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "pill",
      },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#3b82f6" },
      badgeTextColor: { type: "color", label: "Badge Text Color", defaultValue: "#ffffff" },
      
      // Features
      features: {
        type: "array",
        label: "Features",
        itemFields: {
          title: { type: "text", label: "Title" },
          description: { type: "textarea", label: "Description" },
          icon: { type: "text", label: "Icon (emoji)" },
          iconColor: { type: "color", label: "Icon Color" },
          iconBackgroundColor: { type: "color", label: "Icon Background" },
          image: { type: "image", label: "Image (optional)" },
          link: { type: "link", label: "Link URL" },
          linkText: { type: "text", label: "Link Text" },
          badge: { type: "text", label: "Feature Badge" },
          isFeatured: { type: "toggle", label: "Featured" },
        },
      },
      
      // Layout & Variant
      variant: {
        type: "select",
        label: "Layout Variant",
        options: [
          { label: "Cards", value: "cards" },
          { label: "Minimal", value: "minimal" },
          { label: "Centered", value: "centered" },
          { label: "Icons Left", value: "icons-left" },
          { label: "Icons Top", value: "icons-top" },
          { label: "Alternating", value: "alternating" },
          { label: "Bento Grid", value: "bento" },
          { label: "List", value: "list" },
          { label: "Timeline", value: "timeline" },
          { label: "Masonry", value: "masonry" },
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
          { label: "5 Columns", value: 5 },
        ],
        defaultValue: 3,
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
          { label: "Full Width", value: "full" },
        ],
        defaultValue: "xl",
      },
      contentAlign: {
        type: "select",
        label: "Content Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "left",
      },
      
      // Card Styling
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      cardBackgroundColor: { type: "color", label: "Card Background", defaultValue: "#ffffff" },
      cardHoverBackgroundColor: { type: "color", label: "Card Hover Background" },
      featuredCardBackground: { type: "color", label: "Featured Card Background", defaultValue: "#3b82f610" },
      showBorder: { type: "toggle", label: "Show Card Border", defaultValue: true },
      cardBorderColor: { type: "color", label: "Card Border Color", defaultValue: "#e5e7eb" },
      cardBorderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
        ],
        defaultValue: "1",
      },
      cardBorderRadius: {
        type: "select",
        label: "Card Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "xl",
      },
      showShadow: { type: "toggle", label: "Show Card Shadow", defaultValue: true },
      cardShadow: {
        type: "select",
        label: "Card Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "sm",
      },
      cardHoverShadow: {
        type: "select",
        label: "Card Hover Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      cardPadding: {
        type: "select",
        label: "Card Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      hoverEffect: {
        type: "select",
        label: "Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Lift", value: "lift" },
          { label: "Scale", value: "scale" },
          { label: "Glow", value: "glow" },
          { label: "Border", value: "border" },
        ],
        defaultValue: "lift",
      },
      
      // Icon Styling
      iconStyle: {
        type: "select",
        label: "Icon Style",
        options: [
          { label: "Emoji", value: "emoji" },
          { label: "Icon", value: "icon" },
          { label: "Image", value: "image" },
          { label: "Number", value: "number" },
        ],
        defaultValue: "emoji",
      },
      iconSize: {
        type: "select",
        label: "Icon Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      iconShape: {
        type: "select",
        label: "Icon Shape",
        options: [
          { label: "Circle", value: "circle" },
          { label: "Square", value: "square" },
          { label: "Rounded", value: "rounded" },
          { label: "None", value: "none" },
        ],
        defaultValue: "rounded",
      },
      iconPosition: {
        type: "select",
        label: "Icon Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Left", value: "left" },
          { label: "Inline", value: "inline" },
        ],
        defaultValue: "top",
      },
      showIconBackground: { type: "toggle", label: "Show Icon Background", defaultValue: true },
      defaultIconColor: { type: "color", label: "Default Icon Color", defaultValue: "#3b82f6" },
      defaultIconBackgroundColor: { type: "color", label: "Default Icon Background" },
      iconBorder: { type: "toggle", label: "Show Icon Border" },
      iconBorderColor: { type: "color", label: "Icon Border Color", defaultValue: "#3b82f6" },
      
      // Title & Description
      featureTitleSize: {
        type: "select",
        label: "Feature Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      featureTitleColor: { type: "color", label: "Feature Title Color" },
      featureTitleFont: { type: "text", label: "Feature Title Font" },
      featureTitleWeight: {
        type: "select",
        label: "Feature Title Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
        ],
        defaultValue: "semibold",
      },
      featureDescriptionSize: {
        type: "select",
        label: "Description Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
        ],
        defaultValue: "sm",
      },
      featureDescriptionColor: { type: "color", label: "Description Color" },
      descriptionMaxLines: { type: "number", label: "Description Max Lines", min: 0, max: 10, defaultValue: 0 },
      
      // Links
      showLinks: { type: "toggle", label: "Show Links", defaultValue: true },
      linkStyle: {
        type: "select",
        label: "Link Style",
        options: [
          { label: "Text", value: "text" },
          { label: "Button", value: "button" },
          { label: "Arrow", value: "arrow" },
        ],
        defaultValue: "arrow",
      },
      linkColor: { type: "color", label: "Link Color", defaultValue: "#3b82f6" },
      linkHoverColor: { type: "color", label: "Link Hover Color", defaultValue: "#2563eb" },
      defaultLinkText: { type: "text", label: "Default Link Text", defaultValue: "Learn more" },
      
      // Numbering
      showNumbers: { type: "toggle", label: "Show Numbers Instead of Icons" },
      numberStyle: {
        type: "select",
        label: "Number Style",
        options: [
          { label: "Circle", value: "circle" },
          { label: "Plain", value: "plain" },
          { label: "Badge", value: "badge" },
        ],
        defaultValue: "circle",
      },
      numberColor: { type: "color", label: "Number Color", defaultValue: "#ffffff" },
      numberBackgroundColor: { type: "color", label: "Number Background" },
      
      // Featured Highlight
      highlightFeatured: { type: "toggle", label: "Highlight Featured Items" },
      featuredBorderColor: { type: "color", label: "Featured Border Color", defaultValue: "#3b82f6" },
      featuredBadgeText: { type: "text", label: "Featured Badge Text", defaultValue: "Popular" },
      
      // Section Sizing
      paddingY: {
        type: "select",
        label: "Vertical Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      gap: {
        type: "select",
        label: "Grid Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      sectionGap: {
        type: "select",
        label: "Header to Grid Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      
      // Background
      backgroundStyle: {
        type: "select",
        label: "Background Style",
        options: [
          { label: "Solid Color", value: "solid" },
          { label: "Gradient", value: "gradient" },
          { label: "Pattern", value: "pattern" },
          { label: "Image", value: "image" },
        ],
        defaultValue: "solid",
      },
      backgroundGradientFrom: { type: "color", label: "Gradient Start", defaultValue: "#ffffff" },
      backgroundGradientTo: { type: "color", label: "Gradient End", defaultValue: "#f3f4f6" },
      backgroundGradientDirection: {
        type: "select",
        label: "Gradient Direction",
        options: [
          { label: "To Right", value: "to-r" },
          { label: "To Left", value: "to-l" },
          { label: "To Top", value: "to-t" },
          { label: "To Bottom", value: "to-b" },
          { label: "To Bottom Right", value: "to-br" },
          { label: "To Bottom Left", value: "to-bl" },
        ],
        defaultValue: "to-b",
      },
      backgroundPattern: {
        type: "select",
        label: "Background Pattern",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Grid", value: "grid" },
          { label: "Lines", value: "lines" },
        ],
      },
      backgroundPatternOpacity: { type: "number", label: "Pattern Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.1 },
      backgroundImage: { type: "image", label: "Background Image" },
      backgroundOverlay: { type: "toggle", label: "Show Background Overlay" },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      backgroundOverlayOpacity: { type: "number", label: "Overlay Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
      
      // Decorators
      showDecorators: { type: "toggle", label: "Show Decorators" },
      decoratorStyle: {
        type: "select",
        label: "Decorator Style",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Circles", value: "circles" },
          { label: "Blur", value: "blur" },
        ],
        defaultValue: "blur",
      },
      decoratorColor: { type: "color", label: "Decorator Color", defaultValue: "#3b82f6" },
      decoratorPosition: {
        type: "select",
        label: "Decorator Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Both Sides", value: "both-sides" },
        ],
        defaultValue: "both-sides",
      },
      
      // Animation
      animateOnScroll: { type: "toggle", label: "Animate on Scroll" },
      animationType: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade", value: "fade" },
          { label: "Slide Up", value: "slide-up" },
          { label: "Slide Left", value: "slide-left" },
          { label: "Slide Right", value: "slide-right" },
          { label: "Scale", value: "scale" },
          { label: "Stagger", value: "stagger" },
        ],
        defaultValue: "fade",
      },
      animationDelay: { type: "number", label: "Animation Delay (ms)", min: 0, max: 2000, step: 100, defaultValue: 0 },
      staggerDelay: { type: "number", label: "Stagger Delay (ms)", min: 50, max: 500, step: 50, defaultValue: 100 },
      
      // CTA
      showCta: { type: "toggle", label: "Show CTA Section" },
      ctaTitle: { type: "text", label: "CTA Title", defaultValue: "Ready to Get Started?" },
      ctaDescription: { type: "textarea", label: "CTA Description", defaultValue: "Join thousands of satisfied customers today." },
      ctaButtonText: { type: "text", label: "CTA Button Text", defaultValue: "Get Started" },
      ctaButtonLink: { type: "link", label: "CTA Button Link", defaultValue: "#" },
      ctaButtonStyle: {
        type: "select",
        label: "CTA Button Style",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
        ],
        defaultValue: "primary",
      },
      
      // Responsive
      mobileColumns: {
        type: "select",
        label: "Mobile Columns",
        options: [
          { label: "1 Column", value: 1 },
          { label: "2 Columns", value: 2 },
        ],
        defaultValue: 1,
      },
      stackOnMobile: { type: "toggle", label: "Stack on Mobile", defaultValue: true },
      compactOnMobile: { type: "toggle", label: "Compact Layout on Mobile" },
      
      // Colors
      textColor: { type: "color", label: "Text Color" },
      accentColor: { type: "color", label: "Accent Color", defaultValue: "#3b82f6" },
    },
    fieldGroups: [
      { id: "header", label: "Header", icon: "type", fields: ["title", "subtitle", "description", "badge", "badgeIcon"], defaultExpanded: true },
      { id: "headerStyle", label: "Header Style", icon: "palette", fields: ["headerAlign", "titleSize", "titleColor", "titleFont", "subtitleColor", "descriptionColor", "badgeStyle", "badgeColor", "badgeTextColor"], defaultExpanded: false },
      { id: "features", label: "Features", icon: "grid", fields: ["features"], defaultExpanded: true },
      { id: "layout", label: "Layout", icon: "layout", fields: ["variant", "columns", "maxWidth", "contentAlign", "gap", "sectionGap"], defaultExpanded: false },
      { id: "cardStyle", label: "Card Style", icon: "square", fields: ["cardBackgroundColor", "cardHoverBackgroundColor", "featuredCardBackground", "showBorder", "cardBorderColor", "cardBorderWidth", "cardBorderRadius", "showShadow", "cardShadow", "cardHoverShadow", "cardPadding", "hoverEffect"], defaultExpanded: false },
      { id: "iconStyle", label: "Icon Style", icon: "image", fields: ["iconStyle", "iconSize", "iconShape", "iconPosition", "showIconBackground", "defaultIconColor", "defaultIconBackgroundColor", "iconBorder", "iconBorderColor"], defaultExpanded: false },
      { id: "titleDesc", label: "Title & Description", icon: "file-text", fields: ["featureTitleSize", "featureTitleColor", "featureTitleFont", "featureTitleWeight", "featureDescriptionSize", "featureDescriptionColor", "descriptionMaxLines"], defaultExpanded: false },
      { id: "links", label: "Links", icon: "link", fields: ["showLinks", "linkStyle", "linkColor", "linkHoverColor", "defaultLinkText"], defaultExpanded: false },
      { id: "numbering", label: "Numbering", icon: "hash", fields: ["showNumbers", "numberStyle", "numberColor", "numberBackgroundColor"], defaultExpanded: false },
      { id: "featured", label: "Featured Items", icon: "star", fields: ["highlightFeatured", "featuredBorderColor", "featuredBadgeText"], defaultExpanded: false },
      { id: "sizing", label: "Section Sizing", icon: "maximize", fields: ["paddingY", "paddingX"], defaultExpanded: false },
      { id: "background", label: "Background", icon: "layers", fields: ["backgroundColor", "backgroundStyle", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundPattern", "backgroundPatternOpacity", "backgroundImage", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity"], defaultExpanded: false },
      { id: "decorators", label: "Decorators", icon: "sparkles", fields: ["showDecorators", "decoratorStyle", "decoratorColor", "decoratorPosition"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "zap", fields: ["animateOnScroll", "animationType", "animationDelay", "staggerDelay"], defaultExpanded: false },
      { id: "cta", label: "Call to Action", icon: "mouse-pointer", fields: ["showCta", "ctaTitle", "ctaDescription", "ctaButtonText", "ctaButtonLink", "ctaButtonStyle"], defaultExpanded: false },
      { id: "responsive", label: "Responsive", icon: "smartphone", fields: ["mobileColumns", "stackOnMobile", "compactOnMobile"], defaultExpanded: false },
      { id: "colors", label: "Colors", icon: "droplet", fields: ["textColor", "accentColor"], defaultExpanded: false },
    ],
    defaultProps: {
      title: "Amazing Features",
      variant: "cards",
      columns: 3,
      showBorder: true,
      showShadow: true,
      backgroundColor: "#ffffff",
      cardBackgroundColor: "#ffffff",
      accentColor: "#3b82f6",
      features: [
        { icon: "⚡", title: "Lightning Fast", description: "Optimized for performance with sub-second load times", link: "#", isFeatured: false },
        { icon: "🛡️", title: "Enterprise Security", description: "Bank-level encryption and security protocols", link: "#", isFeatured: true },
        { icon: "💖", title: "User Friendly", description: "Intuitive interface loved by thousands of users", link: "#", isFeatured: false },
        { icon: "🔧", title: "Easy Integration", description: "Connect with your favorite tools in minutes", link: "#", isFeatured: false },
        { icon: "📊", title: "Analytics Built-in", description: "Comprehensive insights and reporting dashboard", link: "#", isFeatured: false },
        { icon: "🎯", title: "Goal Tracking", description: "Set, track, and achieve your business goals", link: "#", isFeatured: false },
      ],
    },
    ai: {
      description: "A premium features grid with comprehensive styling options including icon styles, card effects, animations, numbering, featured highlighting, and CTA sections",
      canModify: ["title", "subtitle", "description", "features", "variant", "columns", "backgroundColor", "showNumbers", "animateOnScroll", "showCta"],
    },
  }),

  defineComponent({
    type: "CTA",
    label: "CTA",
    description: "Premium call-to-action section - 80+ customization options",
    category: "sections",
    icon: "Megaphone",
    render: CTARender,
    fields: {
      // === Content Group ===
      title: { type: "text", label: "Title", defaultValue: "Ready to Get Started?" },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "3XL", value: "3xl" },
        ],
        defaultValue: "xl",
      },
      titleColor: { type: "color", label: "Title Color" },
      titleWeight: {
        type: "select",
        label: "Title Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
          { label: "Extra Bold", value: "extrabold" },
        ],
        defaultValue: "bold",
      },
      titleAlign: {
        type: "select",
        label: "Title Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      subtitle: { type: "text", label: "Subtitle (above title)" },
      subtitleSize: {
        type: "select",
        label: "Subtitle Size",
        options: [
          { label: "XS", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "sm",
      },
      subtitleColor: { type: "color", label: "Subtitle Color" },
      description: { type: "textarea", label: "Description", rows: 3 },
      descriptionSize: {
        type: "select",
        label: "Description Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      descriptionColor: { type: "color", label: "Description Color" },
      descriptionMaxWidth: {
        type: "select",
        label: "Description Max Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      // === Badge ===
      badge: { type: "text", label: "Badge Text" },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#3b82f6" },
      badgeTextColor: { type: "color", label: "Badge Text Color", defaultValue: "#ffffff" },
      badgeStyle: {
        type: "select",
        label: "Badge Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Pill", value: "pill" },
          { label: "Glow", value: "glow" },
        ],
        defaultValue: "pill",
      },
      badgeIcon: { type: "text", label: "Badge Icon (emoji)" },
      badgePosition: {
        type: "select",
        label: "Badge Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Inline", value: "inline" },
        ],
        defaultValue: "top",
      },
      // === Primary Button ===
      buttonText: { type: "text", label: "Button Text", defaultValue: "Get Started" },
      buttonLink: { type: "link", label: "Button Link" },
      buttonColor: { type: "color", label: "Button Color", defaultValue: "#ffffff" },
      buttonTextColor: { type: "color", label: "Button Text Color" },
      buttonSize: {
        type: "select",
        label: "Button Size",
        options: presetOptions.buttonSize,
        defaultValue: "lg",
      },
      buttonRadius: {
        type: "select",
        label: "Button Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      buttonStyle: {
        type: "select",
        label: "Button Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Gradient", value: "gradient" },
          { label: "Glow", value: "glow" },
          { label: "3D", value: "3d" },
        ],
        defaultValue: "solid",
      },
      buttonGradientFrom: { type: "color", label: "Button Gradient Start", defaultValue: "#3b82f6" },
      buttonGradientTo: { type: "color", label: "Button Gradient End", defaultValue: "#8b5cf6" },
      buttonIcon: {
        type: "select",
        label: "Button Icon",
        options: [
          { label: "None", value: "none" },
          { label: "Arrow", value: "arrow" },
          { label: "Chevron", value: "chevron" },
          { label: "Rocket", value: "rocket" },
          { label: "Sparkle", value: "sparkle" },
          { label: "Play", value: "play" },
        ],
        defaultValue: "arrow",
      },
      buttonIconPosition: {
        type: "select",
        label: "Icon Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "right",
      },
      buttonShadow: {
        type: "select",
        label: "Button Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Glow", value: "glow" },
        ],
        defaultValue: "lg",
      },
      buttonHoverEffect: {
        type: "select",
        label: "Button Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Scale", value: "scale" },
          { label: "Lift", value: "lift" },
          { label: "Glow", value: "glow" },
          { label: "Shine", value: "shine" },
          { label: "Pulse", value: "pulse" },
        ],
        defaultValue: "lift",
      },
      // === Secondary Button ===
      secondaryButtonText: { type: "text", label: "Secondary Button Text" },
      secondaryButtonLink: { type: "link", label: "Secondary Button Link" },
      secondaryButtonColor: { type: "color", label: "Secondary Button Color" },
      secondaryButtonStyle: {
        type: "select",
        label: "Secondary Button Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Text", value: "text" },
          { label: "Link", value: "link" },
        ],
        defaultValue: "outline",
      },
      secondaryButtonSize: {
        type: "select",
        label: "Secondary Size",
        options: presetOptions.buttonSize,
        defaultValue: "lg",
      },
      secondaryButtonRadius: {
        type: "select",
        label: "Secondary Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      secondaryButtonIcon: {
        type: "select",
        label: "Secondary Button Icon",
        options: [
          { label: "None", value: "none" },
          { label: "Arrow", value: "arrow" },
          { label: "Chevron", value: "chevron" },
          { label: "External", value: "external" },
        ],
        defaultValue: "none",
      },
      // === Layout ===
      variant: {
        type: "select",
        label: "CTA Variant",
        options: [
          { label: "Centered", value: "centered" },
          { label: "Left Aligned", value: "left" },
          { label: "Right Aligned", value: "right" },
          { label: "Split (Image Right)", value: "split" },
          { label: "Split (Image Left)", value: "splitReverse" },
          { label: "Banner", value: "banner" },
          { label: "Floating Card", value: "floating" },
          { label: "Minimal", value: "minimal" },
          { label: "Gradient", value: "gradient" },
          { label: "Glass", value: "glass" },
        ],
        defaultValue: "centered",
      },
      contentAlign: {
        type: "select",
        label: "Content Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      contentWidth: {
        type: "select",
        label: "Content Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      buttonLayout: {
        type: "select",
        label: "Button Layout",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
          { label: "Stacked", value: "stacked" },
        ],
        defaultValue: "stacked",
      },
      buttonGap: {
        type: "select",
        label: "Button Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      // === Background ===
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#3b82f6" },
      backgroundGradient: { type: "toggle", label: "Use Gradient Background", defaultValue: false },
      backgroundGradientFrom: { type: "color", label: "Gradient Start", defaultValue: "#3b82f6" },
      backgroundGradientTo: { type: "color", label: "Gradient End", defaultValue: "#8b5cf6" },
      backgroundGradientDirection: {
        type: "select",
        label: "Gradient Direction",
        options: [
          { label: "Right", value: "to-r" },
          { label: "Left", value: "to-l" },
          { label: "Bottom", value: "to-b" },
          { label: "Top", value: "to-t" },
          { label: "Bottom Right", value: "to-br" },
          { label: "Bottom Left", value: "to-bl" },
          { label: "Top Right", value: "to-tr" },
          { label: "Top Left", value: "to-tl" },
        ],
        defaultValue: "to-br",
      },
      backgroundImage: { type: "image", label: "Background Image" },
      backgroundImagePosition: {
        type: "select",
        label: "Image Position",
        options: [
          { label: "Center", value: "center" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      backgroundImageSize: {
        type: "select",
        label: "Image Size",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "cover",
      },
      backgroundImageFixed: { type: "toggle", label: "Fixed Background (Parallax)", defaultValue: false },
      backgroundOverlay: { type: "toggle", label: "Show Overlay", defaultValue: true },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      backgroundOverlayOpacity: {
        type: "number",
        label: "Overlay Opacity %",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
      backgroundPattern: {
        type: "select",
        label: "Background Pattern",
        options: [
          { label: "None", value: "none" },
          { label: "Dots", value: "dots" },
          { label: "Grid", value: "grid" },
          { label: "Diagonal", value: "diagonal" },
          { label: "Waves", value: "waves" },
          { label: "Circuit", value: "circuit" },
        ],
        defaultValue: "none",
      },
      backgroundPatternColor: { type: "color", label: "Pattern Color", defaultValue: "#ffffff" },
      backgroundPatternOpacity: {
        type: "number",
        label: "Pattern Opacity %",
        min: 0,
        max: 100,
        defaultValue: 10,
      },
      // === Split Image ===
      image: { type: "image", label: "CTA Image (Split layouts)" },
      imageAlt: { type: "text", label: "Image Alt Text" },
      imagePosition: {
        type: "select",
        label: "Image Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "right",
      },
      imageFit: {
        type: "select",
        label: "Image Fit",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
        ],
        defaultValue: "cover",
      },
      imageRounded: {
        type: "select",
        label: "Image Rounded",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      imageShadow: {
        type: "select",
        label: "Image Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "xl",
      },
      imageAnimation: {
        type: "select",
        label: "Image Animation",
        options: [
          { label: "None", value: "none" },
          { label: "Fade In", value: "fadeIn" },
          { label: "Slide In", value: "slideIn" },
          { label: "Zoom", value: "zoom" },
          { label: "Float", value: "float" },
        ],
        defaultValue: "fadeIn",
      },
      imageBorder: { type: "toggle", label: "Show Image Border", defaultValue: false },
      imageBorderColor: { type: "color", label: "Image Border Color", defaultValue: "#e5e7eb" },
      // === Sizing & Spacing ===
      minHeight: {
        type: "select",
        label: "Minimum Height",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "Full Screen", value: "screen" },
        ],
        defaultValue: "auto",
      },
      paddingY: {
        type: "select",
        label: "Vertical Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
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
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "none",
      },
      margin: {
        type: "select",
        label: "Horizontal Margin",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "none",
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "full",
      },
      // === Effects ===
      textColor: { type: "color", label: "Text Color", defaultValue: "#ffffff" },
      shadow: {
        type: "select",
        label: "Section Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "Inner", value: "inner" },
        ],
        defaultValue: "none",
      },
      border: { type: "toggle", label: "Show Border", defaultValue: false },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#e5e7eb" },
      borderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "4px", value: "4" },
        ],
        defaultValue: "1",
      },
      glassEffect: { type: "toggle", label: "Glass Effect", defaultValue: false },
      glassBlur: {
        type: "select",
        label: "Glass Blur",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      // === Decorators ===
      showDecorator: { type: "toggle", label: "Show Decorators", defaultValue: false },
      decoratorType: {
        type: "select",
        label: "Decorator Type",
        options: [
          { label: "Circles", value: "circles" },
          { label: "Lines", value: "lines" },
          { label: "Dots", value: "dots" },
          { label: "Waves", value: "waves" },
          { label: "Shapes", value: "shapes" },
        ],
        defaultValue: "circles",
      },
      decoratorColor: { type: "color", label: "Decorator Color", defaultValue: "#ffffff" },
      decoratorOpacity: {
        type: "number",
        label: "Decorator Opacity %",
        min: 0,
        max: 100,
        defaultValue: 20,
      },
      // === Trust Badges ===
      trustBadges: {
        type: "array",
        label: "Trust Badges",
        itemFields: {
          icon: { type: "text", label: "Icon (emoji)" },
          text: { type: "text", label: "Text" },
          image: { type: "image", label: "Logo Image" },
        },
      },
      trustBadgesPosition: {
        type: "select",
        label: "Badges Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
        defaultValue: "bottom",
      },
      // === Responsive ===
      hideOnMobile: { type: "toggle", label: "Hide on Mobile", defaultValue: false },
      mobileLayout: {
        type: "select",
        label: "Mobile Layout",
        options: [
          { label: "Stacked", value: "stacked" },
          { label: "Default", value: "default" },
        ],
        defaultValue: "stacked",
      },
      mobileButtonFullWidth: { type: "toggle", label: "Full Width Buttons (Mobile)", defaultValue: true },
    },
    fieldGroups: [
      { id: "content", label: "Content", fields: ["title", "titleSize", "titleColor", "titleWeight", "titleAlign", "subtitle", "subtitleSize", "subtitleColor", "description", "descriptionSize", "descriptionColor", "descriptionMaxWidth"] },
      { id: "badge", label: "Badge", fields: ["badge", "badgeColor", "badgeTextColor", "badgeStyle", "badgeIcon", "badgePosition"] },
      { id: "primaryButton", label: "Primary Button", fields: ["buttonText", "buttonLink", "buttonColor", "buttonTextColor", "buttonSize", "buttonRadius", "buttonStyle", "buttonGradientFrom", "buttonGradientTo", "buttonIcon", "buttonIconPosition", "buttonShadow", "buttonHoverEffect"] },
      { id: "secondaryButton", label: "Secondary Button", fields: ["secondaryButtonText", "secondaryButtonLink", "secondaryButtonColor", "secondaryButtonStyle", "secondaryButtonSize", "secondaryButtonRadius", "secondaryButtonIcon"] },
      { id: "layout", label: "Layout", fields: ["variant", "contentAlign", "contentWidth", "buttonLayout", "buttonGap"] },
      { id: "background", label: "Background", fields: ["backgroundColor", "backgroundGradient", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundImage", "backgroundImagePosition", "backgroundImageSize", "backgroundImageFixed", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity", "backgroundPattern", "backgroundPatternColor", "backgroundPatternOpacity"] },
      { id: "splitImage", label: "Split Image", fields: ["image", "imageAlt", "imagePosition", "imageFit", "imageRounded", "imageShadow", "imageAnimation", "imageBorder", "imageBorderColor"] },
      { id: "sizing", label: "Sizing & Spacing", fields: ["minHeight", "paddingY", "paddingX", "borderRadius", "margin", "maxWidth"] },
      { id: "effects", label: "Effects", fields: ["textColor", "shadow", "border", "borderColor", "borderWidth", "glassEffect", "glassBlur"] },
      { id: "decorators", label: "Decorators", fields: ["showDecorator", "decoratorType", "decoratorColor", "decoratorOpacity"] },
      { id: "trust", label: "Trust Badges", fields: ["trustBadges", "trustBadgesPosition"] },
      { id: "responsive", label: "Responsive", fields: ["hideOnMobile", "mobileLayout", "mobileButtonFullWidth"] },
    ],
    defaultProps: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers using our platform today.",
      buttonText: "Get Started Free",
      variant: "centered",
      backgroundColor: "#3b82f6",
      textColor: "#ffffff",
    },
    ai: {
      description: "A premium call-to-action section with 80+ customization options including multiple variants (centered, split, glass, floating, banner), gradient backgrounds, trust badges, button animations, and responsive controls",
      canModify: ["title", "description", "subtitle", "buttonText", "secondaryButtonText", "badge", "backgroundColor", "variant"],
      suggestions: ["Add urgency with countdown", "Add trust badges", "Try glass effect", "Use gradient background", "Add secondary CTA"],
    },
  }),

  defineComponent({
    type: "Testimonials",
    label: "Testimonials",
    description: "Premium customer testimonials - 60+ customization options",
    category: "sections",
    icon: "Quote",
    render: TestimonialsRender,
    fields: {
      // === Header ===
      title: { type: "text", label: "Section Title", defaultValue: "What Our Customers Say" },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      titleColor: { type: "color", label: "Title Color" },
      titleWeight: {
        type: "select",
        label: "Title Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
          { label: "Extra Bold", value: "extrabold" },
        ],
        defaultValue: "bold",
      },
      titleAlign: {
        type: "select",
        label: "Title Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      subtitle: { type: "text", label: "Subtitle" },
      subtitleColor: { type: "color", label: "Subtitle Color" },
      description: { type: "textarea", label: "Description", rows: 2 },
      descriptionColor: { type: "color", label: "Description Color" },
      // === Testimonials Array ===
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemFields: {
          quote: { type: "textarea", label: "Quote" },
          author: { type: "text", label: "Author Name" },
          role: { type: "text", label: "Role/Title" },
          company: { type: "text", label: "Company" },
          image: { type: "image", label: "Avatar" },
          rating: { type: "number", label: "Rating (1-5)", min: 1, max: 5 },
          companyLogo: { type: "image", label: "Company Logo" },
          featured: { type: "toggle", label: "Featured" },
          videoUrl: { type: "text", label: "Video URL" },
        },
      },
      // === Layout ===
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "1 Column", value: 1 },
          { label: "2 Columns", value: 2 },
          { label: "3 Columns", value: 3 },
          { label: "4 Columns", value: 4 },
        ],
        defaultValue: 3,
      },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Cards", value: "cards" },
          { label: "Minimal", value: "minimal" },
          { label: "Quote", value: "quote" },
          { label: "Carousel", value: "carousel" },
          { label: "Masonry", value: "masonry" },
          { label: "Slider", value: "slider" },
          { label: "Grid", value: "grid" },
          { label: "Featured", value: "featured" },
          { label: "Bubble", value: "bubble" },
          { label: "Timeline", value: "timeline" },
        ],
        defaultValue: "cards",
      },
      contentAlign: {
        type: "select",
        label: "Content Alignment",
        options: presetOptions.alignment,
        defaultValue: "left",
      },
      gap: {
        type: "select",
        label: "Card Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "lg",
      },
      // === Card Styling ===
      cardBackgroundColor: { type: "color", label: "Card Background", defaultValue: "#ffffff" },
      cardBorderRadius: {
        type: "select",
        label: "Card Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "xl",
      },
      cardShadow: {
        type: "select",
        label: "Card Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "sm",
      },
      cardBorder: { type: "toggle", label: "Show Card Border", defaultValue: false },
      cardBorderColor: { type: "color", label: "Card Border Color", defaultValue: "#e5e7eb" },
      cardPadding: {
        type: "select",
        label: "Card Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "lg",
      },
      cardHoverEffect: {
        type: "select",
        label: "Card Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Lift", value: "lift" },
          { label: "Scale", value: "scale" },
          { label: "Glow", value: "glow" },
          { label: "Border", value: "border" },
        ],
        defaultValue: "lift",
      },
      // === Avatar ===
      showAvatar: { type: "toggle", label: "Show Avatar", defaultValue: true },
      avatarSize: {
        type: "select",
        label: "Avatar Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      avatarShape: {
        type: "select",
        label: "Avatar Shape",
        options: [
          { label: "Circle", value: "circle" },
          { label: "Square", value: "square" },
          { label: "Rounded", value: "rounded" },
        ],
        defaultValue: "circle",
      },
      avatarBorder: { type: "toggle", label: "Avatar Border", defaultValue: false },
      avatarBorderColor: { type: "color", label: "Avatar Border Color", defaultValue: "#ffffff" },
      avatarPosition: {
        type: "select",
        label: "Avatar Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Inline", value: "inline" },
          { label: "Left", value: "left" },
        ],
        defaultValue: "bottom",
      },
      // === Rating ===
      showRating: { type: "toggle", label: "Show Rating", defaultValue: true },
      ratingStyle: {
        type: "select",
        label: "Rating Style",
        options: [
          { label: "Stars", value: "stars" },
          { label: "Hearts", value: "hearts" },
          { label: "Numeric", value: "numeric" },
          { label: "Thumbs", value: "thumbs" },
        ],
        defaultValue: "stars",
      },
      ratingColor: { type: "color", label: "Rating Color", defaultValue: "#fbbf24" },
      ratingPosition: {
        type: "select",
        label: "Rating Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Inline", value: "inline" },
        ],
        defaultValue: "top",
      },
      maxRating: {
        type: "number",
        label: "Max Rating",
        min: 1,
        max: 10,
        defaultValue: 5,
      },
      // === Quote ===
      quoteStyle: {
        type: "select",
        label: "Quote Style",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Italic", value: "italic" },
          { label: "Large", value: "large" },
        ],
        defaultValue: "normal",
      },
      quoteFontSize: {
        type: "select",
        label: "Quote Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      quoteColor: { type: "color", label: "Quote Color" },
      showQuoteIcon: { type: "toggle", label: "Show Quote Icon", defaultValue: true },
      quoteIconColor: { type: "color", label: "Quote Icon Color" },
      quoteIconSize: {
        type: "select",
        label: "Quote Icon Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      quoteIconPosition: {
        type: "select",
        label: "Quote Icon Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Background", value: "background" },
        ],
        defaultValue: "top-left",
      },
      // === Company Logo ===
      showCompanyLogo: { type: "toggle", label: "Show Company Logos", defaultValue: false },
      logoSize: {
        type: "select",
        label: "Logo Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      logoPosition: {
        type: "select",
        label: "Logo Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Inline", value: "inline" },
        ],
        defaultValue: "bottom",
      },
      showCompanyName: { type: "toggle", label: "Show Company Name", defaultValue: true },
      // === Background ===
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#f9fafb" },
      backgroundGradient: { type: "toggle", label: "Use Gradient", defaultValue: false },
      backgroundGradientFrom: { type: "color", label: "Gradient Start", defaultValue: "#f9fafb" },
      backgroundGradientTo: { type: "color", label: "Gradient End", defaultValue: "#ffffff" },
      backgroundGradientDirection: {
        type: "select",
        label: "Gradient Direction",
        options: [
          { label: "Right", value: "to-r" },
          { label: "Left", value: "to-l" },
          { label: "Bottom", value: "to-b" },
          { label: "Top", value: "to-t" },
          { label: "Bottom Right", value: "to-br" },
          { label: "Bottom Left", value: "to-bl" },
        ],
        defaultValue: "to-b",
      },
      backgroundImage: { type: "image", label: "Background Image" },
      backgroundOverlay: { type: "toggle", label: "Show Overlay", defaultValue: false },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      backgroundOverlayOpacity: {
        type: "number",
        label: "Overlay Opacity %",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
      backgroundPattern: {
        type: "select",
        label: "Background Pattern",
        options: [
          { label: "None", value: "none" },
          { label: "Dots", value: "dots" },
          { label: "Grid", value: "grid" },
          { label: "Diagonal", value: "diagonal" },
        ],
        defaultValue: "none",
      },
      // === Sizing ===
      paddingY: {
        type: "select",
        label: "Vertical Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "xl",
      },
      // === Decorative ===
      showDecorator: { type: "toggle", label: "Show Decorators", defaultValue: false },
      decoratorType: {
        type: "select",
        label: "Decorator Type",
        options: [
          { label: "Quotes", value: "quotes" },
          { label: "Lines", value: "lines" },
          { label: "Dots", value: "dots" },
          { label: "Gradient Blur", value: "gradient-blur" },
        ],
        defaultValue: "quotes",
      },
      decoratorColor: { type: "color", label: "Decorator Color", defaultValue: "#3b82f6" },
      decoratorOpacity: {
        type: "number",
        label: "Decorator Opacity %",
        min: 0,
        max: 100,
        defaultValue: 10,
      },
      // === General ===
      textColor: { type: "color", label: "Text Color" },
      accentColor: { type: "color", label: "Accent Color", defaultValue: "#3b82f6" },
    },
    fieldGroups: [
      { id: "header", label: "Header", fields: ["title", "titleSize", "titleColor", "titleWeight", "titleAlign", "subtitle", "subtitleColor", "description", "descriptionColor"] },
      { id: "testimonials", label: "Testimonials", fields: ["testimonials"] },
      { id: "layout", label: "Layout", fields: ["columns", "variant", "contentAlign", "gap"] },
      { id: "card", label: "Card Styling", fields: ["cardBackgroundColor", "cardBorderRadius", "cardShadow", "cardBorder", "cardBorderColor", "cardPadding", "cardHoverEffect"] },
      { id: "avatar", label: "Avatar", fields: ["showAvatar", "avatarSize", "avatarShape", "avatarBorder", "avatarBorderColor", "avatarPosition"] },
      { id: "rating", label: "Rating", fields: ["showRating", "ratingStyle", "ratingColor", "ratingPosition", "maxRating"] },
      { id: "quote", label: "Quote Style", fields: ["quoteStyle", "quoteFontSize", "quoteColor", "showQuoteIcon", "quoteIconColor", "quoteIconSize", "quoteIconPosition"] },
      { id: "company", label: "Company/Logo", fields: ["showCompanyLogo", "logoSize", "logoPosition", "showCompanyName"] },
      { id: "background", label: "Background", fields: ["backgroundColor", "backgroundGradient", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundImage", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity", "backgroundPattern"] },
      { id: "sizing", label: "Sizing", fields: ["paddingY", "paddingX", "maxWidth"] },
      { id: "decorators", label: "Decorators", fields: ["showDecorator", "decoratorType", "decoratorColor", "decoratorOpacity"] },
      { id: "colors", label: "Colors", fields: ["textColor", "accentColor"] },
    ],
    defaultProps: {
      title: "What Our Customers Say",
      testimonials: [
        { quote: "This product transformed our business!", author: "Sarah Johnson", role: "CEO", company: "TechCorp", rating: 5 },
        { quote: "Incredible experience from start to finish.", author: "Michael Chen", role: "Founder", company: "StartupXYZ", rating: 5 },
        { quote: "The best investment we've made this year.", author: "Emily Davis", role: "Director", company: "GrowthCo", rating: 5 },
      ],
    },
    ai: {
      description: "Premium testimonials section with 60+ customization options including multiple variants, avatar styles, rating displays, company logos, and animations",
      canModify: ["title", "subtitle", "testimonials", "columns", "variant", "backgroundColor"],
      suggestions: ["Add more testimonials", "Include company logos", "Show star ratings", "Try carousel variant"],
    },
  }),

  defineComponent({
    type: "FAQ",
    label: "FAQ",
    description: "Frequently asked questions with advanced customization",
    category: "sections",
    icon: "HelpCircle",
    render: FAQRender,
    fieldGroups: [
      { id: "header", label: "Header Content", icon: "Type", fields: ["title", "subtitle", "description", "badge", "badgeIcon"], defaultExpanded: true },
      { id: "headerStyle", label: "Header Styling", icon: "Palette", fields: ["headerAlign", "titleSize", "titleColor", "titleFont", "subtitleColor", "descriptionColor", "badgeStyle", "badgeColor", "badgeTextColor"], defaultExpanded: false },
      { id: "items", label: "FAQ Items", icon: "List", fields: ["items"], defaultExpanded: true },
      { id: "layout", label: "Layout & Variant", icon: "Layout", fields: ["variant", "columns", "maxWidth", "paddingY", "paddingX", "sectionGap"], defaultExpanded: false },
      { id: "accordion", label: "Accordion Settings", icon: "ChevronDown", fields: ["defaultOpen", "allowMultiple", "collapseOthers", "animationSpeed", "accordionStyle", "accordionGap", "questionPadding", "answerPadding"], defaultExpanded: false },
      { id: "icon", label: "Icon Settings", icon: "ChevronDown", fields: ["showIcon", "iconPosition", "iconStyle", "iconSize", "iconColor", "iconRotation", "expandedIcon", "collapsedIcon"], defaultExpanded: false },
      { id: "question", label: "Question Styling", icon: "Type", fields: ["questionFontSize", "questionFontWeight", "questionColor", "questionHoverColor"], defaultExpanded: false },
      { id: "answer", label: "Answer Styling", icon: "AlignLeft", fields: ["answerFontSize", "answerColor", "answerLineHeight", "answerMaxLines"], defaultExpanded: false },
      { id: "card", label: "Card Styling", icon: "Square", fields: ["backgroundColor", "cardBackgroundColor", "cardHoverBackgroundColor", "expandedBackgroundColor", "cardBorder", "cardBorderColor", "cardBorderWidth", "cardBorderRadius", "dividerStyle", "dividerColor", "cardShadow", "cardHoverShadow", "hoverEffect", "accentColor", "textColor"], defaultExpanded: false },
      { id: "categories", label: "Categories & Search", icon: "Search", fields: ["showCategories", "categoryPosition", "categoryStyle", "categoryColor", "activeCategoryColor", "showSearch", "searchPlaceholder", "searchPosition"], defaultExpanded: false },
      { id: "features", label: "Features", icon: "Star", fields: ["showPopularBadge", "popularBadgeText", "popularBadgeColor", "highlightPopular", "showNumbers", "numberStyle", "numberColor", "numberBackgroundColor", "showHelpful", "helpfulText", "helpfulYesText", "helpfulNoText"], defaultExpanded: false },
      { id: "contact", label: "Contact CTA", icon: "MessageCircle", fields: ["showContactCta", "contactTitle", "contactDescription", "contactButtonText", "contactButtonLink", "contactButtonStyle"], defaultExpanded: false },
      { id: "background", label: "Background", icon: "Image", fields: ["backgroundStyle", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundPattern", "backgroundPatternOpacity", "backgroundImage", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity"], defaultExpanded: false },
      { id: "decorators", label: "Decorative Elements", icon: "Sparkles", fields: ["showDecorators", "decoratorStyle", "decoratorColor", "decoratorPosition"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "Zap", fields: ["animateOnScroll", "animationType", "animationDelay", "staggerDelay"], defaultExpanded: false },
      { id: "seo", label: "SEO & Schema", icon: "Globe", fields: ["enableSchema", "schemaType", "ariaLabel"], defaultExpanded: false },
      { id: "responsive", label: "Responsive", icon: "Smartphone", fields: ["mobileColumns", "mobileVariant", "hideDescriptionOnMobile"], defaultExpanded: false },
    ],
    fields: {
      // Header Content
      title: { type: "text", label: "Title", group: "header", defaultValue: "Frequently Asked Questions" },
      subtitle: { type: "text", label: "Subtitle", group: "header" },
      description: { type: "textarea", label: "Description", group: "header" },
      badge: { type: "text", label: "Badge Text", group: "header" },
      badgeIcon: { type: "text", label: "Badge Icon", group: "header" },
      
      // Header Styling
      headerAlign: { type: "select", label: "Header Alignment", group: "headerStyle", options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ]},
      titleSize: { type: "select", label: "Title Size", group: "headerStyle", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      titleColor: { type: "color", label: "Title Color", group: "headerStyle" },
      titleFont: { type: "text", label: "Title Font", group: "headerStyle" },
      subtitleColor: { type: "color", label: "Subtitle Color", group: "headerStyle" },
      descriptionColor: { type: "color", label: "Description Color", group: "headerStyle" },
      badgeStyle: { type: "select", label: "Badge Style", group: "headerStyle", options: [
        { value: "pill", label: "Pill" },
        { value: "outlined", label: "Outlined" },
        { value: "solid", label: "Solid" },
        { value: "gradient", label: "Gradient" },
      ]},
      badgeColor: { type: "color", label: "Badge Color", group: "headerStyle" },
      badgeTextColor: { type: "color", label: "Badge Text Color", group: "headerStyle" },
      
      // FAQ Items
      items: {
        type: "array",
        label: "FAQ Items",
        group: "items",
        itemFields: {
          question: { type: "text", label: "Question" },
          answer: { type: "textarea", label: "Answer" },
          category: { type: "text", label: "Category" },
          icon: { type: "text", label: "Icon (emoji)" },
          isPopular: { type: "toggle", label: "Mark as Popular" },
          helpfulVotes: { type: "number", label: "Helpful Votes" },
        },
      },
      
      // Layout & Variant
      variant: { type: "select", label: "Variant", group: "layout", options: [
        { value: "accordion", label: "Accordion" },
        { value: "cards", label: "Cards" },
        { value: "two-column", label: "Two Column" },
        { value: "minimal", label: "Minimal" },
        { value: "tabs", label: "Tabs" },
        { value: "timeline", label: "Timeline" },
        { value: "bubble", label: "Bubble" },
        { value: "modern", label: "Modern" },
        { value: "grid", label: "Grid" },
        { value: "floating", label: "Floating" },
      ]},
      columns: { type: "select", label: "Columns", group: "layout", options: [
        { value: 1, label: "1 Column" },
        { value: 2, label: "2 Columns" },
      ]},
      maxWidth: { type: "select", label: "Max Width", group: "layout", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
        { value: "full", label: "Full Width" },
      ]},
      paddingY: { type: "select", label: "Vertical Padding", group: "layout", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      paddingX: { type: "select", label: "Horizontal Padding", group: "layout", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      sectionGap: { type: "select", label: "Section Gap", group: "layout", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      
      // Accordion Settings
      defaultOpen: { type: "select", label: "Default Open", group: "accordion", options: [
        { value: 0, label: "First Item" },
        { value: 1, label: "Second Item" },
        { value: 2, label: "Third Item" },
        { value: "all", label: "All Items" },
        { value: "none", label: "None" },
      ]},
      allowMultiple: { type: "toggle", label: "Allow Multiple Open", group: "accordion" },
      collapseOthers: { type: "toggle", label: "Collapse Others", group: "accordion" },
      animationSpeed: { type: "select", label: "Animation Speed", group: "accordion", options: [
        { value: "slow", label: "Slow" },
        { value: "normal", label: "Normal" },
        { value: "fast", label: "Fast" },
      ]},
      accordionStyle: { type: "select", label: "Accordion Style", group: "accordion", options: [
        { value: "default", label: "Default" },
        { value: "bordered", label: "Bordered" },
        { value: "separated", label: "Separated" },
        { value: "connected", label: "Connected" },
        { value: "minimal", label: "Minimal" },
      ]},
      accordionGap: { type: "select", label: "Gap Between Items", group: "accordion", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]},
      questionPadding: { type: "select", label: "Question Padding", group: "accordion", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]},
      answerPadding: { type: "select", label: "Answer Padding", group: "accordion", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]},
      
      // Icon Settings
      showIcon: { type: "toggle", label: "Show Icon", group: "icon" },
      iconPosition: { type: "select", label: "Icon Position", group: "icon", options: [
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ]},
      iconStyle: { type: "select", label: "Icon Style", group: "icon", options: [
        { value: "chevron", label: "Chevron" },
        { value: "plus", label: "Plus/Minus" },
        { value: "arrow", label: "Arrow" },
        { value: "caret", label: "Caret" },
        { value: "custom", label: "Custom" },
      ]},
      iconSize: { type: "select", label: "Icon Size", group: "icon", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]},
      iconColor: { type: "color", label: "Icon Color", group: "icon" },
      iconRotation: { type: "toggle", label: "Rotate on Expand", group: "icon" },
      expandedIcon: { type: "text", label: "Expanded Icon (emoji)", group: "icon" },
      collapsedIcon: { type: "text", label: "Collapsed Icon (emoji)", group: "icon" },
      
      // Question Styling
      questionFontSize: { type: "select", label: "Font Size", group: "question", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      questionFontWeight: { type: "select", label: "Font Weight", group: "question", options: [
        { value: "normal", label: "Normal" },
        { value: "medium", label: "Medium" },
        { value: "semibold", label: "Semibold" },
        { value: "bold", label: "Bold" },
      ]},
      questionColor: { type: "color", label: "Question Color", group: "question" },
      questionHoverColor: { type: "color", label: "Hover Color", group: "question" },
      
      // Answer Styling
      answerFontSize: { type: "select", label: "Font Size", group: "answer", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]},
      answerColor: { type: "color", label: "Answer Color", group: "answer" },
      answerLineHeight: { type: "select", label: "Line Height", group: "answer", options: [
        { value: "tight", label: "Tight" },
        { value: "normal", label: "Normal" },
        { value: "relaxed", label: "Relaxed" },
        { value: "loose", label: "Loose" },
      ]},
      answerMaxLines: { type: "number", label: "Max Lines (0 = unlimited)", group: "answer" },
      
      // Card Styling
      backgroundColor: { type: "color", label: "Section Background", group: "card" },
      cardBackgroundColor: { type: "color", label: "Card Background", group: "card" },
      cardHoverBackgroundColor: { type: "color", label: "Card Hover Background", group: "card" },
      expandedBackgroundColor: { type: "color", label: "Expanded Background", group: "card" },
      cardBorder: { type: "toggle", label: "Show Border", group: "card" },
      cardBorderColor: { type: "color", label: "Border Color", group: "card" },
      cardBorderWidth: { type: "select", label: "Border Width", group: "card", options: [
        { value: "1", label: "1px" },
        { value: "2", label: "2px" },
        { value: "3", label: "3px" },
      ]},
      cardBorderRadius: { type: "select", label: "Border Radius", group: "card", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
        { value: "full", label: "Full" },
      ]},
      dividerStyle: { type: "select", label: "Divider Style", group: "card", options: [
        { value: "solid", label: "Solid" },
        { value: "dashed", label: "Dashed" },
        { value: "dotted", label: "Dotted" },
        { value: "none", label: "None" },
      ]},
      dividerColor: { type: "color", label: "Divider Color", group: "card" },
      cardShadow: { type: "select", label: "Card Shadow", group: "card", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      cardHoverShadow: { type: "select", label: "Hover Shadow", group: "card", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      hoverEffect: { type: "select", label: "Hover Effect", group: "card", options: [
        { value: "none", label: "None" },
        { value: "lift", label: "Lift" },
        { value: "glow", label: "Glow" },
        { value: "border", label: "Border" },
        { value: "background", label: "Background" },
      ]},
      accentColor: { type: "color", label: "Accent Color", group: "card" },
      textColor: { type: "color", label: "Text Color", group: "card" },
      
      // Categories & Search
      showCategories: { type: "toggle", label: "Show Categories", group: "categories" },
      categoryPosition: { type: "select", label: "Category Position", group: "categories", options: [
        { value: "top", label: "Top" },
        { value: "sidebar", label: "Sidebar" },
        { value: "tabs", label: "Tabs" },
      ]},
      categoryStyle: { type: "select", label: "Category Style", group: "categories", options: [
        { value: "pills", label: "Pills" },
        { value: "buttons", label: "Buttons" },
        { value: "underline", label: "Underline" },
        { value: "minimal", label: "Minimal" },
      ]},
      categoryColor: { type: "color", label: "Category Color", group: "categories" },
      activeCategoryColor: { type: "color", label: "Active Category Color", group: "categories" },
      showSearch: { type: "toggle", label: "Show Search", group: "categories" },
      searchPlaceholder: { type: "text", label: "Search Placeholder", group: "categories" },
      searchPosition: { type: "select", label: "Search Position", group: "categories", options: [
        { value: "top", label: "Top" },
        { value: "sidebar", label: "Sidebar" },
      ]},
      
      // Features
      showPopularBadge: { type: "toggle", label: "Show Popular Badge", group: "features" },
      popularBadgeText: { type: "text", label: "Popular Badge Text", group: "features" },
      popularBadgeColor: { type: "color", label: "Popular Badge Color", group: "features" },
      highlightPopular: { type: "toggle", label: "Highlight Popular Items", group: "features" },
      showNumbers: { type: "toggle", label: "Show Numbers", group: "features" },
      numberStyle: { type: "select", label: "Number Style", group: "features", options: [
        { value: "circle", label: "Circle" },
        { value: "square", label: "Square" },
        { value: "plain", label: "Plain" },
        { value: "outlined", label: "Outlined" },
      ]},
      numberColor: { type: "color", label: "Number Color", group: "features" },
      numberBackgroundColor: { type: "color", label: "Number Background", group: "features" },
      showHelpful: { type: "toggle", label: "Show Helpful Buttons", group: "features" },
      helpfulText: { type: "text", label: "Helpful Text", group: "features" },
      helpfulYesText: { type: "text", label: "Yes Button Text", group: "features" },
      helpfulNoText: { type: "text", label: "No Button Text", group: "features" },
      
      // Contact CTA
      showContactCta: { type: "toggle", label: "Show Contact CTA", group: "contact" },
      contactTitle: { type: "text", label: "CTA Title", group: "contact" },
      contactDescription: { type: "textarea", label: "CTA Description", group: "contact" },
      contactButtonText: { type: "text", label: "Button Text", group: "contact" },
      contactButtonLink: { type: "text", label: "Button Link", group: "contact" },
      contactButtonStyle: { type: "select", label: "Button Style", group: "contact", options: [
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "outline", label: "Outline" },
      ]},
      
      // Background
      backgroundStyle: { type: "select", label: "Background Style", group: "background", options: [
        { value: "solid", label: "Solid Color" },
        { value: "gradient", label: "Gradient" },
        { value: "pattern", label: "Pattern" },
        { value: "image", label: "Image" },
      ]},
      backgroundGradientFrom: { type: "color", label: "Gradient From", group: "background" },
      backgroundGradientTo: { type: "color", label: "Gradient To", group: "background" },
      backgroundGradientDirection: { type: "select", label: "Gradient Direction", group: "background", options: [
        { value: "to-r", label: "Right" },
        { value: "to-l", label: "Left" },
        { value: "to-t", label: "Top" },
        { value: "to-b", label: "Bottom" },
        { value: "to-br", label: "Bottom Right" },
        { value: "to-bl", label: "Bottom Left" },
        { value: "to-tr", label: "Top Right" },
        { value: "to-tl", label: "Top Left" },
      ]},
      backgroundPattern: { type: "select", label: "Pattern Type", group: "background", options: [
        { value: "dots", label: "Dots" },
        { value: "grid", label: "Grid" },
        { value: "lines", label: "Lines" },
        { value: "waves", label: "Waves" },
      ]},
      backgroundPatternOpacity: { type: "number", label: "Pattern Opacity", group: "background" },
      backgroundImage: { type: "image", label: "Background Image", group: "background" },
      backgroundOverlay: { type: "toggle", label: "Show Overlay", group: "background" },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", group: "background" },
      backgroundOverlayOpacity: { type: "number", label: "Overlay Opacity", group: "background" },
      
      // Decorators
      showDecorators: { type: "toggle", label: "Show Decorators", group: "decorators" },
      decoratorStyle: { type: "select", label: "Decorator Style", group: "decorators", options: [
        { value: "dots", label: "Dots" },
        { value: "lines", label: "Lines" },
        { value: "circles", label: "Circles" },
        { value: "gradient", label: "Gradient" },
        { value: "blur", label: "Blur Blob" },
      ]},
      decoratorColor: { type: "color", label: "Decorator Color", group: "decorators" },
      decoratorPosition: { type: "select", label: "Position", group: "decorators", options: [
        { value: "top-left", label: "Top Left" },
        { value: "top-right", label: "Top Right" },
        { value: "bottom-left", label: "Bottom Left" },
        { value: "bottom-right", label: "Bottom Right" },
        { value: "both-sides", label: "Both Sides" },
      ]},
      
      // Animation
      animateOnScroll: { type: "toggle", label: "Animate on Scroll", group: "animation" },
      animationType: { type: "select", label: "Animation Type", group: "animation", options: [
        { value: "fade", label: "Fade" },
        { value: "slide-up", label: "Slide Up" },
        { value: "slide-left", label: "Slide Left" },
        { value: "slide-right", label: "Slide Right" },
        { value: "scale", label: "Scale" },
        { value: "stagger", label: "Stagger" },
      ]},
      animationDelay: { type: "number", label: "Animation Delay (ms)", group: "animation" },
      staggerDelay: { type: "number", label: "Stagger Delay (ms)", group: "animation" },
      
      // SEO & Schema
      enableSchema: { type: "toggle", label: "Enable Schema.org", group: "seo" },
      schemaType: { type: "select", label: "Schema Type", group: "seo", options: [
        { value: "FAQPage", label: "FAQ Page" },
        { value: "HowTo", label: "How To" },
        { value: "QAPage", label: "Q&A Page" },
      ]},
      ariaLabel: { type: "text", label: "Aria Label", group: "seo" },
      
      // Responsive
      mobileColumns: { type: "select", label: "Mobile Columns", group: "responsive", options: [
        { value: 1, label: "1 Column" },
      ]},
      mobileVariant: { type: "select", label: "Mobile Variant", group: "responsive", options: [
        { value: "accordion", label: "Accordion" },
        { value: "cards", label: "Cards" },
      ]},
      hideDescriptionOnMobile: { type: "toggle", label: "Hide Description on Mobile", group: "responsive" },
    },
    defaultProps: {
      title: "Frequently Asked Questions",
      subtitle: "Got Questions?",
      description: "Find answers to the most common questions about our product and services.",
      items: [
        { question: "How does it work?", answer: "Our platform is designed to be intuitive and easy to use. Simply sign up, configure your settings, and you're ready to go!" },
        { question: "What payment methods do you accept?", answer: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers." },
        { question: "Can I cancel my subscription?", answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees." },
      ],
      variant: "accordion",
      headerAlign: "center",
      titleSize: "lg",
      showIcon: true,
      iconPosition: "right",
      iconStyle: "chevron",
      cardBorderRadius: "lg",
      accentColor: "#3b82f6",
      paddingY: "lg",
    },
    ai: {
      description: "A comprehensive FAQ section with accordion, search, categories, and multiple styling options",
      canModify: [
        "title", "subtitle", "description", "badge", "items", "variant",
        "headerAlign", "titleSize", "titleColor", "accentColor",
        "showIcon", "iconStyle", "iconPosition",
        "backgroundColor", "cardBackgroundColor", "cardBorderRadius",
        "showCategories", "showSearch", "showContactCta",
        "animateOnScroll", "animationType", "enableSchema"
      ],
      suggestions: [
        "Add more FAQs",
        "Enable search for easy navigation",
        "Add categories to organize questions",
        "Include a contact CTA for unanswered questions",
        "Enable Schema.org for SEO",
        "Add helpful voting buttons",
        "Use different variants like cards or timeline"
      ],
    },
  }),

  defineComponent({
    type: "Stats",
    label: "Stats",
    description: "Statistics and metrics display with animations and multiple variants",
    category: "sections",
    icon: "BarChart3",
    render: StatsRender,
    fieldGroups: [
      { id: "header", label: "Header Content", icon: "Type", fields: ["title", "subtitle", "description", "badge", "badgeIcon"], defaultExpanded: true },
      { id: "headerStyle", label: "Header Styling", icon: "Palette", fields: ["headerAlign", "titleSize", "titleColor", "titleFont", "subtitleColor", "descriptionColor", "badgeStyle", "badgeColor", "badgeTextColor"], defaultExpanded: false },
      { id: "items", label: "Stats Items", icon: "List", fields: ["stats"], defaultExpanded: true },
      { id: "layout", label: "Layout & Variant", icon: "Layout", fields: ["variant", "columns", "maxWidth", "contentAlign", "paddingY", "paddingX", "gap", "sectionGap"], defaultExpanded: false },
      { id: "value", label: "Value Styling", icon: "Hash", fields: ["valueSize", "valueColor", "valueFont", "valueFontWeight"], defaultExpanded: false },
      { id: "label", label: "Label Styling", icon: "AlignLeft", fields: ["labelSize", "labelColor", "labelPosition", "labelOpacity", "showDescription", "descriptionSize"], defaultExpanded: false },
      { id: "icon", label: "Icon Settings", icon: "Sparkles", fields: ["showIcons", "iconPosition", "iconSize", "iconStyle", "iconBackgroundColor", "defaultIconColor"], defaultExpanded: false },
      { id: "animation", label: "Counter Animation", icon: "Zap", fields: ["animateNumbers", "animationDuration", "animationDelay", "staggerAnimation", "staggerDelay", "startFromZero", "countingType"], defaultExpanded: false },
      { id: "card", label: "Card Styling", icon: "Square", fields: ["backgroundColor", "cardBackgroundColor", "cardHoverBackgroundColor", "highlightedCardBackground", "cardBorder", "cardBorderColor", "cardBorderWidth", "cardBorderRadius", "cardShadow", "cardHoverShadow", "cardPadding", "hoverEffect"], defaultExpanded: false },
      { id: "dividers", label: "Accent & Dividers", icon: "Minus", fields: ["accentColor", "textColor", "showDividers", "dividerStyle", "dividerColor"], defaultExpanded: false },
      { id: "trends", label: "Trend Indicators", icon: "TrendingUp", fields: ["showTrends", "trendUpColor", "trendDownColor", "trendNeutralColor", "trendPosition"], defaultExpanded: false },
      { id: "background", label: "Background", icon: "Image", fields: ["backgroundStyle", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundPattern", "backgroundPatternOpacity", "backgroundImage", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity"], defaultExpanded: false },
      { id: "decorators", label: "Decorative Elements", icon: "Sparkles", fields: ["showDecorators", "decoratorStyle", "decoratorColor", "decoratorPosition"], defaultExpanded: false },
      { id: "entrance", label: "Entrance Animation", icon: "Play", fields: ["animateOnScroll", "animationType", "entranceDelay"], defaultExpanded: false },
      { id: "responsive", label: "Responsive", icon: "Smartphone", fields: ["mobileColumns", "hideDescriptionOnMobile", "compactOnMobile"], defaultExpanded: false },
    ],
    fields: {
      // Header Content
      title: { type: "text", label: "Title", group: "header" },
      subtitle: { type: "text", label: "Subtitle", group: "header" },
      description: { type: "textarea", label: "Description", group: "header" },
      badge: { type: "text", label: "Badge Text", group: "header" },
      badgeIcon: { type: "text", label: "Badge Icon", group: "header" },
      
      // Header Styling
      headerAlign: { type: "select", label: "Header Alignment", group: "headerStyle", options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ]},
      titleSize: { type: "select", label: "Title Size", group: "headerStyle", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      titleColor: { type: "color", label: "Title Color", group: "headerStyle" },
      titleFont: { type: "text", label: "Title Font", group: "headerStyle" },
      subtitleColor: { type: "color", label: "Subtitle Color", group: "headerStyle" },
      descriptionColor: { type: "color", label: "Description Color", group: "headerStyle" },
      badgeStyle: { type: "select", label: "Badge Style", group: "headerStyle", options: [
        { value: "pill", label: "Pill" },
        { value: "outlined", label: "Outlined" },
        { value: "solid", label: "Solid" },
        { value: "gradient", label: "Gradient" },
      ]},
      badgeColor: { type: "color", label: "Badge Color", group: "headerStyle" },
      badgeTextColor: { type: "color", label: "Badge Text Color", group: "headerStyle" },
      
      // Stats Items
      stats: {
        type: "array",
        label: "Stats Items",
        group: "items",
        itemFields: {
          value: { type: "text", label: "Value" },
          label: { type: "text", label: "Label" },
          description: { type: "text", label: "Description" },
          prefix: { type: "text", label: "Prefix (e.g., $)" },
          suffix: { type: "text", label: "Suffix (e.g., +, %, K)" },
          icon: { type: "text", label: "Icon (emoji)" },
          iconColor: { type: "color", label: "Icon Color" },
          trend: { type: "select", label: "Trend", options: [
            { value: "up", label: "Up" },
            { value: "down", label: "Down" },
            { value: "neutral", label: "Neutral" },
          ]},
          trendValue: { type: "text", label: "Trend Value (e.g., +12%)" },
          link: { type: "text", label: "Link URL" },
          isHighlighted: { type: "toggle", label: "Highlight This Stat" },
        },
      },
      
      // Layout & Variant
      variant: { type: "select", label: "Variant", group: "layout", options: [
        { value: "simple", label: "Simple" },
        { value: "cards", label: "Cards" },
        { value: "bordered", label: "Bordered" },
        { value: "icons", label: "With Icons" },
        { value: "minimal", label: "Minimal" },
        { value: "gradient", label: "Gradient" },
        { value: "glass", label: "Glass" },
        { value: "outline", label: "Outline" },
        { value: "split", label: "Split" },
        { value: "circular", label: "Circular" },
      ]},
      columns: { type: "select", label: "Columns", group: "layout", options: [
        { value: 2, label: "2 Columns" },
        { value: 3, label: "3 Columns" },
        { value: 4, label: "4 Columns" },
        { value: 5, label: "5 Columns" },
        { value: 6, label: "6 Columns" },
      ]},
      maxWidth: { type: "select", label: "Max Width", group: "layout", options: [
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
        { value: "full", label: "Full Width" },
      ]},
      contentAlign: { type: "select", label: "Content Alignment", group: "layout", options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ]},
      paddingY: { type: "select", label: "Vertical Padding", group: "layout", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      paddingX: { type: "select", label: "Horizontal Padding", group: "layout", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      gap: { type: "select", label: "Gap Between Stats", group: "layout", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      sectionGap: { type: "select", label: "Header Gap", group: "layout", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      
      // Value Styling
      valueSize: { type: "select", label: "Value Size", group: "value", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
        { value: "3xl", label: "3X Large" },
      ]},
      valueColor: { type: "color", label: "Value Color", group: "value" },
      valueFont: { type: "text", label: "Value Font", group: "value" },
      valueFontWeight: { type: "select", label: "Value Font Weight", group: "value", options: [
        { value: "normal", label: "Normal" },
        { value: "medium", label: "Medium" },
        { value: "semibold", label: "Semibold" },
        { value: "bold", label: "Bold" },
        { value: "extrabold", label: "Extra Bold" },
      ]},
      
      // Label Styling
      labelSize: { type: "select", label: "Label Size", group: "label", options: [
        { value: "xs", label: "Extra Small" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]},
      labelColor: { type: "color", label: "Label Color", group: "label" },
      labelPosition: { type: "select", label: "Label Position", group: "label", options: [
        { value: "above", label: "Above Value" },
        { value: "below", label: "Below Value" },
      ]},
      labelOpacity: { type: "number", label: "Label Opacity (0-1)", group: "label" },
      showDescription: { type: "toggle", label: "Show Descriptions", group: "label" },
      descriptionSize: { type: "select", label: "Description Size", group: "label", options: [
        { value: "xs", label: "Extra Small" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
      ]},
      
      // Icon Settings
      showIcons: { type: "toggle", label: "Show Icons", group: "icon" },
      iconPosition: { type: "select", label: "Icon Position", group: "icon", options: [
        { value: "top", label: "Top" },
        { value: "left", label: "Left" },
        { value: "inline", label: "Inline" },
      ]},
      iconSize: { type: "select", label: "Icon Size", group: "icon", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      iconStyle: { type: "select", label: "Icon Style", group: "icon", options: [
        { value: "default", label: "Default" },
        { value: "circle", label: "Circle Background" },
        { value: "square", label: "Square Background" },
        { value: "rounded", label: "Rounded Background" },
        { value: "gradient", label: "Gradient Background" },
      ]},
      iconBackgroundColor: { type: "color", label: "Icon Background", group: "icon" },
      defaultIconColor: { type: "color", label: "Default Icon Color", group: "icon" },
      
      // Counter Animation
      animateNumbers: { type: "toggle", label: "Animate Numbers", group: "animation" },
      animationDuration: { type: "number", label: "Duration (ms)", group: "animation" },
      animationDelay: { type: "number", label: "Delay (ms)", group: "animation" },
      staggerAnimation: { type: "toggle", label: "Stagger Animation", group: "animation" },
      staggerDelay: { type: "number", label: "Stagger Delay (ms)", group: "animation" },
      startFromZero: { type: "toggle", label: "Start from Zero", group: "animation" },
      countingType: { type: "select", label: "Easing", group: "animation", options: [
        { value: "linear", label: "Linear" },
        { value: "easeOut", label: "Ease Out" },
        { value: "easeInOut", label: "Ease In Out" },
      ]},
      
      // Card Styling
      backgroundColor: { type: "color", label: "Section Background", group: "card" },
      cardBackgroundColor: { type: "color", label: "Card Background", group: "card" },
      cardHoverBackgroundColor: { type: "color", label: "Card Hover Background", group: "card" },
      highlightedCardBackground: { type: "color", label: "Highlighted Card Background", group: "card" },
      cardBorder: { type: "toggle", label: "Show Border", group: "card" },
      cardBorderColor: { type: "color", label: "Border Color", group: "card" },
      cardBorderWidth: { type: "select", label: "Border Width", group: "card", options: [
        { value: "1", label: "1px" },
        { value: "2", label: "2px" },
        { value: "3", label: "3px" },
      ]},
      cardBorderRadius: { type: "select", label: "Border Radius", group: "card", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
        { value: "full", label: "Full" },
      ]},
      cardShadow: { type: "select", label: "Card Shadow", group: "card", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
        { value: "2xl", label: "2X Large" },
      ]},
      cardHoverShadow: { type: "select", label: "Hover Shadow", group: "card", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      cardPadding: { type: "select", label: "Card Padding", group: "card", options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      hoverEffect: { type: "select", label: "Hover Effect", group: "card", options: [
        { value: "none", label: "None" },
        { value: "lift", label: "Lift" },
        { value: "scale", label: "Scale" },
        { value: "glow", label: "Glow" },
        { value: "border", label: "Border" },
      ]},
      
      // Accent & Dividers
      accentColor: { type: "color", label: "Accent Color", group: "dividers" },
      textColor: { type: "color", label: "Text Color", group: "dividers" },
      showDividers: { type: "toggle", label: "Show Dividers", group: "dividers" },
      dividerStyle: { type: "select", label: "Divider Style", group: "dividers", options: [
        { value: "solid", label: "Solid" },
        { value: "dashed", label: "Dashed" },
        { value: "dotted", label: "Dotted" },
        { value: "gradient", label: "Gradient" },
      ]},
      dividerColor: { type: "color", label: "Divider Color", group: "dividers" },
      
      // Trend Indicators
      showTrends: { type: "toggle", label: "Show Trends", group: "trends" },
      trendUpColor: { type: "color", label: "Trend Up Color", group: "trends" },
      trendDownColor: { type: "color", label: "Trend Down Color", group: "trends" },
      trendNeutralColor: { type: "color", label: "Trend Neutral Color", group: "trends" },
      trendPosition: { type: "select", label: "Trend Position", group: "trends", options: [
        { value: "inline", label: "Inline with Value" },
        { value: "below", label: "Below Value" },
      ]},
      
      // Background
      backgroundStyle: { type: "select", label: "Background Style", group: "background", options: [
        { value: "solid", label: "Solid Color" },
        { value: "gradient", label: "Gradient" },
        { value: "pattern", label: "Pattern" },
        { value: "image", label: "Image" },
      ]},
      backgroundGradientFrom: { type: "color", label: "Gradient From", group: "background" },
      backgroundGradientTo: { type: "color", label: "Gradient To", group: "background" },
      backgroundGradientDirection: { type: "select", label: "Gradient Direction", group: "background", options: [
        { value: "to-r", label: "Right" },
        { value: "to-l", label: "Left" },
        { value: "to-t", label: "Top" },
        { value: "to-b", label: "Bottom" },
        { value: "to-br", label: "Bottom Right" },
        { value: "to-bl", label: "Bottom Left" },
        { value: "to-tr", label: "Top Right" },
        { value: "to-tl", label: "Top Left" },
      ]},
      backgroundPattern: { type: "select", label: "Pattern Type", group: "background", options: [
        { value: "dots", label: "Dots" },
        { value: "grid", label: "Grid" },
        { value: "lines", label: "Lines" },
        { value: "waves", label: "Waves" },
      ]},
      backgroundPatternOpacity: { type: "number", label: "Pattern Opacity", group: "background" },
      backgroundImage: { type: "image", label: "Background Image", group: "background" },
      backgroundOverlay: { type: "toggle", label: "Show Overlay", group: "background" },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", group: "background" },
      backgroundOverlayOpacity: { type: "number", label: "Overlay Opacity", group: "background" },
      
      // Decorators
      showDecorators: { type: "toggle", label: "Show Decorators", group: "decorators" },
      decoratorStyle: { type: "select", label: "Decorator Style", group: "decorators", options: [
        { value: "dots", label: "Dots" },
        { value: "circles", label: "Circles" },
        { value: "blur", label: "Blur Blob" },
        { value: "lines", label: "Lines" },
      ]},
      decoratorColor: { type: "color", label: "Decorator Color", group: "decorators" },
      decoratorPosition: { type: "select", label: "Position", group: "decorators", options: [
        { value: "top-left", label: "Top Left" },
        { value: "top-right", label: "Top Right" },
        { value: "bottom-left", label: "Bottom Left" },
        { value: "bottom-right", label: "Bottom Right" },
        { value: "both-sides", label: "Both Sides" },
      ]},
      
      // Entrance Animation
      animateOnScroll: { type: "toggle", label: "Animate on Scroll", group: "entrance" },
      animationType: { type: "select", label: "Animation Type", group: "entrance", options: [
        { value: "fade", label: "Fade" },
        { value: "slide-up", label: "Slide Up" },
        { value: "slide-left", label: "Slide Left" },
        { value: "slide-right", label: "Slide Right" },
        { value: "scale", label: "Scale" },
        { value: "stagger", label: "Stagger" },
      ]},
      entranceDelay: { type: "number", label: "Entrance Delay (ms)", group: "entrance" },
      
      // Responsive
      mobileColumns: { type: "select", label: "Mobile Columns", group: "responsive", options: [
        { value: 1, label: "1 Column" },
        { value: 2, label: "2 Columns" },
      ]},
      hideDescriptionOnMobile: { type: "toggle", label: "Hide Description on Mobile", group: "responsive" },
      compactOnMobile: { type: "toggle", label: "Compact on Mobile", group: "responsive" },
      
      ariaLabel: { type: "text", label: "Aria Label", group: "responsive" },
    },
    defaultProps: {
      title: "Trusted by Industry Leaders",
      subtitle: "Our Impact",
      stats: [
        { value: "10", label: "Years Experience", suffix: "+", icon: "🏆" },
        { value: "500", label: "Happy Clients", suffix: "+", icon: "😊" },
        { value: "99", label: "Success Rate", suffix: "%", icon: "📈" },
        { value: "24", label: "Support", suffix: "/7", icon: "💬" },
      ],
      variant: "simple",
      columns: 4,
      valueSize: "xl",
      backgroundColor: "#111827",
      textColor: "#ffffff",
      accentColor: "#3b82f6",
      paddingY: "lg",
      headerAlign: "center",
    },
    ai: {
      description: "A comprehensive statistics section with animated counters, trend indicators, icons, and multiple variants",
      canModify: [
        "title", "subtitle", "description", "stats", "variant", "columns",
        "valueSize", "valueColor", "backgroundColor", "textColor", "accentColor",
        "showIcons", "iconPosition", "animateNumbers", "showTrends",
        "cardBackgroundColor", "cardBorderRadius", "hoverEffect",
        "animateOnScroll", "animationType"
      ],
      suggestions: [
        "Add trend indicators to show growth",
        "Enable number animation for engagement",
        "Add icons to make stats more visual",
        "Use cards variant for better separation",
        "Add descriptions for context",
        "Highlight the most important stat",
        "Use gradient background for modern look"
      ],
    },
  }),

  defineComponent({
    type: "Team",
    label: "Team",
    description: "Premium team section with extensive styling options, social links, and multiple layout variants",
    category: "sections",
    icon: "Users",
    render: TeamRender,
    fields: {
      // Header Content
      title: { type: "text", label: "Title", defaultValue: "Meet Our Team" },
      subtitle: { type: "text", label: "Subtitle" },
      description: { type: "textarea", label: "Description" },
      badge: { type: "text", label: "Badge Text" },
      badgeIcon: { type: "text", label: "Badge Icon (emoji)" },
      
      // Header Styling
      headerAlign: {
        type: "select",
        label: "Header Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      titleColor: { type: "color", label: "Title Color" },
      titleFont: { type: "text", label: "Title Font" },
      subtitleColor: { type: "color", label: "Subtitle Color" },
      descriptionColor: { type: "color", label: "Description Color" },
      badgeStyle: {
        type: "select",
        label: "Badge Style",
        options: [
          { label: "Pill", value: "pill" },
          { label: "Outlined", value: "outlined" },
          { label: "Solid", value: "solid" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "pill",
      },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#3b82f6" },
      badgeTextColor: { type: "color", label: "Badge Text Color", defaultValue: "#ffffff" },
      
      // Team Members
      members: {
        type: "array",
        label: "Team Members",
        itemFields: {
          name: { type: "text", label: "Name" },
          role: { type: "text", label: "Role/Title" },
          department: { type: "text", label: "Department" },
          bio: { type: "textarea", label: "Bio" },
          image: { type: "image", label: "Photo" },
          linkedin: { type: "link", label: "LinkedIn URL" },
          twitter: { type: "link", label: "Twitter URL" },
          instagram: { type: "link", label: "Instagram URL" },
          github: { type: "link", label: "GitHub URL" },
          website: { type: "link", label: "Website URL" },
          email: { type: "text", label: "Email" },
          phone: { type: "text", label: "Phone" },
          location: { type: "text", label: "Location" },
          isLeadership: { type: "toggle", label: "Leadership Member" },
          isFeatured: { type: "toggle", label: "Featured Member" },
        },
      },
      
      // Layout & Variant
      variant: {
        type: "select",
        label: "Layout Variant",
        options: [
          { label: "Cards", value: "cards" },
          { label: "Minimal", value: "minimal" },
          { label: "Detailed", value: "detailed" },
          { label: "Grid", value: "grid" },
          { label: "List", value: "list" },
          { label: "Magazine", value: "magazine" },
          { label: "Overlap", value: "overlap" },
          { label: "Circular", value: "circular" },
          { label: "Modern", value: "modern" },
          { label: "Hover Reveal", value: "hover-reveal" },
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
          { label: "5 Columns", value: 5 },
          { label: "6 Columns", value: 6 },
        ],
        defaultValue: 4,
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
          { label: "Full Width", value: "full" },
        ],
        defaultValue: "xl",
      },
      contentAlign: {
        type: "select",
        label: "Content Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      
      // Card Styling
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      cardBackgroundColor: { type: "color", label: "Card Background", defaultValue: "#f9fafb" },
      cardHoverBackgroundColor: { type: "color", label: "Card Hover Background" },
      featuredCardBackground: { type: "color", label: "Featured Card Background", defaultValue: "#3b82f610" },
      cardBorder: { type: "toggle", label: "Show Card Border" },
      cardBorderColor: { type: "color", label: "Card Border Color", defaultValue: "#e5e7eb" },
      cardBorderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
        ],
        defaultValue: "1",
      },
      cardBorderRadius: {
        type: "select",
        label: "Card Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "xl",
      },
      cardShadow: {
        type: "select",
        label: "Card Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "sm",
      },
      cardHoverShadow: {
        type: "select",
        label: "Card Hover Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      cardPadding: {
        type: "select",
        label: "Card Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      hoverEffect: {
        type: "select",
        label: "Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Lift", value: "lift" },
          { label: "Scale", value: "scale" },
          { label: "Glow", value: "glow" },
          { label: "Flip", value: "flip" },
          { label: "Slide Up", value: "slide-up" },
        ],
        defaultValue: "lift",
      },
      
      // Image Styling
      imageSize: {
        type: "select",
        label: "Image Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      imageShape: {
        type: "select",
        label: "Image Shape",
        options: [
          { label: "Circle", value: "circle" },
          { label: "Square", value: "square" },
          { label: "Rounded", value: "rounded" },
          { label: "Rounded Large", value: "rounded-lg" },
        ],
        defaultValue: "circle",
      },
      imageBorder: { type: "toggle", label: "Show Image Border" },
      imageBorderColor: { type: "color", label: "Image Border Color", defaultValue: "#3b82f6" },
      imageBorderWidth: {
        type: "select",
        label: "Image Border Width",
        options: [
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
          { label: "4px", value: "4" },
        ],
        defaultValue: "3",
      },
      imagePosition: {
        type: "select",
        label: "Image Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Left", value: "left" },
          { label: "Background", value: "background" },
          { label: "Side", value: "side" },
        ],
        defaultValue: "top",
      },
      showImageOverlay: { type: "toggle", label: "Show Image Hover Overlay" },
      imageOverlayColor: { type: "color", label: "Image Overlay Color", defaultValue: "#000000" },
      imageGrayscale: { type: "toggle", label: "Grayscale Images" },
      imageGrayscaleHover: { type: "toggle", label: "Grayscale on Hover" },
      
      // Name & Role Styling
      nameSize: {
        type: "select",
        label: "Name Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      nameColor: { type: "color", label: "Name Color" },
      nameFont: { type: "text", label: "Name Font" },
      nameFontWeight: {
        type: "select",
        label: "Name Font Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
        ],
        defaultValue: "semibold",
      },
      roleSize: {
        type: "select",
        label: "Role Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
        ],
        defaultValue: "sm",
      },
      roleColor: { type: "color", label: "Role Color" },
      roleStyle: {
        type: "select",
        label: "Role Style",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Badge", value: "badge" },
          { label: "Uppercase", value: "uppercase" },
        ],
        defaultValue: "normal",
      },
      showDepartment: { type: "toggle", label: "Show Department" },
      departmentColor: { type: "color", label: "Department Color" },
      
      // Bio Settings
      showBio: { type: "toggle", label: "Show Bio" },
      bioMaxLines: { type: "number", label: "Bio Max Lines", min: 1, max: 10, defaultValue: 3 },
      bioSize: {
        type: "select",
        label: "Bio Text Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
        ],
        defaultValue: "sm",
      },
      bioColor: { type: "color", label: "Bio Color" },
      
      // Social Links
      showSocial: { type: "toggle", label: "Show Social Links", defaultValue: true },
      socialPosition: {
        type: "select",
        label: "Social Links Position",
        options: [
          { label: "Bottom", value: "bottom" },
          { label: "Overlay", value: "overlay" },
          { label: "Inline", value: "inline" },
          { label: "On Hover", value: "hover" },
        ],
        defaultValue: "bottom",
      },
      socialSize: {
        type: "select",
        label: "Social Icon Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      socialStyle: {
        type: "select",
        label: "Social Link Style",
        options: [
          { label: "Icons Only", value: "icons" },
          { label: "Buttons", value: "buttons" },
          { label: "Pills with Labels", value: "pills" },
        ],
        defaultValue: "icons",
      },
      socialColor: { type: "color", label: "Social Icon Color", defaultValue: "#9ca3af" },
      socialHoverColor: { type: "color", label: "Social Hover Color", defaultValue: "#3b82f6" },
      showLinkedIn: { type: "toggle", label: "Show LinkedIn", defaultValue: true },
      showTwitter: { type: "toggle", label: "Show Twitter", defaultValue: true },
      showInstagram: { type: "toggle", label: "Show Instagram" },
      showGithub: { type: "toggle", label: "Show GitHub" },
      showWebsite: { type: "toggle", label: "Show Website" },
      showEmail: { type: "toggle", label: "Show Email", defaultValue: true },
      showPhone: { type: "toggle", label: "Show Phone" },
      
      // Skills
      showSkills: { type: "toggle", label: "Show Skills" },
      skillStyle: {
        type: "select",
        label: "Skill Style",
        options: [
          { label: "Tags", value: "tags" },
          { label: "Pills", value: "pills" },
          { label: "List", value: "list" },
        ],
        defaultValue: "tags",
      },
      skillColor: { type: "color", label: "Skill Text Color", defaultValue: "#3b82f6" },
      skillBackgroundColor: { type: "color", label: "Skill Background", defaultValue: "#3b82f620" },
      maxSkillsShown: { type: "number", label: "Max Skills Shown", min: 1, max: 10, defaultValue: 3 },
      
      // Location
      showLocation: { type: "toggle", label: "Show Location" },
      locationIcon: { type: "toggle", label: "Show Location Icon", defaultValue: true },
      locationColor: { type: "color", label: "Location Color" },
      
      // Filtering
      showFilter: { type: "toggle", label: "Enable Filtering" },
      filterBy: {
        type: "select",
        label: "Filter By",
        options: [
          { label: "Department", value: "department" },
          { label: "Role", value: "role" },
          { label: "None", value: "none" },
        ],
        defaultValue: "department",
      },
      filterPosition: {
        type: "select",
        label: "Filter Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Sidebar", value: "sidebar" },
        ],
        defaultValue: "top",
      },
      filterStyle: {
        type: "select",
        label: "Filter Style",
        options: [
          { label: "Pills", value: "pills" },
          { label: "Dropdown", value: "dropdown" },
          { label: "Tabs", value: "tabs" },
        ],
        defaultValue: "pills",
      },
      
      // Leadership
      highlightLeadership: { type: "toggle", label: "Highlight Leadership" },
      leadershipLabel: { type: "text", label: "Leadership Label", defaultValue: "Leadership" },
      featuredScale: { type: "number", label: "Featured Scale", min: 1, max: 1.5, step: 0.05, defaultValue: 1.05 },
      
      // Section Sizing
      paddingY: {
        type: "select",
        label: "Vertical Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      gap: {
        type: "select",
        label: "Grid Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      sectionGap: {
        type: "select",
        label: "Header to Grid Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      
      // Background
      backgroundStyle: {
        type: "select",
        label: "Background Style",
        options: [
          { label: "Solid Color", value: "solid" },
          { label: "Gradient", value: "gradient" },
          { label: "Pattern", value: "pattern" },
          { label: "Image", value: "image" },
        ],
        defaultValue: "solid",
      },
      backgroundGradientFrom: { type: "color", label: "Gradient Start", defaultValue: "#ffffff" },
      backgroundGradientTo: { type: "color", label: "Gradient End", defaultValue: "#f3f4f6" },
      backgroundGradientDirection: {
        type: "select",
        label: "Gradient Direction",
        options: [
          { label: "To Right", value: "to-r" },
          { label: "To Left", value: "to-l" },
          { label: "To Top", value: "to-t" },
          { label: "To Bottom", value: "to-b" },
          { label: "To Bottom Right", value: "to-br" },
          { label: "To Bottom Left", value: "to-bl" },
          { label: "To Top Right", value: "to-tr" },
          { label: "To Top Left", value: "to-tl" },
        ],
        defaultValue: "to-b",
      },
      backgroundPattern: {
        type: "select",
        label: "Background Pattern",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Grid", value: "grid" },
          { label: "Lines", value: "lines" },
        ],
      },
      backgroundPatternOpacity: { type: "number", label: "Pattern Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.1 },
      backgroundImage: { type: "image", label: "Background Image" },
      backgroundOverlay: { type: "toggle", label: "Show Background Overlay" },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      backgroundOverlayOpacity: { type: "number", label: "Overlay Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
      
      // Decorators
      showDecorators: { type: "toggle", label: "Show Decorators" },
      decoratorStyle: {
        type: "select",
        label: "Decorator Style",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Circles", value: "circles" },
          { label: "Blur", value: "blur" },
        ],
        defaultValue: "blur",
      },
      decoratorColor: { type: "color", label: "Decorator Color", defaultValue: "#3b82f6" },
      decoratorPosition: {
        type: "select",
        label: "Decorator Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Both Sides", value: "both-sides" },
        ],
        defaultValue: "both-sides",
      },
      
      // Animation
      animateOnScroll: { type: "toggle", label: "Animate on Scroll" },
      animationType: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade", value: "fade" },
          { label: "Slide Up", value: "slide-up" },
          { label: "Slide Left", value: "slide-left" },
          { label: "Slide Right", value: "slide-right" },
          { label: "Scale", value: "scale" },
          { label: "Stagger", value: "stagger" },
        ],
        defaultValue: "fade",
      },
      animationDelay: { type: "number", label: "Animation Delay (ms)", min: 0, max: 2000, step: 100, defaultValue: 0 },
      staggerDelay: { type: "number", label: "Stagger Delay (ms)", min: 50, max: 500, step: 50, defaultValue: 100 },
      
      // CTA
      showCta: { type: "toggle", label: "Show CTA Section" },
      ctaTitle: { type: "text", label: "CTA Title", defaultValue: "Join Our Team" },
      ctaDescription: { type: "textarea", label: "CTA Description", defaultValue: "We're always looking for talented individuals to join us." },
      ctaButtonText: { type: "text", label: "CTA Button Text", defaultValue: "View Openings" },
      ctaButtonLink: { type: "link", label: "CTA Button Link", defaultValue: "/careers" },
      ctaButtonStyle: {
        type: "select",
        label: "CTA Button Style",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
        ],
        defaultValue: "primary",
      },
      
      // Responsive
      mobileColumns: {
        type: "select",
        label: "Mobile Columns",
        options: [
          { label: "1 Column", value: 1 },
          { label: "2 Columns", value: 2 },
        ],
        defaultValue: 2,
      },
      hideBioOnMobile: { type: "toggle", label: "Hide Bio on Mobile", defaultValue: true },
      hideSkillsOnMobile: { type: "toggle", label: "Hide Skills on Mobile", defaultValue: true },
      compactOnMobile: { type: "toggle", label: "Compact Layout on Mobile" },
      
      // Colors
      textColor: { type: "color", label: "Text Color" },
      accentColor: { type: "color", label: "Accent Color", defaultValue: "#3b82f6" },
    },
    fieldGroups: [
      { id: "header", label: "Header", icon: "type", fields: ["title", "subtitle", "description", "badge", "badgeIcon"], defaultExpanded: true },
      { id: "headerStyle", label: "Header Style", icon: "palette", fields: ["headerAlign", "titleSize", "titleColor", "titleFont", "subtitleColor", "descriptionColor", "badgeStyle", "badgeColor", "badgeTextColor"], defaultExpanded: false },
      { id: "members", label: "Team Members", icon: "users", fields: ["members"], defaultExpanded: true },
      { id: "layout", label: "Layout", icon: "layout", fields: ["variant", "columns", "maxWidth", "contentAlign", "gap", "sectionGap"], defaultExpanded: false },
      { id: "cardStyle", label: "Card Style", icon: "square", fields: ["cardBackgroundColor", "cardHoverBackgroundColor", "featuredCardBackground", "cardBorder", "cardBorderColor", "cardBorderWidth", "cardBorderRadius", "cardShadow", "cardHoverShadow", "cardPadding", "hoverEffect"], defaultExpanded: false },
      { id: "imageStyle", label: "Image Style", icon: "image", fields: ["imageSize", "imageShape", "imageBorder", "imageBorderColor", "imageBorderWidth", "imagePosition", "showImageOverlay", "imageOverlayColor", "imageGrayscale", "imageGrayscaleHover"], defaultExpanded: false },
      { id: "nameRole", label: "Name & Role", icon: "user", fields: ["nameSize", "nameColor", "nameFont", "nameFontWeight", "roleSize", "roleColor", "roleStyle", "showDepartment", "departmentColor"], defaultExpanded: false },
      { id: "bio", label: "Bio Settings", icon: "file-text", fields: ["showBio", "bioMaxLines", "bioSize", "bioColor"], defaultExpanded: false },
      { id: "social", label: "Social Links", icon: "share", fields: ["showSocial", "socialPosition", "socialSize", "socialStyle", "socialColor", "socialHoverColor", "showLinkedIn", "showTwitter", "showInstagram", "showGithub", "showWebsite", "showEmail", "showPhone"], defaultExpanded: false },
      { id: "skills", label: "Skills", icon: "star", fields: ["showSkills", "skillStyle", "skillColor", "skillBackgroundColor", "maxSkillsShown"], defaultExpanded: false },
      { id: "location", label: "Location", icon: "map-pin", fields: ["showLocation", "locationIcon", "locationColor"], defaultExpanded: false },
      { id: "filtering", label: "Filtering", icon: "filter", fields: ["showFilter", "filterBy", "filterPosition", "filterStyle"], defaultExpanded: false },
      { id: "leadership", label: "Leadership", icon: "award", fields: ["highlightLeadership", "leadershipLabel", "featuredScale"], defaultExpanded: false },
      { id: "sizing", label: "Section Sizing", icon: "maximize", fields: ["paddingY", "paddingX"], defaultExpanded: false },
      { id: "background", label: "Background", icon: "layers", fields: ["backgroundColor", "backgroundStyle", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundPattern", "backgroundPatternOpacity", "backgroundImage", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity"], defaultExpanded: false },
      { id: "decorators", label: "Decorators", icon: "sparkles", fields: ["showDecorators", "decoratorStyle", "decoratorColor", "decoratorPosition"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "zap", fields: ["animateOnScroll", "animationType", "animationDelay", "staggerDelay"], defaultExpanded: false },
      { id: "cta", label: "Call to Action", icon: "mouse-pointer", fields: ["showCta", "ctaTitle", "ctaDescription", "ctaButtonText", "ctaButtonLink", "ctaButtonStyle"], defaultExpanded: false },
      { id: "responsive", label: "Responsive", icon: "smartphone", fields: ["mobileColumns", "hideBioOnMobile", "hideSkillsOnMobile", "compactOnMobile"], defaultExpanded: false },
      { id: "colors", label: "Colors", icon: "droplet", fields: ["textColor", "accentColor"], defaultExpanded: false },
    ],
    defaultProps: {
      title: "Meet Our Team",
      variant: "cards",
      columns: 4,
      showSocial: true,
      backgroundColor: "#ffffff",
      cardBackgroundColor: "#f9fafb",
      accentColor: "#3b82f6",
      members: [
        { name: "Alex Johnson", role: "CEO & Founder", bio: "Visionary leader with 15+ years of experience", image: "/placeholder-avatar.svg", linkedin: "#", twitter: "#", email: "alex@example.com" },
        { name: "Sarah Chen", role: "CTO", bio: "Tech innovator passionate about AI", image: "/placeholder-avatar.svg", linkedin: "#", github: "#", email: "sarah@example.com" },
        { name: "Marcus Williams", role: "Design Director", bio: "Creating beautiful user experiences", image: "/placeholder-avatar.svg", linkedin: "#", twitter: "#", email: "marcus@example.com" },
        { name: "Elena Rodriguez", role: "Marketing Lead", bio: "Driving growth through creative strategies", image: "/placeholder-avatar.svg", linkedin: "#", instagram: "#", email: "elena@example.com" },
      ],
    },
    ai: {
      description: "A premium team section with comprehensive styling options including card styles, image shapes, social links, skills display, filtering, leadership highlighting, animations, and CTA sections",
      canModify: ["title", "subtitle", "description", "members", "variant", "columns", "backgroundColor", "showSocial", "showBio", "showSkills", "animateOnScroll"],
    },
  }),

  defineComponent({
    type: "Gallery",
    label: "Gallery",
    description: "Premium image gallery with filtering, lightbox, hover effects, and multiple layout options",
    category: "sections",
    icon: "Images",
    render: GalleryRender,
    fields: {
      // Header Content
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      description: { type: "textarea", label: "Description" },
      badge: { type: "text", label: "Badge Text" },
      badgeIcon: { type: "text", label: "Badge Icon (emoji)" },
      
      // Header Styling
      headerAlign: {
        type: "select",
        label: "Header Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      titleColor: { type: "color", label: "Title Color" },
      titleFont: { type: "text", label: "Title Font" },
      subtitleColor: { type: "color", label: "Subtitle Color" },
      descriptionColor: { type: "color", label: "Description Color" },
      badgeStyle: {
        type: "select",
        label: "Badge Style",
        options: [
          { label: "Pill", value: "pill" },
          { label: "Outlined", value: "outlined" },
          { label: "Solid", value: "solid" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "pill",
      },
      badgeColor: { type: "color", label: "Badge Color", defaultValue: "#3b82f6" },
      badgeTextColor: { type: "color", label: "Badge Text Color", defaultValue: "#ffffff" },
      
      // Images
      images: {
        type: "array",
        label: "Images",
        itemFields: {
          src: { type: "image", label: "Image" },
          alt: { type: "text", label: "Alt Text" },
          title: { type: "text", label: "Title" },
          caption: { type: "text", label: "Caption" },
          category: { type: "text", label: "Category" },
          link: { type: "link", label: "Link URL" },
          linkTarget: {
            type: "select",
            label: "Link Target",
            options: [
              { label: "Same Window", value: "_self" },
              { label: "New Window", value: "_blank" },
            ],
          },
        },
      },
      
      // Layout & Variant
      variant: {
        type: "select",
        label: "Layout Variant",
        options: [
          { label: "Grid", value: "grid" },
          { label: "Masonry", value: "masonry" },
          { label: "Carousel", value: "carousel" },
          { label: "Justified", value: "justified" },
          { label: "Spotlight", value: "spotlight" },
          { label: "Collage", value: "collage" },
          { label: "Pinterest", value: "pinterest" },
          { label: "Slider", value: "slider" },
        ],
        defaultValue: "grid",
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: 2 },
          { label: "3 Columns", value: 3 },
          { label: "4 Columns", value: 4 },
          { label: "5 Columns", value: 5 },
          { label: "6 Columns", value: 6 },
        ],
        defaultValue: 3,
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
          { label: "Full Width", value: "full" },
        ],
        defaultValue: "xl",
      },
      
      // Image Styling
      gap: {
        type: "select",
        label: "Gap Size",
        options: [
          { label: "None", value: "none" },
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      aspectRatio: {
        type: "select",
        label: "Aspect Ratio",
        options: [
          { label: "Square", value: "square" },
          { label: "Video (16:9)", value: "video" },
          { label: "Portrait (3:4)", value: "portrait" },
          { label: "Wide (16:9)", value: "wide" },
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "square",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      imageBorder: { type: "toggle", label: "Show Image Border" },
      imageBorderColor: { type: "color", label: "Image Border Color", defaultValue: "#e5e7eb" },
      imageBorderWidth: {
        type: "select",
        label: "Image Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
        ],
        defaultValue: "1",
      },
      imageShadow: {
        type: "select",
        label: "Image Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "none",
      },
      
      // Hover Effects
      hoverEffect: {
        type: "select",
        label: "Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Zoom In", value: "zoom" },
          { label: "Zoom Out", value: "zoom-out" },
          { label: "Overlay", value: "overlay" },
          { label: "Slide Up", value: "slide-up" },
          { label: "Blur", value: "blur" },
          { label: "Grayscale", value: "grayscale" },
          { label: "Brightness", value: "brightness" },
          { label: "Tilt", value: "tilt" },
        ],
        defaultValue: "zoom",
      },
      hoverOverlayColor: { type: "color", label: "Hover Overlay Color", defaultValue: "#000000" },
      hoverOverlayOpacity: { type: "number", label: "Hover Overlay Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
      hoverScale: { type: "number", label: "Hover Scale", min: 1, max: 1.5, step: 0.05, defaultValue: 1.05 },
      showCaptionOnHover: { type: "toggle", label: "Show Caption on Hover", defaultValue: true },
      showTitleOnHover: { type: "toggle", label: "Show Title on Hover" },
      
      // Caption/Title Display
      showCaption: { type: "toggle", label: "Show Caption", defaultValue: true },
      captionPosition: {
        type: "select",
        label: "Caption Position",
        options: [
          { label: "Overlay", value: "overlay" },
          { label: "Below", value: "below" },
          { label: "Above", value: "above" },
        ],
        defaultValue: "overlay",
      },
      captionAlign: {
        type: "select",
        label: "Caption Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      captionSize: {
        type: "select",
        label: "Caption Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
        ],
        defaultValue: "sm",
      },
      captionColor: { type: "color", label: "Caption Color", defaultValue: "#ffffff" },
      captionBackgroundColor: { type: "color", label: "Caption Background" },
      showTitle: { type: "toggle", label: "Show Image Titles" },
      titlePosition: {
        type: "select",
        label: "Title Position",
        options: [
          { label: "Overlay", value: "overlay" },
          { label: "Below", value: "below" },
        ],
        defaultValue: "overlay",
      },
      imagesTitleSize: {
        type: "select",
        label: "Image Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      imagesTitleColor: { type: "color", label: "Image Title Color", defaultValue: "#ffffff" },
      
      // Lightbox
      lightbox: { type: "toggle", label: "Enable Lightbox" },
      lightboxStyle: {
        type: "select",
        label: "Lightbox Style",
        options: [
          { label: "Default", value: "default" },
          { label: "Fullscreen", value: "fullscreen" },
          { label: "Minimal", value: "minimal" },
        ],
        defaultValue: "default",
      },
      lightboxBackground: { type: "color", label: "Lightbox Background", defaultValue: "#000000" },
      showLightboxCaption: { type: "toggle", label: "Show Lightbox Caption", defaultValue: true },
      showLightboxCounter: { type: "toggle", label: "Show Image Counter", defaultValue: true },
      enableLightboxZoom: { type: "toggle", label: "Enable Lightbox Zoom", defaultValue: true },
      
      // Filtering
      showFilter: { type: "toggle", label: "Enable Category Filter" },
      filterPosition: {
        type: "select",
        label: "Filter Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Sidebar", value: "sidebar" },
        ],
        defaultValue: "top",
      },
      filterStyle: {
        type: "select",
        label: "Filter Style",
        options: [
          { label: "Pills", value: "pills" },
          { label: "Dropdown", value: "dropdown" },
          { label: "Tabs", value: "tabs" },
          { label: "Buttons", value: "buttons" },
        ],
        defaultValue: "pills",
      },
      filterAlign: {
        type: "select",
        label: "Filter Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "center",
      },
      filterActiveColor: { type: "color", label: "Active Filter Color" },
      filterInactiveColor: { type: "color", label: "Inactive Filter Color" },
      
      // Load More / Pagination
      enableLoadMore: { type: "toggle", label: "Enable Load More" },
      loadMoreStyle: {
        type: "select",
        label: "Load More Style",
        options: [
          { label: "Button", value: "button" },
          { label: "Infinite Scroll", value: "infinite" },
          { label: "Pagination", value: "pagination" },
        ],
        defaultValue: "button",
      },
      initialCount: { type: "number", label: "Initial Image Count", min: 1, max: 50, defaultValue: 6 },
      loadMoreCount: { type: "number", label: "Load More Count", min: 1, max: 20, defaultValue: 6 },
      loadMoreText: { type: "text", label: "Load More Button Text", defaultValue: "Load More" },
      loadingAnimation: { type: "toggle", label: "Show Loading Animation", defaultValue: true },
      
      // Section Sizing
      paddingY: {
        type: "select",
        label: "Vertical Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2X Large", value: "2xl" },
        ],
        defaultValue: "lg",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      sectionGap: {
        type: "select",
        label: "Header to Grid Gap",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      
      // Background
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      backgroundStyle: {
        type: "select",
        label: "Background Style",
        options: [
          { label: "Solid Color", value: "solid" },
          { label: "Gradient", value: "gradient" },
          { label: "Pattern", value: "pattern" },
          { label: "Image", value: "image" },
        ],
        defaultValue: "solid",
      },
      backgroundGradientFrom: { type: "color", label: "Gradient Start", defaultValue: "#ffffff" },
      backgroundGradientTo: { type: "color", label: "Gradient End", defaultValue: "#f3f4f6" },
      backgroundGradientDirection: {
        type: "select",
        label: "Gradient Direction",
        options: [
          { label: "To Right", value: "to-r" },
          { label: "To Left", value: "to-l" },
          { label: "To Top", value: "to-t" },
          { label: "To Bottom", value: "to-b" },
          { label: "To Bottom Right", value: "to-br" },
          { label: "To Bottom Left", value: "to-bl" },
        ],
        defaultValue: "to-b",
      },
      backgroundPattern: {
        type: "select",
        label: "Background Pattern",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Grid", value: "grid" },
          { label: "Lines", value: "lines" },
        ],
      },
      backgroundPatternOpacity: { type: "number", label: "Pattern Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.1 },
      backgroundImage: { type: "image", label: "Background Image" },
      backgroundOverlay: { type: "toggle", label: "Show Background Overlay" },
      backgroundOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      backgroundOverlayOpacity: { type: "number", label: "Overlay Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
      
      // Decorators
      showDecorators: { type: "toggle", label: "Show Decorators" },
      decoratorStyle: {
        type: "select",
        label: "Decorator Style",
        options: [
          { label: "Dots", value: "dots" },
          { label: "Circles", value: "circles" },
          { label: "Blur", value: "blur" },
        ],
        defaultValue: "blur",
      },
      decoratorColor: { type: "color", label: "Decorator Color", defaultValue: "#3b82f6" },
      decoratorPosition: {
        type: "select",
        label: "Decorator Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Both Sides", value: "both-sides" },
        ],
        defaultValue: "both-sides",
      },
      
      // Animation
      animateOnScroll: { type: "toggle", label: "Animate on Scroll" },
      animationType: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade", value: "fade" },
          { label: "Slide Up", value: "slide-up" },
          { label: "Scale", value: "scale" },
          { label: "Stagger", value: "stagger" },
          { label: "Flip", value: "flip" },
        ],
        defaultValue: "fade",
      },
      animationDelay: { type: "number", label: "Animation Delay (ms)", min: 0, max: 2000, step: 100, defaultValue: 0 },
      staggerDelay: { type: "number", label: "Stagger Delay (ms)", min: 50, max: 500, step: 50, defaultValue: 100 },
      
      // CTA
      showCta: { type: "toggle", label: "Show CTA Section" },
      ctaTitle: { type: "text", label: "CTA Title", defaultValue: "Want to See More?" },
      ctaDescription: { type: "textarea", label: "CTA Description", defaultValue: "Explore our full collection." },
      ctaButtonText: { type: "text", label: "CTA Button Text", defaultValue: "View All" },
      ctaButtonLink: { type: "link", label: "CTA Button Link", defaultValue: "/gallery" },
      ctaButtonStyle: {
        type: "select",
        label: "CTA Button Style",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
        ],
        defaultValue: "primary",
      },
      
      // Responsive
      mobileColumns: {
        type: "select",
        label: "Mobile Columns",
        options: [
          { label: "1 Column", value: 1 },
          { label: "2 Columns", value: 2 },
        ],
        defaultValue: 2,
      },
      tabletColumns: {
        type: "select",
        label: "Tablet Columns",
        options: [
          { label: "2 Columns", value: 2 },
          { label: "3 Columns", value: 3 },
        ],
        defaultValue: 2,
      },
      hideFilterOnMobile: { type: "toggle", label: "Hide Filter on Mobile" },
      compactOnMobile: { type: "toggle", label: "Compact Layout on Mobile" },
      
      // Colors
      textColor: { type: "color", label: "Text Color" },
      accentColor: { type: "color", label: "Accent Color", defaultValue: "#3b82f6" },
    },
    fieldGroups: [
      { id: "header", label: "Header", icon: "type", fields: ["title", "subtitle", "description", "badge", "badgeIcon"], defaultExpanded: true },
      { id: "headerStyle", label: "Header Style", icon: "palette", fields: ["headerAlign", "titleSize", "titleColor", "titleFont", "subtitleColor", "descriptionColor", "badgeStyle", "badgeColor", "badgeTextColor"], defaultExpanded: false },
      { id: "images", label: "Images", icon: "image", fields: ["images"], defaultExpanded: true },
      { id: "layout", label: "Layout", icon: "layout", fields: ["variant", "columns", "maxWidth", "gap", "sectionGap"], defaultExpanded: false },
      { id: "imageStyle", label: "Image Style", icon: "square", fields: ["aspectRatio", "borderRadius", "imageBorder", "imageBorderColor", "imageBorderWidth", "imageShadow"], defaultExpanded: false },
      { id: "hover", label: "Hover Effects", icon: "mouse-pointer", fields: ["hoverEffect", "hoverOverlayColor", "hoverOverlayOpacity", "hoverScale", "showCaptionOnHover", "showTitleOnHover"], defaultExpanded: false },
      { id: "captions", label: "Captions & Titles", icon: "file-text", fields: ["showCaption", "captionPosition", "captionAlign", "captionSize", "captionColor", "captionBackgroundColor", "showTitle", "titlePosition", "imagesTitleSize", "imagesTitleColor"], defaultExpanded: false },
      { id: "lightbox", label: "Lightbox", icon: "maximize", fields: ["lightbox", "lightboxStyle", "lightboxBackground", "showLightboxCaption", "showLightboxCounter", "enableLightboxZoom"], defaultExpanded: false },
      { id: "filtering", label: "Filtering", icon: "filter", fields: ["showFilter", "filterPosition", "filterStyle", "filterAlign", "filterActiveColor", "filterInactiveColor"], defaultExpanded: false },
      { id: "loadMore", label: "Load More", icon: "plus-circle", fields: ["enableLoadMore", "loadMoreStyle", "initialCount", "loadMoreCount", "loadMoreText", "loadingAnimation"], defaultExpanded: false },
      { id: "sizing", label: "Section Sizing", icon: "maximize", fields: ["paddingY", "paddingX"], defaultExpanded: false },
      { id: "background", label: "Background", icon: "layers", fields: ["backgroundColor", "backgroundStyle", "backgroundGradientFrom", "backgroundGradientTo", "backgroundGradientDirection", "backgroundPattern", "backgroundPatternOpacity", "backgroundImage", "backgroundOverlay", "backgroundOverlayColor", "backgroundOverlayOpacity"], defaultExpanded: false },
      { id: "decorators", label: "Decorators", icon: "sparkles", fields: ["showDecorators", "decoratorStyle", "decoratorColor", "decoratorPosition"], defaultExpanded: false },
      { id: "animation", label: "Animation", icon: "zap", fields: ["animateOnScroll", "animationType", "animationDelay", "staggerDelay"], defaultExpanded: false },
      { id: "cta", label: "Call to Action", icon: "mouse-pointer", fields: ["showCta", "ctaTitle", "ctaDescription", "ctaButtonText", "ctaButtonLink", "ctaButtonStyle"], defaultExpanded: false },
      { id: "responsive", label: "Responsive", icon: "smartphone", fields: ["mobileColumns", "tabletColumns", "hideFilterOnMobile", "compactOnMobile"], defaultExpanded: false },
      { id: "colors", label: "Colors", icon: "droplet", fields: ["textColor", "accentColor"], defaultExpanded: false },
    ],
    defaultProps: {
      variant: "grid",
      columns: 3,
      gap: "md",
      aspectRatio: "square",
      borderRadius: "lg",
      hoverEffect: "zoom",
      showCaption: true,
      backgroundColor: "#ffffff",
      accentColor: "#3b82f6",
      images: [
        { src: "/placeholder.svg", alt: "Gallery Image 1", caption: "Beautiful landscape" },
        { src: "/placeholder.svg", alt: "Gallery Image 2", caption: "Modern architecture" },
        { src: "/placeholder.svg", alt: "Gallery Image 3", caption: "Urban photography" },
        { src: "/placeholder.svg", alt: "Gallery Image 4", caption: "Nature close-up" },
        { src: "/placeholder.svg", alt: "Gallery Image 5", caption: "Abstract art" },
        { src: "/placeholder.svg", alt: "Gallery Image 6", caption: "Portrait photography" },
      ],
    },
    ai: {
      description: "A premium image gallery with extensive styling options including multiple layout variants, hover effects, filtering by category, lightbox support, load more pagination, and CTA sections",
      canModify: ["title", "subtitle", "description", "images", "variant", "columns", "hoverEffect", "showFilter", "lightbox", "animateOnScroll"],
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
    description: "Premium navigation header with full mobile menu - Wix Studio quality",
    category: "navigation",
    icon: "Menu",
    render: NavbarRender,
    fields: {
      // === Logo Section ===
      logo: { type: "image", label: "Logo" },
      logoText: { type: "text", label: "Logo Text", defaultValue: "Your Brand" },
      logoLink: { type: "link", label: "Logo Link", defaultValue: "/" },
      logoHeight: {
        type: "number",
        label: "Logo Height (px)",
        min: 20,
        max: 100,
        defaultValue: 36,
      },
      logoPosition: {
        type: "select",
        label: "Logo Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
        ],
        defaultValue: "left",
      },
      // === Navigation Links ===
      links: {
        type: "array",
        label: "Navigation Links",
        itemFields: {
          label: { type: "text", label: "Label" },
          href: { type: "link", label: "Link" },
          target: {
            type: "select",
            label: "Open In",
            options: [
              { label: "Same Tab", value: "_self" },
              { label: "New Tab", value: "_blank" },
            ],
          },
          hasDropdown: { type: "toggle", label: "Has Dropdown" },
          dropdownLinks: {
            type: "array",
            label: "Dropdown Links",
            itemFields: {
              label: { type: "text", label: "Label" },
              href: { type: "link", label: "Link" },
              description: { type: "text", label: "Description" },
            },
          },
        },
      },
      linkAlignment: {
        type: "select",
        label: "Link Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      linkSpacing: {
        type: "select",
        label: "Link Spacing",
        options: [
          { label: "Compact", value: "compact" },
          { label: "Normal", value: "normal" },
          { label: "Wide", value: "wide" },
        ],
        defaultValue: "normal",
      },
      linkFontSize: {
        type: "select",
        label: "Link Font Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      linkFontWeight: {
        type: "select",
        label: "Link Font Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
        ],
        defaultValue: "medium",
      },
      linkTextTransform: {
        type: "select",
        label: "Link Text Style",
        options: [
          { label: "Normal", value: "none" },
          { label: "Uppercase", value: "uppercase" },
          { label: "Capitalize", value: "capitalize" },
        ],
        defaultValue: "none",
      },
      linkHoverEffect: {
        type: "select",
        label: "Link Hover Effect",
        options: [
          { label: "None", value: "none" },
          { label: "Opacity", value: "opacity" },
          { label: "Underline", value: "underline" },
          { label: "Color Change", value: "color" },
          { label: "Background", value: "background" },
        ],
        defaultValue: "opacity",
      },
      linkActiveIndicator: {
        type: "select",
        label: "Active Link Indicator",
        options: [
          { label: "None", value: "none" },
          { label: "Underline", value: "underline" },
          { label: "Dot", value: "dot" },
          { label: "Background", value: "background" },
        ],
        defaultValue: "underline",
      },
      // === Primary CTA ===
      ctaText: { type: "text", label: "CTA Button Text", defaultValue: "Get Started" },
      ctaLink: { type: "link", label: "CTA Button Link" },
      ctaStyle: {
        type: "select",
        label: "CTA Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "solid",
      },
      ctaColor: { type: "color", label: "CTA Color", defaultValue: "#3b82f6" },
      ctaTextColor: { type: "color", label: "CTA Text Color", defaultValue: "#ffffff" },
      ctaSize: {
        type: "select",
        label: "CTA Size",
        options: presetOptions.buttonSize,
        defaultValue: "md",
      },
      ctaBorderRadius: {
        type: "select",
        label: "CTA Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "md",
      },
      ctaIcon: {
        type: "select",
        label: "CTA Icon",
        options: [
          { label: "None", value: "none" },
          { label: "Arrow", value: "arrow" },
          { label: "Chevron", value: "chevron" },
        ],
        defaultValue: "none",
      },
      // === Secondary CTA ===
      secondaryCtaText: { type: "text", label: "Secondary CTA Text" },
      secondaryCtaLink: { type: "link", label: "Secondary CTA Link" },
      secondaryCtaStyle: {
        type: "select",
        label: "Secondary CTA Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "ghost",
      },
      // === Layout & Sizing ===
      layout: {
        type: "select",
        label: "Layout Style",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Centered", value: "centered" },
          { label: "Split", value: "split" },
          { label: "Minimal", value: "minimal" },
        ],
        defaultValue: "standard",
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Full Width", value: "full" },
          { label: "7XL", value: "7xl" },
          { label: "6XL", value: "6xl" },
          { label: "5XL", value: "5xl" },
        ],
        defaultValue: "7xl",
      },
      height: {
        type: "select",
        label: "Header Height",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      // === Appearance ===
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      backgroundOpacity: {
        type: "number",
        label: "Background Opacity %",
        min: 0,
        max: 100,
        defaultValue: 100,
      },
      textColor: { type: "color", label: "Text Color", defaultValue: "#1f2937" },
      borderBottom: { type: "toggle", label: "Show Border", defaultValue: true },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#e5e7eb" },
      borderWidth: {
        type: "number",
        label: "Border Width (px)",
        min: 0,
        max: 5,
        defaultValue: 1,
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "sm",
      },
      glassEffect: { type: "toggle", label: "Glass Effect", defaultValue: false },
      glassBlur: {
        type: "number",
        label: "Glass Blur (px)",
        min: 0,
        max: 30,
        defaultValue: 10,
      },
      // === Positioning & Behavior ===
      position: {
        type: "select",
        label: "Position Mode",
        options: [
          { label: "Relative (Normal)", value: "relative" },
          { label: "Sticky (Follows Scroll)", value: "sticky" },
          { label: "Absolute (Overlay Hero)", value: "absolute" },
          { label: "Fixed (Always Visible)", value: "fixed" },
        ],
        defaultValue: "sticky",
      },
      stickyOffset: {
        type: "number",
        label: "Top Offset (px)",
        min: 0,
        max: 200,
        defaultValue: 0,
      },
      hideOnScroll: { type: "toggle", label: "Hide on Scroll Down", defaultValue: false },
      showOnScrollUp: { type: "toggle", label: "Show on Scroll Up", defaultValue: false },
      transparentUntilScroll: { type: "toggle", label: "Transparent Until Scroll", defaultValue: false },
      scrollThreshold: {
        type: "number",
        label: "Scroll Threshold (px)",
        min: 0,
        max: 500,
        defaultValue: 100,
      },
      // === Mobile Menu Configuration ===
      mobileBreakpoint: {
        type: "select",
        label: "Mobile Breakpoint",
        options: [
          { label: "Small (640px)", value: "sm" },
          { label: "Medium (768px)", value: "md" },
          { label: "Large (1024px)", value: "lg" },
        ],
        defaultValue: "md",
      },
      mobileMenuStyle: {
        type: "select",
        label: "Mobile Menu Style",
        options: [
          { label: "Fullscreen", value: "fullscreen" },
          { label: "Slide from Right", value: "slideRight" },
          { label: "Slide from Left", value: "slideLeft" },
          { label: "Dropdown", value: "dropdown" },
        ],
        defaultValue: "fullscreen",
      },
      mobileMenuBackground: { type: "color", label: "Mobile Menu Background", defaultValue: "#ffffff" },
      mobileMenuTextColor: { type: "color", label: "Mobile Menu Text Color", defaultValue: "#1f2937" },
      mobileMenuAnimation: {
        type: "select",
        label: "Mobile Menu Animation",
        options: [
          { label: "Slide", value: "slide" },
          { label: "Fade", value: "fade" },
          { label: "Scale", value: "scale" },
          { label: "None", value: "none" },
        ],
        defaultValue: "slide",
      },
      mobileMenuDuration: {
        type: "number",
        label: "Animation Duration (ms)",
        min: 100,
        max: 1000,
        defaultValue: 300,
      },
      showMobileMenuOverlay: { type: "toggle", label: "Show Overlay", defaultValue: true },
      mobileMenuOverlayColor: { type: "color", label: "Overlay Color", defaultValue: "#000000" },
      mobileMenuOverlayOpacity: {
        type: "number",
        label: "Overlay Opacity %",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
      hamburgerSize: {
        type: "number",
        label: "Hamburger Size (px)",
        min: 20,
        max: 40,
        defaultValue: 24,
      },
      hamburgerColor: { type: "color", label: "Hamburger Color" },
      showCtaInMobileMenu: { type: "toggle", label: "Show CTA in Mobile Menu", defaultValue: true },
      mobileMenuLinkSpacing: {
        type: "select",
        label: "Mobile Link Spacing",
        options: [
          { label: "Compact", value: "compact" },
          { label: "Normal", value: "normal" },
          { label: "Spacious", value: "spacious" },
        ],
        defaultValue: "normal",
      },
      // === Scroll Progress Indicator ===
      showScrollProgress: { type: "toggle", label: "Show Scroll Progress", defaultValue: false },
      scrollProgressPosition: {
        type: "select",
        label: "Progress Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
        defaultValue: "top",
      },
      scrollProgressHeight: {
        type: "number",
        label: "Progress Height (px)",
        defaultValue: 3,
      },
      scrollProgressColor: { type: "color", label: "Progress Color", defaultValue: "#3b82f6" },
      scrollProgressBackground: { type: "color", label: "Progress Background", defaultValue: "transparent" },
      scrollProgressStyle: {
        type: "select",
        label: "Progress Style",
        options: [
          { label: "Bar", value: "bar" },
          { label: "Line", value: "line" },
          { label: "Gradient", value: "gradient" },
        ],
        defaultValue: "bar",
      },
      // === Accessibility ===
      ariaLabel: { type: "text", label: "Aria Label", defaultValue: "Main navigation" },
      skipToContent: { type: "text", label: "Skip to Content Link" },
    },
    fieldGroups: [
      { id: "branding", label: "Logo & Branding", icon: "Tag", fields: ["logo", "logoText", "logoLink", "logoHeight", "logoPosition"], defaultExpanded: true },
      { id: "navigation", label: "Navigation Links", icon: "Link", fields: ["links", "linkAlignment", "linkSpacing", "linkFontSize", "linkFontWeight", "linkTextTransform", "linkHoverEffect", "linkActiveIndicator"], defaultExpanded: true },
      { id: "cta", label: "Call to Action", icon: "Target", fields: ["ctaText", "ctaLink", "ctaStyle", "ctaColor", "ctaTextColor", "ctaSize", "ctaBorderRadius", "ctaIcon", "secondaryCtaText", "secondaryCtaLink", "secondaryCtaStyle"], defaultExpanded: false },
      { id: "layout", label: "Layout & Size", icon: "LayoutGrid", fields: ["layout", "maxWidth", "height", "paddingX"], defaultExpanded: false },
      { id: "appearance", label: "Colors & Style", icon: "Palette", fields: ["backgroundColor", "backgroundOpacity", "textColor", "borderBottom", "borderColor", "borderWidth", "shadow", "glassEffect", "glassBlur"], defaultExpanded: false },
      { id: "behavior", label: "Position & Behavior", icon: "Settings", fields: ["position", "stickyOffset", "hideOnScroll", "showOnScrollUp", "transparentUntilScroll", "scrollThreshold"], defaultExpanded: false },
      { id: "mobile", label: "Mobile Menu", icon: "Smartphone", fields: ["mobileBreakpoint", "mobileMenuStyle", "mobileMenuBackground", "mobileMenuTextColor", "mobileMenuAnimation", "mobileMenuDuration", "showMobileMenuOverlay", "mobileMenuOverlayColor", "mobileMenuOverlayOpacity", "hamburgerIcon", "hamburgerSize", "hamburgerColor", "showCtaInMobileMenu", "mobileMenuLinkSpacing"], defaultExpanded: false },
      { id: "scrollProgress", label: "Scroll Progress", icon: "Activity", fields: ["showScrollProgress", "scrollProgressPosition", "scrollProgressHeight", "scrollProgressColor", "scrollProgressBackground", "scrollProgressStyle"], defaultExpanded: false },
      { id: "accessibility", label: "Accessibility", icon: "Accessibility", fields: ["ariaLabel", "skipToContent"], defaultExpanded: false },
    ],
    defaultProps: {
      logoText: "Your Brand",
      logoLink: "/",
      logoHeight: 36,
      logoPosition: "left",
      links: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" },
      ],
      linkAlignment: "center",
      linkSpacing: "normal",
      linkFontSize: "md",
      linkFontWeight: "medium",
      linkHoverEffect: "opacity",
      ctaText: "Get Started",
      ctaStyle: "solid",
      ctaColor: "#3b82f6",
      ctaTextColor: "#ffffff",
      ctaSize: "md",
      ctaBorderRadius: "md",
      layout: "standard",
      maxWidth: "7xl",
      height: "md",
      paddingX: "md",
      backgroundColor: "#ffffff",
      backgroundOpacity: 90,
      textColor: "#1f2937",
      borderBottom: false,
      borderColor: "#e5e7eb",
      shadow: "none",
      position: "sticky",
      transparentUntilScroll: false,
      mobileMenuStyle: "fullscreen",
      mobileMenuBackground: "#ffffff",
      mobileMenuTextColor: "#1f2937",
      mobileMenuAnimation: "slide",
      showMobileMenuOverlay: true,
      showCtaInMobileMenu: true,
      mobileMenuLinkSpacing: "normal",
    },
    ai: {
      description: "A premium navigation header with full mobile menu, dropdowns, and scroll behaviors",
      canModify: ["logoText", "links", "ctaText", "backgroundColor", "textColor", "mobileMenuStyle"],
      suggestions: ["Add glass effect", "Enable sticky header", "Try fullscreen mobile menu", "Add secondary CTA"],
    },
  }),

  defineComponent({
    type: "Footer",
    label: "Footer",
    description: "Premium site footer with columns, newsletter, and social links - Wix Studio quality",
    category: "navigation",
    icon: "Footprints",
    render: FooterRender,
    fields: {
      // === Logo & Branding ===
      logo: { type: "image", label: "Logo" },
      logoText: { type: "text", label: "Logo Text" },
      logoHeight: {
        type: "number",
        label: "Logo Height (px)",
        min: 20,
        max: 100,
        defaultValue: 40,
      },
      companyName: { type: "text", label: "Company Name", defaultValue: "Your Company" },
      description: {
        type: "textarea",
        label: "Description",
        rows: 3,
        defaultValue: "Building amazing products for the digital age.",
      },
      // === Link Columns ===
      columns: {
        type: "array",
        label: "Link Columns",
        itemFields: {
          title: { type: "text", label: "Column Title" },
          links: {
            type: "array",
            label: "Links",
            itemFields: {
              label: { type: "text", label: "Label" },
              href: { type: "link", label: "Link" },
              isNew: { type: "toggle", label: "Show 'New' Badge" },
            },
          },
        },
      },
      columnsLayout: {
        type: "select",
        label: "Columns Layout",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
          { label: "Auto Fit", value: "auto" },
        ],
        defaultValue: "auto",
      },
      // === Newsletter ===
      showNewsletter: { type: "toggle", label: "Show Newsletter", defaultValue: true },
      newsletterTitle: { type: "text", label: "Newsletter Title", defaultValue: "Stay Updated" },
      newsletterDescription: {
        type: "text",
        label: "Newsletter Description",
        defaultValue: "Subscribe to our newsletter for the latest updates.",
      },
      newsletterPlaceholder: { type: "text", label: "Email Placeholder", defaultValue: "Enter your email" },
      newsletterButtonText: { type: "text", label: "Subscribe Button", defaultValue: "Subscribe" },
      newsletterButtonColor: { type: "color", label: "Subscribe Button Color", defaultValue: "#3b82f6" },
      // === Social Links ===
      showSocialLinks: { type: "toggle", label: "Show Social Links", defaultValue: true },
      socialLinksTitle: { type: "text", label: "Social Links Title", defaultValue: "Follow Us" },
      socialLinks: {
        type: "array",
        label: "Social Links",
        itemFields: {
          platform: {
            type: "select",
            label: "Platform",
            options: [
              { label: "Facebook", value: "facebook" },
              { label: "Twitter/X", value: "twitter" },
              { label: "Instagram", value: "instagram" },
              { label: "LinkedIn", value: "linkedin" },
              { label: "YouTube", value: "youtube" },
              { label: "GitHub", value: "github" },
              { label: "TikTok", value: "tiktok" },
              { label: "Pinterest", value: "pinterest" },
            ],
          },
          url: { type: "link", label: "URL" },
        },
      },
      socialIconSize: {
        type: "select",
        label: "Social Icon Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      socialIconStyle: {
        type: "select",
        label: "Social Icon Style",
        options: [
          { label: "Default", value: "default" },
          { label: "Filled", value: "filled" },
          { label: "Outline", value: "outline" },
        ],
        defaultValue: "default",
      },
      // === Contact Information ===
      showContactInfo: { type: "toggle", label: "Show Contact Info", defaultValue: false },
      contactEmail: { type: "text", label: "Email Address" },
      contactPhone: { type: "text", label: "Phone Number" },
      contactAddress: { type: "textarea", label: "Address" },
      // === App Store Badges ===
      showAppBadges: { type: "toggle", label: "Show App Badges", defaultValue: false },
      appStoreUrl: { type: "link", label: "App Store URL" },
      playStoreUrl: { type: "link", label: "Play Store URL" },
      // === Copyright & Legal ===
      copyright: {
        type: "text",
        label: "Copyright Text",
        defaultValue: "© 2024 Your Company. All rights reserved.",
      },
      legalLinks: {
        type: "array",
        label: "Legal Links",
        itemFields: {
          label: { type: "text", label: "Label" },
          href: { type: "link", label: "Link" },
        },
      },
      showMadeWith: { type: "toggle", label: "Show 'Made With' Badge", defaultValue: false },
      madeWithText: { type: "text", label: "Made With Text", defaultValue: "Made with ❤️" },
      // === Layout ===
      variant: {
        type: "select",
        label: "Footer Variant",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Centered", value: "centered" },
          { label: "Simple", value: "simple" },
          { label: "Extended", value: "extended" },
        ],
        defaultValue: "standard",
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Full Width", value: "full" },
          { label: "7XL", value: "7xl" },
          { label: "6XL", value: "6xl" },
          { label: "5XL", value: "5xl" },
        ],
        defaultValue: "7xl",
      },
      paddingTop: {
        type: "select",
        label: "Padding Top",
        options: presetOptions.padding,
        defaultValue: "xl",
      },
      paddingBottom: {
        type: "select",
        label: "Padding Bottom",
        options: presetOptions.padding,
        defaultValue: "lg",
      },
      paddingX: {
        type: "select",
        label: "Horizontal Padding",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XL", value: "xl" },
        ],
        defaultValue: "md",
      },
      // === Appearance ===
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#111827" },
      textColor: { type: "color", label: "Text Color", defaultValue: "#f9fafb" },
      linkColor: { type: "color", label: "Link Color", defaultValue: "#9ca3af" },
      linkHoverColor: { type: "color", label: "Link Hover Color", defaultValue: "#ffffff" },
      borderTop: { type: "toggle", label: "Show Top Border", defaultValue: false },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#374151" },
      dividerColor: { type: "color", label: "Section Divider Color", defaultValue: "#374151" },
    },
    fieldGroups: [
      { id: "branding", label: "Logo & Branding", icon: "Building2", fields: ["logo", "logoText", "logoHeight", "companyName", "description", "tagline"], defaultExpanded: true },
      { id: "columns", label: "Link Columns", icon: "Columns", fields: ["columns", "columnsLayout"], defaultExpanded: true },
      { id: "newsletter", label: "Newsletter", icon: "Mail", fields: ["showNewsletter", "newsletterTitle", "newsletterDescription", "newsletterPlaceholder", "newsletterButtonText", "newsletterButtonColor"], defaultExpanded: false },
      { id: "social", label: "Social Links", icon: "Share2", fields: ["showSocialLinks", "socialLinksTitle", "socialLinks", "socialIconSize", "socialIconStyle"], defaultExpanded: false },
      { id: "contact", label: "Contact Info", icon: "Phone", fields: ["showContactInfo", "contactTitle", "contactEmail", "contactPhone", "contactAddress"], defaultExpanded: false },
      { id: "appStores", label: "App Store Badges", icon: "Smartphone", fields: ["showAppStores", "appStoreUrl", "playStoreUrl"], defaultExpanded: false },
      { id: "legal", label: "Legal & Copyright", icon: "Scale", fields: ["copyright", "legalLinks", "showMadeWith", "madeWithText"], defaultExpanded: false },
      { id: "layout", label: "Layout", icon: "LayoutGrid", fields: ["variant", "maxWidth", "paddingTop", "paddingBottom", "paddingX"], defaultExpanded: false },
      { id: "appearance", label: "Colors & Style", icon: "Palette", fields: ["backgroundColor", "textColor", "linkColor", "linkHoverColor", "borderTop", "borderColor", "dividerColor"], defaultExpanded: false },
    ],
    defaultProps: {
      companyName: "Your Company",
      description: "Building amazing products for the digital age.",
      logoHeight: 40,
      columns: [
        {
          title: "Product",
          links: [
            { label: "Features", href: "/features" },
            { label: "Pricing", href: "/pricing" },
            { label: "Integrations", href: "/integrations" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About", href: "/about" },
            { label: "Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "Documentation", href: "/docs" },
            { label: "Help Center", href: "/help" },
            { label: "Contact", href: "/contact" },
          ],
        },
      ],
      columnsLayout: "auto",
      showNewsletter: true,
      newsletterTitle: "Stay Updated",
      newsletterDescription: "Subscribe to our newsletter for the latest updates.",
      newsletterPlaceholder: "Enter your email",
      newsletterButtonText: "Subscribe",
      newsletterButtonColor: "#3b82f6",
      showSocialLinks: true,
      socialLinksTitle: "Follow Us",
      socialLinks: [
        { platform: "twitter", url: "#" },
        { platform: "linkedin", url: "#" },
        { platform: "github", url: "#" },
      ],
      socialIconSize: "md",
      socialIconStyle: "default",
      copyright: "© 2024 Your Company. All rights reserved.",
      legalLinks: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
      variant: "standard",
      maxWidth: "7xl",
      paddingTop: "xl",
      paddingBottom: "lg",
      paddingX: "md",
      backgroundColor: "#111827",
      textColor: "#f9fafb",
      linkColor: "#9ca3af",
      linkHoverColor: "#ffffff",
    },
    ai: {
      description: "A premium footer with columns, newsletter, social links, and contact info",
      canModify: ["companyName", "description", "copyright", "backgroundColor", "columns", "socialLinks"],
      suggestions: ["Add newsletter signup", "Add social links", "Show contact info", "Add app store badges"],
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
// FORM COMPONENTS - Premium Form Components with 40-50+ Properties
// =============================================================================

const formComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Form",
    label: "Form",
    description: "Premium form container with built-in submit handling, validation states, and flexible layouts",
    category: "forms",
    icon: "ClipboardList",
    render: FormRender,
    acceptsChildren: true,
    isContainer: true,
    fieldGroups: [
      { id: "content", label: "Content", icon: "Type", fields: ["title", "description"], defaultExpanded: true },
      { id: "settings", label: "Form Settings", icon: "Settings", fields: ["action", "method", "enctype", "novalidate", "autocomplete"], defaultExpanded: true },
      { id: "layout", label: "Layout", icon: "Layout", fields: ["layout", "gap", "labelPosition", "alignItems"], defaultExpanded: true },
      { id: "sizing", label: "Sizing", icon: "Maximize2", fields: ["maxWidth", "fullWidth"] },
      { id: "appearance", label: "Appearance", icon: "Palette", fields: ["backgroundColor", "padding", "borderRadius", "shadow"] },
      { id: "border", label: "Border", icon: "Square", fields: ["border", "borderColor", "borderWidth"] },
      { id: "header", label: "Header Styling", icon: "Heading", fields: ["showHeader", "headerAlign", "titleSize", "titleColor", "descriptionColor", "headerSpacing"] },
      { id: "dividers", label: "Dividers", icon: "Minus", fields: ["showDividers", "dividerColor"] },
      { id: "submitButton", label: "Submit Button", icon: "Send", fields: ["showSubmitButton", "submitText", "submitVariant", "submitSize", "submitFullWidth", "submitColor", "submitPosition"] },
      { id: "resetButton", label: "Reset Button", icon: "RotateCcw", fields: ["showResetButton", "resetText"] },
      { id: "states", label: "Loading & States", icon: "Loader", fields: ["isLoading", "loadingText", "disabled"] },
      { id: "messages", label: "Messages", icon: "MessageSquare", fields: ["successMessage", "errorMessage", "showSuccessIcon", "showErrorIcon"] },
      { id: "animation", label: "Animation", icon: "Sparkles", fields: ["animateOnLoad", "animationType"] },
    ],
    fields: {
      // Content
      title: { type: "text", label: "Form Title" },
      description: { type: "textarea", label: "Form Description" },
      
      // Form Settings
      action: { type: "text", label: "Form Action URL", defaultValue: "#" },
      method: {
        type: "select",
        label: "Method",
        options: [
          { label: "POST", value: "POST" },
          { label: "GET", value: "GET" },
        ],
        defaultValue: "POST",
      },
      enctype: {
        type: "select",
        label: "Encoding Type",
        options: [
          { label: "URL Encoded", value: "application/x-www-form-urlencoded" },
          { label: "Multipart (File Upload)", value: "multipart/form-data" },
          { label: "Plain Text", value: "text/plain" },
        ],
      },
      novalidate: { type: "toggle", label: "Disable Browser Validation", defaultValue: false },
      autocomplete: {
        type: "select",
        label: "Autocomplete",
        options: [
          { label: "On", value: "on" },
          { label: "Off", value: "off" },
        ],
        defaultValue: "on",
      },
      
      // Layout
      layout: {
        type: "select",
        label: "Layout",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal (2 col)", value: "horizontal" },
          { label: "Inline", value: "inline" },
          { label: "Grid 2 Columns", value: "grid-2" },
          { label: "Grid 3 Columns", value: "grid-3" },
        ],
        defaultValue: "vertical",
      },
      gap: {
        type: "select",
        label: "Field Gap",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      labelPosition: {
        type: "select",
        label: "Label Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Left", value: "left" },
          { label: "Floating", value: "floating" },
        ],
        defaultValue: "top",
      },
      alignItems: {
        type: "select",
        label: "Vertical Align",
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
          { label: "End", value: "end" },
        ],
        defaultValue: "start",
      },
      
      // Sizing
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "2XL", value: "2xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "full",
      },
      fullWidth: { type: "toggle", label: "Full Width", defaultValue: false },
      
      // Appearance
      backgroundColor: { type: "color", label: "Background Color" },
      padding: {
        type: "select",
        label: "Padding",
        options: [
          { label: "None", value: "none" },
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "none",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "none",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: presetOptions.shadow,
        defaultValue: "none",
      },
      
      // Border
      border: { type: "toggle", label: "Show Border", defaultValue: false },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#e5e7eb" },
      borderWidth: {
        type: "select",
        label: "Border Width",
        options: [
          { label: "1px", value: "1" },
          { label: "2px", value: "2" },
          { label: "3px", value: "3" },
        ],
        defaultValue: "1",
      },
      
      // Header Styling
      showHeader: { type: "toggle", label: "Show Header", defaultValue: true },
      headerAlign: {
        type: "select",
        label: "Header Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "left",
      },
      titleSize: {
        type: "select",
        label: "Title Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "lg",
      },
      titleColor: { type: "color", label: "Title Color" },
      descriptionColor: { type: "color", label: "Description Color" },
      headerSpacing: {
        type: "select",
        label: "Header Bottom Spacing",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      
      // Dividers
      showDividers: { type: "toggle", label: "Show Dividers", defaultValue: false },
      dividerColor: { type: "color", label: "Divider Color", defaultValue: "#e5e7eb" },
      
      // Submit Button
      showSubmitButton: { type: "toggle", label: "Show Submit Button", defaultValue: true },
      submitText: { type: "text", label: "Submit Text", defaultValue: "Submit" },
      submitVariant: {
        type: "select",
        label: "Submit Style",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
        ],
        defaultValue: "primary",
      },
      submitSize: {
        type: "select",
        label: "Submit Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "md",
      },
      submitFullWidth: { type: "toggle", label: "Full Width Submit", defaultValue: false },
      submitColor: { type: "color", label: "Submit Color", defaultValue: "#3b82f6" },
      submitPosition: {
        type: "select",
        label: "Submit Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
          { label: "Full Width", value: "full" },
        ],
        defaultValue: "left",
      },
      
      // Reset Button
      showResetButton: { type: "toggle", label: "Show Reset Button", defaultValue: false },
      resetText: { type: "text", label: "Reset Text", defaultValue: "Reset" },
      
      // Loading & States
      isLoading: { type: "toggle", label: "Show Loading", defaultValue: false },
      loadingText: { type: "text", label: "Loading Text", defaultValue: "Submitting..." },
      disabled: { type: "toggle", label: "Disabled", defaultValue: false },
      
      // Messages
      successMessage: { type: "text", label: "Success Message" },
      errorMessage: { type: "text", label: "Error Message" },
      showSuccessIcon: { type: "toggle", label: "Show Success Icon", defaultValue: true },
      showErrorIcon: { type: "toggle", label: "Show Error Icon", defaultValue: true },
      
      // Animation
      animateOnLoad: { type: "toggle", label: "Animate On Load", defaultValue: false },
      animationType: {
        type: "select",
        label: "Animation Type",
        options: [
          { label: "Fade In", value: "fade" },
          { label: "Slide Up", value: "slide" },
          { label: "Scale In", value: "scale" },
        ],
        defaultValue: "fade",
      },
    },
    defaultProps: {
      method: "POST",
      layout: "vertical",
      gap: "md",
      maxWidth: "full",
      padding: "none",
      borderRadius: "none",
      shadow: "none",
      showSubmitButton: true,
      submitText: "Submit",
      submitVariant: "primary",
      submitSize: "md",
      submitColor: "#3b82f6",
    },
    ai: {
      description: "A premium form container with built-in submit button, validation states, success/error messages, and flexible layouts including vertical, horizontal, and grid options",
      canModify: ["title", "description", "submitText", "successMessage", "errorMessage", "layout", "gap", "padding", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "FormField",
    label: "Form Field",
    description: "Premium form input field with 50+ customization options",
    category: "forms",
    icon: "FormInput",
    render: FormFieldRender,
    fieldGroups: [
      { id: "label", label: "Label", icon: "Tag", fields: ["label", "name", "hideLabel", "labelPosition", "labelSize", "labelColor", "labelWeight", "requiredIndicator"], defaultExpanded: true },
      { id: "input", label: "Input Settings", icon: "Type", fields: ["type", "placeholder", "value", "defaultValue"], defaultExpanded: true },
      { id: "validation", label: "Validation", icon: "CheckCircle", fields: ["required", "disabled", "readonly", "min", "max", "step", "minLength", "maxLength", "pattern"] },
      { id: "options", label: "Select/Radio Options", icon: "List", fields: ["options"] },
      { id: "textarea", label: "Textarea Settings", icon: "AlignLeft", fields: ["rows", "cols", "resize"] },
      { id: "file", label: "File Settings", icon: "Upload", fields: ["accept", "multiple"] },
      { id: "autocomplete", label: "Autocomplete", icon: "Zap", fields: ["autocomplete", "autofocus", "spellcheck"] },
      { id: "help", label: "Help & Status", icon: "HelpCircle", fields: ["helpText", "error", "success", "showCharCount"] },
      { id: "styling", label: "Input Styling", icon: "Palette", fields: ["size", "variant", "fullWidth", "borderRadius", "backgroundColor", "textColor", "borderColor", "focusBorderColor"] },
      { id: "icon", label: "Icon", icon: "Star", fields: ["iconEmoji", "iconPosition", "iconColor"] },
      { id: "prefixSuffix", label: "Prefix & Suffix", icon: "Hash", fields: ["prefix", "suffix", "prefixColor", "suffixColor"] },
      { id: "features", label: "Features", icon: "Sparkles", fields: ["showClearButton", "showPasswordToggle", "showCounter"] },
    ],
    fields: {
      // Label & Name
      label: { type: "text", label: "Label" },
      name: { type: "text", label: "Field Name" },
      hideLabel: { type: "toggle", label: "Hide Label", defaultValue: false },
      labelPosition: {
        type: "select",
        label: "Label Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Left", value: "left" },
          { label: "Floating", value: "floating" },
        ],
        defaultValue: "top",
      },
      labelSize: {
        type: "select",
        label: "Label Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
        defaultValue: "sm",
      },
      labelColor: { type: "color", label: "Label Color" },
      labelWeight: {
        type: "select",
        label: "Label Weight",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Semibold", value: "semibold" },
          { label: "Bold", value: "bold" },
        ],
        defaultValue: "medium",
      },
      requiredIndicator: {
        type: "select",
        label: "Required Indicator",
        options: [
          { label: "Asterisk (*)", value: "*" },
          { label: "Text (required)", value: "required" },
          { label: "None", value: "none" },
        ],
        defaultValue: "*",
      },
      
      // Input Settings
      type: {
        type: "select",
        label: "Input Type",
        options: [
          { label: "Text", value: "text" },
          { label: "Email", value: "email" },
          { label: "Password", value: "password" },
          { label: "Phone", value: "tel" },
          { label: "URL", value: "url" },
          { label: "Number", value: "number" },
          { label: "Date", value: "date" },
          { label: "Time", value: "time" },
          { label: "Date & Time", value: "datetime-local" },
          { label: "Textarea", value: "textarea" },
          { label: "Select", value: "select" },
          { label: "Checkbox", value: "checkbox" },
          { label: "Radio", value: "radio" },
          { label: "Range/Slider", value: "range" },
          { label: "File Upload", value: "file" },
          { label: "Color Picker", value: "color" },
          { label: "Hidden", value: "hidden" },
        ],
        defaultValue: "text",
      },
      placeholder: { type: "text", label: "Placeholder" },
      value: { type: "text", label: "Value" },
      defaultValue: { type: "text", label: "Default Value" },
      
      // Validation
      required: { type: "toggle", label: "Required", defaultValue: false },
      disabled: { type: "toggle", label: "Disabled", defaultValue: false },
      readonly: { type: "toggle", label: "Read Only", defaultValue: false },
      min: { type: "number", label: "Min Value" },
      max: { type: "number", label: "Max Value" },
      step: { type: "number", label: "Step" },
      minLength: { type: "number", label: "Min Length" },
      maxLength: { type: "number", label: "Max Length" },
      pattern: { type: "text", label: "Pattern (Regex)" },
      
      // Options
      options: {
        type: "array",
        label: "Options",
        itemFields: {
          value: { type: "text", label: "Value" },
          label: { type: "text", label: "Label" },
          disabled: { type: "toggle", label: "Disabled" },
        },
      },
      
      // Textarea
      rows: { type: "number", label: "Rows", defaultValue: 4 },
      cols: { type: "number", label: "Columns" },
      resize: {
        type: "select",
        label: "Resize",
        options: [
          { label: "None", value: "none" },
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
          { label: "Both", value: "both" },
        ],
        defaultValue: "vertical",
      },
      
      // File
      accept: { type: "text", label: "Accept (MIME types)" },
      multiple: { type: "toggle", label: "Multiple Files", defaultValue: false },
      
      // Autocomplete
      autocomplete: { type: "text", label: "Autocomplete Attribute" },
      autofocus: { type: "toggle", label: "Auto Focus", defaultValue: false },
      spellcheck: { type: "toggle", label: "Spell Check" },
      
      // Help & Status
      helpText: { type: "text", label: "Help Text" },
      error: { type: "text", label: "Error Message" },
      success: { type: "text", label: "Success Message" },
      showCharCount: { type: "toggle", label: "Show Character Count", defaultValue: false },
      
      // Styling
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
        defaultValue: "md",
      },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Default", value: "default" },
          { label: "Filled", value: "filled" },
          { label: "Underline", value: "underline" },
          { label: "Ghost", value: "ghost" },
        ],
        defaultValue: "default",
      },
      fullWidth: { type: "toggle", label: "Full Width", defaultValue: true },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
          { label: "Full", value: "full" },
        ],
        defaultValue: "lg",
      },
      backgroundColor: { type: "color", label: "Background Color", defaultValue: "#ffffff" },
      textColor: { type: "color", label: "Text Color" },
      borderColor: { type: "color", label: "Border Color", defaultValue: "#d1d5db" },
      focusBorderColor: { type: "color", label: "Focus Border Color", defaultValue: "#3b82f6" },
      
      // Icon
      iconEmoji: { type: "text", label: "Icon Emoji" },
      iconPosition: {
        type: "select",
        label: "Icon Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "left",
      },
      iconColor: { type: "color", label: "Icon Color", defaultValue: "#9ca3af" },
      
      // Prefix & Suffix
      prefix: { type: "text", label: "Prefix (e.g., $)" },
      suffix: { type: "text", label: "Suffix (e.g., kg)" },
      prefixColor: { type: "color", label: "Prefix Color", defaultValue: "#6b7280" },
      suffixColor: { type: "color", label: "Suffix Color", defaultValue: "#6b7280" },
      
      // Features
      showClearButton: { type: "toggle", label: "Show Clear Button", defaultValue: false },
      showPasswordToggle: { type: "toggle", label: "Password Toggle", defaultValue: false },
      showCounter: { type: "toggle", label: "Show Counter", defaultValue: false },
    },
    defaultProps: {
      type: "text",
      required: false,
      disabled: false,
      size: "md",
      variant: "default",
      fullWidth: true,
      borderRadius: "lg",
      labelPosition: "top",
      labelSize: "sm",
      labelWeight: "medium",
      iconPosition: "left",
    },
    ai: {
      description: "A premium form input field supporting text, email, password, phone, number, date, textarea, select, checkbox, radio, range, file, and color picker with extensive styling options",
      canModify: ["label", "placeholder", "type", "required", "helpText", "size", "variant"],
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
