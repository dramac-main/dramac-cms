import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string }>;
}

// GET - List modules for a site
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site with client info to check agency
    const { data: site } = await supabase
      .from("sites")
      .select("client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (!site?.client?.agency_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get all module subscriptions for the agency
    const { data: subscriptions } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select("*")
      .eq("agency_id", site.client.agency_id)
      .eq("status", "active");

    // Enrich subscriptions with module details from both sources
    const agencyModules = await Promise.all(
      (subscriptions || []).map(async (sub: any) => {
        // Try modules_v2 first (published)
        const { data: v2Module } = await (supabase as any)
          .from("modules_v2")
          .select("*")
          .eq("id", sub.module_id)
          .single();

        if (v2Module) {
          return { ...sub, module: v2Module };
        }

        // Fallback to module_source (testing)
        const { data: sourceModule } = await (supabase as any)
          .from("module_source")
          .select("*")
          .eq("id", sub.module_id)
          .single();

        return { ...sub, module: sourceModule };
      })
    );

    // Filter to site-level modules only
    const siteEligibleModules = agencyModules.filter(
      (sub: any) => sub.module?.install_level === "site"
    );

    // Get modules enabled for this site
    const { data: siteModules } = await supabase
      .from("site_module_installations")
      .select("*")
      .eq("site_id", siteId);

    // Create a map of enabled modules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enabledMap = new Map(siteModules?.map((sm: any) => [sm.module_id, sm]) || []);

    // Combine data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = siteEligibleModules.map((sub: any) => ({
      module: sub.module,
      siteModule: enabledMap.get(sub.module?.id || sub.module_id || ""),
      isEnabled: enabledMap.has(sub.module?.id || sub.module_id || ""),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Site modules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site modules" },
      { status: 500 }
    );
  }
}

// POST - Enable a module for a site
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, settings = {} } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID required" },
        { status: 400 }
      );
    }

    // Verify agency has this module subscribed
    const { data: site } = await supabase
      .from("sites")
      .select("client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (!site?.client?.agency_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const { data: subscription } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select("id")
      .eq("agency_id", site.client.agency_id)
      .eq("module_id", moduleId)
      .eq("status", "active")
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "Module not subscribed. Subscribe in the marketplace first." },
        { status: 400 }
      );
    }

    // Check if already enabled
    const { data: existing } = await supabase
      .from("site_module_installations")
      .select("id")
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("site_module_installations")
        .update({
          is_enabled: true,
          settings,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Create new
    const { data, error } = await supabase
      .from("site_module_installations")
      .insert({
        site_id: siteId,
        module_id: moduleId,
        settings,
        is_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Enable module error:", error);
    return NextResponse.json(
      { error: "Failed to enable module" },
      { status: 500 }
    );
  }
}
