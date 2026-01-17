import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

// =============================================================
// GET /api/modules/v2/[moduleId] - Get single module details
// =============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const supabase = await createClient() as AnySupabase;
    const { moduleId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get module
    const { data: module, error } = await (supabase as any)
      .from("modules_v2")
      .select(`
        *,
        reviews:module_reviews(
          id, rating, review_text, reviewer_name, created_at
        )
      `)
      .eq("id", moduleId)
      .single();
    
    if (error || !module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }
    
    // Get installation stats by level
    const [agencyStats, clientStats, siteStats] = await Promise.all([
      (supabase as any)
        .from("agency_module_installations")
        .select("id", { count: "exact" })
        .eq("module_id", moduleId),
      (supabase as any)
        .from("client_module_installations")
        .select("id", { count: "exact" })
        .eq("module_id", moduleId),
      (supabase as any)
        .from("site_module_installations")
        .select("id", { count: "exact" })
        .eq("module_id", moduleId),
    ]);
    
    return NextResponse.json({
      module,
      stats: {
        agencyInstallations: agencyStats.count || 0,
        clientInstallations: clientStats.count || 0,
        siteInstallations: siteStats.count || 0,
      },
    });
  } catch (error) {
    console.error("[API /modules/v2/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/modules/v2/[moduleId] - Update module (admin only)
// =============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const supabase = await createClient() as AnySupabase;
    const { moduleId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Allowed update fields
    const allowedFields = [
      "name", "description", "version", "category",
      "icon_url", "banner_url", "author_name", "author_url",
      "status", "is_free", "is_featured",
      "pricing_type", "wholesale_price_monthly", "wholesale_price_yearly",
      "wholesale_price_one_time", "suggested_retail_monthly", "suggested_retail_yearly",
      "permissions", "hooks", "supported_components",
      "manifest", "entry_point", "sandbox_config",
      "lemon_product_id", "lemon_variant_monthly_id", "lemon_variant_yearly_id",
    ];
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    const { data: module, error } = await (supabase as any)
      .from("modules_v2")
      .update(updateData)
      .eq("id", moduleId)
      .select()
      .single();
    
    if (error) {
      console.error("[API /modules/v2/[id]] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update module" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ module });
  } catch (error) {
    console.error("[API /modules/v2/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
