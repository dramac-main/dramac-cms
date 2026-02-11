/**
 * Module Installation Types
 * 
 * Defines the data structures for module installations at different levels:
 * - Platform (global, available to all)
 * - Agency (tools for the agency itself)
 * - Client (apps for clients, no site needed)
 * - Site (website enhancements)
 */

import { ModuleManifest, ModuleInstallLevel } from "./module-manifest";

// =============================================================
// CORE MODULE TYPES
// =============================================================

export interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  icon: string;
  bannerImage: string | null;
  
  // Classification
  category: string;
  tags: string[];
  installLevel: ModuleInstallLevel;
  
  // Versioning
  currentVersion: string;
  minPlatformVersion: string | null;
  
  // Pricing (wholesale)
  pricingType: "free" | "one_time" | "monthly" | "yearly";
  wholesalePriceMonthly: number;
  wholesalePriceYearly: number;
  wholesalePriceOneTime: number;
  suggestedRetailMonthly: number | null;
  suggestedRetailYearly: number | null;
  
  // Paddle
  paddleProductId: string | null;
  paddlePriceMonthlyId: string | null;
  paddlePriceYearlyId: string | null;
  paddlePriceOneTimeId: string | null;
  
  // Package
  packageUrl: string | null;
  packageHash: string | null;
  manifest: ModuleManifest;
  
  // Settings
  settingsSchema: Record<string, unknown>;
  defaultSettings: Record<string, unknown>;
  
  // Metadata
  authorName: string;
  authorVerified: boolean;
  screenshots: string[];
  features: string[];
  requirements: string[];
  changelog: ChangelogEntry[];
  documentationUrl: string | null;
  supportUrl: string | null;
  
  // Stats
  installCount: number;
  ratingAverage: number;
  ratingCount: number;
  
  // Status
  status: "draft" | "review" | "active" | "deprecated" | "disabled";
  isFeatured: boolean;
  isPremium: boolean;
  
  // Audit
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  breaking?: boolean;
}

// =============================================================
// INSTALLATION TYPES
// =============================================================

export interface ModuleInstallation {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  installLevel: ModuleInstallLevel;
  
  // Context (which entity is this installed on)
  agencyId?: string;
  clientId?: string;
  siteId?: string;
  
  // Status
  isEnabled: boolean;
  installedAt: Date;
  enabledAt?: Date;
  
  // Configuration
  settings: Record<string, unknown>;
  
  // Billing (for paid installations)
  billingStatus?: "active" | "canceled" | "past_due" | "trial";
  pricePaid?: number;
}

export interface AgencyModuleSubscription {
  id: string;
  agencyId: string;
  moduleId: string;
  status: "active" | "canceled" | "past_due" | "paused";
  billingCycle: "monthly" | "yearly" | "one_time";
  
  // Paddle
  paddleSubscriptionId: string | null;
  paddleTransactionId: string | null;
  paddleCustomerId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  
  // Legacy (deprecated)
  legacySubscriptionId: string | null;
  legacySubscriptionItemId: string | null;
  
  // Markup configuration
  markupType: "percentage" | "fixed" | "custom" | "passthrough";
  markupPercentage: number;
  markupFixedAmount: number;
  customPriceMonthly: number | null;
  customPriceYearly: number | null;
  retailPriceMonthlyCache: number | null;
  retailPriceYearlyCache: number | null;
  
  // Usage
  maxInstallations: number | null;
  currentInstallations: number;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface AgencyModuleInstallation {
  id: string;
  agencyId: string;
  moduleId: string;
  subscriptionId: string | null;
  
  isEnabled: boolean;
  settings: Record<string, unknown>;
  
  installedAt: Date;
  installedBy: string | null;
  enabledAt: Date | null;
}

export interface ClientModuleInstallation {
  id: string;
  clientId: string;
  moduleId: string;
  agencySubscriptionId: string | null;
  
  // Billing
  billingStatus: "active" | "canceled" | "past_due" | "trial";
  paddleSubscriptionId: string | null;
  pricePaid: number | null;
  billingCycle: "monthly" | "yearly" | "one_time";
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  
  isEnabled: boolean;
  settings: Record<string, unknown>;
  
  installedAt: Date;
  installedBy: string | null;
  enabledAt: Date | null;
}

export interface SiteModuleInstallation {
  id: string;
  siteId: string;
  moduleId: string;
  clientInstallationId: string | null;
  agencySubscriptionId: string | null;
  
  isEnabled: boolean;
  settings: Record<string, unknown>;
  
  installedAt: Date;
  installedBy: string | null;
  enabledAt: Date | null;
}

// =============================================================
// EXTENDED TYPES (with joined data)
// =============================================================

export interface ModuleWithInstallation extends Module {
  installation?: ModuleInstallation;
  subscription?: AgencyModuleSubscription;
}

export interface InstalledModuleDetail {
  module: Module;
  installation: ModuleInstallation;
  subscription?: AgencyModuleSubscription;
  
  // Computed
  canConfigure: boolean;
  canUninstall: boolean;
  hasUpdates: boolean;
  retailPrice: number;
  wholesalePrice: number;
  profit: number;
}

// =============================================================
// HELPER TYPES FOR FORMS AND UI
// =============================================================

export type InstallationStatus = 
  | "not_installed"
  | "installed"
  | "enabled"
  | "disabled"
  | "needs_subscription"
  | "subscription_expired";

export interface ModuleInstallationContext {
  moduleId: string;
  installLevel: ModuleInstallLevel;
  agencyId: string;
  clientId?: string;
  siteId?: string;
  
  // Current status
  status: InstallationStatus;
  subscription?: AgencyModuleSubscription;
  installation?: ModuleInstallation;
  
