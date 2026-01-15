import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS, type UserRole } from "@/types/roles";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole) || null;
}

export async function hasPermission(permission: string): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const userPermissions = ROLE_PERMISSIONS[role];
  return permissions.some((p) => userPermissions.includes(p));
}

export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;

  const userPermissions = ROLE_PERMISSIONS[role];
  return permissions.every((p) => userPermissions.includes(p));
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "super_admin";
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
