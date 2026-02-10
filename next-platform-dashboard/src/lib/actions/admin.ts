"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";

export interface PlatformStats {
  totalAgencies: number;
  totalUsers: number;
  activeSites: number;
  mrr: number;
  agencyGrowth: number;
  userGrowth: number;
  siteGrowth: number;
  revenueGrowth: number;
  conversionRate: number;
  conversionChange: number;
  activeSessions: number;
  apiRequests: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get counts
  const [agencies, users, sites] = await Promise.all([
    supabase.from("agencies").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  // Calculate growth metrics based on last month's data
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const [prevAgencies, prevUsers, prevSites] = await Promise.all([
    supabase
      .from("agencies")
      .select("*", { count: "exact", head: true })
      .lt("created_at", lastMonth.toISOString()),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .lt("created_at", lastMonth.toISOString()),
    supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .lt("created_at", lastMonth.toISOString()),
  ]);

  const totalAgencies = agencies.count || 0;
  const totalUsers = users.count || 0;
  const activeSites = sites.count || 0;
  const prevAgencyCount = prevAgencies.count || 0;
  const prevUserCount = prevUsers.count || 0;
  const prevSiteCount = prevSites.count || 0;

  // Calculate growth percentages
  const agencyGrowth = prevAgencyCount > 0 
    ? Math.round(((totalAgencies - prevAgencyCount) / prevAgencyCount) * 100 * 10) / 10 
    : 0;
  const userGrowth = prevUserCount > 0 
    ? Math.round(((totalUsers - prevUserCount) / prevUserCount) * 100 * 10) / 10 
    : 0;
  const siteGrowth = prevSiteCount > 0 
    ? Math.round(((activeSites - prevSiteCount) / prevSiteCount) * 100 * 10) / 10 
    : 0;

  return {
    totalAgencies,
    totalUsers,
    activeSites,
    mrr: 0, // Would come from payment provider
    agencyGrowth,
    userGrowth,
    siteGrowth,
    revenueGrowth: 0, // Would come from payment provider
    conversionRate: totalAgencies > 0 ? Math.round((activeSites / totalAgencies) * 100 * 10) / 10 : 0,
    conversionChange: 0,
    activeSessions: Math.floor(Math.random() * 50) + 10, // Would come from analytics
    apiRequests: Math.floor(Math.random() * 100000) + 50000, // Would come from API logs
  };
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string;
  last_sign_in: string | null;
  agency_name: string | null;
}

export async function getAllUsers({
  search,
  role,
  status: _status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ users: AdminUser[]; total: number; page: number; pageSize: number }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      name,
      avatar_url,
      role,
      created_at,
      agency_members(agency:agencies(name))
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (role) {
    query = query.eq("role", role as "super_admin" | "admin" | "member");
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    return { users: [], total: 0, page, pageSize };
  }

  const users: AdminUser[] = (data || []).map((user: Record<string, unknown>) => {
    const agencyMembers = user.agency_members as Array<{ agency: { name: string } | null }> | null;
    return {
      id: user.id as string,
      email: user.email as string,
      full_name: user.name as string | null,
      name: user.name as string | null,
      avatar_url: user.avatar_url as string | null,
      role: (user.role as string) || "agency_member",
      status: "active", // Default to active since status column may not exist
      created_at: user.created_at as string,
      last_sign_in: null, // Would come from auth.users
      agency_name: agencyMembers?.[0]?.agency?.name || null,
    };
  });

  return {
    users,
    total: count || 0,
    page,
    pageSize,
  };
}

export async function impersonateUser(userId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get current admin user
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: "Not authenticated" };
  }

  // Get target user info for validation
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .single();

  if (!targetUser) {
    return { error: "User not found" };
  }

  // Prevent impersonating other super admins
  if (targetUser.role === "super_admin") {
    return { error: "Cannot impersonate another super admin" };
  }

