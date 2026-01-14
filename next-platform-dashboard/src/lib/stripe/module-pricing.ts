import { stripe } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ModulePricing {
  moduleId: string;
  stripePriceId: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  usageBased?: boolean;
}

// Sync module prices from database to include Stripe info
export async function getModulePricing(moduleId: string): Promise<ModulePricing | null> {
  const supabase = createAdminClient();

  const { data: module } = await supabase
    .from("modules")
    .select("id, price_monthly, price_yearly, stripe_price_monthly, stripe_price_yearly")
    .eq("id", moduleId)
    .single();

  if (!module) return null;

  return {
    moduleId: module.id,
    stripePriceId: module.stripe_price_monthly!,
    monthlyPrice: module.price_monthly,
    yearlyPrice: module.price_yearly ?? undefined,
  };
}

// Create Stripe product and price for a module
export async function createModuleProduct(module: {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
}) {
  // Create product
  const product = await stripe.products.create({
    name: module.name,
    description: module.description,
    metadata: {
      module_id: module.id,
    },
  });

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: module.priceMonthly * 100, // Convert to cents
    currency: "usd",
    recurring: {
      interval: "month",
    },
    metadata: {
      module_id: module.id,
      billing_cycle: "monthly",
    },
  });

  // Create yearly price if provided
  let yearlyPrice = null;
  if (module.priceYearly) {
    yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: module.priceYearly * 100,
      currency: "usd",
      recurring: {
        interval: "year",
      },
      metadata: {
        module_id: module.id,
        billing_cycle: "yearly",
      },
    });
  }

  // Update database with Stripe IDs
  const supabase = createAdminClient();
  await supabase
    .from("modules")
    .update({
      stripe_product_id: product.id,
      stripe_price_monthly: monthlyPrice.id,
      stripe_price_yearly: yearlyPrice?.id,
    })
    .eq("id", module.id);

  return {
    productId: product.id,
    monthlyPriceId: monthlyPrice.id,
    yearlyPriceId: yearlyPrice?.id,
  };
}
