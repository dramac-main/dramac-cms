import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// NOTE: agency_module_subscriptions table does not exist. Using module_subscriptions instead.

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

    const body = await request.json();
    const { markupType } = body;

    // Validate markup type
    if (!['percentage', 'fixed', 'custom'].includes(markupType)) {
      return NextResponse.json({ error: "Invalid markup type" }, { status: 400 });
    }

    // Return stub response - pricing customization not yet implemented in schema
    // The module_subscriptions table doesn't have markup fields
    return NextResponse.json({ 
      success: true, 
      subscription: {
        id: subscriptionId,
        message: "Pricing customization coming soon"
      }
    });
  } catch (error) {
    console.error("Update pricing error:", error);
    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
