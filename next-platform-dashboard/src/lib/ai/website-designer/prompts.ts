/**
 * PHASE AWD-10: AI-First Redesign — Prompts
 * 
 * Philosophy: The AI is the designer. We give it context and tools, then get out of the way.
 * Prompts inform and empower — they don't constrain or micromanage.
 * 
 * Key changes from the old system:
 * - No rigid "VIOLATION = FAILURE" rules
 * - No hardcoded color rules or 8px grid mandates
 * - No prescriptive industry blueprints
 * - Dynamic component reference cards from the live registry
 * - AI has full creative control over every visual decision
 */

import { generateArchitectureReference, generatePageReference } from "./component-reference";

// =============================================================================
// SITE ARCHITECT PROMPT — Concise, empowering, trusts the AI
// =============================================================================

export const SITE_ARCHITECT_PROMPT = `You are a world-class web designer. Every website you create is unique, custom-tailored to the business, and looks like it was built by a premium agency.

## YOUR ROLE
Read the user's description carefully. Every design decision — colors, typography, spacing, animations, layout, tone — should serve THIS specific business. No two sites should look alike.

## CREATIVE MANDATE
You have full creative control over the design system:
- Choose colors that match the business identity, industry psychology, and audience expectations
- Select typography that reinforces the brand personality
- Determine spacing, border radius, and shadow style that fit the mood
- Plan section layouts and page flow for optimal conversion and user experience
- Consider the emotional tone: a luxury spa feels different from a children's toy store

## QUALITY BAR
- Every page should be rich and complete — no skeleton pages
- Content should be specific to THIS business, not generic placeholder text
- Use the EXACT business name from the user's request

## STRUCTURAL GUIDANCE
- Home pages should be rich: 6-8 sections (Hero, Features/Services, Social Proof, Testimonials, Stats, CTA, etc.)
- Inner pages should be complete: 4+ sections minimum (never just Hero + CTA)
- Every page should end with a conversion-driving CTA section
- Create 3-5 pages appropriate for the business type

## INDUSTRY AWARENESS
Match the site's tone and structure to the business type:
- Restaurants: menu sections, reservation CTAs, food imagery, warm inviting tone
- Professional services: trust-building credentials, team showcase, consultation CTAs
- E-commerce: product showcases, trust badges, clear pricing, shopping-focused CTAs
- Creative/portfolio: visual-first galleries, bold typography, project showcases
- Healthcare: clean calming design, credential emphasis, appointment booking
- Construction: project galleries, estimate CTAs, safety/quality credentials
- Barbershop/salon: service menus with prices, booking CTAs, gallery of work
Use your judgment for each unique business — don't follow rigid recipes.

## LINKS
Every link must point to a real page you're creating (/, /about, /services, /contact, etc.). Never use "#" or empty strings.

## OUTPUT
1. Use the EXACT business name from user's request
2. Create 3-5 pages appropriate for the industry
3. Every link points to real pages you're creating
4. Consistent design across all pages
5. Each section plan needs: clear intent, suggested component, detailed designNotes, content guidance

Your output should be so well-planned that every page feels complete and professional.`;

// =============================================================================
// PAGE GENERATOR PROMPT — Essentials only, full creative freedom
// =============================================================================

export const PAGE_GENERATOR_PROMPT = `You are a world-class UI designer creating complete, polished page layouts. You have full creative control over every visual decision.

## ESSENTIAL RULES (prevent actual bugs)

### DO NOT generate Navbar or Footer
They are created separately and added automatically. If you include them, the page will have duplicates.

### Use the business name from context
Always use the exact business name provided. Every headline and content must reference the actual business.

### Links must be real
All href values must point to real pages: "/", "/about", "/services", "/contact", etc. Never use "#" or empty strings. CTA buttons should link to actual conversion pages.

### Background image readability
When using a background image on Hero or any section:
- Set backgroundOverlay: true
- Set backgroundOverlayOpacity: 60-80
- Use light text colors (#ffffff) over overlays for readability

### Use emoji for feature icons
The renderer displays emojis directly but cannot render text icon names. Use emoji: e.g. scissors emoji not "scissors", phone emoji not "phone".

## CREATIVE FREEDOM
- You have full control over colors, spacing, typography, animations, and layout
- Use the full range of component props to achieve your vision — you can see every available prop in the reference cards below
- Make this site unique to this business — avoid generic, template-like designs
- Consider the emotional tone: luxury brands feel different from playful startups
- You can use ANY component from the reference — you are not limited to the section plan's suggestions
- Choose component variants that best serve the content and design vision
- Set explicit color props on every component for a cohesive design (backgroundColor, textColor, etc.)

## CONTENT QUALITY
- Generate specific, compelling content for THIS business — no generic placeholder text
- Match the brand tone: professional, friendly, luxurious, playful, authoritative, etc.
- Feature descriptions should highlight BENEFITS, not just list features
- Testimonials should feel authentic and specific
- CTAs should be industry-appropriate (e.g. "Book Appointment" for salons, "Reserve a Table" for restaurants)
- Include specific numbers when possible (e.g., "500+ happy clients", "15 years of experience")

## OUTPUT
Return fully configured components where every prop is intentionally set.
Include aiNotes explaining your design decisions.`;

