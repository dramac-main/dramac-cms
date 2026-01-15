import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLogEntry, ActivityLogEntryWithUser } from "@/types/notifications";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agencyId = searchParams.get("agencyId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!agencyId) {
    return NextResponse.json(
      { error: "Agency ID is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Verify user has access to this agency
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user belongs to this agency
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.agency_id !== agencyId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch activity
    const { data, error } = await supabase
      .from("activity_log")
      .select(
        `
        *,
        user:profiles(full_name, avatar_url)
      `
      )
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activity:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity" },
        { status: 500 }
      );
    }

    const activities: ActivityLogEntry[] = (data as ActivityLogEntryWithUser[]).map((entry) => ({
      ...entry,
      user_name: entry.user?.full_name || "Unknown",
      user_avatar: entry.user?.avatar_url || undefined,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error in activity API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
