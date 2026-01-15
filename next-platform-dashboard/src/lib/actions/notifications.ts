"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface NotificationPreferences {
  email_marketing: boolean;
  email_security: boolean;
  email_updates: boolean;
  email_team: boolean;
  email_billing: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_marketing: false,
  email_security: true,
  email_updates: true,
  email_team: true,
  email_billing: true,
};

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  // Since we don't have a dedicated notification_preferences table,
  // we return default preferences. In production, this could be stored
  // in a JSON column on the profiles table or a separate table.
  // For now, preferences are managed client-side with localStorage fallback.
  return defaultPreferences;
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences
) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  // In a production environment, you would:
  // 1. Create a notification_preferences table
  // 2. Or store preferences in a JSON column on profiles
  // For now, we acknowledge the preferences and return success
  // The UI will maintain state client-side
  
  console.log("Notification preferences updated for user:", user.id, preferences);

  revalidatePath("/settings/notifications");
  return { success: true };
}
