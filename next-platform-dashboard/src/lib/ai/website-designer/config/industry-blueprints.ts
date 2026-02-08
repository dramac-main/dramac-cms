/**
 * INDUSTRY BLUEPRINTS - Production-Proven Website Architectures
 * 
 * Battle-tested, conversion-optimized website blueprints for every major industry.
 * Based on UX research from Awwwards, Dribbble, NNGroup, Baymard Institute,
 * and analysis of 100+ top-converting websites per industry.
 * 
 * These blueprints provide EXACT section orders, component configurations,
 * content patterns, and design decisions that are PROVEN to convert.
 * 
 * The AI uses these as AUTHORITATIVE guides — not suggestions.
 * This eliminates guesswork and ensures consistent, high-quality output.
 * 
 * ARCHITECTURE PATTERN (per industry):
 * 1. Exact page list with priorities
 * 2. Section-by-section blueprint for each page (component, order, config)
 * 3. Content formulas (headlines, CTAs, descriptions)
 * 4. Color psychology + proven palettes
 * 5. Typography pairings that work
 * 6. Conversion optimization rules
 * 7. SEO structure
 * 8. Mobile-first considerations
 */

// =============================================================================
// TYPES
// =============================================================================

export interface IndustryBlueprint {
  id: string;
  name: string;
  /** Industries this blueprint applies to */
  matchKeywords: string[];
  /** Why this architecture works - AI context */
  architectureRationale: string;
  
  /** Exact pages with order and purpose */
  pages: BlueprintPage[];
  
  /** Design system */
  design: BlueprintDesign;
  
  /** Content formulas */
  content: BlueprintContent;
  
  /** Conversion rules */
  conversion: ConversionRules;
  
  /** SEO structure */
  seo: SEOBlueprint;
}

export interface BlueprintPage {
  name: string;
  slug: string;
  priority: number;
  required: boolean;
  purpose: string;
  /** Exact sections in order */
  sections: BlueprintSection[];
}

export interface BlueprintSection {
  component: string;
  intent: string;
  /** Why this section is here and why in this order */
  rationale: string;
  /** Exact config the AI MUST use */
  config: Record<string, unknown>;
  /** Content formula for this section */
  contentFormula: ContentFormula;
}

export interface ContentFormula {
  headline?: { pattern: string; examples: string[]; maxWords: number };
  subheadline?: { pattern: string; examples: string[]; maxWords: number };
  cta?: { pattern: string; examples: string[]; maxWords: number };
  body?: { pattern: string; wordRange: [number, number] };
  items?: { count: number | [number, number]; structure: string };
}

export interface BlueprintDesign {
  /** Two proven palettes to choose from */
  palettes: DesignPalette[];
  /** Proven typography pairings */
  typography: TypographyPairing[];
  /** Layout rules */
  layout: {
    borderRadius: string;
    shadowStyle: string;
    spacing: string;
    heroHeight: string;
    sectionPadding: string;
  };
  /** Image guidelines */
  imagery: {
    heroStyle: string;
    sectionImages: string;
    teamPhotos: string;
    unsplashKeywords: string[];
  };
}

export interface DesignPalette {
  name: string;
  mood: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface TypographyPairing {
  name: string;
  heading: string;
  body: string;
  headingWeight: string;
  bodyWeight: string;
}

export interface ConversionRules {
  /** Primary action the visitor should take */
  primaryAction: string;
  /** Where CTAs must appear */
  ctaPlacements: string[];
  /** Trust signals to include */
  trustSignals: string[];
  /** Social proof elements */
  socialProof: string[];
  /** Urgency/scarcity tactics (ethical ones) */
  urgencyTactics: string[];
}

export interface SEOBlueprint {
  titlePattern: string;
  descriptionPattern: string;
  keywordCategories: string[];
  schemaTypes: string[];
}

export interface BlueprintContent {
  toneGuide: string;
  headlineRules: string[];
  ctaRules: string[];
  contentDo: string[];
  contentDont: string[];
}

// =============================================================================
// BLUEPRINT DATABASE
// =============================================================================

export const INDUSTRY_BLUEPRINTS: IndustryBlueprint[] = [

  // ===========================================================================
  // 🍽️ RESTAURANT / CAFÉ / BAR / FOOD SERVICE
  // ===========================================================================
  {
    id: "restaurant",
    name: "Restaurant & Food Service",
    matchKeywords: ["restaurant", "cafe", "café", "coffee", "bar", "bistro", "bakery", "pizzeria", "food truck", "catering", "dining", "eatery", "grill", "steakhouse", "sushi", "deli", "pub", "tavern", "brewery", "winery"],
    architectureRationale: "70%+ of restaurant website traffic is mobile. Visitors need menu + hours + reservation in under 3 taps. Hero must immediately show food quality and atmosphere. Research shows food imagery increases reservation rates by 30%. Menu must be scannable, not a PDF. Location/hours must be instantly visible without scrolling on mobile.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Convert visitors into diners - show food quality, enable reservations, display hours",
        sections: [
          {
            component: "Hero", intent: "hero",
            rationale: "Full-screen appetizing food/atmosphere photo immediately signals quality. 70% overlay ensures text readability. Primary CTA drives reservations (highest-value conversion). Badge shows 'Open Now' or current status.",
            config: { variant: "fullscreen", minHeight: "100vh", backgroundOverlay: true, backgroundOverlayOpacity: 65, backgroundOverlayColor: "#000000" },
            contentFormula: {
              headline: { pattern: "[Sensory adjective] + [Experience/Journey] + [at/in] + [Business Name]", examples: ["A Culinary Journey Awaits at {name}", "Where Every Dish Tells a Story", "Taste the Art of {cuisine} Cuisine"], maxWords: 8 },
              subheadline: { pattern: "Describe the experience, not the food", examples: ["Handcrafted dishes made with locally sourced ingredients, served in an unforgettable atmosphere", "From our family kitchen to your table — authentic flavors crafted with passion since {year}"], maxWords: 20 },
              cta: { pattern: "[Action verb] + Your + [Experience noun]", examples: ["Reserve Your Table", "Book Your Experience", "Make a Reservation"], maxWords: 4 },
            }
          },
          {
            component: "BookingWidget", intent: "quick-reservation",
            rationale: "Inline reservation widget immediately below hero — lets diners pick date, time, party size without leaving the page. Reduces booking friction by 40%. Compact horizontal layout works perfectly on both mobile and desktop.",
            config: { variant: "inline", compact: true, showDate: true, showTime: true, showGuests: true },
            contentFormula: {
              headline: { pattern: "Make a Reservation", examples: ["Reserve Your Table", "Book Your Experience"], maxWords: 4 },
            }
          },
          {
            component: "Features", intent: "highlights",
            rationale: "3 key differentiators build immediate trust. Icons provide visual anchoring. This section answers 'Why this restaurant?' within 5 seconds of scrolling.",
            config: { columns: 3, layout: "icons", iconColor: "primary" },
            contentFormula: {
              headline: { pattern: "Why [Business Name] / Our Promise", examples: ["Why Guests Love Us", "The {name} Difference"], maxWords: 5 },
              items: { count: 3, structure: "icon + 3-word title + 15-word benefit description" },
            }
          },
          {
            component: "Gallery", intent: "food-showcase",
            rationale: "Food imagery is the #1 conversion driver for restaurants. Grid of 4-6 signature dishes creates desire. Research shows professional food photos increase orders by 30%.",
            config: { layout: "grid", columns: 3, gap: 8, aspectRatio: "square", showCaptions: true },
            contentFormula: {
              headline: { pattern: "Signature/Featured + Dishes/Menu", examples: ["Our Signature Dishes", "From Our Kitchen"], maxWords: 4 },
              items: { count: [4, 6], structure: "high-quality food photo + dish name + brief description" },
            }
          },
          {
            component: "Testimonials", intent: "social-proof",
            rationale: "Google reviews are the #1 factor in restaurant selection. Showing 3 authentic reviews with star ratings builds trust. Carousel format keeps page compact.",
            config: { layout: "carousel", showRating: true, showAvatar: true, autoPlay: true },
            contentFormula: {
              headline: { pattern: "What Our Guests Say", examples: ["What Our Guests Say", "Loved by Food Enthusiasts"], maxWords: 5 },
              items: { count: [3, 5], structure: "5-star rating + 2-3 sentence review + reviewer name" },
            }
          },
          {
            component: "Stats", intent: "location-hours",
            rationale: "Hours and location are the #2 most sought info after menu. Displaying them prominently prevents bounce. Stats format makes data scannable.",
            config: { columns: 4, layout: "centered" },
            contentFormula: {
              items: { count: 4, structure: "value + label for: Years Open, Happy Guests, 5-Star Reviews, Signature Dishes" },
            }
          },
          {
            component: "CTA", intent: "reservation-cta",
            rationale: "Final conversion push. Contrasting background color creates visual break. Strong action-oriented headline with single CTA reduces decision fatigue.",
            config: { variant: "centered", fullWidth: true },
            contentFormula: {
              headline: { pattern: "Ready to [Experience] + ?", examples: ["Ready to Experience Something Special?", "Your Table Awaits"], maxWords: 7 },
              cta: { pattern: "Reserve/Book + Now/Today", examples: ["Reserve Your Table", "Book Now"], maxWords: 3 },
            }
          },
        ]
      },
      {
        name: "Menu", slug: "/menu", priority: 2, required: true,
        purpose: "Display full menu with categories and prices - must be scannable, not PDF",
        sections: [
          { component: "Hero", intent: "page-header", rationale: "Compact hero establishes context without stealing space from menu content.",
            config: { variant: "compact", minHeight: "40vh", backgroundOverlay: true, backgroundOverlayOpacity: 60 },
            contentFormula: { headline: { pattern: "Our Menu / What We Serve", examples: ["Our Menu", "Explore Our Flavors"], maxWords: 4 } }
          },
          { component: "Features", intent: "menu-categories", rationale: "Categorized menu items with prices. Features component with detailed layout provides structure.",
            config: { columns: 1, layout: "detailed", showPrices: true },
            contentFormula: { items: { count: [8, 20], structure: "dish name + description + price, grouped by category" } }
          },
          { component: "CTA", intent: "order-cta", rationale: "After browsing menu, visitors are primed to order or reserve.",
            config: { variant: "simple" },
            contentFormula: { headline: { pattern: "Found Something You Love?", examples: ["Found Something You Love?", "Hungry Yet?"], maxWords: 5 }, cta: { pattern: "Order/Reserve Now", examples: ["Order Now", "Reserve a Table"], maxWords: 3 } }
          }
        ]
      },
      {
        name: "About", slug: "/about", priority: 3, required: false,
        purpose: "Tell the restaurant's story - chef background, sourcing philosophy, history",
        sections: [
          { component: "Hero", intent: "page-header", rationale: "Interior/team photo hero establishes warmth and personality.",
            config: { variant: "split", minHeight: "60vh" },
            contentFormula: { headline: { pattern: "Our Story / About [Name]", examples: ["Our Story", "The Heart Behind {name}"], maxWords: 5 } }
          },
          { component: "Features", intent: "our-values", rationale: "3 pillars of the restaurant philosophy.",
            config: { columns: 3, layout: "icons" },
            contentFormula: { items: { count: 3, structure: "icon + value name + 20-word description (e.g., Farm to Table, Handcrafted, Family Recipe)" } }
          },
          { component: "Team", intent: "meet-the-team", rationale: "Chef and key staff photos personalize the brand.",
            config: { layout: "grid", showRole: true },
            contentFormula: { items: { count: [2, 6], structure: "photo + name + role + brief bio" } }
          },
          { component: "Gallery", intent: "ambiance", rationale: "Interior photos help guests picture themselves there.",
            config: { layout: "masonry", columns: 3 },
            contentFormula: { items: { count: [4, 8], structure: "restaurant interior and atmosphere photos" } }
          }
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 4, required: true,
        purpose: "Reservation form, location, hours, contact info — all in one place",
        sections: [
          { component: "Hero", intent: "page-header", rationale: "Quick page header.",
            config: { variant: "compact", minHeight: "30vh" },
            contentFormula: { headline: { pattern: "Visit Us / Get In Touch", examples: ["Visit Us", "We'd Love to See You"], maxWords: 5 } }
          },
          { component: "ContactForm", intent: "reservation-form", rationale: "Reservation form is the primary conversion. Keep fields minimal: name, email, phone, date, time, party size.",
            config: { fields: ["name", "email", "phone", "date", "time", "guests", "message"] },
            contentFormula: { headline: { pattern: "Make a Reservation", examples: ["Reserve Your Table", "Book Your Visit"], maxWords: 4 } }
          },
          { component: "Features", intent: "contact-info", rationale: "Contact details in a scannable format.",
            config: { columns: 3, layout: "icons" },
            contentFormula: { items: { count: 3, structure: "icon + label + value for: Address, Phone, Hours" } }
          }
        ]
      }
    ],

    design: {
      palettes: [
        { name: "Fine Dining Dark", mood: "luxury, sophistication", primary: "#D4AF37", secondary: "#8B4513", accent: "#FFD700", background: "#1A1A1A", surface: "#2D2D2D", text: "#FFFFFF", textMuted: "#A0A0A0" },
        { name: "Modern Casual", mood: "fresh, welcoming, warm", primary: "#FF6B35", secondary: "#2D3047", accent: "#E8E9EB", background: "#FFFFFF", surface: "#F7F7F7", text: "#2D3047", textMuted: "#6B7280" },
      ],
      typography: [
        { name: "Elegant Editorial", heading: "Playfair Display", body: "Lato", headingWeight: "700", bodyWeight: "400" },
        { name: "Modern Clean", heading: "DM Sans", body: "Inter", headingWeight: "700", bodyWeight: "400" },
      ],
      layout: { borderRadius: "sm", shadowStyle: "subtle", spacing: "spacious", heroHeight: "100vh", sectionPadding: "96px" },
      imagery: { heroStyle: "Full-screen food close-up or restaurant atmosphere", sectionImages: "Professional food photography, warm lighting", teamPhotos: "Chef in kitchen, candid team moments", unsplashKeywords: ["restaurant interior", "gourmet food plating", "chef cooking", "fine dining", "cozy restaurant"] },
    },

    content: {
      toneGuide: "Warm, inviting, sensory language. Describe experiences, not just food. Use words like 'handcrafted', 'locally sourced', 'artisan', 'savor'. Avoid generic terms like 'delicious' or 'tasty'.",
      headlineRules: ["Use evocative sensory language", "Keep under 8 words", "Reference the dining experience, not just food", "Include business name when possible"],
      ctaRules: ["Action verb first", "Create exclusivity", "Never just 'Contact Us' — use 'Reserve Your Table'", "'Book' and 'Reserve' outperform 'Contact'"],
      contentDo: ["Reference specific dishes by name", "Mention sourcing (local, organic, seasonal)", "Include operating hours in multiple places", "Show real prices on menu"],
      contentDont: ["Use 'Lorem ipsum' or generic placeholder text", "Say 'delicious food' — be specific", "Hide the menu behind a PDF download", "Forget to include reservation CTA on every page"],
    },

    conversion: {
      primaryAction: "Make a reservation or order online",
      ctaPlacements: ["Hero section", "After menu showcase", "After testimonials", "Sticky mobile button"],
      trustSignals: ["Google/Yelp star rating", "Years in business", "Number of reviews", "Awards/certifications"],
      socialProof: ["Customer review quotes with ratings", "Number of happy guests served", "Media mentions or awards"],
      urgencyTactics: ["'Limited tables available tonight'", "'Reserve before we fill up'", "Show 'Open Now' badge"],
    },

    seo: {
      titlePattern: "{BusinessName} | {Cuisine} Restaurant in {City}",
      descriptionPattern: "{BusinessName} serves {cuisine} cuisine in {City}. {UniqueValue}. Reserve your table today.",
      keywordCategories: ["cuisine type", "location", "dining type", "menu items"],
      schemaTypes: ["Restaurant", "FoodEstablishment", "LocalBusiness"],
    },
  },

