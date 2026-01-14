import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS, BILLING_CONFIG } from "@/lib/stripe/config";
import { createOrGetCustomer } from "@/lib/stripe/customers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, billingCycle = "monthly", seats = 1 } = body;

    // Verify user is owner
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get agency details
    const { data: agency } = await supabase
      .from("agencies")
      .select("name")
      .eq("id", agencyId)
      .single();

    // Create or get customer
    const customer = await createOrGetCustomer({
      agencyId,
      email: user.email!,
      name: agency?.name,
    });

    // Create checkout session
    const priceId = billingCycle === "yearly"
      ? PRICE_IDS.seat_yearly
      : PRICE_IDS.seat_monthly;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      subscription_data: {
        trial_period_days: BILLING_CONFIG.trialDays,
        metadata: {
          agency_id: agencyId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      metadata: {
        agency_id: agencyId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
