/**
 * LP Migration Engine — Block Format → Studio Format
 *
 * Phase LPB-11: Deterministic conversion of legacy LandingPageBlock[]
 * into StudioPageData component trees.
 */

import type {
  LandingPageBlock,
  StyleConfig,
} from "../types/landing-page-types";
import type { StudioPageData, StudioComponent } from "@/types/studio";

// ============================================================================
// BLOCK → STUDIO MAPPING
// ============================================================================

/** Generate a unique ID for a component */
function genId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

/** Extract style overrides from legacy StyleConfig */
function extractStyleOverrides(style?: StyleConfig | null) {
  if (!style) return {};
  const overrides: Record<string, unknown> = {};
  if (style.primaryColor) overrides.primaryColor = style.primaryColor;
  if (style.backgroundColor) overrides.backgroundColor = style.backgroundColor;
  if (style.headingColor) overrides.headingColor = style.headingColor;
  if (style.bodyColor) overrides.bodyColor = style.bodyColor;
  if (style.headingFont) overrides.fontHeading = style.headingFont;
  if (style.bodyFont) overrides.fontBody = style.bodyFont;
  return overrides;
}

/** Wrap children in a Section component */
function wrapInSection(
  sectionId: string,
  childIds: string[],
  extraProps?: Record<string, unknown>,
): StudioComponent {
  return {
    id: sectionId,
    type: "Section",
    props: {
      paddingTop: 48,
      paddingBottom: 48,
      ...extraProps,
    },
    children: childIds,
  };
}

// ============================================================================
// INDIVIDUAL BLOCK CONVERTERS
// ============================================================================

type BlockConverter = (
  block: LandingPageBlock,
  index: number,
  style?: StyleConfig | null,
) => { section: StudioComponent; children: StudioComponent[] };

function convertHero(
  block: LandingPageBlock,
  index: number,
  style?: StyleConfig | null,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const heroId = genId("hero", index);
  const styleOverrides = extractStyleOverrides(style);

  return {
    section: {
      id: heroId,
      type: "LPHero",
      props: {
        variant: "split-left",
        headline: (c.heading as string) || (c.title as string) || "",
        subheadline: (c.subheading as string) || (c.subtitle as string) || "",
        ctaText: (c.ctaText as string) || (c.buttonText as string) || "",
        ctaUrl: (c.ctaUrl as string) || (c.buttonUrl as string) || "#",
        backgroundImage:
          (c.backgroundImage as string) || (c.image as string) || "",
        showOverlay: Boolean(c.overlay),
        ...styleOverrides,
      },
    },
    children: [],
  };
}

function convertFeatures(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("features-section", index);
  const features = (c.features || c.items || []) as Array<
    Record<string, unknown>
  >;

  const headingId = genId("features-heading", index);
  const childComponents: StudioComponent[] = [];
  const childIds: string[] = [];

  if (c.heading || c.title) {
    childIds.push(headingId);
    childComponents.push({
      id: headingId,
      type: "Heading",
      props: {
        text: (c.heading as string) || (c.title as string) || "Features",
        level: "h2",
        align: "center",
      },
      parentId: sectionId,
    });
  }

  features.forEach((feat, fi) => {
    const fId = genId(`feature-${index}`, fi);
    childIds.push(fId);
    childComponents.push({
      id: fId,
      type: "Container",
      props: {
        heading: (feat.title as string) || (feat.heading as string) || "",
        text: (feat.description as string) || (feat.text as string) || "",
        icon: (feat.icon as string) || "",
      },
      parentId: sectionId,
    });
  });

  return {
    section: wrapInSection(sectionId, childIds, { columns: 3 }),
    children: childComponents,
  };
}

function convertTestimonials(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const id = genId("testimonials", index);
  const testimonials = (c.testimonials || c.items || []) as Array<
    Record<string, unknown>
  >;

  return {
    section: {
      id,
      type: "LPTestimonialWall",
      props: {
        heading: (c.heading as string) || (c.title as string) || "Testimonials",
        variant: "grid",
        columns: 3,
        testimonials: testimonials.map((t) => ({
          name: (t.name as string) || "",
          role: (t.role as string) || (t.title as string) || "",
          company: (t.company as string) || "",
          quote: (t.quote as string) || (t.text as string) || "",
          avatar: (t.avatar as string) || (t.image as string) || "",
        })),
      },
    },
    children: [],
  };
}

function convertPricing(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("pricing-section", index);
  const plans = (c.plans || c.items || []) as Array<Record<string, unknown>>;
  const childIds: string[] = [];
  const childComponents: StudioComponent[] = [];

  const headingId = genId("pricing-heading", index);
  if (c.heading || c.title) {
    childIds.push(headingId);
    childComponents.push({
      id: headingId,
      type: "Heading",
      props: {
        text: (c.heading as string) || (c.title as string) || "Pricing",
        level: "h2",
        align: "center",
      },
      parentId: sectionId,
    });
  }

  plans.forEach((plan, pi) => {
    const pId = genId(`plan-${index}`, pi);
    childIds.push(pId);
    childComponents.push({
      id: pId,
      type: "Container",
      props: {
        heading: (plan.title as string) || (plan.name as string) || "",
        price: (plan.price as string) || "",
        features: (plan.features as string[]) || [],
        ctaText:
          (plan.ctaText as string) ||
          (plan.buttonText as string) ||
          "Get Started",
        ctaUrl: (plan.ctaUrl as string) || (plan.buttonUrl as string) || "#",
        highlighted: Boolean(plan.highlighted || plan.recommended),
      },
      parentId: sectionId,
    });
  });

  return {
    section: wrapInSection(sectionId, childIds, { columns: plans.length || 3 }),
    children: childComponents,
  };
}

