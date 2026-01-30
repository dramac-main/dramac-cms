/**
 * Component Mapping
 * 
 * Maps Craft.js component types to Puck component types.
 * Includes prop transformers for converting props between formats.
 */

import type { ComponentMapping } from "./types";

/**
 * Default component mappings from Craft.js to Puck.
 * Each entry defines how to convert a Craft.js component to its Puck equivalent.
 */
export const defaultComponentMappings: ComponentMapping[] = [
  // Layout Components
  {
    craftType: "Section",
    puckType: "Section",
    propsTransform: (props) => ({
      backgroundColor: props.backgroundColor,
      backgroundImage: props.backgroundImage,
      padding: props.padding || "md",
      fullWidth: props.fullWidth || false,
    }),
  },
  {
    craftType: "Container",
    puckType: "Container",
    propsTransform: (props) => ({
      maxWidth: props.maxWidth || "lg",
      padding: props.padding || "md",
      centered: props.centered !== false,
    }),
  },
  {
    craftType: "Columns",
    puckType: "Columns",
    propsTransform: (props) => ({
      columns: props.columns || 2,
      gap: props.gap || "md",
      alignment: props.alignment || "stretch",
      stackOnMobile: props.stackOnMobile !== false,
    }),
  },
  {
    craftType: "Card",
    puckType: "Card",
    propsTransform: (props) => ({
      padding: props.padding || "md",
      shadow: props.shadow || "md",
      borderRadius: props.borderRadius || "md",
      backgroundColor: props.backgroundColor,
    }),
  },
  {
    craftType: "Spacer",
    puckType: "Spacer",
    propsTransform: (props) => ({
      size: props.size || "md",
    }),
  },
  {
    craftType: "Divider",
    puckType: "Divider",
    propsTransform: (props) => ({
      style: props.style || "solid",
      color: props.color,
      thickness: props.thickness || "1",
    }),
  },

  // Typography Components
  {
    craftType: "Heading",
    puckType: "Heading",
    propsTransform: (props) => ({
      text: props.text || props.children || "",
      level: props.level || "h2",
      align: props.align || "left",
      color: props.color,
    }),
  },
  {
    craftType: "Text",
    puckType: "Text",
    propsTransform: (props) => ({
      content: props.text || props.content || props.children || "",
      size: props.size || "base",
      align: props.align || "left",
      color: props.color,
    }),
  },
  {
    craftType: "RichText",
    puckType: "Text",
    propsTransform: (props) => ({
      content: props.html || props.content || "",
      size: props.size || "base",
      align: props.align || "left",
    }),
  },

  // Button Components
  {
    craftType: "Button",
    puckType: "Button",
    propsTransform: (props) => ({
      text: props.text || props.children || "Button",
      href: props.href || props.link || "#",
      variant: mapButtonVariant(props.variant as string),
      size: props.size || "md",
      fullWidth: props.fullWidth || false,
      openInNewTab: props.openInNewTab || props.newTab || false,
    }),
  },
  {
    craftType: "LinkButton",
    puckType: "Button",
    propsTransform: (props) => ({
      text: props.text || props.label || "Link",
      href: props.href || props.url || "#",
      variant: "link",
      size: props.size || "md",
    }),
  },

  // Media Components
  {
    craftType: "Image",
    puckType: "Image",
    propsTransform: (props) => ({
      src: props.src || props.url || "",
      alt: props.alt || "",
      width: props.width,
      height: props.height,
      objectFit: props.objectFit || "cover",
      borderRadius: props.borderRadius || "none",
    }),
  },
  {
    craftType: "Video",
    puckType: "Video",
    propsTransform: (props) => ({
      url: props.url || props.src || "",
      type: detectVideoType(props.url as string || props.src as string),
      autoplay: props.autoplay || false,
      muted: props.muted || false,
      loop: props.loop || false,
      controls: props.controls !== false,
    }),
  },
  {
    craftType: "Map",
    puckType: "Map",
    propsTransform: (props) => ({
      address: props.address || props.location || "",
      zoom: props.zoom || 14,
      height: props.height || "400",
    }),
  },

  // Section Components
  {
    craftType: "Hero",
    puckType: "Hero",
    propsTransform: (props) => ({
      title: props.title || props.heading || "",
      subtitle: props.subtitle || props.description || "",
      backgroundImage: props.backgroundImage || props.bgImage || "",
      backgroundColor: props.backgroundColor,
      alignment: props.alignment || props.align || "center",
      height: props.height || "lg",
      overlayOpacity: props.overlayOpacity || 50,
      primaryButton: transformButton(props.primaryButton || props.cta),
      secondaryButton: transformButton(props.secondaryButton),
    }),
  },
  {
    craftType: "Features",
    puckType: "Features",
    propsTransform: (props) => ({
      title: props.title || "",
      subtitle: props.subtitle || "",
      columns: props.columns || 3,
      features: transformFeatures(props.features || props.items),
    }),
  },
  {
    craftType: "CTA",
    puckType: "CTA",
    propsTransform: (props) => ({
      title: props.title || props.heading || "",
      description: props.description || props.text || "",
      primaryButton: transformButton(props.primaryButton || props.button),
      secondaryButton: transformButton(props.secondaryButton),
      backgroundColor: props.backgroundColor,
      alignment: props.alignment || "center",
    }),
  },
  {
    craftType: "Testimonials",
    puckType: "Testimonials",
    propsTransform: (props) => ({
      title: props.title || "",
      testimonials: transformTestimonials(props.testimonials || props.items),
      layout: props.layout || "grid",
    }),
  },
  {
    craftType: "FAQ",
    puckType: "FAQ",
    propsTransform: (props) => ({
      title: props.title || "",
      items: transformFAQItems(props.items || props.faqs),
    }),
  },
  {
    craftType: "Stats",
    puckType: "Stats",
    propsTransform: (props) => ({
      title: props.title || "",
      stats: transformStats(props.stats || props.items),
      columns: props.columns || 4,
      backgroundColor: props.backgroundColor,
    }),
  },
  {
    craftType: "Team",
    puckType: "Team",
    propsTransform: (props) => ({
      title: props.title || "",
      subtitle: props.subtitle || "",
      members: transformTeamMembers(props.members || props.team),
      columns: props.columns || 4,
    }),
  },
  {
    craftType: "Gallery",
    puckType: "Gallery",
    propsTransform: (props) => ({
      images: transformGalleryImages(props.images || props.items),
      columns: props.columns || 4,
      gap: props.gap || "md",
      lightbox: props.lightbox !== false,
    }),
  },

  // Navigation Components
  {
    craftType: "Navbar",
    puckType: "Navbar",
    propsTransform: (props) => ({
      logo: props.logo || props.logoUrl || "",
      logoText: props.logoText || props.brandName || "LOGO",
      links: transformNavLinks(props.links || props.menuItems),
      sticky: props.sticky || false,
      backgroundColor: props.backgroundColor,
      textColor: props.textColor,
      ctaButton: transformButton(props.ctaButton || props.cta),
    }),
  },
  {
    craftType: "Footer",
    puckType: "Footer",
    propsTransform: (props) => ({
      logo: props.logo || "",
      description: props.description || props.tagline || "",
      columns: transformFooterColumns(props.columns || props.linkColumns),
      socialLinks: transformSocialLinks(props.socialLinks || props.social),
      copyright: props.copyright || "",
      backgroundColor: props.backgroundColor,
      textColor: props.textColor,
    }),
  },
  {
    craftType: "SocialLinks",
    puckType: "SocialLinks",
    propsTransform: (props) => ({
      links: transformSocialLinks(props.links || props.items),
      size: props.size || "md",
      color: props.color,
      style: props.style || "filled",
    }),
  },

  // Form Components
  {
    craftType: "Form",
    puckType: "Form",
    propsTransform: (props) => ({
      submitText: props.submitText || props.buttonText || "Submit",
      successMessage: props.successMessage || "Form submitted successfully!",
      buttonVariant: props.buttonVariant || "default",
      buttonFullWidth: props.buttonFullWidth || false,
    }),
  },
  {
    craftType: "FormField",
    puckType: "FormField",
    propsTransform: (props) => ({
      label: props.label || "",
      name: props.name || props.fieldName || "",
      type: props.type || props.fieldType || "text",
      placeholder: props.placeholder || "",
      required: props.required || false,
      options: transformSelectOptions(props.options),
      helpText: props.helpText || props.hint || "",
      width: props.width || "full",
    }),
  },
  {
    craftType: "ContactForm",
    puckType: "ContactForm",
    propsTransform: (props) => ({
      title: props.title || "Get in Touch",
      description: props.description || "",
      fields: props.fields || ["name", "email", "message"],
      submitText: props.submitText || "Send Message",
      backgroundColor: props.backgroundColor,
      showIcons: props.showIcons !== false,
    }),
  },
  {
    craftType: "Newsletter",
    puckType: "Newsletter",
    propsTransform: (props) => ({
      title: props.title || "Subscribe to our newsletter",
      description: props.description || "",
      placeholder: props.placeholder || "Enter your email",
      buttonText: props.buttonText || props.submitText || "Subscribe",
      layout: props.layout || "inline",
      backgroundColor: props.backgroundColor,
    }),
  },

  // E-commerce Components
  {
    craftType: "ProductGrid",
    puckType: "ProductGrid",
    propsTransform: (props) => ({
      columns: props.columns || 4,
      gap: props.gap || "md",
      products: transformProducts(props.products || props.items),
      showPrices: props.showPrices !== false,
      showRatings: props.showRatings !== false,
      showAddToCart: props.showAddToCart !== false,
    }),
  },
  {
    craftType: "ProductCard",
    puckType: "ProductCard",
    propsTransform: (props) => ({
      name: props.name || props.title || "Product Name",
      image: props.image || props.imageUrl || "",
      price: props.price || 0,
      salePrice: props.salePrice,
      description: props.description || "",
      rating: props.rating,
      href: props.href || props.link || "#",
      showQuickView: props.showQuickView !== false,
      showWishlist: props.showWishlist !== false,
    }),
  },
];

