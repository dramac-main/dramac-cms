import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModuleById } from "@/lib/modules/module-registry-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, moduleSlug, agencyId, billingCycle } = body;

    if (!moduleId && !moduleSlug) {
      return NextResponse.json({ error: "Module ID or slug required" }, { status: 400 });
    }

    // Get user's agency if not provided
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, role")
      .eq("id", user.id)
      .single();

    const targetAgencyId = agencyId || profile?.agency_id;
    if (!targetAgencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 400 });
    }

    // Verify user belongs to the agency or is admin
    if (profile?.agency_id !== targetAgencyId && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get module from registry (supports BOTH catalog AND studio modules)
    const module = await getModuleById(moduleId || moduleSlug);
    
    console.log("[Subscribe] Module from registry:", module ? { id: module.id, slug: module.slug, name: module.name } : null);
    
    // Also try to get from modules_v2 directly
    let moduleData = null;
    if (module) {
      const { data: v2Module } = await supabase
        .from("modules_v2" as any)
        .select("*")
        .eq("id", module.id)
        .maybeSingle();
      moduleData = v2Module as any;
      console.log("[Subscribe] Module from v2:", moduleData ? { id: moduleData.id } : null);
    }

    // If not in modules_v2, it might be a studio module - get from module_source directly
    if (!moduleData) {
      // Try by slug first
      let studioResult = await (supabase as any)
        .from("module_source")
        .select("id, module_id, slug, name")
        .eq("slug", moduleSlug || moduleId)
        .maybeSingle();
      
      // If not found by slug, try by module_id
      if (!studioResult.data) {
        studioResult = await (supabase as any)
          .from("module_source")
          .select("id, module_id, slug, name")
          .eq("module_id", moduleSlug || moduleId)
          .maybeSingle();
      }
      
      const studioModule = studioResult.data;
      console.log("[Subscribe] Studio module:", studioModule);
      
      if (studioModule) {
        // For studio modules, the actual ID is in module_source.id (the primary key)
        // OR module_id if it exists and is a UUID
        moduleData = {
          id: studioModule.id, // Use the primary key ID from module_source
          slug: studioModule.slug,
          name: studioModule.name,
          wholesale_price_monthly: 0, // Studio modules are free by default during testing
          install_count: 0,
        };
        console.log("[Subscribe] Using studio module ID:", moduleData.id);
      }
    }

    if (!module && !moduleData) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Prioritize database ID (UUID) over registry ID (which might be a slug)
    const effectiveModuleId = moduleData?.id || module?.id;
    
    console.log("[Subscribe] Effective module ID:", effectiveModuleId);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("agency_module_subscriptions" as any)
      .select("id, status")
      .eq("agency_id", targetAgencyId)
      .eq("module_id", effectiveModuleId)
      .maybeSingle();

    if (existing && (existing as any).status === "active") {
      return NextResponse.json({ 
        error: "Already subscribed to this module",
        subscription: existing
      }, { status: 400 });
    }

    // If there's an inactive subscription, reactivate it
    if (existing) {
      const { data: reactivated, error: updateError } = await supabase
        .from("agency_module_subscriptions" as any)
        .update({ 
          status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", (existing as any).id)
        .select()
        .single();

      if (updateError) {
        console.error("Reactivation error:", updateError);
        return NextResponse.json({ error: "Failed to reactivate subscription" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Module subscription reactivated",
        subscription: reactivated,
        module: { id: effectiveModuleId, name: moduleData?.name || module?.name }
      });
    }

    // For free modules (including testing studio modules), create subscription directly
    const isFree = !moduleData?.wholesale_price_monthly || moduleData.wholesale_price_monthly === 0;
    
    if (isFree) {
      const { data: subscription, error } = await supabase
        .from("agency_module_subscriptions" as any)
        .insert({
          agency_id: targetAgencyId,
          module_id: effectiveModuleId,
          status: "active",
          billing_cycle: billingCycle || "one_time", // Free modules use 'one_time' cycle
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

      // Increment install count if modules_v2 module
      if (moduleData?.install_count !== undefined) {
        await supabase
          .from("modules_v2" as any)
          .update({ install_count: (moduleData.install_count || 0) + 1 })
          .eq("id", effectiveModuleId);
      }

      return NextResponse.json({ 
        success: true, 
        message: "Module subscribed successfully!",
        subscription,
        module: { id: effectiveModuleId, name: moduleData?.name || module?.name }
      });
    }

    // For paid modules, create Paddle checkout
    return NextResponse.json({
      success: false,
      requiresPayment: true,
      message: "This module requires payment",
      checkoutUrl: `/api/checkout/paddle?module=${effectiveModuleId}&agency=${targetAgencyId}`,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
