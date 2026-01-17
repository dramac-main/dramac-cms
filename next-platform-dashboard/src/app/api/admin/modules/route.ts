import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

// =============================================================
// GET /api/admin/modules - List all modules (admin)
// =============================================================

export async function GET(request: NextRequest) {
  try {
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const installLevel = searchParams.get("install_level");

    // Build query
    let query = supabase
      .from("modules_v2")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (installLevel) {
      query = query.eq("install_level", installLevel);
    }

    const { data: modules, error } = await query;

    if (error) {
      console.error("[API /admin/modules] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    return NextResponse.json({ modules: modules || [] });
  } catch (error) {
    console.error("[API /admin/modules] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================================
// POST /api/admin/modules - Create new module
// =============================================================

export async function POST(request: NextRequest) {
  try {
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
      slug,
      name,
      description,
      long_description,
      icon,
      category,
      install_level,
      pricing_type,
      wholesale_price_monthly,
      wholesale_price_yearly,
      suggested_retail_monthly,
      suggested_retail_yearly,
      features,
      requirements,
      settings_schema,
      default_settings,
    } = body;

    // Validate required fields
    if (!slug || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: slug, name, category" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("modules_v2")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Module with this slug already exists" },
        { status: 409 }
      );
    }

    const { data: module, error } = await supabase
      .from("modules_v2")
      .insert({
        slug,
        name,
        description,
        long_description,
        icon: icon || "📦",
        category,
        install_level: install_level || "site",
        pricing_type: pricing_type || "free",
        wholesale_price_monthly: wholesale_price_monthly || 0,
        wholesale_price_yearly: wholesale_price_yearly || 0,
        suggested_retail_monthly,
        suggested_retail_yearly,
        features: features || [],
        requirements: requirements || [],
        settings_schema: settings_schema || {},
        default_settings: default_settings || {},
        status: "draft",
        created_by: user.id,
        current_version: "1.0.0",
      })
      .select()
      .single();

    if (error) {
      console.error("[API /admin/modules] Create error:", error);
      return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
    }

    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    console.error("[API /admin/modules] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
