import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllModulePricesForClient,
} from "@/lib/modules/services/pricing-service";

// =============================================================
// GET /api/modules/v2/client/[clientId]/pricing
// =============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient();
    const { clientId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check client access
    const hasAccess = await checkClientAccess(supabase, user.id, clientId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const pricing = await getAllModulePricesForClient(clientId);
    
    return NextResponse.json({ pricing });
  } catch (error) {
    console.error("[API /client/pricing] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// HELPER
// =============================================================

async function checkClientAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  clientId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  
  const { data: client } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();
  
  if (!client) return false;
  if (profile.agency_id === client.agency_id) return true;
  
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", client.agency_id)
    .eq("user_id", userId)
    .single();
  
  return !!membership;
}
