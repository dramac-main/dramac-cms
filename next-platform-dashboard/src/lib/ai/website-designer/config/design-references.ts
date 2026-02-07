/**
 * Design Reference System
 * 
 * A curated database of industry-specific design patterns extracted from
 * award-winning websites (Dribbble, Awwwards, etc.). The AI uses these
 * as concrete references to generate professional, industry-ready websites.
 * 
 * Each reference includes:
 * - Exact section structure
 * - Color schemes that work
 * - Component configurations
 * - Content patterns
 * - Animation suggestions
 * 
 * This ensures the AI doesn't "guess" - it follows proven patterns.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DesignReference {
  id: string;
  name: string;
  industry: string;
  source: string; // "dribbble" | "awwwards" | "internal"
  style: "minimal" | "bold" | "elegant" | "playful" | "corporate" | "creative";
  
  // Color system - EXACT values that work together
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  
  // Typography - proven combinations
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
  
  // Page structure - what sections in what order
  pageStructures: {
    homepage: SectionReference[];
    about?: SectionReference[];
    services?: SectionReference[];
    contact?: SectionReference[];
    menu?: SectionReference[];
    portfolio?: SectionReference[];
  };
  
  // Global settings
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  shadowStyle: "none" | "subtle" | "medium" | "dramatic";
  spacing: "compact" | "balanced" | "spacious";
  
  // Example content patterns
  contentPatterns: ContentPattern[];
}

export interface SectionReference {
  component: string;
  purpose: string;
  config: Record<string, unknown>;
  animations?: string[];
}

export interface ContentPattern {
  type: "headline" | "subheadline" | "cta" | "feature" | "testimonial";
  examples: string[];
  rules: string[];
}

// =============================================================================
// DESIGN REFERENCE DATABASE
// =============================================================================

export const DESIGN_REFERENCES: DesignReference[] = [
  // =========================================================================
  // RESTAURANT / CAFÉ / BAR
  // =========================================================================
  {
    id: "restaurant-elegant-dark",
    name: "Elegant Fine Dining",
    industry: "restaurant",
    source: "awwwards",
    style: "elegant",
    colors: {
      primary: "#D4AF37",      // Gold
      secondary: "#8B4513",    // Saddle brown
      accent: "#FFD700",       // Bright gold
      background: "#1A1A1A",   // Almost black
      surface: "#2D2D2D",      // Dark gray
      text: "#FFFFFF",         // White
      textMuted: "#A0A0A0",    // Light gray
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Lato",
      headingWeight: "700",
      bodyWeight: "400",
    },
    borderRadius: "none",
    shadowStyle: "subtle",
    spacing: "spacious",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Stunning food imagery with reservation CTA",
          config: {
            variant: "fullscreen",
            backgroundOverlay: true,
            backgroundOverlayOpacity: 60,
            titleColor: "#FFFFFF",
            subtitleColor: "#D4AF37",
            primaryButtonColor: "#D4AF37",
            primaryButtonTextColor: "#1A1A1A",
            minHeight: "100vh",
          },
          animations: ["fadeIn", "slideUp"],
        },
        {
          component: "Features",
          purpose: "Signature dishes or dining experiences",
          config: {
            columns: 3,
            layout: "cards",
            backgroundColor: "#1A1A1A",
            textColor: "#FFFFFF",
            iconColor: "#D4AF37",
          },
          animations: ["staggeredFadeIn"],
        },
        {
          component: "Gallery",
          purpose: "Food and ambiance photos",
          config: {
            layout: "masonry",
            columns: 3,
            gap: 8,
          },
          animations: ["fadeIn"],
        },
        {
          component: "Testimonials",
          purpose: "Guest reviews",
          config: {
            layout: "carousel",
            backgroundColor: "#2D2D2D",
            textColor: "#FFFFFF",
            accentColor: "#D4AF37",
          },
        },
        {
          component: "CTA",
          purpose: "Reservation call-to-action",
          config: {
            variant: "centered",
            backgroundColor: "#D4AF37",
            textColor: "#1A1A1A",
            buttonColor: "#1A1A1A",
            buttonTextColor: "#FFFFFF",
          },
        },
      ],
      menu: [
        {
          component: "Hero",
          purpose: "Menu page header",
          config: {
            variant: "compact",
            minHeight: "40vh",
            backgroundOverlay: true,
          },
        },
        {
          component: "Pricing",
          purpose: "Menu items by category",
          config: {
            layout: "list",
            showDescriptions: true,
            backgroundColor: "#1A1A1A",
            textColor: "#FFFFFF",
            priceColor: "#D4AF37",
          },
        },
      ],
      contact: [
        {
          component: "Hero",
          purpose: "Contact header with location preview",
          config: { variant: "compact", minHeight: "30vh" },
        },
        {
          component: "ContactForm",
          purpose: "Reservation form",
          config: {
            fields: ["name", "email", "phone", "date", "time", "guests", "message"],
            backgroundColor: "#2D2D2D",
            buttonColor: "#D4AF37",
            buttonTextColor: "#1A1A1A",
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "A Culinary Journey Awaits",
          "Where Flavor Meets Artistry",
          "Taste the Extraordinary",
        ],
        rules: [
          "Use evocative, sensory language",
          "Keep it under 6 words",
          "Avoid generic terms like 'delicious'",
        ],
      },
      {
        type: "cta",
        examples: [
          "Reserve Your Table",
          "Book Your Experience",
          "Make a Reservation",
        ],
        rules: [
          "Action-oriented verb first",
          "Create exclusivity feeling",
          "Never just 'Contact Us'",
        ],
      },
    ],
  },

  {
    id: "restaurant-modern-light",
    name: "Modern Casual Dining",
    industry: "restaurant",
    source: "dribbble",
    style: "minimal",
    colors: {
      primary: "#FF6B35",      // Warm orange
      secondary: "#2D3047",    // Dark blue-gray
      accent: "#E8E9EB",       // Light gray
      background: "#FFFFFF",   // White
      surface: "#F7F7F7",      // Off-white
      text: "#2D3047",         // Dark
      textMuted: "#6B7280",    // Gray
    },
    typography: {
      headingFont: "DM Sans",
      bodyFont: "Inter",
      headingWeight: "700",
      bodyWeight: "400",
    },
    borderRadius: "lg",
    shadowStyle: "subtle",
    spacing: "balanced",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Welcoming hero with food imagery",
          config: {
            variant: "split",
            backgroundOverlay: false,
            backgroundColor: "#FFFFFF",
            titleColor: "#2D3047",
            subtitleColor: "#6B7280",
            primaryButtonColor: "#FF6B35",
            primaryButtonTextColor: "#FFFFFF",
            minHeight: "90vh",
          },
          animations: ["fadeIn", "slideRight"],
        },
        {
          component: "Features",
          purpose: "Why choose us - 3 key differentiators",
          config: {
            columns: 3,
            layout: "icons",
            backgroundColor: "#F7F7F7",
            textColor: "#2D3047",
            iconColor: "#FF6B35",
          },
        },
        {
          component: "Gallery",
          purpose: "Featured dishes grid",
          config: {
            layout: "grid",
            columns: 4,
            showCaptions: true,
          },
        },
        {
          component: "Stats",
          purpose: "Social proof numbers",
          config: {
            columns: 4,
            backgroundColor: "#FF6B35",
            textColor: "#FFFFFF",
            valueColor: "#FFFFFF",
          },
          animations: ["countUp"],
        },
        {
          component: "CTA",
          purpose: "Order or reserve CTA",
          config: {
            variant: "simple",
            backgroundColor: "#2D3047",
            textColor: "#FFFFFF",
            buttonColor: "#FF6B35",
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "Fresh. Local. Delicious.",
          "Good Food, Good Mood",
          "Eat Well, Live Well",
        ],
        rules: [
          "Short, punchy phrases",
          "Can use periods for emphasis",
          "Focus on freshness/quality",
        ],
      },
    ],
  },

  // =========================================================================
  // PROFESSIONAL SERVICES
  // =========================================================================
  {
    id: "professional-corporate-trust",
    name: "Corporate Trust Builder",
    industry: "professional-services",
    source: "awwwards",
    style: "corporate",
    colors: {
      primary: "#1E3A5F",      // Navy blue
      secondary: "#3B82F6",    // Bright blue
      accent: "#10B981",       // Green for trust
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#1E293B",
      textMuted: "#64748B",
    },
    typography: {
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      headingWeight: "700",
      bodyWeight: "400",
    },
    borderRadius: "md",
    shadowStyle: "medium",
    spacing: "balanced",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Trust-building hero with credentials",
          config: {
            variant: "centered",
            backgroundColor: "#1E3A5F",
            backgroundOverlay: false,
            titleColor: "#FFFFFF",
            subtitleColor: "#94A3B8",
            primaryButtonColor: "#3B82F6",
            primaryButtonTextColor: "#FFFFFF",
            secondaryButtonText: "View Our Work",
            secondaryButtonLink: "/portfolio",
            minHeight: "80vh",
          },
        },
        {
          component: "Stats",
          purpose: "Credibility numbers",
          config: {
            columns: 4,
            backgroundColor: "#FFFFFF",
            textColor: "#1E293B",
            valueColor: "#1E3A5F",
            items: [
              { value: "500+", label: "Clients Served" },
              { value: "15+", label: "Years Experience" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "24/7", label: "Support Available" },
            ],
          },
          animations: ["countUp", "staggeredFadeIn"],
        },
        {
          component: "Features",
          purpose: "Core services overview",
          config: {
            columns: 3,
            layout: "cards",
            backgroundColor: "#F8FAFC",
            cardBackground: "#FFFFFF",
            iconColor: "#3B82F6",
          },
        },
        {
          component: "Testimonials",
          purpose: "Client success stories",
          config: {
            layout: "grid",
            columns: 3,
            showCompany: true,
            showAvatar: true,
          },
        },
        {
          component: "CTA",
          purpose: "Consultation booking",
          config: {
            variant: "split",
            backgroundColor: "#1E3A5F",
            textColor: "#FFFFFF",
            buttonColor: "#10B981",
            buttonTextColor: "#FFFFFF",
          },
        },
      ],
      services: [
        {
          component: "Hero",
          purpose: "Services header",
          config: { variant: "compact", minHeight: "40vh" },
        },
        {
          component: "Features",
          purpose: "Detailed service cards",
          config: {
            columns: 2,
            layout: "detailed",
            showLearnMore: true,
          },
        },
        {
          component: "FAQ",
          purpose: "Service-related questions",
          config: {
            layout: "accordion",
            backgroundColor: "#F8FAFC",
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "Trusted Legal Counsel for Your Business",
          "Expert Financial Guidance You Can Count On",
          "Your Success Is Our Priority",
        ],
        rules: [
          "Emphasize trust and expertise",
          "Use 'Your' to personalize",
          "Avoid jargon in headlines",
        ],
      },
      {
        type: "cta",
        examples: [
          "Schedule Your Free Consultation",
          "Get Expert Advice Today",
          "Start Your Journey",
        ],
        rules: [
          "Offer something free/valuable",
          "Create low-friction entry point",
          "Use 'Your' not 'A'",
        ],
      },
    ],
  },

  // =========================================================================
  // CREATIVE / PORTFOLIO
  // =========================================================================
  {
    id: "portfolio-bold-creative",
    name: "Bold Creative Portfolio",
    industry: "portfolio",
    source: "dribbble",
    style: "bold",
    colors: {
      primary: "#000000",      // Black
      secondary: "#FF3366",    // Hot pink
      accent: "#00FF88",       // Neon green
      background: "#0A0A0A",   // Near black
      surface: "#1A1A1A",
      text: "#FFFFFF",
      textMuted: "#888888",
    },
    typography: {
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      headingWeight: "700",
      bodyWeight: "400",
    },
    borderRadius: "none",
    shadowStyle: "none",
    spacing: "spacious",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Bold statement hero",
          config: {
            variant: "fullscreen",
            backgroundColor: "#0A0A0A",
            titleColor: "#FFFFFF",
            subtitleColor: "#FF3366",
            primaryButtonColor: "#FF3366",
            primaryButtonTextColor: "#FFFFFF",
            minHeight: "100vh",
            titleSize: "6xl",
          },
          animations: ["typewriter", "fadeIn"],
        },
        {
          component: "Gallery",
          purpose: "Featured work showcase",
          config: {
            layout: "fullwidth",
            columns: 2,
            hoverEffect: "zoom",
            gap: 4,
          },
          animations: ["parallax", "fadeIn"],
        },
        {
          component: "Features",
          purpose: "Services or skills",
          config: {
            columns: 4,
            layout: "minimal",
            backgroundColor: "#0A0A0A",
            textColor: "#FFFFFF",
            numberColor: "#FF3366",
          },
        },
        {
          component: "CTA",
          purpose: "Hire me / Start project",
          config: {
            variant: "minimal",
            backgroundColor: "#FF3366",
            textColor: "#FFFFFF",
          },
        },
      ],
      portfolio: [
        {
          component: "Hero",
          purpose: "Work page header",
          config: { variant: "minimal", minHeight: "30vh" },
        },
        {
          component: "Gallery",
          purpose: "Full project grid",
          config: {
            layout: "masonry",
            columns: 3,
            showFilters: true,
            filterCategories: ["All", "Web", "Brand", "UI/UX"],
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "I Create Digital Experiences",
          "Design That Speaks",
          "Let's Build Something Great",
        ],
        rules: [
          "First person OK for portfolios",
          "Be confident, not arrogant",
          "Short and memorable",
        ],
      },
    ],
  },

  // =========================================================================
  // E-COMMERCE / RETAIL
  // =========================================================================
  {
    id: "ecommerce-modern-minimal",
    name: "Modern Minimal Shop",
    industry: "ecommerce",
    source: "awwwards",
    style: "minimal",
    colors: {
      primary: "#000000",
      secondary: "#F5F5F5",
      accent: "#E63946",       // Sale red
      background: "#FFFFFF",
      surface: "#FAFAFA",
      text: "#1A1A1A",
      textMuted: "#666666",
    },
    typography: {
      headingFont: "Neue Haas Grotesk",
      bodyFont: "Helvetica Neue",
      headingWeight: "500",
      bodyWeight: "400",
    },
    borderRadius: "none",
    shadowStyle: "subtle",
    spacing: "spacious",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Featured collection hero",
          config: {
            variant: "fullscreen",
            backgroundOverlay: true,
            backgroundOverlayOpacity: 30,
            titleColor: "#FFFFFF",
            primaryButtonColor: "#FFFFFF",
            primaryButtonTextColor: "#000000",
            minHeight: "100vh",
          },
        },
        {
          component: "Features",
          purpose: "Trust badges - shipping, returns, support",
          config: {
            columns: 4,
            layout: "icons",
            backgroundColor: "#FFFFFF",
            iconColor: "#000000",
          },
        },
        {
          component: "Gallery",
          purpose: "Product categories",
          config: {
            layout: "grid",
            columns: 3,
            aspectRatio: "portrait",
          },
        },
        {
          component: "Testimonials",
          purpose: "Customer reviews",
          config: {
            layout: "carousel",
            showRating: true,
          },
        },
        {
          component: "CTA",
          purpose: "Newsletter signup with discount",
          config: {
            variant: "newsletter",
            backgroundColor: "#000000",
            textColor: "#FFFFFF",
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "New Arrivals",
          "Crafted for You",
          "The Collection",
        ],
        rules: [
          "Ultra minimal - 2-3 words max",
          "Let imagery do the talking",
          "Avoid hard-sell language",
        ],
      },
      {
        type: "cta",
        examples: [
          "Shop Now",
          "Explore",
          "View Collection",
        ],
        rules: [
          "Simple, one action",
          "No 'Buy Now' - too aggressive",
          "Invite exploration",
        ],
      },
    ],
  },

  // =========================================================================
  // FITNESS / GYM / WELLNESS
  // =========================================================================
  {
    id: "fitness-energy-bold",
    name: "High Energy Fitness",
    industry: "fitness",
    source: "dribbble",
    style: "bold",
    colors: {
      primary: "#FF4D4D",      // Energy red
      secondary: "#1A1A2E",    // Dark navy
      accent: "#FFD93D",       // Yellow accent
      background: "#0F0F1A",
      surface: "#1A1A2E",
      text: "#FFFFFF",
      textMuted: "#9CA3AF",
    },
    typography: {
      headingFont: "Oswald",
      bodyFont: "Roboto",
      headingWeight: "700",
      bodyWeight: "400",
    },
    borderRadius: "md",
    shadowStyle: "dramatic",
    spacing: "balanced",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Motivational hero with action shot",
          config: {
            variant: "fullscreen",
            backgroundOverlay: true,
            backgroundOverlayOpacity: 70,
            backgroundOverlayColor: "#0F0F1A",
            titleColor: "#FFFFFF",
            subtitleColor: "#FF4D4D",
            primaryButtonColor: "#FF4D4D",
            primaryButtonTextColor: "#FFFFFF",
            minHeight: "100vh",
          },
          animations: ["fadeIn", "pulse"],
        },
        {
          component: "Stats",
          purpose: "Achievement numbers",
          config: {
            columns: 4,
            backgroundColor: "#FF4D4D",
            textColor: "#FFFFFF",
          },
          animations: ["countUp"],
        },
        {
          component: "Features",
          purpose: "Programs or classes",
          config: {
            columns: 3,
            layout: "cards",
            backgroundColor: "#0F0F1A",
            cardBackground: "#1A1A2E",
            iconColor: "#FF4D4D",
          },
        },
        {
          component: "Pricing",
          purpose: "Membership plans",
          config: {
            columns: 3,
            highlightedPlan: "middle",
            backgroundColor: "#1A1A2E",
            accentColor: "#FF4D4D",
          },
        },
        {
          component: "Testimonials",
          purpose: "Transformation stories",
          config: {
            layout: "carousel",
            showBeforeAfter: true,
          },
        },
        {
          component: "CTA",
          purpose: "Free trial CTA",
          config: {
            variant: "bold",
            backgroundColor: "#FF4D4D",
            textColor: "#FFFFFF",
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "Transform Your Body",
          "Unleash Your Potential",
          "No Limits. No Excuses.",
        ],
        rules: [
          "Motivational and action-oriented",
          "Can use periods/caps for impact",
          "Focus on transformation",
        ],
      },
      {
        type: "cta",
        examples: [
          "Start Your Free Trial",
          "Join the Movement",
          "Get Started Today",
        ],
        rules: [
          "Low barrier to entry",
          "Action verbs",
          "Create urgency",
        ],
      },
    ],
  },

  // =========================================================================
  // SPA / WELLNESS
  // =========================================================================
  {
    id: "spa-serene-elegant",
    name: "Serene Spa Experience",
    industry: "spa",
    source: "awwwards",
    style: "elegant",
    colors: {
      primary: "#7C9A92",      // Sage green
      secondary: "#D4B896",    // Warm beige
      accent: "#E8DFD0",       // Cream
      background: "#FAF9F7",   // Warm white
      surface: "#FFFFFF",
      text: "#3D3D3D",
      textMuted: "#7A7A7A",
    },
    typography: {
      headingFont: "Cormorant Garamond",
      bodyFont: "Lato",
      headingWeight: "500",
      bodyWeight: "400",
    },
    borderRadius: "sm",
    shadowStyle: "subtle",
    spacing: "spacious",
    pageStructures: {
      homepage: [
        {
          component: "Hero",
          purpose: "Calming hero with serene imagery",
          config: {
            variant: "fullscreen",
            backgroundOverlay: true,
            backgroundOverlayOpacity: 40,
            backgroundOverlayColor: "#3D3D3D",
            titleColor: "#FFFFFF",
            subtitleColor: "#E8DFD0",
            primaryButtonColor: "#7C9A92",
            primaryButtonTextColor: "#FFFFFF",
            minHeight: "90vh",
          },
          animations: ["slowFadeIn"],
        },
        {
          component: "Features",
          purpose: "Services overview",
          config: {
            columns: 3,
            layout: "elegant",
            backgroundColor: "#FAF9F7",
            iconColor: "#7C9A92",
          },
        },
        {
          component: "Gallery",
          purpose: "Spa environment photos",
          config: {
            layout: "masonry",
            columns: 3,
            gap: 16,
          },
        },
        {
          component: "Pricing",
          purpose: "Treatment packages",
          config: {
            columns: 3,
            backgroundColor: "#FFFFFF",
            accentColor: "#7C9A92",
          },
        },
        {
          component: "CTA",
          purpose: "Book appointment",
          config: {
            variant: "elegant",
            backgroundColor: "#7C9A92",
            textColor: "#FFFFFF",
          },
        },
      ],
    },
    contentPatterns: [
      {
        type: "headline",
        examples: [
          "Restore. Renew. Relax.",
          "Your Sanctuary Awaits",
          "The Art of Relaxation",
        ],
        rules: [
          "Soft, calming language",
          "Three-word patterns work well",
          "Avoid aggressive energy",
        ],
      },
    ],
  },
];

// =============================================================================
// REFERENCE FINDER
// =============================================================================

/**
 * Find the best design reference for a given industry and style
 */
