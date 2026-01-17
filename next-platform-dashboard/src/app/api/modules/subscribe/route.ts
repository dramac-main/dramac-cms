import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, agencyId, billingCycle } = await request.json();

    if (!moduleId || !agencyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user belongs to the agency
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, role")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id !== agencyId && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get module details from modules_v2
    const { data: module, error: moduleError } = await supabase
      .from("modules_v2" as any)
      .select("*")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const mod = module as any;

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("agency_module_subscriptions" as any)
      .select("id")
      .eq("agency_id", agencyId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already subscribed to this module" }, { status: 400 });
    }

    // For free modules, create subscription directly
    if (!mod.wholesale_price_monthly || mod.wholesale_price_monthly === 0) {
      const { data: subscription, error } = await supabase
        .from("agency_module_subscriptions" as any)
        .insert({
          agency_id: agencyId,
          module_id: moduleId,
          status: "active",
          billing_cycle: billingCycle || "monthly",
          markup_type: "percentage",
          markup_percentage: 100, // Default 100% markup
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Subscription creation error:", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
      }

      // Increment install count
      await supabase
        .from("modules_v2" as any)
        .update({ install_count: (mod.install_count || 0) + 1 })
        .eq("id", moduleId);

      return NextResponse.json({ success: true, subscription });
    }

    // For paid modules, create LemonSqueezy checkout
    // TODO: Implement full LemonSqueezy checkout integration
    // For now, return a placeholder checkout URL
    return NextResponse.json({
      success: true,
      message: "Paid module checkout",
      checkoutUrl: `/api/checkout/lemonsqueezy?module=${moduleId}&agency=${agencyId}`,
      // In production, this would redirect to LemonSqueezy checkout
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
