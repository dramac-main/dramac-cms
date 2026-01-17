"use server";

import { createClient } from "@/lib/supabase/server";
import type { ModuleDefinition, ModuleCategory } from "./module-types";
import { MODULE_CATALOG } from "./module-catalog";

/**
 * Server actions for loading dynamic modules from the database
 * These can be called from Server Components to get modules from Module Studio
 */

/**
 * Get all published modules from the Module Studio database
 */
export async function getPublishedStudioModules(): Promise<ModuleDefinition[]> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("module_source")
      .select("*")
      .eq("status", "published");

    if (error) {
      console.error("[ModuleRegistry] Error loading published modules:", error);
      return [];
    }

    return (data || []).map((m: Record<string, unknown>): ModuleDefinition => ({
      id: m.module_id as string,
      name: m.name as string,
      slug: m.slug as string,
      description: (m.description as string) || "",
      icon: (m.icon as string) || "📦",
      category: (m.category as ModuleCategory) || "other",
      version: (m.published_version as string) || "1.0.0",
      status: "active",
      tags: [],
      pricing: {
        type: "free", // Studio modules use tier-based pricing system
        amount: 0,
        currency: "USD",
      },
      author: {
        name: "DRAMAC",
        verified: true,
      },
      createdAt: new Date(m.created_at as string),
      updatedAt: new Date(m.updated_at as string),
      installCount: 0,
      rating: 5,
      settingsSchema: m.settings_schema as Record<string, unknown> || {},
      defaultSettings: m.default_settings as Record<string, unknown> || {},
      dependencies: (m.dependencies as string[]) || [],
      source: "studio" as const,
      renderCode: m.render_code as string,
      styles: m.styles as string,
    }));
  } catch (error) {
    console.error("[ModuleRegistry] Error:", error);
    return [];
  }
}

/**
 * Get modules in testing status (for super admin / test sites)
 */
export async function getTestingStudioModules(): Promise<ModuleDefinition[]> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("module_source")
      .select("*")
      .eq("status", "testing");

    if (error) {
      console.error("[ModuleRegistry] Error loading testing modules:", error);
      return [];
    }

    return (data || []).map((m: Record<string, unknown>): ModuleDefinition => ({
      id: m.module_id as string,
      name: m.name as string,
      slug: m.slug as string,
      description: (m.description as string) || "",
      icon: (m.icon as string) || "📦",
      category: (m.category as ModuleCategory) || "other",
      version: (m.latest_version as string) || "0.0.1",
      status: "beta",
      tags: ["testing"],
      pricing: {
        type: "free",
        amount: 0,
        currency: "USD",
      },
      author: {
        name: "DRAMAC",
        verified: true,
      },
      createdAt: new Date(m.created_at as string),
      updatedAt: new Date(m.updated_at as string),
      installCount: 0,
      source: "studio" as const,
      renderCode: m.render_code as string,
      styles: m.styles as string,
      settingsSchema: m.settings_schema as Record<string, unknown> || {},
      defaultSettings: m.default_settings as Record<string, unknown> || {},
      dependencies: (m.dependencies as string[]) || [],
    }));
  } catch (error) {
    console.error("[ModuleRegistry] Error:", error);
    return [];
  }
}

/**
 * Get all modules: static catalog + published studio modules
 */
export async function getAllModules(): Promise<ModuleDefinition[]> {
  const staticModules = [...MODULE_CATALOG];
  const dynamicModules = await getPublishedStudioModules();
  
  // Merge with dynamic modules taking precedence for same ID
  const moduleMap = new Map<string, ModuleDefinition>();
  
  staticModules.forEach((m) => moduleMap.set(m.id, m));
  dynamicModules.forEach((m) => moduleMap.set(m.id, m));
  
  return Array.from(moduleMap.values());
}

/**
 * Get all modules including testing (for super admin view)
 */
export async function getAllModulesIncludingTesting(): Promise<{
  published: ModuleDefinition[];
  testing: ModuleDefinition[];
}> {
  const [publishedModules, testingModules] = await Promise.all([
    getAllModules(),
    getTestingStudioModules(),
  ]);
  
  return {
    published: publishedModules,
    testing: testingModules,
  };
}

/**
 * Get a single module by ID from any source
 */
export async function getModuleById(moduleId: string): Promise<ModuleDefinition | null> {
  // Check static catalog first
  const staticModule = MODULE_CATALOG.find((m) => m.id === moduleId);
  
  // Check database for studio module (may override static)
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("module_source")
      .select("*")
      .eq("module_id", moduleId)
      .in("status", ["published", "testing"])
      .single();

    if (!error && data) {
      return {
        id: data.module_id as string,
        name: data.name as string,
        slug: data.slug as string,
        description: (data.description as string) || "",
        icon: (data.icon as string) || "📦",
        category: (data.category as ModuleCategory) || "other",
        version: (data.published_version || data.latest_version || "1.0.0") as string,
        status: data.status === "testing" ? "beta" : "active",
        tags: data.status === "testing" ? ["testing"] : [],
        pricing: {
          type: "free",
          amount: 0,
          currency: "USD",
        },
        author: {
          name: "DRAMAC",
          verified: true,
        },
        createdAt: new Date(data.created_at as string),
        updatedAt: new Date(data.updated_at as string),
        installCount: 0,
        source: "studio" as const,
        renderCode: data.render_code as string,
        styles: data.styles as string,
        settingsSchema: data.settings_schema as Record<string, unknown> || {},
        defaultSettings: data.default_settings as Record<string, unknown> || {},
        dependencies: (data.dependencies as string[]) || [],
      };
    }
  } catch (error) {
    console.error("[ModuleRegistry] Error fetching module by ID:", error);
  }
  
  // Return static module if no studio module found
  return staticModule || null;
}

/**
 * Check if a module exists and is available (published or testing)
 */
export async function isModuleAvailable(
  moduleId: string, 
  includeTestingModules: boolean = false
): Promise<boolean> {
  // Check static
  if (MODULE_CATALOG.some((m) => m.id === moduleId)) {
    return true;
  }
  
  // Check database
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const statuses = includeTestingModules ? ["published", "testing"] : ["published"];
    
    const { data, error } = await db
      .from("module_source")
      .select("id")
      .eq("module_id", moduleId)
      .in("status", statuses)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
