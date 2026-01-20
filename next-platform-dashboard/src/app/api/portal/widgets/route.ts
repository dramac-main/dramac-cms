import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface WidgetConfig {
  type?: "stats" | "chart" | "list" | "custom";
  size?: "small" | "medium" | "large";
  defaultData?: Record<string, unknown>;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check for impersonation cookie (for portal access)
    const cookieStore = await cookies();
    const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
    
    let clientId: string | undefined;
    
    if (impersonatingClientId) {
      // Impersonation mode
      clientId = impersonatingClientId;
    } else {
      // Direct user mode - get from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ widgets: [] });
      }

      clientId = user.user_metadata?.client_id;
    }

    if (!clientId) {
      return NextResponse.json({ widgets: [] });
    }

    // Get installed modules (separate queries - no FK relationship)
    // Note: is_enabled is the correct column, not is_active
    const { data: rawInstallations } = await supabase
      .from("client_module_installations")
      .select("module_id, settings")
      .eq("client_id", clientId)
      .eq("is_enabled", true);

    if (!rawInstallations?.length) {
      return NextResponse.json({ widgets: [] });
    }

    // Fetch modules - widget_config doesn't exist on modules_v2
    // Widget functionality would need to be in the module's manifest JSONB
    const moduleIds = rawInstallations.map((i) => i.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, name, icon, manifest")
      .in("id", moduleIds)
      .eq("is_active", true);

    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));

    // Build widget data from modules that have widget capability in manifest
    const widgets = rawInstallations
      .map((i) => ({ ...i, module: moduleMap.get(i.module_id) || null }))
      .filter((i) => {
        const mod = i.module;
        // Check if module has widget config in manifest
        const manifest = mod?.manifest as Record<string, unknown> | null;
        return manifest?.widget && typeof manifest.widget === "object";
      })
      .map((i) => {
        const mod = i.module!;
        const manifest = mod.manifest as Record<string, unknown>;
        const config = (manifest.widget || {}) as WidgetConfig;
        
        return {
          moduleId: mod.id,
          moduleName: mod.name,
          moduleIcon: mod.icon || "📊",
          widgetType: config.type || "stats",
          widgetSize: config.size || "small",
          data: config.defaultData || {},
        };
      });

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error("Fetch widgets error:", error);
    return NextResponse.json({ widgets: [] });
  }
}
