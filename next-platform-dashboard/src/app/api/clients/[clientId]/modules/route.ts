import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: This API route requires the client_module_installations table
// which needs to be created via database migration

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client to verify access
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agency_id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get agency's module subscriptions as available modules
    const { data: modules, error } = await supabase
      .from("module_subscriptions")
      .select(`
        *,
        module:modules(*)
      `)
      .eq("agency_id", client.agency_id)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching client modules:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Client modules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client modules" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, agencyId, pricePaid } = body;

    if (!moduleId || !agencyId) {
      return NextResponse.json({ error: "Module ID and Agency ID are required" }, { status: 400 });
    }

    // Verify agency has subscription to this module
    const { data: subscription, error: subError } = await supabase
      .from("module_subscriptions")
      .select("id, status")
      .eq("agency_id", agencyId)
      .eq("module_id", moduleId)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: "Agency does not have an active subscription to this module" }, { status: 400 });
    }

    // TODO: Implement full client module installation when table exists
    console.log("Install module for client:", { clientId, moduleId, agencyId, pricePaid });

    return NextResponse.json({ 
      success: true, 
      installation: {
        client_id: clientId,
        module_id: moduleId,
        is_enabled: true,
      },
      message: "Module subscription verified. Full installation requires database migration."
    });
  } catch (error) {
    console.error("Install module error:", error);
    return NextResponse.json(
      { error: "Failed to install module" },
      { status: 500 }
    );
  }
}
