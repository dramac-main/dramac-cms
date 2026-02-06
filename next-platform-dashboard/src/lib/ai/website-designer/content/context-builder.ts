/**
 * PHASE AWD-06: Content Generation Engine
 * Content Context Builder
 *
 * Builds comprehensive content generation context from business data.
 * This context is used by AI to generate tailored, conversion-optimized content.
 */

import type { BusinessDataContext } from "../data-context/types";
import type {
  ContentGenerationContext,
  ContentTone,
  ContentStyle,
  BusinessIdentity,
} from "./types";

// =============================================================================
// MAIN CONTEXT BUILDER
// =============================================================================

/**
 * Build complete content generation context from business data
 */
export function buildContentContext(
  businessContext: BusinessDataContext,
  industry: string,
  tone: ContentTone
): ContentGenerationContext {
  // Build business identity
  const business = buildBusinessIdentity(businessContext, industry);

  // Get style from tone
  const style = getStyleFromTone(tone);

  // Infer SEO keywords
  const seoKeywords = inferSEOKeywords(industry, businessContext);

  return {
    business,
    tone,
    style,
    seoKeywords,
  };
}

// =============================================================================
// BUSINESS IDENTITY BUILDER
// =============================================================================

/**
 * Build business identity from data context
 */
function buildBusinessIdentity(
  context: BusinessDataContext,
  industry: string
): BusinessIdentity {
  // Get business name from multiple sources
  const name =
    context.branding?.business_name ||
    context.client?.company ||
    context.client?.company_name ||
    context.site?.name ||
    "Business";

  // Get or infer description
  const description =
    context.client?.description ||
    context.client?.notes ||
    context.site?.description;

  // Infer target audience
  const targetAudience = inferTargetAudience(industry, context);

  // Build unique value proposition
  const uniqueValueProposition =
    context.client?.notes || inferUVP(industry, context);

  return {
    name,
    industry,
    description,
    uniqueValueProposition,
    targetAudience,
  };
}

// =============================================================================
// AUDIENCE INFERENCE
// =============================================================================

/**
 * Infer target audience based on industry and available data
 */
function inferTargetAudience(
  industry: string,
  context: BusinessDataContext
): string {
  // Industry-specific audience mappings
  const audienceMap: Record<string, string> = {
    restaurant:
      "Food lovers and local diners seeking memorable dining experiences",
    "law-firm":
      "Individuals and businesses seeking expert legal representation and guidance",
    saas: "Businesses and teams looking to streamline their workflows and boost productivity",
    ecommerce:
      "Shoppers seeking quality products, competitive prices, and excellent customer service",
    healthcare:
      "Patients seeking trusted, compassionate healthcare and personalized treatment",
    "real-estate":
      "Home buyers, sellers, and investors looking for expert guidance in property transactions",
    portfolio:
      "Clients seeking creative, professional services and innovative solutions",
    construction:
      "Homeowners and businesses needing reliable, quality construction and renovation services",
    education:
      "Students and professionals seeking to expand their knowledge and skills",
    nonprofit:
      "Supporters and donors passionate about making a positive community impact",
    agency:
      "Businesses looking for expert marketing, design, or creative services",
    gym: "Fitness enthusiasts looking to achieve their health and wellness goals",
    fitness:
      "Fitness enthusiasts looking to achieve their health and wellness goals",
    spa: "Individuals seeking relaxation, rejuvenation, and self-care treatments",
    salon:
      "Clients looking for professional beauty services and personalized styling",
    hotel:
      "Travelers seeking comfortable accommodations and memorable experiences",
    automotive:
      "Vehicle owners seeking reliable service and quality automotive care",
    photography:
      "Clients seeking professional photography for special moments and memories",
    wedding:
      "Couples planning their perfect wedding day with attention to every detail",
    dental:
      "Patients seeking quality dental care in a comfortable, modern environment",
    veterinary:
      "Pet owners who care deeply about their animals' health and wellbeing",
    consulting:
      "Businesses seeking expert guidance to solve challenges and grow",
    accounting:
      "Individuals and businesses needing professional financial services",
    insurance:
      "Individuals and families looking for protection and peace of mind",
    technology:
      "Tech-savvy users and businesses seeking innovative solutions",
    startup:
      "Innovators and early adopters excited about cutting-edge solutions",
  };

  // Check for service-based audience refinement
  if (context.services && context.services.length > 0) {
    const serviceNames = context.services.map((s) => s.name.toLowerCase()).join(" ");
    
    // Refine based on service keywords
    if (serviceNames.includes("enterprise") || serviceNames.includes("corporate")) {
      return audienceMap[industry]
        ? audienceMap[industry].replace("Businesses", "Enterprise organizations")
        : "Enterprise organizations seeking scalable solutions";
    }
    if (serviceNames.includes("small business") || serviceNames.includes("startup")) {
      return audienceMap[industry]
        ? audienceMap[industry].replace("Businesses", "Small businesses and startups")
        : "Small businesses and startups seeking growth";
    }
  }

  return (
    audienceMap[industry.toLowerCase()] ||
    "Customers seeking quality products and services with exceptional customer experience"
  );
}

