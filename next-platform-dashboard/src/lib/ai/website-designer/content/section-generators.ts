/**
 * PHASE AWD-06: Content Generation Engine
 * Section Content Generators
 *
 * AI-powered generators for each website section type.
 * Uses Claude AI to generate conversion-optimized, tailored content.
 */

import { generateObject } from "ai";
import { getAIModel } from "../config/ai-provider";
import { z } from "zod";
import {
  CONTENT_GENERATOR_SYSTEM_PROMPT,
  buildHeroPrompt,
  buildFeaturesPrompt,
  buildCTAPrompt,
  buildAboutPrompt,
  buildFAQPrompt,
  buildPricingPrompt,
  buildContactPrompt,
  buildTeamPrompt,
  buildServicesPrompt,
  CTA_PURPOSE_CONTEXTS,
} from "./prompts";
import type { BusinessDataContext } from "../data-context/types";
import type {
  ContentGenerationContext,
  HeroContent,
  FeaturesContent,
  CTAContent,
  AboutContent,
  FAQContent,
  PricingContent,
  ContactContent,
  TeamContent,
  ServicesContent,
  TestimonialsContent,
  GalleryContent,
  BlogContent,
  StatsContent,
  CTAPurpose,
} from "./types";

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const HeroContentSchema = z.object({
  headline: z.string().describe("Compelling headline, 5-10 words"),
  subheadline: z.string().describe("Supporting subheadline, 15-25 words"),
  ctaPrimary: z.string().describe("Primary CTA text, 2-4 words"),
  ctaSecondary: z.string().describe("Secondary CTA text, 2-4 words, or empty string if none"),
  badge: z.string().describe("Small badge/tagline text, 2-5 words, or empty string if none"),
  socialProof: z
    .string()
    .describe("Social proof statement like '10,000+ customers', or empty string if none"),
});

const FeaturesContentSchema = z.object({
  sectionTitle: z.string().describe("Section title, 2-5 words"),
  sectionSubtitle: z.string().describe("Section subtitle, 10-20 words"),
  features: z
    .array(
      z.object({
        title: z.string().describe("Feature title, 2-4 words"),
        description: z.string().describe("Feature description, 15-30 words"),
        icon: z.string().describe("Suggested icon name (Lucide icon)"),
      })
    )
    .describe("Array of features"),
});

const CTAContentSchema = z.object({
  headline: z.string().describe("Compelling CTA headline, 5-10 words"),
  subheadline: z.string().describe("Supporting text, 15-25 words"),
  ctaText: z.string().describe("Button text, 2-4 words"),
  urgencyText: z
    .string()
    .describe("Urgency element if appropriate, 5-10 words, or empty string if none"),
  trustIndicators: z
    .array(z.string())
    .describe("Trust indicators like 'No credit card required', empty array if none"),
});

const AboutContentSchema = z.object({
  headline: z.string().describe("About section headline"),
  story: z.string().describe("Company story, 50-100 words"),
  mission: z.string().describe("Mission statement, 15-25 words, or empty string if none"),
  vision: z.string().describe("Vision statement, 15-25 words, or empty string if none"),
  values: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .describe("Core values, empty array if none"),
  stats: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .describe("Key statistics, empty array if none"),
});

const FAQContentSchema = z.object({
  sectionTitle: z.string().describe("FAQ section title"),
  sectionSubtitle: z.string().describe("FAQ section subtitle"),
  items: z
    .array(
      z.object({
        question: z.string().describe("Question"),
        answer: z.string().describe("Comprehensive answer, 30-60 words"),
      })
    )
    .describe("FAQ items"),
});

const PricingContentSchema = z.object({
  sectionTitle: z.string().describe("Pricing section title"),
  sectionSubtitle: z.string().describe("Pricing section subtitle"),
  plans: z
    .array(
      z.object({
        name: z.string().describe("Plan name"),
        description: z.string().describe("Plan description"),
        price: z.string().describe("Price (e.g., '$99')"),
        period: z.string().describe("Billing period (e.g., '/month')"),
        features: z.array(z.string()).describe("Included features"),
        ctaText: z.string().describe("CTA button text"),
        isPopular: z.boolean().describe("Is this the popular/recommended plan"),
      })
    )
    .describe("Pricing plans"),
});

