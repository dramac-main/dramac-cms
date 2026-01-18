import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, clientId, message } = await request.json();

    if (!moduleId || !clientId) {
      return NextResponse.json({ error: "Module ID and Client ID are required" }, { status: 400 });
    }

    // Verify access - either impersonation or direct client access
    const cookieStore = await cookies();
    const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
    
    let hasAccess = false;
    
    if (impersonatingClientId === clientId) {
      // Impersonation access
      hasAccess = true;
    } else {
      // Check if user metadata has client_id
      hasAccess = user.user_metadata?.client_id === clientId;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client's agency
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agency_id, name")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get module info
    const { data: module, error: moduleError } = await supabase
      .from("modules_v2")
      .select("id, name, slug")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Try to create activity log entry for the request
    // Use activity_log table if it exists
    try {
      await supabase
        .from("activity_log")
        .insert({
          agency_id: client.agency_id,
          user_id: user.id,
          action: "module_request",
          resource_type: "module",
          resource_id: moduleId,
          resource_name: module.name,
          details: {
            client_id: clientId,
            client_name: client.name,
            module_slug: module.slug,
            message: message || null,
            status: "pending",
            requested_at: new Date().toISOString(),
          },
        });
    } catch {
      // If activity_log doesn't exist or fails, silently continue
      console.log("Activity log not available, request captured in response");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Request submitted successfully",
      request: {
        moduleId,
        moduleName: module.name,
        clientId,
        status: "pending",
      }
    });
  } catch (error) {
    console.error("Module request error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
