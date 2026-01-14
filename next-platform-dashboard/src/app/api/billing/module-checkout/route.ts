import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import { createOrGetCustomer } from "@/lib/stripe/customers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, moduleId, billingCycle = "monthly" } = body;

    // Get module pricing
    const { data: module } = await supabase
      .from("modules")
      .select("stripe_price_monthly, stripe_price_yearly, name")
      .eq("id", moduleId)
      .single();

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const priceId = billingCycle === "yearly"
      ? module.stripe_price_yearly
      : module.stripe_price_monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Module pricing not configured" },
        { status: 400 }
      );
    }

    // Get or create customer
    const customer = await createOrGetCustomer({
      agencyId,
      email: user.email!,
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          agency_id: agencyId,
          module_id: moduleId,
          type: "module",
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&module=${moduleId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true`,
      metadata: {
        agency_id: agencyId,
        module_id: moduleId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Module checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
