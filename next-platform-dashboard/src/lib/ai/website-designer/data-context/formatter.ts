/**
 * PHASE AWD-02: Data Context System
 * Data Context Formatter
 * 
 * Converts BusinessDataContext into AI-friendly formatted text
 * that provides comprehensive knowledge for content generation.
 */

import type {
  BusinessDataContext,
  SiteData,
  BrandingData,
  ClientData,
  ContactData,
  SocialLink,
  BusinessHours,
  Location,
  TeamMember,
  Service,
  PortfolioItem,
  Testimonial,
  BlogPost,
  FAQItem,
  EnabledModule,
} from "./types";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'

// =============================================================================
// MAIN FORMATTER
// =============================================================================

/**
 * Format complete business data context for AI consumption
 * Returns a structured markdown document with all available information
 */
export function formatContextForAI(context: BusinessDataContext): string {
  const sections: string[] = [];

  // Always include header
  sections.push(formatHeader(context.site, context.client));

  // Brand identity section
  if (context.branding && Object.keys(context.branding).length > 0) {
    sections.push(formatBrandingSection(context.branding));
  }

  // Contact information
  if (context.contact && hasContactInfo(context.contact)) {
    sections.push(formatContactSection(context.contact));
  }

  // Social media
  if (context.social?.length > 0) {
    sections.push(formatSocialSection(context.social));
  }

  // Business hours
  if (context.hours?.length > 0) {
    sections.push(formatHoursSection(context.hours));
  }

  // Locations
  if (context.locations?.length > 0) {
    sections.push(formatLocationsSection(context.locations));
  }

  // Team members
  if (context.team?.length > 0) {
    sections.push(formatTeamSection(context.team));
  }

  // Services
  if (context.services?.length > 0) {
    sections.push(formatServicesSection(context.services));
  }

  // Testimonials
  if (context.testimonials?.length > 0) {
    sections.push(formatTestimonialsSection(context.testimonials));
  }

  // Portfolio
  if (context.portfolio?.length > 0) {
    sections.push(formatPortfolioSection(context.portfolio));
  }

  // FAQ
  if (context.faq?.length > 0) {
    sections.push(formatFAQSection(context.faq));
  }

  // Blog
  if (context.blog?.length > 0) {
    sections.push(formatBlogSection(context.blog));
  }

  // Enabled modules
  if (context.modules?.length > 0) {
    sections.push(formatModulesSection(context.modules));
  }

  return sections.filter(Boolean).join("\n\n---\n\n");
}

// =============================================================================
// SECTION FORMATTERS
// =============================================================================

/**
 * Format header with business identity
 */
function formatHeader(site: SiteData, client: ClientData): string {
  const lines: string[] = ["# Business Data Context"];
  
  lines.push("");
  lines.push("## Business Identity");
  
  if (site.name) {
    lines.push(`- **Business Name:** ${site.name}`);
  }
  
  if (client.company_name && client.company_name !== site.name) {
    lines.push(`- **Company Name:** ${client.company_name}`);
  }
  
  if (site.domain) {
    lines.push(`- **Domain:** ${site.domain}`);
  }
  
  if (client.industry) {
    lines.push(`- **Industry:** ${client.industry}`);
  }
  
  if (site.description || client.description) {
    lines.push(`- **Description:** ${site.description || client.description}`);
  }
  
  if (client.tagline) {
    lines.push(`- **Tagline:** ${client.tagline}`);
  }
  
  if (client.mission) {
    lines.push(`- **Mission:** ${client.mission}`);
  }
  
  if (client.vision) {
    lines.push(`- **Vision:** ${client.vision}`);
  }
  
  if (client.values) {
    const values = Array.isArray(client.values) ? client.values.join(", ") : client.values;
    lines.push(`- **Values:** ${values}`);
  }
  
  if (client.founded_year) {
    lines.push(`- **Founded:** ${client.founded_year}`);
  }

  return lines.join("\n");
}

/**
 * Format branding information
 */
