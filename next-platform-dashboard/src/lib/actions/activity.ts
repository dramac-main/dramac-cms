"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityLogEntry, ActivityLogEntryWithUser } from "@/types/notifications";

interface GetActivityOptions {
  limit?: number;
  offset?: number;
}

export async function getAgencyActivityAction(
  agencyId: string,
  options: GetActivityOptions = {}
): Promise<ActivityLogEntry[]> {
  const { limit = 50, offset = 0 } = options;
  const supabase = await createClient();

  // Verify user has access to this agency
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Check if user belongs to this agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.agency_id !== agencyId) {
    return [];
  }

  // Fetch activity
  const { data, error } = await supabase
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

export async function logActivityAction(options: {
  action: string;
  resourceType: "site" | "client" | "page" | "team" | "billing" | "settings";
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, string | number | boolean | null>;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    return { success: false, error: "No agency found" };
  }

  const { error } = await supabase.from("activity_log").insert({
    agency_id: profile.agency_id,
    user_id: user.id,
    action: options.action,
    resource_type: options.resourceType,
    resource_id: options.resourceId,
    resource_name: options.resourceName,
    details: options.details as Record<string, string | number | boolean | null> | undefined,
  });

  if (error) {
    console.error("Error logging activity:", error);
    return { success: false, error: "Failed to log activity" };
  }

  return { success: true };
}
