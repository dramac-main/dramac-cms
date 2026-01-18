"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string | null;
}

export type AuditAction = 
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.role_changed"
  | "user.impersonated"
  | "agency.created"
  | "agency.updated"
  | "agency.deleted"
  | "agency.suspended"
  | "site.created"
  | "site.published"
  | "site.unpublished"
  | "site.deleted"
  | "module.installed"
  | "module.uninstalled"
  | "subscription.created"
  | "subscription.cancelled"
  | "payment.received"
  | "payment.failed"
  | "settings.updated"
  | "admin.login"
  | "admin.logout";

export async function logAuditAction(
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  // Note: This requires an audit_logs table to be created
  // For now, we'll just log to console
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    action,
    userId: user.id,
    userEmail: profile?.email || user.email || "",
    userName: profile?.name || null,
    resourceType,
    resourceId,
    details,
    ipAddress: null, // Would need to be passed from request headers
    createdAt: new Date().toISOString(),
  };

  console.log("[Audit]", JSON.stringify(entry));

  // When audit_logs table exists:
  // await supabase.from("audit_logs").insert(entry);
}

export async function getAuditLogs(options: {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  await requireSuperAdmin();
  const supabase = await createClient();
  
  // If audit_logs table doesn't exist, return mock data based on recent activity
  const { page = 1, limit = 50 } = options;

  // Get recent profiles for user activity
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.floor(limit / 3));

  // Get recent agencies
  const { data: recentAgencies } = await supabase
    .from("agencies")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.floor(limit / 3));

  // Get recent sites
  const { data: recentSites } = await supabase
    .from("sites")
    .select("id, name, created_at, published")
    .order("created_at", { ascending: false })
    .limit(Math.floor(limit / 3));

  const logs: AuditLogEntry[] = [];

  // Build mock audit logs from actual data
  recentProfiles?.forEach((profile) => {
    logs.push({
      id: `user-created-${profile.id}`,
      action: "user.created",
      userId: profile.id,
      userEmail: profile.email,
      userName: profile.name,
      resourceType: "user",
      resourceId: profile.id,
      details: { email: profile.email },
      ipAddress: null,
      createdAt: profile.created_at,
    });
  });

  recentAgencies?.forEach((agency) => {
    logs.push({
      id: `agency-created-${agency.id}`,
      action: "agency.created",
      userId: agency.owner_id,
      userEmail: "unknown",
      userName: null,
      resourceType: "agency",
      resourceId: agency.id,
      details: { name: agency.name },
      ipAddress: null,
      createdAt: agency.created_at,
    });
  });

  recentSites?.forEach((site) => {
    const action = site.published ? "site.published" : "site.created";
    logs.push({
      id: `site-${action}-${site.id}`,
      action,
      userId: "",
      userEmail: "unknown",
      userName: null,
      resourceType: "site",
      resourceId: site.id,
      details: { name: site.name, published: site.published },
      ipAddress: null,
      createdAt: site.created_at,
    });
  });

  // Sort by timestamp
  const sortedLogs = logs.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const offset = (page - 1) * limit;
  const paginatedLogs = sortedLogs.slice(offset, offset + limit);

  return {
    logs: paginatedLogs,
    total: sortedLogs.length,
  };
}

export async function getAuditLogsByUser(
  userId: string,
  limit = 20
): Promise<AuditLogEntry[]> {
  await requireSuperAdmin();
  
  // When audit_logs table exists, query by user_id
  // For now, return empty array
  return [];
}

export async function getAuditLogsByResource(
  resourceType: string,
  resourceId: string,
  limit = 20
): Promise<AuditLogEntry[]> {
  await requireSuperAdmin();
  
  // When audit_logs table exists, query by resource
  // For now, return empty array
  return [];
}