  // Pricing
  wholesalePrice: number;
  retailPrice: number;
  isFree: boolean;
  
  // Permissions
  canInstall: boolean;
  canUninstall: boolean;
  canConfigure: boolean;
  canSetMarkup: boolean;
}

// =============================================================
// DATABASE ROW TYPES (for Supabase)
// =============================================================

export interface ModuleRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  icon: string;
  banner_image: string | null;
  category: string;
  tags: string[];
  install_level: string;
  current_version: string;
  min_platform_version: string | null;
  pricing_type: string;
  wholesale_price_monthly: number;
  wholesale_price_yearly: number;
  wholesale_price_one_time: number;
  suggested_retail_monthly: number | null;
  suggested_retail_yearly: number | null;
  lemon_product_id: string | null;
  lemon_variant_monthly_id: string | null;
  lemon_variant_yearly_id: string | null;
  lemon_variant_one_time_id: string | null;
  stripe_product_id: string | null;
  stripe_price_monthly_id: string | null;
  stripe_price_yearly_id: string | null;
  required_permissions: string[];
  provided_hooks: string[];
  package_url: string | null;
  package_hash: string | null;
  manifest: Record<string, unknown>;
  settings_schema: Record<string, unknown>;
  default_settings: Record<string, unknown>;
  author_name: string;
  author_verified: boolean;
  screenshots: string[];
  features: string[];
  requirements: string[];
  changelog: unknown[];
  documentation_url: string | null;
  support_url: string | null;
  install_count: number;
  rating_average: number;
  rating_count: number;
  status: string;
  is_featured: boolean;
  is_premium: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface AgencyModuleSubscriptionRow {
  id: string;
  agency_id: string;
  module_id: string;
  status: string;
  billing_cycle: string;
  lemon_subscription_id: string | null;
  lemon_order_id: string | null;
  lemon_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_subscription_item_id: string | null;
  markup_type: string;
  markup_percentage: number;
  markup_fixed_amount: number;
  custom_price_monthly: number | null;
  custom_price_yearly: number | null;
  retail_price_monthly_cached: number | null;
  retail_price_yearly_cached: number | null;
  max_installations: number | null;
  current_installations: number;
  created_at: string;
  updated_at: string;
}

// =============================================================
// CONVERSION HELPERS
// =============================================================

export function moduleRowToModule(row: ModuleRow): Module {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    longDescription: row.long_description,
    icon: row.icon,
    bannerImage: row.banner_image,
    category: row.category,
    tags: row.tags || [],
    installLevel: row.install_level as ModuleInstallLevel,
    currentVersion: row.current_version,
    minPlatformVersion: row.min_platform_version,
    pricingType: row.pricing_type as Module["pricingType"],
    wholesalePriceMonthly: row.wholesale_price_monthly || 0,
    wholesalePriceYearly: row.wholesale_price_yearly || 0,
    wholesalePriceOneTime: row.wholesale_price_one_time || 0,
    suggestedRetailMonthly: row.suggested_retail_monthly,
    suggestedRetailYearly: row.suggested_retail_yearly,
    // Paddle
    paddleProductId: row.lemon_product_id,
    paddlePriceMonthlyId: row.lemon_variant_monthly_id,
    paddlePriceYearlyId: row.lemon_variant_yearly_id,
    paddlePriceOneTimeId: row.lemon_variant_one_time_id,
    packageUrl: row.package_url,
    packageHash: row.package_hash,
    manifest: row.manifest as unknown as ModuleManifest,
    settingsSchema: row.settings_schema || {},
    defaultSettings: row.default_settings || {},
    authorName: row.author_name,
    authorVerified: row.author_verified,
    screenshots: row.screenshots || [],
    features: row.features || [],
    requirements: row.requirements || [],
    changelog: (row.changelog || []) as ChangelogEntry[],
    documentationUrl: row.documentation_url,
    supportUrl: row.support_url,
    installCount: row.install_count || 0,
    ratingAverage: row.rating_average || 0,
    ratingCount: row.rating_count || 0,
    status: row.status as Module["status"],
    isFeatured: row.is_featured || false,
    isPremium: row.is_premium || false,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : null,
  };
}

export function subscriptionRowToSubscription(
  row: AgencyModuleSubscriptionRow
): AgencyModuleSubscription {
  return {
    id: row.id,
    agencyId: row.agency_id,
    moduleId: row.module_id,
    status: row.status as AgencyModuleSubscription["status"],
    billingCycle: row.billing_cycle as AgencyModuleSubscription["billingCycle"],
    paddleSubscriptionId: row.lemon_subscription_id,
    paddleTransactionId: row.lemon_order_id,
    paddleCustomerId: row.lemon_customer_id,
    currentPeriodStart: row.current_period_start
      ? new Date(row.current_period_start)
      : null,
    currentPeriodEnd: row.current_period_end
      ? new Date(row.current_period_end)
      : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    legacySubscriptionId: row.stripe_subscription_id,
    legacySubscriptionItemId: row.stripe_subscription_item_id,
    markupType: row.markup_type as AgencyModuleSubscription["markupType"],
    markupPercentage: row.markup_percentage,
    markupFixedAmount: row.markup_fixed_amount,
    customPriceMonthly: row.custom_price_monthly,
    customPriceYearly: row.custom_price_yearly,
    retailPriceMonthlyCache: row.retail_price_monthly_cached,
    retailPriceYearlyCache: row.retail_price_yearly_cached,
    maxInstallations: row.max_installations,
    currentInstallations: row.current_installations,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Re-export for convenience
export type { ModuleInstallLevel } from "./module-manifest";
