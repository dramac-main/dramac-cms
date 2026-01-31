/**
 * Puck Template Categories
 * PHASE-ED-07A: Template System - Categories
 * 
 * Defines 20 industry categories with metadata, icons, descriptions,
 * and color schemes for visual organization in the template library.
 */

import type { CategoryInfo, TemplateCategory, SectionInfo, SectionType } from "@/types/puck-templates";

// ============================================
// TEMPLATE CATEGORIES
// ============================================

export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  {
    id: "landing",
    label: "Landing Pages",
    icon: "🚀",
    description: "High-converting landing pages for products, launches, and campaigns",
    color: "#6366f1",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "business",
    label: "Business",
    icon: "💼",
    description: "Professional websites for companies, enterprises, and services",
    color: "#0ea5e9",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "🎨",
    description: "Creative portfolios for designers, artists, and professionals",
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    icon: "🛍️",
    description: "Online stores with product showcases and shopping features",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "blog",
    label: "Blog & Content",
    icon: "📝",
    description: "Blogs, magazines, and content-focused websites",
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    icon: "🍽️",
    description: "Restaurants, cafés, bars, and food establishments",
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "💪",
    description: "Gyms, trainers, wellness centers, and fitness studios",
    color: "#f97316",
    gradient: "from-orange-500 to-red-600",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: "🏥",
    description: "Medical practices, clinics, and health services",
    color: "#06b6d4",
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    id: "education",
    label: "Education",
    icon: "📚",
    description: "Schools, courses, online learning, and educational institutions",
    color: "#3b82f6",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "realestate",
    label: "Real Estate",
    icon: "🏠",
    description: "Property listings, real estate agencies, and housing services",
    color: "#22c55e",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "beauty",
    label: "Beauty & Spa",
    icon: "💄",
    description: "Salons, spas, beauty services, and wellness centers",
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "technology",
    label: "Technology",
    icon: "💻",
    description: "Tech companies, SaaS products, and software services",
    color: "#6366f1",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    id: "nonprofit",
    label: "Nonprofit",
    icon: "❤️",
    description: "Charities, NGOs, and non-profit organizations",
    color: "#ef4444",
    gradient: "from-red-400 to-pink-500",
  },
  {
    id: "legal",
    label: "Legal",
    icon: "⚖️",
    description: "Law firms, attorneys, and legal services",
    color: "#1e3a5f",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    id: "construction",
    label: "Construction",
    icon: "🔨",
    description: "Construction companies, contractors, and building services",
    color: "#ca8a04",
    gradient: "from-yellow-600 to-amber-700",
  },
  {
    id: "events",
    label: "Events",
    icon: "🎉",
    description: "Event planning, weddings, conferences, and celebrations",
    color: "#d946ef",
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "photography",
    label: "Photography",
    icon: "📷",
    description: "Photographers, studios, and visual artists",
    color: "#171717",
    gradient: "from-neutral-800 to-neutral-900",
  },
  {
    id: "travel",
    label: "Travel",
    icon: "✈️",
    description: "Travel agencies, tourism, and adventure services",
    color: "#0891b2",
    gradient: "from-cyan-600 to-blue-700",
  },
  {
    id: "hospitality",
    label: "Hospitality",
    icon: "🏨",
    description: "Hotels, resorts, and accommodation services",
    color: "#7c3aed",
    gradient: "from-violet-600 to-indigo-700",
  },
  {
    id: "other",
    label: "Other",
    icon: "🌐",
    description: "General purpose and miscellaneous templates",
    color: "#6b7280",
    gradient: "from-gray-500 to-gray-700",
  },
];

// ============================================
// SECTION TYPES
// ============================================

