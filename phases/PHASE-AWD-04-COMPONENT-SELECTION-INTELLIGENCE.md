# Phase AWD-04: Component Selection Intelligence

> **Priority**: 🟡 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: AWD-01, AWD-03 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Component categories, field types
2. **AWD-01**: Full list of 53 components and their capabilities
3. **AWD-03**: How the engine calls the component selector

**This phase DEPENDS ON AWD-01 and AWD-03** - it provides intelligence for component selection.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/intelligence/types.ts` | Intelligence types |
| `next-platform-dashboard/src/lib/ai/website-designer/intelligence/industry-templates.ts` | Industry-specific templates |
| `next-platform-dashboard/src/lib/ai/website-designer/intelligence/component-scorer.ts` | Component ranking logic |
| `next-platform-dashboard/src/lib/ai/website-designer/intelligence/page-planner.ts` | Page structure planning |
| `next-platform-dashboard/src/lib/ai/website-designer/intelligence/index.ts` | Public exports |

---

## 📊 Component Reference (from AWD-01)

These are the 53 components the intelligence system can select from:

**Layout (6)**: Section, Container, Columns, Card, Spacer, Divider
**Typography (5)**: Heading, Text, RichText, Quote, Badge
**Buttons (2)**: Button, ButtonGroup
**Media (4)**: Image, Video, Map, Gallery
**Sections (9)**: Hero, Features, CTA, Testimonials, FAQ, Stats, Team, Pricing, About
**Navigation (5)**: Navbar, Footer, Breadcrumbs, Tabs, Accordion
**Marketing (5)**: LogoCloud, ComparisonTable, TrustBadges, SocialProof, AnnouncementBar
**Forms (4)**: Form, ContactForm, Newsletter, LeadCapture
**Social (3)**: SocialIcons, ShareButtons, SocialFeed
**Interactive (5)**: Modal, Tooltip, Countdown, Progress, Carousel
**Effects (5)**: Parallax, ScrollAnimate, CardFlip3D, TiltCard, GlassCard

---

## 🎯 Objective

Build an intelligent **Component Selection System** that chooses the optimal components and configurations based on:
- Industry/business type
- Page purpose
- Content availability
- User preferences
- Best practices and conversion optimization

**Principle:** AI selects the BEST component for each situation, not just any component

---

## 🧠 Intelligence Layers

### Layer 1: Industry Templates

```typescript
// src/lib/ai/website-designer/intelligence/industry-templates.ts

export interface IndustryTemplate {
  id: string;
  name: string;
  industries: string[];
  recommendedPages: PageRecommendation[];
  componentPreferences: ComponentPreference[];
  designTokens: DesignTokenRecommendation;
  contentGuidelines: ContentGuideline[];
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: "restaurant",
    name: "Restaurant & Food Service",
    industries: ["restaurant", "cafe", "bakery", "bar", "food-truck", "catering"],
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
  
  {
    id: "law-firm",
    name: "Law Firm & Legal Services",
    industries: ["law-firm", "attorney", "legal-services", "paralegal"],
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
  
  {
    id: "ecommerce",
    name: "E-commerce & Retail",
    industries: ["ecommerce", "retail", "online-store", "boutique", "fashion"],
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
  
  {
    id: "saas",
    name: "SaaS & Technology",
    industries: ["saas", "software", "tech-startup", "app", "platform"],
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
      colorMood: "modern",
      typography: "clean",
      spacing: "spacious",
      borderRadius: "lg",
      imagery: "product-screenshots",
    },
    contentGuidelines: [
      { section: "hero", tips: ["Value proposition in 6 words or less", "Show product interface", "Social proof (customer count, logos)"] },
      { section: "pricing", tips: ["Highlight most popular plan", "Show savings for annual", "Feature comparison matrix"] },
    ],
  },
  
  {
    id: "real-estate",
    name: "Real Estate",
    industries: ["real-estate", "realtor", "property-management", "mortgage"],
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
    contentGuidelines: [],
  },
  
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    industries: ["healthcare", "medical", "dental", "clinic", "hospital", "therapy"],
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
    contentGuidelines: [],
  },
  
  {
    id: "portfolio",
    name: "Portfolio & Creative",
    industries: ["portfolio", "designer", "photographer", "artist", "freelancer", "creative-agency"],
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
    contentGuidelines: [],
  },
  
  {
    id: "construction",
    name: "Construction & Trades",
    industries: ["construction", "contractor", "plumber", "electrician", "hvac", "roofing", "landscaping"],
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
    contentGuidelines: [],
  },
];

export function getIndustryTemplate(industry: string): IndustryTemplate | null {
  return industryTemplates.find(t => 
    t.industries.some(i => 
      i.toLowerCase() === industry.toLowerCase() ||
      industry.toLowerCase().includes(i.toLowerCase())
    )
  ) || null;
}

