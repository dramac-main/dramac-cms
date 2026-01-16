import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  installModule,
  uninstallModule,
  toggleModule,
  updateModuleSettings,
  getSiteModuleInstallations,
} from "@/lib/modules/services/installation-service";

// =============================================================
// GET /api/modules/v2/site/[siteId]/installations
// =============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const supabase = await createClient();
    const { siteId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check site access
    const hasAccess = await checkSiteAccess(supabase, user.id, siteId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const installations = await getSiteModuleInstallations(siteId);
    
    return NextResponse.json({ installations });
  } catch (error) {
    console.error("[API /site/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// POST /api/modules/v2/site/[siteId]/installations - Install module
// =============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const supabase = await createClient();
    const { siteId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check site access
    const hasAccess = await checkSiteAccess(supabase, user.id, siteId);
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
    
    // Get site's client and agency for context
    const { data: site } = await supabase
      .from("sites")
      .select("client_id, client:clients(agency_id)")
      .eq("id", siteId)
      .single();
    
    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }
    
    const client = site.client as { agency_id: string } | null;
    if (!client) {
      return NextResponse.json(
        { error: "Client not found for site" },
        { status: 404 }
      );
    }
    
    const result = await installModule({
      moduleId,
      installLevel: "site",
      agencyId: client.agency_id,
      clientId: site.client_id,
      siteId,
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
    console.error("[API /site/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE /api/modules/v2/site/[siteId]/installations - Uninstall
// =============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const supabase = await createClient();
    const { siteId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check site access
    const hasAccess = await checkSiteAccess(supabase, user.id, siteId);
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
    
    // Get site's client and agency
    const { data: site } = await supabase
      .from("sites")
      .select("client_id, client:clients(agency_id)")
      .eq("id", siteId)
      .single();
    
    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }
    
    const client = site.client as { agency_id: string } | null;
    if (!client) {
      return NextResponse.json(
        { error: "Client not found for site" },
        { status: 404 }
      );
    }
    
    const result = await uninstallModule({
      moduleId,
      installLevel: "site",
      agencyId: client.agency_id,
      clientId: site.client_id,
      siteId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /site/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/modules/v2/site/[siteId]/installations - Toggle/Update
// =============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const supabase = await createClient();
    const { siteId } = await params;
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check site access
    const hasAccess = await checkSiteAccess(supabase, user.id, siteId);
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
        installLevel: "site",
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
        installLevel: "site",
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
    console.error("[API /site/installations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================
// HELPER
// =============================================================

async function checkSiteAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  siteId: string
): Promise<boolean> {
  // Check if user is super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", userId)
    .single();
  
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  
  // Get site's client and agency
  const { data: site } = await supabase
    .from("sites")
    .select("client_id, client:clients(agency_id)")
    .eq("id", siteId)
    .single();
  
  if (!site) return false;
  
  const client = site.client as { agency_id: string } | null;
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
