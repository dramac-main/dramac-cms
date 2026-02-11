import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cancel Module Subscription API Route
 * 
 * Cancels a module subscription by updating its status.
 * If Paddle subscription exists, it would be cancelled via Paddle API.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, moduleId } = body;

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

    // Update subscription status to canceled
    const { error } = await (supabase as any)
      .from("agency_module_subscriptions")
      .update({ status: "canceled" })
      .eq("agency_id", agencyId)
      .eq("module_id", moduleId)
      .eq("status", "active");

    if (error) {
      console.error("Cancel module subscription error:", error);
      return NextResponse.json(
        { error: "Failed to cancel module subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, canceledAtPeriodEnd: true });
  } catch (error) {
    console.error("Cancel module error:", error);
    return NextResponse.json(
      { error: "Failed to cancel module subscription" },
      { status: 500 }
    );
  }
}
