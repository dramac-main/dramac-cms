"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminSettingsMap = Record<string, Record<string, unknown>>;

/**
 * Load all admin settings from the admin_settings table.
 * Returns a map of key -> value (JSONB parsed).
 */
export async function loadAdminSettings(): Promise<AdminSettingsMap> {
  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin_settings table not in generated types
    const { data, error } = await (supabase as any)
      .from("admin_settings")
      .select("key, value");

    if (error) {
      console.error("[admin-settings] Failed to load settings:", error.message);
      return {};
    }

    const map: AdminSettingsMap = {};
    for (const row of data ?? []) {
      map[row.key] = row.value;
    }
    return map;
  } catch (err) {
    console.error("[admin-settings] Error loading settings:", err);
    return {};
  }
}

/**
 * Save a single settings section to the admin_settings table.
 * Uses upsert (insert ... on conflict update).
 */
export async function saveAdminSetting(
  key: string,
  value: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin_settings table not in generated types
    const { error } = await (supabase as any)
      .from("admin_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[admin-settings] Failed to save setting:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[admin-settings] Error saving setting:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
