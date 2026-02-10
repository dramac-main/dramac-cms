import { createClient } from "@supabase/supabase-js";
import type { ActivityLogEntry, ActivityLogEntryWithUser } from "@/types/notifications";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LogActivityOptions {
  agencyId: string;
  userId: string;
  action: string;
  resourceType: "site" | "client" | "page" | "team" | "billing" | "settings";
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(
  options: LogActivityOptions
): Promise<ActivityLogEntry | null> {
  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .insert({
      agency_id: options.agencyId,
      user_id: options.userId,
      action: options.action,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      resource_name: options.resourceName,
      details: options.details,
      ip_address: options.ipAddress,
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging activity:", error);
    return null;
  }

  return {
    ...data,
    user_name: "Unknown",
  };
}

export async function getAgencyActivity(
  agencyId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ActivityLogEntry[]> {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select(
      `
      *,
      user:profiles(full_name, avatar_url)
    `
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching activity:", error);
    return [];
  }

  return (data as ActivityLogEntryWithUser[]).map((entry) => ({
    ...entry,
    user_name: entry.user?.full_name || "Unknown",
    user_avatar: entry.user?.avatar_url || undefined,
  }));
}

export async function getUserActivity(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ActivityLogEntry[]> {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select(
      `
      *,
      user:profiles(full_name, avatar_url)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching user activity:", error);
    return [];
  }

  return (data as ActivityLogEntryWithUser[]).map((entry) => ({
    ...entry,
    user_name: entry.user?.full_name || "Unknown",
    user_avatar: entry.user?.avatar_url || undefined,
  }));
}

// Action labels for display
export const actionLabels: Record<string, string> = {
  "site.created": "created a new site",
  "site.updated": "updated site",
  "site.deleted": "deleted site",
  "site.published": "published site",
  "site.unpublished": "unpublished site",
  "client.created": "added a new client",
  "client.updated": "updated client",
  "client.deleted": "removed client",
  "client.activated": "activated client",
  "client.deactivated": "deactivated client",
  "team.invited": "invited a team member",
  "team.joined": "joined the team",
  "team.left": "left the team",
  "team.removed": "removed a team member",
  "team.role_changed": "changed team member role",
  "page.created": "created a new page",
  "page.updated": "updated page",
  "page.deleted": "deleted page",
  "page.duplicated": "duplicated page",
  "settings.updated": "updated settings",
  "settings.branding_updated": "updated branding",
  "billing.plan_changed": "changed subscription plan",
  "billing.payment_method_updated": "updated payment method",
  "billing.subscription_cancelled": "cancelled subscription",
};

// Resource type icons for display (Lucide icon names)
export const resourceTypeIcons: Record<string, string> = {
  site: "Globe",
  client: "User",
  page: "File",
  team: "Users",
  billing: "CreditCard",
  settings: "Settings",
};
