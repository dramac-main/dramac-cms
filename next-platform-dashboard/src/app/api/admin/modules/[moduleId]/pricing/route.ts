import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

// =============================================================
// PATCH /api/admin/modules/[moduleId]/pricing - Update pricing
// =============================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient() as AnySupabase;
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      wholesale_price_monthly,
      wholesale_price_yearly,
      wholesale_price_one_time,
      suggested_retail_monthly,
      suggested_retail_yearly,
      pricing_type,
      lemon_product_id,
      lemon_variant_monthly_id,
      lemon_variant_yearly_id,
      lemon_variant_one_time_id,
    } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (wholesale_price_monthly !== undefined) {
      updateData.wholesale_price_monthly = wholesale_price_monthly;
    }
    if (wholesale_price_yearly !== undefined) {
      updateData.wholesale_price_yearly = wholesale_price_yearly;
    }
    if (wholesale_price_one_time !== undefined) {
      updateData.wholesale_price_one_time = wholesale_price_one_time;
    }
    if (suggested_retail_monthly !== undefined) {
      updateData.suggested_retail_monthly = suggested_retail_monthly;
    }
    if (suggested_retail_yearly !== undefined) {
      updateData.suggested_retail_yearly = suggested_retail_yearly;
    }
    if (pricing_type !== undefined) {
      updateData.pricing_type = pricing_type;
    }
    if (lemon_product_id !== undefined) {
      updateData.lemon_product_id = lemon_product_id;
    }
    if (lemon_variant_monthly_id !== undefined) {
      updateData.lemon_variant_monthly_id = lemon_variant_monthly_id;
    }
    if (lemon_variant_yearly_id !== undefined) {
      updateData.lemon_variant_yearly_id = lemon_variant_yearly_id;
    }
    if (lemon_variant_one_time_id !== undefined) {
      updateData.lemon_variant_one_time_id = lemon_variant_one_time_id;
    }

    const { data: module, error } = await supabase
      .from("modules_v2")
      .update(updateData)
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("[API /admin/modules/[id]/pricing] Update error:", error);
      return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("[API /admin/modules/[id]/pricing] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