function convertFaq(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("faq-section", index);
  const faqId = genId("faq", index);
  const items = (c.items || c.questions || []) as Array<
    Record<string, unknown>
  >;

  return {
    section: wrapInSection(sectionId, [faqId]),
    children: [
      {
        id: faqId,
        type: "LPFAQ",
        props: {
          heading: (c.heading as string) || (c.title as string) || "FAQ",
          items: items.map((item) => ({
            question: (item.question as string) || (item.q as string) || "",
            answer: (item.answer as string) || (item.a as string) || "",
          })),
        },
        parentId: sectionId,
      },
    ],
  };
}

function convertCountdown(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("countdown-section", index);
  const countdownId = genId("countdown", index);

  return {
    section: wrapInSection(sectionId, [countdownId]),
    children: [
      {
        id: countdownId,
        type: "LPCountdown",
        props: {
          targetDate: (c.targetDate as string) || (c.date as string) || "",
          labels: (c.labels as Record<string, string>) || {},
          expiredMessage:
            (c.expiredMessage as string) || "This offer has expired.",
          heading: (c.heading as string) || (c.title as string) || "",
        },
        parentId: sectionId,
      },
    ],
  };
}

function convertVideo(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("video-section", index);
  const videoId = genId("video", index);

  return {
    section: wrapInSection(sectionId, [videoId]),
    children: [
      {
        id: videoId,
        type: "LPVideoBackground",
        props: {
          videoUrl: (c.videoUrl as string) || (c.url as string) || "",
          autoplay: Boolean(c.autoplay),
          heading: (c.heading as string) || (c.title as string) || "",
        },
        parentId: sectionId,
      },
    ],
  };
}

function convertGallery(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("gallery-section", index);
  const childIds: string[] = [];
  const childComponents: StudioComponent[] = [];
  const images = (c.images || c.items || []) as Array<Record<string, unknown>>;

  images.forEach((img, ii) => {
    const imgId = genId(`gallery-img-${index}`, ii);
    childIds.push(imgId);
    childComponents.push({
      id: imgId,
      type: "Image",
      props: {
        src: (img.url as string) || (img.src as string) || "",
        alt: (img.alt as string) || (img.caption as string) || "",
        caption: (img.caption as string) || "",
      },
      parentId: sectionId,
    });
  });

  return {
    section: wrapInSection(sectionId, childIds, {
      columns: Math.min(images.length, 4),
    }),
    children: childComponents,
  };
}

function convertOptinForm(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("form-section", index);
  const formId = genId("form", index);

  // Convert legacy hardcoded fields to LPFormField format
  const legacyFields = (c.fields || []) as Array<Record<string, unknown>>;
  const fields =
    legacyFields.length > 0
      ? legacyFields.map((f) => ({
          id: (f.id as string) || (f.name as string) || "",
          type: (f.type as string) || "text",
          label: (f.label as string) || (f.name as string) || "",
          placeholder: (f.placeholder as string) || "",
          required: Boolean(f.required ?? true),
        }))
      : [
          {
            id: "email",
            type: "email",
            label: "Email",
            placeholder: "Enter your email",
            required: true,
          },
        ];

  return {
    section: wrapInSection(sectionId, [formId]),
    children: [
      {
        id: formId,
        type: "LPForm",
        props: {
          heading: (c.heading as string) || (c.title as string) || "",
          subheading:
            (c.subheading as string) || (c.description as string) || "",
          fields,
          submitButtonText:
            (c.buttonText as string) || (c.submitText as string) || "Submit",
          successMessage: (c.successMessage as string) || "Thank you!",
        },
        parentId: sectionId,
      },
    ],
  };
}

function convertCta(
  block: LandingPageBlock,
  index: number,
  style?: StyleConfig | null,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("cta-section", index);
  const headingId = genId("cta-heading", index);
  const buttonId = genId("cta-button", index);
  const childIds: string[] = [headingId, buttonId];
  const styleOverrides = extractStyleOverrides(style);

  const children: StudioComponent[] = [
    {
      id: headingId,
      type: "Heading",
      props: {
        text: (c.heading as string) || (c.title as string) || "",
        level: "h2",
        align: "center",
      },
      parentId: sectionId,
    },
    {
      id: buttonId,
      type: "Button",
      props: {
        text:
          (c.buttonText as string) || (c.ctaText as string) || "Get Started",
        url: (c.buttonUrl as string) || (c.ctaUrl as string) || "#",
        variant: "primary",
      },
      parentId: sectionId,
    },
  ];

  if (c.subheading || c.subtitle) {
    const subId = genId("cta-sub", index);
    childIds.splice(1, 0, subId);
    children.splice(1, 0, {
      id: subId,
      type: "Text",
      props: {
        content: (c.subheading as string) || (c.subtitle as string) || "",
        align: "center",
      },
      parentId: sectionId,
    });
  }

  return {
    section: wrapInSection(sectionId, childIds, {
      backgroundColor: styleOverrides.primaryColor || "var(--primary)",
      ...styleOverrides,
    }),
    children,
  };
}