export function findDesignReference(
  industry: string,
  preferredStyle?: string
): DesignReference | null {
  const industryLower = industry.toLowerCase();
  
  // Industry aliases
  const industryMap: Record<string, string[]> = {
    "restaurant": ["restaurant", "cafe", "café", "bar", "food", "dining", "eatery", "bistro"],
    "professional-services": ["law", "legal", "accounting", "consulting", "financial", "medical", "healthcare", "insurance"],
    "portfolio": ["portfolio", "creative", "freelance", "artist", "designer", "agency", "studio"],
    "ecommerce": ["ecommerce", "shop", "store", "retail", "boutique", "fashion"],
    "fitness": ["fitness", "gym", "crossfit", "workout", "training", "sports"],
    "spa": ["spa", "wellness", "beauty", "salon", "massage", "skincare"],
  };

  // Find matching industry
  let matchedIndustry: string | null = null;
  for (const [key, aliases] of Object.entries(industryMap)) {
    if (aliases.some(alias => industryLower.includes(alias))) {
      matchedIndustry = key;
      break;
    }
  }

  if (!matchedIndustry) {
    // Default to professional services
    matchedIndustry = "professional-services";
  }

  // Find references for this industry
  const matches = DESIGN_REFERENCES.filter(ref => ref.industry === matchedIndustry);
  
  if (matches.length === 0) {
    return DESIGN_REFERENCES[0]; // Fallback to first reference
  }

  // If preferred style specified, try to match
  if (preferredStyle) {
    const styleLower = preferredStyle.toLowerCase();
    const styleMatch = matches.find(ref => ref.style === styleLower);
    if (styleMatch) return styleMatch;
  }

  // Return first match
  return matches[0];
}

