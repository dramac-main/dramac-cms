/**
 * PHASE AWD-02: Data Context System
 * Data Availability Checker
 * 
 * Analyzes what data is available and what's missing,
 * providing intelligent prompts to gather missing information.
 */

import type {
  BusinessDataContext,
  DataAvailability,
  DataAvailabilityCategory,
  DataAvailabilityScore,
  MissingDataPrompt,
  MissingDataPromptPriority,
} from "./types";

// =============================================================================
// DATA AVAILABILITY SCORING
// =============================================================================

/**
 * Check data availability and compute completeness scores
 */
export function checkDataAvailability(context: BusinessDataContext): DataAvailability {
  const categories: DataAvailabilityCategory[] = [
    checkBusinessIdentity(context),
    checkBranding(context),
    checkContact(context),
    checkSocial(context),
    checkHours(context),
    checkLocations(context),
    checkTeam(context),
    checkServices(context),
    checkTestimonials(context),
    checkPortfolio(context),
    checkFAQ(context),
    checkBlog(context),
  ];

  // Calculate overall score
  const totalItems = categories.reduce((sum, cat) => sum + cat.total, 0);
  const filledItems = categories.reduce((sum, cat) => sum + cat.filled, 0);
  const overallPercentage = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  // Determine overall score level
  let overallScore: DataAvailabilityScore;
  if (overallPercentage >= 80) {
    overallScore = "excellent";
  } else if (overallPercentage >= 60) {
    overallScore = "good";
  } else if (overallPercentage >= 40) {
    overallScore = "fair";
  } else if (overallPercentage >= 20) {
    overallScore = "limited";
  } else {
    overallScore = "minimal";
  }

  return {
    overallScore,
    overallPercentage,
    categories: categories.filter((c) => c.total > 0), // Only include relevant categories
    recommendations: generateRecommendations(categories, overallPercentage),
  };
}

// =============================================================================
// CATEGORY CHECKERS
// =============================================================================

/**
 * Check business identity completeness
 */
