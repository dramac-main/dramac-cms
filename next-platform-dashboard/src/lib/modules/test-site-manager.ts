"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin, getCurrentUserId } from "@/lib/auth/permissions";

// Types defined directly in this file
export type TestFeature = 
  | "beta_modules" 
  | "experimental_ui" 
  | "debug_mode" 
  | "analytics_testing";

// Internal constant (not exported directly)
const TEST_FEATURES_DATA: { value: TestFeature; label: string; description: string }[] = [
  {
    value: "beta_modules",
    label: "Beta Modules",
    description: "Allow installation of modules in testing status",
  },
  {
    value: "experimental_ui",
    label: "Experimental UI",
    description: "Enable experimental UI features and components",
  },
  {
    value: "debug_mode",
    label: "Debug Mode",
    description: "Show detailed debug information and logs",
  },
  {
    value: "analytics_testing",
    label: "Analytics Testing",
    description: "Enable analytics testing and A/B experiments",
  },
];

// Async getter for TEST_FEATURES (required for "use server")
export async function getTestFeatures(): Promise<typeof TEST_FEATURES_DATA> {
  return TEST_FEATURES_DATA;
}

export interface TestSite {
  id: string;
  siteId: string;
  siteName: string;
  siteSlug: string;
  agencyId: string;
  agencyName: string;
  isActive: boolean;
  testFeatures: string[];
  allowedModuleStatuses: string[];
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface TestSiteCreateOptions {
  testFeatures?: string[];
  allowedStatuses?: string[];
  notes?: string;
  expiresAt?: string;
}

/**
 * Get all test sites with related information
 */
export async function getTestSites(): Promise<TestSite[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("test_site_configuration")
    .select(`
      *,
      site:sites(
        id, 
        name, 
        subdomain,
        agency_id,
        agency:agencies(id, name)
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[TestSiteManager] Error fetching test sites:", error);
    return [];
  }

  return (data || []).map((item: Record<string, unknown>) => {
    const site = item.site as Record<string, unknown> | null;
    const agency = site?.agency as Record<string, unknown> | null;
    
    return {
      id: item.id as string,
      siteId: item.site_id as string,
      siteName: (site?.name as string) || "Unknown",
      siteSlug: (site?.subdomain as string) || "unknown",
      agencyId: (site?.agency_id as string) || "",
      agencyName: (agency?.name as string) || "Unknown Agency",
      isActive: item.is_active as boolean,
      testFeatures: (item.test_features as string[]) || [],
      allowedModuleStatuses: (item.allowed_module_statuses as string[]) || [],
      notes: item.notes as string | null,
      expiresAt: item.expires_at as string | null,
      createdAt: item.created_at as string,
      updatedAt: item.updated_at as string,
      createdBy: item.created_by as string | null,
    };
  });
}

/**
 * Get a single test site configuration
 */
export async function getTestSiteConfig(siteId: string): Promise<TestSite | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("test_site_configuration")
    .select(`
      *,
      site:sites(
        id, 
        name, 
        subdomain,
        agency_id,
        agency:agencies(id, name)
      )
    `)
    .eq("site_id", siteId)
    .single();

  if (error || !data) {
    return null;
  }

  const site = data.site as Record<string, unknown> | null;
  const agency = site?.agency as Record<string, unknown> | null;

  return {
    id: data.id,
    siteId: data.site_id,
    siteName: (site?.name as string) || "Unknown",
    siteSlug: (site?.subdomain as string) || "unknown",
    agencyId: (site?.agency_id as string) || "",
    agencyName: (agency?.name as string) || "Unknown Agency",
    isActive: data.is_active,
    testFeatures: data.test_features || [],
    allowedModuleStatuses: data.allowed_module_statuses || [],
    notes: data.notes,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}

/**
 * Designate a site as a test site
 */
export async function createTestSite(
  siteId: string,
  options: TestSiteCreateOptions = {}
): Promise<{ success: boolean; error?: string; testSite?: TestSite }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify the site exists
  const { data: site, error: siteError } = await db
    .from("sites")
    .select("id, name, subdomain")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    return { success: false, error: "Site not found" };
  }

  const { data, error } = await db
    .from("test_site_configuration")
    .upsert(
      {
        site_id: siteId,
        is_active: true,
        test_features: options.testFeatures || ["beta_modules"],
        allowed_module_statuses: options.allowedStatuses || ["published", "testing"],
        notes: options.notes || null,
        expires_at: options.expiresAt || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[TestSiteManager] Error creating test site:", error);
    return { success: false, error: error.message };
  }

  // Fetch the full test site with relations
  const testSite = await getTestSiteConfig(siteId);

  return { success: true, testSite: testSite || undefined };
}

/**
 * Update test site configuration
 */
export async function updateTestSite(
  siteId: string,
  updates: Partial<TestSiteCreateOptions> & { isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.testFeatures !== undefined) {
    updateData.test_features = updates.testFeatures;
  }
  if (updates.allowedStatuses !== undefined) {
    updateData.allowed_module_statuses = updates.allowedStatuses;
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes;
  }
  if (updates.expiresAt !== undefined) {
    updateData.expires_at = updates.expiresAt;
  }
  if (updates.isActive !== undefined) {
    updateData.is_active = updates.isActive;
  }

  const { error } = await db
    .from("test_site_configuration")
    .update(updateData)
    .eq("site_id", siteId);

  if (error) {
    console.error("[TestSiteManager] Error updating test site:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove test site status (soft delete)
 */
export async function removeTestSite(
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("test_site_configuration")
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId);

  if (error) {
    console.error("[TestSiteManager] Error removing test site:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Permanently delete test site configuration
 */
export async function deleteTestSite(
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("test_site_configuration")
    .delete()
    .eq("site_id", siteId);

  if (error) {
    console.error("[TestSiteManager] Error deleting test site:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a site can use testing modules
 */
export async function canSiteUseTestingModules(siteId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("test_site_configuration")
    .select("is_active, allowed_module_statuses, expires_at")
    .eq("site_id", siteId)
    .single();

  if (error || !data || !data.is_active) {
    return false;
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return data.allowed_module_statuses?.includes("testing") ?? false;
}

/**
 * Check if a site has a specific test feature enabled
 */
export async function hasSiteTestFeature(
  siteId: string,
  feature: TestFeature
): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("test_site_configuration")
    .select("is_active, test_features, expires_at")
    .eq("site_id", siteId)
    .single();

  if (error || !data || !data.is_active) {
    return false;
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return data.test_features?.includes(feature) ?? false;
}

/**
 * Get modules available for a site (respects test site status)
 */
export async function getAvailableModulesForSite(siteId: string): Promise<{
  published: Array<Record<string, unknown>>;
  testing: Array<Record<string, unknown>>;
  isTestSite: boolean;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if test site
  const isTestSite = await canSiteUseTestingModules(siteId);

  // Get published modules (always available)
  const { data: published } = await db
    .from("modules")
    .select("*")
    .eq("is_active", true);

  // Get testing modules (only for test sites)
  let testing: Array<Record<string, unknown>> = [];
  if (isTestSite) {
    const { data: testingModules } = await db
      .from("module_source")
      .select("*")
      .eq("status", "testing");

    testing = testingModules || [];
  }

  return {
    published: published || [],
    testing,
    isTestSite,
  };
}

/**
 * Get all sites that can be designated as test sites
 * (for the site selector dropdown)
 */
export async function getAvailableSitesForTesting(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    agencyName: string;
    isTestSite: boolean;
  }>
> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return [];
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get all active sites with their agencies
  const { data: sites, error } = await db
    .from("sites")
    .select(`
      id,
      name,
      subdomain,
      agency:agencies(name)
    `)
    .order("name");

  if (error || !sites) {
    console.error("[TestSiteManager] Error fetching sites:", error);
    return [];
  }

  // Get existing test site configurations
  const { data: testConfigs } = await db
    .from("test_site_configuration")
    .select("site_id")
    .eq("is_active", true);

  const testSiteIds = new Set(
    (testConfigs || []).map((c: { site_id: string }) => c.site_id)
  );

  return sites.map((site: Record<string, unknown>) => {
    const agency = site.agency as Record<string, unknown> | null;
    return {
      id: site.id as string,
      name: site.name as string,
      slug: site.subdomain as string,
      agencyName: (agency?.name as string) || "Unknown Agency",
      isTestSite: testSiteIds.has(site.id as string),
    };
  });
}

/**
 * Get test site statistics
 */
export async function getTestSiteStats(): Promise<{
  totalTestSites: number;
  activeTestSites: number;
  expiredTestSites: number;
  sitesWithBetaModules: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: configs } = await db
    .from("test_site_configuration")
    .select("is_active, expires_at, test_features");

  if (!configs) {
    return {
      totalTestSites: 0,
      activeTestSites: 0,
      expiredTestSites: 0,
      sitesWithBetaModules: 0,
    };
  }

  const now = new Date();
  let activeCount = 0;
  let expiredCount = 0;
  let betaModulesCount = 0;

  for (const config of configs) {
    if (config.is_active) {
      if (config.expires_at && new Date(config.expires_at) < now) {
        expiredCount++;
      } else {
        activeCount++;
        if (config.test_features?.includes("beta_modules")) {
          betaModulesCount++;
        }
      }
    }
  }

  return {
    totalTestSites: configs.length,
    activeTestSites: activeCount,
    expiredTestSites: expiredCount,
    sitesWithBetaModules: betaModulesCount,
  };
}