  // ===========================================================================
  // ⚖️ LAW FIRM / LEGAL SERVICES
  // ===========================================================================
  {
    id: "law-firm",
    name: "Law Firm & Legal Services",
    matchKeywords: ["law firm", "attorney", "lawyer", "legal", "litigation", "counsel", "paralegal", "law office", "legal services", "advocate", "solicitor", "barrister"],
    architectureRationale: "75% of lawyers see their website as their top client generator. A law firm website must answer 3 questions in under 5 seconds: What do you do? Who do you help? Why trust you? Trust is the #1 conversion factor — credentials, case results, and social proof must be above the fold. Navigation must be simple with clear paths to consultation booking.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Establish authority, build trust, and drive consultation bookings",
        sections: [
          {
            component: "Hero", intent: "hero",
            rationale: "Professional imagery with navy/dark palette signals authority. Value proposition answers 'what + who + why trust' in one screen. Consultation CTA is primary action.",
            config: { variant: "split", minHeight: "85vh", backgroundOverlay: false },
            contentFormula: {
              headline: { pattern: "[Expertise] + [Client Benefit] + You Can [Trust/Count On]", examples: ["Trusted Legal Counsel When It Matters Most", "Protecting Your Rights, Defending Your Future", "Expert Legal Guidance You Can Count On"], maxWords: 10 },
              subheadline: { pattern: "Mention experience + specialization + client focus", examples: ["With over {years} years of experience in {practice areas}, we fight for the outcomes you deserve", "Dedicated attorneys serving {city} families and businesses with integrity and results"], maxWords: 25 },
              cta: { pattern: "Schedule/Get + Free/Your + Consultation", examples: ["Schedule Your Free Consultation", "Speak to an Attorney", "Get Legal Help Now"], maxWords: 5 },
            }
          },
          {
            component: "Stats", intent: "credibility-numbers",
            rationale: "Hard numbers immediately establish credibility. Years, cases won, clients served create instant trust. This is the #1 trust-building pattern for law firms.",
            config: { columns: 4, layout: "centered" },
            contentFormula: {
              items: { count: 4, structure: "value + label: Years Experience, Cases Won, Client Satisfaction %, Free Consultations Given" },
            }
          },
          {
            component: "Features", intent: "practice-areas",
            rationale: "Practice areas as card grid lets visitors self-identify their need. Each card links to detailed service page. Icons provide visual anchoring.",
            config: { columns: 3, layout: "cards", showLearnMore: true },
            contentFormula: {
              headline: { pattern: "Our Practice Areas / How We Help", examples: ["Our Practice Areas", "How We Can Help You"], maxWords: 5 },
              items: { count: [3, 6], structure: "icon + practice area name + 20-word description + 'Learn More' link" },
            }
          },
          {
            component: "Testimonials", intent: "client-stories",
            rationale: "Client success stories are the strongest trust signal for law firms. Anonymous quotes OK per ethics rules. Show outcome, not just praise.",
            config: { layout: "grid", columns: 3, showAvatar: true, showCompany: false },
            contentFormula: {
              headline: { pattern: "What Our Clients Say / Client Stories", examples: ["What Our Clients Say", "Real Results, Real People"], maxWords: 5 },
              items: { count: 3, structure: "2-3 sentence outcome-focused testimonial + client initials + case type" },
            }
          },
          {
            component: "CTA", intent: "consultation-cta",
            rationale: "Clear, low-barrier conversion point. 'Free consultation' removes risk. Contrasting background creates visual urgency.",
            config: { variant: "split", fullWidth: true },
            contentFormula: {
              headline: { pattern: "Don't Face This Alone / Ready to Take Action?", examples: ["Don't Face This Alone", "Ready to Protect Your Rights?"], maxWords: 7 },
              subheadline: { pattern: "Offer value: free, confidential, no-obligation", examples: ["Schedule your free, confidential consultation today. No obligation, no fees until we win."], maxWords: 20 },
              cta: { pattern: "Schedule + Free + Consultation", examples: ["Schedule Free Consultation", "Call Now — Free Case Review"], maxWords: 5 },
            }
          },
        ]
      },
      {
        name: "Practice Areas", slug: "/practice-areas", priority: 2, required: true,
        purpose: "Detail each area of legal expertise with deep content for SEO and client education",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "40vh" },
            rationale: "Clean, authoritative page header.",
            contentFormula: { headline: { pattern: "Our Areas of Practice", examples: ["Areas of Practice", "Legal Services We Offer"], maxWords: 5 } } },
          { component: "Features", intent: "practice-area-grid", config: { columns: 2, layout: "detailed", showLearnMore: true },
            rationale: "Detailed practice area cards with rich descriptions for SEO. 2-column layout allows more descriptive content.",
            contentFormula: { items: { count: [4, 8], structure: "icon + practice area + detailed description + key case types + 'Free Consultation' CTA" } } },
          { component: "FAQ", intent: "legal-faq", config: { layout: "accordion" },
            rationale: "FAQ section targets long-tail SEO queries and reduces friction for hesitant prospects.",
            contentFormula: { headline: { pattern: "Common Questions", examples: ["Frequently Asked Questions", "Common Legal Questions"], maxWords: 4 }, items: { count: [5, 8], structure: "question about process/cost/timeline + comprehensive answer" } } },
          { component: "CTA", intent: "consultation-cta", config: { variant: "centered" },
            rationale: "Every page ends with consultation CTA.",
            contentFormula: { cta: { pattern: "Get Legal Help Today", examples: ["Speak to an Attorney Today"], maxWords: 5 } } }
        ]
      },
      {
        name: "Attorneys", slug: "/attorneys", priority: 3, required: true,
        purpose: "Showcase attorney credentials, education, and personality to build personal trust",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" },
            rationale: "Brief intro to the team.",
            contentFormula: { headline: { pattern: "Meet Our Attorneys", examples: ["Our Legal Team", "Meet the Attorneys"], maxWords: 4 } } },
          { component: "Team", intent: "attorney-profiles", config: { layout: "detailed-grid", showCredentials: true, showEducation: true },
            rationale: "Detailed attorney bios with credentials are the most-visited pages on law firm sites. Include education, bar admissions, and personal narrative.",
            contentFormula: { items: { count: [2, 10], structure: "professional headshot + name + title + bar admissions + education + practice focus + personal bio paragraph" } } },
          { component: "CTA", intent: "consultation-cta", config: { variant: "simple" },
            rationale: "After meeting attorneys, visitors should book a consultation.",
            contentFormula: { cta: { pattern: "Schedule a Meeting", examples: ["Schedule a Consultation"], maxWords: 4 } } }
        ]
      },
      {
        name: "About", slug: "/about", priority: 4, required: true,
        purpose: "Firm history, mission, values, and community involvement",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "50vh" },
            rationale: "Firm exterior or team photo with overlay.",
            contentFormula: { headline: { pattern: "About Our Firm", examples: ["About {name}", "Our Commitment to Justice"], maxWords: 5 } } },
          { component: "Features", intent: "firm-values", config: { columns: 3, layout: "icons" },
            rationale: "Core values (Integrity, Experience, Results) establish brand identity.",
            contentFormula: { items: { count: 3, structure: "icon + value name + explanation of what it means in practice" } } },
          { component: "Stats", intent: "firm-achievements", config: { columns: 4 },
            rationale: "Accomplishment numbers reinforce credibility.",
            contentFormula: { items: { count: 4, structure: "Cases Won, Years Practicing, Satisfied Clients, Awards Won" } } },
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 5, required: true,
        purpose: "Low-friction intake form + multiple contact methods + office location",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" },
            rationale: "Brief, professional header.",
            contentFormula: { headline: { pattern: "Contact Us", examples: ["Get in Touch", "Schedule a Consultation"], maxWords: 4 } } },
          { component: "ContactForm", intent: "intake-form", config: { fields: ["name", "email", "phone", "caseType", "message"] },
            rationale: "Intake form with minimal fields. Ask for case type to pre-qualify. Don't overwhelm with too many fields.",
            contentFormula: { headline: { pattern: "Free Case Evaluation", examples: ["Request Your Free Case Evaluation", "Tell Us About Your Case"], maxWords: 5 } } },
          { component: "Features", intent: "contact-methods", config: { columns: 3, layout: "icons" },
            rationale: "Multiple contact methods: phone, email, office address. Some clients prefer calling.",
            contentFormula: { items: { count: 3, structure: "Phone number, Email address, Office address with map link" } } }
        ]
      }
    ],

    design: {
      palettes: [
        { name: "Corporate Trust", mood: "authority, trust, professionalism", primary: "#1E3A5F", secondary: "#3B82F6", accent: "#10B981", background: "#FFFFFF", surface: "#F8FAFC", text: "#1E293B", textMuted: "#64748B" },
        { name: "Classic Prestige", mood: "tradition, gravitas, excellence", primary: "#1C1C3A", secondary: "#8B7355", accent: "#C9A96E", background: "#FAF9F7", surface: "#FFFFFF", text: "#1C1C3A", textMuted: "#6B7280" },
      ],
      typography: [
        { name: "Professional Authority", heading: "Plus Jakarta Sans", body: "Inter", headingWeight: "700", bodyWeight: "400" },
        { name: "Classic Legal", heading: "Merriweather", body: "Open Sans", headingWeight: "700", bodyWeight: "400" },
      ],
      layout: { borderRadius: "md", shadowStyle: "medium", spacing: "balanced", heroHeight: "85vh", sectionPadding: "80px" },
      imagery: { heroStyle: "Professional office or team in conference room", sectionImages: "Clean architectural photography, professional environments", teamPhotos: "Professional headshots against neutral backgrounds", unsplashKeywords: ["law office interior", "business meeting professional", "justice courthouse", "lawyer office"] },
    },

    content: {
      toneGuide: "Authoritative yet accessible. Confident but not arrogant. Use 'we' and 'your' to personalize. Emphasize experience, results, and client care. Avoid legalese in marketing copy.",
      headlineRules: ["Emphasize trust and track record", "Use 'Your' to personalize", "Avoid legal jargon in headlines", "Include outcome-oriented language"],
      ctaRules: ["Offer something free (consultation, case review)", "Low-friction entry point", "Use 'Speak to' not 'Contact'", "'Free' is the most powerful word"],
      contentDo: ["Mention specific practice areas", "Include years of experience", "Reference case results (anonymized)", "Show bar admissions and credentials"],
      contentDont: ["Use generic stock courtroom photos", "Write in legalese", "Promise specific outcomes", "Forget ethical advertising rules"],
    },

    conversion: {
      primaryAction: "Schedule a free consultation",
      ctaPlacements: ["Hero (primary CTA)", "After practice areas", "After testimonials", "Footer", "Sticky mobile CTA"],
      trustSignals: ["Bar association memberships", "Years of experience", "Case results/win rate", "Client testimonial count", "Awards and recognitions"],
      socialProof: ["Anonymized client testimonials", "Case results (within ethical guidelines)", "Media mentions", "Peer endorsements"],
      urgencyTactics: ["'Free initial consultation — limited availability'", "'Statute of limitations may apply'", "'Don't wait — protect your rights today'"],
    },

    seo: {
      titlePattern: "{BusinessName} | {PracticeArea} Attorney in {City}",
      descriptionPattern: "{BusinessName} provides expert {practice areas} legal services in {City}. {YearsExp}+ years experience. Free consultation available.",
      keywordCategories: ["practice area + city", "attorney type + location", "legal problem + solution"],
      schemaTypes: ["LegalService", "Attorney", "LocalBusiness"],
    },
  },

  // ===========================================================================
  // 🛍️ E-COMMERCE / RETAIL / ONLINE SHOP
  // ===========================================================================
  {
    id: "ecommerce",
    name: "E-commerce & Retail",
    matchKeywords: ["ecommerce", "e-commerce", "online store", "shop", "retail", "boutique", "fashion", "clothing", "accessories", "jewelry", "merchandise", "products", "sell online", "store"],
    architectureRationale: "E-commerce homepages must do 3 things: (1) Showcase best products above the fold, (2) Build trust with shipping/returns/security badges, (3) Create urgency with limited-time offers. The above-the-fold content sets the initial tone — A/B testing shows featured products + value proposition + trust badges is the winning combination. Category navigation is critical for discoverability.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Showcase products, build trust, drive shopping behavior",
        sections: [
          {
            component: "Hero", intent: "hero",
            rationale: "Featured product or seasonal collection as hero. Full-width imagery. Shop Now CTA is direct and clear. Minimal text — let the products speak.",
            config: { variant: "fullscreen", minHeight: "90vh", backgroundOverlay: true, backgroundOverlayOpacity: 30 },
            contentFormula: {
              headline: { pattern: "[Season/Collection] + [Product Type/Name]", examples: ["New Arrivals", "The Summer Collection", "Crafted for You"], maxWords: 5 },
              subheadline: { pattern: "Brief value proposition + differentiator", examples: ["Handcrafted with premium materials. Free shipping on orders over $50.", "Timeless designs that define your style"], maxWords: 15 },
              cta: { pattern: "Shop + [Now/Collection]", examples: ["Shop Now", "Explore Collection", "Shop the Sale"], maxWords: 3 },
            }
          },
          {
            component: "Features", intent: "trust-badges",
            rationale: "Trust badges IMMEDIATELY after hero. Free shipping, easy returns, secure checkout, 24/7 support. Research shows trust badges increase conversion by 42%.",
            config: { columns: 4, layout: "icons", compact: true },
            contentFormula: {
              items: { count: 4, structure: "icon + 3-word badge: Free Shipping, Easy Returns, Secure Checkout, 24/7 Support" },
            }
          },
          {
            component: "Gallery", intent: "product-categories",
            rationale: "Category cards with lifestyle images. 3-4 categories max for clarity. Each links to category page. Portrait aspect ratio works best for fashion.",
            config: { layout: "grid", columns: 3, aspectRatio: "portrait", showCaptions: true, hoverEffect: "zoom" },
            contentFormula: {
              headline: { pattern: "Shop by Category", examples: ["Shop by Category", "Browse Collections"], maxWords: 4 },
              items: { count: [3, 4], structure: "lifestyle category image + category name + 'Shop Now' link" },
            }
          },
          {
            component: "Gallery", intent: "featured-products",
            rationale: "4-8 best-selling products in a clean grid. Show name, price, and quick-add option. Social proof: 'Best Seller' badges increase clicks by 20%.",
            config: { layout: "grid", columns: 4, showCaptions: true, showPrices: true },
            contentFormula: {
              headline: { pattern: "Best Sellers / Featured Products", examples: ["Best Sellers", "Most Loved", "Customer Favorites"], maxWords: 3 },
              items: { count: [4, 8], structure: "product photo + name + price + 'Best Seller' badge if applicable" },
            }
          },
          {
            component: "Testimonials", intent: "customer-reviews",
            rationale: "Product reviews with star ratings. Show product name in review for context. UGC (user-generated content) builds authenticity.",
            config: { layout: "carousel", showRating: true, showProductName: true },
            contentFormula: {
              headline: { pattern: "Loved by Customers / Reviews", examples: ["What Customers Say", "Loved by Thousands"], maxWords: 4 },
              items: { count: [3, 6], structure: "star rating + review text + reviewer name + product purchased" },
            }
          },
          {
            component: "CTA", intent: "newsletter-signup",
            rationale: "Newsletter CTA with discount incentive. '10% off first order' is the proven formula. Dark background contrasts with rest of page.",
            config: { variant: "newsletter", fullWidth: true },
            contentFormula: {
              headline: { pattern: "Join + Our + Community/List", examples: ["Join the {name} Family", "Stay in the Loop"], maxWords: 6 },
              subheadline: { pattern: "Offer incentive", examples: ["Sign up and get 10% off your first order. Plus, be first to know about new arrivals and exclusive deals."], maxWords: 20 },
              cta: { pattern: "Subscribe / Sign Up", examples: ["Get 10% Off", "Subscribe"], maxWords: 3 },
            }
          },
        ]
      },
      {
        name: "Shop", slug: "/shop", priority: 2, required: true,
        purpose: "Full product catalog with filtering and sorting",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" },
            rationale: "Minimal header to maximize product visibility.",
            contentFormula: { headline: { pattern: "All Products / Shop", examples: ["Shop All", "Our Collection"], maxWords: 3 } } },
          { component: "Gallery", intent: "product-grid", config: { layout: "grid", columns: 4, showPrices: true, showFilters: true },
            rationale: "Product grid with filter sidebar. Baymard research: filter UX is critical — show category, price range, and sort options.",
            contentFormula: { items: { count: [12, 24], structure: "product image + name + price + rating + quick-add button" } } },
        ]
      },
      {
        name: "About", slug: "/about", priority: 3, required: false,
        purpose: "Brand story, mission, quality commitment",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "60vh" },
            rationale: "Brand story with founder photo or behind-the-scenes image.",
            contentFormula: { headline: { pattern: "Our Story", examples: ["Our Story", "Built with Purpose"], maxWords: 4 } } },
          { component: "Features", intent: "brand-values", config: { columns: 3, layout: "icons" },
            rationale: "Brand pillars: Quality, Sustainability, Community, etc.",
            contentFormula: { items: { count: 3, structure: "icon + value name + 20-word description" } } },
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 4, required: true,
        purpose: "Customer support, FAQ, shipping/returns info",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" },
            rationale: "Customer service header.",
            contentFormula: { headline: { pattern: "Get in Touch / Help", examples: ["How Can We Help?", "Contact Us"], maxWords: 4 } } },
          { component: "FAQ", intent: "shipping-faq", config: { layout: "accordion" },
            rationale: "Shipping, returns, sizing FAQ reduces support tickets by 30%.",
            contentFormula: { items: { count: [5, 8], structure: "Q about shipping/returns/sizing + comprehensive answer" } } },
          { component: "ContactForm", intent: "support-form", config: { fields: ["name", "email", "orderNumber", "subject", "message"] },
            rationale: "Support form with order number field.",
            contentFormula: { headline: { pattern: "Send Us a Message", examples: ["Get in Touch"], maxWords: 4 } } },
        ]
      },
    ],

    design: {
      palettes: [
        { name: "Minimal Luxury", mood: "clean, premium, aspirational", primary: "#000000", secondary: "#F5F5F5", accent: "#E63946", background: "#FFFFFF", surface: "#FAFAFA", text: "#1A1A1A", textMuted: "#666666" },
        { name: "Warm Boutique", mood: "friendly, artisan, curated", primary: "#8B5E3C", secondary: "#F4E8D8", accent: "#D4956A", background: "#FFFAF5", surface: "#FFFFFF", text: "#2C2C2C", textMuted: "#7A7A7A" },
      ],
      typography: [
        { name: "Clean Modern", heading: "DM Sans", body: "Inter", headingWeight: "600", bodyWeight: "400" },
        { name: "Luxury Minimal", heading: "Cormorant Garamond", body: "Lato", headingWeight: "500", bodyWeight: "400" },
      ],
      layout: { borderRadius: "none", shadowStyle: "subtle", spacing: "spacious", heroHeight: "90vh", sectionPadding: "80px" },
      imagery: { heroStyle: "Full-width lifestyle or product photography", sectionImages: "Consistent product photography on white/neutral backgrounds", teamPhotos: "Behind-the-scenes, artisan process", unsplashKeywords: ["fashion flatlay", "product photography minimal", "boutique interior", "shopping lifestyle"] },
    },

    content: {
      toneGuide: "Aspirational yet accessible. Let products be the star. Minimal copy — 2-3 words for headlines. Inviting, not pushy. Focus on quality and craftsmanship over hard selling.",
      headlineRules: ["Ultra minimal — 2-3 words maximum", "Let imagery do the talking", "Avoid 'Buy Now' — use 'Shop Now' or 'Explore'", "Focus on lifestyle, not transactions"],
      ctaRules: ["'Shop Now' outperforms 'Buy Now'", "Single action per section", "Don't split attention with multiple CTAs", "'Explore' works for browse-intent visitors"],
      contentDo: ["Show prices clearly", "Include product dimensions/sizes", "Feature best sellers prominently", "Offer free shipping threshold"],
      contentDont: ["Use pop-ups that block mobile browsing", "Hide return policy", "Use low-quality product images", "Overwhelm with too many categories"],
    },

    conversion: {
      primaryAction: "Add to cart / Shop products",
      ctaPlacements: ["Hero Shop CTA", "Category cards", "Featured product section", "Newsletter with discount"],
      trustSignals: ["Secure checkout badge", "Free shipping over $X", "Easy 30-day returns", "Customer review count"],
      socialProof: ["Product review stars", "Customer photos/UGC", "Number of customers served", "'X people are viewing this'"],
      urgencyTactics: ["'Limited edition — only X left'", "'Sale ends tonight'", "'Free shipping ends today'"],
    },

    seo: {
      titlePattern: "{BusinessName} | {ProductCategory} — Shop Online",
      descriptionPattern: "Shop {product types} at {BusinessName}. {value proposition}. Free shipping over ${amount}.",
      keywordCategories: ["product type", "brand + product", "buy + category + online"],
      schemaTypes: ["Store", "Product", "Organization"],
    },
  },

  // ===========================================================================
  // 💻 SAAS / TECHNOLOGY / SOFTWARE
  // ===========================================================================
  {
    id: "saas",
    name: "SaaS & Technology",
    matchKeywords: ["saas", "software", "app", "platform", "tech", "startup", "technology", "api", "tool", "solution", "cloud", "automation", "dashboard", "analytics"],
    architectureRationale: "Best SaaS websites (Stripe, Linear, Vercel) share a pattern: clarity > complexity. Hero must communicate the value proposition in under 6 words. Product screenshot/demo above the fold. Logo cloud for social proof. Feature sections show, don't tell. Pricing must be transparent with a highlighted recommended plan. Removing friction is the #1 priority.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Communicate value proposition, show product, drive signups",
        sections: [
          {
            component: "Hero", intent: "hero",
            rationale: "Centered value proposition + product screenshot. Clear headline (6 words or less). Social proof badge below CTA ('Trusted by 10,000+ teams'). Two CTAs: primary (Start Free) + secondary (Watch Demo).",
            config: { variant: "centered", minHeight: "85vh", backgroundOverlay: false },
            contentFormula: {
              headline: { pattern: "[Verb] + [Object] + [Better/Faster/Smarter]", examples: ["Build Websites That Convert", "Manage Your Team, Effortlessly", "Ship Products Faster"], maxWords: 6 },
              subheadline: { pattern: "Expand with specific benefit + target user", examples: ["{name} helps {target audience} {key benefit} without {pain point}.", "The all-in-one platform for teams who want to {outcome}."], maxWords: 20 },
              cta: { pattern: "Start + Free / Get Started", examples: ["Start Free Trial", "Get Started Free", "Try for Free"], maxWords: 4 },
            }
          },
          {
            component: "Features", intent: "logo-cloud",
            rationale: "Logo cloud immediately after hero. 'Trusted by' followed by 5-8 recognizable logos. This is the #1 trust-building pattern for SaaS.",
            config: { columns: 6, layout: "logos", compact: true },
            contentFormula: {
              headline: { pattern: "Trusted by [X]+ teams/companies", examples: ["Trusted by 10,000+ Teams", "Used by Leading Companies"], maxWords: 6 },
              items: { count: [5, 8], structure: "company logo + company name" },
            }
          },
          {
            component: "Features", intent: "key-features",
            rationale: "3 key features with icons + screenshots. Alternating layout (text left + image right, then flipped) creates visual rhythm. Each feature highlights a benefit, not a specification.",
            config: { columns: 3, layout: "cards", showScreenshots: true },
            contentFormula: {
              headline: { pattern: "Everything you need to [outcome]", examples: ["Everything You Need to Scale", "Built for Modern Teams"], maxWords: 7 },
              items: { count: 3, structure: "icon + feature name (3 words) + benefit description (20 words) + optional product screenshot" },
            }
          },
          {
            component: "Stats", intent: "social-proof-numbers",
            rationale: "Key metrics: users, uptime, time saved, revenue generated. Count-up animation adds engagement.",
            config: { columns: 4, layout: "centered" },
            contentFormula: {
              items: { count: 4, structure: "value + label: Active Users, Uptime %, Time Saved, Customer Rating" },
            }
          },
          {
            component: "Testimonials", intent: "customer-stories",
            rationale: "Customer quotes with company names and roles. B2B buyers trust peer recommendations. Show diverse use cases.",
            config: { layout: "grid", columns: 3, showCompany: true, showRole: true, showAvatar: true },
            contentFormula: {
              headline: { pattern: "Loved by [Teams/Builders/Creators]", examples: ["Loved by Teams Worldwide", "What Our Customers Say"], maxWords: 5 },
              items: { count: 3, structure: "testimonial quote + person name + role + company name + avatar" },
            }
          },
          {
            component: "Pricing", intent: "pricing-preview",
            rationale: "Pricing transparency builds trust. Show 3 plans with highlighted recommended. Annual/monthly toggle. Free tier reduces signup friction.",
            config: { columns: 3, highlightedPlan: "middle", showToggle: true },
            contentFormula: {
              headline: { pattern: "Simple, Transparent Pricing", examples: ["Simple, Transparent Pricing", "Plans for Every Team"], maxWords: 5 },
              items: { count: 3, structure: "plan name + price + billing period + features list + CTA" },
            }
          },
          {
            component: "FAQ", intent: "common-questions",
            rationale: "FAQ reduces support burden and addresses objections before signup.",
            config: { layout: "accordion", columns: 2 },
            contentFormula: {
              items: { count: [5, 8], structure: "common question about features/pricing/security + helpful answer" },
            }
          },
          {
            component: "CTA", intent: "final-cta",
            rationale: "Final CTA reinforces value prop. Minimal text, clear action.",
            config: { variant: "centered", fullWidth: true },
            contentFormula: {
              headline: { pattern: "Ready to [outcome]?", examples: ["Ready to Get Started?", "Start Building Today"], maxWords: 5 },
              cta: { pattern: "Start Free / Get Started", examples: ["Start Your Free Trial", "Get Started Now"], maxWords: 4 },
            }
          },
        ]
      },
      {
        name: "Features", slug: "/features", priority: 2, required: true,
        purpose: "Deep-dive into product capabilities with screenshots and details",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "centered", minHeight: "40vh" },
            rationale: "Clean feature page header.",
            contentFormula: { headline: { pattern: "Powerful Features", examples: ["Powerful Features for Modern Teams", "Everything You Need"], maxWords: 6 } } },
          { component: "Features", intent: "feature-grid", config: { columns: 3, layout: "detailed" },
            rationale: "Comprehensive feature grid. Each feature: icon + title + description + optional screenshot.",
            contentFormula: { items: { count: [6, 12], structure: "icon + feature name + detailed description + screenshot if applicable" } } },
          { component: "CTA", intent: "try-it-cta", config: { variant: "centered" },
            rationale: "After seeing features, visitors are ready to try.",
            contentFormula: { cta: { pattern: "Try It Free", examples: ["Start Your Free Trial"], maxWords: 4 } } }
        ]
      },
      {
        name: "Pricing", slug: "/pricing", priority: 3, required: true,
        purpose: "Transparent pricing with plan comparison",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" },
            rationale: "Pricing page header — minimal.",
            contentFormula: { headline: { pattern: "Choose Your Plan", examples: ["Simple, Transparent Pricing"], maxWords: 5 } } },
          { component: "Pricing", intent: "pricing-plans", config: { columns: 3, highlightedPlan: "middle", showComparison: true },
            rationale: "Full pricing comparison with feature matrix.",
            contentFormula: { items: { count: 3, structure: "plan name + price/mo + features + CTA + 'Most Popular' badge on recommended" } } },
          { component: "FAQ", intent: "pricing-faq", config: { layout: "accordion" },
            rationale: "Pricing-specific FAQ: free trial, billing, upgrades, cancellation.",
            contentFormula: { items: { count: [4, 6], structure: "billing/upgrade/cancellation question + clear answer" } } }
        ]
      },
      {
        name: "About", slug: "/about", priority: 4, required: false,
        purpose: "Company story, team, mission",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "centered", minHeight: "50vh" },
            rationale: "Company mission as hero.",
            contentFormula: { headline: { pattern: "Our Mission", examples: ["We're Building the Future of {domain}"], maxWords: 8 } } },
          { component: "Team", intent: "founding-team", config: { layout: "grid" },
            rationale: "Team photos with roles — humanizes the brand.",
            contentFormula: { items: { count: [3, 12], structure: "photo + name + role + optional bio" } } },
          { component: "Stats", intent: "company-stats", config: { columns: 4 },
            rationale: "Company metrics: founded year, team size, countries, customers.",
            contentFormula: { items: { count: 4, structure: "Founded, Team Members, Countries, Customers Served" } } }
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 5, required: true,
        purpose: "Sales contact and support",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" },
            rationale: "Contact page header.",
            contentFormula: { headline: { pattern: "Talk to Us", examples: ["Let's Talk", "Get in Touch"], maxWords: 4 } } },
          { component: "ContactForm", intent: "sales-form", config: { fields: ["name", "email", "company", "teamSize", "message"] },
            rationale: "Sales inquiry form — company + team size helps qualify leads.",
            contentFormula: { headline: { pattern: "Contact Sales", examples: ["Talk to Our Team", "Request a Demo"], maxWords: 4 } } },
        ]
      },
    ],

    design: {
      palettes: [
        { name: "Clean Modern", mood: "professional, trustworthy, modern", primary: "#2563EB", secondary: "#1E40AF", accent: "#3B82F6", background: "#FFFFFF", surface: "#F8FAFC", text: "#1F2937", textMuted: "#6B7280" },
        { name: "Dark Tech", mood: "premium, innovative, bold", primary: "#7C3AED", secondary: "#4F46E5", accent: "#A78BFA", background: "#0F172A", surface: "#1E293B", text: "#F8FAFC", textMuted: "#94A3B8" },
      ],
      typography: [
        { name: "Tech Modern", heading: "Inter", body: "Inter", headingWeight: "700", bodyWeight: "400" },
        { name: "Geometric Clean", heading: "Poppins", body: "Inter", headingWeight: "600", bodyWeight: "400" },
      ],
      layout: { borderRadius: "lg", shadowStyle: "soft", spacing: "spacious", heroHeight: "85vh", sectionPadding: "96px" },
      imagery: { heroStyle: "Product screenshot or abstract gradient background", sectionImages: "Product UI screenshots, feature illustrations", teamPhotos: "Casual team photos, office environment", unsplashKeywords: ["minimal tech workspace", "dashboard interface", "team collaboration office", "modern startup"] },
    },

    content: {
      toneGuide: "Clear, confident, benefit-focused. Show, don't tell. No jargon. Write like Stripe or Linear — minimal words, maximum clarity. Every sentence must earn its place.",
      headlineRules: ["6 words or fewer", "Verb-object-outcome pattern", "No buzzwords or jargon", "Focus on outcome, not feature"],
      ctaRules: ["'Start Free' outperforms 'Sign Up'", "Include 'Free' in CTA", "Secondary CTA: 'Watch Demo' or 'Learn More'", "Never 'Submit' — use action words"],
      contentDo: ["Show product screenshots", "Include specific metrics", "Be transparent about pricing", "Show real customer logos"],
      contentDont: ["Use meaningless buzzwords like 'synergy'", "Hide pricing behind 'Contact Sales'", "Write walls of text", "Use stock photos of people pointing at screens"],
    },

    conversion: {
      primaryAction: "Start a free trial",
      ctaPlacements: ["Hero (primary + secondary CTA)", "After features", "Pricing section", "Final bottom CTA"],
      trustSignals: ["Customer logos", "Uptime percentage", "Security certifications", "G2/Capterra ratings"],
      socialProof: ["Customer count", "Company logos", "Testimonials with roles", "Case study stats"],
      urgencyTactics: ["'Free for teams up to 5'", "'No credit card required'", "'Get started in 2 minutes'"],
    },

    seo: {
      titlePattern: "{BusinessName} | {PrimaryBenefit} Platform",
      descriptionPattern: "{BusinessName} helps {target audience} {key benefit}. {Feature highlights}. Start free today.",
      keywordCategories: ["product type + software", "alternative to + competitor", "best + category + tool"],
      schemaTypes: ["SoftwareApplication", "Organization", "Product"],
    },
  },

  // ===========================================================================
  // 🏥 HEALTHCARE / MEDICAL / DENTAL
  // ===========================================================================
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    matchKeywords: ["healthcare", "medical", "doctor", "clinic", "hospital", "dental", "dentist", "therapy", "therapist", "physician", "pediatric", "dermatology", "orthopedic", "optometry", "veterinary", "vet", "chiropractic", "physiotherapy"],
    architectureRationale: "Healthcare websites must balance professionalism with warmth. Patients are often anxious when searching for care — the website must feel trustworthy and calming. Easy appointment booking is critical (online scheduling reduces no-shows by 30%). Provider credentials build trust. HIPAA compliance and accessibility (ADA) are mandatory considerations.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Build patient trust, enable easy appointment booking, showcase services",
        sections: [
          { component: "Hero", intent: "hero",
            rationale: "Caring, professional hero image (not sterile). Calm color palette. Book Appointment as primary CTA. Show trust badge: 'Accepting New Patients'.",
            config: { variant: "split", minHeight: "85vh", backgroundOverlay: false },
            contentFormula: { headline: { pattern: "[Patient-centered] + [Care/Health] + You Can [Trust/Rely On]", examples: ["Compassionate Care You Can Trust", "Your Health, Our Priority", "Expert Care for Your Family"], maxWords: 8 }, subheadline: { pattern: "Mention specialties + patient focus", examples: ["Providing comprehensive {specialty} care for {city} families. Same-day appointments available."], maxWords: 20 }, cta: { pattern: "Book/Schedule + Appointment", examples: ["Book an Appointment", "Schedule Your Visit", "Request Appointment"], maxWords: 4 } }
          },
          { component: "BookingWidget", intent: "quick-appointment",
            rationale: "Inline appointment booking widget reduces scheduling friction. Online scheduling reduces no-shows by 30%. Patients can pick provider, service, date/time without navigating away. Critical for conversion — 65% of patients prefer online booking.",
            config: { variant: "inline", compact: true, showServices: true, showStaff: true, showDate: true },
            contentFormula: { headline: { pattern: "Book Your Appointment", examples: ["Schedule Your Visit", "Book an Appointment Online"], maxWords: 4 } }
          },
          { component: "Features", intent: "services-overview",
            rationale: "3-6 service cards with icons. Each links to detailed service page. Clean, easy to scan.",
            config: { columns: 3, layout: "cards", showLearnMore: true },
            contentFormula: { headline: { pattern: "Our Services / What We Treat", examples: ["Our Services", "How We Can Help"], maxWords: 4 }, items: { count: [3, 6], structure: "icon + service name + 15-word description + 'Learn More' link" } }
          },
          { component: "Stats", intent: "trust-numbers",
            rationale: "Credibility metrics: years in practice, patients served, providers on staff.",
            config: { columns: 4 },
            contentFormula: { items: { count: 4, structure: "Years of Experience, Patients Served, Providers on Staff, Patient Satisfaction %" } }
          },
          { component: "Team", intent: "providers",
            rationale: "Provider photos with credentials. Patients want to see who will treat them.",
            config: { layout: "grid", showRole: true, showCredentials: true },
            contentFormula: { headline: { pattern: "Meet Our Providers / Your Care Team", examples: ["Meet Your Care Team", "Our Providers"], maxWords: 4 }, items: { count: [2, 6], structure: "professional headshot + name + credentials (MD/DDS) + specialty + brief bio" } }
          },
          { component: "Testimonials", intent: "patient-reviews",
            rationale: "Patient testimonials build emotional trust. Focus on experience, not medical outcomes.",
            config: { layout: "carousel", showRating: true },
            contentFormula: { headline: { pattern: "What Patients Say", examples: ["Patient Testimonials", "What Our Patients Say"], maxWords: 4 }, items: { count: 3, structure: "patient review about care experience + first name + star rating" } }
          },
          { component: "CTA", intent: "appointment-cta",
            rationale: "Final appointment CTA. Reinforce ease: 'online scheduling, same-day appointments'.",
            config: { variant: "centered", fullWidth: true },
            contentFormula: { headline: { pattern: "Ready to Schedule? / Your Health Can't Wait", examples: ["Your Health Can't Wait", "Schedule Your Appointment Today"], maxWords: 6 }, cta: { pattern: "Book Now", examples: ["Book Your Appointment", "Schedule Now"], maxWords: 4 } }
          },
        ]
      },
      {
        name: "Services", slug: "/services", priority: 2, required: true,
        purpose: "Detailed service pages for SEO and patient education",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" }, rationale: "Services overview header.", contentFormula: { headline: { pattern: "Our Services", examples: ["Our Medical Services", "Treatments We Offer"], maxWords: 4 } } },
          { component: "Features", intent: "service-detail", config: { columns: 2, layout: "detailed" }, rationale: "Detailed service descriptions. 2-column for depth.", contentFormula: { items: { count: [4, 8], structure: "service name + detailed description + conditions treated + 'Book Appointment' CTA" } } },
          { component: "CTA", intent: "book-cta", config: { variant: "centered" }, rationale: "Book appointment after reviewing services.", contentFormula: { cta: { pattern: "Book an Appointment", examples: ["Schedule Your Visit"], maxWords: 4 } } }
        ]
      },
      {
        name: "About", slug: "/about", priority: 3, required: true,
        purpose: "Practice history, philosophy of care, facility info",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "50vh" }, rationale: "Warm facility/team photo.", contentFormula: { headline: { pattern: "About Our Practice", examples: ["About {name}", "Our Commitment to Your Health"], maxWords: 5 } } },
          { component: "Features", intent: "care-philosophy", config: { columns: 3, layout: "icons" }, rationale: "Care philosophy pillars.", contentFormula: { items: { count: 3, structure: "Patient-Centered Care, Evidence-Based Medicine, Compassionate Team" } } },
          { component: "Gallery", intent: "facility-photos", config: { layout: "grid", columns: 3 }, rationale: "Modern facility photos reduce patient anxiety.", contentFormula: { items: { count: [3, 6], structure: "clean, modern facility photos — waiting room, exam rooms, equipment" } } }
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 4, required: true,
        purpose: "Appointment booking, location, hours, insurance info",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" }, rationale: "Contact header.", contentFormula: { headline: { pattern: "Contact Us", examples: ["Schedule Your Visit", "Contact Our Office"], maxWords: 4 } } },
          { component: "ContactForm", intent: "appointment-form", config: { fields: ["name", "email", "phone", "preferredDate", "reason", "insurance", "message"] }, rationale: "Appointment request form — include insurance field.", contentFormula: { headline: { pattern: "Request an Appointment", examples: ["Request Your Appointment", "Book Online"], maxWords: 4 } } },
          { component: "Features", intent: "office-info", config: { columns: 3, layout: "icons" }, rationale: "Office hours, location, phone — all visible.", contentFormula: { items: { count: 3, structure: "Address + Map, Phone + Fax, Office Hours" } } }
        ]
      }
    ],

    design: {
      palettes: [
        { name: "Calm Medical", mood: "trustworthy, clean, calming", primary: "#0EA5E9", secondary: "#0284C7", accent: "#10B981", background: "#FFFFFF", surface: "#F0F9FF", text: "#0F172A", textMuted: "#64748B" },
        { name: "Warm Care", mood: "warm, approachable, professional", primary: "#2563EB", secondary: "#1D4ED8", accent: "#F59E0B", background: "#FFFBF5", surface: "#FFFFFF", text: "#1E293B", textMuted: "#64748B" },
      ],
      typography: [
        { name: "Clean Medical", heading: "Plus Jakarta Sans", body: "Inter", headingWeight: "600", bodyWeight: "400" },
        { name: "Friendly Care", heading: "Nunito", body: "Nunito Sans", headingWeight: "700", bodyWeight: "400" },
      ],
      layout: { borderRadius: "lg", shadowStyle: "soft", spacing: "spacious", heroHeight: "85vh", sectionPadding: "80px" },
      imagery: { heroStyle: "Caring doctor-patient interaction or modern facility", sectionImages: "Clean medical environments, friendly staff interactions", teamPhotos: "Professional headshots with white coats, warm expressions", unsplashKeywords: ["doctor patient caring", "modern medical office", "dental clinic clean", "healthcare team"] },
    },

    content: {
      toneGuide: "Warm, caring, professional. Patient-centered language — 'Your health', 'Your family'. Avoid clinical jargon in marketing copy. Be reassuring, not scary. Emphasize convenience (online booking, same-day appointments).",
      headlineRules: ["Patient-centered — use 'Your'", "Emphasize care and trust", "Keep it warm, not clinical", "Include convenience messaging"],
      ctaRules: ["'Book Appointment' is clearest", "Include 'Same-day appointments available'", "Show phone number prominently", "Multiple booking channels"],
      contentDo: ["List accepted insurance plans", "Show provider credentials", "Include office hours prominently", "Mention ADA accessibility"],
      contentDont: ["Use scary medical imagery", "Write in clinical jargon", "Forget HIPAA considerations", "Use stock photos of empty hospitals"],
    },

    conversion: {
      primaryAction: "Book an appointment",
      ctaPlacements: ["Hero", "After services", "Provider profiles", "Footer", "Sticky mobile button"],
      trustSignals: ["Provider credentials (MD, DDS, etc.)", "Years in practice", "Patient satisfaction score", "Board certifications", "Insurance accepted"],
      socialProof: ["Patient review stars", "Number of patients served", "Google review rating", "Awards and recognitions"],
      urgencyTactics: ["'Accepting new patients'", "'Same-day appointments available'", "'Call now — our team is ready to help'"],
    },

    seo: {
      titlePattern: "{BusinessName} | {Specialty} in {City}",
      descriptionPattern: "{BusinessName} provides {specialty} care in {City}. {Credentials}. Book your appointment today. Accepting new patients.",
      keywordCategories: ["specialty + near me", "doctor/dentist + city", "condition + treatment"],
      schemaTypes: ["MedicalBusiness", "Physician", "Dentist", "LocalBusiness"],
    },
  },

  // ===========================================================================
  // 🎨 PORTFOLIO / CREATIVE / FREELANCER
  // ===========================================================================
  {
    id: "portfolio",
    name: "Portfolio & Creative",
    matchKeywords: ["portfolio", "creative", "designer", "photographer", "artist", "freelancer", "studio", "agency", "illustrator", "videographer", "animator", "graphic design", "web designer", "ux designer"],
    architectureRationale: "Portfolio websites must let the WORK speak first. Minimal text, maximum visual impact. The work grid is the hero. Bold typography as design element. Dark themes perform well for visual creatives. Quick access to contact/hire is essential — these visitors are potential clients.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Showcase best work, establish creative identity, enable hiring",
        sections: [
          { component: "Hero", intent: "hero",
            rationale: "Bold statement hero. Large typography IS the design. Minimal — name + tagline + CTA. Dark background makes work pop when scrolling down.",
            config: { variant: "fullscreen", minHeight: "100vh" },
            contentFormula: { headline: { pattern: "I [Create/Design/Build] + [Type of Work]", examples: ["I Create Digital Experiences", "Design That Speaks Volumes", "Building Brands That Matter"], maxWords: 6 }, subheadline: { pattern: "Role + specialization", examples: ["{Role} specializing in {specialty} for {clients}", "Freelance {role} crafting {type} for ambitious brands"], maxWords: 15 }, cta: { pattern: "View Work / Hire Me", examples: ["View My Work", "See the Portfolio", "Let's Work Together"], maxWords: 4 } }
          },
          { component: "Gallery", intent: "featured-work",
            rationale: "3-6 best projects in a visual grid. Large images. Minimal text — just project name. Hover reveals brief description. This IS the portfolio site's main content.",
            config: { layout: "masonry", columns: 2, hoverEffect: "zoom", showCaptions: true },
            contentFormula: { headline: { pattern: "Selected Work / Portfolio", examples: ["Selected Work", "Recent Projects"], maxWords: 3 }, items: { count: [4, 6], structure: "project image + project name + client name + category" } }
          },
          { component: "Features", intent: "services",
            rationale: "Services offered — 3-4 key capabilities. Clean, numbered list format works well for creative portfolios.",
            config: { columns: 3, layout: "minimal" },
            contentFormula: { headline: { pattern: "What I Do / Services", examples: ["What I Do", "Services"], maxWords: 3 }, items: { count: [3, 4], structure: "number/icon + service name + 15-word description" } }
          },
          { component: "Testimonials", intent: "client-praise",
            rationale: "Client testimonials validate creative quality. Show client name + company for credibility.",
            config: { layout: "minimal", showCompany: true },
            contentFormula: { items: { count: [2, 4], structure: "short praise quote + client name + company + project type" } }
          },
          { component: "CTA", intent: "hire-cta",
            rationale: "Clear hiring CTA. 'Let's work together' is warmer than 'Contact me'.",
            config: { variant: "minimal", fullWidth: true },
            contentFormula: { headline: { pattern: "Have a project in mind?", examples: ["Have a Project in Mind?", "Let's Create Something Great"], maxWords: 6 }, cta: { pattern: "Get in Touch / Start a Project", examples: ["Start a Project", "Let's Talk"], maxWords: 4 } }
          },
        ]
      },
      {
        name: "Work", slug: "/work", priority: 2, required: true,
        purpose: "Complete portfolio with all projects",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "minimal", minHeight: "30vh" }, rationale: "Minimal header.", contentFormula: { headline: { pattern: "All Work", examples: ["All Work", "Portfolio"], maxWords: 2 } } },
          { component: "Gallery", intent: "full-portfolio", config: { layout: "masonry", columns: 3, showFilters: true }, rationale: "Full project grid with category filters.", contentFormula: { items: { count: [8, 20], structure: "project image + name + category + year" } } },
        ]
      },
      {
        name: "About", slug: "/about", priority: 3, required: true,
        purpose: "Personal story, skills, process",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "60vh" }, rationale: "Personal photo + intro text.", contentFormula: { headline: { pattern: "About / Hello", examples: ["Hello, I'm {name}", "About Me"], maxWords: 5 } } },
          { component: "Features", intent: "skills-tools", config: { columns: 4, layout: "icons" }, rationale: "Skills and tools used.", contentFormula: { items: { count: [4, 8], structure: "tool/skill icon + name" } } },
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 4, required: true,
        purpose: "Simple contact with availability status",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "minimal", minHeight: "30vh" }, rationale: "Contact header.", contentFormula: { headline: { pattern: "Get in Touch", examples: ["Let's Connect", "Say Hello"], maxWords: 3 } } },
          { component: "ContactForm", intent: "project-inquiry", config: { fields: ["name", "email", "projectType", "budget", "timeline", "message"] }, rationale: "Project inquiry form. Include budget and timeline to pre-qualify.", contentFormula: { headline: { pattern: "Start a Project", examples: ["Tell Me About Your Project"], maxWords: 5 } } },
        ]
      },
    ],

    design: {
      palettes: [
        { name: "Bold Dark", mood: "creative, bold, high-impact", primary: "#000000", secondary: "#FF3366", accent: "#00FF88", background: "#0A0A0A", surface: "#1A1A1A", text: "#FFFFFF", textMuted: "#888888" },
        { name: "Clean Light", mood: "minimal, refined, professional", primary: "#111111", secondary: "#666666", accent: "#0066FF", background: "#FFFFFF", surface: "#F5F5F5", text: "#111111", textMuted: "#999999" },
      ],
      typography: [
        { name: "Bold Geometric", heading: "Space Grotesk", body: "Inter", headingWeight: "700", bodyWeight: "400" },
        { name: "Refined Modern", heading: "DM Sans", body: "DM Sans", headingWeight: "500", bodyWeight: "400" },
      ],
      layout: { borderRadius: "none", shadowStyle: "none", spacing: "spacious", heroHeight: "100vh", sectionPadding: "96px" },
      imagery: { heroStyle: "Large typography on dark/bold background, or best project as fullscreen", sectionImages: "High-quality project screenshots and mockups", teamPhotos: "Candid creative process or professional portrait", unsplashKeywords: ["creative workspace", "design process", "minimal studio", "art direction"] },
    },

    content: {
      toneGuide: "Confident, not arrogant. First person OK. Brief and punchy. Let the work do the talking. Every word must earn its place. Be memorable.",
      headlineRules: ["Short and memorable — 3-5 words", "First person is OK for personal portfolios", "Be confident", "Use action verbs"],
      ctaRules: ["'Let's work together' > 'Contact me'", "'Start a project' > 'Hire me'", "Show availability status", "Include project inquiry form"],
      contentDo: ["Lead with the work", "Show diverse project types", "Include client names if allowed", "Keep bio under 100 words"],
      contentDont: ["Write long paragraphs nobody reads", "Use generic stock imagery", "List every tool you've ever used", "Hide contact info"],
    },

    conversion: {
      primaryAction: "Start a project / Hire",
      ctaPlacements: ["Hero", "After portfolio grid", "Final bottom CTA"],
      trustSignals: ["Client logos", "Project count", "Years of experience", "Awards"],
      socialProof: ["Client testimonials", "Featured in / press mentions", "Award badges", "Client logos"],
      urgencyTactics: ["'Currently accepting new projects'", "'Limited availability in {month}'", "'Book a call'"],
    },

    seo: {
      titlePattern: "{Name} | {Role} — Portfolio",
      descriptionPattern: "{Name} is a {role} specializing in {specialty}. View {type} projects and get in touch to start your project.",
      keywordCategories: ["role + city", "specialty + portfolio", "freelance + skill"],
      schemaTypes: ["Person", "CreativeWork", "ProfessionalService"],
    },
  },

  // ===========================================================================
  // 🏋️ FITNESS / GYM / WELLNESS / SPA
  // ===========================================================================
  {
    id: "fitness",
    name: "Fitness, Gym & Wellness",
    matchKeywords: ["fitness", "gym", "workout", "training", "crossfit", "yoga", "pilates", "personal trainer", "spa", "wellness", "salon", "beauty", "massage", "skincare", "barber", "hair", "nails"],
    architectureRationale: "Fitness/wellness websites must match the ENERGY of the brand. Gyms: bold, dynamic, motivational. Spas: serene, calming, luxurious. Both need: easy class/appointment booking, pricing transparency, trainer/staff profiles, and transformation stories (social proof). Mobile booking is critical — 60%+ of fitness booking happens on mobile.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Inspire action, showcase offerings, drive membership/booking",
        sections: [
          { component: "Hero", intent: "hero",
            rationale: "Motivational hero with dynamic imagery (gym) or serene imagery (spa). Full-screen with strong overlay. CTA drives signup or booking.",
            config: { variant: "fullscreen", minHeight: "100vh", backgroundOverlay: true, backgroundOverlayOpacity: 70 },
            contentFormula: { headline: { pattern: "[Motivational verb] + Your + [Transformation/Journey/Potential]", examples: ["Transform Your Body, Transform Your Life", "Unleash Your Potential", "Your Wellness Journey Starts Here", "Restore. Renew. Relax."], maxWords: 8 }, subheadline: { pattern: "What you offer + for whom", examples: ["State-of-the-art facilities, expert trainers, and programs designed to help you achieve your fitness goals", "A sanctuary of peace and rejuvenation in the heart of {city}"], maxWords: 20 }, cta: { pattern: "Join/Book + Now/Today", examples: ["Start Your Free Trial", "Join Now", "Book Your Session"], maxWords: 4 } }
          },
          { component: "BookingWidget", intent: "quick-booking",
            rationale: "Inline booking widget immediately below hero lets visitors book without scrolling. Mobile-friendly, responsive. 60%+ of fitness bookings happen on mobile. Reduces friction between interest and conversion.",
            config: { variant: "inline", showServices: true, showStaff: false, compact: true },
            contentFormula: { headline: { pattern: "Book Your [Session/Class/Appointment]", examples: ["Book Your Session", "Schedule a Class", "Reserve Your Spot"], maxWords: 4 } }
          },
          { component: "Features", intent: "services-classes",
            rationale: "3-6 services/classes with icons. Each card describes the offering and links to detail.",
            config: { columns: 3, layout: "cards" },
            contentFormula: { headline: { pattern: "Our Programs / Services", examples: ["Our Programs", "What We Offer", "Treatments & Services"], maxWords: 4 }, items: { count: [3, 6], structure: "icon + class/service name + 20-word description + 'Learn More' link" } }
          },
          { component: "Pricing", intent: "membership-plans",
            rationale: "Transparent pricing with 3 tiers. Highlighted recommended plan. Clear what's included.",
            config: { columns: 3, highlightedPlan: "middle" },
            contentFormula: { headline: { pattern: "Membership Plans / Pricing", examples: ["Choose Your Plan", "Membership Options"], maxWords: 4 }, items: { count: 3, structure: "plan name + price/month + features list + 'Join Now' CTA" } }
          },
          { component: "Team", intent: "trainers-staff",
            rationale: "Trainer/staff photos with specialties. Builds personal connection.",
            config: { layout: "grid", showRole: true },
            contentFormula: { headline: { pattern: "Meet Our Team", examples: ["Meet Your Trainers", "Our Wellness Experts"], maxWords: 4 }, items: { count: [3, 6], structure: "photo + name + specialty + certification + brief bio" } }
          },
          { component: "Testimonials", intent: "transformation-stories",
            rationale: "Transformation stories/results are the strongest motivator. Before/after or outcome-focused reviews.",
            config: { layout: "carousel", showRating: true },
            contentFormula: { items: { count: 3, structure: "transformation story or service review + member name + program used" } }
          },
          { component: "CTA", intent: "join-cta",
            rationale: "Final push to join or book. Bold colors, motivational language.",
            config: { variant: "bold", fullWidth: true },
            contentFormula: { headline: { pattern: "Ready to [Start/Transform]?", examples: ["Ready to Start Your Journey?", "Your Transformation Begins Today"], maxWords: 6 }, cta: { pattern: "Start Free Trial / Join Now", examples: ["Start Your Free Trial", "Join Today"], maxWords: 4 } }
          },
        ]
      },
      {
        name: "Services", slug: "/services", priority: 2, required: true,
        purpose: "Detailed service/class descriptions with schedules",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" }, rationale: "Services header.", contentFormula: { headline: { pattern: "Our Services/Classes", examples: ["Classes & Programs", "Our Services"], maxWords: 4 } } },
          { component: "Features", intent: "service-details", config: { columns: 2, layout: "detailed" }, rationale: "Detailed service cards.", contentFormula: { items: { count: [4, 8], structure: "service name + description + duration + price + 'Book Now' CTA" } } },
        ]
      },
      {
        name: "About", slug: "/about", priority: 3, required: false,
        purpose: "Facility story, philosophy, equipment/amenities",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "50vh" }, rationale: "Facility/team photo.", contentFormula: { headline: { pattern: "About / Our Story", examples: ["Our Story", "About {name}"], maxWords: 4 } } },
          { component: "Features", intent: "amenities", config: { columns: 3, layout: "icons" }, rationale: "Amenities and facilities list.", contentFormula: { items: { count: [4, 6], structure: "icon + amenity name + brief description" } } },
          { component: "Gallery", intent: "facility-photos", config: { layout: "grid", columns: 3 }, rationale: "Facility photos build desire to visit.", contentFormula: { items: { count: [4, 8], structure: "gym floor, equipment, studio, locker rooms, spa areas" } } }
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 4, required: true,
        purpose: "Location, hours, booking, trial signup",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" }, rationale: "Contact header.", contentFormula: { headline: { pattern: "Visit Us / Get Started", examples: ["Visit Us", "Start Your Journey"], maxWords: 4 } } },
          { component: "ContactForm", intent: "trial-form", config: { fields: ["name", "email", "phone", "interest", "preferredTime", "message"] }, rationale: "Free trial or booking form.", contentFormula: { headline: { pattern: "Book a Free Trial", examples: ["Book Your Free Trial", "Schedule a Visit"], maxWords: 5 } } },
          { component: "Features", intent: "location-hours", config: { columns: 3, layout: "icons" }, rationale: "Location, hours, parking info.", contentFormula: { items: { count: 3, structure: "Address, Hours, Parking/Transit info" } } }
        ]
      },
    ],

    design: {
      palettes: [
        { name: "High Energy", mood: "bold, dynamic, motivational", primary: "#FF4D4D", secondary: "#1A1A2E", accent: "#FFD93D", background: "#0F0F1A", surface: "#1A1A2E", text: "#FFFFFF", textMuted: "#9CA3AF" },
        { name: "Serene Wellness", mood: "calm, luxurious, natural", primary: "#7C9A92", secondary: "#D4B896", accent: "#E8DFD0", background: "#FAF9F7", surface: "#FFFFFF", text: "#3D3D3D", textMuted: "#7A7A7A" },
      ],
      typography: [
        { name: "Bold Impact", heading: "Oswald", body: "Roboto", headingWeight: "700", bodyWeight: "400" },
        { name: "Elegant Calm", heading: "Cormorant Garamond", body: "Lato", headingWeight: "500", bodyWeight: "400" },
      ],
      layout: { borderRadius: "md", shadowStyle: "dramatic", spacing: "balanced", heroHeight: "100vh", sectionPadding: "80px" },
      imagery: { heroStyle: "Action fitness shots (gym) or serene spa environments (wellness)", sectionImages: "Equipment, classes in action, spa treatments", teamPhotos: "Action shots of trainers or calm portraits of therapists", unsplashKeywords: ["gym workout action", "spa relaxation", "yoga class", "fitness training", "wellness retreat"] },
    },

    content: {
      toneGuide: "Gym: Bold, motivational, energetic. Use action words. Spa: Calm, luxurious, soothing. Use sensory words. Both: Focus on transformation and results. Personal, not corporate.",
      headlineRules: ["Use motivational language for fitness", "Use calming, sensory language for wellness", "Speak to transformation", "Keep it powerful and short"],
      ctaRules: ["'Start Free Trial' for gyms", "'Book Your Session' for spas", "Reduce signup friction", "Show pricing before CTA"],
      contentDo: ["Show real member results", "Include class schedules", "Display trainer certifications", "Mention free trial/first visit"],
      contentDont: ["Use intimidating imagery for beginners", "Hide pricing", "Use generic fitness stock photos", "Forget mobile booking experience"],
    },

    conversion: {
      primaryAction: "Sign up for trial / Book session",
      ctaPlacements: ["Hero", "After services", "After pricing", "Final CTA"],
      trustSignals: ["Certified trainers", "Years in business", "Member count", "Google rating"],
      socialProof: ["Transformation stories", "Member testimonials", "Before/after results", "Community size"],
      urgencyTactics: ["'First class free'", "'Limited spots in {class}'", "'New member special — join this month'"],
    },

    seo: {
      titlePattern: "{BusinessName} | {Type} in {City}",
      descriptionPattern: "{BusinessName} offers {services} in {City}. {Highlight}. Start your free trial today.",
      keywordCategories: ["gym/spa + near me", "fitness class + city", "personal trainer + location"],
      schemaTypes: ["HealthClub", "SportsActivityLocation", "DaySpa", "LocalBusiness"],
    },
  },

  // ===========================================================================
  // 🏗️ CONSTRUCTION / HOME SERVICES / TRADES
  // ===========================================================================
  {
    id: "construction",
    name: "Construction & Home Services",
    matchKeywords: ["construction", "contractor", "builder", "renovation", "remodeling", "plumber", "plumbing", "electrician", "electrical", "hvac", "roofing", "roofer", "landscaping", "painting", "handyman", "flooring", "paving", "demolition", "carpentry"],
    architectureRationale: "Trade/construction websites must build trust fast — homeowners are nervous about hiring contractors. Key elements: completed project photos (before/after), licensing/insurance badges, years in business, and a prominent phone number. 'Get a Free Quote' is the #1 converting CTA. Google reviews are critical. Mobile-first — many calls come from mobile search.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Showcase completed work, build trust, generate quote requests",
        sections: [
          { component: "Hero", intent: "hero",
            rationale: "Completed project photo as hero. Phone number visible in hero. 'Get Free Quote' as primary CTA. Licensed & insured badge visible.",
            config: { variant: "fullscreen", minHeight: "90vh", backgroundOverlay: true, backgroundOverlayOpacity: 65 },
            contentFormula: { headline: { pattern: "[City]'s Trusted + [Trade] + Experts/Professionals", examples: ["Your Trusted Home Building Partner", "{City}'s Premier Roofing Experts", "Quality Construction You Can Count On"], maxWords: 8 }, subheadline: { pattern: "Years experience + licensed + service area", examples: ["Licensed, insured, and serving {area} for over {years} years. Free estimates on all projects."], maxWords: 20 }, cta: { pattern: "Get + Free + Quote/Estimate", examples: ["Get Your Free Quote", "Request Free Estimate", "Call Now for Free Quote"], maxWords: 5 } }
          },
          { component: "Features", intent: "trust-badges",
            rationale: "Trust badges immediately: Licensed, Insured, X Years, Free Estimates. Construction is a trust-first industry.",
            config: { columns: 4, layout: "icons", compact: true },
            contentFormula: { items: { count: 4, structure: "Licensed & Bonded, Fully Insured, {X}+ Years Experience, Free Estimates" } }
          },
          { component: "Features", intent: "services",
            rationale: "Core services grid. Each service links to detail page.",
            config: { columns: 3, layout: "cards", showLearnMore: true },
            contentFormula: { headline: { pattern: "Our Services", examples: ["Our Services", "What We Do"], maxWords: 3 }, items: { count: [3, 6], structure: "icon + service name + 20-word description + 'Learn More' link" } }
          },
          { component: "Gallery", intent: "project-showcase",
            rationale: "Before/after project photos are the strongest conversion driver for trades. Grid of best completed projects.",
            config: { layout: "grid", columns: 3, showCaptions: true },
            contentFormula: { headline: { pattern: "Our Work / Recent Projects", examples: ["Our Recent Projects", "See Our Work"], maxWords: 4 }, items: { count: [4, 6], structure: "completed project photo + project type + brief description" } }
          },
          { component: "Testimonials", intent: "customer-reviews",
            rationale: "Google reviews are #1 for contractor selection. Show 3+ with star ratings and project type.",
            config: { layout: "grid", columns: 3, showRating: true },
            contentFormula: { items: { count: 3, structure: "5-star review + homeowner name + project type + city" } }
          },
          { component: "Stats", intent: "achievements",
            rationale: "Credibility numbers: projects completed, years in business, satisfaction rate.",
            config: { columns: 4 },
            contentFormula: { items: { count: 4, structure: "Projects Completed, Years in Business, Satisfaction %, Cities Served" } }
          },
          { component: "CTA", intent: "quote-cta",
            rationale: "Final quote CTA. Include phone number in CTA section.",
            config: { variant: "split", fullWidth: true },
            contentFormula: { headline: { pattern: "Ready to Start Your Project?", examples: ["Ready to Start Your Project?", "Get Your Free Estimate Today"], maxWords: 7 }, cta: { pattern: "Get Free Quote", examples: ["Request Your Free Quote", "Call for Free Estimate"], maxWords: 5 } }
          },
        ]
      },
      {
        name: "Services", slug: "/services", priority: 2, required: true,
        purpose: "Detailed service descriptions",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" }, rationale: "Services header.", contentFormula: { headline: { pattern: "Our Services", examples: ["What We Do", "Our Services"], maxWords: 3 } } },
          { component: "Features", intent: "service-detail", config: { columns: 2, layout: "detailed" }, rationale: "Detailed service descriptions with pricing info.", contentFormula: { items: { count: [4, 8], structure: "service name + detailed description + what's included + 'Get a Quote' CTA" } } },
        ]
      },
      {
        name: "Projects", slug: "/projects", priority: 3, required: true,
        purpose: "Full project gallery with before/after photos",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" }, rationale: "Projects header.", contentFormula: { headline: { pattern: "Our Projects / Gallery", examples: ["Our Work", "Project Gallery"], maxWords: 3 } } },
          { component: "Gallery", intent: "full-gallery", config: { layout: "masonry", columns: 3, showFilters: true, showCaptions: true }, rationale: "Full project gallery with category filters.", contentFormula: { items: { count: [8, 20], structure: "project photo + type + location + brief description" } } },
        ]
      },
      {
        name: "About", slug: "/about", priority: 4, required: true,
        purpose: "Company history, licenses, team",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "50vh" }, rationale: "Team on jobsite photo.", contentFormula: { headline: { pattern: "About Us", examples: ["About {name}", "Our Story"], maxWords: 4 } } },
          { component: "Features", intent: "why-us", config: { columns: 3, layout: "icons" }, rationale: "Key differentiators.", contentFormula: { items: { count: 3, structure: "Licensed & Insured, Family Owned, Satisfaction Guaranteed" } } },
          { component: "Team", intent: "our-team", config: { layout: "grid" }, rationale: "Team members with experience.", contentFormula: { items: { count: [3, 8], structure: "photo + name + role + years experience" } } }
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 5, required: true,
        purpose: "Quote request form, phone, service area",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" }, rationale: "Contact header with phone prominently displayed.", contentFormula: { headline: { pattern: "Contact Us / Get a Quote", examples: ["Get Your Free Quote", "Contact Us"], maxWords: 5 } } },
          { component: "ContactForm", intent: "quote-form", config: { fields: ["name", "email", "phone", "projectType", "address", "timeline", "message"] }, rationale: "Quote request form — include project type and address.", contentFormula: { headline: { pattern: "Request a Free Quote", examples: ["Request Your Free Estimate"], maxWords: 5 } } },
          { component: "Features", intent: "contact-info", config: { columns: 3, layout: "icons" }, rationale: "Phone (clickable), email, service area.", contentFormula: { items: { count: 3, structure: "Phone, Email, Service Area map/list" } } }
        ]
      },
    ],

    design: {
      palettes: [
        { name: "Solid Trade", mood: "trustworthy, strong, professional", primary: "#1E40AF", secondary: "#F59E0B", accent: "#10B981", background: "#FFFFFF", surface: "#F1F5F9", text: "#0F172A", textMuted: "#64748B" },
        { name: "Bold Builder", mood: "bold, industrial, reliable", primary: "#DC2626", secondary: "#1E293B", accent: "#F59E0B", background: "#FFFFFF", surface: "#F8FAFC", text: "#1E293B", textMuted: "#64748B" },
      ],
      typography: [
        { name: "Strong Professional", heading: "Poppins", body: "Open Sans", headingWeight: "700", bodyWeight: "400" },
        { name: "Industrial Clean", heading: "Oswald", body: "Roboto", headingWeight: "600", bodyWeight: "400" },
      ],
      layout: { borderRadius: "sm", shadowStyle: "medium", spacing: "balanced", heroHeight: "90vh", sectionPadding: "72px" },
      imagery: { heroStyle: "Completed project exterior or crew on jobsite", sectionImages: "Before/after project photos, tools and equipment", teamPhotos: "Crew photos on jobsite or professional headshots", unsplashKeywords: ["construction site", "home renovation", "contractor working", "new home building", "roofing"] },
    },

    content: {
      toneGuide: "Straightforward, confident, trust-building. Homeowners want reliability. Emphasize: licensed, insured, experienced, local, family-owned. Use plain language — no jargon. Include phone number prominently.",
      headlineRules: ["Emphasize trust: licensed, insured, experienced", "Include city/area name when possible", "Focus on reliability and quality", "Keep language simple and direct"],
      ctaRules: ["'Get Free Quote/Estimate' is #1 converting CTA", "Always include phone number", "Show 'Free' prominently", "Mobile click-to-call is essential"],
      contentDo: ["Show before/after photos", "Include license numbers", "Mention insurance coverage", "Display Google reviews"],
      contentDont: ["Use technical construction jargon", "Forget phone number placement", "Use stock photos instead of real projects", "Hide pricing completely"],
    },

    conversion: {
      primaryAction: "Request a free quote/estimate",
      ctaPlacements: ["Hero", "After services", "After project gallery", "Final CTA", "Sticky phone button on mobile"],
      trustSignals: ["Licensed & bonded badge", "Insurance certificates", "BBB rating", "Years in business", "Google review rating"],
      socialProof: ["Customer reviews with project types", "Number of projects completed", "Before/after transformations", "Google star rating"],
      urgencyTactics: ["'Free estimates — call today'", "'Book before the busy season'", "'Limited scheduling availability'"],
    },

    seo: {
      titlePattern: "{BusinessName} | {Trade} Contractor in {City}",
      descriptionPattern: "{BusinessName} provides professional {trade} services in {City}. Licensed & insured. {X}+ years experience. Get your free quote today.",
      keywordCategories: ["trade + near me", "contractor + city", "service type + area"],
      schemaTypes: ["HomeAndConstructionBusiness", "GeneralContractor", "LocalBusiness"],
    },
  },

  // ===========================================================================
  // 🏠 REAL ESTATE
  // ===========================================================================
  {
    id: "real-estate",
    name: "Real Estate & Property",
    matchKeywords: ["real estate", "realtor", "property", "homes for sale", "real estate agent", "broker", "property management", "apartment", "rental", "mortgage", "house", "condo"],
    architectureRationale: "Real estate websites center around the agent's expertise and available listings. The homepage must immediately show: agent photo/brand, featured listings, and search functionality. Clients choose agents based on local market knowledge, track record, and personality. Testimonials from past buyers/sellers are critical. Mobile-first — buyers browse on their phones.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Showcase agent expertise, feature listings, enable property search",
        sections: [
          { component: "Hero", intent: "hero",
            rationale: "Beautiful property hero image or agent photo. Property search or 'Find Your Dream Home' as primary CTA. Trust indicators visible.",
            config: { variant: "fullscreen", minHeight: "90vh", backgroundOverlay: true, backgroundOverlayOpacity: 50 },
            contentFormula: { headline: { pattern: "Find Your + [Dream Home / Perfect Property] + in + [City]", examples: ["Find Your Dream Home in {city}", "Your Trusted Real Estate Partner in {city}", "{city}'s Most Trusted Realtor"], maxWords: 8 }, subheadline: { pattern: "Agent expertise + market knowledge", examples: ["Helping families find their perfect home for over {years} years. Local expertise you can trust."], maxWords: 20 }, cta: { pattern: "Search Homes / Get Valuation", examples: ["Search Available Homes", "Get a Free Home Valuation", "Start Your Search"], maxWords: 5 } }
          },
          { component: "Stats", intent: "agent-stats",
            rationale: "Immediate credibility: homes sold, years experience, avg days on market, client satisfaction.",
            config: { columns: 4 },
            contentFormula: { items: { count: 4, structure: "Homes Sold, Years Experience, Avg Days on Market, Client Satisfaction %" } }
          },
          { component: "Gallery", intent: "featured-listings",
            rationale: "Featured property cards with photos, price, beds/baths, sqft. Links to listing detail.",
            config: { layout: "grid", columns: 3, showCaptions: true },
            contentFormula: { headline: { pattern: "Featured Listings / Properties", examples: ["Featured Listings", "Properties for Sale"], maxWords: 3 }, items: { count: [3, 6], structure: "property photo + price + address + beds/baths/sqft" } }
          },
          { component: "Features", intent: "services",
            rationale: "Services: Buying, Selling, Investing, Property Management.",
            config: { columns: 3, layout: "cards" },
            contentFormula: { headline: { pattern: "How I Can Help", examples: ["How I Can Help", "Services"], maxWords: 4 }, items: { count: 3, structure: "Buying a Home, Selling Your Home, Investment Properties — each with description" } }
          },
          { component: "Testimonials", intent: "client-stories",
            rationale: "Buyer/seller testimonials with property context.",
            config: { layout: "carousel", showRating: true },
            contentFormula: { items: { count: 3, structure: "testimonial about buying/selling experience + client name + transaction type" } }
          },
          { component: "CTA", intent: "valuation-cta",
            rationale: "Free home valuation CTA — great lead generator for sellers.",
            config: { variant: "split", fullWidth: true },
            contentFormula: { headline: { pattern: "Thinking of Selling? / What's Your Home Worth?", examples: ["What's Your Home Worth?", "Thinking of Selling?"], maxWords: 6 }, cta: { pattern: "Get Free Valuation", examples: ["Get Your Free Home Valuation"], maxWords: 5 } }
          },
        ]
      },
      {
        name: "Listings", slug: "/listings", priority: 2, required: true,
        purpose: "All available property listings with search/filter",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" }, rationale: "Listings page header with search.", contentFormula: { headline: { pattern: "Available Properties", examples: ["Browse Listings", "Available Properties"], maxWords: 3 } } },
          { component: "Gallery", intent: "listings-grid", config: { layout: "grid", columns: 3, showFilters: true, showPrices: true }, rationale: "Property grid with filters: price range, beds, baths, type.", contentFormula: { items: { count: [6, 12], structure: "property photo + price + address + beds/baths/sqft + 'View Details'" } } },
        ]
      },
      {
        name: "About", slug: "/about", priority: 3, required: true,
        purpose: "Agent bio, qualifications, market expertise",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "60vh" }, rationale: "Professional agent photo + credentials.", contentFormula: { headline: { pattern: "About [Agent Name]", examples: ["About {name}", "Meet Your Realtor"], maxWords: 4 } } },
          { component: "Features", intent: "qualifications", config: { columns: 3, layout: "icons" }, rationale: "Qualifications and specialties.", contentFormula: { items: { count: 3, structure: "Local Market Expert, Certified Negotiator, {X}+ Years Experience" } } },
          { component: "Stats", intent: "track-record", config: { columns: 4 }, rationale: "Performance metrics.", contentFormula: { items: { count: 4, structure: "Transactions Closed, Total Volume, Client Reviews, Areas Served" } } }
        ]
      },
      {
        name: "Contact", slug: "/contact", priority: 4, required: true,
        purpose: "Contact agent, schedule viewing, home valuation request",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" }, rationale: "Contact header.", contentFormula: { headline: { pattern: "Get In Touch", examples: ["Let's Connect", "Contact Me"], maxWords: 3 } } },
          { component: "ContactForm", intent: "inquiry-form", config: { fields: ["name", "email", "phone", "interestType", "priceRange", "timeline", "message"] }, rationale: "Buyer/seller inquiry form. Interest type: Buying/Selling/Investing.", contentFormula: { headline: { pattern: "Start Your Real Estate Journey", examples: ["How Can I Help You?"], maxWords: 6 } } },
        ]
      },
    ],

    design: {
      palettes: [
        { name: "Professional Realtor", mood: "trustworthy, premium, established", primary: "#1E3A5F", secondary: "#C9A96E", accent: "#10B981", background: "#FFFFFF", surface: "#F8FAFC", text: "#1E293B", textMuted: "#64748B" },
        { name: "Modern Agent", mood: "clean, approachable, contemporary", primary: "#0F766E", secondary: "#1E293B", accent: "#F59E0B", background: "#FFFFFF", surface: "#F0FDF4", text: "#0F172A", textMuted: "#64748B" },
      ],
      typography: [
        { name: "Elegant Professional", heading: "Playfair Display", body: "Lato", headingWeight: "700", bodyWeight: "400" },
        { name: "Clean Modern", heading: "DM Sans", body: "Inter", headingWeight: "600", bodyWeight: "400" },
      ],
      layout: { borderRadius: "md", shadowStyle: "medium", spacing: "balanced", heroHeight: "90vh", sectionPadding: "80px" },
      imagery: { heroStyle: "Beautiful home exterior or interior with agent", sectionImages: "High-quality property photos, neighborhood shots", teamPhotos: "Professional headshot, on-location at listings", unsplashKeywords: ["luxury home exterior", "modern house interior", "real estate neighborhood", "residential property"] },
    },

    content: {
      toneGuide: "Professional, knowledgeable, personable. First person is fine for solo agents. Emphasize local expertise and track record. Be helpful and approachable, not salesy.",
      headlineRules: ["Include city/area name", "Emphasize local expertise", "Use 'Your' to personalize", "Focus on client outcomes"],
      ctaRules: ["'Get Free Home Valuation' for sellers", "'Search Homes' for buyers", "Include phone number prominently", "Show agent photo near CTA"],
      contentDo: ["Showcase specific neighborhoods", "Include market statistics", "Show agent credentials", "Feature sold properties"],
      contentDont: ["Use generic property descriptions", "Forget mobile search optimization", "Hide contact information", "Use outdated listing photos"],
    },

    conversion: {
      primaryAction: "Schedule a viewing / Request home valuation",
      ctaPlacements: ["Hero search", "Featured listings", "Valuation CTA", "Contact form"],
      trustSignals: ["Homes sold count", "Google reviews", "Certifications (CRS, ABR)", "Years in market"],
      socialProof: ["Client testimonials", "Recent sales", "Market stats", "Neighborhood expertise"],
      urgencyTactics: ["'New listing — schedule a viewing today'", "'Market is hot — don't wait'", "'Free home valuation — limited time'"],
    },

    seo: {
      titlePattern: "{AgentName} | {City} Real Estate Agent",
      descriptionPattern: "{AgentName} — {City} real estate expert. {HomesSold}+ homes sold. Browse listings, get free home valuation. Call today.",
      keywordCategories: ["homes for sale + city", "realtor + area", "buy/sell home + location"],
      schemaTypes: ["RealEstateAgent", "LocalBusiness"],
    },
  },

  // ===========================================================================
  // 🎓 EDUCATION / TRAINING / COACHING
  // ===========================================================================
  {
    id: "education",
    name: "Education & Training",
    matchKeywords: ["education", "school", "academy", "training", "coaching", "tutoring", "courses", "online learning", "instructor", "teacher", "workshop", "certification", "bootcamp", "university"],
    architectureRationale: "Education websites must inspire confidence in learning outcomes. Key elements: clear program descriptions, instructor credentials, student success stories, and easy enrollment. Pricing transparency is important but secondary to demonstrating value. Student/alumni testimonials are the strongest conversion driver.",

    pages: [
      {
        name: "Home", slug: "/", priority: 1, required: true,
        purpose: "Inspire enrollment, showcase programs, demonstrate outcomes",
        sections: [
          { component: "Hero", intent: "hero", config: { variant: "centered", minHeight: "85vh" },
            rationale: "Inspirational hero — learning environment or student success imagery.", contentFormula: { headline: { pattern: "Transform Your Future + Through [Learning/Education]", examples: ["Transform Your Future", "Learn. Grow. Succeed.", "Your Journey to Mastery Starts Here"], maxWords: 7 }, cta: { pattern: "Enroll Now / Explore Programs", examples: ["Explore Our Programs", "Enroll Today", "Start Learning"], maxWords: 4 } } },
          { component: "Features", intent: "programs", config: { columns: 3, layout: "cards" },
            rationale: "Program/course cards with key details.", contentFormula: { headline: { pattern: "Our Programs", examples: ["Programs & Courses", "What We Offer"], maxWords: 4 }, items: { count: [3, 6], structure: "program name + duration + brief description + 'Learn More' link" } } },
          { component: "Stats", intent: "outcomes", config: { columns: 4 },
            rationale: "Graduate outcomes prove value.", contentFormula: { items: { count: 4, structure: "Graduates, Job Placement %, Student Satisfaction, Countries Represented" } } },
          { component: "Team", intent: "instructors", config: { layout: "grid", showCredentials: true },
            rationale: "Instructor credentials build trust.", contentFormula: { items: { count: [3, 6], structure: "photo + name + credentials + specialty + brief bio" } } },
          { component: "Testimonials", intent: "student-success", config: { layout: "carousel", showRating: true },
            rationale: "Student success stories are the strongest motivator.", contentFormula: { items: { count: 3, structure: "student achievement story + name + program + current role" } } },
          { component: "CTA", intent: "enroll-cta", config: { variant: "centered", fullWidth: true },
            rationale: "Enrollment CTA.", contentFormula: { headline: { pattern: "Ready to Begin?", examples: ["Ready to Start Your Journey?", "Take the First Step"], maxWords: 6 }, cta: { pattern: "Apply Now / Enroll Today", examples: ["Apply Now", "Start Your Application"], maxWords: 4 } } }
        ]
      },
      { name: "Programs", slug: "/programs", priority: 2, required: true, purpose: "Detailed program/course catalog",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "35vh" }, rationale: "Programs header.", contentFormula: { headline: { pattern: "Our Programs", examples: ["Programs & Courses"], maxWords: 3 } } },
          { component: "Features", intent: "program-details", config: { columns: 2, layout: "detailed" }, rationale: "Detailed program descriptions.", contentFormula: { items: { count: [4, 8], structure: "program name + description + duration + price + 'Enroll' CTA" } } }
        ]
      },
      { name: "About", slug: "/about", priority: 3, required: true, purpose: "School history, mission, accreditations",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "split", minHeight: "50vh" }, rationale: "Campus/learning environment.", contentFormula: { headline: { pattern: "About Us", examples: ["Our Mission", "About {name}"], maxWords: 4 } } },
          { component: "Features", intent: "values", config: { columns: 3, layout: "icons" }, rationale: "Mission, vision, values.", contentFormula: { items: { count: 3, structure: "icon + value + description" } } }
        ]
      },
      { name: "Contact", slug: "/contact", priority: 4, required: true, purpose: "Enrollment inquiry, campus visits",
        sections: [
          { component: "Hero", intent: "page-header", config: { variant: "compact", minHeight: "30vh" }, rationale: "Contact header.", contentFormula: { headline: { pattern: "Get in Touch", examples: ["Contact Us", "Ask Us Anything"], maxWords: 4 } } },
          { component: "ContactForm", intent: "enrollment-inquiry", config: { fields: ["name", "email", "phone", "programInterest", "startDate", "message"] }, rationale: "Enrollment inquiry form.", contentFormula: { headline: { pattern: "Request Information", examples: ["Request More Information"], maxWords: 4 } } }
        ]
      }
    ],

    design: {
      palettes: [
        { name: "Academic Trust", mood: "trustworthy, warm, inspiring", primary: "#1E40AF", secondary: "#F59E0B", accent: "#10B981", background: "#FFFFFF", surface: "#F8FAFC", text: "#1E293B", textMuted: "#64748B" },
        { name: "Modern Learning", mood: "fresh, innovative, accessible", primary: "#7C3AED", secondary: "#2563EB", accent: "#EC4899", background: "#FFFFFF", surface: "#FAF5FF", text: "#1F2937", textMuted: "#6B7280" },
      ],
      typography: [
        { name: "Professional Academic", heading: "Plus Jakarta Sans", body: "Inter", headingWeight: "700", bodyWeight: "400" },
        { name: "Friendly Learning", heading: "Nunito", body: "Nunito Sans", headingWeight: "700", bodyWeight: "400" },
      ],
      layout: { borderRadius: "lg", shadowStyle: "soft", spacing: "spacious", heroHeight: "85vh", sectionPadding: "80px" },
      imagery: { heroStyle: "Inspiring learning environment or student celebration", sectionImages: "Classroom interaction, campus life", teamPhotos: "Professional instructor headshots", unsplashKeywords: ["classroom learning", "student studying", "education campus", "graduation celebration"] },
    },

    content: {
      toneGuide: "Inspiring, supportive, outcome-focused. Speak to the transformation: 'from where you are to where you want to be.' Focus on student success, not institutional prestige.",
      headlineRules: ["Outcome-focused", "Inspiring, not academic", "Speak to the student's future", "Keep it motivational"],
      ctaRules: ["'Apply Now' for formal programs", "'Start Learning' for courses", "'Request Info' for consideration stage", "Show application deadlines"],
      contentDo: ["Show graduate outcomes", "Include instructor credentials", "Display accreditations", "Feature student testimonials"],
      contentDont: ["Use overly academic language", "Hide tuition costs", "Use empty classrooms as photos", "Make enrollment process unclear"],
    },

    conversion: {
      primaryAction: "Apply / Enroll / Request information",
      ctaPlacements: ["Hero", "After programs", "After testimonials", "Final CTA"],
      trustSignals: ["Accreditations", "Graduate job placement rate", "Student satisfaction score", "Years established"],
      socialProof: ["Student testimonials", "Alumni success stories", "Graduate statistics", "Partner organizations"],
      urgencyTactics: ["'Application deadline: {date}'", "'Early enrollment discount'", "'Limited seats remaining'"],
    },

    seo: {
      titlePattern: "{SchoolName} | {Programs} — Education & Training",
      descriptionPattern: "{SchoolName} offers {programs} with {outcome}. {Accreditation}. Apply today.",
      keywordCategories: ["program type + near me", "training + field + city", "certification + skill"],
      schemaTypes: ["EducationalOrganization", "Course", "LocalBusiness"],
    },
  },
];