// Helper functions for prop transformation

function mapButtonVariant(variant?: string): string {
  const variantMap: Record<string, string> = {
    primary: "default",
    default: "default",
    secondary: "secondary",
    outline: "outline",
    ghost: "ghost",
    link: "link",
    destructive: "destructive",
  };
  return variantMap[variant || "default"] || "default";
}

function detectVideoType(url?: string): "youtube" | "vimeo" | "file" {
  if (!url) return "file";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "file";
}

function transformButton(btn: unknown): { text: string; href: string } | undefined {
  if (!btn || typeof btn !== "object") return undefined;
  const button = btn as Record<string, unknown>;
  if (!button.text && !button.label) return undefined;
  return {
    text: (button.text || button.label || "Button") as string,
    href: (button.href || button.link || button.url || "#") as string,
  };
}

function transformFeatures(features: unknown): Array<{ icon: string; title: string; description: string }> {
  if (!Array.isArray(features)) return [];
  return features.map((f: unknown) => {
    const feature = f as Record<string, unknown>;
    return {
      icon: (feature.icon || "Star") as string,
      title: (feature.title || feature.heading || "") as string,
      description: (feature.description || feature.text || "") as string,
    };
  });
}

function transformTestimonials(testimonials: unknown): Array<{ quote: string; author: string; role: string; avatar: string }> {
  if (!Array.isArray(testimonials)) return [];
  return testimonials.map((t: unknown) => {
    const testimonial = t as Record<string, unknown>;
    return {
      quote: (testimonial.quote || testimonial.text || testimonial.content || "") as string,
      author: (testimonial.author || testimonial.name || "") as string,
      role: (testimonial.role || testimonial.title || testimonial.position || "") as string,
      avatar: (testimonial.avatar || testimonial.image || "") as string,
    };
  });
}