/**
 * Get all references for an industry
 */
export function getIndustryReferences(industry: string): DesignReference[] {
  return DESIGN_REFERENCES.filter(ref => 
    ref.industry.toLowerCase().includes(industry.toLowerCase())
  );
}

/**
 * Format reference as prompt context for AI
 */
export function formatReferenceForAI(reference: DesignReference): string {
  return `
## DESIGN REFERENCE: ${reference.name}
Source: ${reference.source} (Industry: ${reference.industry})
Style: ${reference.style}

### EXACT COLOR PALETTE (USE THESE VALUES):
- Primary: ${reference.colors.primary}
- Secondary: ${reference.colors.secondary}
- Accent: ${reference.colors.accent}
- Background: ${reference.colors.background}
- Surface: ${reference.colors.surface}
- Text: ${reference.colors.text}
- Text Muted: ${reference.colors.textMuted}

### TYPOGRAPHY:
- Headings: ${reference.typography.headingFont} (weight: ${reference.typography.headingWeight})
- Body: ${reference.typography.bodyFont} (weight: ${reference.typography.bodyWeight})

### DESIGN SETTINGS:
- Border Radius: ${reference.borderRadius}
- Shadows: ${reference.shadowStyle}
- Spacing: ${reference.spacing}

### HOMEPAGE STRUCTURE (FOLLOW EXACTLY):
${reference.pageStructures.homepage.map((section, i) => `
${i + 1}. ${section.component}
   Purpose: ${section.purpose}
   Config: ${JSON.stringify(section.config, null, 2)}
   ${section.animations ? `Animations: ${section.animations.join(", ")}` : ""}
`).join("\n")}

### CONTENT PATTERNS:
${reference.contentPatterns.map(pattern => `
**${pattern.type.toUpperCase()}:**
Examples: ${pattern.examples.map(e => `"${e}"`).join(", ")}
Rules: ${pattern.rules.join("; ")}
`).join("\n")}

IMPORTANT: Use the EXACT colors and follow the EXACT section structure. Do not improvise.
`;
}
