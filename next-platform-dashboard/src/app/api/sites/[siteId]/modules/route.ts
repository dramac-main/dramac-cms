import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  executeInstallHook, 
  executeUninstallHook,
  executeEnableHook,
  executeDisableHook 
} from "@/lib/modules/hooks/module-hooks-registry";

// Ensure hooks are initialized
import "@/lib/modules/hooks/init-hooks";

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

    // Create a map of ALL module installations (including disabled)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const installMap = new Map(siteModules?.map((sm: any) => [sm.module_id, sm]) || []);

    // Combine data - check actual is_enabled field, not just record existence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = siteEligibleModules.map((sub: any) => {
      const moduleId = sub.module?.id || sub.module_id || "";
      const siteModule = installMap.get(moduleId);
      return {
        module: sub.module,
        siteModule: siteModule || null,
        // Check actual is_enabled field, not just record existence
        isEnabled: siteModule?.is_enabled === true,
      };
    });

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

    // First, get the module slug for hook execution
    // Hooks are registered by slug (e.g., 'ecommerce'), not UUID
    let moduleSlug: string | null = null;
    const { data: moduleData } = await (supabase as any)
      .from("modules_v2")
      .select("slug")
      .eq("id", moduleId)
      .single();
    
    if (moduleData?.slug) {
      moduleSlug = moduleData.slug;
    } else {
      // Fallback to module_source
      const { data: sourceModule } = await (supabase as any)
        .from("module_source")
        .select("slug")
        .eq("id", moduleId)
        .single();
      moduleSlug = sourceModule?.slug || null;
    }
    
    console.log(`[SiteModules] Module ${moduleId} has slug: ${moduleSlug}`);

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

    // Check if already installed (but maybe disabled)
    const { data: existing } = await supabase
      .from("site_module_installations")
      .select("id, is_enabled")
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .single();

    if (existing) {
      // Re-enable existing installation
      const { data, error } = await supabase
        .from("site_module_installations")
        .update({
          is_enabled: true,
          settings,
          enabled_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      
      // Execute enable hook if module was previously disabled
      // Use the slug for hook execution, not UUID
      if (!existing.is_enabled && moduleSlug) {
        try {
          console.log(`[SiteModules] Executing enable hook for ${moduleSlug} (${moduleId}) on site ${siteId}`);
          const hookResult = await executeEnableHook(moduleSlug, siteId);
          if (!hookResult.success) {
            console.warn(`[SiteModules] Enable hook warning for ${moduleSlug}:`, hookResult.error);
          }
        } catch (hookError) {
          console.error(`[SiteModules] Enable hook error for ${moduleSlug}:`, hookError);
          // Continue - enable succeeded, hook is optional
        }
      }
      
      return NextResponse.json(data);
    }

    // Create new installation
    const { data, error } = await supabase
      .from("site_module_installations")
      .insert({
        site_id: siteId,
        module_id: moduleId,
        settings,
        is_enabled: true,
        installed_at: new Date().toISOString(),
        installed_by: user.id,
        enabled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Execute the install hook for this module (if registered)
    // Use the slug for hook execution, not UUID
    if (moduleSlug) {
      try {
        console.log(`[SiteModules] Executing install hook for ${moduleSlug} (${moduleId}) on site ${siteId}`);
        const hookResult = await executeInstallHook(moduleSlug, siteId, settings);
        
        if (!hookResult.success) {
          console.warn(`[SiteModules] Install hook warning for ${moduleSlug}:`, hookResult.errors);
          // Don't fail - installation succeeded, hook is optional
        } else {
          console.log(`[SiteModules] Install hook executed for ${moduleSlug}:`, {
            pagesCreated: hookResult.pagesCreated?.length ?? 0,
            navItemsAdded: hookResult.navItemsAdded?.length ?? 0,
          });
        }
      } catch (hookError) {
        console.error(`[SiteModules] Install hook error for ${moduleSlug}:`, hookError);
        // Continue - installation succeeded, hook is optional
      }
    } else {
      console.warn(`[SiteModules] No slug found for module ${moduleId}, skipping hooks`);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Enable module error:", error);
    return NextResponse.json(
      { error: "Failed to enable module" },
      { status: 500 }
    );
  }
}
