import type { SubscriptionPlan } from "@/types/payments";

// These IDs come from your LemonSqueezy dashboard after creating products
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out DRAMAC",
    price_monthly: 0,
    price_yearly: 0,
    currency: "USD",
    variant_id_monthly: "", // No checkout needed for free
    variant_id_yearly: "",
    features: [
      "1 website",
      "1 client",
      "500MB storage",
      "Basic templates",
      "Community support",
    ],
    limits: {
      sites: 1,
      clients: 1,
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
    description: "For small agencies getting started",
    price_monthly: 29,
    price_yearly: 290, // ~2 months free
    currency: "USD",
    variant_id_monthly: process.env.NEXT_PUBLIC_LS_STARTER_MONTHLY_VARIANT_ID || "",
    variant_id_yearly: process.env.NEXT_PUBLIC_LS_STARTER_YEARLY_VARIANT_ID || "",
    features: [
      "5 websites",
      "10 clients",
      "5GB storage",
      "All templates",
      "Custom domains",
      "Email support",
      "50 AI generations/month",
    ],
    limits: {
      sites: 5,
      clients: 10,
      storage_gb: 5,
      team_members: 3,
      custom_domains: true,
      ai_generations: 50,
      white_label: false,
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing agencies",
    price_monthly: 79,
    price_yearly: 790,
    currency: "USD",
    variant_id_monthly: process.env.NEXT_PUBLIC_LS_PRO_MONTHLY_VARIANT_ID || "",
    variant_id_yearly: process.env.NEXT_PUBLIC_LS_PRO_YEARLY_VARIANT_ID || "",
    popular: true,
    features: [
      "20 websites",
      "50 clients",
      "25GB storage",
      "All templates & modules",
      "Priority support",
      "200 AI generations/month",
      "White-label option",
    ],
    limits: {
      sites: 20,
      clients: 50,
      storage_gb: 25,
      team_members: 10,
      custom_domains: true,
      ai_generations: 200,
      white_label: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large agencies and teams",
    price_monthly: 199,
    price_yearly: 1990,
    currency: "USD",
    variant_id_monthly: process.env.NEXT_PUBLIC_LS_ENTERPRISE_MONTHLY_VARIANT_ID || "",
    variant_id_yearly: process.env.NEXT_PUBLIC_LS_ENTERPRISE_YEARLY_VARIANT_ID || "",
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
