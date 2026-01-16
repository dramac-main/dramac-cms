/**
 * Module Pricing Types
 * 
 * Defines pricing models, markup calculations, and billing types
 * for the wholesale/retail module marketplace.
 */

// =============================================================
// PRICING TYPES
// =============================================================

export type PricingType = "free" | "one_time" | "monthly" | "yearly";
export type MarkupType = "percentage" | "fixed" | "custom" | "passthrough";
export type BillingCycle = "monthly" | "yearly" | "one_time";
export type BillingStatus = "active" | "canceled" | "past_due" | "paused" | "trial";

// =============================================================
// PRICING STRUCTURES
// =============================================================

export interface WholesalePricing {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  
  // Pricing type
  pricingType: PricingType;
  
  // Wholesale prices (in cents)
  wholesalePriceMonthly: number;
  wholesalePriceYearly: number;
  wholesalePriceOneTime: number;
  
  // Suggested retail prices
  suggestedRetailMonthly: number;
  suggestedRetailYearly: number;
  
  // LemonSqueezy integration
  lemonProductId: string | null;
  lemonVariantMonthlyId: string | null;
  lemonVariantYearlyId: string | null;
  lemonVariantOneTimeId: string | null;
}

export interface AgencyModulePricing {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  
  // Agency's markup configuration
  markupType: MarkupType;
  markupPercentage: number;
  markupFixedAmount: number;
  customPriceMonthly: number | null;
  customPriceYearly: number | null;
  
  // Calculated prices (in cents)
  wholesalePriceMonthly: number;
  wholesalePriceYearly: number;
  retailPriceMonthly: number;
  retailPriceYearly: number;
  
  // Profit (in cents)
  profitMonthly: number;
  profitYearly: number;
  profitMarginMonthly: number; // Percentage
  profitMarginYearly: number; // Percentage
  
  // Subscription status
  isSubscribed: boolean;
  subscriptionStatus: BillingStatus | null;
  lemonSubscriptionId: string | null;
  
  // Usage
  currentInstallations: number;
  maxInstallations: number | null;
}

export interface ClientModulePricing {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  
  // What the client sees
  retailPriceCents: number;
  billingCycle: BillingCycle;
  
  // Breakdown (hidden from client, for agency reference)
  wholesalePriceCents: number;
  agencyProfitCents: number;
  
  // Availability
  isAvailable: boolean;
  unavailableReason?: string;
}

// =============================================================
// MARKUP CONFIGURATION
// =============================================================

export interface MarkupConfig {
  markupType: MarkupType;
  markupPercentage?: number;
  markupFixedAmount?: number;
  customPriceMonthly?: number;
  customPriceYearly?: number;
}

export const DEFAULT_MARKUP_CONFIG: MarkupConfig = {
  markupType: "percentage",
  markupPercentage: 100, // 100% markup = 2x wholesale
  markupFixedAmount: 0,
};

// =============================================================
// PRICING CALCULATIONS
// =============================================================

/**
 * Calculate retail price based on markup configuration
 */
export function calculateRetailPrice(
  wholesaleCents: number,
  config: MarkupConfig
): number {
  const {
    markupType,
    markupPercentage = 100,
    markupFixedAmount = 0,
    customPriceMonthly,
  } = config;

  // Custom price overrides everything
  if (markupType === "custom" && customPriceMonthly != null) {
    return customPriceMonthly;
  }

  // Passthrough = no markup
  if (markupType === "passthrough") {
    return wholesaleCents;
  }

  // Fixed = wholesale + fixed amount
  if (markupType === "fixed") {
    return wholesaleCents + markupFixedAmount;
  }

  // Percentage (default) = wholesale + (wholesale * percentage / 100)
  return wholesaleCents + Math.round((wholesaleCents * markupPercentage) / 100);
}

/**
 * Calculate profit from a sale
 */
