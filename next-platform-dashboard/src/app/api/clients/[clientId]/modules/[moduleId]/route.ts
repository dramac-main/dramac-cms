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

    // Client module uninstall - coming soon
    // For now, return success as placeholder
    return NextResponse.json({ 
      success: true, 
      message: "Client module management coming soon" 
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
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      module,
      clientId,
      installed: false, // Placeholder - client module installations coming soon
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
      message: "Client module management coming soon" 
    });
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}
