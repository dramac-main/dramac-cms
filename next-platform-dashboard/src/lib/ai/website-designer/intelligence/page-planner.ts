/**
 * PHASE AWD-04: Component Selection Intelligence
 * Page Structure Planning
 *
 * Plans optimal page structures based on industry, content availability,
 * and user preferences.
 */

import type {
  RecommendedPage,
  RecommendedSection,
  PagePlanRecommendation,
  IndustryTemplate,
  DataAvailabilityFlags,
} from "./types";
import type { WebsiteDesignerPreferences } from "../types";
import { getIndustryTemplate, inferIndustry } from "./industry-templates";
import { selectBestComponent, buildDataAvailabilityFlags } from "./component-scorer";
import type { BusinessDataContext } from "../data-context/types";

// =============================================================================
// DEFAULT PAGE STRUCTURES
// =============================================================================

/**
 * Default sections for common page types
 */
const DEFAULT_PAGE_SECTIONS: Record<string, RecommendedSection[]> = {
  home: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Features"], contentNeeds: ["headline", "subheadline", "cta"], designNotes: "Full-width, high impact" },
    { intent: "features", componentType: "Features", alternativeComponents: ["Card"], contentNeeds: ["title", "features"], designNotes: "3-4 key features/benefits" },
    { intent: "testimonials", componentType: "Testimonials", alternativeComponents: ["SocialProof"], contentNeeds: ["testimonials"], designNotes: "Social proof section" },
    { intent: "cta", componentType: "CTA", alternativeComponents: ["Newsletter"], contentNeeds: ["headline", "cta"], designNotes: "Strong call to action" },
  ],
  about: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Card"], contentNeeds: ["headline", "description"], designNotes: "Company story intro" },
    { intent: "about", componentType: "RichText", alternativeComponents: ["Card"], contentNeeds: ["content"], designNotes: "Company history/values" },
    { intent: "team", componentType: "Team", alternativeComponents: ["Card"], contentNeeds: ["team"], designNotes: "Meet the team" },
    { intent: "stats", componentType: "Stats", alternativeComponents: ["Features"], contentNeeds: ["stats"], designNotes: "Key achievements" },
  ],
  services: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Features"], contentNeeds: ["headline"], designNotes: "Services overview" },
    { intent: "services", componentType: "Features", alternativeComponents: ["Card"], contentNeeds: ["services"], designNotes: "Service cards" },
    { intent: "process", componentType: "Features", alternativeComponents: ["Accordion"], contentNeeds: ["process"], designNotes: "How it works" },
    { intent: "cta", componentType: "CTA", alternativeComponents: ["ContactForm"], contentNeeds: ["cta"], designNotes: "Get started CTA" },
  ],
  contact: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Card"], contentNeeds: ["headline"], designNotes: "Contact intro" },
    { intent: "contact", componentType: "ContactForm", alternativeComponents: ["Form"], contentNeeds: ["form"], designNotes: "Contact form" },
    { intent: "location", componentType: "Map", alternativeComponents: ["Card"], contentNeeds: ["address", "map"], designNotes: "Location/map" },
    { intent: "hours", componentType: "Card", alternativeComponents: ["Stats"], contentNeeds: ["hours"], designNotes: "Business hours" },
  ],
  portfolio: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Card"], contentNeeds: ["headline"], designNotes: "Work showcase intro" },
    { intent: "gallery", componentType: "Gallery", alternativeComponents: ["Card"], contentNeeds: ["portfolio"], designNotes: "Project gallery" },
    { intent: "testimonials", componentType: "Testimonials", alternativeComponents: ["Quote"], contentNeeds: ["testimonials"], designNotes: "Client testimonials" },
    { intent: "cta", componentType: "CTA", alternativeComponents: ["ContactForm"], contentNeeds: ["cta"], designNotes: "Work together CTA" },
  ],
  pricing: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Card"], contentNeeds: ["headline"], designNotes: "Pricing intro" },
    { intent: "pricing", componentType: "Pricing", alternativeComponents: ["ComparisonTable"], contentNeeds: ["plans"], designNotes: "Pricing plans" },
    { intent: "faq", componentType: "FAQ", alternativeComponents: ["Accordion"], contentNeeds: ["faq"], designNotes: "Pricing FAQ" },
    { intent: "cta", componentType: "CTA", alternativeComponents: ["Newsletter"], contentNeeds: ["cta"], designNotes: "Start now CTA" },
  ],
  blog: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Card"], contentNeeds: ["headline"], designNotes: "Blog intro" },
    { intent: "blog", componentType: "Card", alternativeComponents: ["Gallery"], contentNeeds: ["posts"], designNotes: "Blog posts grid" },
    { intent: "newsletter", componentType: "Newsletter", alternativeComponents: ["CTA"], contentNeeds: ["newsletter"], designNotes: "Subscribe CTA" },
  ],
  faq: [
    { intent: "hero", componentType: "Hero", alternativeComponents: ["Card"], contentNeeds: ["headline"], designNotes: "FAQ intro" },
    { intent: "faq", componentType: "FAQ", alternativeComponents: ["Accordion"], contentNeeds: ["faq"], designNotes: "FAQ items" },
    { intent: "cta", componentType: "CTA", alternativeComponents: ["ContactForm"], contentNeeds: ["cta"], designNotes: "Still have questions CTA" },
  ],
};

