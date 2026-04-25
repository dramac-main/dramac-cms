/**
 * Paddle Billing Client Setup
 *
 * Phase EM-59: Paddle Billing Integration
 *
 * Paddle is the primary billing provider for DRAMAC CMS.
 * Supports Zambia payouts via Payoneer/Wise.
 *
 * Payout route: Paddle → Payoneer/Wise → Zambia Bank
 *
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

// Note: The Paddle Node SDK should be installed via: pnpm add @paddle/paddle-node-sdk
// For frontend: pnpm add @paddle/paddle-js

import { Paddle, Environment } from "@paddle/paddle-node-sdk";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from "@/lib/locale-config";
// ============================================================================
// Environment Validation
// ============================================================================

if (
  typeof window === "undefined" &&
  !process.env.PADDLE_API_KEY &&
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  console.warn(
    "[Paddle] PADDLE_API_KEY not set - billing features will be disabled",
  );
}

// Determine environment from either variable (support both naming conventions)
const paddleEnvironment =
  process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ||
  process.env.PADDLE_ENVIRONMENT ||
  "sandbox";

// ============================================================================
// Paddle Client
// ============================================================================

/**
 * Create and export the Paddle client instance
 * Uses sandbox environment when PADDLE_ENVIRONMENT is 'sandbox'
 */
export const paddle = process.env.PADDLE_API_KEY
  ? new Paddle(process.env.PADDLE_API_KEY, {
      environment:
        paddleEnvironment === "sandbox"
          ? Environment.sandbox
          : Environment.production,
    })
  : null;

/**
 * Check if Paddle is configured
 */
export const isPaddleConfigured = !!process.env.PADDLE_API_KEY;

/**
 * Check if using sandbox environment
 */
export const isPaddleSandbox = paddleEnvironment === "sandbox";

// ============================================================================
// Product & Price IDs
// ============================================================================

/**
 * Paddle Product and Price IDs
 * These are configured in the Paddle dashboard and should match .env values
 *
 * Falls back to NEXT_PUBLIC_* variants when server-side PADDLE_PRICE_* are not set
 * to ensure webhook plan detection uses the same price IDs as client-side checkout
 */
export const PADDLE_IDS = {
  products: {
    starter: (process.env.PADDLE_PRODUCT_STARTER || "").trim(),
    growth: (process.env.PADDLE_PRODUCT_GROWTH || "").trim(),
    agency: (process.env.PADDLE_PRODUCT_AGENCY || "").trim(),
  },
  prices: {
    starter_monthly: (
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || ""
    ).trim(),
    starter_yearly: (
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY || ""
    ).trim(),
    growth_monthly: (
      process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH_MONTHLY || ""
    ).trim(),
    growth_yearly: (
      process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH_YEARLY || ""
    ).trim(),
    agency_monthly: (
      process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_MONTHLY || ""
    ).trim(),
    agency_yearly: (
      process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_YEARLY || ""
    ).trim(),
    // Overage prices for metered billing (server-side only)
    automation_overage: (
      process.env.PADDLE_PRICE_AUTOMATION_OVERAGE || ""
    ).trim(),
    ai_overage: (process.env.PADDLE_PRICE_AI_OVERAGE || "").trim(),
    email_overage: (process.env.PADDLE_PRICE_EMAIL_OVERAGE || "").trim(),
    storage_overage: (process.env.PADDLE_PRICE_STORAGE_OVERAGE || "").trim(),
  },
} as const;

// ============================================================================
// Plan Mappings
// ============================================================================

export type PlanType = "starter" | "growth" | "agency";
export type BillingCycle = "monthly" | "yearly";

export interface PlanConfig {
  priceId: string;
  productId: string;
  name: string;
  amount: number; // in cents
  interval: "month" | "year";
  includedUsage: {
    automationRuns: number;
    aiActions: number;
    emailSends: number;
    fileStorageMb: number; // in MB
  };
  limits: {
    sites: number;
    teamMembers: number;
  };
  features: string[];
}

