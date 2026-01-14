import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSeatsForAgency } from "@/lib/stripe/seat-sync";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId } = body;

    // Verify user belongs to agency
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await syncSeatsForAgency(agencyId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Seat sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync seats" },
      { status: 500 }
    );
  }
}
