"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin, getCurrentUserId } from "@/lib/auth/permissions";

// Types defined directly in this file (not imported from testing-constants)
export type BetaTier = "internal" | "alpha" | "early_access" | "standard";

export interface BetaTierInfo {
  name: string;
  description: string;
  color: string;
  badgeVariant: "destructive" | "default" | "secondary" | "outline";
  priority: number;
}

// Constants must be retrieved via async function in "use server" files
const BETA_TIERS_DATA: Record<BetaTier, BetaTierInfo> = {
  internal: {
    name: "Internal",
    description: "DRAMAC team members - all features immediately",
    color: "red",
    badgeVariant: "destructive",
    priority: 1,
  },
  alpha: {
    name: "Alpha",
    description: "Earliest access, may have bugs",
    color: "orange",
    badgeVariant: "default",
    priority: 2,
  },
  early_access: {
    name: "Early Access",
    description: "Pre-release features, mostly stable",
    color: "yellow",
    badgeVariant: "secondary",
    priority: 3,
  },
  standard: {
    name: "Standard Beta",
    description: "Stable beta features, opt-in per module",
    color: "blue",
    badgeVariant: "outline",
    priority: 4,
  },
};

// Async getter for BETA_TIERS (required for "use server")
export async function getBetaTiers(): Promise<Record<BetaTier, BetaTierInfo>> {
  return BETA_TIERS_DATA;
}

// Async getter for specific tier info
export async function getBetaTierInfo(tier: BetaTier): Promise<BetaTierInfo> {
  return BETA_TIERS_DATA[tier] || BETA_TIERS_DATA.standard;
}

export interface BetaEnrollment {
  id: string;
  agencyId: string;
  agencyName: string;
  betaTier: BetaTier;
  enrolledAt: string;
  enrolledBy: string | null;
  isActive: boolean;
  acceptedModules: string[];
  preferences: BetaPreferences;
}

export interface BetaPreferences {
  receiveNotifications?: boolean;
  autoEnrollNewBetas?: boolean;
  emailDigest?: "daily" | "weekly" | "none";
}

/**
 * Get all beta enrollments with agency details
 */
export async function getBetaEnrollments(): Promise<BetaEnrollment[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("beta_enrollment")
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .eq("is_active", true)
    .order("enrolled_at", { ascending: false });

  if (error) {
    console.error("[BetaProgram] Error fetching enrollments:", error);
    return [];
  }


  return (data || []).map((item: Record<string, unknown>) => {
    const agency = item.agency as Record<string, unknown> | null;
    return {
      id: item.id as string,
      agencyId: item.agency_id as string,
      agencyName: (agency?.name as string) || "Unknown",
      betaTier: item.beta_tier as BetaTier,
      enrolledAt: item.enrolled_at as string,
      enrolledBy: item.enrolled_by as string | null,
      isActive: item.is_active as boolean,
      acceptedModules: (item.accepted_modules as string[]) || [],
      preferences: (item.preferences as BetaPreferences) || {},
    };
  });
}

/**
 * Get a single beta enrollment by agency ID
 */
export async function getBetaEnrollment(
  agencyId: string
): Promise<BetaEnrollment | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("beta_enrollment")
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .eq("agency_id", agencyId)
    .single();

  if (error || !data) {
    return null;
  }

  const agency = data.agency as Record<string, unknown> | null;
  return {
    id: data.id,
    agencyId: data.agency_id,
    agencyName: (agency?.name as string) || "Unknown",
    betaTier: data.beta_tier as BetaTier,
    enrolledAt: data.enrolled_at,
    enrolledBy: data.enrolled_by,
    isActive: data.is_active,
    acceptedModules: data.accepted_modules || [],
    preferences: data.preferences || {},
  };
}

/**
 * Enroll agency in beta program
 */
