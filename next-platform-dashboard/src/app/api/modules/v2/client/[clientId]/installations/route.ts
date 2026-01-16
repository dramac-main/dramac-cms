import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  installModule,
  uninstallModule,
  toggleModule,
  updateModuleSettings,
  getClientModuleInstallations,
} from "@/lib/modules/services/installation-service";

// =============================================================
// GET /api/modules/v2/client/[clientId]/installations
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
    
    const installations = await getClientModuleInstallations(clientId);
    
    return NextResponse.json({ installations });
  } catch (error) {
    console.error("[API /client/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// POST /api/modules/v2/client/[clientId]/installations - Install module
// =============================================================

export async function POST(
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
    
    const body = await request.json();
    const { moduleId, settings } = body;
    
    if (!moduleId) {
      return NextResponse.json(
        { error: "moduleId is required" },
        { status: 400 }
      );
    }
    
    // Get client's agency for pricing
    const { data: client } = await supabase
      .from("clients")
      .select("agency_id")
      .eq("id", clientId)
      .single();
    
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }
    
    const result = await installModule({
      moduleId,
      installLevel: "client",
      agencyId: client.agency_id,
      clientId,
      installedBy: user.id,
      settings,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      installationId: result.installationId,
    });
  } catch (error) {
    console.error("[API /client/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE /api/modules/v2/client/[clientId]/installations - Uninstall
// =============================================================

export async function DELETE(
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
    
    const body = await request.json();
    const { moduleId } = body;
    
    if (!moduleId) {
      return NextResponse.json(
        { error: "moduleId is required" },
        { status: 400 }
      );
    }
    
    // Get client's agency
    const { data: client } = await supabase
      .from("clients")
      .select("agency_id")
      .eq("id", clientId)
      .single();
    
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }
    
    const result = await uninstallModule({
      moduleId,
      installLevel: "client",
      agencyId: client.agency_id,
      clientId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /client/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/modules/v2/client/[clientId]/installations - Toggle/Update
// =============================================================

export async function PATCH(
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
    
    const body = await request.json();
    const { installationId, action, settings, enabled } = body;
    
    if (!installationId) {
      return NextResponse.json(
        { error: "installationId is required" },
        { status: 400 }
      );
    }
    
    // Toggle module
    if (action === "toggle" || enabled !== undefined) {
      const result = await toggleModule({
        installationId,
        installLevel: "client",
        enabled: enabled ?? (action === "enable"),
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Update settings
    if (settings !== undefined) {
      const result = await updateModuleSettings({
        installationId,
        installLevel: "client",
        settings,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: "No action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /client/installations] Error:", error);
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
  // Check if user is super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  
  // Get client's agency
  const { data: client } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();
  
  if (!client) return false;
  
  // Agency member has access
  if (profile.agency_id === client.agency_id) return true;
  
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", client.agency_id)
    .eq("user_id", userId)
    .single();
  
  return !!membership;
}