/**
 * Plan configurations with included usage and limits (v5 pricing)
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter_monthly: {
    priceId: PADDLE_IDS.prices.starter_monthly,
    productId: PADDLE_IDS.products.starter,
    name: "Starter",
    amount: 2900, // $29.00
    interval: "month",
    includedUsage: {
      automationRuns: 2000,
      aiActions: 1000,
      emailSends: 2000,
      fileStorageMb: 5120, // 5 GB
    },
    limits: {
      sites: 5,
      teamMembers: 3,
    },
    features: [
      "All 7 modules included",
      "5 websites",
      "3 team members",
      "1,000 AI actions/mo",
      "2,000 email sends/mo",
      "2,000 automation runs/mo",
      "5 GB file storage",
      "Custom domains",
      "Ask Chiko assistant",
      "Community support",
    ],
  },
  starter_yearly: {
    priceId: PADDLE_IDS.prices.starter_yearly,
    productId: PADDLE_IDS.products.starter,
    name: "Starter",
    amount: 29000, // $290.00/yr
    interval: "year",
    includedUsage: {
      automationRuns: 24000,
      aiActions: 12000,
      emailSends: 24000,
      fileStorageMb: 5120,
    },
    limits: {
      sites: 5,
      teamMembers: 3,
    },
    features: [
      "All 7 modules included",
      "5 websites",
      "3 team members",
      "12,000 AI actions/yr",
      "24,000 email sends/yr",
      "24,000 automation runs/yr",
      "5 GB file storage",
      "Custom domains",
      "Ask Chiko assistant",
      "Community support",
      "Save 2 months free",
    ],
  },
  growth_monthly: {
    priceId: PADDLE_IDS.prices.growth_monthly,
    productId: PADDLE_IDS.products.growth,
    name: "Growth",
    amount: 7900, // $79.00
    interval: "month",
    includedUsage: {
      automationRuns: 15000,
      aiActions: 3000,
      emailSends: 10000,
      fileStorageMb: 20480, // 20 GB
    },
    limits: {
      sites: 15,
      teamMembers: 8,
    },
    features: [
      "All 7 modules included",
      "15 websites",
      "8 team members",
      "3,000 AI actions/mo",
      "10,000 email sends/mo",
      "15,000 automation runs/mo",
      "20 GB file storage",
      "Custom domains",
      "Ask Chiko assistant",
      "14-day free trial",
      "Priority email support",
    ],
  },
  growth_yearly: {
    priceId: PADDLE_IDS.prices.growth_yearly,
    productId: PADDLE_IDS.products.growth,
    name: "Growth",
    amount: 79000, // $790.00/yr
    interval: "year",
    includedUsage: {
      automationRuns: 180000,
      aiActions: 36000,
      emailSends: 120000,
      fileStorageMb: 20480,
    },
    limits: {
      sites: 15,
      teamMembers: 8,
    },
    features: [
      "All 7 modules included",
      "15 websites",
      "8 team members",
      "36,000 AI actions/yr",
      "120,000 email sends/yr",
      "180,000 automation runs/yr",
      "20 GB file storage",
      "Custom domains",
      "Ask Chiko assistant",
      "14-day free trial",
      "Priority email support",
      "Save 2 months free",
    ],
  },
  agency_monthly: {
    priceId: PADDLE_IDS.prices.agency_monthly,
    productId: PADDLE_IDS.products.agency,
    name: "Agency",
    amount: 14900, // $149.00
    interval: "month",
    includedUsage: {
      automationRuns: 75000,
      aiActions: 15000,
      emailSends: 40000,
      fileStorageMb: 76800, // 75 GB
    },
    limits: {
      sites: 30,
      teamMembers: 20,
    },
    features: [
      "All 7 modules included",
      "30 websites",
      "20 team members",
      "15,000 AI actions/mo",
      "40,000 email sends/mo",
      "75,000 automation runs/mo",
      "75 GB file storage",
      "Custom domains",
      "Ask Chiko assistant",
      "Full white-label",
      "Custom dashboard domain",
      "Priority + chat support",
    ],
  },
  agency_yearly: {
    priceId: PADDLE_IDS.prices.agency_yearly,
    productId: PADDLE_IDS.products.agency,
    name: "Agency",
    amount: 149000, // $1,490.00/yr
    interval: "year",
    includedUsage: {
      automationRuns: 900000,
      aiActions: 180000,
      emailSends: 480000,
      fileStorageMb: 76800,
    },
    limits: {
      sites: 30,
      teamMembers: 20,
    },
    features: [
      "All 7 modules included",
      "30 websites",
      "20 team members",
      "180,000 AI actions/yr",
      "480,000 email sends/yr",
      "900,000 automation runs/yr",
      "75 GB file storage",
      "Custom domains",
      "Ask Chiko assistant",
      "Full white-label",
      "Custom dashboard domain",
      "Priority + chat support",
      "Save 2 months free",
    ],
  },
};

/**
 * Overage rates per plan type (in dollars per unit)
 */