export async function enrollAgencyInBeta(
  agencyId: string,
  tier: BetaTier = "standard",
  preferences?: Partial<BetaPreferences>
): Promise<{ success: boolean; error?: string; enrollment?: BetaEnrollment }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify agency exists
  const { data: agency, error: agencyError } = await db
    .from("agencies")
    .select("id, name")
    .eq("id", agencyId)
    .single();

  if (agencyError || !agency) {
    return { success: false, error: "Agency not found" };
  }

  const defaultPreferences: BetaPreferences = {
    receiveNotifications: true,
    autoEnrollNewBetas: false,
    emailDigest: "weekly",
    ...preferences,
  };

  const { data, error } = await db
    .from("beta_enrollment")
    .upsert(
      {
        agency_id: agencyId,
        beta_tier: tier,
        enrolled_by: userId,
        is_active: true,
        preferences: defaultPreferences,
        enrolled_at: new Date().toISOString(),
      },
      { onConflict: "agency_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[BetaProgram] Error enrolling agency:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    enrollment: {
      id: data.id,
      agencyId: data.agency_id,
      agencyName: agency.name,
      betaTier: data.beta_tier,
      enrolledAt: data.enrolled_at,
      enrolledBy: data.enrolled_by,
      isActive: data.is_active,
      acceptedModules: data.accepted_modules || [],
      preferences: data.preferences || {},
    },
  };
}

/**
 * Update beta enrollment
 */
