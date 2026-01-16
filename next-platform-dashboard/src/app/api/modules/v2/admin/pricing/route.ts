import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllWholesalePricing,
  setWholesalePrice,
} from "@/lib/modules/services/pricing-service";

// =============================================================
// GET /api/modules/v2/admin/pricing - Get all wholesale pricing
// =============================================================

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check - super admin only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const pricing = await getAllWholesalePricing();
    
    return NextResponse.json({ pricing });
  } catch (error) {
    console.error("[API /admin/pricing] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/modules/v2/admin/pricing - Set wholesale pricing
// =============================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check - super admin only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      moduleId,
      wholesalePriceMonthly,
      wholesalePriceYearly,
      wholesalePriceOneTime,
      pricingType,
      suggestedRetailMonthly,
      suggestedRetailYearly,
      lemonProductId,
      lemonVariantMonthlyId,
      lemonVariantYearlyId,
      lemonVariantOneTimeId,
    } = body;
    
    if (!moduleId) {
      return NextResponse.json(
        { error: "moduleId is required" },
        { status: 400 }
      );
    }
    
    const result = await setWholesalePrice({
      moduleId,
      wholesalePriceMonthly,
      wholesalePriceYearly,
      wholesalePriceOneTime,
      pricingType,
      suggestedRetailMonthly,
      suggestedRetailYearly,
      lemonProductId,
      lemonVariantMonthlyId,
      lemonVariantYearlyId,
      lemonVariantOneTimeId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /admin/pricing] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