export const SECTION_TYPES: SectionInfo[] = [
  {
    type: "hero",
    label: "Hero Section",
    description: "Main banner with headline, subtitle, and CTA",
    icon: "🎯",
    commonComponents: ["Hero", "HeroVideo", "HeroSlider"],
  },
  {
    type: "features",
    label: "Features",
    description: "Highlight product or service features",
    icon: "✨",
    commonComponents: ["Features", "FeatureComparison", "ValueProposition"],
  },
  {
    type: "cta",
    label: "Call to Action",
    description: "Conversion-focused section with action button",
    icon: "👆",
    commonComponents: ["CTA", "LeadCapture", "Newsletter"],
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer reviews and social proof",
    icon: "💬",
    commonComponents: ["Testimonials", "TestimonialWall", "SocialProof"],
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Frequently asked questions",
    icon: "❓",
    commonComponents: ["FAQ", "AccordionContainer"],
  },
  {
    type: "stats",
    label: "Statistics",
    description: "Key numbers and metrics",
    icon: "📊",
    commonComponents: ["Stats", "Counter"],
  },
  {
    type: "team",
    label: "Team",
    description: "Team member profiles",
    icon: "👥",
    commonComponents: ["Team", "AvatarGroup"],
  },
  {
    type: "gallery",
    label: "Gallery",
    description: "Image or media gallery",
    icon: "🖼️",
    commonComponents: ["Gallery", "Lightbox", "Carousel"],
  },
  {
    type: "pricing",
    label: "Pricing",
    description: "Pricing plans and packages",
    icon: "💰",
    commonComponents: ["PricingTable", "ComparisonTable"],
  },
  {
    type: "contact",
    label: "Contact",
    description: "Contact form and information",
    icon: "📧",
    commonComponents: ["ContactForm", "Map"],
  },
  {
    type: "about",
    label: "About",
    description: "Company or personal about section",
    icon: "ℹ️",
    commonComponents: ["Section", "Text", "Image"],
  },
  {
    type: "services",
    label: "Services",
    description: "Service offerings grid",
    icon: "🛠️",
    commonComponents: ["Features", "Card", "Grid"],
  },
  {
    type: "portfolio",
    label: "Portfolio",
    description: "Work samples and case studies",
    icon: "📁",
    commonComponents: ["Gallery", "Grid", "Card"],
  },
  {
    type: "blog",
    label: "Blog",
    description: "Blog posts preview",
    icon: "📰",
    commonComponents: ["Grid", "Card"],
  },
  {
    type: "newsletter",
    label: "Newsletter",
    description: "Email subscription form",
    icon: "📬",
    commonComponents: ["Newsletter", "LeadCapture"],
  },
  {
    type: "footer",
    label: "Footer",
    description: "Site footer with links",
    icon: "📜",
    commonComponents: ["Footer", "SocialLinks"],
  },
  {
    type: "navbar",
    label: "Navigation",
    description: "Site navigation header",
    icon: "🧭",
    commonComponents: ["Navbar"],
  },
  {
    type: "products",
    label: "Products",
    description: "Product showcase grid",
    icon: "🏷️",
    commonComponents: ["ProductGrid", "ProductCard", "FeaturedProducts"],
  },
  {
    type: "benefits",
    label: "Benefits",
    description: "Key benefits list",
    icon: "✅",
    commonComponents: ["Features", "List", "Icon"],
  },
  {
    type: "process",
    label: "Process",
    description: "Step-by-step process flow",
    icon: "🔄",
    commonComponents: ["Timeline", "Stats"],
  },
  {
    type: "clients",
    label: "Clients",
    description: "Client logos and partners",
    icon: "🤝",
    commonComponents: ["LogoCloud", "TrustBadges"],
  },
  {
    type: "integrations",
    label: "Integrations",
    description: "Integration partners grid",
    icon: "🔗",
    commonComponents: ["LogoCloud", "Grid"],
  },
  {
    type: "comparison",
    label: "Comparison",
    description: "Feature comparison table",
    icon: "⚖️",
    commonComponents: ["ComparisonTable", "FeatureComparison"],
  },
  {
    type: "timeline",
    label: "Timeline",
    description: "Chronological events",
    icon: "📅",
    commonComponents: ["Timeline"],
  },
  {
    type: "video",
    label: "Video",
    description: "Video embed section",
    icon: "🎬",
    commonComponents: ["Video", "VideoBackground"],
  },
  {
    type: "map",
    label: "Map",
    description: "Location map embed",
    icon: "📍",
    commonComponents: ["Map"],
  },
  {
    type: "social",
    label: "Social",
    description: "Social media links",
    icon: "📱",
    commonComponents: ["SocialLinks", "SocialProof"],
  },
  {
    type: "download",
    label: "Download",
    description: "App download section",
    icon: "⬇️",
    commonComponents: ["CTA", "Button", "Image"],
  },
  {
    type: "custom",
    label: "Custom",
    description: "Custom content section",
    icon: "🎨",
    commonComponents: ["Section", "Container"],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get category info by ID
 */
export function getCategoryInfo(id: TemplateCategory): CategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get category icon by ID
 */
export function getCategoryIcon(id: TemplateCategory): string {
  return getCategoryInfo(id)?.icon || "🌐";
}

/**
 * Get category label by ID
 */
export function getCategoryLabel(id: TemplateCategory): string {
  return getCategoryInfo(id)?.label || "Other";
}

/**
 * Get category color by ID
 */
export function getCategoryColor(id: TemplateCategory): string {
  return getCategoryInfo(id)?.color || "#6b7280";
}

/**
 * Get section info by type
 */
export function getSectionInfo(type: SectionType): SectionInfo | undefined {
  return SECTION_TYPES.find((s) => s.type === type);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): TemplateCategory[] {
  return TEMPLATE_CATEGORIES.map((c) => c.id);
}

/**
 * Get categories grouped by type (for UI organization)
 */
export function getCategoriesGrouped(): Record<string, CategoryInfo[]> {
  return {
    "Popular": TEMPLATE_CATEGORIES.filter((c) => 
      ["landing", "business", "portfolio", "ecommerce", "blog"].includes(c.id)
    ),
    "Industry": TEMPLATE_CATEGORIES.filter((c) =>
      ["restaurant", "fitness", "healthcare", "education", "realestate", "beauty"].includes(c.id)
    ),
    "Professional": TEMPLATE_CATEGORIES.filter((c) =>
      ["technology", "legal", "construction", "photography"].includes(c.id)
    ),
    "Services": TEMPLATE_CATEGORIES.filter((c) =>
      ["nonprofit", "events", "travel", "hospitality", "other"].includes(c.id)
    ),
  };
}

/**
 * Search categories by query
 */
export function searchCategories(query: string): CategoryInfo[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATE_CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default TEMPLATE_CATEGORIES;