export function calculateProfit(
  retailCents: number,
  wholesaleCents: number
): number {
  return retailCents - wholesaleCents;
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(
  retailCents: number,
  wholesaleCents: number
): number {
  if (retailCents === 0) return 0;
  const profit = retailCents - wholesaleCents;
  return Math.round((profit / retailCents) * 100);
}

/**
 * Calculate markup percentage from prices
 */
export function calculateMarkupPercentage(
  retailCents: number,
  wholesaleCents: number
): number {
  if (wholesaleCents === 0) return 0;
  const markup = retailCents - wholesaleCents;
  return Math.round((markup / wholesaleCents) * 100);
}

// =============================================================
// PRICE FORMATTING
// =============================================================

/**
 * Format price in cents to display string
 */
export function formatPrice(
  cents: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format price with billing cycle
 */
export function formatPriceWithCycle(
  cents: number,
  cycle: BillingCycle,
  currency: string = "USD"
): string {
  const price = formatPrice(cents, currency);
  
  switch (cycle) {
    case "monthly":
      return `${price}/mo`;
    case "yearly":
      return `${price}/yr`;
    case "one_time":
      return price;
    default:
      return price;
  }
}

/**
 * Get monthly equivalent for comparison
 */
export function getMonthlyEquivalent(
  cents: number,
  cycle: BillingCycle
): number {
  switch (cycle) {
    case "yearly":
      return Math.round(cents / 12);
    case "one_time":
      return 0; // Can't really compare
    default:
      return cents;
  }
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(
  monthlyPriceCents: number,
  yearlyPriceCents: number
): {
  savingsAmount: number;
  savingsPercentage: number;
} {
  const yearlyIfMonthly = monthlyPriceCents * 12;
  const savingsAmount = yearlyIfMonthly - yearlyPriceCents;
  const savingsPercentage = yearlyIfMonthly > 0
    ? Math.round((savingsAmount / yearlyIfMonthly) * 100)
    : 0;
  
  return { savingsAmount, savingsPercentage };
}

// =============================================================
// PRICING DISPLAY HELPERS
// =============================================================

export interface PriceDisplay {
  original: string;
  current: string;
  savings?: string;
  savingsPercentage?: number;
  billingCycle: string;
  perMonth?: string;
}

/**
 * Get full price display info
 */
export function getPriceDisplay(
  pricing: AgencyModulePricing,
  cycle: BillingCycle = "monthly"
): PriceDisplay {
  const isYearly = cycle === "yearly";
  const retailPrice = isYearly
    ? pricing.retailPriceYearly
    : pricing.retailPriceMonthly;
  const wholesalePrice = isYearly
    ? pricing.wholesalePriceYearly
    : pricing.wholesalePriceMonthly;

  const display: PriceDisplay = {
    original: formatPrice(wholesalePrice),
    current: formatPrice(retailPrice),
    billingCycle: isYearly ? "per year" : "per month",
  };

  if (isYearly) {
    const { savingsAmount, savingsPercentage } = calculateYearlySavings(
      pricing.retailPriceMonthly,
      pricing.retailPriceYearly
    );
    
    if (savingsAmount > 0) {
      display.savings = formatPrice(savingsAmount);
      display.savingsPercentage = savingsPercentage;
    }
    
    display.perMonth = formatPrice(Math.round(retailPrice / 12));
  }

  return display;
}

// =============================================================
// MARKUP TYPE HELPERS
// =============================================================

export const MARKUP_TYPE_INFO: Record<
  MarkupType,
  { label: string; description: string }
> = {
  percentage: {
    label: "Percentage Markup",
    description: "Add a percentage on top of wholesale price",
  },
  fixed: {
    label: "Fixed Amount",
    description: "Add a fixed dollar amount to wholesale price",
  },
  custom: {
    label: "Custom Price",
    description: "Set your own price regardless of wholesale",
  },
  passthrough: {
    label: "Pass Through",
    description: "Charge exactly the wholesale price (no markup)",
  },
};

/**
 * Get suggested markup percentages
 */
export function getSuggestedMarkups(): { percentage: number; label: string }[] {
  return [
    { percentage: 50, label: "50% (1.5x wholesale)" },
    { percentage: 100, label: "100% (2x wholesale)" },
    { percentage: 150, label: "150% (2.5x wholesale)" },
    { percentage: 200, label: "200% (3x wholesale)" },
  ];
}

/**
 * Validate markup configuration
 */
export function validateMarkupConfig(config: MarkupConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.markupType === "percentage") {
    if (config.markupPercentage == null || config.markupPercentage < 0) {
      errors.push("Markup percentage must be 0 or greater");
    }
    if (config.markupPercentage && config.markupPercentage > 1000) {
      errors.push("Markup percentage seems unusually high (>1000%)");
    }
  }

  if (config.markupType === "fixed") {
    if (config.markupFixedAmount == null || config.markupFixedAmount < 0) {
      errors.push("Fixed markup amount must be 0 or greater");
    }
  }

  if (config.markupType === "custom") {
    if (config.customPriceMonthly == null && config.customPriceYearly == null) {
      errors.push("Custom pricing requires at least one price to be set");
    }
    if (config.customPriceMonthly != null && config.customPriceMonthly < 0) {
      errors.push("Custom monthly price must be 0 or greater");
    }
    if (config.customPriceYearly != null && config.customPriceYearly < 0) {
      errors.push("Custom yearly price must be 0 or greater");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
