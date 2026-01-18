/**
 * Industry Template Data
 * Phase 68: Industry Templates UI
 * 
 * Contains 12 pre-built industry templates covering diverse business types.
 */

import type { Template } from "./template-types";

export const TEMPLATES: Template[] = [
  // Restaurant Templates
  {
    id: "modern-restaurant",
    name: "Modern Restaurant",
    description: "Elegant restaurant website with menu showcase and reservations",
    industry: "restaurant",
    thumbnail: "/templates/restaurant-modern.svg",
    sections: ["hero", "menu", "about", "gallery", "reservations", "contact"],
    features: ["Menu display", "Online reservations", "Photo gallery", "Location map"],
    popularity: 95,
    colorScheme: {
      primary: "#b91c1c",
      secondary: "#fef3c7",
      accent: "#78350f",
    },
  },
  {
    id: "cafe-bistro",
    name: "Café & Bistro",
    description: "Cozy café website with menu cards and atmosphere showcase",
    industry: "restaurant",
    thumbnail: "/templates/cafe-bistro.svg",
    sections: ["hero", "menu", "specialties", "atmosphere", "hours", "contact"],
    features: ["Daily specials", "Drink menu", "Ambiance gallery", "Social links"],
    popularity: 82,
    colorScheme: {
      primary: "#78350f",
      secondary: "#fef3c7",
      accent: "#92400e",
    },
  },

  // Portfolio Templates
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Minimalist portfolio for designers and artists",
    industry: "portfolio",
    thumbnail: "/templates/portfolio-creative.svg",
    sections: ["hero", "work", "about", "services", "testimonials", "contact"],
    features: ["Project showcase", "Filterable gallery", "Case studies", "Contact form"],
    popularity: 92,
    colorScheme: {
      primary: "#1e1e1e",
      secondary: "#f5f5f5",
      accent: "#6366f1",
    },
  },

  // Technology Templates
  {
    id: "tech-startup",
    name: "Tech Startup",
    description: "Modern SaaS landing page with features and pricing",
    industry: "technology",
    thumbnail: "/templates/tech-startup.svg",
    sections: ["hero", "features", "howItWorks", "pricing", "testimonials", "cta"],
    features: ["Feature grid", "Pricing table", "Testimonials", "Newsletter signup"],
    popularity: 90,
    colorScheme: {
      primary: "#6366f1",
      secondary: "#f0fdf4",
      accent: "#22c55e",
    },
  },
  {
    id: "saas-product",
    name: "SaaS Product",
    description: "Software product page with demos and integrations",
    industry: "technology",
    thumbnail: "/templates/saas-product.svg",
    sections: ["hero", "features", "demo", "integrations", "pricing", "faq", "contact"],
    features: ["Live demo", "Feature comparison", "Integration logos", "Pricing tiers"],
    popularity: 88,
    colorScheme: {
      primary: "#2563eb",
      secondary: "#eff6ff",
      accent: "#3b82f6",
    },
  },

  // Fitness Templates
  {
    id: "fitness-studio",
    name: "Fitness Studio",
    description: "Dynamic gym and fitness center website",
    industry: "fitness",
    thumbnail: "/templates/fitness-studio.svg",
    sections: ["hero", "classes", "trainers", "schedule", "pricing", "contact"],
    features: ["Class schedule", "Trainer profiles", "Membership plans", "Class booking"],
    popularity: 88,
    colorScheme: {
      primary: "#dc2626",
      secondary: "#1f2937",
      accent: "#f59e0b",
    },
  },

  // Healthcare Templates
  {
    id: "healthcare-clinic",
    name: "Healthcare Clinic",
    description: "Professional medical practice website",
    industry: "healthcare",
    thumbnail: "/templates/healthcare-clinic.svg",
    sections: ["hero", "services", "doctors", "testimonials", "faq", "contact"],
    features: ["Service list", "Doctor profiles", "Appointment booking", "FAQ section"],
    popularity: 85,
    colorScheme: {
      primary: "#0891b2",
      secondary: "#f0fdfa",
      accent: "#14b8a6",
    },
  },

  // Real Estate Templates
  {
    id: "real-estate",
    name: "Real Estate Agency",
    description: "Property listing and real estate agency site",
    industry: "realestate",
    thumbnail: "/templates/real-estate.svg",
    sections: ["hero", "properties", "services", "agents", "testimonials", "contact"],
    features: ["Property grid", "Agent profiles", "Search functionality", "Inquiry form"],
    popularity: 87,
    colorScheme: {
      primary: "#059669",
      secondary: "#f0fdf4",
      accent: "#10b981",
    },
  },

  // Agency Templates
  {
    id: "digital-agency",
    name: "Digital Agency",
    description: "Creative agency website showcasing services and work",
    industry: "agency",
    thumbnail: "/templates/digital-agency.svg",
    sections: ["hero", "services", "portfolio", "process", "team", "testimonials", "contact"],
    features: ["Service showcase", "Case studies", "Team profiles", "Client logos"],
    popularity: 91,
    colorScheme: {
      primary: "#7c3aed",
      secondary: "#faf5ff",
      accent: "#a855f7",
    },
  },

  // Beauty Templates
  {
    id: "beauty-salon",
    name: "Beauty Salon",
    description: "Elegant salon and spa website with booking",
    industry: "beauty",
    thumbnail: "/templates/beauty-salon.svg",
    sections: ["hero", "services", "gallery", "team", "pricing", "booking", "contact"],
    features: ["Service menu", "Before/after gallery", "Online booking", "Gift cards"],
    popularity: 84,
    colorScheme: {
      primary: "#ec4899",
      secondary: "#fdf2f8",
      accent: "#f472b6",
    },
  },

  // Education Templates
  {
    id: "education-school",
    name: "Education & Courses",
    description: "Online learning platform with course catalog",
    industry: "education",
    thumbnail: "/templates/education-school.svg",
    sections: ["hero", "courses", "instructors", "testimonials", "pricing", "faq", "contact"],
    features: ["Course catalog", "Instructor bios", "Enrollment forms", "Certificate info"],
    popularity: 83,
    colorScheme: {
      primary: "#0369a1",
      secondary: "#f0f9ff",
      accent: "#0ea5e9",
    },
  },

  // Legal Templates
  {
    id: "law-firm",
    name: "Law Firm",
    description: "Professional law firm website with practice areas",
    industry: "legal",
    thumbnail: "/templates/law-firm.svg",
    sections: ["hero", "practiceAreas", "attorneys", "caseResults", "testimonials", "contact"],
    features: ["Practice area pages", "Attorney profiles", "Case results", "Free consultation"],
    popularity: 79,
    colorScheme: {
      primary: "#1e3a5f",
      secondary: "#f8fafc",
      accent: "#ca8a04",
    },
  },
];

/**
 * Get templates filtered by industry
 */
export function getTemplatesByIndustry(industry: string): Template[] {
  if (industry === "all") return TEMPLATES;
  return TEMPLATES.filter((t) => t.industry === industry);
}

/**
 * Get a template by its ID
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Get most popular templates
 */
export function getPopularTemplates(limit: number = 6): Template[] {
  return [...TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

/**
 * Get templates that have a specific feature
 */
export function getTemplatesByFeature(feature: string): Template[] {
  const lowercaseFeature = feature.toLowerCase();
  return TEMPLATES.filter((t) =>
    t.features.some((f) => f.toLowerCase().includes(lowercaseFeature))
  );
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): Template[] {
  const lowercaseQuery = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get count of templates per industry
 */
export function getTemplateCountByIndustry(): Record<string, number> {
  return TEMPLATES.reduce(
    (acc, t) => {
      acc[t.industry] = (acc[t.industry] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