function transformFAQItems(items: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(items)) return [];
  return items.map((item: unknown) => {
    const faq = item as Record<string, unknown>;
    return {
      question: (faq.question || faq.q || faq.title || "") as string,
      answer: (faq.answer || faq.a || faq.content || "") as string,
    };
  });
}

function transformStats(stats: unknown): Array<{ value: string; label: string; prefix?: string; suffix?: string }> {
  if (!Array.isArray(stats)) return [];
  return stats.map((s: unknown) => {
    const stat = s as Record<string, unknown>;
    return {
      value: String(stat.value || stat.number || "0"),
      label: (stat.label || stat.title || "") as string,
      prefix: stat.prefix as string | undefined,
      suffix: stat.suffix as string | undefined,
    };
  });
}

function transformTeamMembers(members: unknown): Array<{ name: string; role: string; image: string; bio?: string }> {
  if (!Array.isArray(members)) return [];
  return members.map((m: unknown) => {
    const member = m as Record<string, unknown>;
    return {
      name: (member.name || "") as string,
      role: (member.role || member.title || member.position || "") as string,
      image: (member.image || member.photo || member.avatar || "") as string,
      bio: member.bio as string | undefined,
    };
  });
}

function transformGalleryImages(images: unknown): Array<{ src: string; alt: string; caption?: string }> {
  if (!Array.isArray(images)) return [];
  return images.map((img: unknown) => {
    if (typeof img === "string") {
      return { src: img, alt: "" };
    }
    const image = img as Record<string, unknown>;
    return {
      src: (image.src || image.url || "") as string,
      alt: (image.alt || "") as string,
      caption: image.caption as string | undefined,
    };
  });
}

