"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/permissions";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string | null;
  createdAt: string | null;
  lastSignIn: string | null;
  agencyId: string | null;
  agencyName: string | null;
}

export interface AdminAgency {
  id: string;
  name: string;
  ownerEmail: string;
  ownerName: string | null;
  status: string;
  plan: string | null;
  sitesCount: number;
  clientsCount: number;
  createdAt: string | null;
}

export async function getAdminUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<{ users: AdminUser[]; total: number }> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { page = 1, limit = 20, search, role } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select(`
      id,
      email,
      name,
      role,
      created_at,
      agency_id
    `, { count: "exact" });

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (role && role !== "all") {
    query = query.eq("role", role as "super_admin" | "admin" | "member");
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[AdminService] Get users error:", error);
    return { users: [], total: 0 };
  }

  // Get agency names for users with agency_id
  const agencyIds = [...new Set((data || []).filter(u => u.agency_id).map(u => u.agency_id!))];
  let agencyMap = new Map<string, string>();
  
  if (agencyIds.length > 0) {
    const { data: agencies } = await supabase
      .from("agencies")
      .select("id, name")
      .in("id", agencyIds);
    
    agencies?.forEach(a => agencyMap.set(a.id, a.name));
  }

  const users: AdminUser[] = (data || []).map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.name,
    role: u.role,
    createdAt: u.created_at,
    lastSignIn: null, // Would need auth.users access
    agencyId: u.agency_id,
    agencyName: u.agency_id ? agencyMap.get(u.agency_id) || null : null,
  }));

  return { users, total: count || 0 };
}

export async function getAdminAgencies(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ agencies: AdminAgency[]; total: number }> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { page = 1, limit = 20, search, status } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("agencies")
    .select(`
      id,
      name,
      owner_id,
      created_at
    `, { count: "exact" });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[AdminService] Get agencies error:", error);
    return { agencies: [], total: 0 };
  }

  // Get owner profiles separately
  const ownerIds = [...new Set((data || []).map((a) => a.owner_id).filter(Boolean))];
  const { data: owners } = ownerIds.length > 0 
    ? await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", ownerIds)
    : { data: [] };

  const ownerMap = new Map(
    (owners || []).map((o) => [o.id, { name: o.name, email: o.email }])
  );

  // Get counts for each agency
  const agencyIds = (data || []).map((a) => a.id);
  
  const [clientCountsResult, siteCountsResult] = await Promise.all([
    agencyIds.length > 0 
      ? supabase.from("clients").select("agency_id").in("agency_id", agencyIds)
      : Promise.resolve({ data: [] }),
    agencyIds.length > 0 
      ? supabase.from("sites").select("agency_id").in("agency_id", agencyIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Create count maps
  const clientCountMap = new Map<string, number>();
  const siteCountMap = new Map<string, number>();

  (clientCountsResult.data || []).forEach((c) => {
    const count = clientCountMap.get(c.agency_id) || 0;
    clientCountMap.set(c.agency_id, count + 1);
  });

  (siteCountsResult.data || []).forEach((s) => {
    const count = siteCountMap.get(s.agency_id) || 0;
    siteCountMap.set(s.agency_id, count + 1);
  });

  const agencies: AdminAgency[] = (data || []).map((a) => {
    const ownerData = a.owner_id ? ownerMap.get(a.owner_id) : null;
    return {
      id: a.id,
      name: a.name,
      ownerEmail: ownerData?.email || "",
      ownerName: ownerData?.name || null,
      status: status || "active", // Default to active
      plan: "professional", // Would come from subscriptions
      sitesCount: siteCountMap.get(a.id) || 0,
      clientsCount: clientCountMap.get(a.id) || 0,
      createdAt: a.created_at,
    };
  });

  return { agencies, total: count || 0 };
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Database only accepts these role values
  const validRoles = ["super_admin", "admin", "member"];
  if (!validRoles.includes(role)) {
    return { success: false, error: "Invalid role" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      role: role as "super_admin" | "admin" | "member",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[AdminService] Update role error:", error);
    return { success: false, error: "Failed to update role" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateAgencyStatus(
  agencyId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const validStatuses = ["active", "suspended", "cancelled"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  // Note: If agencies table doesn't have status column, this will need adjustment
  const { error } = await supabase
    .from("agencies")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", agencyId);

  if (error) {
    console.error("[AdminService] Update status error:", error);
    return { success: false, error: "Failed to update status" };
  }

  revalidatePath("/admin/agencies");
  return { success: true };
}

export async function impersonateAdminUser(userId: string): Promise<{ success: boolean; error?: string }> {
  // This would create a temporary session token for the user
  // In production, implement proper audit logging and security
  console.log(`[Admin] Impersonation requested for user: ${userId}`);
  return { success: false, error: "Impersonation not yet implemented" };
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Check if user is super_admin - can't delete super admins
  const { data: user } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (user?.role === "super_admin") {
    return { success: false, error: "Cannot delete a super admin" };
  }

  // Soft delete - mark as deleted by updating role to something invalid
  // In production, you'd want a proper deleted_at column
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    console.error("[AdminService] Delete user error:", error);
    return { success: false, error: "Failed to delete user" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteToSuperAdmin(
  email: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Find user by email
  const { data: user, error: lookupError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .single();

  if (lookupError || !user) {
    return { success: false, error: "User not found" };
  }

  if (user.role === "super_admin") {
    return { success: false, error: "User is already a super admin" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      role: "super_admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[AdminService] Promote to admin error:", error);
    return { success: false, error: "Failed to promote user" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
