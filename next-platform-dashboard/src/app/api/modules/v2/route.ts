import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated

// =============================================================
// GET /api/modules/v2 - List all active modules (new system)
// =============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const installLevel = searchParams.get("install_level");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    // Build query - using 'as any' for new table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("modules_v2")
      .select(`
        id, name, slug, description, version, category,
        icon_url, banner_url, author_name, author_url,
        status, install_level, is_free, is_featured,
        pricing_type, wholesale_price_monthly, suggested_retail_monthly,
        permissions, hooks, supported_components,
        total_installations, average_rating, rating_count,
        created_at, updated_at
      `, { count: "exact" })
      .eq("status", "active");
    
    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }
    if (installLevel) {
      query = query.eq("install_level", installLevel);
    }
    if (featured === "true") {
      query = query.eq("is_featured", true);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    // Order by featured, then popularity
    query = query
      .order("is_featured", { ascending: false })
      .order("total_installations", { ascending: false });
    
    const { data: modules, error, count } = await query;
    
    if (error) {
      console.error("[API /modules/v2] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch modules" },
        { status: 500 }
      );
    }
    
    // Get categories for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categories } = await (supabase as any)
      .from("modules_v2")
      .select("category")
      .eq("status", "active")
      .not("category", "is", null);
    
    const uniqueCategories = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...new Set((categories || []).map((c: any) => c.category)),
    ].filter(Boolean).sort();
    
    return NextResponse.json({
      modules: modules || [],
      categories: uniqueCategories,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("[API /modules/v2] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
