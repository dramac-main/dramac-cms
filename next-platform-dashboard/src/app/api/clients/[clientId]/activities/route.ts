import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Activity logs table is pending implementation
    // Return empty array for now - client will show "no activity recorded yet" message
    // When activity_logs table is created, update this to fetch actual activities
    console.log(`Requested activities for client: ${clientId}`);
    
    return NextResponse.json([]);
  } catch (_error) {
    console.error("Error fetching activities");
    return NextResponse.json([]);
  }
}