// =============================================================================
// VALUE PROPOSITION INFERENCE
// =============================================================================

/**
 * Infer unique value proposition from industry and available data
 */
function inferUVP(industry: string, context: BusinessDataContext): string {
  // Use services/features to build UVP if available
  const services = context.services;
  if (services && services.length > 0) {
    const topServices = services
      .slice(0, 3)
      .map((s) => s.name)
      .join(", ");
    return `Providing ${topServices} with excellence, dedication, and personalized attention`;
  }

  // Industry-specific UVP mappings
  const uvpMap: Record<string, string> = {
    restaurant:
      "Exceptional cuisine crafted with fresh ingredients and unforgettable dining experiences",
    "law-firm":
      "Dedicated legal representation with a proven track record of winning results",
    saas: "Powerful, intuitive solutions that save time and dramatically boost productivity",
    ecommerce:
      "Quality products, competitive prices, and a shopping experience you'll love",
    healthcare:
      "Compassionate, patient-centered care focused on your complete well-being",
    "real-estate":
      "Expert guidance and personalized service for every step of your property journey",
    portfolio:
      "Creative excellence and innovative solutions that make your vision a reality",
    construction:
      "Quality craftsmanship, on-time delivery, and builds that stand the test of time",
    education:
      "Transformative learning experiences that unlock your full potential",
    nonprofit:
      "Making a real, measurable difference in the lives of those we serve",
    agency:
      "Strategic creativity that drives results and builds lasting brand success",
    gym: "State-of-the-art facilities and expert guidance to achieve your fitness goals",
    fitness:
      "Personalized training programs designed to transform your health and fitness",
    spa: "Luxurious treatments and tranquil environments for complete rejuvenation",
    salon:
      "Expert stylists and premium products for looks that turn heads",
    hotel:
      "Exceptional hospitality and amenities that make every stay memorable",
    automotive:
      "Professional service, quality parts, and care you can trust for your vehicle",
    photography:
      "Capturing life's precious moments with artistic vision and technical excellence",
    wedding:
      "Creating the wedding of your dreams with meticulous attention to every detail",
    dental:
      "Modern dental care with a gentle touch in a comfortable, welcoming environment",
    veterinary:
      "Compassionate care for your furry family members from people who truly care",
    consulting:
      "Expert insights and proven strategies that drive real business results",
    accounting:
      "Precise financial services and strategic advice to help you prosper",
    insurance:
      "Comprehensive coverage and peace of mind with personalized service",
    technology:
      "Cutting-edge solutions that solve real problems and drive innovation",
    startup:
      "Innovative solutions built for the future, designed to disrupt and lead",
  };

  return (
    uvpMap[industry.toLowerCase()] ||
    "Quality service, exceptional value, and customer satisfaction guaranteed"
  );
}

// =============================================================================
// STYLE INFERENCE
// =============================================================================

/**
 * Get content style configuration based on tone
 */
