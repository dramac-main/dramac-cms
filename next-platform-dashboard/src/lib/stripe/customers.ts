/**
 * @deprecated Billing has migrated to Paddle. This module is retained for reference only.
 * Active billing logic is in src/lib/paddle/
 * TODO: Remove this file after migration verification period
 */

import { stripe } from "./config";
import { createClient } from "@/lib/supabase/server";

export interface CreateCustomerParams {
  agencyId: string;
  email: string;
  name?: string;
}

/** @deprecated Use Paddle billing instead. See src/lib/paddle/ */
export async function createOrGetCustomer(params: CreateCustomerParams) {
  const { agencyId, email, name } = params;
  const supabase = await createClient();

  // Check if agency already has a Stripe customer
  const { data: agency } = await supabase
    .from("agencies")
    .select("stripe_customer_id")
    .eq("id", agencyId)
    .single();

  if (agency?.stripe_customer_id) {
    // Retrieve and return existing customer
    const customer = await stripe.customers.retrieve(agency.stripe_customer_id);
    return customer;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      agency_id: agencyId,
    },
  });

  // Store in agencies table
  await supabase
    .from("agencies")
    .update({ stripe_customer_id: customer.id })
    .eq("id", agencyId);

  return customer;
}

/** @deprecated Use Paddle billing instead. See src/lib/paddle/ */
export async function getCustomerByAgency(agencyId: string) {
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from("agencies")
    .select("stripe_customer_id")
    .eq("id", agencyId)
    .single();

  if (!agency?.stripe_customer_id) return null;

  return stripe.customers.retrieve(agency.stripe_customer_id);
}

/** @deprecated Use Paddle billing instead. See src/lib/paddle/ */
export async function updateCustomer(
  customerId: string,
  params: { email?: string; name?: string }
) {
  return stripe.customers.update(customerId, params);
}
