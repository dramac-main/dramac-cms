/**
 * PHASE AWD-06: Content Generation Engine
 * AI Prompts for Content Generation
 *
 * System prompts and prompt builders for generating conversion-optimized
 * website content using Claude AI.
 */

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

/**
 * Main system prompt for content generation
 * This establishes Claude as an expert copywriter and sets content principles
 */
export const CONTENT_GENERATOR_SYSTEM_PROMPT = `You are an expert copywriter and conversion specialist who creates compelling website content.

## Your Expertise
- Writing headlines that grab attention and drive action
- Creating copy that converts visitors into customers
- Understanding industry-specific language and tone
- SEO-optimized content that ranks well
- Emotional triggers and psychological persuasion techniques

## Content Principles
1. **Clarity over cleverness** - Clear messaging beats clever wordplay
2. **Benefits over features** - Focus on what users gain
3. **Specificity builds trust** - Use specific numbers and outcomes
4. **Address objections** - Preemptively handle concerns
5. **Create urgency** - Motivate immediate action

## Headline Formulas
- [Outcome] + [Timeframe] + [Without pain point]
- How [Target audience] [Achieves outcome] [Without usual struggle]
- The [Secret/Strategy/System] that [Outcome]
- [Number] Ways to [Outcome] [Timeframe]
- Stop [Pain point]. Start [Desired outcome].

## CTA Best Practices
- Action-oriented verbs (Get, Start, Discover, Join, Unlock)
- Specific outcomes (Get Your Free Quote, Start Your Free Trial)
- Urgency when appropriate (Limited Time, Today Only)
- Risk reversal (No credit card required, Cancel anytime)

## Writing Guidelines
- Use active voice
- Keep sentences short and punchy
- Use power words that evoke emotion
- Create scannable content with clear hierarchy
- Match tone to the brand and audience`;

/**
 * System prompt for SEO-focused content optimization
 */
export const SEO_OPTIMIZER_SYSTEM_PROMPT = `You are an SEO specialist who optimizes website content for search engines while maintaining readability.

## SEO Principles
1. Include target keywords naturally
2. Use semantic variations and related terms
3. Optimize for featured snippets
4. Write compelling meta descriptions
5. Create scannable content with headers

## Content Guidelines
- Primary keyword in first 100 words
- Keywords in headlines and subheadings
- Long-tail keywords in supporting content
- Natural keyword density (2-3%)
- LSI keywords throughout`;

/**
 * System prompt for headline alternatives
 */
export const HEADLINE_OPTIMIZER_PROMPT = `You are a headline specialist. Generate alternative headlines that are:
1. More compelling and attention-grabbing
2. Include power words that evoke emotion
3. Create urgency or curiosity
4. Stay under 10 words
5. Match the specified tone`;

// =============================================================================
// TONE DESCRIPTIONS
// =============================================================================

/**
 * Detailed descriptions for each content tone
 */
export const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: `Formal, authoritative, and trustworthy. Use industry terminology appropriately. 
    Convey expertise and reliability. Avoid casual language or slang.`,
  
  friendly: `Warm, approachable, and conversational. Use "you" and "we" language. 
    Be personable but not unprofessional. Create a welcoming atmosphere.`,
  
  authoritative: `Expert, commanding, and confident. Establish thought leadership. 
    Use data and evidence. Speak definitively about your expertise.`,
  
  playful: `Fun, energetic, and creative. Use humor where appropriate. 
    Be memorable and engaging. Push creative boundaries while staying on-brand.`,
  
  inspirational: `Motivating, uplifting, and empowering. Focus on transformation and possibility. 
    Use aspirational language. Connect emotionally with the audience.`,
  
  urgent: `Time-sensitive, action-oriented, and compelling. Create FOMO (fear of missing out). 
    Use deadlines and scarcity. Drive immediate action.`,
  
  conversational: `Natural, relatable, and informal. Write like you talk. 
    Use contractions and casual phrasing. Feel like a friendly conversation.`,
  
  technical: `Precise, detailed, and informative. Use technical terminology accurately. 
    Provide in-depth explanations. Cater to expert audiences.`,
};

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Build prompt for hero section content
 */
