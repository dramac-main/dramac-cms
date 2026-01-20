import { createClient } from "@/lib/supabase/server";
import type { EnabledModule } from "./module-context";
import type { Module } from "@/types/modules";

export async function loadSiteModules(siteId: string): Promise<EnabledModule[]> {
  const supabase = await createClient();

  // Fetch installations separately (FK was dropped for testing modules)
  const { data: installations, error: installError } = await supabase
    .from("site_module_installations")
    .select("module_id, settings, is_enabled")
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (installError || !installations?.length) {
    if (installError) console.error("Failed to load site module installations:", installError);
    return [];
  }

  // Fetch modules separately
  const moduleIds = installations.map((i) => i.module_id);
  const { data: modules, error: modulesError } = await supabase
    .from("modules_v2")
    .select("*")
    .in("id", moduleIds)
    .eq("is_active", true);

  if (modulesError || !modules) {
    console.error("Failed to load modules:", modulesError);
    return [];
  }

  // Create module map
  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  return installations
    .filter((inst) => moduleMap.has(inst.module_id) && (inst.is_enabled ?? false))
    .map((inst) => ({
      module: moduleMap.get(inst.module_id) as unknown as Module,
      settings: (inst.settings as Record<string, unknown>) || {},
    }));
}

// Load modules for client-side (from API)
export async function fetchSiteModules(siteId: string): Promise<EnabledModule[]> {
  try {
    const response = await fetch(`/api/sites/${siteId}/modules/enabled`);
    if (!response.ok) throw new Error("Failed to fetch modules");
    return response.json();
  } catch (error) {
    console.error("Failed to fetch site modules:", error);
    return [];
  }
}
