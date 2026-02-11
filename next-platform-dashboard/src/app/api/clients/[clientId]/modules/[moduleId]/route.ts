import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Client module installations feature is coming soon
// This API uses site_modules as a placeholder for now

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; moduleId: string }> }
) {
  try {
    const { clientId, moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the client module installation
    const { error } = await (supabase as any)
      .from("client_module_installations")
      .delete()
      .eq("client_id", clientId)
      .eq("module_id", moduleId);

    if (error) {
      console.error("Delete module installation error:", error);
      return NextResponse.json({ 
        error: "Failed to uninstall module" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Module uninstalled successfully" 
    });
  } catch (error) {
    console.error("Uninstall module error:", error);
    return NextResponse.json(
      { error: "Failed to uninstall module" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; moduleId: string }> }
) {
  try {
    const { clientId, moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get module details
    const { data: module, error } = await supabase
      .from("modules_v2")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if module is installed for this client
    const { data: installation } = await (supabase as any)
      .from("client_module_installations")
      .select("*")
      .eq("client_id", clientId)
      .eq("module_id", moduleId)
      .single();

    return NextResponse.json({ 
      module,
      clientId,
      installed: !!installation,
      installation: installation || null,
    });
  } catch (error) {
    console.error("Get module error:", error);
    return NextResponse.json(
      { error: "Failed to get module" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; moduleId: string }> }
) {
  try {
    const { clientId, moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Client module settings update - coming soon
    return NextResponse.json({ 
      success: true, 
      message: "Client module management is not yet configured" 
    });
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}
