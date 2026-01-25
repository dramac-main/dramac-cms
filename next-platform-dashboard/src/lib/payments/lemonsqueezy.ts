/**
 * DEPRECATED: LemonSqueezy Payment Integration
 * 
 * ⚠️ WARNING: LemonSqueezy does NOT support Zambia payouts.
 * 
 * This file will be replaced during Phase EM-59 with Paddle integration.
 * Do NOT use for new implementations.
 * 
 * NEW IMPLEMENTATION: @/lib/paddle/client.ts (to be created in EM-59)
 * 
 * Paddle payout route: Paddle → Payoneer/Wise → Zambia Bank
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 * @deprecated Will be replaced with Paddle in EM-59
 */
import {
  lemonSqueezySetup,
  createCheckout,
  getCustomer,
  listSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  listProducts,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error("LemonSqueezy Error:", error),
});

export interface CreateCheckoutOptions {
  variantId: string;
  email?: string;
  name?: string;
  userId: string;
  agencyId: string;
  redirectUrl?: string;
  discountCode?: string;
}

export async function createLemonSqueezyCheckout(options: CreateCheckoutOptions) {
  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    options.variantId,
    {
      checkoutData: {
        email: options.email,
        name: options.name,
        custom: {
          user_id: options.userId,
          agency_id: options.agencyId,
        },
        discountCode: options.discountCode,
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
        subscriptionPreview: true,
      },
      productOptions: {
        enabledVariants: [parseInt(options.variantId)],
        redirectUrl: options.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        receiptButtonText: "Go to Dashboard",
        receiptLinkUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        receiptThankYouNote: "Thank you for subscribing to DRAMAC CMS!",
      },
    }
  );

  return checkout;
}

export async function getLemonSqueezyCustomer(customerId: string) {
  const customer = await getCustomer(customerId);
  return customer.data;
}

export async function getLemonSqueezySubscription(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);
  return subscription.data;
}

export async function getLemonSqueezySubscriptions(userEmail: string) {
  const subscriptions = await listSubscriptions({
    filter: { userEmail },
  });
  return subscriptions.data;
}

export async function cancelLemonSqueezySubscription(subscriptionId: string) {
  const result = await cancelSubscription(subscriptionId);
  return result.data;
}

export async function pauseLemonSqueezySubscription(subscriptionId: string) {
  const result = await updateSubscription(subscriptionId, {
    pause: {
      mode: "void", // or "free" to give free access while paused
    },
  });
  return result.data;
}

export async function resumeLemonSqueezySubscription(subscriptionId: string) {
  const result = await updateSubscription(subscriptionId, {
    pause: null,
  });
  return result.data;
}

export async function updateSubscriptionPlan(
  subscriptionId: string,
  variantId: string
) {
  const result = await updateSubscription(subscriptionId, {
    variantId: parseInt(variantId),
  });
  return result.data;
}

export async function getProducts() {
  const products = await listProducts({
    filter: { storeId: parseInt(process.env.LEMONSQUEEZY_STORE_ID!) },
  });
  return products.data;
}

export async function getVariants(productId: string) {
  const variants = await listVariants({
    filter: { productId: parseInt(productId) },
  });
  return variants.data;
}

// Export for type safety
export type LemonSqueezySubscription = Awaited<
  ReturnType<typeof getLemonSqueezySubscription>
>;