// =============================================================================
// NAVBAR GENERATOR PROMPT
// =============================================================================

export const NAVBAR_GENERATOR_PROMPT = `You are designing a premium navigation bar for a specific business website.

## REQUIRED CONFIGURATION
- position: "sticky"
- hideOnScroll: true
- showOnScrollUp: true
- mobileMenuStyle: "fullscreen"
- logoText: Use the ACTUAL business name from context
- logoLink: "/"

## NAVIGATION LINKS
- Every href must point to an ACTUAL page being generated
- Include 4-6 main navigation items
- Order by importance/user journey

## CTA BUTTON
- ctaText: Match the business type (e.g., "Book Now" for salons, "Reserve" for restaurants, "Shop Now" for e-commerce, "Get Quote" for services)
- ctaLink: Point to the most important conversion page
- ctaStyle: "solid"
- Make button colors contrast well with the navbar background

## COLORS
- Match the site's design tokens for consistency
- If the site has a dark theme, use dark navbar with light text
- Ensure the mobile menu background matches the navbar theme

Configure ALL navbar props for a modern, responsive navigation.`;

// =============================================================================
// FOOTER GENERATOR PROMPT
// =============================================================================

export const FOOTER_GENERATOR_PROMPT = `You are designing a premium footer for a specific business website.

## CRITICAL RULES

### Use real business data
- The tagline/description MUST describe THIS specific business
- Column links must be relevant to the business type
- NEVER use generic corporate text like "Building the future of web design"

### Column content must match the business
- Service businesses: Services column with actual services, Quick Links, Visit Us with hours
- Restaurants: Menu categories, Visit column with reservation/hours, About
- E-commerce: Shop categories, Help (shipping/returns/FAQ), Company info
- Professional: Service categories, Company, Support/Contact

### Social links
Only include platforms the business actually uses. If no data provided, include common defaults.

### Copyright
Format: "YYYY Business Name. All rights reserved." — use the EXACT business name.

### Tagline
Must be specific to this business (e.g., "Premium grooming services in Lusaka since 2016"). Never generic.

### Legal links
Always include Privacy Policy (/privacy) and Terms of Service (/terms).

### Theme consistency
Footer colors must match the site's overall theme. A white footer on a dark site is a glaring inconsistency.

Configure ALL footer props for a complete, polished result.`;

// =============================================================================
// CONTENT GENERATION PROMPTS (kept for potential future use)
// =============================================================================

export const HEADLINE_PROMPT = `Generate a compelling headline that:
- Is 5-10 words
- Captures attention immediately
- Communicates the main value proposition
- Uses active voice
- Creates emotional connection`;

export const SUBHEADLINE_PROMPT = `Generate a supporting subheadline that:
- Is 15-25 words
- Expands on the headline
- Provides more detail or context
- Maintains the brand tone
- Encourages further reading`;

export const CTA_BUTTON_PROMPT = `Generate a call-to-action that:
- Is 2-4 words
- Uses action verbs
- Creates urgency or excitement
- Is specific to the context
- Tells user exactly what happens next`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse user prompt to extract key business details
 */
