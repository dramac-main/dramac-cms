/**
 * PHASE AWD-04: Component Selection Intelligence
 * Industry-Specific Templates
 *
 * Defines optimal page structures, component preferences, and design tokens
 * for different industry verticals.
 */

import type { IndustryTemplate } from "./types";

// =============================================================================
// INDUSTRY TEMPLATES
// =============================================================================

export const industryTemplates: IndustryTemplate[] = [
  // ---------------------------------------------------------------------------
  // RESTAURANT & FOOD SERVICE
  // ---------------------------------------------------------------------------
  {
    id: "restaurant",
    name: "Restaurant & Food Service",
    industries: ["restaurant", "cafe", "bakery", "bar", "food-truck", "catering", "bistro", "pizzeria"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Menu", slug: "/menu", priority: 2, required: true },
      { name: "About", slug: "/about", priority: 3, required: false },
      { name: "Reservations", slug: "/reservations", priority: 4, required: false },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
      { name: "Gallery", slug: "/gallery", priority: 6, required: false },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "image-background", config: { showCta: true, ctaText: "View Menu" } },
      { section: "menu", preferred: ["Tabs", "Accordion"], config: { allowCategoryFiltering: true } },
      { section: "gallery", preferred: ["Gallery"], variant: "masonry", config: { enableLightbox: true } },
      { section: "hours", preferred: ["Stats", "Card"], config: { showBusinessHours: true } },
      { section: "testimonials", preferred: ["Testimonials"], variant: "carousel", config: { showRating: true } },
      { section: "cta", preferred: ["CTA"], variant: "split", config: { ctaText: "Make a Reservation" } },
      { section: "location", preferred: ["Map", "Card"], config: { showDirections: true } },
    ],
    designTokens: {
      colorMood: "warm",
      typography: "elegant",
      spacing: "spacious",
      borderRadius: "sm",
      imagery: "high-quality-food-photos",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Use appetizing food imagery", "Highlight signature dish or ambiance", "Include opening hours or 'Open Now' badge"] },
      { section: "menu", tips: ["Include prices", "Mark popular items", "Note dietary options (V, GF, etc.)"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // LAW FIRM & LEGAL SERVICES
  // ---------------------------------------------------------------------------
  {
    id: "law-firm",
    name: "Law Firm & Legal Services",
    industries: ["law-firm", "attorney", "legal-services", "paralegal", "lawyer", "litigation"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Practice Areas", slug: "/practice-areas", priority: 2, required: true },
      { name: "Attorneys", slug: "/attorneys", priority: 3, required: true },
      { name: "About", slug: "/about", priority: 4, required: true },
      { name: "Case Results", slug: "/results", priority: 5, required: false },
      { name: "Blog", slug: "/blog", priority: 6, required: false },
      { name: "Contact", slug: "/contact", priority: 7, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "split", config: { tone: "authoritative", showCredentials: true } },
      { section: "practice-areas", preferred: ["Features", "Card"], variant: "icon-grid", config: { showLearnMore: true } },
      { section: "team", preferred: ["Team"], variant: "detailed-grid", config: { showCredentials: true, showEducation: true } },
      { section: "testimonials", preferred: ["Testimonials"], variant: "minimal", config: { anonymize: true } },
      { section: "trust", preferred: ["TrustBadges", "LogoCloud"], config: { showBarAssociations: true } },
      { section: "cta", preferred: ["CTA"], variant: "form", config: { ctaText: "Free Consultation" } },
      { section: "faq", preferred: ["FAQ"], variant: "accordion", config: { groupByCategory: true } },
    ],
    designTokens: {
      colorMood: "professional",
      typography: "serif-headings",
      spacing: "balanced",
      borderRadius: "none",
      imagery: "professional-portraits",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Emphasize experience and track record", "Include trust indicators", "Clear call to consultation"] },
      { section: "team", tips: ["Include bar admissions", "Education credentials", "Areas of expertise"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // E-COMMERCE & RETAIL
  // ---------------------------------------------------------------------------
  {
    id: "ecommerce",
    name: "E-commerce & Retail",
    industries: ["ecommerce", "retail", "online-store", "boutique", "fashion", "shop", "store"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Shop", slug: "/shop", priority: 2, required: true },
      { name: "Collections", slug: "/collections", priority: 3, required: false },
      { name: "About", slug: "/about", priority: 4, required: false },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "full-width", config: { showPromotion: true } },
      { section: "featured", preferred: ["Gallery", "Carousel"], variant: "product-grid", config: { showPrices: true, showQuickAdd: true } },
      { section: "categories", preferred: ["Features", "Card"], variant: "image-card", config: { linkToCategory: true } },
      { section: "trust", preferred: ["TrustBadges", "LogoCloud"], config: { showPaymentMethods: true, showShipping: true } },
      { section: "testimonials", preferred: ["Testimonials", "SocialProof"], config: { showProductReviews: true } },
      { section: "newsletter", preferred: ["Newsletter", "CTA"], config: { offerDiscount: true } },
    ],
    designTokens: {
      colorMood: "vibrant",
      typography: "modern",
      spacing: "compact",
      borderRadius: "md",
      imagery: "product-lifestyle",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Highlight current promotion", "Show best-selling products", "Clear shop CTA"] },
      { section: "trust", tips: ["Payment methods accepted", "Shipping info", "Return policy highlights"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // SAAS & TECHNOLOGY
  // ---------------------------------------------------------------------------
  {
    id: "saas",
    name: "SaaS & Technology",
    industries: ["saas", "software", "tech-startup", "app", "platform", "tech", "startup"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Features", slug: "/features", priority: 2, required: true },
      { name: "Pricing", slug: "/pricing", priority: 3, required: true },
      { name: "About", slug: "/about", priority: 4, required: false },
      { name: "Blog", slug: "/blog", priority: 5, required: false },
      { name: "Contact", slug: "/contact", priority: 6, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "centered", config: { showProductDemo: true, showSocialProof: true } },
      { section: "features", preferred: ["Features"], variant: "alternating", config: { showScreenshots: true } },
      { section: "pricing", preferred: ["Pricing"], variant: "comparison", config: { highlightRecommended: true } },
      { section: "testimonials", preferred: ["Testimonials", "LogoCloud"], config: { showCompanyLogos: true } },
      { section: "faq", preferred: ["FAQ"], config: { groupByCategory: true } },
      { section: "cta", preferred: ["CTA"], variant: "centered", config: { ctaText: "Start Free Trial" } },
      { section: "comparison", preferred: ["ComparisonTable"], config: { compareWithCompetitors: true } },
    ],
    designTokens: {
      colorMood: "professional",
      typography: "modern",
      spacing: "spacious",
      borderRadius: "lg",
      imagery: "product-screenshots",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Value proposition in 6 words or less", "Show product interface", "Social proof (customer count, logos)"] },
      { section: "pricing", tips: ["Highlight most popular plan", "Show savings for annual", "Feature comparison matrix"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // REAL ESTATE
  // ---------------------------------------------------------------------------
  {
    id: "real-estate",
    name: "Real Estate",
    industries: ["real-estate", "realtor", "property-management", "mortgage", "property", "agent"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Listings", slug: "/listings", priority: 2, required: true },
      { name: "About", slug: "/about", priority: 3, required: true },
      { name: "Services", slug: "/services", priority: 4, required: false },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "search", config: { showPropertySearch: true } },
      { section: "featured", preferred: ["Gallery", "Carousel"], variant: "property-cards", config: { showPrice: true, showDetails: true } },
      { section: "agent", preferred: ["Team", "Card"], variant: "agent-profile", config: { showStats: true, showContact: true } },
      { section: "testimonials", preferred: ["Testimonials"], config: { showPropertySold: true } },
      { section: "stats", preferred: ["Stats"], config: { showSalesStats: true } },
      { section: "cta", preferred: ["CTA"], variant: "form", config: { ctaText: "Get a Free Home Valuation" } },
    ],
    designTokens: {
      colorMood: "professional",
      typography: "elegant",
      spacing: "balanced",
      borderRadius: "md",
      imagery: "property-photos",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Property search functionality", "Market area highlight", "Professional agent photo"] },
      { section: "stats", tips: ["Homes sold", "Years of experience", "Average days on market"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // HEALTHCARE & MEDICAL
  // ---------------------------------------------------------------------------
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    industries: ["healthcare", "medical", "dental", "clinic", "hospital", "therapy", "doctor", "dentist"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Services", slug: "/services", priority: 2, required: true },
      { name: "About", slug: "/about", priority: 3, required: true },
      { name: "Team", slug: "/team", priority: 4, required: true },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
      { name: "Patient Resources", slug: "/resources", priority: 6, required: false },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "image-background", config: { tone: "caring", showBooking: true } },
      { section: "services", preferred: ["Features", "Card"], variant: "icon-grid", config: { showBookNow: true } },
      { section: "team", preferred: ["Team"], variant: "detailed-grid", config: { showCredentials: true, showSpecialties: true } },
      { section: "trust", preferred: ["TrustBadges", "LogoCloud"], config: { showCertifications: true, showInsurance: true } },
      { section: "testimonials", preferred: ["Testimonials"], variant: "carousel", config: { showPatientStories: true } },
      { section: "faq", preferred: ["FAQ"], config: { groupByCategory: true } },
      { section: "cta", preferred: ["CTA"], variant: "split", config: { ctaText: "Book Appointment" } },
    ],
    designTokens: {
      colorMood: "calm",
      typography: "clean",
      spacing: "spacious",
      borderRadius: "lg",
      imagery: "professional-caring",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Patient-focused messaging", "Easy appointment booking", "Trust indicators"] },
      { section: "team", tips: ["Medical credentials", "Specializations", "Friendly headshots"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // PORTFOLIO & CREATIVE
  // ---------------------------------------------------------------------------
  {
    id: "portfolio",
    name: "Portfolio & Creative",
    industries: ["portfolio", "designer", "photographer", "artist", "freelancer", "creative-agency", "creative"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Work", slug: "/work", priority: 2, required: true },
      { name: "About", slug: "/about", priority: 3, required: true },
      { name: "Services", slug: "/services", priority: 4, required: false },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "minimal", config: { emphasizeWork: true } },
      { section: "work", preferred: ["Gallery"], variant: "masonry", config: { enableLightbox: true, showCaseStudies: true } },
      { section: "about", preferred: ["Card", "Features"], variant: "image-side", config: { showPersonality: true } },
      { section: "clients", preferred: ["LogoCloud"], config: { showInfiniteScroll: true } },
      { section: "testimonials", preferred: ["Testimonials"], variant: "minimal", config: { showClientName: true } },
      { section: "cta", preferred: ["CTA"], variant: "minimal", config: { ctaText: "Let's Work Together" } },
    ],
    designTokens: {
      colorMood: "minimal",
      typography: "modern",
      spacing: "spacious",
      borderRadius: "none",
      imagery: "work-samples",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Let the work speak", "Minimal text", "Strong visual impact"] },
      { section: "work", tips: ["High-quality project images", "Brief project descriptions", "Client names if possible"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // CONSTRUCTION & TRADES
  // ---------------------------------------------------------------------------
  {
    id: "construction",
    name: "Construction & Trades",
    industries: ["construction", "contractor", "plumber", "electrician", "hvac", "roofing", "landscaping", "handyman"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Services", slug: "/services", priority: 2, required: true },
      { name: "Projects", slug: "/projects", priority: 3, required: true },
      { name: "About", slug: "/about", priority: 4, required: true },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "image-background", config: { showPhone: true, showCta: true } },
      { section: "services", preferred: ["Features", "Card"], variant: "icon-grid", config: { showRequestQuote: true } },
      { section: "projects", preferred: ["Gallery"], variant: "before-after", config: { showProjectDetails: true } },
      { section: "trust", preferred: ["TrustBadges", "Stats"], config: { showLicenses: true, showInsurance: true, showYearsInBusiness: true } },
      { section: "testimonials", preferred: ["Testimonials"], config: { showProjectType: true } },
      { section: "cta", preferred: ["CTA"], variant: "form", config: { ctaText: "Get a Free Quote" } },
      { section: "serviceArea", preferred: ["Map"], config: { showServiceArea: true } },
    ],
    designTokens: {
      colorMood: "bold",
      typography: "strong",
      spacing: "balanced",
      borderRadius: "sm",
      imagery: "project-photos",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Show completed project", "Prominent phone number", "Get Quote CTA"] },
      { section: "trust", tips: ["Licensed & insured", "Years in business", "Projects completed"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // EDUCATION
  // ---------------------------------------------------------------------------
  {
    id: "education",
    name: "Education & Training",
    industries: ["education", "school", "training", "coaching", "tutoring", "academy", "courses"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Programs", slug: "/programs", priority: 2, required: true },
      { name: "About", slug: "/about", priority: 3, required: true },
      { name: "Faculty", slug: "/faculty", priority: 4, required: false },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "centered", config: { showEnrollCta: true } },
      { section: "programs", preferred: ["Features", "Card"], variant: "detailed-grid", config: { showPricing: true } },
      { section: "team", preferred: ["Team"], variant: "grid", config: { showCredentials: true } },
      { section: "testimonials", preferred: ["Testimonials"], config: { showStudentSuccess: true } },
      { section: "stats", preferred: ["Stats"], config: { showGraduates: true, showSuccessRate: true } },
      { section: "cta", preferred: ["CTA"], config: { ctaText: "Enroll Now" } },
    ],
    designTokens: {
      colorMood: "professional",
      typography: "clean",
      spacing: "balanced",
      borderRadius: "md",
      imagery: "learning-environment",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Inspiring headline", "Student success focus", "Clear enrollment path"] },
      { section: "stats", tips: ["Graduation rate", "Student satisfaction", "Career placement"] },
    ],
  },

  // ---------------------------------------------------------------------------
  // NONPROFIT
  // ---------------------------------------------------------------------------
  {
    id: "nonprofit",
    name: "Nonprofit & Charity",
    industries: ["nonprofit", "charity", "ngo", "foundation", "cause", "organization"],
    recommendedPages: [
      { name: "Home", slug: "/", priority: 1, required: true },
      { name: "Our Work", slug: "/our-work", priority: 2, required: true },
      { name: "About", slug: "/about", priority: 3, required: true },
      { name: "Get Involved", slug: "/get-involved", priority: 4, required: false },
      { name: "Contact", slug: "/contact", priority: 5, required: true },
    ],
    componentPreferences: [
      { section: "hero", preferred: ["Hero"], variant: "image-background", config: { showDonateCta: true } },
      { section: "impact", preferred: ["Stats"], config: { showImpactNumbers: true } },
      { section: "mission", preferred: ["Features", "Card"], config: { showValues: true } },
      { section: "testimonials", preferred: ["Testimonials"], config: { showBeneficiaries: true } },
      { section: "team", preferred: ["Team"], variant: "grid", config: { showLeadership: true } },
      { section: "cta", preferred: ["CTA"], config: { ctaText: "Donate Now" } },
    ],
    designTokens: {
      colorMood: "warm",
      typography: "clean",
      spacing: "spacious",
      borderRadius: "md",
      imagery: "impact-photos",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Emotional connection", "Clear mission statement", "Multiple ways to help"] },
      { section: "impact", tips: ["Lives changed", "Projects completed", "Funds raised"] },
    ],
  },
];

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get industry template by ID or industry name
 */
export function getIndustryTemplate(industry: string): IndustryTemplate | null {
  // First try exact ID match
  const exactMatch = industryTemplates.find((t) => t.id === industry.toLowerCase());
  if (exactMatch) return exactMatch;

  // Then try industry name match
  return (
    industryTemplates.find((t) =>
      t.industries.some(
        (i) => i.toLowerCase() === industry.toLowerCase() || industry.toLowerCase().includes(i.toLowerCase())
      )
    ) || null
  );
}

/**
 * Infer industry from prompt and client data
 */
export function inferIndustry(prompt: string, clientData?: { industry?: string; notes?: string }): string {
  const keywords: Record<string, string[]> = {
    restaurant: ["restaurant", "cafe", "food", "menu", "dining", "chef", "cuisine", "catering", "bistro", "pizzeria", "bakery"],
    "law-firm": ["law", "attorney", "legal", "lawyer", "litigation", "practice areas", "counsel"],
    ecommerce: ["shop", "store", "products", "ecommerce", "sell", "buy", "cart", "retail", "fashion", "boutique"],
    saas: ["software", "app", "platform", "saas", "subscription", "features", "pricing plans", "startup", "tech"],
    "real-estate": ["real estate", "property", "listings", "homes", "realtor", "agent", "mortgage"],
    healthcare: ["medical", "health", "doctor", "clinic", "patient", "dental", "therapy", "hospital", "dentist"],
    portfolio: ["portfolio", "work", "projects", "designer", "photographer", "creative", "artist", "freelancer"],
    construction: ["construction", "contractor", "building", "renovation", "plumber", "electrician", "roofing", "hvac"],
    education: ["education", "school", "training", "courses", "academy", "tutoring", "coaching"],
    nonprofit: ["nonprofit", "charity", "ngo", "foundation", "donate", "cause", "volunteer"],
  };

  const combinedText = `${prompt} ${clientData?.industry || ""} ${clientData?.notes || ""}`.toLowerCase();

  for (const [industry, words] of Object.entries(keywords)) {
    if (words.some((word) => combinedText.includes(word))) {
      return industry;
    }
  }

  return "general";
}

/**
 * Get all available industry template IDs
 */
export function getAvailableIndustries(): string[] {
  return industryTemplates.map((t) => t.id);
}

/**
 * Get all available industries (alias for getAvailableIndustries)
 */
export function getAllIndustries(): string[] {
  return getAvailableIndustries();
}

/**
 * Export templates as INDUSTRY_TEMPLATES for backwards compatibility
 */
export const INDUSTRY_TEMPLATES = industryTemplates;

/**
 * Get industry template by partial match
 */
export function findBestIndustryMatch(query: string): IndustryTemplate | null {
  const lowerQuery = query.toLowerCase();

  // Score each template
  let bestMatch: IndustryTemplate | null = null;
  let bestScore = 0;

  for (const template of industryTemplates) {
    let score = 0;

    // Check template ID
    if (template.id.includes(lowerQuery)) score += 10;
    if (template.id === lowerQuery) score += 20;

    // Check template name
    if (template.name.toLowerCase().includes(lowerQuery)) score += 5;

    // Check industries list
    for (const industry of template.industries) {
      if (industry.includes(lowerQuery)) score += 8;
      if (industry === lowerQuery) score += 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  return bestMatch;
}
