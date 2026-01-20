import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();

    // Fetch installations separately (no FK relationship after migration)
    const { data: installations, error: installError } = await supabase
      .from("site_module_installations")
      .select("module_id, settings")
      .eq("site_id", siteId)
      .eq("is_enabled", true);

    if (installError) throw installError;

    if (!installations?.length) {
      return NextResponse.json([]);
    }

    // Fetch modules separately
    const moduleIds = installations.map((i) => i.module_id);
    const { data: modules, error: modulesError } = await supabase
      .from("modules_v2")
      .select("*")
      .in("id", moduleIds)
      .eq("is_active", true);

    if (modulesError) throw modulesError;

    // Create module map for lookup
    const moduleMap = new Map(modules?.map((m) => [m.id, m]) || []);

    const enabledModules = installations
      .filter((inst) => moduleMap.has(inst.module_id))
      .map((inst) => ({
        module: moduleMap.get(inst.module_id)!,
        settings: inst.settings || {},
      }));

    return NextResponse.json(enabledModules);
  } catch (error) {
    console.error("Error fetching enabled modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}