export function parseUserPrompt(userPrompt: string): {
  businessName: string | null;
  businessType: string | null;
  location: string | null;
  keyFeatures: string[];
} {
  // Try multiple patterns for business name extraction (order: most specific -> least)
  const patterns = [
    // "called X" or "named X"
    /(?:called|named)\s+["']?([^"'\n,]+?)["']?\s*(?:in|located|based|that|which|with|\.|,|$)/i,
    // "for X in Y" or "for X"
    /(?:for|website for|site for)\s+["']?([^"'\n,]+?)["']?\s*(?:in|located|based|that|which|with|\.|,|$)/i,
    // "create a X website" pattern
    /^(?:create|build|make|design)\s+(?:a\s+)?(?:website\s+)?(?:for\s+)?["']?([^"'\n,]+?)["']?\s+/i,
    // Anything in quotes
    /["']([^"']+)["']/i,
  ];

  let businessName: string | null = null;
  const falsePositives = ["a", "the", "my", "our", "this", "website", "site", "page", "me", "us"];

  for (const pattern of patterns) {
    const match = userPrompt.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      if (!falsePositives.includes(candidate.toLowerCase()) && candidate.length > 1) {
        businessName = candidate;
        break;
      }
    }
  }

  // Try to extract business type (restaurant, cafe, shop, etc.)
  const businessTypes = ["restaurant", "cafe", "cafe", "bakery", "coffee shop", "bar", "hotel", "spa",
    "gym", "fitness", "salon", "barbershop", "barber shop", "hair salon", "beauty salon", "nail salon",
    "clinic", "dental", "medical", "law firm", "legal",
    "accounting", "consulting", "agency", "studio", "gallery", "boutique", "shop", "store",
    "ecommerce", "startup", "tech", "software", "real estate", "construction", "plumbing",
    "electrician", "photography", "wedding", "event", "catering", "landscaping", "cleaning",
    "veterinarian", "vet clinic", "pet store", "florist", "tattoo", "music school", "daycare",
    "car wash", "auto repair", "brewery", "winery", "car dealership", "insurance"];
  const businessType = businessTypes.find(type => userPrompt.toLowerCase().includes(type));

  // Try to extract location
  const locationMatch = userPrompt.match(/(?:in|at|located in|based in)\s+([A-Za-z\s,]+?)(?:\.|,|$|\s+(?:that|which|with))/i);

  // Extract key features mentioned
  const features: string[] = [];
  if (userPrompt.toLowerCase().includes("book")) features.push("booking system");
  if (userPrompt.toLowerCase().includes("reserv")) features.push("reservations");
  if (userPrompt.toLowerCase().includes("menu")) features.push("menu display");
  if (userPrompt.toLowerCase().includes("portfolio")) features.push("portfolio gallery");
  if (userPrompt.toLowerCase().includes("shop") || userPrompt.toLowerCase().includes("store") || userPrompt.toLowerCase().includes("ecommerce")) features.push("e-commerce");
  if (userPrompt.toLowerCase().includes("contact")) features.push("contact form");
  if (userPrompt.toLowerCase().includes("testimonial")) features.push("testimonials");
  if (userPrompt.toLowerCase().includes("gallery")) features.push("gallery");
  if (userPrompt.toLowerCase().includes("pricing") || userPrompt.toLowerCase().includes("price")) features.push("pricing");
  if (userPrompt.toLowerCase().includes("blog")) features.push("blog");

  return {
    businessName: businessName,
    businessType: businessType || null,
    location: locationMatch ? locationMatch[1].trim() : null,
    keyFeatures: features,
  };
}

/**
 * Build complete prompt for architecture generation
 * AI-First: Provides rich context + dynamic component catalog, no rigid rules
 */
export function buildArchitecturePrompt(
  userPrompt: string,
  context: string,
  componentSummary: string,
  personalityContext?: string
): string {
  const parsed = parseUserPrompt(userPrompt);

  // Generate dynamic component reference from the live registry
  const componentReference = generateArchitectureReference();

  return `## USER'S REQUEST (HIGHEST PRIORITY)
"${userPrompt}"

${parsed.businessName ? `### Business Name: "${parsed.businessName}"
Use this name in all headlines, content, and branding.` : ""}
${parsed.businessType ? `### Business Type: ${parsed.businessType}
Design specifically for this type of business.` : ""}
${parsed.location ? `### Location: ${parsed.location}
Include in footer and location-relevant sections.` : ""}
${parsed.keyFeatures.length > 0 ? `### Requested Features: ${parsed.keyFeatures.join(", ")}
Include appropriate sections for each.` : ""}

## Business Context (from database — use to supplement, not override user's request)
${context}

${personalityContext ? `## Design Personality Context
${personalityContext}
` : ""}

## Full Component Catalog
The following components are available in the registry. Choose the ones that best serve this business:

${componentReference}

## YOUR TASK
Create a comprehensive site architecture that:
1. Uses the business name/type from the user's request
2. Includes all features the user mentioned
3. Is appropriate for the industry
4. Has a cohesive, unique design throughout
5. Choose design tokens (colors, fonts, spacing) that match THIS specific business identity

Remember: The user's prompt is the primary source of truth. The database context supplements it.`;
}

/**
 * Classify a page by its slug/name to determine its type
 */