const ContactContentSchema = z.object({
  headline: z.string().describe("Contact section headline"),
  subheadline: z.string().describe("Contact section subheadline"),
  formTitle: z.string().describe("Form title if applicable, or empty string if none"),
  submitButtonText: z.string().describe("Form submit button text"),
  contactMethods: z
    .array(
      z.object({
        method: z.string(),
        value: z.string(),
        icon: z.string(),
      })
    )
    .describe("Contact methods, empty array if none"),
});

const TeamContentSchema = z.object({
  sectionTitle: z.string().describe("Team section title"),
  sectionSubtitle: z.string().describe("Team section subtitle, 15-25 words"),
  memberBioTemplate: z
    .string()
    .describe("Template for member bios if not provided, or empty string if none"),
});

const ServicesContentSchema = z.object({
  sectionTitle: z.string().describe("Services section title"),
  sectionSubtitle: z.string().describe("Services section subtitle"),
  services: z
    .array(
      z.object({
        title: z.string().describe("Service title"),
        description: z.string().describe("Service description, 25-50 words"),
        features: z.array(z.string()).describe("Key features/benefits, empty array if none"),
        ctaText: z.string().describe("CTA text for this service, or empty string if none"),
      })
    )
    .describe("Services list"),
});

const TestimonialsContentSchema = z.object({
  sectionTitle: z.string().describe("Testimonials section title"),
  sectionSubtitle: z.string().describe("Testimonials section subtitle, 10-20 words"),
  ctaText: z.string().describe("CTA text if applicable, or empty string if none"),
});

const GalleryContentSchema = z.object({
  sectionTitle: z.string().describe("Gallery section title"),
  sectionSubtitle: z.string().describe("Gallery section subtitle, 10-20 words"),
  ctaText: z.string().describe("CTA text like 'View All', or empty string if none"),
});

const BlogContentSchema = z.object({
  sectionTitle: z.string().describe("Blog section title"),
  sectionSubtitle: z.string().describe("Blog section subtitle, 10-20 words"),
  ctaText: z.string().describe("CTA text like 'Read More', or empty string if none"),
});

const StatsContentSchema = z.object({
  sectionTitle: z.string().describe("Stats section title, or empty string if none"),
  stats: z
    .array(
      z.object({
        value: z.string().describe("Stat value (e.g., '500+', '99%')"),
        label: z.string().describe("Stat label (e.g., 'Happy Customers')"),
        description: z.string().describe("Description of the stat, or empty string if none"),
      })
    )
    .describe("Statistics to display"),
});

// =============================================================================
// HERO CONTENT GENERATOR
// =============================================================================

/**
 * Generate hero section content
 */
