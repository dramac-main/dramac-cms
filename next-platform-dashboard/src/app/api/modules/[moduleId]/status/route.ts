import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'draft', 'review', 'deprecated'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update module status
    const { data: module, error } = await supabase
      .from("modules")
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("Error updating module status:", error);
      return NextResponse.json({ error: "Failed to update module status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, module });
  } catch (error) {
    console.error("Update module status error:", error);
    return NextResponse.json(
      { error: "Failed to update module status" },
      { status: 500 }
    );
  }
}
