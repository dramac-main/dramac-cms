import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface WidgetConfig {
  type?: "stats" | "chart" | "list" | "custom";
  size?: "small" | "medium" | "large";
  defaultData?: Record<string, unknown>;
}

interface Installation {
  settings: Record<string, unknown>;
  module: {
    id: string;
    name: string;
    icon: string;
    widget_config: WidgetConfig | null;
  } | null;
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
    const { data: rawInstallations } = await supabase
      .from("client_module_installations")
      .select("module_id, settings")
      .eq("client_id", clientId)
      .eq("is_active", true);

    if (!rawInstallations?.length) {
      return NextResponse.json({ widgets: [] });
    }

    // Fetch modules with widget config
    const moduleIds = rawInstallations.map((i) => i.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, name, icon, widget_config")
      .in("id", moduleIds)
      .eq("is_active", true);

    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));

    // Build widget data from modules that have widget_config
    const widgets = rawInstallations
      .map((i) => ({ ...i, module: moduleMap.get(i.module_id) || null }))
      .filter((i) => {
        const mod = i.module;
        return mod?.widget_config && typeof mod.widget_config === "object";
      })
      .map((i) => {
        const mod = i.module!;
        const config = mod.widget_config as WidgetConfig;
        
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
