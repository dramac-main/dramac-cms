"use server";

/**
 * Portal onboarding state — server actions.
 *
 * Tracks per-user progress through the first-run portal checklist.
 * Auto-detects external signals (notifications-enabled, first order
 * seen) where possible so the user doesn't have to tick every box.
 */

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortalAuth } from "@/lib/portal/portal-auth";

export interface OnboardingState {
  profile_confirmed: boolean;
  notifications_enabled: boolean;
  app_installed: boolean;
  team_invited: boolean;
  first_order_seen: boolean;
  payments_setup: boolean;
  dismissed: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  profile_confirmed: false,
  notifications_enabled: false,
  app_installed: false,
  team_invited: false,
  first_order_seen: false,
  payments_setup: false,
  dismissed: false,
};

export type OnboardingFlag = keyof Omit<OnboardingState, "dismissed">;

/**
 * Load the user's onboarding row, auto-detecting derived signals from
 * other tables when they aren't explicitly set yet.
 */
export async function loadOnboardingState(): Promise<{
  state: OnboardingState;
  totalSteps: number;
  completedSteps: number;
}> {
  const user = await requirePortalAuth();
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("portal_onboarding_state" as never)
    .select(
      "profile_confirmed, notifications_enabled, app_installed, team_invited, first_order_seen, payments_setup, dismissed",
    )
    .eq("user_id" as never, user.userId)
    .maybeSingle();

  const stored = (row as Partial<OnboardingState> | null) ?? {};
  const state: OnboardingState = { ...DEFAULT_STATE, ...stored };

  // Derived signal: any subscribed channel via portal_notification_preferences?
  if (!state.notifications_enabled) {
    const { data: prefs } = await admin
      .from("portal_notification_preferences")
      .select("category")
      .eq("user_id" as never, user.userId)
      .limit(1);
    if (prefs && prefs.length > 0) state.notifications_enabled = true;
  }

  // Derived signal: any order at all on a site this user can access?
  if (!state.first_order_seen && user.clientId) {
    const { data: client } = await admin
      .from("clients")
      .select("id")
      .eq("id", user.clientId)
      .maybeSingle();
    if (client) {
      const { data: orders } = await admin
        .from("mod_ecom_orders")
        .select("id")
        .limit(1);
      if (orders && orders.length > 0) state.first_order_seen = true;
    }
  }

  const flags: OnboardingFlag[] = [
    "profile_confirmed",
    "notifications_enabled",
    "app_installed",
    "team_invited",
    "first_order_seen",
    "payments_setup",
  ];
  const completedSteps = flags.filter((f) => state[f]).length;

  return { state, totalSteps: flags.length, completedSteps };
}

export async function setOnboardingFlag(
  flag: OnboardingFlag,
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requirePortalAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("portal_onboarding_state" as never)
    .upsert(
      {
        user_id: user.userId,
        [flag]: value,
      } as never,
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal");
  return { ok: true };
}

export async function dismissOnboarding(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await requirePortalAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("portal_onboarding_state" as never)
    .upsert(
      { user_id: user.userId, dismissed: true } as never,
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal");
  return { ok: true };
}