function formatBrandingSection(branding: BrandingData): string {
  const lines: string[] = ["## Brand Identity"];

  // Colors — CRITICAL: AI must use these when provided
  if (branding.primary_color || branding.secondary_color || branding.accent_color) {
    lines.push("");
    lines.push("### Color Palette (MANDATORY — use these exact colors in designTokens)");
    if (branding.primary_color) {
      lines.push(`- **Primary Color:** ${branding.primary_color} ← USE THIS as designTokens.primaryColor`);
    }
    if (branding.secondary_color) {
      lines.push(`- **Secondary Color:** ${branding.secondary_color} ← USE THIS as designTokens.secondaryColor`);
    }
    if (branding.accent_color) {
      lines.push(`- **Accent Color:** ${branding.accent_color} ← USE THIS as designTokens.accentColor`);
    }
    if (branding.background_color) {
      lines.push(`- **Background Color:** ${branding.background_color} ← USE THIS as designTokens.backgroundColor`);
    }
    if (branding.text_color) {
      lines.push(`- **Text Color:** ${branding.text_color} ← USE THIS as designTokens.textColor`);
    }
  }

  // Typography
  if (branding.heading_font || branding.body_font) {
    lines.push("");
    lines.push("### Typography");
    if (branding.heading_font) {
      lines.push(`- **Heading Font:** ${branding.heading_font}`);
    }
    if (branding.body_font) {
      lines.push(`- **Body Font:** ${branding.body_font}`);
    }
    if (branding.font_scale) {
      lines.push(`- **Font Scale:** ${branding.font_scale}`);
    }
  }

  // Logo
  if (branding.logo_url || branding.logo_dark_url) {
    lines.push("");
    lines.push("### Logo");
    if (branding.logo_url) {
      lines.push(`- **Logo:** Available`);
    }
    if (branding.logo_dark_url) {
      lines.push(`- **Dark Mode Logo:** Available`);
    }
    if (branding.favicon_url) {
      lines.push(`- **Favicon:** Available`);
    }
  }

  // Design preferences
  if (branding.border_radius || branding.shadow_style) {
    lines.push("");
    lines.push("### Design Preferences");
    if (branding.border_radius) {
      lines.push(`- **Border Radius:** ${branding.border_radius}`);
    }
    if (branding.shadow_style) {
      lines.push(`- **Shadow Style:** ${branding.shadow_style}`);
    }
    if (branding.spacing_scale) {
      lines.push(`- **Spacing Scale:** ${branding.spacing_scale}`);
    }
  }

  // Brand voice
  if (branding.brand_voice || branding.tone) {
    lines.push("");
    lines.push("### Brand Voice");
    if (branding.brand_voice) {
      lines.push(`- **Voice:** ${branding.brand_voice}`);
    }
    if (branding.tone) {
      lines.push(`- **Tone:** ${branding.tone}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format contact information
 */
function formatContactSection(contact: ContactData): string {
  const lines: string[] = ["## Contact Information"];

  if (contact.email) {
    lines.push(`- **Email:** ${contact.email}`);
  }

  if (contact.phone) {
    lines.push(`- **Phone:** ${contact.phone}`);
  }

  if (contact.address) {
    const addr = contact.address;
    const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
    if (parts.length > 0) {
      lines.push(`- **Address:** ${parts.join(", ")}`);
    }
  }

  if (contact.mapCoordinates) {
    lines.push(`- **Location:** Available for maps`);
  }

  return lines.join("\n");
}

/**
 * Format social media links
 */
function formatSocialSection(social: SocialLink[]): string {
  const lines: string[] = ["## Social Media Profiles"];

  for (const link of social) {
    if (link.platform && link.url) {
      const label = link.label || link.platform;
      lines.push(`- **${capitalize(link.platform)}:** [${label}](${link.url})`);
    }
  }

  return lines.join("\n");
}

/**
 * Format business hours
 */
function formatHoursSection(hours: BusinessHours[]): string {
  const lines: string[] = ["## Business Hours"];

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const sortedHours = [...hours].sort(
    (a, b) => dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase())
  );

  for (const h of sortedHours) {
    if (h.is_closed) {
      lines.push(`- **${capitalize(h.day)}:** Closed`);
    } else if (h.is_24_hours) {
      lines.push(`- **${capitalize(h.day)}:** 24 Hours`);
    } else if (h.open_time && h.close_time) {
      lines.push(`- **${capitalize(h.day)}:** ${h.open_time} - ${h.close_time}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format locations
 */
function formatLocationsSection(locations: Location[]): string {
  const lines: string[] = ["## Locations"];

  for (const loc of locations) {
    const name = loc.name || (loc.is_primary ? "Main Location" : "Location");
    lines.push("");
    lines.push(`### ${name}`);
    
    const addrParts = [loc.address, loc.city, loc.state, loc.zip, loc.country].filter(Boolean);
    if (addrParts.length > 0) {
      lines.push(`- **Address:** ${addrParts.join(", ")}`);
    }
    if (loc.phone) {
      lines.push(`- **Phone:** ${loc.phone}`);
    }
    if (loc.email) {
      lines.push(`- **Email:** ${loc.email}`);
    }
    if (loc.is_primary) {
      lines.push(`- **Type:** Primary Location`);
    }
  }

  return lines.join("\n");
}

/**
 * Format team members
 */
function formatTeamSection(team: TeamMember[]): string {
  const lines: string[] = ["## Team Members"];

  for (const member of team) {
    lines.push("");
    lines.push(`### ${member.name}`);
    
    if (member.role || member.title) {
      lines.push(`- **Role:** ${member.role || member.title}`);
    }
    if (member.department) {
      lines.push(`- **Department:** ${member.department}`);
    }
    if (member.bio) {
      lines.push(`- **Bio:** ${truncate(member.bio, 200)}`);
    }
    if (member.email) {
      lines.push(`- **Email:** ${member.email}`);
    }
    if (member.phone) {
      lines.push(`- **Phone:** ${member.phone}`);
    }
    if (member.qualifications?.length) {
      lines.push(`- **Qualifications:** ${member.qualifications.join(", ")}`);
    }
    if (member.social_links) {
      const socials = Object.entries(member.social_links)
        .filter(([, v]) => v)
        .map(([k]) => capitalize(k))
        .join(", ");
      if (socials) {
        lines.push(`- **Social:** ${socials}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format services
 */
function formatServicesSection(services: Service[]): string {
  const lines: string[] = ["## Services Offered"];

  for (const service of services) {
    lines.push("");
    lines.push(`### ${service.name}`);
    
    if (service.description) {
      lines.push(truncate(service.description, 300));
    }
    if (service.price) {
      const priceStr = service.price_unit
        ? `${DEFAULT_CURRENCY_SYMBOL}${service.price}/${service.price_unit}`
        : `${DEFAULT_CURRENCY_SYMBOL}${service.price}`;
      lines.push(`- **Price:** ${priceStr}`);
    }
    if (service.duration) {
      lines.push(`- **Duration:** ${service.duration}`);
    }
    if (service.category) {
      lines.push(`- **Category:** ${service.category}`);
    }
    if (service.features?.length) {
      lines.push(`- **Features:** ${service.features.join(", ")}`);
    }
    if (service.is_featured) {
      lines.push(`- **Featured Service:** Yes`);
    }
  }

  return lines.join("\n");
}

/**
 * Format testimonials
 */
function formatTestimonialsSection(testimonials: Testimonial[]): string {
  const lines: string[] = ["## Customer Testimonials"];
  lines.push(`*${testimonials.length} testimonials available*`);

  // Show up to 5 in detail
  const featured = testimonials.slice(0, 5);
  
  for (const t of featured) {
    lines.push("");
    lines.push(`> "${truncate(t.content, 200)}"`);
    
    const attribution = [t.author_name, t.author_title, t.company]
      .filter(Boolean)
      .join(", ");
    if (attribution) {
      lines.push(`> — ${attribution}`);
    }
    if (t.rating) {
      lines.push(`> Rating: ${"★".repeat(t.rating)}${"☆".repeat(5 - t.rating)}`);
    }
  }

  if (testimonials.length > 5) {
    lines.push("");
    lines.push(`*...and ${testimonials.length - 5} more testimonials*`);
  }

  return lines.join("\n");
}

/**
 * Format portfolio items
 */
function formatPortfolioSection(portfolio: PortfolioItem[]): string {
  const lines: string[] = ["## Portfolio / Projects"];
  lines.push(`*${portfolio.length} projects available*`);

  for (const item of portfolio.slice(0, 8)) {
    lines.push("");
    lines.push(`### ${item.title}`);
    
    if (item.description) {
      lines.push(truncate(item.description, 200));
    }
    if (item.client) {
      lines.push(`- **Client:** ${item.client}`);
    }
    if (item.category) {
      lines.push(`- **Category:** ${item.category}`);
    }
    if (item.technologies?.length) {
      lines.push(`- **Technologies:** ${item.technologies.join(", ")}`);
    }
    if (item.completed_date) {
      lines.push(`- **Completed:** ${item.completed_date}`);
    }
    if (item.is_featured) {
      lines.push(`- **Featured:** Yes`);
    }
  }

  if (portfolio.length > 8) {
    lines.push("");
    lines.push(`*...and ${portfolio.length - 8} more projects*`);
  }

  return lines.join("\n");
}

/**
 * Format FAQ items
 */
function formatFAQSection(faq: FAQItem[]): string {
  const lines: string[] = ["## Frequently Asked Questions"];
  lines.push(`*${faq.length} FAQ items available*`);

  for (const item of faq) {
    lines.push("");
    lines.push(`**Q: ${item.question}**`);
    lines.push(`A: ${truncate(item.answer, 300)}`);
    if (item.category) {
      lines.push(`*Category: ${item.category}*`);
    }
  }

  return lines.join("\n");
}

/**
 * Format blog posts
 */
function formatBlogSection(blog: BlogPost[]): string {
  const lines: string[] = ["## Recent Blog Posts"];
  lines.push(`*${blog.length} posts available*`);

  for (const post of blog.slice(0, 5)) {
    lines.push("");
    lines.push(`### ${post.title}`);
    
    if (post.excerpt) {
      lines.push(truncate(post.excerpt, 200));
    }
    if (post.category) {
      lines.push(`- **Category:** ${post.category}`);
    }
    if (post.author) {
      lines.push(`- **Author:** ${post.author}`);
    }
    if (post.published_at) {
      lines.push(`- **Published:** ${formatDate(post.published_at)}`);
    }
  }

  if (blog.length > 5) {
    lines.push("");
    lines.push(`*...and ${blog.length - 5} more posts*`);
  }

  return lines.join("\n");
}

/**
 * Format enabled modules
 */
function formatModulesSection(modules: EnabledModule[]): string {
  const lines: string[] = ["## Enabled Features & Modules"];

  const moduleList = modules.map((m) => m.module_name || m.module_type || m.name).filter(Boolean);
  
  if (moduleList.length > 0) {
    lines.push(`The website has the following features enabled: ${moduleList.join(", ")}`);
    lines.push("");
    
    // Give AI actionable instructions for each module type
    for (const mod of modules) {
      const modType = (mod.module_type || mod.module_name || mod.name || "").toLowerCase();
      
      if (modType.includes("booking") || modType.includes("appointment")) {
        lines.push(`### BOOKING MODULE IS ACTIVE`);
        lines.push(`This is a booking-enabled business. You MUST include booking functionality:`);
        lines.push(`- Use "BookingWidget" component on the homepage (shows available appointment slots)`);
        lines.push(`- Use "BookingServiceSelector" on the services page (lets users pick a service to book)`);
        lines.push(`- Make CTA buttons say "Book Now" / "Book Appointment" and link to /contact or a booking page`);
        lines.push(`- Consider adding a dedicated /book page with a BookingForm component`);
        lines.push(`- Every page should have at least one booking CTA`);
        lines.push(``);
      }
      
      if (modType.includes("ecommerce") || modType.includes("commerce") || modType.includes("shop")) {
        lines.push(`### E-COMMERCE MODULE IS ACTIVE`);
        lines.push(`This is a shopping-enabled business. You MUST include product functionality:`);
        lines.push(`- Use "EcommerceFeaturedProducts" on the homepage to showcase featured/new/bestselling products`);
        lines.push(`- Use "EcommerceProductGrid" or "EcommerceProductCatalog" on a /shop or /products page`);
        lines.push(`- Use "EcommerceCategoryNav" for product category navigation on shop pages`);
        lines.push(`- Use "EcommerceSearchBar" at the top of catalog pages for product search`);
        lines.push(`- Use "EcommerceFilterSidebar" alongside product grids for filtering`);
        lines.push(`- Use "EcommerceReviewList" and "EcommerceReviewForm" on product pages for social proof`);
        lines.push(`- Use "ProductDetailBlock" for individual product detail pages`);
        lines.push(`- Make CTA buttons say "Shop Now" / "Browse Products"`);
        lines.push(`- Consider adding /shop, /products, and /cart pages`);
        lines.push(`- Include product-related sections on the homepage`);
        lines.push(``);
      }
    }
  }

  return lines.join("\n");
}

// =============================================================================
// SPECIALIZED FORMATTERS
// =============================================================================

/**
 * Format context specifically for component content generation
 */
export function formatForComponentContent(
  context: BusinessDataContext,
  componentType: string
): string {
  const sections: string[] = [];

  // Always include basic identity
  sections.push(formatHeader(context.site, context.client));

  // Add relevant sections based on component type
  switch (componentType.toLowerCase()) {
    case "hero":
    case "cta":
    case "header":
      if (context.branding) sections.push(formatBrandingSection(context.branding));
      if (context.contact) sections.push(formatContactSection(context.contact));
      break;

    case "team":
    case "about":
      if (context.team?.length) sections.push(formatTeamSection(context.team));
      break;

    case "services":
    case "pricing":
    case "features":
      if (context.services?.length) sections.push(formatServicesSection(context.services));
      break;

    case "testimonials":
    case "reviews":
      if (context.testimonials?.length)
        sections.push(formatTestimonialsSection(context.testimonials));
      break;

    case "portfolio":
    case "gallery":
    case "projects":
      if (context.portfolio?.length) sections.push(formatPortfolioSection(context.portfolio));
      break;

    case "contact":
    case "footer":
      if (context.contact) sections.push(formatContactSection(context.contact));
      if (context.social?.length) sections.push(formatSocialSection(context.social));
      if (context.hours?.length) sections.push(formatHoursSection(context.hours));
      if (context.locations?.length) sections.push(formatLocationsSection(context.locations));
      break;

    case "faq":
      if (context.faq?.length) sections.push(formatFAQSection(context.faq));
      break;

    case "blog":
    case "news":
      if (context.blog?.length) sections.push(formatBlogSection(context.blog));
      break;

    default:
      // For unknown components, include common sections
      if (context.branding) sections.push(formatBrandingSection(context.branding));
      if (context.services?.length) sections.push(formatServicesSection(context.services));
  }

  return sections.filter(Boolean).join("\n\n---\n\n");
}

/**
 * Format a compact summary for quick AI reference
 */
export function formatCompactSummary(context: BusinessDataContext): string {
  const lines: string[] = [];

  lines.push(`Business: ${context.site.name || "Unknown"}`);
  
  if (context.client.industry) {
    lines.push(`Industry: ${context.client.industry}`);
  }
  
  if (context.client.tagline) {
    lines.push(`Tagline: ${context.client.tagline}`);
  }
  
  if (context.branding?.primary_color) {
    lines.push(`Brand Colors: ${context.branding.primary_color}, ${context.branding.secondary_color || "N/A"}`);
  }
  
  if (context.services?.length) {
    lines.push(`Services: ${context.services.length} available`);
  }
  
  if (context.team?.length) {
    lines.push(`Team: ${context.team.length} members`);
  }
  
  if (context.testimonials?.length) {
    lines.push(`Testimonials: ${context.testimonials.length} available`);
  }

  return lines.join(" | ");
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Check if contact data has any info
 */
function hasContactInfo(contact: ContactData): boolean {
  return !!(
    contact.email ||
    contact.phone ||
    (contact.address && Object.values(contact.address).some(Boolean))
  );
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Format date string
 */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
