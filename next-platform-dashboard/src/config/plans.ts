import type { SubscriptionPlan } from "@/types/payments";

/**
 * Subscription Plans Configuration
 * 
 * Aligned with Paddle billing integration (EM-59).
 * Plan IDs: 'free', 'starter', 'pro', 'enterprise'
 * 
 * Paddle Price IDs come from env vars (NEXT_PUBLIC_PADDLE_PRICE_*).
 * The variant_id fields are kept for backward compatibility but
 * new code should use paddlePriceId fields.
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out DRAMAC",
    price_monthly: 0,
    price_yearly: 0,
    currency: "USD",
    variant_id_monthly: "",
    variant_id_yearly: "",
    features: [
      "1 website",
      "3 clients",
      "500MB storage",
      "Basic templates",
      "Community support",
    ],
    limits: {
      sites: 1,
      clients: 3,
      storage_gb: 0.5,
      team_members: 1,
      custom_domains: false,
      ai_generations: 5,
      white_label: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams getting started",
    price_monthly: 29,
    price_yearly: 290,
    currency: "USD",
    variant_id_monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || "",
    variant_id_yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY || "",
    features: [
      "1 website",
      "10 clients",
      "5GB storage",
      "3 modules included",
      "3 team members",
      "Custom domains",
      "Email support",
      "500 AI actions/month",
    ],
    limits: {
      sites: 1,
      clients: 10,
      storage_gb: 5,
      team_members: 3,
      custom_domains: true,
      ai_generations: 500,
      white_label: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses that need more power",
    price_monthly: 99,
    price_yearly: 990,
    currency: "USD",
    variant_id_monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY || "",
    variant_id_yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY || "",
    popular: true,
    features: [
      "5 websites",
      "50 clients",
      "25GB storage",
      "10 modules included",
      "10 team members",
      "Priority support",
      "5,000 AI actions/month",
      "White-label options",
      "Custom domains",
      "50% overage discount",
    ],
    limits: {
      sites: 5,
      clients: 50,
      storage_gb: 25,
      team_members: 10,
      custom_domains: true,
      ai_generations: 5000,
      white_label: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with custom requirements",
    price_monthly: 0, // Custom pricing
    price_yearly: 0,
    currency: "USD",
    variant_id_monthly: "",
    variant_id_yearly: "",
    features: [
      "Unlimited websites",
      "Unlimited clients",
      "100GB storage",
      "All features included",
      "Dedicated support",
      "Unlimited AI generations",
      "Full white-label",
      "Custom integrations",
    ],
    limits: {
      sites: -1, // unlimited
      clients: -1,
      storage_gb: 100,
      team_members: -1,
      custom_domains: true,
      ai_generations: -1,
      white_label: true,
    },
  },
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}

export function getPlanByVariantId(variantId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(
    (p) => p.variant_id_monthly === variantId || p.variant_id_yearly === variantId
  );
}

export function getPrice(plan: SubscriptionPlan, interval: "monthly" | "yearly"): number {
  return interval === "yearly" ? plan.price_yearly : plan.price_monthly;
}

export function getVariantId(plan: SubscriptionPlan, interval: "monthly" | "yearly"): string {
  return interval === "yearly" ? plan.variant_id_yearly : plan.variant_id_monthly;
}

export function isWithinPlanLimits(
  plan: SubscriptionPlan,
  usage: { sites: number; clients: number; storage_gb: number }
): boolean {
  const limits = plan.limits;
  
  // Check sites (-1 means unlimited)
  if (limits.sites !== -1 && usage.sites > limits.sites) return false;
  
  // Check clients
  if (limits.clients !== -1 && usage.clients > limits.clients) return false;
  
  // Check storage
  if (usage.storage_gb > limits.storage_gb) return false;
  
  return true;
}