function convertSocialProof(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const id = genId("social-proof", index);
  const logos = (c.logos || c.items || []) as Array<Record<string, unknown>>;

  if (logos.length > 0) {
    return {
      section: {
        id,
        type: "LPLogoBar",
        props: {
          title: (c.heading as string) || (c.title as string) || "Trusted By",
          variant: "grid",
          grayscale: true,
          logos: logos.map((l) => ({
            url: (l.url as string) || (l.src as string) || "",
            alt: (l.alt as string) || (l.name as string) || "",
          })),
        },
      },
      children: [],
    };
  }

  // Fallback to trust badges
  return {
    section: {
      id,
      type: "LPTrustBadges",
      props: {
        heading: (c.heading as string) || (c.title as string) || "",
        badges: (c.badges || c.texts || []) as string[],
      },
    },
    children: [],
  };
}

function convertText(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("text-section", index);
  const textId = genId("text", index);

  return {
    section: wrapInSection(sectionId, [textId]),
    children: [
      {
        id: textId,
        type: "Text",
        props: {
          content:
            (c.content as string) ||
            (c.text as string) ||
            (c.html as string) ||
            "",
        },
        parentId: sectionId,
      },
    ],
  };
}

function convertImage(
  block: LandingPageBlock,
  index: number,
): { section: StudioComponent; children: StudioComponent[] } {
  const c = block.content as Record<string, unknown>;
  const sectionId = genId("image-section", index);
  const imageId = genId("image", index);

  return {
    section: wrapInSection(sectionId, [imageId]),
    children: [
      {
        id: imageId,
        type: "Image",
        props: {
          src:
            (c.src as string) || (c.url as string) || (c.image as string) || "",
          alt: (c.alt as string) || "",
          caption: (c.caption as string) || "",
        },
        parentId: sectionId,
      },
    ],
  };
}

// ============================================================================
// CONVERTER REGISTRY
// ============================================================================

const BLOCK_CONVERTERS: Record<string, BlockConverter> = {
  hero: convertHero,
  features: convertFeatures,
  testimonials: convertTestimonials,
  pricing: convertPricing,
  faq: convertFaq,
  countdown: convertCountdown,
  video: convertVideo,
  gallery: convertGallery,
  optin_form: convertOptinForm,
  cta: convertCta,
  social_proof: convertSocialProof,
  text: convertText,
  image: convertImage,
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Convert a single legacy block to its Studio component representation.
 * Returns the component(s) and any warnings.
 */
export function convertSingleBlock(
  block: LandingPageBlock,
  index: number,
  style?: StyleConfig | null,
): {
  section: StudioComponent;
  children: StudioComponent[];
  warnings: string[];
} {
  const converter = BLOCK_CONVERTERS[block.type];
  const warnings: string[] = [];

  if (!converter) {
    warnings.push(
      `Unknown block type "${block.type}" at position ${index}. Converted as text placeholder.`,
    );
    const sectionId = genId("unknown-section", index);
    const textId = genId("unknown-text", index);
    return {
      section: wrapInSection(sectionId, [textId]),
      children: [
        {
          id: textId,
          type: "Text",
          props: {
            content: `[Unsupported block type: ${block.type}]`,
          },
          parentId: sectionId,
        },
      ],
      warnings,
    };
  }

  const result = converter(block, index, style);

  // Check for empty content
  const c = block.content as Record<string, unknown>;
  if (!c || Object.keys(c).length === 0) {
    warnings.push(
      `Block "${block.type}" at position ${index} has empty content. Component created with defaults.`,
    );
  }

  return { ...result, warnings };
}

/**
 * Convert an array of legacy LandingPageBlock[] into a StudioPageData tree.
 * This is the main migration entry point.
 */
export function convertBlocksToStudioTree(
  blocks: LandingPageBlock[],
  style?: StyleConfig | null,
): {
  studioData: StudioPageData;
  warnings: string[];
} {
  const allWarnings: string[] = [];
  const rootChildIds: string[] = [];
  const components: Record<string, StudioComponent> = {};

  // Sort blocks by order
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  sorted.forEach((block, index) => {
    const { section, children, warnings } = convertSingleBlock(
      block,
      index,
      style,
    );

    allWarnings.push(...warnings);

    // Add the section (top-level component) to root children
    rootChildIds.push(section.id);
    components[section.id] = section;

    // Add nested children
    children.forEach((child) => {
      components[child.id] = child;
    });
  });

  const studioData: StudioPageData = {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {},
      children: rootChildIds,
    },
    components,
  };

  return { studioData, warnings: allWarnings };
}