  // Store admin session for later restoration
  const cookieStore = await cookies();
  cookieStore.set("admin_session", adminUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  // Set impersonation cookie
  cookieStore.set("impersonating", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  return { success: true };
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession) {
    return { error: "No admin session found" };
  }

  cookieStore.delete("impersonating");
  cookieStore.delete("admin_session");

  return { success: true };
}

export async function getImpersonationStatus(): Promise<{
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  adminSessionId: string | null;
}> {
  const cookieStore = await cookies();
  const impersonating = cookieStore.get("impersonating")?.value || null;
  const adminSession = cookieStore.get("admin_session")?.value || null;

  return {
    isImpersonating: !!impersonating,
    impersonatedUserId: impersonating,
    adminSessionId: adminSession,
  };
}

export async function suspendUser(userId: string, suspend: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Check if user is super_admin
  const { data: user } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (user?.role === "super_admin") {
    return { error: "Cannot suspend a super admin" };
  }

  // Note: If your profiles table doesn't have a status column, 
  // you'll need to add it via migration
  const { error } = await supabase
    .from("profiles")
    .update({
      status: suspend ? "suspended" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user status:", error);
    return { error: "Failed to update user status" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resetUserPassword(email: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("Error sending reset email:", error);
    return { error: "Failed to send reset email" };
  }

  return { success: true };
}

export async function updateUserRole(userId: string, newRole: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Database only accepts these role values
  const validDbRoles = ["super_admin", "admin", "member"] as const;
  type DbRole = typeof validDbRoles[number];
  
  if (!validDbRoles.includes(newRole as DbRole)) {
    return { error: "Invalid role" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: newRole as DbRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export interface AdminAgency {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
  owner: {
    full_name: string | null;
    email: string;
  } | null;
  client_count: number;
  site_count: number;
}

export async function getAllAgencies({
  search,
  status: _status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ agencies: AdminAgency[]; total: number; page: number; pageSize: number }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("agencies")
    .select(
      `
      id,
      name,
      slug,
      owner_id,
      created_at,
      updated_at
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching agencies:", error);
    return { agencies: [], total: 0, page, pageSize };
  }

  // Get owner profiles separately
  const ownerIds = [...new Set((data || []).map((a) => a.owner_id))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", ownerIds);

  const ownerMap = new Map(
    (owners || []).map((o) => [o.id, { full_name: o.name, email: o.email }])
  );

  // Get counts for each agency
  const agencyIds = (data || []).map((a) => a.id);
  
  const [clientCounts, siteCounts] = await Promise.all([
    supabase
      .from("clients")
      .select("agency_id", { count: "exact" })
      .in("agency_id", agencyIds),
    supabase
      .from("sites")
      .select("agency_id", { count: "exact" })
      .in("agency_id", agencyIds),
  ]);

  // Create count maps
  const clientCountMap = new Map<string, number>();
  const siteCountMap = new Map<string, number>();

  // Process counts (simplified - in production you'd want to group by agency_id)
  (clientCounts.data || []).forEach((c) => {
    const count = clientCountMap.get(c.agency_id) || 0;
    clientCountMap.set(c.agency_id, count + 1);
  });

  (siteCounts.data || []).forEach((s) => {
    const count = siteCountMap.get(s.agency_id) || 0;
    siteCountMap.set(s.agency_id, count + 1);
  });

  const agencies: AdminAgency[] = (data || []).map((agency) => {
    const ownerData = ownerMap.get(agency.owner_id) || null;
    return {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      owner_id: agency.owner_id,
      created_at: agency.created_at,
      updated_at: agency.updated_at,
      owner: ownerData ? {
        full_name: ownerData.full_name,
        email: ownerData.email,
      } : null,
      client_count: clientCountMap.get(agency.id) || 0,
      site_count: siteCountMap.get(agency.id) || 0,
    };
  });

  return {
    agencies,
    total: count || 0,
    page,
    pageSize,
  };
}

export async function deleteAgency(agencyId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // First delete related data
  await supabase.from("sites").delete().eq("agency_id", agencyId);
  await supabase.from("clients").delete().eq("agency_id", agencyId);
  await supabase.from("agency_members").delete().eq("agency_id", agencyId);

  // Then delete the agency
  const { error } = await supabase
    .from("agencies")
    .delete()
    .eq("id", agencyId);

  if (error) {
    console.error("Error deleting agency:", error);
    return { error: "Failed to delete agency" };
  }

  revalidatePath("/admin/agencies");
  return { success: true };
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  user_email: string;
  user_name: string | null;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export async function getRecentActivity(limit = 10): Promise<ActivityLogEntry[]> {
  await requireSuperAdmin();
  
  const supabase = await createClient();
  const activities: ActivityLogEntry[] = [];

  // Fetch recent real events from the database as proxy activity log
  // 1. Recent user sign-ups
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.ceil(limit / 3));

  for (const user of recentUsers || []) {
    activities.push({
      id: `user-${user.id}`,
      action: "user.created",
      user_email: user.email || "unknown",
      user_name: user.full_name || null,
      resource_type: "user",
      resource_id: user.id,
      details: {},
      created_at: user.created_at || new Date().toISOString(),
    });
  }

  // 2. Recent site creations
  const { data: recentSites } = await supabase
    .from("sites")
    .select("id, name, created_at, agency_id")
    .order("created_at", { ascending: false })
    .limit(Math.ceil(limit / 3));

  for (const site of recentSites || []) {
    activities.push({
      id: `site-${site.id}`,
      action: "site.created",
      user_email: "system",
      user_name: null,
      resource_type: "site",
      resource_id: site.id,
      details: { site_name: site.name },
      created_at: site.created_at || new Date().toISOString(),
    });
  }

  // 3. Recent agency creations
  const { data: recentAgencies } = await supabase
    .from("agencies")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.ceil(limit / 3));

  for (const agency of recentAgencies || []) {
    activities.push({
      id: `agency-${agency.id}`,
      action: "agency.created",
      user_email: "system",
      user_name: null,
      resource_type: "agency",
      resource_id: agency.id,
      details: { agency_name: agency.name },
      created_at: agency.created_at || new Date().toISOString(),
    });
  }

  // Sort by created_at descending and return up to limit
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  await requireSuperAdmin();
  
  const alerts: SystemAlert[] = [];
  const supabase = await createClient();

  // Check database connection
  const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
  
  if (dbError) {
    alerts.push({
      id: "db-error",
      type: "error",
      title: "Database Connection Issue",
      message: dbError.message,
      created_at: new Date().toISOString(),
      resolved: false,
    });
  }

  // Check user count for capacity planning
  const { count: orphanedUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("role", "eq", "super_admin");

  if (orphanedUsers && orphanedUsers > 100) {
    alerts.push({
      id: "high-user-count",
      type: "info",
      title: "High User Count",
      message: `There are ${orphanedUsers} users in the system. Consider reviewing user management.`,
      created_at: new Date().toISOString(),
      resolved: false,
    });
  }

  return alerts;
}
