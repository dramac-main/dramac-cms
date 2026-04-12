import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Seed default marketing settings when the marketing module is first installed for a site.
 * Follows the same pattern as seedDefaultDepartments for live-chat.
 */
export async function seedMarketingSettings(siteId: string): Promise<void> {
  const supabase = createAdminClient();

  // Check if settings already exist for this site
  const { count } = await (supabase as any)
    .from("mod_mktmod01_settings")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId);

  if ((count || 0) > 0) return; // Already seeded

  await (supabase as any).from("mod_mktmod01_settings").insert({
    site_id: siteId,
    sending_quota_daily: 1000,
    sending_quota_monthly: 25000,
    double_opt_in_enabled: false,
    auto_clean_bounces: true,
    auto_clean_complaints: true,
    gdpr_enabled: false,
    timezone: "Africa/Lusaka",
    metadata: {},
  });

  console.log(`[Marketing] Default settings seeded for site ${siteId}`);
}
