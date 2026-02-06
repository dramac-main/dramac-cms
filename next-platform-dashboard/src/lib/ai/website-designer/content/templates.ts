/**
 * PHASE AWD-06: Content Generation Engine
 * Industry Content Templates
 *
 * Pre-defined content templates for different industries.
 * These templates help AI generate more relevant, industry-specific content.
 */

import type { IndustryContentTemplate } from "./types";

// =============================================================================
// INDUSTRY CONTENT TEMPLATES
// =============================================================================

export const industryContentTemplates: Record<string, IndustryContentTemplate> = {
  // ============================================
  // RESTAURANT / FOOD SERVICE
  // ============================================
  restaurant: {
    heroHeadlines: [
      "Experience Culinary Excellence",
      "Where Every Meal Tells a Story",
      "Fresh Flavors, Unforgettable Moments",
      "Taste the Difference Quality Makes",
      "Dining Reimagined",
    ],
    ctaTexts: [
      "View Menu",
      "Make a Reservation",
      "Order Online",
      "Book a Table",
      "See Our Menu",
    ],
    featureIcons: [
      "UtensilsCrossed",
      "Clock",
      "Award",
      "Heart",
      "Star",
      "MapPin",
      "Leaf",
      "Wine",
    ],
    faqTopics: [
      "reservations",
      "dietary options",
      "private events",
      "parking",
      "dress code",
      "hours",
      "takeout",
      "catering",
    ],
    valueProps: [
      "Fresh ingredients",
      "Expert chefs",
      "Warm ambiance",
      "Exceptional service",
      "Local sourcing",
      "Award-winning cuisine",
    ],
    testimonialPrompts: [
      "the food quality",
      "the dining experience",
      "the service",
      "the atmosphere",
    ],
  },

  // ============================================
  // LAW FIRM / LEGAL SERVICES
  // ============================================
  "law-firm": {
    heroHeadlines: [
      "Justice Served, Rights Protected",
      "Your Legal Advocate",
      "Fighting for What You Deserve",
      "Trusted Legal Representation",
      "Protecting Your Rights Since [Year]",
    ],
    ctaTexts: [
      "Free Consultation",
      "Contact Us",
      "Get Legal Help",
      "Schedule a Call",
      "Request Consultation",
    ],
    featureIcons: [
      "Scale",
      "Shield",
      "Award",
      "Users",
      "FileText",
      "Clock",
      "Briefcase",
      "Gavel",
    ],
    faqTopics: [
      "consultation process",
      "fees and costs",
      "case timeline",
      "communication",
      "experience",
      "success rate",
      "payment plans",
    ],
    valueProps: [
      "Proven track record",
      "Personal attention",
      "Aggressive representation",
      "No fee unless we win",
      "Years of experience",
      "Free consultation",
    ],
    testimonialPrompts: [
      "the outcome of their case",
      "attorney communication",
      "professionalism",
      "dedication",
    ],
  },

  // ============================================
  // SAAS / SOFTWARE
  // ============================================
  saas: {
    heroHeadlines: [
      "Work Smarter, Not Harder",
      "The Platform That Scales With You",
      "Transform How You Work",
      "Productivity, Supercharged",
      "Your Success, Automated",
    ],
    ctaTexts: [
      "Start Free Trial",
      "Get Started",
      "See Demo",
      "Try Free",
      "Sign Up Free",
      "Book a Demo",
    ],
    featureIcons: [
      "Zap",
      "BarChart",
      "Shield",
      "Users",
      "Clock",
      "Cog",
      "Layers",
      "Sparkles",
    ],
    faqTopics: [
      "pricing",
      "integrations",
      "security",
      "support",
      "data migration",
      "free trial",
      "enterprise features",
    ],
    valueProps: [
      "Easy to use",
      "Powerful features",
      "Secure & reliable",
      "World-class support",
      "No credit card required",
      "14-day free trial",
    ],
    testimonialPrompts: [
      "productivity gains",
      "time saved",
      "ROI",
      "ease of use",
    ],
    pricingModels: ["freemium", "per-user", "tiered", "usage-based"],
  },

  // ============================================
  // E-COMMERCE / RETAIL
  // ============================================
  ecommerce: {
    heroHeadlines: [
      "Shop Quality, Save Big",
      "Discover Your New Favorites",
      "Premium Products, Amazing Prices",
      "Where Style Meets Savings",
      "Shop Smarter, Live Better",
    ],
    ctaTexts: [
      "Shop Now",
      "Browse Collection",
      "View Products",
      "Start Shopping",
      "Explore Deals",
    ],
    featureIcons: [
      "ShoppingBag",
      "Truck",
      "Shield",
      "CreditCard",
      "Gift",
      "RefreshCw",
      "Star",
      "Heart",
    ],
    faqTopics: [
      "shipping",
      "returns",
      "payment options",
      "order tracking",
      "sizing",
      "warranty",
      "international shipping",
    ],
    valueProps: [
      "Free shipping",
      "Easy returns",
      "Secure checkout",
      "Quality guarantee",
      "Fast delivery",
      "24/7 support",
    ],
    testimonialPrompts: [
      "product quality",
      "shipping speed",
      "customer service",
      "value for money",
    ],
  },

  // ============================================
  // HEALTHCARE / MEDICAL
  // ============================================
  healthcare: {
    heroHeadlines: [
      "Your Health, Our Priority",
      "Compassionate Care You Deserve",
      "Expert Care, Personal Touch",
      "Healing With Heart",
      "Where Health Comes First",
    ],
    ctaTexts: [
      "Book Appointment",
      "Schedule Visit",
      "Contact Us",
      "Request Appointment",
      "Get Care Now",
    ],
    featureIcons: [
      "Heart",
      "UserCheck",
      "Clock",
      "Award",
      "Shield",
      "Stethoscope",
      "Activity",
      "Smile",
    ],
    faqTopics: [
      "insurance",
      "appointments",
      "services",
      "emergencies",
      "patient portal",
      "new patients",
      "hours",
    ],
    valueProps: [
      "Board-certified doctors",
      "Comprehensive care",
      "Modern facilities",
      "Patient-centered",
      "Same-day appointments",
      "Insurance accepted",
    ],
    testimonialPrompts: [
      "quality of care",
      "staff friendliness",
      "wait times",
      "treatment outcomes",
    ],
  },

  // ============================================
  // REAL ESTATE
  // ============================================
  "real-estate": {
    heroHeadlines: [
      "Find Your Dream Home",
      "Your Journey Home Starts Here",
      "Expert Guidance, Every Step",
      "Home is Where Your Story Begins",
      "Unlock the Door to Your Future",
    ],
    ctaTexts: [
      "Search Homes",
      "Get Home Valuation",
      "Contact Agent",
      "View Listings",
      "Start Your Search",
    ],
    featureIcons: [
      "Home",
      "MapPin",
      "TrendingUp",
      "Users",
      "Key",
      "Award",
      "Search",
      "Building",
    ],
    faqTopics: [
      "buying process",
      "selling tips",
      "market conditions",
      "commission",
      "timeline",
      "financing",
      "inspection",
    ],
    valueProps: [
      "Local expertise",
      "Proven results",
      "Personal service",
      "Market knowledge",
      "Network of buyers",
      "Negotiation skills",
    ],
    testimonialPrompts: [
      "finding their home",
      "the buying process",
      "agent expertise",
      "selling experience",
    ],
  },

  // ============================================
  // CONSTRUCTION / CONTRACTING
  // ============================================
  construction: {
    heroHeadlines: [
      "Building Dreams, Delivering Quality",
      "Your Vision, Our Expertise",
      "Quality Craftsmanship Guaranteed",
      "From Blueprint to Reality",
      "Building Excellence Since [Year]",
    ],
    ctaTexts: [
      "Get Free Quote",
      "Request Estimate",
      "Contact Us",
      "Start Your Project",
      "Schedule Consultation",
    ],
    featureIcons: [
      "Hammer",
      "HardHat",
      "Award",
      "Shield",
      "Clock",
      "CheckCircle",
      "Home",
      "Wrench",
    ],
    faqTopics: [
      "quotes",
      "timeline",
      "warranty",
      "permits",
      "materials",
      "payment schedule",
      "references",
    ],
    valueProps: [
      "Licensed & insured",
      "Quality materials",
      "On-time completion",
      "Satisfaction guaranteed",
      "Transparent pricing",
      "20+ years experience",
    ],
    testimonialPrompts: [
      "project quality",
      "timeline adherence",
      "communication",
      "value for money",
    ],
  },

  // ============================================
  // FITNESS / GYM
  // ============================================
  fitness: {
    heroHeadlines: [
      "Transform Your Body, Transform Your Life",
      "Your Fitness Journey Starts Here",
      "Stronger Every Day",
      "Unleash Your Potential",
      "Results That Speak for Themselves",
    ],
    ctaTexts: [
      "Start Free Trial",
      "Join Now",
      "Get Your Pass",
      "Book Class",
      "Claim Free Week",
    ],
    featureIcons: [
      "Dumbbell",
      "Users",
      "Clock",
      "Award",
      "Heart",
      "Zap",
      "Target",
      "Flame",
    ],
    faqTopics: [
      "membership options",
      "class schedule",
      "personal training",
      "amenities",
      "cancellation",
      "trial membership",
      "hours",
    ],
    valueProps: [
      "State-of-the-art equipment",
      "Expert trainers",
      "Group classes included",
      "No long-term contracts",
      "Open 24/7",
      "Results guaranteed",
    ],
    testimonialPrompts: [
      "fitness results",
      "trainer quality",
      "facility cleanliness",
      "community atmosphere",
    ],
  },

  // ============================================
  // CONSULTING
  // ============================================
  consulting: {
    heroHeadlines: [
      "Insights That Drive Results",
      "Transform Challenges Into Opportunities",
      "Expert Guidance, Proven Results",
      "Strategy That Delivers",
      "Your Success Is Our Mission",
    ],
    ctaTexts: [
      "Schedule Consultation",
      "Get Expert Advice",
      "Contact Us",
      "Book a Call",
      "Request Proposal",
    ],
    featureIcons: [
      "LineChart",
      "Lightbulb",
      "Target",
      "Users",
      "Award",
      "Briefcase",
      "TrendingUp",
      "Puzzle",
    ],
    faqTopics: [
      "engagement process",
      "pricing models",
      "industries served",
      "typical timeline",
      "team expertise",
      "success metrics",
    ],
    valueProps: [
      "Proven methodology",
      "Industry expertise",
      "Measurable results",
      "Dedicated support",
      "Custom solutions",
      "Executive experience",
    ],
    testimonialPrompts: [
      "business impact",
      "strategic insights",
      "ROI achieved",
      "working relationship",
    ],
  },

  // ============================================
  // AGENCY (MARKETING/CREATIVE)
  // ============================================
  agency: {
    heroHeadlines: [
      "Creativity That Converts",
      "Your Brand, Amplified",
      "Marketing That Moves People",
      "Where Strategy Meets Creativity",
      "Results-Driven Digital Excellence",
    ],
    ctaTexts: [
      "Start Your Project",
      "Get a Quote",
      "Let's Talk",
      "View Our Work",
      "Schedule Discovery Call",
    ],
    featureIcons: [
      "Palette",
      "BarChart",
      "Megaphone",
      "Globe",
      "Sparkles",
      "Award",
      "Users",
      "Rocket",
    ],
    faqTopics: [
      "services offered",
      "pricing",
      "process",
      "timeline",
      "revisions",
      "ownership",
      "reporting",
    ],
    valueProps: [
      "Award-winning work",
      "Full-service capabilities",
      "Data-driven approach",
      "Dedicated account team",
      "Transparent reporting",
      "Proven ROI",
    ],
    testimonialPrompts: [
      "campaign results",
      "creative quality",
      "collaboration",
      "business growth",
    ],
  },

  // ============================================
  // DENTAL
  // ============================================
  dental: {
    heroHeadlines: [
      "Smiles That Shine",
      "Gentle Care, Beautiful Results",
      "Your Smile, Our Passion",
      "Modern Dentistry, Caring Touch",
      "Healthy Smiles for Life",
    ],
    ctaTexts: [
      "Book Appointment",
      "Schedule Visit",
      "Get a Consultation",
      "Contact Our Office",
      "Request Appointment",
    ],
    featureIcons: [
      "Smile",
      "Shield",
      "Award",
      "Clock",
      "Heart",
      "Sparkles",
      "Users",
      "Star",
    ],
    faqTopics: [
      "insurance",
      "payment plans",
      "emergency care",
      "procedures",
      "sedation options",
      "new patients",
      "children",
    ],
    valueProps: [
      "Gentle care",
      "Modern technology",
      "Family-friendly",
      "Emergency appointments",
      "Insurance accepted",
      "Sedation available",
    ],
    testimonialPrompts: [
      "treatment experience",
      "staff friendliness",
      "pain management",
      "results",
    ],
  },

  // ============================================
  // PHOTOGRAPHY
  // ============================================
  photography: {
    heroHeadlines: [
      "Capturing Life's Beautiful Moments",
      "Your Story, Beautifully Told",
      "Memories That Last Forever",
      "Art Through the Lens",
      "Timeless Images, Lasting Memories",
    ],
    ctaTexts: [
      "View Portfolio",
      "Book a Session",
      "Get Quote",
      "Contact Me",
      "Check Availability",
    ],
    featureIcons: [
      "Camera",
      "Heart",
      "Star",
      "Award",
      "Image",
      "Clock",
      "MapPin",
      "Sparkles",
    ],
    faqTopics: [
      "booking process",
      "pricing packages",
      "delivery time",
      "location",
      "what to wear",
      "prints",
      "retouching",
    ],
    valueProps: [
      "Award-winning photography",
      "Quick turnaround",
      "Digital delivery",
      "Print options",
      "Retouching included",
      "Travel available",
    ],
    testimonialPrompts: [
      "photo quality",
      "session experience",
      "professionalism",
      "turnaround time",
    ],
  },

  // ============================================
  // EDUCATION / COURSES
  // ============================================
  education: {
    heroHeadlines: [
      "Learn. Grow. Succeed.",
      "Unlock Your Potential",
      "Education That Transforms",
      "Your Future Starts Here",
      "Skills for Tomorrow, Today",
    ],
    ctaTexts: [
      "Enroll Now",
      "Start Learning",
      "Browse Courses",
      "Get Started Free",
      "Apply Today",
    ],
    featureIcons: [
      "BookOpen",
      "Award",
      "Users",
      "Laptop",
      "Clock",
      "Star",
      "Target",
      "Lightbulb",
    ],
    faqTopics: [
      "enrollment",
      "course format",
      "certification",
      "prerequisites",
      "payment options",
      "refunds",
      "job placement",
    ],
    valueProps: [
      "Expert instructors",
      "Flexible learning",
      "Industry-recognized certification",
      "Lifetime access",
      "Job placement support",
      "Money-back guarantee",
    ],
    testimonialPrompts: [
      "learning experience",
      "career advancement",
      "course quality",
      "instructor support",
    ],
  },

  // ============================================
  // WEDDING / EVENTS
  // ============================================
  wedding: {
    heroHeadlines: [
      "Your Perfect Day, Beautifully Planned",
      "Creating Wedding Dreams",
      "Love Stories Start Here",
      "Where Fairytales Come True",
      "Celebrate Love, Celebrate Life",
    ],
    ctaTexts: [
      "Schedule Consultation",
      "Request Quote",
      "View Packages",
      "Let's Plan Together",
      "Start Planning",
    ],
    featureIcons: [
      "Heart",
      "Calendar",
      "Star",
      "Camera",
      "Sparkles",
      "Music",
      "Users",
      "Gift",
    ],
    faqTopics: [
      "planning process",
      "pricing",
      "timeline",
      "vendors",
      "day-of coordination",
      "destination weddings",
      "deposits",
    ],
    valueProps: [
      "Full-service planning",
      "Vendor relationships",
      "Attention to detail",
      "Stress-free experience",
      "Budget management",
      "Personalized service",
    ],
    testimonialPrompts: [
      "wedding day experience",
      "planning process",
      "vendor coordination",
      "attention to detail",
    ],
  },
};