function classifyPageType(pageName: string, pageSlug?: string): { type: string; minSections: number; guidance: string } {
  const name = pageName.toLowerCase();
  const slug = (pageSlug || "").toLowerCase();

  if (slug === "/" || slug === "" || name === "home" || name === "homepage") {
    return { type: "homepage", minSections: 6, guidance: "This is the HOMEPAGE — the most important page. Make it stunning with 6-8 sections." };
  }
  if (name.includes("about") || slug.includes("about") || name.includes("our story") || slug.includes("story")) {
    return { type: "about", minSections: 4, guidance: "ABOUT page — visitors here are evaluating trust. Generate 4-6 rich sections with brand story, team, values, stats." };
  }
  if (name.includes("service") || slug.includes("service") || name.includes("what we do") || slug.includes("offerings")) {
    return { type: "services", minSections: 4, guidance: "SERVICES page — visitors want detail. Generate 4-6 sections with detailed service descriptions, process, FAQ." };
  }
  if (name.includes("contact") || slug.includes("contact") || name.includes("get in touch") || slug.includes("reach")) {
    return { type: "contact", minSections: 3, guidance: "CONTACT page — make the form prominent. Include contact methods, hours, FAQ." };
  }
  if (name.includes("pricing") || slug.includes("pricing") || name.includes("plans") || slug.includes("plans")) {
    return { type: "pricing", minSections: 3, guidance: "PRICING page — help visitors choose. 3 tiers, feature comparison, FAQ, CTA." };
  }
  if (name.includes("portfolio") || slug.includes("portfolio") || name.includes("work") || slug.includes("work") || name.includes("projects") || slug.includes("gallery")) {
    return { type: "portfolio", minSections: 3, guidance: "PORTFOLIO/GALLERY page — let the work speak. Gallery grid, testimonials, CTA." };
  }
  if (name.includes("team") || slug.includes("team") || name.includes("staff") || slug.includes("staff")) {
    return { type: "team", minSections: 3, guidance: "TEAM page — detailed bios, credentials, photos." };
  }
  if (name.includes("faq") || slug.includes("faq")) {
    return { type: "faq", minSections: 3, guidance: "FAQ page — 8-12 questions with comprehensive answers." };
  }
  if (name.includes("blog") || slug.includes("blog") || name.includes("news") || slug.includes("news")) {
    return { type: "blog", minSections: 3, guidance: "BLOG/NEWS page — article previews, newsletter signup, CTA." };
  }
  if (name.includes("menu") || slug.includes("menu")) {
    return { type: "menu", minSections: 3, guidance: "MENU page — categorized items with prices, reservation CTA." };
  }
  return { type: "inner-page", minSections: 4, guidance: "Inner page — at minimum 4 sections: Hero + 2 content sections + CTA." };
}

/**
 * Build complete prompt for page generation
 * AI-First: Context + personality + dynamic component reference cards
 */
export function buildPagePrompt(
  pagePlan: { name: string; slug?: string; purpose: string; sections: unknown[] },
  context: string,
  designTokens: Record<string, unknown>,
  componentDetails: unknown[],
  userPrompt?: string,
  blueprintPageContext?: string,
  allPages?: Array<{ name: string; slug: string }>,
  personalityContext?: string,
): string {
  const pageClassification = classifyPageType(pagePlan.name, pagePlan.slug);
  const isHomepage = pageClassification.type === "homepage";

  // Extract component types from the section plan for full-detail reference cards
  const suggestedTypes = (pagePlan.sections as Array<{ suggestedComponent?: string }>)
    .map(s => s.suggestedComponent)
    .filter(Boolean) as string[];

  // Generate dynamic component reference cards
  const componentReference = generatePageReference(suggestedTypes, true);

  return `## Page: ${pagePlan.name}${pagePlan.slug ? ` (${pagePlan.slug})` : ""}
Purpose: ${pagePlan.purpose}
Page Type: ${pageClassification.type.toUpperCase()}

## Page Guidance
${pageClassification.guidance}
Minimum sections: ${pageClassification.minSections}
${!isHomepage ? `This is NOT the homepage — go deeper on topics that may have been previewed on the home page.` : ""}

${allPages && allPages.length > 0 ? `## Site Structure (for internal linking)
${allPages.map(p => `- ${p.name}: ${p.slug}`).join("\n")}
Use these exact slugs for ALL internal links and CTAs.` : ""}

${userPrompt ? `## User's Original Request
"${userPrompt}"` : ""}

## Business Context
${context}

## Design Tokens (the AI chose these at architecture stage — maintain consistency)
${JSON.stringify(designTokens, null, 2)}

${personalityContext ? `## Design Personality (maintain consistency across pages)
${personalityContext}` : ""}

## Sections to Generate
${JSON.stringify(pagePlan.sections, null, 2)}

## Component Reference
${componentReference}

## OUTPUT
Generate complete component configurations for this page. Every prop should be intentionally set.
Apply the design tokens consistently across all components for a cohesive look.
Generate compelling, business-specific content — not generic placeholder text.`;
}
