export type ModuleCategory =
  | "analytics"
  | "seo"
  | "ecommerce"
  | "forms"
  | "social"
  | "marketing"
  | "security"
  | "performance"
  | "communication"
  | "content"
  | "integrations"
  | "utilities";

export type ModulePricingType = "free" | "one-time" | "monthly" | "yearly";

export interface ModulePricing {
  type: ModulePricingType;
  amount: number; // In cents, 0 for free
  currency: string;
  lemonSqueezyProductId?: string;
  lemonSqueezyVariantId?: string;
}

export interface ModuleAuthor {
  name: string;
  email?: string;
  website?: string;
  verified: boolean;
}

export interface ModuleDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  version: string;
  icon: string;
  screenshots: string[];
  category: ModuleCategory;
  tags: string[];
  author: ModuleAuthor;
  pricing: ModulePricing;
  features: string[];
  requirements?: string[];
  changelog?: ChangelogEntry[];
  rating?: number;
  reviewCount?: number;
  installCount?: number;
  status: "active" | "deprecated" | "beta";
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface InstalledModule {
  id: string;
  siteId: string;
  moduleId: string;
  module: ModuleDefinition;
  installedAt: Date;
  lastUpdatedAt: Date;
  settings: Record<string, unknown>;
  enabled: boolean;
  licenseKey?: string;
}

export interface ModuleSearchParams {
  query?: string;
  category?: ModuleCategory;
  priceType?: ModulePricingType;
  sort?: "popular" | "newest" | "price-low" | "price-high" | "rating";
  page?: number;
  limit?: number;
}