// =============================================================================
// TEMPLATE HELPERS
// =============================================================================

/**
 * Get template for a specific industry
 */
export function getIndustryTemplate(
  industry: string
): IndustryContentTemplate | null {
  const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, "-");
  return industryContentTemplates[normalizedIndustry] || null;
}

/**
 * Get a random headline from industry template
 */
export function getRandomHeadline(industry: string): string {
  const template = getIndustryTemplate(industry);
  if (!template || template.heroHeadlines.length === 0) {
    return "Welcome to Our Business";
  }
  const index = Math.floor(Math.random() * template.heroHeadlines.length);
  return template.heroHeadlines[index];
}

/**
 * Get CTA texts for an industry
 */
export function getIndustryCTAs(industry: string): string[] {
  const template = getIndustryTemplate(industry);
  return template?.ctaTexts || ["Contact Us", "Learn More", "Get Started"];
}

/**
 * Get recommended icons for an industry
 */
export function getIndustryIcons(industry: string): string[] {
  const template = getIndustryTemplate(industry);
  return template?.featureIcons || [
    "Star",
    "Award",
    "Shield",
    "Users",
    "Clock",
    "CheckCircle",
  ];
}

/**
 * Get FAQ topics for an industry
 */
export function getIndustryFAQTopics(industry: string): string[] {
  const template = getIndustryTemplate(industry);
  return template?.faqTopics || [
    "pricing",
    "services",
    "hours",
    "contact",
    "location",
  ];
}

/**
 * Get value propositions for an industry
 */
export function getIndustryValueProps(industry: string): string[] {
  const template = getIndustryTemplate(industry);
  return template?.valueProps || [
    "Quality service",
    "Expert team",
    "Customer satisfaction",
    "Competitive pricing",
  ];
}

/**
 * Get all supported industries
 */
export function getSupportedIndustries(): string[] {
  return Object.keys(industryContentTemplates);
}

/**
 * Check if an industry has a template
 */
export function hasIndustryTemplate(industry: string): boolean {
  return getIndustryTemplate(industry) !== null;
}
