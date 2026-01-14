import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelModuleSubscription } from "@/lib/stripe/module-subscriptions";

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

    await cancelModuleSubscription(agencyId, moduleId);

    return NextResponse.json({ success: true, canceledAtPeriodEnd: true });
  } catch (error) {
    console.error("Cancel module error:", error);
    return NextResponse.json(
      { error: "Failed to cancel module subscription" },
      { status: 500 }
    );
  }
}
