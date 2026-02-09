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

import { Paddle, Environment } from '@paddle/paddle-node-sdk';

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// Environment Validation
// ============================================================================

if (!process.env.PADDLE_API_KEY) {
  console.warn('[Paddle] PADDLE_API_KEY not set - billing features will be disabled');
}

// Determine environment from either variable (support both naming conventions)
const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || process.env.PADDLE_ENVIRONMENT || 'sandbox';

// ============================================================================
// Paddle Client
// ============================================================================

/**
 * Create and export the Paddle client instance
 * Uses sandbox environment when PADDLE_ENVIRONMENT is 'sandbox'
 */
export const paddle = process.env.PADDLE_API_KEY
  ? new Paddle(process.env.PADDLE_API_KEY, {
      environment: paddleEnvironment === 'sandbox'
        ? Environment.sandbox
        : Environment.production
    })
  : null;

/**
 * Check if Paddle is configured
 */
export const isPaddleConfigured = !!process.env.PADDLE_API_KEY;

/**
 * Check if using sandbox environment
 */
export const isPaddleSandbox = paddleEnvironment === 'sandbox';

// ============================================================================
// Product & Price IDs
// ============================================================================

/**
 * Paddle Product and Price IDs
 * These are configured in the Paddle dashboard and should match .env values
 */
export const PADDLE_IDS = {
  products: {
    starter: process.env.PADDLE_PRODUCT_STARTER || '',
    pro: process.env.PADDLE_PRODUCT_PRO || '',
  },
  prices: {
    starter_monthly: process.env.PADDLE_PRICE_STARTER_MONTHLY || '',
    starter_yearly: process.env.PADDLE_PRICE_STARTER_YEARLY || '',
    pro_monthly: process.env.PADDLE_PRICE_PRO_MONTHLY || '',
    pro_yearly: process.env.PADDLE_PRICE_PRO_YEARLY || '',
    // Overage prices for metered billing
    automation_overage: process.env.PADDLE_PRICE_AUTOMATION_OVERAGE || '',
    ai_overage: process.env.PADDLE_PRICE_AI_OVERAGE || '',
    api_overage: process.env.PADDLE_PRICE_API_OVERAGE || '',
  }
} as const;

// ============================================================================
// Plan Mappings
// ============================================================================

export type PlanType = 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanConfig {
  priceId: string;
  productId: string;
  name: string;
  amount: number; // in cents
  interval: 'month' | 'year';
  includedUsage: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
  limits: {
    modules: number;
    sites: number;
    teamMembers: number;
  };
  features: string[];
}

/**
 * Plan configurations with included usage and limits
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter_monthly: {
    priceId: PADDLE_IDS.prices.starter_monthly,
    productId: PADDLE_IDS.products.starter,
    name: 'Starter Monthly',
    amount: 2900, // $29.00
    interval: 'month',
    includedUsage: {
      automationRuns: 1000,
      aiActions: 500,
      apiCalls: 10000,
    },
    limits: {
      modules: 3,
      sites: 1,
      teamMembers: 3,
    },
    features: [
      '3 modules',
      '1 site',
      '3 team members',
      'Basic support',
      '1,000 automation runs/mo',
      '500 AI actions/mo',
    ],
  },
  starter_yearly: {
    priceId: PADDLE_IDS.prices.starter_yearly,
    productId: PADDLE_IDS.products.starter,
    name: 'Starter Yearly',
    amount: 29000, // $290.00
    interval: 'year',
    includedUsage: {
      automationRuns: 12000,
      aiActions: 6000,
      apiCalls: 120000,
    },
    limits: {
      modules: 3,
      sites: 1,
      teamMembers: 3,
    },
    features: [
      '3 modules',
      '1 site',
      '3 team members',
      'Basic support',
      '12,000 automation runs/yr',
      '6,000 AI actions/yr',
      'Save 17%',
    ],
  },
  pro_monthly: {
    priceId: PADDLE_IDS.prices.pro_monthly,
    productId: PADDLE_IDS.products.pro,
    name: 'Pro Monthly',
    amount: 9900, // $99.00
    interval: 'month',
    includedUsage: {
      automationRuns: 10000,
      aiActions: 5000,
      apiCalls: 100000,
    },
    limits: {
      modules: 10,
      sites: 5,
      teamMembers: 10,
    },
    features: [
      '10 modules',
      '5 sites',
      '10 team members',
      'Priority support',
      'Custom domain',
      'White-label',
      '10,000 automation runs/mo',
      '5,000 AI actions/mo',
      '50% overage discount',
    ],
  },
  pro_yearly: {
    priceId: PADDLE_IDS.prices.pro_yearly,
    productId: PADDLE_IDS.products.pro,
    name: 'Pro Yearly',
    amount: 99000, // $990.00
    interval: 'year',
    includedUsage: {
      automationRuns: 120000,
      aiActions: 60000,
      apiCalls: 1200000,
    },
    limits: {
      modules: 10,
      sites: 5,
      teamMembers: 10,
    },
    features: [
      '10 modules',
      '5 sites',
      '10 team members',
      'Priority support',
      'Custom domain',
      'White-label',
      '120,000 automation runs/yr',
      '60,000 AI actions/yr',
      '50% overage discount',
      'Save 17%',
    ],
  },
};

/**
 * Overage rates per plan type (in dollars)
 */
export const OVERAGE_RATES = {
  starter: {
    automationRuns: 0.001,  // $0.001 per run
    aiActions: 0.005,       // $0.005 per action
    apiCalls: 0.0001,       // $0.0001 per call
  },
  pro: {
    automationRuns: 0.0005, // $0.0005 per run (50% discount)
    aiActions: 0.0025,      // $0.0025 per action (50% discount)
    apiCalls: 0.00005,      // $0.00005 per call (50% discount)
  },
  enterprise: {
    automationRuns: 0,      // Unlimited
    aiActions: 0,           // Unlimited
    apiCalls: 0,            // Unlimited
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
  billingCycle: BillingCycle
): PlanConfig | undefined {
  const key = `${planType}_${billingCycle}`;
  return PLAN_CONFIGS[key];
}

/**
 * Get price ID for a plan
 */
export function getPriceId(
  planType: PlanType,
  billingCycle: BillingCycle
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
      const [planType, billingCycle] = key.split('_') as [PlanType, BillingCycle];
      return { planType, billingCycle };
    }
  }
  return null;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Calculate overage cost
 */
export function calculateOverageCost(
  planType: PlanType,
  overageAutomationRuns: number,
  overageAiActions: number,
  overageApiCalls: number
): number {
  const rates = OVERAGE_RATES[planType];
  return (
    (overageAutomationRuns * rates.automationRuns) +
    (overageAiActions * rates.aiActions) +
    (overageApiCalls * rates.apiCalls)
  );
}
