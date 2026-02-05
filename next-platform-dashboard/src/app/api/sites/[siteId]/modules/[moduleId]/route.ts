import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  executeEnableHook, 
  executeDisableHook,
  executeInstallHook,
} from "@/lib/modules/hooks/module-hooks-registry";

// Ensure hooks are initialized
import "@/lib/modules/hooks/init-hooks";

interface RouteContext {
  params: Promise<{ siteId: string; moduleId: string }>;
}

/**
 * Helper function to get module slug from UUID
 * Hooks are registered by slug (e.g., 'ecommerce'), not UUID
 */
async function getModuleSlug(supabase: any, moduleId: string): Promise<string | null> {
  // Try modules_v2 first
  const { data: moduleData } = await supabase
    .from("modules_v2")
    .select("slug")
    .eq("id", moduleId)
    .single();
  
  if (moduleData?.slug) {
    return moduleData.slug;
  }
  
  // Fallback to module_source
  const { data: sourceModule } = await supabase
    .from("module_source")
    .select("slug")
    .eq("id", moduleId)
    .single();
  
  return sourceModule?.slug || null;
}

// PATCH - Update module settings or toggle enable/disable
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { siteId, moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled, settings } = body;

    // Get module slug for hook execution
    const moduleSlug = await getModuleSlug(supabase as any, moduleId);
    console.log(`[SiteModules] Module ${moduleId} has slug: ${moduleSlug}`);

    // Get current state to check if we need to run hooks
    const { data: currentState } = await supabase
      .from("site_module_installations")
      .select("is_enabled")
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .single();

    const wasEnabled = currentState?.is_enabled === true;
    const willBeEnabled = typeof isEnabled === "boolean" ? isEnabled : wasEnabled;

    const updates: Record<string, unknown> = {};
    if (typeof isEnabled === "boolean") {
      updates.is_enabled = isEnabled;
      if (isEnabled) {
        updates.enabled_at = new Date().toISOString();
      }
    }
    if (settings) updates.settings = settings;

    const { data, error } = await supabase
      .from("site_module_installations")
      .update(updates)
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .select()
      .single();

    if (error) throw error;

    // Execute enable/disable hooks if status changed (using slug, not UUID)
    if (moduleSlug) {
      if (!wasEnabled && willBeEnabled) {
        try {
          console.log(`[SiteModules] Executing enable hook for ${moduleSlug} (${moduleId}) on site ${siteId}`);
          // For re-enabling, also run install hook to ensure pages exist
          await executeInstallHook(moduleSlug, siteId, settings || {});
          await executeEnableHook(moduleSlug, siteId);
        } catch (hookError) {
          console.error(`[SiteModules] Enable hook error:`, hookError);
        }
      } else if (wasEnabled && !willBeEnabled) {
        try {
          console.log(`[SiteModules] Executing disable hook for ${moduleSlug} (${moduleId}) on site ${siteId}`);
          await executeDisableHook(moduleSlug, siteId);
        } catch (hookError) {
          console.error(`[SiteModules] Disable hook error:`, hookError);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

// DELETE - Disable module for site
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { siteId, moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get module slug for hook execution
    const moduleSlug = await getModuleSlug(supabase as any, moduleId);
    console.log(`[SiteModules] Module ${moduleId} has slug: ${moduleSlug}`);

    const { error } = await supabase
      .from("site_module_installations")
      .update({ is_enabled: false })
      .eq("site_id", siteId)
      .eq("module_id", moduleId);

    if (error) throw error;

    // Execute disable hook using slug
    if (moduleSlug) {
      try {
        console.log(`[SiteModules] Executing disable hook for ${moduleSlug} (${moduleId}) on site ${siteId}`);
        await executeDisableHook(moduleSlug, siteId);
      } catch (hookError) {
        console.error(`[SiteModules] Disable hook error:`, hookError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disable module error:", error);
    return NextResponse.json(
      { error: "Failed to disable module" },
      { status: 500 }
    );
  }
}