function transformNavLinks(links: unknown): Array<{ text: string; href: string }> {
  if (!Array.isArray(links)) return [];
  return links.map((l: unknown) => {
    const link = l as Record<string, unknown>;
    return {
      text: (link.text || link.label || link.title || "") as string,
      href: (link.href || link.url || link.link || "#") as string,
    };
  });
}

function transformFooterColumns(columns: unknown): Array<{ title: string; links: Array<{ text: string; href: string }> }> {
  if (!Array.isArray(columns)) return [];
  return columns.map((col: unknown) => {
    const column = col as Record<string, unknown>;
    return {
      title: (column.title || column.heading || "") as string,
      links: transformNavLinks(column.links || column.items),
    };
  });
}

function transformSocialLinks(links: unknown): Array<{ platform: string; url: string }> {
  if (!Array.isArray(links)) return [];
  return links.map((l: unknown) => {
    const link = l as Record<string, unknown>;
    return {
      platform: (link.platform || link.type || link.name || "").toString().toLowerCase(),
      url: (link.url || link.href || link.link || "#") as string,
    };
  });
}

function transformSelectOptions(options: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(options)) return [];
  return options.map((opt: unknown) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    const option = opt as Record<string, unknown>;
    return {
      value: (option.value || option.id || "") as string,
      label: (option.label || option.text || option.name || "") as string,
    };
  });
}

function transformProducts(products: unknown): Array<{
  name: string;
  image?: string;
  price: number;
  salePrice?: number;
  description?: string;
  rating?: number;
  href?: string;
}> {
  if (!Array.isArray(products)) return [];
  return products.map((p: unknown) => {
    const product = p as Record<string, unknown>;
    return {
      name: (product.name || product.title || "") as string,
      image: product.image as string | undefined,
      price: Number(product.price) || 0,
      salePrice: product.salePrice ? Number(product.salePrice) : undefined,
      description: product.description as string | undefined,
      rating: product.rating ? Number(product.rating) : undefined,
      href: (product.href || product.link) as string | undefined,
    };
  });
}

/**
 * Get mapping for a Craft.js component type
 */
export function getMappingForType(craftType: string, customMappings?: ComponentMapping[]): ComponentMapping | undefined {
  // Check custom mappings first
  if (customMappings) {
    const customMapping = customMappings.find((m) => m.craftType === craftType);
    if (customMapping) return customMapping;
  }
  
  // Fall back to default mappings
  return defaultComponentMappings.find((m) => m.craftType === craftType);
}

/**
 * Get all supported Craft.js component types
 */
export function getSupportedCraftTypes(): string[] {
  return defaultComponentMappings.map((m) => m.craftType);
}
