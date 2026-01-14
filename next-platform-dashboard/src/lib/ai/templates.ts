export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedSections: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  samplePrompt: string;
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: "agency",
    name: "Creative Agency",
    description: "Marketing, design, and creative agencies",
    icon: "Palette",
    suggestedSections: ["hero", "services", "portfolio", "team", "testimonials", "contact"],
    colorScheme: {
      primary: "#6366f1",
      secondary: "#0f172a",
      accent: "#f97316",
    },
    samplePrompt: "A modern creative agency specializing in brand identity and digital marketing",
  },
  {
    id: "saas",
    name: "SaaS Product",
    description: "Software as a service landing pages",
    icon: "Rocket",
    suggestedSections: ["hero", "features", "pricing", "testimonials", "faq", "cta"],
    colorScheme: {
      primary: "#0ea5e9",
      secondary: "#1e293b",
      accent: "#22c55e",
    },
    samplePrompt: "A project management tool that helps teams collaborate efficiently",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Online stores and product showcases",
    icon: "ShoppingCart",
    suggestedSections: ["hero", "products", "features", "testimonials", "newsletter", "contact"],
    colorScheme: {
      primary: "#ec4899",
      secondary: "#0f172a",
      accent: "#eab308",
    },
    samplePrompt: "An online boutique selling handcrafted jewelry and accessories",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Restaurants, cafes, and food businesses",
    icon: "UtensilsCrossed",
    suggestedSections: ["hero", "menu", "about", "gallery", "testimonials", "contact"],
    colorScheme: {
      primary: "#dc2626",
      secondary: "#1c1917",
      accent: "#fbbf24",
    },
    samplePrompt: "An Italian restaurant known for authentic pasta and cozy atmosphere",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal portfolios and freelancers",
    icon: "User",
    suggestedSections: ["hero", "about", "skills", "projects", "testimonials", "contact"],
    colorScheme: {
      primary: "#8b5cf6",
      secondary: "#0f172a",
      accent: "#06b6d4",
    },
    samplePrompt: "A UI/UX designer showcasing mobile and web design projects",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medical practices and health services",
    icon: "HeartPulse",
    suggestedSections: ["hero", "services", "team", "testimonials", "faq", "contact"],
    colorScheme: {
      primary: "#14b8a6",
      secondary: "#0f172a",
      accent: "#3b82f6",
    },
    samplePrompt: "A family dental practice offering comprehensive dental care",
  },
  {
    id: "realestate",
    name: "Real Estate",
    description: "Property listings and real estate agencies",
    icon: "Home",
    suggestedSections: ["hero", "listings", "services", "team", "testimonials", "contact"],
    colorScheme: {
      primary: "#059669",
      secondary: "#1e293b",
      accent: "#f59e0b",
    },
    samplePrompt: "A luxury real estate agency specializing in waterfront properties",
  },
  {
    id: "fitness",
    name: "Fitness",
    description: "Gyms, trainers, and fitness centers",
    icon: "Dumbbell",
    suggestedSections: ["hero", "programs", "trainers", "pricing", "testimonials", "contact"],
    colorScheme: {
      primary: "#ef4444",
      secondary: "#0a0a0a",
      accent: "#fbbf24",
    },
    samplePrompt: "A high-intensity fitness studio offering personalized training",
  },
  {
    id: "education",
    name: "Education",
    description: "Schools, courses, and educational platforms",
    icon: "GraduationCap",
    suggestedSections: ["hero", "courses", "instructors", "testimonials", "faq", "contact"],
    colorScheme: {
      primary: "#2563eb",
      secondary: "#0f172a",
      accent: "#10b981",
    },
    samplePrompt: "An online coding bootcamp teaching full-stack development",
  },
  {
    id: "nonprofit",
    name: "Non-profit",
    description: "Charities and non-profit organizations",
    icon: "Heart",
    suggestedSections: ["hero", "mission", "impact", "team", "events", "donate"],
    colorScheme: {
      primary: "#7c3aed",
      secondary: "#0f172a",
      accent: "#f97316",
    },
    samplePrompt: "A wildlife conservation organization protecting endangered species",
  },
];

export function getTemplateById(id: string): IndustryTemplate | undefined {
  return industryTemplates.find((t) => t.id === id);
}