export async function updateBetaEnrollment(
  agencyId: string,
  updates: {
    tier?: BetaTier;
    isActive?: boolean;
    preferences?: Partial<BetaPreferences>;
  }
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get current enrollment for preferences merge
  const { data: current } = await db
    .from("beta_enrollment")
    .select("preferences")
    .eq("agency_id", agencyId)
    .single();

  const updateData: Record<string, unknown> = {};

  if (updates.tier !== undefined) {
    updateData.beta_tier = updates.tier;
  }
  if (updates.isActive !== undefined) {
    updateData.is_active = updates.isActive;
  }
  if (updates.preferences !== undefined) {
    updateData.preferences = {
      ...(current?.preferences || {}),
      ...updates.preferences,
    };
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { error } = await db
    .from("beta_enrollment")
    .update(updateData)
    .eq("agency_id", agencyId);

  if (error) {
    console.error("[BetaProgram] Error updating enrollment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove agency from beta program (soft delete)
 */
export async function removeAgencyFromBeta(
  agencyId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("beta_enrollment")
    .update({ is_active: false })
    .eq("agency_id", agencyId);

  if (error) {
    console.error("[BetaProgram] Error removing agency:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Opt agency into specific beta module
 */
export async function optIntoModule(
  agencyId: string,
  moduleSlug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get current enrollment
  const { data: enrollment, error: fetchError } = await db
    .from("beta_enrollment")
    .select("accepted_modules")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .single();

  if (fetchError || !enrollment) {
    return { success: false, error: "Agency not enrolled in beta program" };
  }

  const currentModules: string[] = enrollment.accepted_modules || [];
  
  // Already opted in
  if (currentModules.includes(moduleSlug)) {
    return { success: true };
  }

  const { error } = await db
    .from("beta_enrollment")
    .update({
      accepted_modules: [...currentModules, moduleSlug],
    })
    .eq("agency_id", agencyId);

  if (error) {
    console.error("[BetaProgram] Error opting into module:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Opt agency out of specific beta module
 */
export async function optOutOfModule(
  agencyId: string,
  moduleSlug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get current enrollment
  const { data: enrollment, error: fetchError } = await db
    .from("beta_enrollment")
    .select("accepted_modules")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .single();

  if (fetchError || !enrollment) {
    return { success: false, error: "Agency not enrolled in beta program" };
  }

  const currentModules: string[] = enrollment.accepted_modules || [];
  const updatedModules = currentModules.filter((m) => m !== moduleSlug);

  // Nothing to change
  if (currentModules.length === updatedModules.length) {
    return { success: true };
  }

  const { error } = await db
    .from("beta_enrollment")
    .update({
      accepted_modules: updatedModules,
    })
    .eq("agency_id", agencyId);

  if (error) {
    console.error("[BetaProgram] Error opting out of module:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if agency can access a testing module
 */
export async function canAgencyAccessModule(
  agencyId: string,
  moduleSlug: string,
  moduleStatus: string
): Promise<boolean> {
  // Published modules are always accessible
  if (moduleStatus === "published") {
    return true;
  }

  // Draft modules are never accessible to agencies
  if (moduleStatus === "draft") {
    return false;
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: enrollment, error } = await db
    .from("beta_enrollment")
    .select("beta_tier, accepted_modules, preferences")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .single();

  if (error || !enrollment) {
    return false;
  }

  // Internal/alpha tiers can access all testing modules
  if (["internal", "alpha"].includes(enrollment.beta_tier)) {
    return true;
  }

  // Early access with auto-enroll preference
  if (enrollment.preferences?.autoEnrollNewBetas) {
    return true;
  }

  // Standard/early_access need to explicitly opt in
  return enrollment.accepted_modules?.includes(moduleSlug) ?? false;
}

/**
 * Get all agencies that can be enrolled in beta
 * (for the agency selector dropdown)
 */
export async function getAvailableAgenciesForBeta(): Promise<
  Array<{
    id: string;
    name: string;
    ownerEmail: string | null;
    isEnrolled: boolean;
    currentTier?: BetaTier;
  }>
> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return [];
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get all agencies
  const { data: agencies, error } = await db
    .from("agencies")
    .select(`
      id,
      name,
      owner_id
    `)
    .order("name");

  if (error || !agencies) {
    console.error("[BetaProgram] Error fetching agencies:", error);
    return [];
  }

  // Get owner emails from profiles
  const ownerIds = agencies.map((a: Record<string, unknown>) => a.owner_id).filter(Boolean);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email")
    .in("id", ownerIds);

  const profileMap = new Map<string, string>();
  (profiles || []).forEach((p: { id: string; email: string }) => {
    profileMap.set(p.id, p.email);
  });

  // Get existing enrollments
  const { data: enrollments } = await db
    .from("beta_enrollment")
    .select("agency_id, beta_tier")
    .eq("is_active", true);

  const enrollmentMap = new Map<string, BetaTier>();
  (enrollments || []).forEach((e: { agency_id: string; beta_tier: BetaTier }) => {
    enrollmentMap.set(e.agency_id, e.beta_tier);
  });

  return agencies.map((agency: Record<string, unknown>) => {
    const isEnrolled = enrollmentMap.has(agency.id as string);
    return {
      id: agency.id as string,
      name: agency.name as string,
      ownerEmail: profileMap.get(agency.owner_id as string) || null,
      isEnrolled,
      currentTier: isEnrolled ? enrollmentMap.get(agency.id as string) : undefined,
    };
  });
}

/**
 * Get beta program statistics
 */
export async function getBetaProgramStats(): Promise<{
  totalEnrollments: number;
  activeEnrollments: number;
  enrollmentsByTier: Record<BetaTier, number>;
  modulesWithBetaTesters: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: enrollments } = await db
    .from("beta_enrollment")
    .select("is_active, beta_tier, accepted_modules");

  if (!enrollments) {
    return {
      totalEnrollments: 0,
      activeEnrollments: 0,
      enrollmentsByTier: {
        internal: 0,
        alpha: 0,
        early_access: 0,
        standard: 0,
      },
      modulesWithBetaTesters: 0,
    };
  }

  const tierCounts: Record<BetaTier, number> = {
    internal: 0,
    alpha: 0,
    early_access: 0,
    standard: 0,
  };

  const allModules = new Set<string>();
  let activeCount = 0;

  for (const enrollment of enrollments) {
    if (enrollment.is_active) {
      activeCount++;
      tierCounts[enrollment.beta_tier as BetaTier]++;
      (enrollment.accepted_modules || []).forEach((m: string) => allModules.add(m));
    }
  }

  return {
    totalEnrollments: enrollments.length,
    activeEnrollments: activeCount,
    enrollmentsByTier: tierCounts,
    modulesWithBetaTesters: allModules.size,
  };
}

/**
 * Get testing modules available to a beta-enrolled agency
 */
export async function getTestingModulesForAgency(
  agencyId: string
): Promise<Array<Record<string, unknown>>> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get enrollment
  const { data: enrollment } = await db
    .from("beta_enrollment")
    .select("beta_tier, accepted_modules, preferences")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .single();

  if (!enrollment) {
    return [];
  }

  // Get all testing modules
  const { data: testingModules } = await db
    .from("module_source")
    .select("*")
    .eq("status", "testing");

  if (!testingModules) {
    return [];
  }

  // Internal/alpha get all
  if (["internal", "alpha"].includes(enrollment.beta_tier)) {
    return testingModules;
  }

  // Auto-enroll gets all
  if (enrollment.preferences?.autoEnrollNewBetas) {
    return testingModules;
  }

  // Filter to opted-in modules
  const acceptedSlugs = new Set(enrollment.accepted_modules || []);
  return testingModules.filter((m: { slug: string }) =>
    acceptedSlugs.has(m.slug)
  );
}