export async function generateHeroContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<HeroContent> {
  const prompt = buildHeroPrompt(
    context.business.name,
    context.business.industry,
    context.business.uniqueValueProposition || "",
    context.business.targetAudience || "",
    context.tone,
    context.style as unknown as Record<string, string>,
    businessContext.services?.map((s) => s.name),
    businessContext.testimonials?.length,
    businessContext.team?.length
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: HeroContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as HeroContent;
}

// =============================================================================
// FEATURES CONTENT GENERATOR
// =============================================================================

/**
 * Generate features/services section content
 */
export async function generateFeaturesContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  featureCount: number = 6
): Promise<FeaturesContent> {
  // Use actual services if available
  const existingServices = businessContext.services || [];

  const prompt = buildFeaturesPrompt(
    context.business.name,
    context.business.industry,
    context.business.targetAudience || "",
    context.tone,
    existingServices.map((s) => ({
      name: s.name,
      description: s.description,
    })),
    featureCount
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: FeaturesContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as FeaturesContent;
}

// =============================================================================
// CTA CONTENT GENERATOR
// =============================================================================

/**
 * Generate CTA section content
 */
export async function generateCTAContent(
  context: ContentGenerationContext,
  ctaPurpose: CTAPurpose = "primary"
): Promise<CTAContent> {
  const purposeDescription =
    CTA_PURPOSE_CONTEXTS[ctaPurpose] || CTA_PURPOSE_CONTEXTS.primary;

  const prompt = buildCTAPrompt(
    context.business.name,
    context.business.industry,
    context.tone,
    ctaPurpose,
    purposeDescription
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: CTAContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as CTAContent;
}

// =============================================================================
// ABOUT CONTENT GENERATOR
// =============================================================================

/**
 * Generate about section content
 */
export async function generateAboutContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<AboutContent> {
  const prompt = buildAboutPrompt(
    context.business.name,
    context.business.industry,
    context.business.description,
    context.tone,
    businessContext.team?.length || 0,
    businessContext.services?.length || 0,
    businessContext.locations?.length || 1
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: AboutContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as AboutContent;
}

// =============================================================================
// FAQ CONTENT GENERATOR
// =============================================================================

/**
 * Generate FAQ section content
 */
export async function generateFAQContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  questionCount: number = 6
): Promise<FAQContent> {
  // Use existing FAQ if available
  const existingFAQ = businessContext.faq || [];

  const prompt = buildFAQPrompt(
    context.business.name,
    context.business.industry,
    businessContext.services?.map((s) => s.name) || [],
    context.tone,
    existingFAQ.map((f) => ({
      question: f.question,
      answer: f.answer,
    })),
    questionCount
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: FAQContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as FAQContent;
}

// =============================================================================
// PRICING CONTENT GENERATOR
// =============================================================================

/**
 * Generate pricing section content
 */
export async function generatePricingContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  planCount: number = 3
): Promise<PricingContent> {
  // Map services to pricing if available
  const existingPricing =
    businessContext.services
      ?.filter((s) => s.price)
      .map((s) => ({
        name: s.name,
        price: s.price,
        features: s.features,
      })) || [];

  const prompt = buildPricingPrompt(
    context.business.name,
    context.business.industry,
    context.tone,
    existingPricing,
    planCount
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: PricingContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as PricingContent;
}

// =============================================================================
// CONTACT CONTENT GENERATOR
// =============================================================================

/**
 * Generate contact section content
 */
export async function generateContactContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<ContactContent> {
  const prompt = buildContactPrompt(
    context.business.name,
    context.business.industry,
    context.tone,
    !!businessContext.contact?.email,
    !!businessContext.contact?.phone,
    !!(
      businessContext.contact?.address?.street ||
      businessContext.contact?.address?.city
    )
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: ContactContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as ContactContent;
}

// =============================================================================
// TEAM CONTENT GENERATOR
// =============================================================================

/**
 * Generate team section content
 */
export async function generateTeamContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<TeamContent> {
  const prompt = buildTeamPrompt(
    context.business.name,
    context.business.industry,
    context.tone,
    businessContext.team?.length || 0
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: TeamContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as TeamContent;
}

// =============================================================================
// SERVICES CONTENT GENERATOR
// =============================================================================

/**
 * Generate services section content
 */
export async function generateServicesContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  serviceCount: number = 6
): Promise<ServicesContent> {
  const existingServices = businessContext.services || [];

  const prompt = buildServicesPrompt(
    context.business.name,
    context.business.industry,
    context.tone,
    existingServices.map((s) => ({
      name: s.name,
      description: s.description,
      features: s.features,
    })),
    serviceCount
  );

  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: ServicesContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt,
  });

  return object as ServicesContent;
}

// =============================================================================
// TESTIMONIALS CONTENT GENERATOR
// =============================================================================

/**
 * Generate testimonials section content
 */
export async function generateTestimonialsContent(
  context: ContentGenerationContext
): Promise<TestimonialsContent> {
  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: TestimonialsContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate testimonials section content for ${context.business.name}, a ${context.business.industry} business.

Tone: ${context.tone}

Create:
1. An engaging section title that builds trust
2. A subtitle that encourages visitors to read testimonials
3. Optional CTA text

The content should highlight social proof and build credibility.`,
  });

  return object as TestimonialsContent;
}

// =============================================================================
// GALLERY CONTENT GENERATOR
// =============================================================================

/**
 * Generate gallery/portfolio section content
 */
export async function generateGalleryContent(
  context: ContentGenerationContext
): Promise<GalleryContent> {
  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: GalleryContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate gallery/portfolio section content for ${context.business.name}, a ${context.business.industry} business.

Tone: ${context.tone}

Create:
1. An engaging section title that showcases work
2. A subtitle that entices visitors to explore
3. Optional CTA text like "View All" or "See More"

The content should highlight quality and professionalism.`,
  });

  return object as GalleryContent;
}

