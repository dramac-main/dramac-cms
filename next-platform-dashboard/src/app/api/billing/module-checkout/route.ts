import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createModuleCheckout } from "@/lib/payments/module-billing";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, moduleId, billingCycle = "monthly" } = body;

    // Get module and its LemonSqueezy variant IDs
    const { data: module } = await supabase
      .from("modules_v2")
      .select("lemon_variant_monthly_id, lemon_variant_yearly_id, name, pricing_type")
      .eq("id", moduleId)
      .single();

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // If module is free (pricing_type === "free"), just create the subscription directly
    if (module.pricing_type === "free") {
      // For free modules, create subscription record directly
      const { error } = await supabase.from("agency_module_subscriptions").insert({
        agency_id: agencyId,
        module_id: moduleId,
        status: "active",
        billing_cycle: "free",
      });

      if (error) {
        return NextResponse.json(
          { error: "Failed to activate free module" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&module=${moduleId}`,
        free: true 
      });
    }

    const variantId = billingCycle === "yearly"
      ? module.lemon_variant_yearly_id
      : module.lemon_variant_monthly_id;

    if (!variantId) {
      return NextResponse.json(
        { error: "Module pricing not configured. Please contact support." },
        { status: 400 }
      );
    }

    // Create LemonSqueezy checkout
    const checkout = await createModuleCheckout({
      agencyId,
      moduleId,
      variantId,
      email: user.email!,
      userId: user.id,
      billingCycle,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&module=${moduleId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true`,
    });

    return NextResponse.json({ url: checkout.checkoutUrl });
  } catch (error) {
    console.error("Module checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