export const OVERAGE_RATES: Record<
  PlanType,
  {
    automationRuns: number;
    aiActions: number;
    emailSends: number;
    fileStorageMb: number;
  }
> = {
  starter: {
    automationRuns: 0.002, // $2 per 1K runs
    aiActions: 0.01, // $10 per 1K actions
    emailSends: 0.002, // $2 per 1K sends
    fileStorageMb: 0.0005, // $0.50 per GB ($0.0005 per MB)
  },
  growth: {
    automationRuns: 0.002,
    aiActions: 0.01,
    emailSends: 0.002,
    fileStorageMb: 0.0005,
  },
  agency: {
    automationRuns: 0.001, // 50% discount for top tier
    aiActions: 0.008,
    emailSends: 0.0015,
    fileStorageMb: 0.0004,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get plan config by plan type and billing cycle
 */
export function getPlanConfig(
  planType: PlanType,
  billingCycle: BillingCycle,
): PlanConfig | undefined {
  const key = `${planType}_${billingCycle}`;
  return PLAN_CONFIGS[key];
}

/**
 * Get price ID for a plan
 */
export function getPriceId(
  planType: PlanType,
  billingCycle: BillingCycle,
): string | undefined {
  const config = getPlanConfig(planType, billingCycle);
  return config?.priceId;
}

/**
 * Determine plan type from a price ID
 */
export function getPlanTypeFromPriceId(priceId: string): {
  planType: PlanType;
  billingCycle: BillingCycle;
} | null {
  for (const [key, config] of Object.entries(PLAN_CONFIGS)) {
    if (config.priceId === priceId) {
      const [planType, billingCycle] = key.split("_") as [
        PlanType,
        BillingCycle,
      ];
      return { planType, billingCycle };
    }
  }
  return null;
}

/**
 * Format price for display
 */
export function formatPrice(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Calculate overage cost for a billing period
 */
export function calculateOverageCost(
  planType: PlanType,
  overageAutomationRuns: number,
  overageAiActions: number,
  overageEmailSends: number,
  overageFileStorageMb: number,
): number {
  const rates = OVERAGE_RATES[planType];
  return (
    overageAutomationRuns * rates.automationRuns +
    overageAiActions * rates.aiActions +
    overageEmailSends * rates.emailSends +
    overageFileStorageMb * rates.fileStorageMb
  );
}

/**
 * Get plan limits by plan type
 */
export function getPlanLimits(planType: PlanType): {
  sites: number;
  teamMembers: number;
  whiteLabel: boolean;
} {
  const monthlyConfig = getPlanConfig(planType, "monthly");
  return {
    sites: monthlyConfig?.limits.sites ?? 0,
    teamMembers: monthlyConfig?.limits.teamMembers ?? 0,
    whiteLabel: planType === "agency",
  };
}

/**
 * Check if white-label is enabled for a plan
 */
export function isWhiteLabelEnabled(planType: PlanType): boolean {
  return planType === "agency";
}

/**
 * Get plans eligible for a free trial
 */
export function getTrialEligiblePlans(): PlanType[] {
  return ["growth"];
}
