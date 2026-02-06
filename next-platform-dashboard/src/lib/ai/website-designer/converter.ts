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
 * 
 * CRITICAL: This converter ensures proper defaults for:
 * - Hero overlays (readability on images)
 * - Navbar scroll behavior
 * - Consistent styling
 * - Mobile-friendly configurations
 */
function transformPropsForStudio(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  const transformed = { ...props };

  // Common transformations across all components
  
  // Hero component - ENSURE PROPER OVERLAY FOR READABILITY
  if (type === "Hero") {
    const hasBackgroundImage = !!(props.backgroundImage || props.image);
    
    return {
      // Content
      title: props.headline || props.title || "Welcome",
      subtitle: props.subheadline || props.subtitle || props.description || "",
      
      // CTA Buttons
      primaryButtonText: props.ctaText || props.buttonText || props.primaryButtonText || "Get Started",
      primaryButtonLink: props.ctaLink || props.buttonLink || props.primaryButtonLink || "#contact",
      primaryButtonColor: props.primaryButtonColor || props.ctaColor || "#3b82f6",
      primaryButtonTextColor: props.primaryButtonTextColor || "#ffffff",
      primaryButtonStyle: props.primaryButtonStyle || "solid",
      primaryButtonSize: props.primaryButtonSize || "lg",
      primaryButtonRadius: props.primaryButtonRadius || "md",
      
      secondaryButtonText: props.secondaryButtonText || props.secondaryCtaText || "",
      secondaryButtonLink: props.secondaryButtonLink || props.secondaryCtaLink || "#",
      
      // Background
      backgroundImage: props.backgroundImage || props.image || "",
      backgroundColor: props.backgroundColor || props.gradientFrom || "#1f2937",
      
      // CRITICAL: Always add overlay when there's a background image for text readability
      backgroundOverlay: hasBackgroundImage ? true : (props.backgroundOverlay ?? false),
      backgroundOverlayColor: props.backgroundOverlayColor || "#000000",
      backgroundOverlayOpacity: hasBackgroundImage ? (props.backgroundOverlayOpacity || 70) : 0,
      
      // Text colors - ensure readability
      titleColor: hasBackgroundImage ? "#ffffff" : (props.titleColor || "#1f2937"),
      subtitleColor: hasBackgroundImage ? "rgba(255,255,255,0.9)" : (props.subtitleColor || "#4b5563"),
      descriptionColor: hasBackgroundImage ? "rgba(255,255,255,0.85)" : (props.descriptionColor || "#6b7280"),
      
      // Layout
      contentAlign: props.alignment || props.contentAlign || "center",
      variant: props.variant || "centered",
      verticalAlign: props.verticalAlign || "center",
      
      // Size
      minHeight: props.minHeight || "600px",
    };
  }

  // Navbar component - ENSURE PROPER SCROLL BEHAVIOR
  if (type === "Navbar") {
    const links = props.links || props.navLinks || props.navigation || [];
    
    return {
      // Logo
      logoText: props.logoText || props.brandName || "Brand",
      logo: props.logo || props.logoImage || "",
      logoLink: props.logoLink || "/",
      logoHeight: props.logoHeight || 40,
      
      // Links - ensure they're properly formatted
      links: Array.isArray(links) ? links.map((link: Record<string, unknown>) => ({
        label: link.label || link.text || link.name || "",
        href: link.href || link.url || link.link || "#",
        target: link.target || "_self",
      })) : [],
      
      // CTA
      ctaText: props.ctaText || props.buttonText || "Get Started",
      ctaLink: props.ctaLink || props.buttonLink || "#contact",
      ctaStyle: props.ctaStyle || "solid",
      ctaColor: props.ctaColor || "#3b82f6",
      ctaTextColor: props.ctaTextColor || "#ffffff",
      ctaSize: props.ctaSize || "md",
      ctaBorderRadius: props.ctaBorderRadius || "md",
      
      // CRITICAL: Scroll behavior for better UX
      position: "sticky",
      hideOnScroll: true,
      showOnScrollUp: true,
      
      // Mobile menu - ensure close button is accessible
      mobileMenuStyle: props.mobileMenuStyle || "fullscreen",
      mobileBreakpoint: props.mobileBreakpoint || "md",
      showCtaInMobileMenu: true,
      mobileMenuLinkSpacing: props.mobileMenuLinkSpacing || "spacious",
      
      // Appearance
      backgroundColor: props.backgroundColor || "#ffffff",
      textColor: props.textColor || "#1f2937",
      shadow: props.shadow || "sm",
      borderBottom: props.borderBottom ?? true,
      
      // Link styling
      linkHoverEffect: props.linkHoverEffect || "opacity",
      linkFontWeight: props.linkFontWeight || "medium",
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
      // Consistent styling
      backgroundColor: props.backgroundColor || "#ffffff",
      textColor: props.textColor || "#1f2937",
    };
  }

  // CTA component
  if (type === "CTA") {
    return {
      headline: props.headline || props.title || "Ready to Get Started?",
      description: props.description || props.subtitle || "",
      ctaText: props.ctaText || props.buttonText || "Get Started",
      ctaLink: props.ctaLink || props.buttonLink || "#contact",
      backgroundColor: props.backgroundColor || "#1f2937",
      textColor: props.textColor || "#ffffff",
      variant: props.variant || "default",
      // Ensure button styling
      buttonColor: props.buttonColor || props.ctaColor || "#3b82f6",
      buttonTextColor: props.buttonTextColor || "#ffffff",
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
      // Form styling to match site theme
      backgroundColor: props.backgroundColor || "#ffffff",
      buttonColor: props.buttonColor || "#3b82f6",
      buttonTextColor: props.buttonTextColor || "#ffffff",
    };
  }

  // Footer component - ensure consistent styling
  if (type === "Footer") {
    const linkColumns = props.columns || props.sections || props.linkColumns || [];
    const socialLinks = props.socialLinks || props.social || [];
    
    return {
      // Logo
      logoText: props.logoText || props.logo || props.siteName || "Brand",
      logo: typeof props.logo === "string" && props.logo.includes("/") ? props.logo : "",
      tagline: props.tagline || props.description || "",
      
      // Link columns
      columns: Array.isArray(linkColumns) ? linkColumns.map((col: Record<string, unknown>, i: number) => ({
        title: col.title || col.heading || `Column ${i + 1}`,
        links: Array.isArray(col.links) ? col.links.map((link: Record<string, unknown>) => ({
          label: link.label || link.text || link.name || "",
          href: link.href || link.url || "#",
        })) : [],
      })) : [],
      
      // Social links
      socialLinks: Array.isArray(socialLinks) ? socialLinks.map((social: Record<string, unknown>) => ({
        platform: social.platform || social.name || "facebook",
        url: social.url || social.href || social.link || "#",
      })) : [],
      
      // Contact info
      email: props.email || props.contactEmail || "",
      phone: props.phone || props.contactPhone || "",
      address: props.address || "",
      
      // Copyright
      copyright: props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
      
      // Styling - consistent dark footer
      backgroundColor: props.backgroundColor || "#1f2937",
      textColor: props.textColor || "#ffffff",
      
      // Layout
      layout: props.layout || "columns",
      showNewsletter: props.showNewsletter ?? false,
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
