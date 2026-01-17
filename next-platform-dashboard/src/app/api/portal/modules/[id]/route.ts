import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const supabase = await createClient();
    
    // Check for impersonation cookie (for portal access)
    const cookieStore = await cookies();
    const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
    
    let clientId: string | undefined;
    let agencyId: string | undefined;
    
    if (impersonatingClientId) {
      // Impersonation mode
      clientId = impersonatingClientId;
      
      // Get agency_id from client
      const { data: client } = await supabase
        .from("clients")
        .select("agency_id")
        .eq("id", clientId)
        .single();
      
      agencyId = client?.agency_id;
    } else {
      // Direct user mode - get from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      clientId = user.user_metadata?.client_id;

      if (clientId) {
        const { data: client } = await supabase
          .from("clients")
          .select("agency_id")
          .eq("id", clientId)
          .single();
        
        agencyId = client?.agency_id;
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: "No client found" }, { status: 400 });
    }

    // Get the module
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if there's a client installation using type assertion
    const { data: installation } = await supabase
      .from("client_module_installations" as "modules")
      .select("*")
      .eq("client_id", clientId)
      .eq("module_id", moduleId)
      .eq("is_active", true)
      .single() as unknown as { data: Record<string, unknown> | null };

    // If no client installation, verify agency subscription
    if (!installation && agencyId) {
      const { data: subscription } = await supabase
        .from("agency_module_subscriptions" as "module_subscriptions")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("module_id", moduleId)
        .eq("status", "active")
        .single();

      if (!subscription) {
        // Check legacy table too
        const { data: legacySub } = await supabase
          .from("module_subscriptions")
          .select("*")
          .eq("agency_id", agencyId)
          .eq("module_id", moduleId)
          .eq("status", "active")
          .single();

        if (!legacySub) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    return NextResponse.json({ 
      module,
      installation: installation || null,
    });
  } catch (error) {
    console.error("Fetch module error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
