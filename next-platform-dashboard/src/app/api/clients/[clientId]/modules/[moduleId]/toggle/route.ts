import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; moduleId: string }> }
) {
  try {
    const { clientId, moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value" }, { status: 400 });
    }

    // Toggle module subscription status using agency_module_subscriptions table
    const { data: subscription, error } = await supabase
      .from("agency_module_subscriptions")
      .update({ status: enabled ? "active" : "canceled" })
      .eq("client_id", clientId)
      .eq("module_id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("Error toggling module:", error);
      return NextResponse.json({ error: "Failed to toggle module" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Toggle module error:", error);
    return NextResponse.json(
      { error: "Failed to toggle module" },
      { status: 500 }
    );
  }
}