export function inferIndustry(prompt: string, clientData: any): string {
  // AI-powered industry inference based on prompt and client data
  const keywords: Record<string, string[]> = {
    restaurant: ["restaurant", "cafe", "food", "menu", "dining", "chef", "cuisine", "catering"],
    "law-firm": ["law", "attorney", "legal", "lawyer", "litigation", "practice areas"],
    ecommerce: ["shop", "store", "products", "ecommerce", "sell", "buy", "cart"],
    saas: ["software", "app", "platform", "saas", "subscription", "features", "pricing plans"],
    "real-estate": ["real estate", "property", "listings", "homes", "realtor", "agent"],
    healthcare: ["medical", "health", "doctor", "clinic", "patient", "dental", "therapy"],
    portfolio: ["portfolio", "work", "projects", "designer", "photographer", "creative"],
    construction: ["construction", "contractor", "building", "renovation", "plumber", "electrician"],
  };
  
  const combinedText = `${prompt} ${clientData?.industry || ""} ${clientData?.notes || ""}`.toLowerCase();
  
  for (const [industry, words] of Object.entries(keywords)) {
    if (words.some(word => combinedText.includes(word))) {
      return industry;
    }
  }
  
  return "general";
}
```

### Layer 2: Component Scoring System

```typescript
// src/lib/ai/website-designer/intelligence/component-scorer.ts

export interface ComponentScore {
  componentType: string;
  score: number;  // 0-100
  reasons: string[];
  suggestedConfig: Partial<Record<string, any>>;
}

export interface ScoringContext {
  sectionIntent: string;
  industryTemplate: IndustryTemplate | null;
  dataAvailability: DataAvailability;
  userPreferences: WebsiteDesignerInput["preferences"];
  existingComponents: string[];  // Already used on page
}

export function scoreComponent(
  componentType: string,
  context: ScoringContext
): ComponentScore {
  let score = 50;  // Base score
  const reasons: string[] = [];
  const suggestedConfig: Record<string, any> = {};
  
  // === Industry Template Boost ===
  if (context.industryTemplate) {
    const preference = context.industryTemplate.componentPreferences.find(
      p => p.section === context.sectionIntent
    );
    
    if (preference?.preferred.includes(componentType)) {
      score += 30;
      reasons.push(`Recommended for ${context.industryTemplate.name} industry`);
      
      if (preference.config) {
        Object.assign(suggestedConfig, preference.config);
      }
      
      if (preference.variant) {
        suggestedConfig.variant = preference.variant;
      }
    }
  }
  
  // === Data Availability Boost ===
  const dataBoosts: Record<string, { check: keyof DataAvailability; boost: number }[]> = {
    Team: [{ check: "hasTeam", boost: 25 }],
    Testimonials: [{ check: "hasTestimonials", boost: 25 }],
    FAQ: [{ check: "hasFaq", boost: 25 }],
    Gallery: [{ check: "hasPortfolio", boost: 20 }],
    Map: [{ check: "hasLocations", boost: 20 }],
    LogoCloud: [{ check: "hasLogo", boost: 15 }],
    Stats: [{ check: "hasServices", boost: 15 }],
  };
  
  const boosts = dataBoosts[componentType] || [];
  for (const boost of boosts) {
    if (context.dataAvailability[boost.check]) {
      score += boost.boost;
      reasons.push(`Data available for ${componentType}`);
    } else {
      score -= 10;
      reasons.push(`No data for ${componentType}, will use placeholders`);
    }
  }
  
  // === Section Intent Match ===
  const intentMatches: Record<string, string[]> = {
    hero: ["Hero"],
    features: ["Features", "Card"],
    testimonials: ["Testimonials", "SocialProof"],
    team: ["Team"],
    pricing: ["Pricing", "ComparisonTable"],
    faq: ["FAQ", "Accordion"],
    gallery: ["Gallery", "Carousel"],
    contact: ["ContactForm", "Form", "Map"],
    cta: ["CTA", "Newsletter"],
    stats: ["Stats", "Counter"],
    trust: ["TrustBadges", "LogoCloud"],
  };
  
  const matches = intentMatches[context.sectionIntent] || [];
  if (matches.includes(componentType)) {
    score += 20;
    reasons.push(`Direct match for "${context.sectionIntent}" section`);
  }
  
  // === Variety Penalty (avoid repetition) ===
  if (context.existingComponents.includes(componentType)) {
    score -= 15;
    reasons.push(`Already used on this page`);
  }
  
  // === User Preference Alignment ===
  if (context.userPreferences) {
    // Animation preference
    if (context.userPreferences.animationLevel === "dynamic") {
      if (["Carousel", "Parallax", "ScrollAnimate", "Typewriter", "CardFlip3D"].includes(componentType)) {
        score += 10;
        reasons.push(`Matches dynamic animation preference`);
      }
    }
    
    // Style preference
    if (context.userPreferences.style === "minimal") {
      if (["Card", "Text", "Divider", "Spacer"].includes(componentType)) {
        score += 10;
      }
      if (["ParticleBackground", "CardFlip3D", "GlassCard"].includes(componentType)) {
        score -= 10;
      }
    }
  }
  
  return {
    componentType,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    suggestedConfig,
  };
}

