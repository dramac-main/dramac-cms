import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moduleRegistry } from "@/lib/modules/module-registry";

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    // Verify user has access to this site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, agency_id")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check module exists in registry
    const module = moduleRegistry.get(moduleId) || moduleRegistry.getBySlug(moduleId);
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if already installed
    const { data: existing } = await supabase
      .from("site_modules")
      .select("id")
      .eq("site_id", siteId)
      .eq("module_id", module.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Module already installed" }, { status: 400 });
    }

    // Install module
    const { data, error } = await supabase
      .from("site_modules")
      .insert({
        site_id: siteId,
        module_id: module.id,
        is_enabled: true,
        settings: {},
        enabled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Module installation error:", error);
      return NextResponse.json({ error: "Failed to install module" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      installation: {
        id: data.id,
        siteId: data.site_id,
        moduleId: data.module_id,
        module: module,
        installedAt: data.enabled_at,
        enabled: data.is_enabled,
      },
    });
  } catch (error) {
    console.error("Module install error:", error);
    return NextResponse.json(
      { error: "Failed to install module" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    // Uninstall module
    const { error } = await supabase
      .from("site_modules")
      .delete()
      .eq("site_id", siteId)
      .eq("module_id", moduleId);

    if (error) {
      console.error("Module uninstall error:", error);
      return NextResponse.json({ error: "Failed to uninstall module" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Module uninstall error:", error);
    return NextResponse.json(
      { error: "Failed to uninstall module" },
      { status: 500 }
    );
  }
}
