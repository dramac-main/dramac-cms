/**
 * Industry Template Types
 * Phase 68: Industry Templates UI
 */

export type IndustryCategory =
  | "restaurant"
  | "retail"
  | "portfolio"
  | "agency"
  | "healthcare"
  | "education"
  | "realestate"
  | "fitness"
  | "beauty"
  | "technology"
  | "nonprofit"
  | "legal"
  | "construction"
  | "photography"
  | "events"
  | "general";

export interface Template {
  id: string;
  name: string;
  description: string;
  industry: IndustryCategory;
  thumbnail: string;
  sections: string[];
  features: string[];
  popularity: number;
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface IndustryInfo {
  id: IndustryCategory;
  label: string;
  icon: string;
  description: string;
}

export const INDUSTRIES: IndustryInfo[] = [
  { id: "general", label: "General", icon: "🏢", description: "Multi-purpose websites" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", description: "Restaurants & cafes" },
  { id: "retail", label: "Retail", icon: "🛍️", description: "Shops & e-commerce" },
  { id: "portfolio", label: "Portfolio", icon: "🎨", description: "Creative portfolios" },
  { id: "agency", label: "Agency", icon: "💼", description: "Marketing & design agencies" },
  { id: "healthcare", label: "Healthcare", icon: "🏥", description: "Medical & health services" },
  { id: "education", label: "Education", icon: "📚", description: "Schools & courses" },
  { id: "realestate", label: "Real Estate", icon: "🏠", description: "Property & listings" },
  { id: "fitness", label: "Fitness", icon: "💪", description: "Gyms & trainers" },
  { id: "beauty", label: "Beauty", icon: "💄", description: "Salons & spas" },
  { id: "technology", label: "Technology", icon: "💻", description: "Tech & SaaS" },
  { id: "nonprofit", label: "Nonprofit", icon: "❤️", description: "Charities & NGOs" },
  { id: "legal", label: "Legal", icon: "⚖️", description: "Law firms" },
  { id: "construction", label: "Construction", icon: "🔨", description: "Builders & contractors" },
  { id: "photography", label: "Photography", icon: "📷", description: "Photo studios" },
  { id: "events", label: "Events", icon: "🎉", description: "Event planning" },
];

export function getIndustryInfo(id: IndustryCategory): IndustryInfo | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

export function getIndustryIcon(id: IndustryCategory): string {
  return getIndustryInfo(id)?.icon || "🌐";
}

export function getIndustryLabel(id: IndustryCategory): string {
  return getIndustryInfo(id)?.label || "General";
}
