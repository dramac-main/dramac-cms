import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  installModule,
  uninstallModule,
  toggleModule,
  updateModuleSettings,
  getAgencyModuleInstallations,
} from "@/lib/modules/services/installation-service";

// =============================================================
// GET /api/modules/v2/agency/[agencyId]/installations
// =============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const supabase = await createClient();
    const { agencyId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check agency access
    const hasAccess = await checkAgencyAccess(supabase, user.id, agencyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const installations = await getAgencyModuleInstallations(agencyId);
    
    return NextResponse.json({ installations });
  } catch (error) {
    console.error("[API /agency/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// POST /api/modules/v2/agency/[agencyId]/installations - Install module
// =============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const supabase = await createClient();
    const { agencyId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check agency access
    const hasAccess = await checkAgencyAccess(supabase, user.id, agencyId);
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
    
    const result = await installModule({
      moduleId,
      installLevel: "agency",
      agencyId,
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
    console.error("[API /agency/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE /api/modules/v2/agency/[agencyId]/installations - Uninstall
// =============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const supabase = await createClient();
    const { agencyId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check agency access
    const hasAccess = await checkAgencyAccess(supabase, user.id, agencyId);
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
    
    const result = await uninstallModule({
      moduleId,
      installLevel: "agency",
      agencyId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /agency/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/modules/v2/agency/[agencyId]/installations - Toggle/Update
// =============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const supabase = await createClient();
    const { agencyId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check agency access
    const hasAccess = await checkAgencyAccess(supabase, user.id, agencyId);
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
        installLevel: "agency",
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
        installLevel: "agency",
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
    console.error("[API /agency/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// HELPER
// =============================================================

async function checkAgencyAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  agencyId: string
): Promise<boolean> {
  // Check if user is super admin or agency owner/member
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  
  if (!profile) return false;
  
  // Super admin has access to all
  if (profile.role === "super_admin") return true;
  
  // Agency owner/admin
  if (profile.agency_id === agencyId) return true;
  
  // Check agency_members table
  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .single();
  
  return !!membership;
}