function checkBusinessIdentity(context: BusinessDataContext): DataAvailabilityCategory {
  const fields = [
    { name: "Business Name", filled: !!context.site.name },
    { name: "Description", filled: !!(context.site.description || context.client.description) },
    { name: "Tagline", filled: !!context.client.tagline },
    { name: "Industry", filled: !!context.client.industry },
    { name: "Mission", filled: !!context.client.mission },
    { name: "Vision", filled: !!context.client.vision },
    { name: "Values", filled: !!(context.client.values && context.client.values.length > 0) },
    { name: "Founded Year", filled: !!context.client.founded_year },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Business Identity",
    key: "identity",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check branding completeness
 */
function checkBranding(context: BusinessDataContext): DataAvailabilityCategory {
  const b = context.branding || {};
  
  const fields = [
    { name: "Primary Color", filled: !!b.primary_color },
    { name: "Secondary Color", filled: !!b.secondary_color },
    { name: "Accent Color", filled: !!b.accent_color },
    { name: "Logo", filled: !!b.logo_url },
    { name: "Heading Font", filled: !!b.heading_font },
    { name: "Body Font", filled: !!b.body_font },
    { name: "Brand Voice", filled: !!b.brand_voice },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Branding",
    key: "branding",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check contact information completeness
 */
function checkContact(context: BusinessDataContext): DataAvailabilityCategory {
  const c = context.contact || {};
  const addr = c.address || {};

  const fields = [
    { name: "Email", filled: !!c.email },
    { name: "Phone", filled: !!c.phone },
    { name: "Street Address", filled: !!addr.street },
    { name: "City", filled: !!addr.city },
    { name: "State/Province", filled: !!addr.state },
    { name: "ZIP/Postal Code", filled: !!addr.zip },
    { name: "Country", filled: !!addr.country },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Contact Information",
    key: "contact",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check social media completeness
 */
function checkSocial(context: BusinessDataContext): DataAvailabilityCategory {
  const platforms = ["facebook", "twitter", "instagram", "linkedin", "youtube"];
  const existingPlatforms = (context.social || []).map((s) => s.platform?.toLowerCase());

  const fields = platforms.map((p) => ({
    name: capitalize(p),
    filled: existingPlatforms.includes(p),
  }));

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Social Media",
    key: "social",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check business hours completeness
 */
function checkHours(context: BusinessDataContext): DataAvailabilityCategory {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const existingDays = (context.hours || []).map((h) => h.day?.toLowerCase());

  const filled = days.filter((d) => existingDays.includes(d)).length;
  const percentage = Math.round((filled / days.length) * 100);

  return {
    name: "Business Hours",
    key: "hours",
    total: days.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: days.filter((d) => !existingDays.includes(d)).map(capitalize),
  };
}

/**
 * Check locations completeness
 */
function checkLocations(context: BusinessDataContext): DataAvailabilityCategory {
  const locations = context.locations || [];
  const hasLocations = locations.length > 0;
  
  // Check if at least one location has complete info
  const completeLocation = locations.find(
    (l) => l.address && l.city && (l.phone || l.email)
  );

  const fields = [
    { name: "At least one location", filled: hasLocations },
    { name: "Complete address", filled: !!completeLocation },
    { name: "Primary location marked", filled: locations.some((l) => l.is_primary) },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Locations",
    key: "locations",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check team member completeness
 */
function checkTeam(context: BusinessDataContext): DataAvailabilityCategory {
  const team = context.team || [];
  const hasTeam = team.length > 0;
  
  // Check for complete team member profiles
  const completeMembers = team.filter((m) => m.name && m.role && m.bio);

  const fields = [
    { name: "Team members added", filled: hasTeam },
    { name: "At least 3 members", filled: team.length >= 3 },
    { name: "Complete profiles (name, role, bio)", filled: completeMembers.length > 0 },
    { name: "Photos available", filled: team.some((m) => m.image_url) },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Team",
    key: "team",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check services completeness
 */
function checkServices(context: BusinessDataContext): DataAvailabilityCategory {
  const services = context.services || [];
  const hasServices = services.length > 0;
  
  const completeServices = services.filter((s) => s.name && s.description);
  const pricedServices = services.filter((s) => s.price);

  const fields = [
    { name: "Services added", filled: hasServices },
    { name: "At least 3 services", filled: services.length >= 3 },
    { name: "Complete descriptions", filled: completeServices.length >= Math.min(3, services.length) },
    { name: "Pricing information", filled: pricedServices.length > 0 },
    { name: "Featured service marked", filled: services.some((s) => s.is_featured) },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Services",
    key: "services",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check testimonials completeness
 */
function checkTestimonials(context: BusinessDataContext): DataAvailabilityCategory {
  const testimonials = context.testimonials || [];
  const hasTestimonials = testimonials.length > 0;
  
  const completeTestimonials = testimonials.filter(
    (t) => t.content && t.author_name
  );
  const ratedTestimonials = testimonials.filter((t) => t.rating);

  const fields = [
    { name: "Testimonials added", filled: hasTestimonials },
    { name: "At least 3 testimonials", filled: testimonials.length >= 3 },
    { name: "Complete testimonials (content + author)", filled: completeTestimonials.length >= Math.min(3, testimonials.length) },
    { name: "Ratings included", filled: ratedTestimonials.length > 0 },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Testimonials",
    key: "testimonials",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check portfolio completeness
 */
function checkPortfolio(context: BusinessDataContext): DataAvailabilityCategory {
  const portfolio = context.portfolio || [];
  const hasPortfolio = portfolio.length > 0;
  
  const completeItems = portfolio.filter((p) => p.title && p.description && p.image_url);
  const featuredItems = portfolio.filter((p) => p.is_featured);

  const fields = [
    { name: "Portfolio items added", filled: hasPortfolio },
    { name: "At least 4 items", filled: portfolio.length >= 4 },
    { name: "Complete items (title, description, image)", filled: completeItems.length >= Math.min(4, portfolio.length) },
    { name: "Featured items marked", filled: featuredItems.length > 0 },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Portfolio",
    key: "portfolio",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check FAQ completeness
 */
function checkFAQ(context: BusinessDataContext): DataAvailabilityCategory {
  const faq = context.faq || [];
  const hasFAQ = faq.length > 0;
  
  const completeItems = faq.filter((f) => f.question && f.answer);

  const fields = [
    { name: "FAQ items added", filled: hasFAQ },
    { name: "At least 5 FAQs", filled: faq.length >= 5 },
    { name: "Complete Q&A pairs", filled: completeItems.length >= Math.min(5, faq.length) },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "FAQ",
    key: "faq",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

/**
 * Check blog completeness
 */
function checkBlog(context: BusinessDataContext): DataAvailabilityCategory {
  const blog = context.blog || [];
  const hasBlog = blog.length > 0;

  const fields = [
    { name: "Blog posts added", filled: hasBlog },
    { name: "At least 3 posts", filled: blog.length >= 3 },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filled / fields.length) * 100);

  return {
    name: "Blog",
    key: "blog",
    total: fields.length,
    filled,
    percentage,
    score: getScoreLevel(percentage),
    missingFields: fields.filter((f) => !f.filled).map((f) => f.name),
  };
}

// =============================================================================
// MISSING DATA PROMPTS
// =============================================================================

/**
 * Generate intelligent prompts for missing data
 */
export function getMissingDataPrompts(context: BusinessDataContext): MissingDataPrompt[] {
  const prompts: MissingDataPrompt[] = [];
  const availability = checkDataAvailability(context);

  // Generate prompts based on categories with low scores
  for (const category of availability.categories) {
    if (category.percentage < 50) {
      const categoryPrompts = generateCategoryPrompts(category, context);
      prompts.push(...categoryPrompts);
    }
  }

  // Sort by priority
  const priorityOrder: MissingDataPromptPriority[] = ["critical", "high", "medium", "low"];
  prompts.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

  return prompts;
}

/**
 * Generate prompts for a specific category
 */
function generateCategoryPrompts(
  category: DataAvailabilityCategory,
  context: BusinessDataContext
): MissingDataPrompt[] {
  const prompts: MissingDataPrompt[] = [];

  switch (category.key) {
    case "identity":
      if (!context.site.name) {
        prompts.push({
          field: "Business Name",
          category: "identity",
          priority: "critical",
          question: "What is your business name?",
          placeholder: "e.g., Acme Corporation",
          helpText: "This is the primary name that will appear throughout your website.",
        });
      }
      if (!context.client.tagline && !context.site.description) {
        prompts.push({
          field: "Tagline / Description",
          category: "identity",
          priority: "high",
          question: "What is your business tagline or brief description?",
          placeholder: "e.g., Making the world a better place, one widget at a time",
          helpText: "A short, memorable phrase that captures your brand essence.",
        });
      }
      if (!context.client.industry) {
        prompts.push({
          field: "Industry",
          category: "identity",
          priority: "medium",
          question: "What industry is your business in?",
          placeholder: "e.g., Healthcare, Technology, Retail",
          helpText: "This helps AI generate industry-appropriate content.",
        });
      }
      break;

    case "branding":
      if (!context.branding?.primary_color) {
        prompts.push({
          field: "Primary Brand Color",
          category: "branding",
          priority: "high",
          question: "What is your primary brand color?",
          placeholder: "e.g., #2563eb or Blue",
          helpText: "The main color used in your branding and marketing materials.",
        });
      }
      if (!context.branding?.logo_url) {
        prompts.push({
          field: "Logo",
          category: "branding",
          priority: "high",
          question: "Do you have a logo to upload?",
          helpText: "Your logo will be used in the header and other key areas.",
        });
      }
      break;

    case "contact":
      if (!context.contact?.email) {
        prompts.push({
          field: "Contact Email",
          category: "contact",
          priority: "critical",
          question: "What is your business contact email?",
          placeholder: "e.g., contact@yourbusiness.com",
          helpText: "Where customers can reach you.",
        });
      }
      if (!context.contact?.phone) {
        prompts.push({
          field: "Phone Number",
          category: "contact",
          priority: "high",
          question: "What is your business phone number?",
          placeholder: "e.g., (555) 123-4567",
          helpText: "Primary phone number for customer inquiries.",
        });
      }
      break;

    case "services":
      if (!context.services?.length) {
        prompts.push({
          field: "Services",
          category: "services",
          priority: "high",
          question: "What services or products does your business offer?",
          placeholder: "List your main services/products",
          helpText: "This information will be used to build your services page.",
        });
      }
      break;

    case "team":
      if (!context.team?.length) {
        prompts.push({
          field: "Team Members",
          category: "team",
          priority: "medium",
          question: "Would you like to add team members to your website?",
          helpText: "Showcasing your team builds trust with potential customers.",
        });
      }
      break;

    case "testimonials":
      if (!context.testimonials?.length) {
        prompts.push({
          field: "Testimonials",
          category: "testimonials",
          priority: "medium",
          question: "Do you have customer testimonials or reviews to share?",
          helpText: "Social proof helps convert visitors into customers.",
        });
      }
      break;

    case "social":
      if ((context.social?.length || 0) < 2) {
        prompts.push({
          field: "Social Media Links",
          category: "social",
          priority: "low",
          question: "What are your social media profiles?",
          placeholder: "Facebook, Instagram, LinkedIn, Twitter, etc.",
          helpText: "Connect your social presence to your website.",
        });
      }
      break;
  }

  return prompts;
}

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

/**
 * Generate recommendations based on data availability
 */
function generateRecommendations(
  categories: DataAvailabilityCategory[],
  overallPercentage: number
): string[] {
  const recommendations: string[] = [];

  // Critical recommendations
  const identity = categories.find((c) => c.key === "identity");
  if (identity && identity.percentage < 50) {
    recommendations.push("Complete your business identity information to help AI generate accurate content.");
  }

  const branding = categories.find((c) => c.key === "branding");
  if (branding && branding.percentage < 50) {
    recommendations.push("Add your brand colors and logo for consistent visual design.");
  }

  const contact = categories.find((c) => c.key === "contact");
  if (contact && contact.percentage < 50) {
    recommendations.push("Add contact information so customers can reach you.");
  }

  // Enhancement recommendations
  const services = categories.find((c) => c.key === "services");
  if (services && services.percentage < 30) {
    recommendations.push("Add your services to showcase what you offer.");
  }

  const testimonials = categories.find((c) => c.key === "testimonials");
  if (testimonials && testimonials.percentage < 30) {
    recommendations.push("Add customer testimonials to build trust and credibility.");
  }

  // Overall recommendation
  if (overallPercentage < 40) {
    recommendations.push("Your data profile is limited. The more information you provide, the better AI can generate personalized content.");
  } else if (overallPercentage >= 80) {
    recommendations.push("Great job! Your data profile is excellent. AI has comprehensive information to work with.");
  }

  return recommendations;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Convert percentage to score level
 */
function getScoreLevel(percentage: number): DataAvailabilityScore {
  if (percentage >= 80) return "excellent";
  if (percentage >= 60) return "good";
  if (percentage >= 40) return "fair";
  if (percentage >= 20) return "limited";
  return "minimal";
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================================================================
// QUICK CHECKS
// =============================================================================

/**
 * Quick check if essential data is available
 */
export function hasEssentialData(context: BusinessDataContext): boolean {
  return !!(
    context.site.name &&
    (context.contact?.email || context.contact?.phone) &&
    (context.branding?.primary_color || context.branding?.logo_url)
  );
}

/**
 * Quick check if content data is available
 */
export function hasContentData(context: BusinessDataContext): boolean {
  return !!(
    context.services?.length ||
    context.team?.length ||
    context.testimonials?.length ||
    context.portfolio?.length
  );
}

/**
 * Get data quality score (0-100)
 */
export function getDataQualityScore(context: BusinessDataContext): number {
  const availability = checkDataAvailability(context);
  return availability.overallPercentage;
}
