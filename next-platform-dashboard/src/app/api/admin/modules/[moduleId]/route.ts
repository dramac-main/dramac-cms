import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

// =============================================================
// GET /api/admin/modules/[moduleId] - Get single module
// =============================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { data: module, error } = await supabase
      .from("modules_v2")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get subscription stats
    const { count: subscriptionCount } = await supabase
      .from("agency_module_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("module_id", moduleId)
      .eq("status", "active");

    // Get installation stats
    const [agencyStats, clientStats, siteStats] = await Promise.all([
      supabase
        .from("agency_module_installations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId),
      supabase
        .from("client_module_installations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId),
      supabase
        .from("site_module_installations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId),
    ]);

    return NextResponse.json({
      module,
      stats: {
        activeSubscriptions: subscriptionCount || 0,
        agencyInstallations: agencyStats.count || 0,
        clientInstallations: clientStats.count || 0,
        siteInstallations: siteStats.count || 0,
      },
    });
  } catch (error) {
    console.error("[API /admin/modules/[id]] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================================
// PATCH /api/admin/modules/[moduleId] - Update module
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

    // Remove fields that shouldn't be updated directly
    const { id: _id, created_at: _created_at, created_by: _created_by, ...updateData } = body;

    const { data: module, error } = await supabase
      .from("modules_v2")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("[API /admin/modules/[id]] Update error:", error);
      return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("[API /admin/modules/[id]] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================================
// DELETE /api/admin/modules/[moduleId] - Delete module
// =============================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if module has active subscriptions
    const { count: subscriptionCount } = await supabase
      .from("agency_module_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("module_id", moduleId)
      .eq("status", "active");

    if (subscriptionCount && subscriptionCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete module with active subscriptions. Please deprecate it instead." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("modules_v2")
      .delete()
      .eq("id", moduleId);

    if (error) {
      console.error("[API /admin/modules/[id]] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /admin/modules/[id]] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
