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
// LINK VALIDATION & FIXING
// =============================================================================

/** 
 * Default valid routes - these are common page types we expect
 * The actual pages generated will be used to validate links
 */
const DEFAULT_ROUTES = ["/", "/about", "/services", "/contact", "/menu", "/portfolio", "/work", "/gallery", "/team", "/pricing", "/faq", "/blog", "/shop", "/products", "/book", "/reserve", "/packages"];

/** Current page slugs being generated - set via setGeneratedPageSlugs() */
let generatedPageSlugs: string[] = [];

/**
 * Set the actual page slugs from the generated website
 * This should be called before converting pages to ensure links are valid
 */
export function setGeneratedPageSlugs(slugs: string[]): void {
  generatedPageSlugs = slugs.map(s => s.startsWith('/') ? s : `/${s}`);
}

/**
 * Get the combined list of valid routes (generated pages + defaults)
 */
function getValidRoutes(): string[] {
  return [...new Set([...generatedPageSlugs, ...DEFAULT_ROUTES])];
}

/**
 * Find the best matching route for a broken/placeholder link
 */
function findBestRoute(context: string, validRoutes: string[]): string {
  const contextLower = context.toLowerCase();
  
  // Priority mappings - check in order
  const mappings: [string[], string[]][] = [
    [["contact", "quote", "reach", "call", "email"], ["/contact"]],
    [["book", "reserve", "appointment", "schedule"], ["/book", "/reserve", "/contact"]],
    [["menu", "food", "dish", "eat", "drink"], ["/menu"]],
    [["service", "what we", "offer"], ["/services"]],
    [["about", "story", "who we", "our team", "meet"], ["/about", "/team"]],
    [["work", "portfolio", "project", "case stud"], ["/portfolio", "/work", "/gallery"]],
    [["shop", "product", "buy", "store", "purchase"], ["/shop", "/products"]],
    [["price", "pricing", "cost", "plan"], ["/pricing"]],
    [["faq", "question", "help"], ["/faq"]],
    [["blog", "news", "article", "post"], ["/blog"]],
    [["gallery", "photo", "image"], ["/gallery"]],
    [["home", "start", "get started", "learn more"], ["/"]],
  ];

  for (const [keywords, possibleRoutes] of mappings) {
    if (keywords.some(kw => contextLower.includes(kw))) {
      // Find first matching route that exists
      for (const route of possibleRoutes) {
        if (validRoutes.includes(route)) {
          return route;
        }
      }
    }
  }
  
  // Default fallback - prefer contact if it exists, otherwise home
  if (validRoutes.includes("/contact")) return "/contact";
  return "/";
}

/**
 * Fix a link to ensure it's a valid route
 * Converts placeholder links (#, #section, empty) to appropriate pages
 */
function fixLink(href: string | undefined | null, context: string = "default"): string {
  const validRoutes = getValidRoutes();
  
  if (!href || href === "#" || href === "" || href.startsWith("#section")) {
    return findBestRoute(context, validRoutes);
  }
  
  // Normalize the href
  let normalizedHref = href.toLowerCase().trim();
  
  // If it's already a valid-looking path
  if (normalizedHref.startsWith("/")) {
    // Check if this exact route exists
    if (validRoutes.includes(normalizedHref)) {
      return normalizedHref;
    }
    // Try without trailing slash
    const withoutTrailing = normalizedHref.replace(/\/$/, '');
    if (validRoutes.includes(withoutTrailing)) {
      return withoutTrailing;
    }
    // Route doesn't exist, find best match based on context
    return findBestRoute(context || normalizedHref, validRoutes);
  }
  
  // If it looks like a URL fragment, try to make it a route
  if (normalizedHref.startsWith("#")) {
    const routeGuess = normalizedHref.replace("#", "/");
    if (validRoutes.includes(routeGuess)) {
      return routeGuess;
    }
    return findBestRoute(context || routeGuess, validRoutes);
  }
  
  // Otherwise, prepend with / and check
  const asRoute = "/" + normalizedHref.replace(/\s+/g, "-");
  if (validRoutes.includes(asRoute)) {
    return asRoute;
  }
  
  // Fallback to context-based matching
  return findBestRoute(context, validRoutes);
}

/**
 * Recursively fix all links in an object
 */
function fixLinksInObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if this is a link field
    if (key.toLowerCase().includes("link") || key.toLowerCase().includes("href") || key.toLowerCase().includes("url")) {
      if (typeof value === "string") {
        result[key] = fixLink(value, String(obj.label || obj.text || obj.title || obj.ctaText || ""));
      } else {
        result[key] = value;
      }
    } else if (Array.isArray(value)) {
      // Recursively fix arrays
      result[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return fixLinksInObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      // Recursively fix nested objects
      result[key] = fixLinksInObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

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

  // First, fix all links in the props
  const fixedProps = fixLinksInObject(genComponent.props || {});
  
  // Transform props to match Studio component expectations
  const studioProps = transformPropsForStudio(studioType, fixedProps);

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
 * - Valid links (no placeholders!)
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
    const ctaText = String(props.ctaText || props.buttonText || props.primaryButtonText || "Get Started");
    
    return {
      // Content
      title: props.headline || props.title || "Welcome",
      subtitle: props.subheadline || props.subtitle || props.description || "",
      
      // CTA Buttons - ALWAYS use fixLink to ensure valid routes
      primaryButtonText: ctaText,
      primaryButtonLink: fixLink(
        String(props.ctaLink || props.buttonLink || props.primaryButtonLink || ""),
        ctaText
      ),
      primaryButtonColor: props.primaryButtonColor || props.ctaColor || "#3b82f6",
      primaryButtonTextColor: props.primaryButtonTextColor || "#ffffff",
      primaryButtonStyle: props.primaryButtonStyle || "solid",
      primaryButtonSize: props.primaryButtonSize || "lg",
      primaryButtonRadius: props.primaryButtonRadius || "md",
      
      secondaryButtonText: props.secondaryButtonText || props.secondaryCtaText || "",
      secondaryButtonLink: fixLink(
        String(props.secondaryButtonLink || props.secondaryCtaLink || ""),
        String(props.secondaryButtonText || "")
      ),
      
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
    const ctaText = String(props.ctaText || props.buttonText || "Get Started");
    
    return {
      // Logo
      logoText: props.logoText || props.brandName || "Brand",
      logo: props.logo || props.logoImage || "",
      logoLink: "/",
      logoHeight: props.logoHeight || 40,
      
      // Links - ensure they're properly formatted with valid routes
      links: Array.isArray(links) ? links.map((link: Record<string, unknown>) => ({
        label: link.label || link.text || link.name || "",
        href: fixLink(String(link.href || link.url || link.link || ""), String(link.label || link.text || "")),
        target: link.target || "_self",
      })) : [],
      
      // CTA - ALWAYS use fixLink
      ctaText,
      ctaLink: fixLink(String(props.ctaLink || props.buttonLink || ""), ctaText),
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
    const ctaText = String(props.ctaText || props.buttonText || "Get Started");
    return {
      headline: props.headline || props.title || "Ready to Get Started?",
      description: props.description || props.subtitle || "",
      ctaText,
      ctaLink: fixLink(String(props.ctaLink || props.buttonLink || ""), ctaText),
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
      
      // Link columns - FIX: Apply fixLink to all footer links
      columns: Array.isArray(linkColumns) ? linkColumns.map((col: Record<string, unknown>, i: number) => ({
        title: col.title || col.heading || `Column ${i + 1}`,
        links: Array.isArray(col.links) ? col.links.map((link: Record<string, unknown>) => {
          const label = String(link.label || link.text || link.name || "");
          return {
            label,
            href: fixLink(String(link.href || link.url || ""), label),
          };
        }) : [],
      })) : [],
      
      // Social links (external URLs - don't fix)
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
      plans: Array.isArray(plans) ? plans.map((p: Record<string, unknown>, i: number) => {
        const ctaText = String(p.ctaText || p.buttonText || "Get Started");
        return {
          id: String(i + 1),
          name: p.name || p.title || `Plan ${i + 1}`,
          price: p.price || "0",
          currency: p.currency || "ZMW",
          period: p.period || "month",
          features: p.features || [],
          ctaText,
          ctaLink: fixLink(String(p.ctaLink || p.buttonLink || ""), ctaText),
          highlighted: p.highlighted || p.featured || false,
        };
      }) : [],
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