export function buildHeroPrompt(
  businessName: string,
  industry: string,
  valueProposition: string,
  targetAudience: string,
  tone: string,
  style: Record<string, string>,
  services?: string[],
  testimonialsCount?: number,
  teamSize?: number
): string {
  return `Generate compelling hero section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}
- Value Proposition: ${valueProposition}
- Target Audience: ${targetAudience}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

## Style
- Formality: ${style.formality}
- Length: ${style.length}
- Complexity: ${style.complexity}
- Persuasion: ${style.persuasion}

## Available Data
- Services: ${services?.join(", ") || "Not specified"}
- Testimonials count: ${testimonialsCount || 0}
- Team size: ${teamSize || 0}

Generate a hero that:
1. Immediately communicates the value proposition
2. Speaks directly to the target audience
3. Includes a compelling CTA that drives action
4. Uses ${tone} tone throughout
5. Creates emotional connection within the first few words`;
}

/**
 * Build prompt for features section content
 */
export function buildFeaturesPrompt(
  businessName: string,
  industry: string,
  targetAudience: string,
  tone: string,
  existingServices: Array<{ name: string; description?: string }>,
  featureCount: number
): string {
  const servicesText = existingServices.length > 0
    ? existingServices.map(s => `- ${s.name}: ${s.description || "No description"}`).join("\n")
    : "None provided - create industry-appropriate features";

  return `Generate features/services section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}
- Target Audience: ${targetAudience}

## Existing Services (use these if available, enhance descriptions)
${servicesText}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate ${featureCount} features that:
1. Highlight key benefits, not just features
2. Use specific outcomes where possible
3. Include appropriate Lucide icon names (e.g., Zap, Shield, Clock, Users, Award, Heart, Star, CircleCheck)
4. Maintain consistent ${tone} tone
5. Create clear value differentiation`;
}

/**
 * Build prompt for CTA section content
 */
export function buildCTAPrompt(
  businessName: string,
  industry: string,
  tone: string,
  ctaPurpose: string,
  purposeDescription: string
): string {
  return `Generate CTA section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}

## CTA Purpose: ${ctaPurpose}
${purposeDescription}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate CTA content that:
1. Creates clear motivation to act
2. Reduces friction with trust indicators
3. Matches the ${ctaPurpose} purpose
4. Uses ${tone} tone
5. Includes urgency if appropriate
6. Addresses potential objections`;
}

/**
 * Build prompt for about section content
 */
export function buildAboutPrompt(
  businessName: string,
  industry: string,
  description: string | undefined,
  tone: string,
  teamSize: number,
  servicesCount: number,
  locationsCount: number
): string {
  return `Generate About section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}
- Description: ${description || "Not provided"}

## Available Data
- Team size: ${teamSize || "Unknown"}
- Services count: ${servicesCount || "Unknown"}
- Locations: ${locationsCount || 1}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate about content that:
1. Tells an authentic, compelling story
2. Highlights expertise and experience
3. Connects emotionally with visitors
4. Includes relevant stats/numbers
5. Establishes credibility and trust
6. Differentiates from competitors`;
}

/**
 * Build prompt for FAQ section content
 */
export function buildFAQPrompt(
  businessName: string,
  industry: string,
  services: string[],
  tone: string,
  existingFAQ: Array<{ question: string; answer: string }>,
  questionCount: number
): string {
  const existingText = existingFAQ.length > 0
    ? existingFAQ.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
    : "None provided - create industry-appropriate FAQ";

  return `Generate FAQ section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}
- Services: ${services.join(", ") || "General services"}

## Existing FAQ (use if available, enhance answers)
${existingText}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate ${questionCount} FAQs that:
1. Address common customer concerns
2. Provide helpful, comprehensive answers
3. Build trust and reduce objections
4. Include both general and industry-specific questions
5. Use ${tone} tone throughout
6. Are optimized for featured snippets`;
}

