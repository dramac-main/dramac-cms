import Stripe from "stripe";

// Lazy initialization of Stripe client
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeClient;
}

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Price IDs from Stripe Dashboard
export const PRICE_IDS = {
  // Per-seat pricing
  seat_monthly: process.env.STRIPE_PRICE_SEAT_MONTHLY!,
  seat_yearly: process.env.STRIPE_PRICE_SEAT_YEARLY!,
  // Modules use dynamic pricing from database
} as const;

// Client seats billing model
export const BILLING_CONFIG = {
  freeSeats: 0, // No free seats - first client triggers billing
  pricePerSeatMonthly: 19, // $19/seat/month
  pricePerSeatYearly: 190, // $190/seat/year (save ~17%)
  trialDays: 14, // 14-day free trial
};
