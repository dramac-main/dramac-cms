// Industry options with AI context
export const INDUSTRIES = [
  { id: "restaurant", label: "Restaurant & Food", icon: "🍽️", aiContext: "food service, dining, menu, reservations" },
  { id: "retail", label: "Retail & E-commerce", icon: "🛍️", aiContext: "products, shopping, inventory, sales" },
  { id: "healthcare", label: "Healthcare & Medical", icon: "🏥", aiContext: "medical, health, wellness, patients" },
  { id: "legal", label: "Legal & Law", icon: "⚖️", aiContext: "legal services, law firm, attorneys, cases" },
  { id: "realestate", label: "Real Estate", icon: "🏠", aiContext: "property, homes, listings, agents" },
  { id: "fitness", label: "Fitness & Wellness", icon: "💪", aiContext: "gym, fitness, training, health" },
  { id: "beauty", label: "Beauty & Salon", icon: "💇", aiContext: "beauty, salon, spa, treatments" },
  { id: "automotive", label: "Automotive", icon: "🚗", aiContext: "cars, vehicles, repair, dealership" },
  { id: "construction", label: "Construction", icon: "🏗️", aiContext: "building, contractors, renovation" },
  { id: "finance", label: "Finance & Accounting", icon: "💰", aiContext: "financial, accounting, investment" },
  { id: "education", label: "Education", icon: "📚", aiContext: "learning, courses, school, training" },
  { id: "technology", label: "Technology", icon: "💻", aiContext: "tech, software, IT, digital" },
  { id: "creative", label: "Creative & Design", icon: "🎨", aiContext: "design, creative, art, branding" },
  { id: "hospitality", label: "Hospitality & Travel", icon: "✈️", aiContext: "hotel, travel, tourism, booking" },
  { id: "nonprofit", label: "Non-Profit", icon: "❤️", aiContext: "charity, nonprofit, community, cause" },
  { id: "other", label: "Other", icon: "📌", aiContext: "business, professional services" },
] as const;

export type IndustryId = typeof INDUSTRIES[number]["id"];

export interface OnboardingStatus {
  needsOnboarding: boolean;
  currentStep: number;
  completedSteps: string[];
  hasAgency: boolean;
  hasProfile: boolean;
}

export interface ProfileFormData {
  fullName: string;
  jobTitle?: string;
}

export interface AgencyFormData {
  name: string;
  description?: string;
  website?: string;
  industry?: IndustryId;
  teamSize?: string;
  goals?: string[];
}

export interface ClientFormData {
  name: string;
  email?: string;
  industry?: IndustryId;
}
