import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// NOTE: module_requests table does not exist yet. These endpoints return stub data.
// TODO: Create module_requests table migration when this feature is needed.

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
    const { title, description } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    // Return stub response - module_requests table not yet implemented
    return NextResponse.json({ 
      success: true, 
      request: {
        id: crypto.randomUUID(),
        title,
        description,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        message: "Module requests feature coming soon"
      }
    });
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

    // Return empty array - module_requests table not yet implemented
    return NextResponse.json({ requests: [] });
  } catch (error) {
    console.error("Module requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
