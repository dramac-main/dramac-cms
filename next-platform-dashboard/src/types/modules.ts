export interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  icon: string;
  category: ModuleCategory;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  is_featured: boolean;
  features: string[];
  screenshots: string[];
  requirements: string[];
  version: string;
  created_at: string;
  updated_at: string;
}

export type ModuleCategory = 
  | "analytics"
  | "seo"
  | "forms"
  | "ecommerce"
  | "content"
  | "localization"
  | "membership"
  | "scheduling";

export interface ModuleSubscription {
  id: string;
  agency_id: string;
  module_id: string;
  status: "active" | "canceled" | "past_due";
  billing_cycle: "monthly" | "yearly";
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  module?: Module;
}

export interface SiteModule {
  id: string;
  site_id: string;
  module_id: string;
  settings: Record<string, unknown>;
  is_enabled: boolean;
  enabled_at: string;
  // Joined
  module?: Module;
}

export const MODULE_CATEGORIES: Record<ModuleCategory, { label: string; icon: string }> = {
  analytics: { label: "Analytics", icon: "BarChart3" },
  seo: { label: "SEO", icon: "Search" },
  forms: { label: "Forms", icon: "FileText" },
  ecommerce: { label: "E-commerce", icon: "ShoppingCart" },
  content: { label: "Content", icon: "Newspaper" },
  localization: { label: "Localization", icon: "Globe" },
  membership: { label: "Membership", icon: "Users" },
  scheduling: { label: "Scheduling", icon: "Calendar" },
};
