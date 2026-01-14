import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string; moduleId: string }>;
}

// PATCH - Update module settings or disable
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { siteId, moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled, settings } = body;

    const updates: Record<string, unknown> = {};
    if (typeof isEnabled === "boolean") updates.is_enabled = isEnabled;
    if (settings) updates.settings = settings;

    const { data, error } = await supabase
      .from("site_modules")
      .update(updates)
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

// DELETE - Disable module for site
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { siteId, moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("site_modules")
      .update({ is_enabled: false })
      .eq("site_id", siteId)
      .eq("module_id", moduleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disable module error:", error);
    return NextResponse.json(
      { error: "Failed to disable module" },
      { status: 500 }
    );
  }
}
