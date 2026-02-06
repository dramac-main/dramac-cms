/**
 * AI Website Designer - Output Converter
 * 
 * Converts the AI-generated website output (GeneratedPage[], GeneratedComponent[])
 * to the Studio format (StudioPageData) that can be rendered and saved.
 * 
 * This is the critical bridge between AI generation and the real Studio rendering system.
 */

import { nanoid } from "nanoid";
import type { StudioPageData, StudioComponent } from "@/types/studio";
import type { GeneratedPage, GeneratedComponent, WebsiteDesignerOutput } from "./types";

// =============================================================================
// CONVERTER FUNCTIONS
// =============================================================================

/**
 * Convert a single GeneratedPage to StudioPageData format
 */
export function convertPageToStudioFormat(page: GeneratedPage): StudioPageData {
  const components: Record<string, StudioComponent> = {};
  const rootChildren: string[] = [];

  // Process each component in the page
  for (const genComponent of page.components) {
    const studioComponent = convertComponentToStudio(genComponent);
    components[studioComponent.id] = studioComponent;
    rootChildren.push(studioComponent.id);
  }

  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {
        title: page.seo?.title || page.title,
        description: page.seo?.description || page.description,
      },
      children: rootChildren,
    },
    components,
    zones: {},
  };
}

/**
 * Convert a GeneratedComponent to StudioComponent format
 */
function convertComponentToStudio(genComponent: GeneratedComponent): StudioComponent {
  // Map AI component types to Studio component types
  const typeMap: Record<string, string> = {
    // AI tends to generate these types - map to Studio types
    "HeroBlock": "Hero",
    "HeroSection": "Hero",
    "FeaturesGridBlock": "Features",
    "FeaturesBlock": "Features",
    "FeatureGrid": "Features",
    "CTABlock": "CTA",
    "CTASection": "CTA",
    "ContentBlock": "RichText",
    "TextBlock": "Text",
    "ServicesGridBlock": "Features",
    "ServicesBlock": "Features",
    "TeamGridBlock": "Team",
    "TeamBlock": "Team",
    "ContactFormBlock": "ContactForm",
    "TestimonialsBlock": "Testimonials",
    "TestimonialBlock": "Testimonials",
    "PricingBlock": "Pricing",
    "PricingSection": "Pricing",
    "FAQBlock": "FAQ",
    "GalleryBlock": "Gallery",
    "StatsBlock": "Stats",
    "NavbarBlock": "Navbar",
    "FooterBlock": "Footer",
    "SectionBlock": "Section",
    "QuoteBlock": "Quote",
    "NewsletterBlock": "Newsletter",
    // Direct mappings
    "Hero": "Hero",
    "Features": "Features",
    "CTA": "CTA",
    "Testimonials": "Testimonials",
    "Pricing": "Pricing",
    "FAQ": "FAQ",
    "Gallery": "Gallery",
    "Stats": "Stats",
    "Team": "Team",
    "ContactForm": "ContactForm",
    "Navbar": "Navbar",
    "Footer": "Footer",
    "Section": "Section",
    "Container": "Container",
    "Heading": "Heading",
    "Text": "Text",
    "RichText": "RichText",
    "Image": "Image",
    "Button": "Button",
    "Divider": "Divider",
    "Spacer": "Spacer",
  };

  const studioType = typeMap[genComponent.type] || genComponent.type;

  // Transform props to match Studio component expectations
  const studioProps = transformPropsForStudio(studioType, genComponent.props);

  return {
    id: genComponent.id || nanoid(10),
    type: studioType,
    props: studioProps,
    parentId: "root",
  };
}

/**
 * Transform AI-generated props to match Studio component field expectations
 */
