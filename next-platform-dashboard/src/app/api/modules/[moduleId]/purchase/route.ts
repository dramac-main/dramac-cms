import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moduleRegistry } from "@/lib/modules/module-registry";

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, returnUrl } = body;

    if (!siteId) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    // Check module exists in registry
    const module = moduleRegistry.get(moduleId) || moduleRegistry.getBySlug(moduleId);
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // If free module, just install directly
    if (module.pricing.type === "free") {
      return NextResponse.json({ 
        error: "This module is free. Use the install endpoint instead.",
        isFree: true 
      }, { status: 400 });
    }

    // Get agency information
    const { data: site } = await supabase
      .from("sites")
      .select("id, agency_id, agencies(stripe_customer_id)")
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Create checkout URL (would integrate with LemonSqueezy or Stripe)
    // For now, return a placeholder
    const checkoutUrl = `/checkout/module?module=${module.id}&site=${siteId}&return=${encodeURIComponent(returnUrl || "/marketplace")}`;

    return NextResponse.json({
      checkoutUrl,
      module: {
        id: module.id,
        name: module.name,
        price: module.pricing.amount,
        currency: module.pricing.currency,
        type: module.pricing.type,
      },
    });
  } catch (error) {
    console.error("Module purchase error:", error);
    return NextResponse.json(
      { error: "Failed to initiate purchase" },
      { status: 500 }
    );
  }
}
