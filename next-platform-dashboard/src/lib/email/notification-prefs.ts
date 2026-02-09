/**
 * Notification Preferences Check
 * 
 * Phase WL-02: Before sending any email, check if the user has opted out.
 * Maps email types to notification preference categories.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailType } from "./email-types";
import type { NotificationPreferences } from "@/types/notifications";

/**
 * Map email types to preference categories.
 * If an email type is not in this map, it's always sent (e.g., password reset).
 */
const EMAIL_TYPE_TO_PREF_CATEGORY: Partial<
  Record<EmailType, keyof Pick<NotificationPreferences, 
    "email_marketing" | "email_security" | "email_updates" | "email_team" | "email_billing"
  >>
> = {
  // Always sent (not in map): password_reset, email_changed
  welcome: "email_updates",
  team_invitation: "email_team",
  team_member_joined: "email_team",
  site_published: "email_updates",
  domain_connected: "email_updates",
  subscription_created: "email_billing",
  payment_failed: "email_billing",
  trial_ending: "email_billing",
  booking_confirmation_customer: "email_updates",
  booking_confirmation_owner: "email_updates",
  booking_cancelled_customer: "email_updates",
  booking_cancelled_owner: "email_updates",
  order_confirmation_customer: "email_updates",
  order_confirmation_owner: "email_updates",
  order_shipped_customer: "email_updates",
  form_submission_owner: "email_updates",
};

/**
 * Check if a user has opted out of a specific email type.
 * 
 * @returns true if email should be sent, false if user opted out
 */
export async function shouldSendEmail(
  userId: string,
  emailType: EmailType
): Promise<boolean> {
  const prefCategory = EMAIL_TYPE_TO_PREF_CATEGORY[emailType];
  
  // If no preference category mapped, always send (critical/security emails)
  if (!prefCategory) {
    return true;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("email_marketing, email_security, email_updates, email_team, email_billing")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // No preferences set = default to sending
      return true;
    }

    // Check the specific preference
    return (data as Record<string, boolean | null>)[prefCategory] !== false;
  } catch {
    // On error, default to sending
    return true;
  }
}