// =============================================================================
// BLOG CONTENT GENERATOR
// =============================================================================

/**
 * Generate blog/news section content
 */
export async function generateBlogContent(
  context: ContentGenerationContext
): Promise<BlogContent> {
  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: BlogContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate blog/news section content for ${context.business.name}, a ${context.business.industry} business.

Tone: ${context.tone}

Create:
1. An engaging section title for the blog area
2. A subtitle that positions the business as a thought leader
3. Optional CTA text like "Read More" or "See All Articles"

The content should establish expertise and encourage engagement.`,
  });

  return object as BlogContent;
}

// =============================================================================
// STATS CONTENT GENERATOR
// =============================================================================

/**
 * Generate stats/numbers section content
 */
export async function generateStatsContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<StatsContent> {
  const { object } = await generateObject({
    model: getAIModel("content-generation"),
    schema: StatsContentSchema,
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate impressive statistics section content for ${context.business.name}, a ${context.business.industry} business.

Available data:
- Services: ${businessContext.services?.length || 0}
- Team members: ${businessContext.team?.length || 0}
- Testimonials: ${businessContext.testimonials?.length || 0}
- Locations: ${businessContext.locations?.length || 1}

Tone: ${context.tone}

Create 3-4 compelling statistics that:
1. Build credibility and trust
2. Show impact and experience
3. Use impressive but believable numbers
4. Are relevant to the ${context.business.industry} industry

Examples: years in business, customers served, projects completed, success rate, etc.`,
  });

  return object as StatsContent;
}

// =============================================================================
// BATCH CONTENT GENERATOR
// =============================================================================

/**
 * Generate all content for a website in one batch
 */
export async function generateAllContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  sections: string[] = [
    "hero",
    "features",
    "cta",
    "about",
    "testimonials",
    "contact",
  ]
): Promise<Record<string, unknown>> {
  const content: Record<string, unknown> = {};

  // Generate content for each requested section
  const generators: Record<string, () => Promise<unknown>> = {
    hero: () => generateHeroContent(context, businessContext),
    features: () => generateFeaturesContent(context, businessContext),
    cta: () => generateCTAContent(context, "primary"),
    about: () => generateAboutContent(context, businessContext),
    faq: () => generateFAQContent(context, businessContext),
    pricing: () => generatePricingContent(context, businessContext),
    contact: () => generateContactContent(context, businessContext),
    team: () => generateTeamContent(context, businessContext),
    services: () => generateServicesContent(context, businessContext),
    testimonials: () => generateTestimonialsContent(context),
    gallery: () => generateGalleryContent(context),
    blog: () => generateBlogContent(context),
    stats: () => generateStatsContent(context, businessContext),
  };

  // Generate in parallel for efficiency
  const results = await Promise.all(
    sections.map(async (section) => {
      const generator = generators[section];
      if (generator) {
        try {
          const result = await generator();
          return { section, result };
        } catch (error) {
          console.error(`Failed to generate ${section} content:`, error);
          return { section, result: null };
        }
      }
      return { section, result: null };
    })
  );

  // Compile results
  for (const { section, result } of results) {
    if (result) {
      content[section] = result;
    }
  }

  return content;
}