export function rankComponentsForSection(
  sectionIntent: string,
  context: ScoringContext,
  availableComponents: string[]
): ComponentScore[] {
  return availableComponents
    .map(type => scoreComponent(type, context))
    .sort((a, b) => b.score - a.score);
}

export function selectBestComponent(
  sectionIntent: string,
  context: ScoringContext,
  availableComponents: string[]
): ComponentScore {
  const ranked = rankComponentsForSection(sectionIntent, context, availableComponents);
  return ranked[0];
}
```

### Layer 3: Content-Aware Selection

```typescript
// src/lib/ai/website-designer/intelligence/content-aware-selector.ts

export interface ContentRequirement {
  field: string;
  importance: "critical" | "important" | "optional";
  dataSource?: string;  // Where to pull from context
  fallback?: string;    // Default if no data
}

export const componentContentRequirements: Record<string, ContentRequirement[]> = {
  Hero: [
    { field: "headline", importance: "critical", fallback: "AI Generated" },
    { field: "subheadline", importance: "important", fallback: "AI Generated" },
    { field: "backgroundImage", importance: "important", dataSource: "branding.heroImage" },
    { field: "ctaText", importance: "important", fallback: "Get Started" },
    { field: "ctaLink", importance: "important", fallback: "/contact" },
  ],
  Team: [
    { field: "members", importance: "critical", dataSource: "team" },
    { field: "title", importance: "optional", fallback: "Our Team" },
  ],
  Testimonials: [
    { field: "testimonials", importance: "critical", dataSource: "testimonials" },
    { field: "title", importance: "optional", fallback: "What Our Clients Say" },
  ],
  FAQ: [
    { field: "items", importance: "critical", dataSource: "faq" },
    { field: "title", importance: "optional", fallback: "Frequently Asked Questions" },
  ],
  Features: [
    { field: "features", importance: "critical", dataSource: "services" },
    { field: "title", importance: "optional", fallback: "Our Services" },
  ],
  Gallery: [
    { field: "images", importance: "critical", dataSource: "portfolio" },
    { field: "title", importance: "optional", fallback: "Our Work" },
  ],
  Map: [
    { field: "location", importance: "critical", dataSource: "locations[0]" },
    { field: "apiKey", importance: "critical" },
  ],
  ContactForm: [
    { field: "recipientEmail", importance: "critical", dataSource: "contact.email" },
    { field: "title", importance: "optional", fallback: "Get In Touch" },
  ],
  Footer: [
    { field: "logo", importance: "important", dataSource: "branding.logo_url" },
    { field: "businessName", importance: "important", dataSource: "branding.business_name" },
    { field: "contact", importance: "important", dataSource: "contact" },
    { field: "social", importance: "optional", dataSource: "social" },
    { field: "hours", importance: "optional", dataSource: "hours" },
  ],
  Navbar: [
    { field: "logo", importance: "important", dataSource: "branding.logo_url" },
    { field: "businessName", importance: "important", dataSource: "branding.business_name" },
  ],
};

export function canRenderComponent(
  componentType: string,
  context: BusinessDataContext
): { canRender: boolean; missingCritical: string[]; missingOptional: string[] } {
  const requirements = componentContentRequirements[componentType] || [];
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];
  
  for (const req of requirements) {
    if (req.dataSource) {
      const value = getNestedValue(context, req.dataSource);
      const hasValue = value !== null && value !== undefined && 
        (Array.isArray(value) ? value.length > 0 : true);
      
      if (!hasValue && !req.fallback) {
        if (req.importance === "critical") {
          missingCritical.push(req.field);
        } else {
          missingOptional.push(req.field);
        }
      }
    }
  }
  
  return {
    canRender: missingCritical.length === 0,
    missingCritical,
    missingOptional,
  };
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    // Handle array access like "locations[0]"
    const match = part.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      return acc[match[1]]?.[parseInt(match[2])];
    }
    return acc[part];
  }, obj);
}
```

---

## 📋 Implementation Tasks

### Task 1: Industry Templates (3 hours)
- Define all industry templates
- Include component preferences per industry
- Add design token recommendations
- Add content guidelines

### Task 2: Component Scoring (3 hours)
- Implement scoring algorithm
- Add all scoring factors
- Test with various contexts

### Task 3: Content-Aware Selection (2 hours)
- Define content requirements per component
- Implement availability checking
- Add fallback system

### Task 4: Integration (2 hours)
- Connect to AWD-03 engine
- Add to page generation flow
- Test end-to-end

### Task 5: Testing & Tuning (2 hours)
- Test with all industry types
- Tune scoring weights
- Validate component selection quality

---

## ✅ Completion Checklist

- [ ] Industry templates defined (8+ industries)
- [ ] Component scoring system implemented
- [ ] Content-aware selection working
- [ ] Integration with engine complete
- [ ] All industries tested
- [ ] Scoring weights tuned

---

## 📁 Files Created

```
src/lib/ai/website-designer/intelligence/
├── industry-templates.ts
├── component-scorer.ts
├── content-aware-selector.ts
└── index.ts
```

---

**READY TO IMPLEMENT! 🚀**
