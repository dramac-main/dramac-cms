import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's agency
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: "No agency found" }, { status: 400 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      useCase, 
      targetAudience,
      suggestedInstallLevel,
      suggestedCategory,
      priority,
      budgetRange,
      willingToFund
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("module_requests" as any)
      .insert({
        agency_id: profile.agency_id,
        title,
        description,
        use_case: useCase,
        target_audience: targetAudience,
        suggested_install_level: suggestedInstallLevel || "client",
        suggested_category: suggestedCategory || "other",
        priority: priority || "normal",
        budget_range: budgetRange,
        willing_to_fund: willingToFund || false,
        submitted_by: user.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Module request creation error:", error);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (error) {
    console.error("Module request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("module_requests" as any)
      .select("*, agency:agencies(name)")
      .order("submitted_at", { ascending: false });

    // Non-super-admin only sees their agency's requests
    if (profile?.role !== "super_admin" && profile?.agency_id) {
      query = query.eq("agency_id", profile.agency_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch requests error:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    console.error("Module requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