function transformPropsForStudio(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  const transformed = { ...props };

  // Common transformations across all components
  
  // Hero component
  if (type === "Hero") {
    return {
      headline: props.headline || props.title || "Welcome",
      subheadline: props.subheadline || props.subtitle || props.description || "",
      ctaText: props.ctaText || props.buttonText || props.primaryButtonText || "Get Started",
      ctaLink: props.ctaLink || props.buttonLink || props.primaryButtonLink || "#",
      backgroundImage: props.backgroundImage || props.image || "",
      backgroundColor: props.backgroundColor || props.gradientFrom || "",
      alignment: props.alignment || "center",
      size: props.size || "large",
      overlay: props.overlay ?? true,
    };
  }

  // Features component
  if (type === "Features") {
    const features = props.features || props.items || [];
    return {
      headline: props.headline || props.title || "Features",
      description: props.description || props.subtitle || "",
      features: Array.isArray(features) ? features.map((f: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        title: f.title || f.name || `Feature ${i + 1}`,
        description: f.description || f.content || "",
        icon: f.icon || "star",
      })) : [],
      columns: props.columns || 3,
      layout: props.layout || "grid",
    };
  }

  // CTA component
  if (type === "CTA") {
    return {
      headline: props.headline || props.title || "Ready to Get Started?",
      description: props.description || props.subtitle || "",
      ctaText: props.ctaText || props.buttonText || "Get Started",
      ctaLink: props.ctaLink || props.buttonLink || "#",
      backgroundColor: props.backgroundColor || "",
      variant: props.variant || "default",
    };
  }

  // Testimonials component
  if (type === "Testimonials") {
    const testimonials = props.testimonials || props.items || [];
    return {
      headline: props.headline || props.title || "What Our Customers Say",
      testimonials: Array.isArray(testimonials) ? testimonials.map((t: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        quote: t.quote || t.text || t.content || "",
        author: t.author || t.name || `Customer ${i + 1}`,
        role: t.role || t.title || t.position || "",
        avatar: t.avatar || t.image || "",
      })) : [],
      layout: props.layout || "grid",
    };
  }

  // Team component
  if (type === "Team") {
    const members = props.members || props.team || props.items || [];
    return {
      headline: props.headline || props.title || "Meet Our Team",
      description: props.description || "",
      members: Array.isArray(members) ? members.map((m: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        name: m.name || `Team Member ${i + 1}`,
        role: m.role || m.title || m.position || "",
        bio: m.bio || m.description || "",
        avatar: m.avatar || m.image || "",
      })) : [],
      columns: props.columns || 3,
    };
  }

  // ContactForm component
  if (type === "ContactForm") {
    return {
      headline: props.headline || props.title || "Contact Us",
      description: props.description || "",
      fields: props.fields || ["name", "email", "message"],
      submitText: props.submitText || props.submitButtonText || props.buttonText || "Send Message",
      successMessage: props.successMessage || "Thank you for your message!",
    };
  }

  // Navbar component
  if (type === "Navbar") {
    return {
      logo: props.logo || props.siteName || "Logo",
      links: props.links || props.navigation || [],
      ctaText: props.ctaText || props.buttonText || "Contact",
      ctaLink: props.ctaLink || props.buttonLink || "/contact",
      sticky: props.sticky ?? true,
    };
  }

  // Footer component
  if (type === "Footer") {
    return {
      logo: props.logo || props.siteName || "Logo",
      description: props.description || props.tagline || "",
      columns: props.columns || props.sections || [],
      copyright: props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
      socialLinks: props.socialLinks || props.social || [],
    };
  }

  // FAQ component
  if (type === "FAQ") {
    const faqs = props.faqs || props.items || props.questions || [];
    return {
      headline: props.headline || props.title || "Frequently Asked Questions",
      description: props.description || "",
      faqs: Array.isArray(faqs) ? faqs.map((f: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        question: f.question || f.title || `Question ${i + 1}`,
        answer: f.answer || f.content || f.response || "",
      })) : [],
    };
  }

  // Stats component
  if (type === "Stats") {
    const stats = props.stats || props.items || [];
    return {
      headline: props.headline || props.title || "",
      stats: Array.isArray(stats) ? stats.map((s: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        value: s.value || s.number || "0",
        label: s.label || s.title || s.name || `Stat ${i + 1}`,
        suffix: s.suffix || "",
        prefix: s.prefix || "",
      })) : [],
      columns: props.columns || 4,
    };
  }

  // Pricing component
  if (type === "Pricing") {
    const plans = props.plans || props.tiers || props.items || [];
    return {
      headline: props.headline || props.title || "Pricing",
      description: props.description || "",
      plans: Array.isArray(plans) ? plans.map((p: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        name: p.name || p.title || `Plan ${i + 1}`,
        price: p.price || "0",
        currency: p.currency || "ZMW",
        period: p.period || "month",
        features: p.features || [],
        ctaText: p.ctaText || p.buttonText || "Get Started",
        ctaLink: p.ctaLink || p.buttonLink || "#",
        highlighted: p.highlighted || p.featured || false,
      })) : [],
      columns: props.columns || 3,
    };
  }

  // Section wrapper
  if (type === "Section") {
    return {
      backgroundColor: props.backgroundColor || "",
      backgroundImage: props.backgroundImage || "",
      padding: props.padding || "md",
      maxWidth: props.maxWidth || "xl",
    };
  }

  // Text/RichText
  if (type === "Text" || type === "RichText") {
    return {
      content: props.content || props.text || props.body || "",
      alignment: props.alignment || "left",
    };
  }

  // Heading
  if (type === "Heading") {
    return {
      text: props.text || props.title || props.content || "",
      level: props.level || "h2",
      alignment: props.alignment || "left",
    };
  }

  // Return original props for unknown types
  return transformed;
}

/**
 * Convert entire WebsiteDesignerOutput to a map of page slug -> StudioPageData
 */
export function convertOutputToStudioPages(
  output: WebsiteDesignerOutput
): Map<string, { page: GeneratedPage; studioData: StudioPageData }> {
  const result = new Map<string, { page: GeneratedPage; studioData: StudioPageData }>();

  for (const page of output.pages) {
    const studioData = convertPageToStudioFormat(page);
    result.set(page.slug, { page, studioData });
  }

  return result;
}

/**
 * Get default empty Studio data
 */
export function getEmptyStudioData(): StudioPageData {
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {},
      children: [],
    },
    components: {},
    zones: {},
  };
}
