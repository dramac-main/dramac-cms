import { stripe } from "./config";
import { createClient } from "@/lib/supabase/server";

export interface CreateCustomerParams {
  agencyId: string;
  email: string;
  name?: string;
}

export async function createOrGetCustomer(params: CreateCustomerParams) {
  const { agencyId, email, name } = params;
  const supabase = await createClient();

  // Check if customer already exists
  const { data: existing } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("agency_id", agencyId)
    .single();

  if (existing?.stripe_customer_id) {
    // Retrieve and return existing customer
    const customer = await stripe.customers.retrieve(existing.stripe_customer_id);
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

  // Store in database
  await supabase.from("billing_customers").insert({
    agency_id: agencyId,
    stripe_customer_id: customer.id,
    email,
    name,
  });

  return customer;
}

export async function getCustomerByAgency(agencyId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("agency_id", agencyId)
    .single();

  if (!data?.stripe_customer_id) return null;

  return stripe.customers.retrieve(data.stripe_customer_id);
}

export async function updateCustomer(
  customerId: string,
  params: { email?: string; name?: string }
) {
  return stripe.customers.update(customerId, params);
}