// =============================================================================
// PAGE PLANNING
// =============================================================================

/**
 * Generate a complete page plan recommendation
 */
export function generatePagePlan(
  prompt: string,
  context: BusinessDataContext,
  preferences?: WebsiteDesignerPreferences
): PagePlanRecommendation {
  // Infer industry
  const industry = inferIndustry(prompt, context.client);
  const template = getIndustryTemplate(industry);
  const dataFlags = buildDataAvailabilityFlags(context);

  // Get recommended pages from template or use defaults
  const recommendedPages = template?.recommendedPages || [
    { name: "Home", slug: "/", priority: 1, required: true },
    { name: "About", slug: "/about", priority: 2, required: false },
    { name: "Services", slug: "/services", priority: 3, required: false },
    { name: "Contact", slug: "/contact", priority: 4, required: true },
  ];

  // Build full page plans
  const pages: RecommendedPage[] = recommendedPages.map((pageRec) => {
    const pageName = pageRec.name.toLowerCase().replace(/\s+/g, "-");
    const baseSections = DEFAULT_PAGE_SECTIONS[pageName] || DEFAULT_PAGE_SECTIONS.home;

    // Get industry-specific sections if available
    const industrySections = getIndustrySections(pageRec.name, template, dataFlags);

    // Merge and optimize sections
    const sections = optimizeSections(
      industrySections.length > 0 ? industrySections : baseSections,
      template,
      dataFlags,
      preferences
    );

    return {
      name: pageRec.name,
      slug: pageRec.slug,
      purpose: getPagePurpose(pageRec.name, industry),
      priority: pageRec.priority,
      required: pageRec.required,
      sections,
    };
  });

  // Build shared elements
  const sharedElements = buildSharedElements(template, dataFlags);

  return {
    industry,
    pages,
    sharedElements,
  };
}

/**
 * Get industry-specific sections for a page
 */
function getIndustrySections(
  pageName: string,
  template: IndustryTemplate | null,
  dataFlags: DataAvailabilityFlags
): RecommendedSection[] {
  if (!template) return [];

  const sections: RecommendedSection[] = [];
  const pageNameLower = pageName.toLowerCase();

  // Map page names to section intents
  const pageToIntents: Record<string, string[]> = {
    home: ["hero", "features", "testimonials", "trust", "cta"],
    about: ["hero", "about", "team", "stats"],
    services: ["hero", "services", "process", "cta"],
    contact: ["hero", "contact", "location", "hours"],
    portfolio: ["hero", "gallery", "testimonials", "cta"],
    work: ["hero", "gallery", "testimonials", "cta"],
    pricing: ["hero", "pricing", "faq", "cta"],
    team: ["hero", "team", "testimonials"],
    faq: ["hero", "faq", "cta"],
    menu: ["hero", "menu", "gallery", "cta"],
    listings: ["hero", "featured", "cta"],
    attorneys: ["hero", "team", "testimonials"],
  };

  const intents = pageToIntents[pageNameLower] || pageToIntents.home;

  for (const intent of intents) {
    const pref = template.componentPreferences.find((p) => p.section === intent);

    if (pref) {
      sections.push({
        intent,
        componentType: pref.preferred[0],
        alternativeComponents: pref.preferred.slice(1),
        contentNeeds: getContentNeedsForIntent(intent),
        designNotes: pref.variant ? `Use ${pref.variant} variant` : "",
      });
    } else {
      // Use default section
      const defaultSection = DEFAULT_PAGE_SECTIONS.home?.find((s) => s.intent === intent);
      if (defaultSection) {
        sections.push({ ...defaultSection });
      }
    }
  }

  return sections;
}

/**
 * Optimize sections based on data availability
 */
