import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user belongs to the subscription's agency
    const { data: subscription } = await supabase
      .from("agency_module_subscriptions" as any)
      .select("agency_id")
      .eq("id", subscriptionId)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, role")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id !== (subscription as any).agency_id && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly, custom_price_yearly } = body;

    // Validate markup type
    if (!['percentage', 'fixed', 'custom', 'passthrough'].includes(markup_type)) {
      return NextResponse.json({ error: "Invalid markup type" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("agency_module_subscriptions" as any)
      .update({
        markup_type,
        markup_percentage,
        markup_fixed_amount,
        custom_price_monthly,
        custom_price_yearly,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) {
      console.error("Update pricing error:", error);
      return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (error) {
    console.error("Update pricing error:", error);
    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