// =============================================================================
// BLUEPRINT FINDER
// =============================================================================

/**
 * Find the best blueprint for a given industry/prompt
 * Uses keyword matching with scoring
 */
export function findBlueprint(industry: string, prompt?: string): IndustryBlueprint | null {
  const searchText = `${industry} ${prompt || ""}`.toLowerCase();
  
  let bestMatch: IndustryBlueprint | null = null;
  let bestScore = 0;

  for (const blueprint of INDUSTRY_BLUEPRINTS) {
    let score = 0;

    // Check match keywords
    for (const keyword of blueprint.matchKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += keyword.includes(" ") ? 15 : 10; // Multi-word matches score higher
      }
    }

    // Exact ID match
    if (blueprint.id === industry.toLowerCase()) {
      score += 50;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = blueprint;
    }
  }

  return bestMatch;
}

/**
 * Get all available blueprints
 */
export function getAllBlueprints(): IndustryBlueprint[] {
  return INDUSTRY_BLUEPRINTS;
}

/**
 * Format a blueprint as AI context for the architecture prompt
 * This is the critical function that feeds proven patterns to the AI
 */
export function formatBlueprintForAI(blueprint: IndustryBlueprint): string {
  const palette = blueprint.design.palettes[0]; // Primary palette
  const typography = blueprint.design.typography[0]; // Primary typography

  return `
## 🏗️ INDUSTRY BLUEPRINT: ${blueprint.name} (PROVEN ARCHITECTURE — FOLLOW EXACTLY)

### WHY THIS ARCHITECTURE WORKS:
${blueprint.architectureRationale}

### EXACT PAGE STRUCTURE (CREATE THESE PAGES):
${blueprint.pages.map((page, i) => `
${i + 1}. **${page.name}** (${page.slug}) ${page.required ? "— REQUIRED" : "— Optional"}
   Purpose: ${page.purpose}
   Sections (in this exact order):
${page.sections.map((section, j) => `   ${j + 1}. ${section.component} — ${section.intent}
      Why: ${section.rationale}
      ${section.contentFormula.headline ? `Headline Pattern: "${section.contentFormula.headline.pattern}" (max ${section.contentFormula.headline.maxWords} words)` : ""}
      ${section.contentFormula.cta ? `CTA Pattern: "${section.contentFormula.cta.pattern}" — Examples: ${section.contentFormula.cta.examples.map(e => `"${e}"`).join(", ")}` : ""}
      ${section.contentFormula.items ? `Items: ${typeof section.contentFormula.items.count === 'number' ? section.contentFormula.items.count : `${section.contentFormula.items.count[0]}-${section.contentFormula.items.count[1]}`} — ${section.contentFormula.items.structure}` : ""}`).join("\n")}
`).join("\n")}

### PROVEN COLOR PALETTE (USE THESE EXACT VALUES):
Palette: ${palette.name} — ${palette.mood}
- Primary: ${palette.primary}
- Secondary: ${palette.secondary}
- Accent: ${palette.accent}
- Background: ${palette.background}
- Surface: ${palette.surface}
- Text: ${palette.text}
- Text Muted: ${palette.textMuted}

### PROVEN TYPOGRAPHY:
- Headings: ${typography.heading} (${typography.headingWeight})
- Body: ${typography.body} (${typography.bodyWeight})

### DESIGN SETTINGS:
- Border Radius: ${blueprint.design.layout.borderRadius}
- Shadows: ${blueprint.design.layout.shadowStyle}
- Spacing: ${blueprint.design.layout.spacing}
- Hero Height: ${blueprint.design.layout.heroHeight}

### CONTENT RULES:
Tone: ${blueprint.content.toneGuide}
Headlines: ${blueprint.content.headlineRules.join(" | ")}
CTAs: ${blueprint.content.ctaRules.join(" | ")}
DO: ${blueprint.content.contentDo.join(" | ")}
DON'T: ${blueprint.content.contentDont.join(" | ")}

### CONVERSION OPTIMIZATION:
Primary Action: ${blueprint.conversion.primaryAction}
CTA Placements: ${blueprint.conversion.ctaPlacements.join(", ")}
Trust Signals: ${blueprint.conversion.trustSignals.join(", ")}
Social Proof: ${blueprint.conversion.socialProof.join(", ")}

### IMAGE GUIDELINES:
Hero: ${blueprint.design.imagery.heroStyle}
Sections: ${blueprint.design.imagery.sectionImages}
Team: ${blueprint.design.imagery.teamPhotos}
Unsplash Keywords: ${blueprint.design.imagery.unsplashKeywords.join(", ")}

⚠️ CRITICAL: This blueprint is based on UX research and proven conversion patterns.
Follow the section order, content formulas, and design specifications EXACTLY.
Do NOT improvise or deviate from this blueprint.
`;
}

