import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS, type UserRole } from "@/types/roles";

// Database role type (what's actually stored in profiles.role)
type DbRole = "super_admin" | "admin" | "member";

// Agency member role type (what's stored in agency_members.role)
type AgencyMemberRole = "owner" | "admin" | "member";

/**
 * Get the effective UserRole for permission checking.
 * 
 * The database stores:
 * - profiles.role: "super_admin" | "admin" | "member" (platform-level)
 * - agency_members.role: "owner" | "admin" | "member" (agency-level)
 * 
 * This function maps DB roles to conceptual UserRole for ROLE_PERMISSIONS lookup.
 * 
 * IMPORTANT: For super_admin checks, prefer using isSuperAdmin() directly
 * as it's more efficient (single query).
 * 
 * Wrapped in try-catch to prevent server action hangs.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[Permissions] Auth error:", authError.message);
      return null;
    }
    if (!user) {
      console.log("[Permissions] No user found");
      return null;
    }

    // Get profile first
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, agency_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[Permissions] Profile error:", profileError.message);
      return null;
    }
    if (!profile) {
      console.log("[Permissions] No profile found for user:", user.id);
      return null;
    }

    const dbRole = profile.role as DbRole;

    // Platform super_admin takes precedence - fast path
    if (dbRole === "super_admin") {
      return "super_admin";
    }

    // If user has an agency, check their agency role
    if (profile.agency_id) {
      // Get agency membership role (separate query since no direct FK from profiles)
      const { data: membership } = await supabase
        .from("agency_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("agency_id", profile.agency_id)
        .single();

      if (membership) {
        const agencyRole = membership.role as AgencyMemberRole;
        switch (agencyRole) {
          case "owner":
            return "agency_owner";
          case "admin":
            return "agency_admin";
          case "member":
            return "agency_member";
        }
      }

      // User has agency_id but no membership - they might be the owner
      // Check agencies table directly
      const { data: agency } = await supabase
        .from("agencies")
        .select("owner_id")
        .eq("id", profile.agency_id)
        .single();

      if (agency?.owner_id === user.id) {
        return "agency_owner";
      }

      // Has agency but no role - default to member
      return "agency_member";
    }

    // No agency - default to lowest role
    return "agency_member";
  } catch (err) {
    console.error("[Permissions] getCurrentUserRole fatal error:", err);
    return null;
  }
}

export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const role = await getCurrentUserRole();
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  } catch (err) {
    console.error("[Permissions] hasPermission error:", err);
    return false;
  }
}

export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  try {
    const role = await getCurrentUserRole();
    if (!role) return false;

    const userPermissions = ROLE_PERMISSIONS[role];
    return permissions.some((p) => userPermissions.includes(p));
  } catch (err) {
    console.error("[Permissions] hasAnyPermission error:", err);
    return false;
  }
}

export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  try {
    const role = await getCurrentUserRole();
    if (!role) return false;

    const userPermissions = ROLE_PERMISSIONS[role];
    return permissions.every((p) => userPermissions.includes(p));
  } catch (err) {
    console.error("[Permissions] hasAllPermissions error:", err);
    return false;
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const role = await getCurrentUserRole();
    return role === "super_admin";
  } catch (err) {
    console.error("[Permissions] isSuperAdmin error:", err);
    return false;
  }
}

export async function isAgencyOwner(agencyId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (agencyId) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", agencyId)
      .single();
    
    return agency?.owner_id === user.id;
  }

  // Check if user owns any agency
  const { data: ownedAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .single();

  return !!ownedAgency;
}

export async function isAgencyMember(agencyId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("user_id", user.id)
    .single();

  return !!membership;
}

export async function requirePermission(permission: string): Promise<void> {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error("Unauthorized: Missing required permission");
  }
}

export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Super admin access required");
  }
}

export async function requireAgencyOwner(agencyId?: string): Promise<void> {
  const isOwner = await isAgencyOwner(agencyId);
  if (!isOwner) {
    throw new Error("Unauthorized: Agency owner access required");
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function canManageAgency(agencyId: string): Promise<boolean> {
  const isAdmin = await isSuperAdmin();
  if (isAdmin) return true;

  const isOwner = await isAgencyOwner(agencyId);
  if (isOwner) return true;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", user.id)
    .single();

  return membership?.role === "admin";
}
