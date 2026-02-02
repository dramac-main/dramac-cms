/**
 * DRAMAC Studio Premium Components Registration
 * 
 * Registers premium/starter blocks with the component registry.
 * These are high-quality responsive components that rival Webflow/Wix.
 */

import { componentRegistry, defineComponent } from "./component-registry";
import type { ComponentDefinition } from "@/types/studio";

// Import blocks
import {
  SectionBlock,
  sectionBlockFields,
  sectionBlockDefaultProps,
  ContainerBlock,
  containerBlockFields,
  containerBlockDefaultProps,
} from "@/components/studio/blocks/layout";

import {
  HeadingBlock,
  headingBlockFields,
  headingBlockDefaultProps,
  TextBlock,
  textBlockFields,
  textBlockDefaultProps,
} from "@/components/studio/blocks/typography";

import {
  ButtonBlock,
  buttonBlockFields,
  buttonBlockDefaultProps,
} from "@/components/studio/blocks/interactive";

import {
  ImageBlock,
  imageBlockFields,
  imageBlockDefaultProps,
} from "@/components/studio/blocks/media";

// =============================================================================
// PREMIUM COMPONENT DEFINITIONS
// =============================================================================

const premiumComponents: ComponentDefinition[] = [
  // ---------------------------------------------------------------------------
  // LAYOUT
  // ---------------------------------------------------------------------------
  defineComponent({
    type: "section",
    label: "Section",
    category: "layout",
    icon: "LayoutTemplate",
    description: "Full-width section with backgrounds, gradients, and overlays",
    keywords: ["section", "container", "wrapper", "background", "parallax"],
    fields: sectionBlockFields,
    defaultProps: sectionBlockDefaultProps,
    acceptsChildren: true,
    allowedChildTypes: ["container", "heading", "text", "button", "image"],
    render: SectionBlock,
    aiContext: "Section is a full-width layout block for organizing page content. Use for hero sections, feature areas, and content divisions.",
  }),

  defineComponent({
    type: "container",
    label: "Container",
    category: "layout",
    icon: "Square",
    description: "Flexible container with max-width constraints and flex/grid layout",
    keywords: ["container", "div", "wrapper", "flex", "grid"],
    fields: containerBlockFields,
    defaultProps: containerBlockDefaultProps,
    acceptsChildren: true,
    render: ContainerBlock,
    aiContext: "Container is used for grouping and laying out content. Supports flex and grid layouts with responsive gaps.",
  }),

  // ---------------------------------------------------------------------------
  // TYPOGRAPHY
  // ---------------------------------------------------------------------------
  defineComponent({
    type: "heading",
    label: "Heading",
    category: "typography",
    icon: "Heading",
    description: "Responsive heading with gradient text and effects",
    keywords: ["heading", "title", "h1", "h2", "h3", "h4", "h5", "h6"],
    fields: headingBlockFields,
    defaultProps: headingBlockDefaultProps,
    acceptsChildren: false,
    render: HeadingBlock,
    aiContext: "Heading is for titles and section headers. Supports H1-H6 levels, gradient text, and responsive font sizes.",
  }),

  defineComponent({
    type: "text",
    label: "Text",
    category: "typography",
    icon: "AlignLeft",
    description: "Rich paragraph with columns, drop cap, and typography controls",
    keywords: ["text", "paragraph", "body", "content", "p"],
    fields: textBlockFields,
    defaultProps: textBlockDefaultProps,
    acceptsChildren: false,
    render: TextBlock,
    aiContext: "Text is for body copy and paragraphs. Supports multi-column layout, drop cap, and responsive typography.",
  }),

  // ---------------------------------------------------------------------------
  // INTERACTIVE
  // ---------------------------------------------------------------------------
  defineComponent({
    type: "button",
    label: "Button",
    category: "buttons",
    icon: "MousePointer",
    description: "Versatile button with variants, icons, and hover effects",
    keywords: ["button", "cta", "link", "action", "click"],
    fields: buttonBlockFields,
    defaultProps: buttonBlockDefaultProps,
    acceptsChildren: false,
    render: ButtonBlock,
    aiContext: "Button is for calls-to-action and links. Supports solid, outline, ghost, and gradient variants with hover effects.",
  }),

  // ---------------------------------------------------------------------------
  // MEDIA
  // ---------------------------------------------------------------------------
  defineComponent({
    type: "image",
    label: "Image",
    category: "media",
    icon: "Image",
    description: "Responsive image with aspect ratios, effects, and overlays",
    keywords: ["image", "picture", "photo", "img", "media"],
    fields: imageBlockFields,
    defaultProps: imageBlockDefaultProps,
    acceptsChildren: false,
    render: ImageBlock,
    aiContext: "Image is for displaying visual content. Supports aspect ratios, hover effects, overlays, and captions.",
  }),
];

// =============================================================================
// REGISTRATION
// =============================================================================

let isRegistered = false;

/**
 * Register all premium components with the registry.
 * Safe to call multiple times - only registers once.
 */
export function registerPremiumComponents(): void {
  if (isRegistered) {
    console.debug("[Premium] Components already registered");
    return;
  }

  console.debug(`[Premium] Registering ${premiumComponents.length} premium components...`);
  
  componentRegistry.registerAll(premiumComponents, "core");
  isRegistered = true;
  
  console.debug(`[Premium] Registration complete. Total registry: ${componentRegistry.count} components`);
}

/**
 * Get all premium component definitions
 */
export function getPremiumComponents(): ComponentDefinition[] {
  return [...premiumComponents];
}

/**
 * Get premium component types
 */
export function getPremiumComponentTypes(): string[] {
  return premiumComponents.map((c) => c.type);
}
