import { createClient } from "@/lib/supabase/server";
import type { EnabledModule } from "./module-context";
import type { Module } from "@/types/modules";

export async function loadSiteModules(siteId: string): Promise<EnabledModule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_module_installations")
    .select(`
      settings,
      is_enabled,
      module:modules_v2(*)
    `)
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (error || !data) {
    console.error("Failed to load site modules:", error);
    return [];
  }

  return data
    .filter((sm) => sm.module && (sm.is_enabled ?? false))
    .map((sm) => ({
      module: sm.module as unknown as Module,
      settings: (sm.settings as Record<string, unknown>) || {},
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