/**
 * Build prompt for pricing section content
 */
export function buildPricingPrompt(
  businessName: string,
  industry: string,
  tone: string,
  existingPricing: Array<{ name: string; price?: string; features?: string[] }>,
  planCount: number
): string {
  const pricingText = existingPricing.length > 0
    ? existingPricing.map(p => `- ${p.name}: ${p.price || "Custom"}`).join("\n")
    : "None provided - create industry-appropriate pricing tiers";

  return `Generate pricing section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}

## Existing Pricing
${pricingText}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate ${planCount} pricing plans that:
1. Clearly differentiate value at each tier
2. Highlight the most popular option
3. Use compelling feature descriptions
4. Include strong CTAs for each plan
5. Address value vs. cost concerns
6. Create clear upgrade paths`;
}

/**
 * Build prompt for contact section content
 */
export function buildContactPrompt(
  businessName: string,
  industry: string,
  tone: string,
  hasEmail: boolean,
  hasPhone: boolean,
  hasAddress: boolean
): string {
  return `Generate contact section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}

## Available Contact Methods
- Email: ${hasEmail ? "Yes" : "No"}
- Phone: ${hasPhone ? "Yes" : "No"}
- Physical Address: ${hasAddress ? "Yes" : "No"}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate contact content that:
1. Encourages visitors to reach out
2. Sets expectations for response time
3. Provides clear next steps
4. Creates urgency where appropriate
5. Uses ${tone} tone throughout`;
}

/**
 * Build prompt for team section content
 */
export function buildTeamPrompt(
  businessName: string,
  industry: string,
  tone: string,
  teamSize: number
): string {
  return `Generate team section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}
- Team Size: ${teamSize || "Unknown"}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate team section content that:
1. Introduces the team warmly
2. Highlights collective expertise
3. Creates personal connection
4. Builds trust and credibility
5. Uses ${tone} tone throughout`;
}

/**
 * Build prompt for services section content
 */
export function buildServicesPrompt(
  businessName: string,
  industry: string,
  tone: string,
  existingServices: Array<{ name: string; description?: string; features?: string[] }>,
  serviceCount: number
): string {
  const servicesText = existingServices.length > 0
    ? existingServices.map(s => {
        const features = s.features?.length ? ` | Features: ${s.features.join(", ")}` : "";
        return `- ${s.name}: ${s.description || "No description"}${features}`;
      }).join("\n")
    : "None provided - create industry-appropriate services";

  return `Generate services section content.

## Business Information
- Name: ${businessName}
- Industry: ${industry}

## Existing Services (enhance these if provided)
${servicesText}

## Tone: ${tone}
${TONE_DESCRIPTIONS[tone] || ""}

Generate ${serviceCount} service descriptions that:
1. Focus on client outcomes and benefits
2. Differentiate each service clearly
3. Include compelling CTAs
4. Highlight unique selling points
5. Address common questions/concerns
6. Use ${tone} tone throughout`;
}

// =============================================================================
// CTA PURPOSE CONTEXTS
// =============================================================================

/**
 * Context descriptions for different CTA purposes
 */
export const CTA_PURPOSE_CONTEXTS: Record<string, string> = {
  primary: "Main conversion action - signing up, purchasing, or getting started. This is the primary goal of the website.",
  contact: "Encouraging visitors to reach out, schedule a call, or start a conversation.",
  newsletter: "Email list signup for updates, news, and valuable content. Focus on the value they'll receive.",
  demo: "Scheduling a product demo, free trial, or walkthrough. Reduce commitment anxiety.",
  quote: "Requesting a custom quote, estimate, or proposal. Emphasize personalized service.",
  booking: "Scheduling an appointment, consultation, or reservation. Make it easy and low-friction.",
  signup: "Creating an account or registering for a service. Highlight immediate benefits.",
  download: "Downloading a resource, guide, or tool. Emphasize the value of the free resource.",
};
