"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface AskChikoSettings {
  siteId: string;
  isEnabled: boolean;
  tone: "professional" | "friendly" | "casual";
  customInstructions: string;
  allowedDataSources: string[];
  monthlyMessageQuota: number;
}

export async function getAskChikoSettings(
  siteId: string,
): Promise<AskChikoSettings> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mod_ask_chiko_settings" as any)
    .select(
      "is_enabled, tone, custom_instructions, allowed_data_sources, monthly_message_quota",
    )
    .eq("site_id", siteId)
    .maybeSingle();

  if (!data) {
    return {
      siteId,
      isEnabled: true,
      tone: "professional",
      customInstructions: "",
      allowedDataSources: [
        "products",
        "orders",
        "bookings",
        "customers",
        "invoices",
        "analytics",
      ],
      monthlyMessageQuota: 1000,
    };
  }

  const row = data as Record<string, any>;
  return {
    siteId,
    isEnabled: row.is_enabled ?? true,
    tone: row.tone ?? "professional",
    customInstructions: row.custom_instructions ?? "",
    allowedDataSources: row.allowed_data_sources ?? [
      "products",
      "orders",
      "bookings",
      "customers",
      "invoices",
      "analytics",
    ],
    monthlyMessageQuota: row.monthly_message_quota ?? 1000,
  };
}

export async function saveAskChikoSettings(
  siteId: string,
  settings: Omit<AskChikoSettings, "siteId">,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate tone
    const validTones = ["professional", "friendly", "casual"];
    if (!validTones.includes(settings.tone)) {
      return { success: false, error: "Invalid tone value." };
    }

    // Validate quota
    if (
      settings.monthlyMessageQuota < 0 ||
      settings.monthlyMessageQuota > 100000
    ) {
      return {
        success: false,
        error: "Monthly quota must be between 0 and 100,000.",
      };
    }

    // Validate data sources
    const validSources = [
      "products",
      "orders",
      "bookings",
      "customers",
      "invoices",
      "analytics",
      "marketing",
    ];
    const sources = settings.allowedDataSources.filter((s) =>
      validSources.includes(s),
    );

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("mod_ask_chiko_settings" as any)
      .upsert(
        {
          site_id: siteId,
          is_enabled: settings.isEnabled,
          tone: settings.tone,
          custom_instructions: settings.customInstructions?.slice(0, 2000) || null,
          allowed_data_sources: sources,
          monthly_message_quota: settings.monthlyMessageQuota,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "site_id" },
      );

    if (error) {
      console.error("[ask-chiko-settings] save error:", error);
      return { success: false, error: "Failed to save settings." };
    }

    revalidatePath(`/dashboard/sites/${siteId}/ask-chiko`);
    return { success: true };
  } catch (err) {
    console.error("[ask-chiko-settings] unexpected error:", err);
    return { success: false, error: "Unexpected error saving settings." };
  }
}