/**
 * Format a blueprint's page-specific guidance for AI page generation
 */
export function formatBlueprintPageForAI(blueprint: IndustryBlueprint, pageName: string): string {
  const page = blueprint.pages.find(
    p => p.name.toLowerCase() === pageName.toLowerCase() || p.slug === pageName
  );
  
  if (!page) return "";

  return `
## 📄 BLUEPRINT FOR "${page.name}" PAGE

Purpose: ${page.purpose}

### EXACT SECTIONS (Generate in this order):
${page.sections.map((section, i) => `
**Section ${i + 1}: ${section.component}** (${section.intent})
Rationale: ${section.rationale}
Config: ${JSON.stringify(section.config, null, 2)}
${section.contentFormula.headline ? `
Headline:
  Pattern: "${section.contentFormula.headline.pattern}"
  Examples: ${section.contentFormula.headline.examples.map(e => `"${e}"`).join(", ")}
  Max Words: ${section.contentFormula.headline.maxWords}` : ""}
${section.contentFormula.subheadline ? `
Subheadline:
  Pattern: "${section.contentFormula.subheadline.pattern}"
  Max Words: ${section.contentFormula.subheadline.maxWords}` : ""}
${section.contentFormula.cta ? `
CTA:
  Pattern: "${section.contentFormula.cta.pattern}"
  Examples: ${section.contentFormula.cta.examples.map(e => `"${e}"`).join(", ")}` : ""}
${section.contentFormula.items ? `
Items:
  Count: ${typeof section.contentFormula.items.count === 'number' ? section.contentFormula.items.count : `${section.contentFormula.items.count[0]}-${section.contentFormula.items.count[1]}`}
  Structure: ${section.contentFormula.items.structure}` : ""}
`).join("\n")}

⚠️ Follow this blueprint EXACTLY. Each section has been tested and proven to convert.
`;
}