function optimizeSections(
  sections: RecommendedSection[],
  template: IndustryTemplate | null,
  dataFlags: DataAvailabilityFlags,
  preferences?: WebsiteDesignerPreferences
): RecommendedSection[] {
  const optimized: RecommendedSection[] = [];

  for (const section of sections) {
    // Check if we have data for this section
    const hasData = checkSectionDataAvailability(section.intent, dataFlags);

    // Select best component considering data availability
    const scoringContext = {
      sectionIntent: section.intent,
      industryTemplate: template,
      dataAvailability: dataFlags,
      userPreferences: preferences,
      existingComponents: optimized.map((s) => s.componentType),
    };

    const best = selectBestComponent(section.intent, scoringContext, [
      section.componentType,
      ...section.alternativeComponents,
    ]);

    optimized.push({
      ...section,
      componentType: best.componentType,
      alternativeComponents: section.alternativeComponents.filter((c) => c !== best.componentType),
      designNotes: hasData
        ? section.designNotes
        : `${section.designNotes} (will use generated content)`,
    });
  }

  return optimized;
}

/**
 * Check if data is available for a section
 */
function checkSectionDataAvailability(intent: string, dataFlags: DataAvailabilityFlags): boolean {
  const intentToData: Record<string, keyof DataAvailabilityFlags> = {
    team: "hasTeam",
    testimonials: "hasTestimonials",
    faq: "hasFaq",
    gallery: "hasPortfolio",
    portfolio: "hasPortfolio",
    location: "hasLocations",
    trust: "hasLogo",
    services: "hasServices",
    features: "hasServices",
    social: "hasSocial",
    hours: "hasHours",
    blog: "hasBlog",
  };

  const dataKey = intentToData[intent];
  return dataKey ? dataFlags[dataKey] : true;
}

/**
 * Get content needs for a section intent
 */
function getContentNeedsForIntent(intent: string): string[] {
  const needs: Record<string, string[]> = {
    hero: ["headline", "subheadline", "cta_text", "background_image"],
    features: ["title", "feature_items"],
    services: ["title", "service_items"],
    testimonials: ["title", "testimonial_items"],
    team: ["title", "team_members"],
    pricing: ["title", "pricing_plans"],
    faq: ["title", "faq_items"],
    gallery: ["title", "gallery_images"],
    contact: ["title", "form_fields"],
    cta: ["headline", "cta_text", "cta_link"],
    stats: ["stat_items"],
    trust: ["trust_badges", "logos"],
    location: ["address", "map_coordinates"],
    hours: ["business_hours"],
    blog: ["blog_posts"],
    newsletter: ["title", "description"],
  };

  return needs[intent] || ["content"];
}

/**
 * Get purpose description for a page
 */
function getPagePurpose(pageName: string, industry: string): string {
  const purposes: Record<string, Record<string, string>> = {
    restaurant: {
      Home: "Welcome visitors and showcase the dining experience",
      Menu: "Display food and drink offerings with prices",
      About: "Tell the restaurant's story and introduce the team",
      Reservations: "Allow guests to book tables online",
      Contact: "Provide location, hours, and contact information",
      Gallery: "Show the atmosphere, food, and events",
    },
    saas: {
      Home: "Introduce the product and drive trial signups",
      Features: "Showcase product capabilities and benefits",
      Pricing: "Present pricing plans and help users choose",
      About: "Build trust with company story and team",
      Contact: "Provide support and sales contact options",
      Blog: "Share industry insights and product updates",
    },
    healthcare: {
      Home: "Welcome patients and highlight services",
      Services: "Detail medical services and specialties",
      Team: "Introduce healthcare providers with credentials",
      About: "Share the practice's mission and values",
      Contact: "Facilitate appointment booking and inquiries",
    },
  };

  const industryPurposes = purposes[industry] || {};
  return (
    industryPurposes[pageName] ||
    `Present ${pageName.toLowerCase()} information to visitors`
  );
}

/**
 * Build shared element configurations
 */
function buildSharedElements(
  template: IndustryTemplate | null,
  dataFlags: DataAvailabilityFlags
): PagePlanRecommendation["sharedElements"] {
  // Default navbar
  let navbar = {
    style: "sticky",
    variant: "modern",
    ctaButton: true,
  };

  // Default footer
  let footer = {
    style: "comprehensive",
    columns: 4,
    newsletter: true,
  };

  // Apply industry template preferences
  if (template) {
    const navbarPref = template.componentPreferences.find((p) => p.section === "navbar");
    const footerPref = template.componentPreferences.find((p) => p.section === "footer");

    if (navbarPref?.config) {
      navbar = { ...navbar, ...navbarPref.config } as typeof navbar;
    }

    if (footerPref?.config) {
      footer = { ...footer, ...footerPref.config } as typeof footer;
    }

    // Industry-specific adjustments
    if (template.id === "law-firm" || template.id === "healthcare") {
      navbar.variant = "classic";
    }

    if (template.id === "portfolio") {
      navbar.variant = "minimal";
      footer.style = "minimal";
      footer.columns = 2;
      footer.newsletter = false;
    }
  }

  // Adjust based on data availability
  if (!dataFlags.hasSocial) {
    footer.columns = Math.min(footer.columns, 3);
  }

  return { navbar, footer };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DEFAULT_PAGE_SECTIONS };