function getStyleFromTone(tone: ContentTone): ContentStyle {
  const styleMap: Record<ContentTone, ContentStyle> = {
    professional: {
      formality: "formal",
      length: "moderate",
      complexity: "moderate",
      persuasion: "soft",
    },
    friendly: {
      formality: "casual",
      length: "concise",
      complexity: "simple",
      persuasion: "soft",
    },
    authoritative: {
      formality: "formal",
      length: "detailed",
      complexity: "sophisticated",
      persuasion: "moderate",
    },
    playful: {
      formality: "casual",
      length: "concise",
      complexity: "simple",
      persuasion: "soft",
    },
    inspirational: {
      formality: "neutral",
      length: "moderate",
      complexity: "moderate",
      persuasion: "moderate",
    },
    urgent: {
      formality: "neutral",
      length: "concise",
      complexity: "simple",
      persuasion: "aggressive",
    },
    conversational: {
      formality: "casual",
      length: "moderate",
      complexity: "simple",
      persuasion: "soft",
    },
    technical: {
      formality: "formal",
      length: "detailed",
      complexity: "sophisticated",
      persuasion: "soft",
    },
  };

  return styleMap[tone];
}

// =============================================================================
// SEO KEYWORD INFERENCE
// =============================================================================

/**
 * Infer SEO keywords from industry and business data
 */
function inferSEOKeywords(
  industry: string,
  context: BusinessDataContext
): string[] {
  const keywords: string[] = [];

  // Industry-specific base keywords
  const industryKeywords: Record<string, string[]> = {
    restaurant: [
      "restaurant",
      "dining",
      "food",
      "cuisine",
      "local restaurant",
      "eat",
      "dine",
    ],
    "law-firm": [
      "attorney",
      "lawyer",
      "legal services",
      "law firm",
      "legal representation",
      "legal help",
    ],
    saas: [
      "software",
      "platform",
      "solution",
      "app",
      "productivity",
      "automation",
      "tool",
    ],
    ecommerce: [
      "shop",
      "store",
      "buy",
      "products",
      "online shopping",
      "deals",
    ],
    healthcare: [
      "healthcare",
      "medical",
      "doctor",
      "health",
      "clinic",
      "treatment",
      "care",
    ],
    "real-estate": [
      "real estate",
      "homes",
      "property",
      "realtor",
      "houses",
      "buy home",
      "sell home",
    ],
    portfolio: [
      "creative",
      "design",
      "portfolio",
      "services",
      "freelance",
    ],
    construction: [
      "contractor",
      "construction",
      "builder",
      "renovation",
      "remodeling",
      "home improvement",
    ],
    gym: [
      "gym",
      "fitness",
      "workout",
      "exercise",
      "training",
      "fitness center",
    ],
    fitness: [
      "fitness",
      "personal training",
      "workout",
      "health",
      "wellness",
    ],
    spa: [
      "spa",
      "massage",
      "relaxation",
      "wellness",
      "beauty",
      "treatments",
    ],
    salon: [
      "salon",
      "hair",
      "beauty",
      "styling",
      "haircut",
      "color",
    ],
    dental: [
      "dentist",
      "dental",
      "teeth",
      "oral health",
      "dental care",
    ],
    consulting: [
      "consulting",
      "consultant",
      "business advice",
      "strategy",
      "expertise",
    ],
    agency: [
      "agency",
      "marketing",
      "creative",
      "design",
      "branding",
    ],
  };

  // Add industry keywords
  const industryKws = industryKeywords[industry.toLowerCase()];
  if (industryKws) {
    keywords.push(...industryKws);
  }

  // Add business name as keyword
  const businessName =
    context.branding?.business_name ||
    context.client?.company ||
    context.site?.name;
  if (businessName) {
    keywords.push(businessName.toLowerCase());
  }

  // Add location keywords if available
  if (context.locations && context.locations.length > 0) {
    const loc = context.locations[0];
    if (loc.city) {
      keywords.push(`${industry} ${loc.city}`.toLowerCase());
      keywords.push(`${loc.city} ${industry}`.toLowerCase());
    }
    if (loc.state) {
      keywords.push(`${industry} ${loc.state}`.toLowerCase());
    }
  }

  // Add service keywords
  if (context.services) {
    const serviceKeywords = context.services
      .slice(0, 5)
      .map((s) => s.name.toLowerCase());
    keywords.push(...serviceKeywords);
  }

  // Remove duplicates and limit
  return [...new Set(keywords)].slice(0, 15);
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  buildBusinessIdentity,
  inferTargetAudience,
  inferUVP,
  getStyleFromTone,
  inferSEOKeywords,
};
