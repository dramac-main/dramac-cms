import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for columns not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * Module Checkout API Route
 * 
 * Handles module subscription checkout.
 * Free modules are activated directly; paid modules use Paddle checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() as AnySupabase;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, moduleId, billingCycle = "monthly" } = body;

    // Get module details
    const { data: module } = await supabase
      .from("modules_v2")
      .select("id, name, pricing_type, wholesale_price_monthly, wholesale_price_yearly, paddle_price_monthly_id, paddle_price_yearly_id")
      .eq("id", moduleId)
      .single();

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Verify user belongs to agency
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If module is free, create subscription directly
    if (module.pricing_type === "free" || (!module.wholesale_price_monthly && !module.wholesale_price_yearly)) {
      const { error } = await (supabase as any).from("agency_module_subscriptions").insert({
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

    // For paid modules, check Paddle price IDs
    const priceId = billingCycle === "yearly"
      ? module.paddle_price_yearly_id
      : module.paddle_price_monthly_id;

    if (!priceId) {
      // If no Paddle price configured, still allow activation (billing handled separately)
      const { error } = await (supabase as any).from("agency_module_subscriptions").insert({
        agency_id: agencyId,
        module_id: moduleId,
        status: "active",
        billing_cycle: billingCycle,
      });

      if (error) {
        return NextResponse.json(
          { error: "Failed to activate module" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&module=${moduleId}`,
        free: true 
      });
    }

    // Return Paddle checkout data for client-side Paddle.js
    return NextResponse.json({
      priceId,
      agencyId,
      moduleId,
      customerEmail: user.email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&module=${moduleId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true`,
    });
  } catch (error) {
    console.error("Module checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
