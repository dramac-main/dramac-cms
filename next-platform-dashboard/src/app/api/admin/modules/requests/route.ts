import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

// =============================================================
// GET /api/admin/modules/requests - List all module requests
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
    const agencyId = searchParams.get("agency_id");
    const priority = searchParams.get("priority");

    // Build query
    let query = supabase
      .from("module_requests")
      .select(`
        *,
        agency:agencies(id, name),
        submitter:profiles!submitted_by(id, name, email)
      `)
      .order("submitted_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("[API /admin/modules/requests] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      total: requests?.length || 0,
      submitted: requests?.filter((r: { status: string }) => r.status === "submitted").length || 0,
      reviewing: requests?.filter((r: { status: string }) => r.status === "reviewing").length || 0,
      approved: requests?.filter((r: { status: string }) => r.status === "approved").length || 0,
      inProgress: requests?.filter((r: { status: string }) => r.status === "in_progress").length || 0,
      completed: requests?.filter((r: { status: string }) => r.status === "completed").length || 0,
      rejected: requests?.filter((r: { status: string }) => r.status === "rejected").length || 0,
    };

    return NextResponse.json({ requests: requests || [], stats });
  } catch (error) {
    console.error("[API /admin/modules/requests] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
