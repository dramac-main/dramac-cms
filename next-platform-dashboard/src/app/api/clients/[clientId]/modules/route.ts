import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Get client's installed modules
    const { data: installed, error: installedError } = await (supabase as any)
      .from("client_module_installations")
      .select(`
        *,
        module:modules_v2(*)
      `)
      .eq("client_id", clientId);

    if (installedError) {
      console.error("Error fetching installed modules:", installedError);
    }

    // Get agency's available module subscriptions
    const { data: available, error: availableError } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select(`
        *,
        module:modules_v2(*)
      `)
      .eq("agency_id", client.agency_id)
      .eq("status", "active");

    if (availableError) {
      console.error("Error fetching available modules:", availableError);
    }

    return NextResponse.json({ 
      installed: installed || [],
      available: available || []
    });
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
    const { data: subscription, error: subError } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select("id, status")
      .eq("agency_id", agencyId)
      .eq("module_id", moduleId)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: "Agency does not have an active subscription to this module" }, { status: 400 });
    }

    // Check if already installed
    const { data: existing } = await (supabase as any)
      .from("client_module_installations")
      .select("id")
      .eq("client_id", clientId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Module already installed for this client" }, { status: 400 });
    }

    // Create the installation
    const { data: installation, error: installError } = await (supabase as any)
      .from("client_module_installations")
      .insert({
        client_id: clientId,
        module_id: moduleId,
        agency_subscription_id: subscription.id,
        is_enabled: true,
        billing_status: "active",
        price_paid: pricePaid || 0,
        billing_cycle: "monthly",
        installed_at: new Date().toISOString(),
        installed_by: user.id,
        enabled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (installError) {
      console.error("Install module error:", installError);
      return NextResponse.json({ error: "Failed to install module" }, { status: 500 });
    }

    // Update current_installations count on subscription
    await (supabase as any)
      .from("agency_module_subscriptions")
      .update({ 
        current_installations: (subscription as any).current_installations + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    return NextResponse.json({ 
      success: true, 
      installation
    });
  } catch (error) {
    console.error("Install module error:", error);
    return NextResponse.json(
      { error: "Failed to install module" },
      { status: 500 }
    );
  }
}
